import { CONFIG, getTelegramApiUrl } from './config.js';
import { getKey, setKey, listKeys, getUserQuota, setUserQuota } from './kvStorage.js';
import { generateInlineKeyboard, formatMessage } from './ui.js';
import { searchWeb } from './aiClients.js';

// Command handler mapping
const COMMANDS = {
  'start': handleStart,
  'key': handleKey,
  'genkey': handleGenKey,
  'listkeys': handleListKeys,
  'errorlog': handleErrorLog,
  'setmenu': handleSetMenu,
  'setmodel': handleSetModel,
  'setstyle': handleSetStyle,
  'search': handleSearch,
  'clear': handleClear,
  'check': handleCheck,
  'info': handleInfo,
  'help': handleHelp
};

// Main command handler
export async function handleCommand(command, args, { chatId, userId, env }) {
  const handler = COMMANDS[command];
  if (!handler) {
    return {
      text: formatMessage({
        title: '❌ Lệnh không hợp lệ',
        content: 'Sử dụng /help để xem danh sách lệnh nhé!',
        style: 'error'
      })
    };
  }

  return await handler(args, { chatId, userId, env });
}

// Command handlers
async function handleStart(args, { chatId, userId, env }) {
  const welcomeImage = "https://images.unsplash.com/photo-1533750349088-cd871a92f312";
  
  return {
    text: formatMessage({
      title: '🌟 Chào mừng bạn đến với AI Chat Bot!',
      image: welcomeImage,
      content: `
Mình là bot trò chuyện thông minh, có thể:
• Trò chuyện với nhiều phong cách anime khác nhau
• Phân tích ảnh và tài liệu
• Tìm kiếm thông tin trên web
• Và nhiều tính năng thú vị khác!

Để bắt đầu, hãy:
1. Xác thực bằng lệnh /key <mã>
2. Chọn AI model và phong cách qua /setmenu
3. Bắt đầu trò chuyện!

Xem thêm hướng dẫn với /help nhé!
      `,
      style: 'welcome'
    }),
    reply_markup: generateInlineKeyboard([
      [{ text: '🎭 Chọn Model & Style', callback_data: '/setmenu' }],
      [{ text: '❓ Hướng dẫn', callback_data: '/help' }],
      [{ text: 'ℹ️ Thông tin', callback_data: '/info' }]
    ])
  };
}

async function handleKey(args, { chatId, userId, env }) {
  if (!args) {
    return {
      text: formatMessage({
        title: '❌ Thiếu mã xác thực',
        content: 'Vui lòng nhập mã theo định dạng:\n/key <mã>',
        style: 'error'
      })
    };
  }

  const key = args.trim();
  const keyData = await getKey(userId, env);

  if (keyData && keyData.isActive) {
    return {
      text: formatMessage({
        title: '⚠️ Đã xác thực',
        content: 'Bạn đã xác thực rồi! Dùng /check để xem thông tin nhé.',
        style: 'warning'
      })
    };
  }

  // Validate and activate key
  const isValid = await validateAndActivateKey(key, userId, env);
  if (!isValid) {
    return {
      text: formatMessage({
        title: '❌ Mã không hợp lệ',
        content: 'Vui lòng kiểm tra lại mã xác thực!',
        style: 'error'
      })
    };
  }

  // Initialize user quota
  await setUserQuota(userId, CONFIG.MAX_QUOTA_PER_USER, env);

  return {
    text: formatMessage({
      title: '✅ Xác thực thành công!',
      content: `
Chào mừng bạn đã tham gia!
• Dùng /setmenu để chọn model AI và phong cách
• Gửi tin nhắn để bắt đầu trò chuyện
• Gửi ảnh/tài liệu để phân tích
• Dùng /search để tìm kiếm web
      `,
      style: 'success'
    }),
    reply_markup: generateInlineKeyboard([
      [{ text: '🎭 Chọn Model & Style', callback_data: '/setmenu' }]
    ])
  };
}

