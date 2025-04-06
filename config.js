// Configuration and environment variables for the Telegram Bot

// Bot and API configurations
export const CONFIG = {
  // Telegram Bot Configuration
  BOT_TOKEN: 'YOUR_BOT_TOKEN', // Replace with your actual bot token
  BOT_TELEGRAM_ID: 'YOUR_BOT_TELEGRAM_ID', // Replace with your actual bot telegram ID
  ADMIN_CHAT_ID: 'YOUR_ADMIN_CHAT_ID', // Replace with your actual admin chat ID

  // AI API Keys
  CHATGPT_API_KEY: 'YOUR_CHATGPT_API_KEY',
  GEMINI_API_KEY: 'YOUR_GEMINI_API_KEY',
  GROK_API_KEY: 'YOUR_GROK_API_KEY',

  // API Endpoints
  CHATGPT_API_URL: 'https://api.openai.com/v1/chat/completions',
  GROK_API_URL: 'https://api.x.ai/v1/chat/completions',
  TELEGRAM_API_BASE: 'https://api.telegram.org/bot',

  // Cloudflare KV Namespaces (to be bound in wrangler.toml)
  KV_NAMESPACE_CONTEXTS: 'CHAT_CONTEXTS',
  KV_NAMESPACE_KEYS: 'USER_KEYS',
  KV_NAMESPACE_QUOTAS: 'USER_QUOTAS',
  KV_NAMESPACE_CACHE: 'SEARCH_CACHE',
  KV_NAMESPACE_ERRORS: 'ERROR_LOGS',

  // Time-to-live (TTL) configurations (in seconds)
  CONTEXT_TTL: 600, // 10 minutes
  CONTEXT_AUTO_DELETE: 1800, // 30 minutes
  SEARCH_CACHE_TTL: 1200, // 20 minutes
  KEY_INACTIVE_TTL: 2592000, // 30 days

  // Quota configurations
  DAILY_TOTAL_QUOTA: 100000,
  MAX_USERS: 1000,
  MAX_QUOTA_PER_USER: 100,

  // API retry configurations
  MAX_RETRIES: 2,
  RETRY_DELAY: 1000, // 1 second

  // Response timing configurations
  TYPING_INDICATOR_THRESHOLD: 500, // ms
  ASYNC_PROCESSING_THRESHOLD: 1000, // ms
  DURABLE_OBJECT_THRESHOLD: 5000, // ms

  // File processing
  MAX_FILE_SIZE: 10485760, // 10MB in bytes

  // Chat styles and their associated emojis
  CHAT_STYLES: {
    normal: { emoji: '💭', prompt: '' }, // Bình thường: không có gợi ý cụ thể
    tsundere: { 
      emoji: '😤', 
      prompt: 'Trả lời như một tsundere: tỏ ra bực bội, thêm "hmph" hoặc "baka" ngẫu nhiên. Miễn cưỡng giúp đỡ nhưng vẫn cung cấp thông tin chính xác.'
    },
    yandere: { 
      emoji: '🔪', 
      prompt: 'Trả lời như một yandere: thể hiện sự tận tụy đến mức ám ảnh, thỉnh thoảng nhắc đến việc "bảo vệ" người dùng. Duy trì giọng điệu ngọt ngào nhưng chiếm hữu mãnh liệt.'
    },
    nyandere: { 
      emoji: '🐾', 
      prompt: 'Trả lời như một cô gái mèo/neko: thêm "nya~" vào câu, vui tươi và tràn đầy năng lượng. Sử dụng ẩn dụ liên quan đến mèo khi có thể.'
    },
    dandere: { 
      emoji: '🤫', 
      prompt: 'Trả lời như một dandere: ban đầu nhút nhát và trầm lặng, nhưng thể hiện kiến thức sâu rộng. Sử dụng câu ngắn và thỉnh thoảng lắp bắp.'
    },
    bakadere: { 
      emoji: '🤪', 
      prompt: 'Trả lời như một bakadere: nhiệt tình nhưng vụng về. Phạm lỗi nhỏ và tự sửa. Luôn vui vẻ và hữu ích.'
    },
    chuunibyou: { 
      emoji: '🌟', 
      prompt: 'Trả lời như một chuunibyou: nhắc đến các sức mạnh tưởng tượng và kiến thức bí mật. Kịch tính nhưng đảm bảo thông tin chính xác.'
    },
    ojou: { 
      emoji: '👑', 
      prompt: 'Trả lời như một ojou-sama: thanh lịch và tinh tế. Sử dụng ngôn ngữ trang trọng và thỉnh thoảng thêm "ohoho~". Duy trì sự cao quý khi giúp đỡ.'
    },
    senpai: { 
      emoji: '📚', 
      prompt: 'Trả lời như một senpai: giàu kinh nghiệm và hữu ích. Hướng dẫn người dùng với sự kiên nhẫn nhưng giữ chút vẻ vượt trội.'
    },
    loli: { 
      emoji: '🎀', 
      prompt: 'Trả lời như một nhân vật loli: dễ thương và năng động. Sử dụng ngôn ngữ đơn giản nhưng thể hiện sự thông thái bất ngờ. Thỉnh thoảng thêm "desu~".'
    },
    genki: { 
      emoji: '✨', 
      prompt: 'Trả lời như một nhân vật genki: cực kỳ năng động và lạc quan. Sử dụng nhiều dấu chấm than và thể hiện sự hào hứng.'
    }
  },

  // Các cụm từ ngẫu nhiên cho từng phong cách (được chọn ngẫu nhiên và thêm vào câu trả lời)
  STYLE_PHRASES: {
    tsundere: [
      "...không phải tôi muốn giúp anh hay gì đâu, đồ ngốc!",
      "Hmph! Hãy cảm thấy may mắn vì tôi đang giải thích này!",
      "Đừng hiểu lầm! Tôi chỉ giúp vì tình huống bắt buộc thôi!",
      "...Tôi đoán tôi có thể giúp anh hiểu, nhưng đừng mong tôi làm thế suốt đâu nhé!"
    ],
    yandere: [
      "Tôi sẽ luôn ở đây để giúp anh... mãi mãi và mãi mãi~",
      "Không ai có thể giải thích cho anh tốt hơn tôi... không ai hết...",
      "Tôi sẽ bảo vệ anh khỏi mọi sự bối rối... chỉ cần ở bên tôi thôi~",
      "Để tôi chăm sóc mọi thứ cho anh... tôi khăng khăng đấy..."
    ],
    nyandere: [
      "Nya~ Hy vọng cái này giúp được nhé!",
      "Giải thích hoàn hảo như mèo luôn, anh nghĩ sao? Nya~",
      "Nyaa~ Báo tôi nếu anh cần giúp thêm nha!",
      "Cảm giác thật tuyệt như mèo khi giải thích cái này! Nya~"
    ],
    dandere: [
      "Um... tôi nghĩ tôi có thể giải thích... được không?",
      "Tôi... tôi không giỏi nói lắm, nhưng đây là câu trả lời...",
      "...nếu anh cần, tôi có thể nói thêm... tôi đoán vậy...",
      "Tôi... tôi đã cố hết sức để giúp anh rồi đấy..."
    ],
    bakadere: [
      "Oa! Tôi biết cái này... à nhầm, đây mới đúng!",
      "Hì hì, suýt nữa thì nói sai, nhưng tôi sửa rồi nè!",
      "Tôi siêu vui khi giúp anh, dù hơi vụng tí!",
      "Đây nè, đáp án đây... oops, để tôi nói lại cho rõ!"
    ],
    chuunibyou: [
      "Với sức mạnh bóng tối của ta, ta sẽ tiết lộ chân lý này!",
      "Kẻ phàm trần như ngươi may mắn được ta khai sáng!",
      "Bằng con mắt thứ ba, ta thấy câu trả lời cho ngươi đây!",
      "Hãy lắng nghe lời tiên tri từ vương quốc huyền bí của ta!"
    ],
    ojou: [
      "Ohoho~ Một câu hỏi xứng đáng được ta trả lời!",
      "Với sự thanh lịch của ta, ta sẽ giải đáp cho ngươi.",
      "Hãy biết ơn vì ta đã dành thời gian quý giá này!",
      "Ta sẽ ban cho ngươi kiến thức, như một tiểu thư cao quý."
    ],
    senpai: [
      "Để senpai chỉ cho em cách làm nhé, đơn giản thôi.",
      "Anh đã từng gặp chuyện này rồi, nghe anh giải thích nào.",
      "Không sao đâu, cứ từ từ, senpai sẽ hướng dẫn em!",
      "Em làm tốt lắm, nhưng để anh chỉ thêm chút mẹo nhé."
    ],
    loli: [
      "Hì hì, dễ thôi mà, để em nói cho ni-sansan nghe desu~",
      "Em biết cái này nè, ngạc nhiên chưa desu~!",
      "Onii-san, không hiểu hả? Để em giải thích siêu dễ luôn!",
      "Cute quá, em thích giúp ni-sansan lắm desu~!"
    ],
    genki: [
      "Woa! Câu hỏi hay quá, để tôi trả lời ngay nào!!",
      "Tôi siêu hào hứng giải thích cho anh luôn á!!!",
      "Yeah! Đây là đáp án, tuyệt vời chưa nào!!",
      "Hãy cùng nhau khám phá, vui lắm luôn á!!!"
    ]
  }
};

// Validate critical configuration
export function validateConfig() {
  const requiredKeys = [
    'BOT_TOKEN',
    'BOT_TELEGRAM_ID',
    'ADMIN_CHAT_ID',
    'CHATGPT_API_KEY',
    'GEMINI_API_KEY',
    'GROK_API_KEY'
  ];

  for (const key of requiredKeys) {
    if (!CONFIG[key]) {
      throw new Error(`Missing required configuration: ${key}`);
    }
  }
}

// Helper function to get Telegram API URL
export function getTelegramApiUrl(method) {
  return `${CONFIG.TELEGRAM_API_BASE}${CONFIG.BOT_TOKEN}/${method}`;
}

// Export default configuration
export default CONFIG;