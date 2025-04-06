import { CONFIG } from './config.js';

// Generate inline keyboard for Telegram
export function generateInlineKeyboard(buttons) {
  return {
    inline_keyboard: buttons
  };
}

// Message style configurations
const STYLES = {
  welcome: {
    headerColor: '#4CAF50',
    borderColor: '#81C784',
    backgroundColor: '#E8F5E9'
  },
  error: {
    headerColor: '#F44336',
    borderColor: '#E57373',
    backgroundColor: '#FFEBEE'
  },
  warning: {
    headerColor: '#FF9800',
    borderColor: '#FFB74D',
    backgroundColor: '#FFF3E0'
  },
  success: {
    headerColor: '#4CAF50',
    borderColor: '#81C784',
    backgroundColor: '#E8F5E9'
  },
  info: {
    headerColor: '#2196F3',
    borderColor: '#64B5F6',
    backgroundColor: '#E3F2FD'
  },
  menu: {
    headerColor: '#9C27B0',
    borderColor: '#BA68C8',
    backgroundColor: '#F3E5F5'
  },
  search: {
    headerColor: '#00BCD4',
    borderColor: '#4DD0E1',
    backgroundColor: '#E0F7FA'
  },
  help: {
    headerColor: '#3F51B5',
    borderColor: '#7986CB',
    backgroundColor: '#E8EAF6'
  }
};

// Format message with modern HTML styling
export function formatMessage({ title, content, image, style = 'info' }) {
  const {
    headerColor,
    borderColor,
    backgroundColor
  } = STYLES[style];

  let messageHtml = `
<div style="
  font-family: 'Google Sans', Arial, sans-serif;
  background: ${backgroundColor};
  border: 2px solid ${borderColor};
  border-radius: 12px;
  padding: 15px;
  margin: 5px 0;
">`;

  // Add image if provided
  if (image) {
    messageHtml += `
<div style="
  width: 100%;
  height: 150px;
  background-image: url('${image}');
  background-size: cover;
  background-position: center;
  border-radius: 8px;
  margin-bottom: 15px;
"></div>`;
  }

  // Add title
  messageHtml += `
<div style="
  color: ${headerColor};
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
  border-bottom: 2px solid ${borderColor};
  padding-bottom: 5px;
">${title}</div>`;

  // Add content
  messageHtml += `
<div style="
  color: #333;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
">${content}</div>
</div>`;

  return messageHtml;
}

// Format AI response with style-specific elements
export function formatAIResponse(text, style = 'normal') {
  const chatStyle = CONFIG.CHAT_STYLES[style];
  if (!chatStyle) return text;

  const { emoji } = chatStyle;

  // Add random style-specific phrase if available
  let stylePhrase = '';
  if (CONFIG.STYLE_PHRASES[style]) {
    const phrases = CONFIG.STYLE_PHRASES[style];
    stylePhrase = phrases[Math.floor(Math.random() * phrases.length)];
  }

  return formatMessage({
    title: `${emoji} AI Response`,
    content: `${text}\n\n${stylePhrase}`,
    style: 'info'
  });
}

// Format error messages
export function formatError(error) {
  return formatMessage({
    title: '❌ Error',
    content: error,
    style: 'error'
  });
}

// Format search results
export function formatSearchResults(results) {
  return formatMessage({
    title: '🔍 Search Results',
    content: results,
    style: 'search'
  });
}

// Generate progress message for long-running tasks
export function generateProgressMessage(task) {
  const messages = {
    document: 'Đang phân tích tài liệu... 📝',
    image: 'Đang phân tích hình ảnh... 🖼️',
    search: 'Đang tìm kiếm... 🔍',
    processing: 'Đang xử lý... ⚙️'
  };

  return formatMessage({
    title: '⏳ Processing',
    content: messages[task] || messages.processing,
    style: 'info'
  });
}

// Format file analysis results
export function formatFileAnalysis(analysis) {
  return formatMessage({
    title: '📊 File Analysis',
    content: analysis,
    style: 'info'
  });
}

// Format quota status
export function formatQuotaStatus(used, total) {
  const percentage = (used / total) * 100;
  let statusEmoji = '✅';
  if (percentage >= 90) statusEmoji = '⚠️';
  if (percentage >= 100) statusEmoji = '❌';

  return formatMessage({
    title: `${statusEmoji} Quota Status`,
    content: `Used: ${used}/${total} (${percentage.toFixed(1)}%)`,
    style: percentage >= 90 ? 'warning' : 'info'
  });
}

// Format system status
export function formatSystemStatus(status) {
  const {
    uptime,
    activeUsers,
    totalRequests,
    errorRate
  } = status;

  return formatMessage({
    title: '📊 System Status',
    content: `
Uptime: ${uptime}
Active Users: ${activeUsers}
Total Requests: ${totalRequests}
Error Rate: ${errorRate}%
    `,
    style: 'info'
  });
}

// Helper function to create menu buttons
export function createMenuButtons(options, currentSelection = null) {
  return options.map(option => ({
    text: `${option.emoji} ${option.label}${currentSelection === option.value ? ' ✓' : ''}`,
    callback_data: option.value
  }));
}

// Helper function to split buttons into rows
export function splitButtonsIntoRows(buttons, buttonsPerRow = 2) {
  return buttons.reduce((rows, button, index) => {
    if (index % buttonsPerRow === 0) rows.push([button]);
    else rows[rows.length - 1].push(button);
    return rows;
  }, []);
}

// Format help menu with sections
export function formatHelpMenu(sections, isAdmin = false) {
  const content = sections
    .filter(section => isAdmin || !section.adminOnly)
    .map(section => `
${section.emoji} ${section.title}:
${section.commands.map(cmd => `• ${cmd.command} - ${cmd.description}`).join('\n')}
    `).join('\n');

  return formatMessage({
    title: '❓ Help Menu',
    content: content.trim(),
    style: 'help'
  });
}

// Format model selection menu
export function formatModelMenu(currentModel) {
  const models = [
    { emoji: '🤖', label: 'ChatGPT', value: 'chatgpt' },
    { emoji: '🧠', label: 'Gemini', value: 'gemini' },
    { emoji: '🔮', label: 'Grok', value: 'grok' }
  ];

  const buttons = createMenuButtons(models, currentModel);
  const rows = splitButtonsIntoRows(buttons);

  return {
    text: formatMessage({
      title: '🤖 Select AI Model',
      content: 'Choose your preferred AI model:',
      style: 'menu'
    }),
    reply_markup: {
      inline_keyboard: rows
    }
  };
}

// Format style selection menu
export function formatStyleMenu(currentStyle) {
  const styles = Object.entries(CONFIG.CHAT_STYLES).map(([value, info]) => ({
    emoji: info.emoji,
    label: value,
    value: value
  }));

  const buttons = createMenuButtons(styles, currentStyle);
  const rows = splitButtonsIntoRows(buttons);

  return {
    text: formatMessage({
      title: '🎭 Select Chat Style',
      content: 'Choose your preferred chat style:',
      style: 'menu'
    }),
    reply_markup: {
      inline_keyboard: rows
    }
  };
}

// Export all formatting functions
export {
  STYLES,
  formatMessage,
  formatAIResponse,
  formatError,
  formatSearchResults,
  generateProgressMessage,
  formatFileAnalysis,
  formatQuotaStatus,
  formatSystemStatus,
  formatHelpMenu,
  formatModelMenu,
  formatStyleMenu
};