async function handleGenKey(args, { chatId, userId, env }) {
  // Verify admin
  if (userId.toString() !== CONFIG.ADMIN_CHAT_ID) {
    return {
      text: formatMessage({
        title: '🚫 Không có quyền',
        content: 'Lệnh này chỉ dành cho admin!',
        style: 'error'
      })
    };
  }

  // Generate new key (implementation in kvStorage.js)
  const newKey = await generateNewKey(env);

  return {
    text: formatMessage({
      title: '🔑 Tạo mã mới',
      content: `
Mã mới: <code>${newKey}</code>
• Có hiệu lực 30 ngày từ lần sử dụng đầu tiên
• Tự động vô hiệu sau 30 ngày không dùng
      `,
      style: 'info'
    })
  };
}

async function handleListKeys(args, { chatId, userId, env }) {
  // Verify admin
  if (userId.toString() !== CONFIG.ADMIN_CHAT_ID) {
    return {
      text: formatMessage({
        title: '🚫 Không có quyền',
        content: 'Lệnh này chỉ dành cho admin!',
        style: 'error'
      })
    };
  }

  const keys = await listKeys(env);
  const formattedKeys = keys.map(k => `
• Key: ${k.key}
• User: ${k.userId}
• Created: ${new Date(k.createdDate).toLocaleString()}
• Status: ${k.isActive ? '✅ Active' : '❌ Inactive'}
  `).join('\n');

  return {
    text: formatMessage({
      title: '🔑 Danh sách mã',
      content: formattedKeys || 'Không có mã nào.',
      style: 'info'
    })
  };
}

async function handleErrorLog(args, { chatId, userId, env }) {
  // Verify admin
  if (userId.toString() !== CONFIG.ADMIN_CHAT_ID) {
    return {
      text: formatMessage({
        title: '🚫 Không có quyền',
        content: 'Lệnh này chỉ dành cho admin!',
        style: 'error'
      })
    };
  }

  // Get error logs (implementation in kvStorage.js)
  const logs = await getErrorLogs(env);
  const formattedLogs = logs.map(log => `
• Time: ${new Date(log.timestamp).toLocaleString()}
• User: ${log.userId}
• Command: ${log.command}
• Error: ${log.errorMessage}
• API: ${log.api}
  `).join('\n');

  return {
    text: formatMessage({
      title: '📋 Log lỗi',
      content: formattedLogs || 'Không có lỗi nào.',
      style: 'info'
    })
  };
}

async function handleSetMenu(args, { chatId, userId, env }) {
  // Verify user is authenticated
  const keyData = await getKey(userId, env);
  if (!keyData || !keyData.isActive) {
    return {
      text: formatMessage({
        title: '🔒 Chưa xác thực',
        content: 'Vui lòng xác thực với /key <mã> trước!',
        style: 'error'
      })
    };
  }

  // Generate menu keyboard
  const modelButtons = [
    [
      { text: '🤖 ChatGPT', callback_data: '/setmodel chatgpt' },
      { text: '🧠 Gemini', callback_data: '/setmodel gemini' },
      { text: '🔮 Grok', callback_data: '/setmodel grok' }
    ]
  ];

  const styleButtons = Object.entries(CONFIG.CHAT_STYLES).map(([style, info]) => ({
    text: `${info.emoji} ${style}`,
    callback_data: `/setstyle ${style}`
  }));

  // Split style buttons into rows of 2
  const styleRows = styleButtons.reduce((rows, button, index) => {
    if (index % 2 === 0) rows.push([button]);
    else rows[rows.length - 1].push(button);
    return rows;
  }, []);

  return {
    text: formatMessage({
      title: '⚙️ Cài đặt Bot',
      content: `
Chọn AI Model:
• ChatGPT: Ổn định, đa năng
• Gemini: Nhanh nhẹn, thông minh
• Grok: Mới nhất, có thể tìm web tốttốt

Chọn Phong cách:
• normal: Bình thường, chuyên nghiệp
• tsundere: Tsun tsun~ dere dere~
• yandere: Yêu điên cuồng
• nyandere: Neko kawaii~
• dandere: Nhút nhát dễ thương
• bakadere: Ngốc nghếch vui vẻ
• chuunibyou: Hội chứng tuổi teen
• ojou: Tiểu thư thanh lịch
• senpai: Tiền bối từng trải
• loli: Đáng yêu năng động
• genki: Tràn đầy năng lượng
      `,
      style: 'menu'
    }),
    reply_markup: generateInlineKeyboard([
      ...modelButtons,
      { text: '---', callback_data: 'separator' },
      ...styleRows
    ])
  };
}

