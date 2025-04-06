import { CONFIG } from './config.js';
import { getTelegramApiUrl } from './config.js';
import { analyzeDocument, analyzeImage } from './aiClients.js';
import { formatFileAnalysis, generateProgressMessage } from './ui.js';
import { logError } from './kvStorage.js';

// ChatProcessor Durable Object class
export class ChatProcessor {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.processingTasks = new Map();
  }

  // Handle incoming requests
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname.slice(1);

    switch (path) {
      case 'process-document':
        return await this.handleDocumentProcessing(request);
      case 'process-image':
        return await this.handleImageProcessing(request);
      case 'status':
        return await this.handleStatusCheck(request);
      default:
        return new Response('Not found', { status: 404 });
    }
  }

  // Handle document processing
  async handleDocumentProcessing(request) {
    try {
      const { chatId, userId, document, env } = await request.json();
      const taskId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Store task information
      this.processingTasks.set(taskId, {
        type: 'document',
        status: 'processing',
        startTime: Date.now(),
        chatId,
        userId
      });

      // Process document asynchronously
      this.processDocument(taskId, document, chatId, userId, env).catch(async error => {
        console.error('Document processing error:', error);
        await this.handleProcessingError(taskId, error, chatId);
      });

      return new Response(JSON.stringify({ taskId }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Document handler error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // Handle image processing
  async handleImageProcessing(request) {
    try {
      const { chatId, userId, photo, env } = await request.json();
      const taskId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Store task information
      this.processingTasks.set(taskId, {
        type: 'image',
        status: 'processing',
        startTime: Date.now(),
        chatId,
        userId
      });

      // Process image asynchronously
      this.processImage(taskId, photo, chatId, userId, env).catch(async error => {
        console.error('Image processing error:', error);
        await this.handleProcessingError(taskId, error, chatId);
      });

      return new Response(JSON.stringify({ taskId }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Image handler error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // Handle status check
  async handleStatusCheck(request) {
    try {
      const { taskId } = await request.json();
      const task = this.processingTasks.get(taskId);

      if (!task) {
        return new Response(JSON.stringify({ error: 'Task not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        status: task.status,
        type: task.type,
        startTime: task.startTime,
        result: task.result
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Status check error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // Process document
  async processDocument(taskId, document, chatId, userId, env) {
    try {
      // Get document file from Telegram
      const fileInfo = await this.getFile(document.file_id, env);
      const fileUrl = `https://api.telegram.org/file/bot${CONFIG.BOT_TOKEN}/${fileInfo.file_path}`;

      // Send processing message
      await this.sendTelegramMessage(chatId, generateProgressMessage('document'));

      // Analyze document
      const analysis = await analyzeDocument(fileUrl, env);

      // Update task status
      this.processingTasks.set(taskId, {
        ...this.processingTasks.get(taskId),
        status: 'completed',
        result: analysis
      });

      // Send result
      await this.sendTelegramMessage(chatId, formatFileAnalysis(analysis));
    } catch (error) {
      throw new Error(`Document processing failed: ${error.message}`);
    }
  }

  // Process image
  async processImage(taskId, photo, chatId, userId, env) {
    try {
      // Get the largest photo size
      const photoSize = photo[photo.length - 1];
      const fileInfo = await this.getFile(photoSize.file_id, env);
      const fileUrl = `https://api.telegram.org/file/bot${CONFIG.BOT_TOKEN}/${fileInfo.file_path}`;

      // Send processing message
      await this.sendTelegramMessage(chatId, generateProgressMessage('image'));

      // Analyze image
      const analysis = await analyzeImage(fileUrl, env);

      // Update task status
      this.processingTasks.set(taskId, {
        ...this.processingTasks.get(taskId),
        status: 'completed',
        result: analysis
      });

      // Send result
      await this.sendTelegramMessage(chatId, formatFileAnalysis(analysis));
    } catch (error) {
      throw new Error(`Image processing failed: ${error.message}`);
    }
  }

  // Handle processing errors
  async handleProcessingError(taskId, error, chatId) {
    // Update task status
    this.processingTasks.set(taskId, {
      ...this.processingTasks.get(taskId),
      status: 'failed',
      error: error.message
    });

    // Log error
    await logError({
      userId: this.processingTasks.get(taskId).userId,
      command: `process-${this.processingTasks.get(taskId).type}`,
      errorMessage: error.message,
      api: 'durable-object'
    }, this.env);

    // Send error message to user
    await this.sendTelegramMessage(chatId, {
      text: 'Xin lỗi, có lỗi xảy ra khi xử lý. Vui lòng thử lại sau! 🙏',
      parse_mode: 'HTML'
    });
  }

  // Helper function to get file information from Telegram
  async getFile(fileId, env) {
    const response = await fetch(getTelegramApiUrl('getFile'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_id: fileId })
    });

    if (!response.ok) {
      throw new Error(`Failed to get file info: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.result;
  }

  // Helper function to send messages via Telegram
  async sendTelegramMessage(chatId, message) {
    const response = await fetch(getTelegramApiUrl('sendMessage'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Cleanup old tasks periodically
  async cleanup() {
    const now = Date.now();
    for (const [taskId, task] of this.processingTasks.entries()) {
      // Remove completed tasks after 1 hour
      if (task.status === 'completed' && now - task.startTime > 3600000) {
        this.processingTasks.delete(taskId);
      }
      // Remove failed tasks after 24 hours
      if (task.status === 'failed' && now - task.startTime > 86400000) {
        this.processingTasks.delete(taskId);
      }
    }
  }
}

// Export the Durable Object class
export default {
  fetch(request, env) {
    return env.CHAT_PROCESSOR.fetch(request);
  }
};