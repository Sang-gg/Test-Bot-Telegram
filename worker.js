import { CONFIG, validateConfig, getTelegramApiUrl } from './config.js';
import { handleCommand } from './commands.js';
import { handleMessage } from './messageHandler.js';
import { logError } from './kvStorage.js';

// Initialize Durable Object for long-running tasks
export { ChatProcessor } from './durableObject.js';

// Main worker event handler
export default {
  async fetch(request, env, ctx) {
    try {
      // Validate configuration on startup
      validateConfig();

      // Only accept POST requests from Telegram
      if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
      }

      // Parse the incoming webhook data
      const data = await request.json();
      
      // Skip if no message data
      if (!data.message) {
        return new Response('OK', { status: 200 });
      }

      // Extract message details
      const {
        message: {
          message_id,
          chat: { id: chatId },
          from: { id: userId },
          text,
          document,
          photo,
          date
        }
      } = data;

      // Start typing indicator for user feedback
      const startTime = Date.now();
      let typingIndicatorSent = false;

      // Function to send typing indicator if processing takes too long
      const sendTypingIndicator = async () => {
        if (Date.now() - startTime > CONFIG.TYPING_INDICATOR_THRESHOLD && !typingIndicatorSent) {
          typingIndicatorSent = true;
          await fetch(getTelegramApiUrl('sendChatAction'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              action: 'typing'
            })
          });
        }
      };

      // Set up periodic typing indicator check
      const typingInterval = setInterval(sendTypingIndicator, 100);

      try {
        let response;

        // Handle commands (messages starting with '/')
        if (text && text.startsWith('/')) {
          const command = text.split(' ')[0].substring(1);
          const args = text.split(' ').slice(1).join(' ');
          response = await handleCommand(command, args, { chatId, userId, env });
        }
        // Handle document uploads
        else if (document) {
          // For large files, use Durable Object
          if (document.file_size > CONFIG.ASYNC_PROCESSING_THRESHOLD) {
            const processorId = env.CHAT_PROCESSOR.newUniqueId();
            const processor = env.CHAT_PROCESSOR.get(processorId);
            
            // Send immediate response
            await fetch(getTelegramApiUrl('sendMessage'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                text: 'Đang xử lý, chờ chút nha! 📝',
                parse_mode: 'HTML'
              })
            });

            // Process document asynchronously
            ctx.waitUntil(processor.fetch('http://process-document', {
              method: 'POST',
              body: JSON.stringify({ chatId, userId, document, env })
            }));

            return new Response('OK', { status: 200 });
          } else {
            response = await handleMessage({ type: 'document', data: document }, { chatId, userId, env });
          }
        }
        // Handle photo uploads
        else if (photo) {
          response = await handleMessage({ type: 'photo', data: photo }, { chatId, userId, env });
        }
        // Handle regular text messages
        else if (text) {
          response = await handleMessage({ type: 'text', data: text }, { chatId, userId, env });
        }

        // Clear typing indicator interval
        clearInterval(typingInterval);

        // Send response to user
        if (response) {
          await fetch(getTelegramApiUrl('sendMessage'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: response.text,
              parse_mode: 'HTML',
              reply_markup: response.reply_markup
            })
          });
        }

        return new Response('OK', { status: 200 });

      } catch (error) {
        // Log error and send user-friendly message
        await logError({
          timestamp: new Date().toISOString(),
          userId,
          command: text || 'non-text-message',
          errorMessage: error.message,
          api: 'telegram-webhook'
        }, env);

        // Clear typing indicator interval
        clearInterval(typingInterval);

        // Send error message to user
        await fetch(getTelegramApiUrl('sendMessage'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau nhé! 🙏',
            parse_mode: 'HTML'
          })
        });

        return new Response('Error handled', { status: 200 });
      }

    } catch (error) {
      // Handle critical errors
      console.error('Critical error:', error);
      return new Response('Internal server error', { status: 500 });
    }
  }
};

// Cron trigger handler for periodic tasks
export async function scheduled(event, env, ctx) {
  try {
    const tasks = {
      '0 0 * * *': async () => {
        // Reset daily quotas at midnight UTC
        // Implementation in cron.js
        const { resetDailyQuotas } = await import('./cron.js');
        await resetDailyQuotas(env);
      },
      '*/30 * * * *': async () => {
        // Clean up expired contexts and inactive keys every 30 minutes
        // Implementation in cron.js
        const { cleanupExpiredData } = await import('./cron.js');
        await cleanupExpiredData(env);
      },
      '0 * * * *': async () => {
        // Backup error logs and quota data hourly
        // Implementation in cron.js
        const { backupData } = await import('./cron.js');
        await backupData(env);
      }
    };

    // Execute matching cron tasks
    const matchingTasks = Object.entries(tasks)
      .filter(([pattern]) => event.cron.includes(pattern))
      .map(([, task]) => task());

    await Promise.all(matchingTasks);

  } catch (error) {
    // Log cron job errors
    console.error('Cron job error:', error);
    await logError({
      timestamp: new Date().toISOString(),
      userId: 'SYSTEM',
      command: 'cron-job',
      errorMessage: error.message,
      api: 'cron-trigger'
    }, env);
  }
}