async function handleSetModel(args, { chatId, userId, env }) {
  // Verify user is authenticated
  const keyData = await getKey(userId, env);
  if (!keyData || !keyData.isActive) {
    return {
      text: formatMessage({
        title: '🔒 Chưa xác thực',
        content: 'Vui lòng xác thực với /key <mã> trước!',
        style: 'error'
      })
    };
  }

  if (!args || !['chatgpt', 'gemini', 'grok'].includes(args)) {
    return {
      text: formatMessage({
        title: '❌ Model không hợp lệ',
        content: 'Vui lòng chọn: chatgpt, gemini, hoặc grok',
        style: 'error'
      })
    };
  }

  // Save user's model preference (implementation in kvStorage.js)
  await setUserPreference(userId, 'model', args, env);

  const modelEmoji = {
    chatgpt: '🤖',
    gemini: '🧠',
    grok: '🔮'
  };

  return {
    text: formatMessage({
      title: '✅ Đã chọn Model',
      content: `${modelEmoji[args]} Đã chuyển sang model ${args.toUpperCase()}!`,
      style: 'success'
    })
  };
}

async function handleSetStyle(args, { chatId, userId, env }) {
  // Verify user is authenticated
  const keyData = await getKey(userId, env);
  if (!keyData || !keyData.isActive) {
    return {
      text: formatMessage({
        title: '🔒 Chưa xác thực',
        content: 'Vui lòng xác thực với /key <mã> trước!',
        style: 'error'
      })
    };
  }

  if (!args || !CONFIG.CHAT_STYLES[args]) {
    return {
      text: formatMessage({
        title: '❌ Style không hợp lệ',
        content: 'Dùng /setmenu để xem danh sách style nhé!',
        style: 'error'
      })
    };
  }

  // Save user's style preference (implementation in kvStorage.js)
  await setUserPreference(userId, 'style', args, env);

  const { emoji } = CONFIG.CHAT_STYLES[args];

  return {
    text: formatMessage({
      title: '✅ Đã chọn Style',
      content: `${emoji} Đã chuyển sang phong cách ${args}!`,
      style: 'success'
    })
  };
}

async function handleSearch(args, { chatId, userId, env }) {
  // Verify user is authenticated
  const keyData = await getKey(userId, env);
  if (!keyData || !keyData.isActive) {
    return {
      text: formatMessage({
        title: '🔒 Chưa xác thực',
        content: 'Vui lòng xác thực với /key <mã> trước!',
        style: 'error'
      })
    };
  }

  if (!args) {
    return {
      text: formatMessage({
        title: '❌ Thiếu từ khóa',
        content: 'Vui lòng nhập từ khóa tìm kiếm:\n/search <từ khóa>',
        style: 'error'
      })
    };
  }

  // Check quota
  const quota = await getUserQuota(userId, env);
  if (quota <= 0) {
    return {
      text: formatMessage({
        title: '⚠️ Hết quota',
        content: 'Bạn đã dùng hết quota hôm nay rồi!\nQuota sẽ reset lúc 00:00 UTC nhé.',
        style: 'warning'
      })
    };
  }

  // Search web using Grok API
  const searchResult = await searchWeb(args, env);

  // Decrease quota
  await setUserQuota(userId, quota - 1, env);

  return {
    text: formatMessage({
      title: '🔍 Kết quả tìm kiếm',
      content: searchResult,
      style: 'search'
    })
  };
}

