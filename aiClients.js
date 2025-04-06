import { CONFIG } from './config.js';
import { logError } from './kvStorage.js';

// AI Model Configurations
const AI_MODELS = {
  chatgpt: {
    name: 'ChatGPT',
    model: 'gpt-4',
    maxTokens: 4096,
    temperature: 0.7,
    emoji: '🤖'
  },
  gemini: {
    name: 'Gemini',
    model: 'gemini-1.5-flash',
    maxTokens: 4096,
    temperature: 0.7,
    emoji: '🧠'
  },
  grok: {
    name: 'Grok',
    model: 'grok-2',
    maxTokens: 4096,
    temperature: 0.7,
    emoji: '🔮'
  }
};

// Main AI interaction function with fallback logic
export async function getAIResponse(prompt, style, preferredModel, env) {
  const models = [preferredModel, ...Object.keys(AI_MODELS).filter(m => m !== preferredModel)];
  let lastError = null;

  for (const model of models) {
    for (let attempt = 0; attempt < CONFIG.MAX_RETRIES; attempt++) {
      try {
        let response;
        switch (model) {
          case 'grok':
            response = await sendGrokRequest(prompt, style, env);
            break;
          case 'gemini':
            response = await sendGeminiRequest(prompt, style, env);
            break;
          case 'chatgpt':
            response = await sendChatGPTRequest(prompt, style, env);
            break;
        }

        if (response) {
          return {
            text: response,
            model: model,
            emoji: AI_MODELS[model].emoji
          };
        }
      } catch (error) {
        lastError = error;
        console.error(model + ' attempt ' + (attempt + 1) + ' failed:', error);
        
        // Log error
        await logError({
          userId: 'SYSTEM',
          command: 'ai-request',
          errorMessage: error.message,
          api: model
        }, env);

        // Wait before retry
        if (attempt < CONFIG.MAX_RETRIES - 1) {
          await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
        }
      }
    }
  }

  throw new Error('All AI models failed. Last error: ' + (lastError?.message || 'Unknown error'));
}

// ChatGPT API Integration
async function sendChatGPTRequest(prompt, style, env) {
  const stylePrompt = CONFIG.CHAT_STYLES[style]?.prompt || '';
  const fullPrompt = stylePrompt ? stylePrompt + '\n\n' + prompt : prompt;

  const response = await fetch(CONFIG.CHATGPT_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + CONFIG.CHATGPT_API_KEY
    },
    body: JSON.stringify({
      model: AI_MODELS.chatgpt.model,
      messages: [{
        role: 'user',
        content: fullPrompt
      }],
      max_tokens: AI_MODELS.chatgpt.maxTokens,
      temperature: AI_MODELS.chatgpt.temperature
    })
  });

  if (!response.ok) {
    throw new Error('ChatGPT API error: ' + response.status + ' ' + response.statusText);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

// Gemini API Integration
async function sendGeminiRequest(prompt, style, env) {
  const stylePrompt = CONFIG.CHAT_STYLES[style]?.prompt || '';
  const fullPrompt = stylePrompt ? stylePrompt + '\n\n' + prompt : prompt;

  const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + CONFIG.GEMINI_API_KEY
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: fullPrompt
        }]
      }],
      generationConfig: {
        maxOutputTokens: AI_MODELS.gemini.maxTokens,
        temperature: AI_MODELS.gemini.temperature
      }
    })
  });

  if (!response.ok) {
    throw new Error('Gemini API error: ' + response.status + ' ' + response.statusText);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text.trim();
}

// Grok API Integration
async function sendGrokRequest(prompt, style, env) {
  const stylePrompt = CONFIG.CHAT_STYLES[style]?.prompt || '';
  const fullPrompt = stylePrompt ? stylePrompt + '\n\n' + prompt : prompt;

  const response = await fetch(CONFIG.GROK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + CONFIG.GROK_API_KEY
    },
    body: JSON.stringify({
      model: AI_MODELS.grok.model,
      messages: [{
        role: 'user',
        content: fullPrompt
      }],
      max_tokens: AI_MODELS.grok.maxTokens,
      temperature: AI_MODELS.grok.temperature
    })
  });

  if (!response.ok) {
    throw new Error('Grok API error: ' + response.status + ' ' + response.statusText);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

// Image Analysis with Gemini Vision
export async function analyzeImage(imageUrl, env) {
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro-vision:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + CONFIG.GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: 'Analyze this image in detail:' },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: await getBase64Image(imageUrl)
              }
            }
          ]
        }]
      })
    });

    if (!response.ok) {
      throw new Error('Gemini Vision API error: ' + response.status + ' ' + response.statusText);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text.trim();
  } catch (error) {
    console.error('Image analysis error:', error);
    throw new Error('Image analysis failed: ' + error.message);
  }
}

// Document Analysis with Grok
export async function analyzeDocument(documentUrl, env) {
  try {
    const documentText = await getDocumentText(documentUrl);
    
    const response = await fetch(CONFIG.GROK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + CONFIG.GROK_API_KEY
      },
      body: JSON.stringify({
        model: AI_MODELS.grok.model,
        messages: [{
          role: 'user',
          content: 'Summarize this document:\n' + documentText
        }],
        max_tokens: AI_MODELS.grok.maxTokens,
        temperature: 0.3 // Lower temperature for more focused summary
      })
    });

    if (!response.ok) {
      throw new Error('Grok API error: ' + response.status + ' ' + response.statusText);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Document analysis error:', error);
    throw new Error('Document analysis failed: ' + error.message);
  }
}

// Web Search with Grok
export async function searchWeb(query, env) {
  try {
    const response = await fetch(CONFIG.GROK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + CONFIG.GROK_API_KEY
      },
      body: JSON.stringify({
        model: AI_MODELS.grok.model,
        messages: [{
          role: 'user',
          content: 'Search the web for: ' + query + '\nProvide a comprehensive but concise summary of the results.'
        }],
        max_tokens: AI_MODELS.grok.maxTokens,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error('Grok API error: ' + response.status + ' ' + response.statusText);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Web search error:', error);
    throw new Error('Web search failed: ' + error.message);
  }
}

// Helper Functions
async function getBase64Image(url) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

async function getDocumentText(url) {
  const response = await fetch(url);
  const text = await response.text();
  return text;
}

// Export all functions
export {
  AI_MODELS,
};