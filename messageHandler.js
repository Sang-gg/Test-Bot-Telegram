import { CONFIG } from './config.js';
import { getAIResponse } from './aiClients.js';
import { formatAIResponse, generateProgressMessage } from './ui.js';
import { 
  getContext, 
  setContext, 
  getUserPreferences,
  getUserQuota,
  setUserQuota,
  getKey
} from './kvStorage.js';

// Main message handler
export async function handleMessage(message, { chatId, userId, env }) {
  // Check authentication
  const keyData = await getKey(userId, env);
  if (!keyData || !keyData.isActive) {
    return {
      text: formatAIResponse(
        'Xin lỗi, bạn cần xác thực trước khi sử dụng bot.\nDùng lệnh /key <mã> để xác thực nhé!',
        'normal'
      )
    };
  }

  // Check quota
  const quota = await getUserQuota(userId, env);
  if (quota <= 0) {
    return {
      text: formatAIResponse(
        'Bạn đã dùng hết quota hôm nay rồi!\nQuota sẽ reset lúc 00:00 UTC nhé.',
        'normal'
      )
    };
  }

  try {
    let response;

    switch (message.type) {
      case 'text':
        response = await handleTextMessage(message.data, userId, env);
        break;
      case 'photo':
        response = await handlePhotoMessage(message.data, userId, env);
        break;
      case 'document':
        response = await handleDocumentMessage(message.data, userId, env);
        break;
      default:
        return {
          text: formatAIResponse(
            'Xin lỗi, tôi chưa hỗ trợ loại tin nhắn này.',
            'normal'
          )
        };
    }

    // Decrease quota
    await setUserQuota(userId, quota - 1, env);

    return response;

  } catch (error) {
    console.error('Message handling error:', error);
    return {
      text: formatAIResponse(
        'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau!\nError: ' + error.message,
        'normal'
      )
    };
  }
}

// Handle text messages
async function handleTextMessage(text, userId, env) {
  // Get user preferences
  const prefs = await getUserPreferences(userId, env);
  const { model = 'chatgpt', style = 'normal' } = prefs;

  // Get conversation context
  const context = await getContext(userId, env);

  // Add new message to context
  const updatedContext = [
    ...context.slice(-4), // Keep last 4 messages
    { role: 'user', content: text }
  ];

  // Get AI response
  const aiResponse = await getAIResponse(
    text,
    style,
    model,
    env
  );

  // Add AI response to context
  updatedContext.push({
    role: 'assistant',
    content: aiResponse.text
  });

  // Save updated context
  await setContext(userId, updatedContext, env);

  // Format response with style
  return {
    text: formatAIResponse(aiResponse.text, style)
  };
}

// Handle photo messages
async function handlePhotoMessage(photo, userId, env) {
  // Get user preferences
  const prefs = await getUserPreferences(userId, env);
  const { style = 'normal' } = prefs;

  // Return immediate response for long processing
  return {
    text: generateProgressMessage('image')
  };
}

// Handle document messages
async function handleDocumentMessage(document, userId, env) {
  // Check file size
  if (document.file_size > CONFIG.MAX_FILE_SIZE) {
    return {
      text: formatAIResponse(
        'Xin lỗi, file quá lớn (>10MB). Vui lòng gửi file nhỏ hơn!',
        'normal'
      )
    };
  }

  // Get user preferences
  const prefs = await getUserPreferences(userId, env);
  const { style = 'normal' } = prefs;

  // Return immediate response for long processing
  return {
    text: generateProgressMessage('document')
  };
}

// Export message handler
export { };