async function handleClear(args, { chatId, userId, env }) {
  // Verify user is authenticated
  const keyData = await getKey(userId, env);
  if (!keyData || !keyData.isActive) {
    return {
      text: formatMessage({
        title: '🔒 Chưa xác thực',
        content: 'Vui lòng xác thực với /key <mã> trước!',
        style: 'error'
      })
    };
  }

  // Clear user's conversation context (implementation in kvStorage.js)
  await clearContext(userId, env);

  return {
    text: formatMessage({
      title: '🧹 Đã xóa context',
      content: 'Đã xóa context trò chuyện trước đó!',
      style: 'success'
    })
  };
}

async function handleCheck(args, { chatId, userId, env }) {
  // Get user data
  const keyData = await getKey(userId, env);
  if (!keyData || !keyData.isActive) {
    return {
      text: formatMessage({
        title: '🔒 Chưa xác thực',
        content: 'Vui lòng xác thực với /key <mã> trước!',
        style: 'error'
      })
    };
  }

  const quota = await getUserQuota(userId, env);
  const preferences = await getUserPreferences(userId, env);
  const { model = 'chatgpt', style = 'normal' } = preferences;

  return {
    text: formatMessage({
      title: 'ℹ️ Thông tin người dùng',
      content: `
🆔 User ID: ${userId}
📅 Ngày tạo: ${new Date(keyData.createdDate).toLocaleString()}
🤖 Model: ${model.toUpperCase()}
🎭 Style: ${style} ${CONFIG.CHAT_STYLES[style].emoji}
📊 Quota: ${quota}/${CONFIG.MAX_QUOTA_PER_USER}
⏰ Reset quota: 00:00 UTC
      `,
      style: 'info'
    })
  };
}

async function handleInfo(args, { chatId, userId, env }) {
  return {
    text: formatMessage({
      title: 'ℹ️ Thông tin Bot',
      content: `
🤖 AI Chat Bot
• Hỗ trợ 3 model AI: ChatGPT, Gemini, Grok
• 11 phong cách anime khác nhau
• Phân tích ảnh và tài liệu
• Tìm kiếm thông tin trên web
• Quota: ${CONFIG.MAX_QUOTA_PER_USER} request/ngày

📋 Tính năng:
• Chat với AI theo phong cách anime
• Gửi ảnh để phân tích
• Gửi file để tóm tắt (tối đa 10MB)
• Tìm kiếm web với /search
• Xem thông tin với /check
• Xóa context với /clear

🔧 Phát triển bởi: @SACLB9F
      `,
      style: 'info'
    })
  };
}

async function handleHelp(args, { chatId, userId, env }) {
  // Check if user is admin
  const isAdmin = userId.toString() === CONFIG.ADMIN_CHAT_ID;

  let adminCommands = '';
  if (isAdmin) {
    adminCommands = `
👑 Admin:
• /genkey - Tạo mã xác thực mới
• /listkeys - Xem danh sách mã
• /errorlog - Xem log lỗi
    `;
  }

  return {
    text: formatMessage({
      title: '❓ Hướng dẫn sử dụng',
      content: `
🔑 Xác thực:
• /key <mã> - Kích hoạt bot
• /check - Xem thông tin

⚙️ Cài đặt:
• /setmenu - Menu chọn model/style
• /setmodel <model> - Chọn model AI
• /setstyle <style> - Chọn phong cách

🤖 Chức năng:
• Chat trực tiếp - Trò chuyện với AI
• Gửi ảnh - Phân tích hình ảnh
• Gửi file - Tóm tắt tài liệu
• /search <từ khóa> - Tìm kiếm web
• /clear - Xóa context trò chuyện

ℹ️ Thông tin:
• /info - Thông tin về bot
• /help - Xem hướng dẫn này${adminCommands}
      `,
      style: 'help'
    })
  };
}

// Helper functions
async function validateAndActivateKey(key, userId, env) {
  // Implementation in kvStorage.js
  return true; // Temporary return for example
}

async function generateNewKey(env) {
  // Implementation in kvStorage.js
  return 'NEW-KEY-' + Math.random().toString(36).substring(7);
}

async function getErrorLogs(env) {
  // Implementation in kvStorage.js
  return [];
}

export { };