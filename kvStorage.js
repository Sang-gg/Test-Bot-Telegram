import { CONFIG } from './config.js';

// User Authentication and Keys
export async function getKey(userId, env) {
  try {
    const key = await env[CONFIG.KV_NAMESPACE_KEYS].get(`UserID:${userId}`, 'json');
    return key || null;
  } catch (error) {
    console.error('Error getting key:', error);
    return null;
  }
}

export async function setKey(userId, keyData, env) {
  try {
    await env[CONFIG.KV_NAMESPACE_KEYS].put(
      `UserID:${userId}`,
      JSON.stringify({
        ...keyData,
        lastUsed: new Date().toISOString()
      }),
      {
        expirationTtl: CONFIG.KEY_INACTIVE_TTL
      }
    );
    return true;
  } catch (error) {
    console.error('Error setting key:', error);
    return false;
  }
}

export async function listKeys(env) {
  try {
    const keys = await env[CONFIG.KV_NAMESPACE_KEYS].list();
    const keyData = await Promise.all(
      keys.keys.map(async (key) => {
        const data = await env[CONFIG.KV_NAMESPACE_KEYS].get(key.name, 'json');
        return { ...data, userId: key.name.replace('UserID:', '') };
      })
    );
    return keyData;
  } catch (error) {
    console.error('Error listing keys:', error);
    return [];
  }
}

// Chat Context Management
export async function getContext(userId, env) {
  try {
    const context = await env[CONFIG.KV_NAMESPACE_CONTEXTS].get(`Context:${userId}`, 'json');
    return context?.messages || [];
  } catch (error) {
    console.error('Error getting context:', error);
    return [];
  }
}

export async function setContext(userId, messages, env) {
  try {
    await env[CONFIG.KV_NAMESPACE_CONTEXTS].put(
      `Context:${userId}`,
      JSON.stringify({
        messages,
        lastUpdated: new Date().toISOString()
      }),
      {
        expirationTtl: CONFIG.CONTEXT_TTL
      }
    );
    return true;
  } catch (error) {
    console.error('Error setting context:', error);
    return false;
  }
}

export async function clearContext(userId, env) {
  try {
    await env[CONFIG.KV_NAMESPACE_CONTEXTS].delete(`Context:${userId}`);
    return true;
  } catch (error) {
    console.error('Error clearing context:', error);
    return false;
  }
}

// User Preferences
export async function getUserPreferences(userId, env) {
  try {
    const prefs = await env[CONFIG.KV_NAMESPACE_KEYS].get(`Prefs:${userId}`, 'json');
    return prefs || { model: 'chatgpt', style: 'normal' };
  } catch (error) {
    console.error('Error getting preferences:', error);
    return { model: 'chatgpt', style: 'normal' };
  }
}

export async function setUserPreference(userId, key, value, env) {
  try {
    const prefs = await getUserPreferences(userId, env);
    await env[CONFIG.KV_NAMESPACE_KEYS].put(
      `Prefs:${userId}`,
      JSON.stringify({
        ...prefs,
        [key]: value,
        lastUpdated: new Date().toISOString()
      })
    );
    return true;
  } catch (error) {
    console.error('Error setting preference:', error);
    return false;
  }
}

// Quota Management
export async function getUserQuota(userId, env) {
  try {
    const quota = await env[CONFIG.KV_NAMESPACE_QUOTAS].get(`Quota:${userId}`, 'json');
    return quota?.remaining || 0;
  } catch (error) {
    console.error('Error getting quota:', error);
    return 0;
  }
}

export async function setUserQuota(userId, quota, env) {
  try {
    await env[CONFIG.KV_NAMESPACE_QUOTAS].put(
      `Quota:${userId}`,
      JSON.stringify({
        remaining: quota,
        lastUpdated: new Date().toISOString()
      }),
      {
        // Reset at midnight UTC
        expirationTtl: getSecondsUntilMidnight()
      }
    );
    return true;
  } catch (error) {
    console.error('Error setting quota:', error);
    return false;
  }
}

// Search Cache
export async function getCachedSearch(query, env) {
  try {
    const cache = await env[CONFIG.KV_NAMESPACE_CACHE].get(`Search:${query}`, 'json');
    return cache?.results || null;
  } catch (error) {
    console.error('Error getting search cache:', error);
    return null;
  }
}

