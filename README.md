# Telegram AI Chat Bot

A powerful Telegram bot that integrates multiple AI models (ChatGPT, Gemini, Grok) with anime-style personalities, image analysis, and web search capabilities. Built on Cloudflare Workers for high performance and scalability.

## Features

- **Multiple AI Models**
  - ChatGPT (OpenAI)
  - Gemini (Google)
  - Grok (X.ai)
  - Model switching via `/setmodel` or menu

- **Anime-Style Personalities**
  - Normal: Professional responses
  - Tsundere: Reluctant but helpful
  - Yandere: Obsessively devoted
  - Nyandere: Playful catgirl
  - Dandere: Shy but knowledgeable
  - Bakadere: Enthusiastic but clumsy
  - Chuunibyou: Dramatic with "hidden powers"
  - Ojou: Elegant and refined
  - Senpai: Experienced mentor
  - Loli: Cute and energetic
  - Genki: Super enthusiastic

- **Content Analysis**
  - Image analysis with Gemini Vision
  - Document summarization (up to 10MB)
  - Web search capabilities

- **User Management**
  - Key-based authentication
  - Daily quota system
  - Admin commands for key management

- **Performance Features**
  - Sub-second responses
  - Asynchronous processing for large files
  - Automatic failover between AI models
  - Response caching

## Setup

1. **Create Cloudflare Worker**
   ```bash
   # Install Wrangler CLI
   npm install -g wrangler

   # Login to Cloudflare
   wrangler login

   # Create KV namespaces
   wrangler kv:namespace create CHAT_CONTEXTS
   wrangler kv:namespace create USER_KEYS
   wrangler kv:namespace create USER_QUOTAS
   wrangler kv:namespace create SEARCH_CACHE
   wrangler kv:namespace create ERROR_LOGS

   # Deploy
   wrangler deploy
   ```

2. **Configure Environment Variables**
   - Update wrangler.toml with your:
     - Telegram Bot Token
     - API Keys (ChatGPT, Gemini, Grok)
     - Admin Chat ID

3. **Set Up Telegram Webhook**
   ```bash
   curl "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=<WORKER_URL>"
   ```

## Commands

### User Commands
- `/start` - Welcome message and setup guide
- `/key <code>` - Authenticate with a key
- `/setmenu` - Open model/style selection menu
- `/setmodel <model>` - Choose AI model
- `/setstyle <style>` - Choose chat style
- `/search <query>` - Search the web
- `/clear` - Clear chat context
- `/check` - View current settings
- `/info` - Bot information
- `/help` - Command list

### Admin Commands
- `/genkey` - Generate new auth key
- `/listkeys` - View all keys
- `/errorlog` - View error logs

## Architecture

- **worker.js**: Main entry point, handles webhooks
- **commands.js**: Command processing
- **messageHandler.js**: Message processing
- **aiClients.js**: AI API integrations
- **kvStorage.js**: Cloudflare KV operations
- **durableObject.js**: Long-running tasks
- **ui.js**: Message formatting
- **cron.js**: Scheduled tasks
- **config.js**: Configuration

## Development

1. Clone the repository
2. Install dependencies
   ```bash
   npm install
   ```
3. Create .dev.vars file with environment variables
4. Run locally
   ```bash
   wrangler dev
   ```

## Deployment

1. Update wrangler.toml configuration
2. Deploy to Cloudflare
   ```bash
   wrangler deploy
   ```

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request