export async function setCachedSearch(query, results, env) {
  try {
    await env[CONFIG.KV_NAMESPACE_CACHE].put(
      `Search:${query}`,
      JSON.stringify({
        results,
        timestamp: new Date().toISOString()
      }),
      {
        expirationTtl: CONFIG.SEARCH_CACHE_TTL
      }
    );
    return true;
  } catch (error) {
    console.error('Error setting search cache:', error);
    return false;
  }
}

// Error Logging
export async function logError(errorData, env) {
  try {
    const timestamp = new Date().toISOString();
    const errorKey = `Error:${timestamp}`;
    
    await env[CONFIG.KV_NAMESPACE_ERRORS].put(
      errorKey,
      JSON.stringify({
        ...errorData,
        timestamp
      }),
      {
        // Keep error logs for 7 days
        expirationTtl: 7 * 24 * 60 * 60
      }
    );
    return true;
  } catch (error) {
    console.error('Error logging error:', error);
    return false;
  }
}

export async function getErrorLogs(env) {
  try {
    const errors = await env[CONFIG.KV_NAMESPACE_ERRORS].list();
    const errorData = await Promise.all(
      errors.keys.map(async (error) => {
        return await env[CONFIG.KV_NAMESPACE_ERRORS].get(error.name, 'json');
      })
    );
    return errorData.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
  } catch (error) {
    console.error('Error getting error logs:', error);
    return [];
  }
}

// Key Generation and Validation
export async function generateNewKey(env) {
  const key = generateRandomKey();
  const timestamp = new Date().toISOString();
  
  try {
    await env[CONFIG.KV_NAMESPACE_KEYS].put(
      `Key:${key}`,
      JSON.stringify({
        createdDate: timestamp,
        isActive: true
      })
    );
    return key;
  } catch (error) {
    console.error('Error generating new key:', error);
    return null;
  }
}

export async function validateAndActivateKey(key, userId, env) {
  try {
    const keyData = await env[CONFIG.KV_NAMESPACE_KEYS].get(`Key:${key}`, 'json');
    
    if (!keyData || !keyData.isActive) {
      return false;
    }

    // Activate key for user
    await setKey(userId, {
      key,
      createdDate: new Date().toISOString(),
      isActive: true
    }, env);

    // Deactivate the original key
    await env[CONFIG.KV_NAMESPACE_KEYS].put(
      `Key:${key}`,
      JSON.stringify({
        ...keyData,
        isActive: false,
        usedBy: userId,
        usedDate: new Date().toISOString()
      })
    );

    return true;
  } catch (error) {
    console.error('Error validating key:', error);
    return false;
  }
}

// Backup Management
export async function backupData(env) {
  const timestamp = new Date().toISOString();
  const backup = {
    keys: await listKeys(env),
    quotas: {},
    errors: await getErrorLogs(env)
  };

  try {
    // Get all user quotas
    const quotaKeys = await env[CONFIG.KV_NAMESPACE_QUOTAS].list();
    for (const key of quotaKeys.keys) {
      const userId = key.name.replace('Quota:', '');
      backup.quotas[userId] = await getUserQuota(userId, env);
    }

    // Store backup
    await env[CONFIG.KV_NAMESPACE_CACHE].put(
      `Backup:${timestamp}`,
      JSON.stringify(backup),
      {
        // Keep backups for 30 days
        expirationTtl: 30 * 24 * 60 * 60
      }
    );

    return true;
  } catch (error) {
    console.error('Error creating backup:', error);
    await logError({
      userId: 'SYSTEM',
      command: 'backup',
      errorMessage: error.message,
      api: 'backup'
    }, env);
    return false;
  }
}

// Helper Functions
function generateRandomKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const keyLength = 12;
  let key = '';
  
  for (let i = 0; i < keyLength; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return key;
}

function getSecondsUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setUTCHours(24, 0, 0, 0);
  return Math.floor((midnight - now) / 1000);
}

// Export all functions
export {
  getKey,
  setKey,
  listKeys,
  getContext,
  setContext,
  clearContext,
  getUserPreferences,
  setUserPreference,
  getUserQuota,
  setUserQuota,
  getCachedSearch,
  setCachedSearch,
  logError,
  getErrorLogs,
  generateNewKey,
  validateAndActivateKey,
  backupData
};