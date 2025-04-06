import { CONFIG } from './config.js';
import { logError, backupData } from './kvStorage.js';

// Reset daily quotas at midnight UTC
export async function resetDailyQuotas(env) {
  try {
    // List all quota keys
    const quotaList = await env[CONFIG.KV_NAMESPACE_QUOTAS].list();
    
    // Get active users count for quota distribution
    const activeUsers = await getActiveUsersCount(env);
    const quotaPerUser = Math.min(
      Math.floor(CONFIG.DAILY_TOTAL_QUOTA / activeUsers),
      CONFIG.MAX_QUOTA_PER_USER
    );

    // Reset quota for each user
    for (const key of quotaList.keys) {
      const userId = key.name.replace('Quota:', '');
      await env[CONFIG.KV_NAMESPACE_QUOTAS].put(
        key.name,
        JSON.stringify({
          remaining: quotaPerUser,
          lastUpdated: new Date().toISOString()
        }),
        {
          // Set expiration to 24 hours
          expirationTtl: 86400
        }
      );
    }

    console.log('Daily quotas reset successfully');
    return true;
  } catch (error) {
    console.error('Error resetting daily quotas:', error);
    await logError({
      userId: 'SYSTEM',
      command: 'reset-quotas',
      errorMessage: error.message,
      api: 'cron'
    }, env);
    return false;
  }
}

// Clean up expired data
export async function cleanupExpiredData(env) {
  try {
    await Promise.all([
      cleanupExpiredContexts(env),
      cleanupInactiveKeys(env),
      cleanupOldBackups(env)
    ]);

    console.log('Data cleanup completed successfully');
    return true;
  } catch (error) {
    console.error('Error during data cleanup:', error);
    await logError({
      userId: 'SYSTEM',
      command: 'cleanup',
      errorMessage: error.message,
      api: 'cron'
    }, env);
    return false;
  }
}

// Clean up expired conversation contexts
async function cleanupExpiredContexts(env) {
  try {
    const contextList = await env[CONFIG.KV_NAMESPACE_CONTEXTS].list();
    const now = Date.now();

    for (const key of contextList.keys) {
      const context = await env[CONFIG.KV_NAMESPACE_CONTEXTS].get(key.name, 'json');
      if (context) {
        const lastUpdated = new Date(context.lastUpdated).getTime();
        if (now - lastUpdated > CONFIG.CONTEXT_AUTO_DELETE * 1000) {
          await env[CONFIG.KV_NAMESPACE_CONTEXTS].delete(key.name);
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning up contexts:', error);
    throw error;
  }
}

// Clean up inactive keys
async function cleanupInactiveKeys(env) {
  try {
    const keyList = await env[CONFIG.KV_NAMESPACE_KEYS].list();
    const now = Date.now();

    for (const key of keyList.keys) {
      const keyData = await env[CONFIG.KV_NAMESPACE_KEYS].get(key.name, 'json');
      if (keyData) {
        const lastUsed = new Date(keyData.lastUsed || keyData.createdDate).getTime();
        if (now - lastUsed > CONFIG.KEY_INACTIVE_TTL * 1000) {
          // Deactivate key
          await env[CONFIG.KV_NAMESPACE_KEYS].put(
            key.name,
            JSON.stringify({
              ...keyData,
              isActive: false,
              deactivatedDate: new Date().toISOString()
            })
          );
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning up keys:', error);
    throw error;
  }
}

// Clean up old backups
async function cleanupOldBackups(env) {
  try {
    const backupList = await env[CONFIG.KV_NAMESPACE_CACHE].list({ prefix: 'Backup:' });
    const now = Date.now();

    for (const key of backupList.keys) {
      const backupDate = new Date(key.name.replace('Backup:', '')).getTime();
      // Delete backups older than 30 days
      if (now - backupDate > 30 * 24 * 60 * 60 * 1000) {
        await env[CONFIG.KV_NAMESPACE_CACHE].delete(key.name);
      }
    }
  } catch (error) {
    console.error('Error cleaning up backups:', error);
    throw error;
  }
}

// Get count of active users
async function getActiveUsersCount(env) {
  try {
    const keyList = await env[CONFIG.KV_NAMESPACE_KEYS].list();
    let activeCount = 0;

    for (const key of keyList.keys) {
      const keyData = await env[CONFIG.KV_NAMESPACE_KEYS].get(key.name, 'json');
      if (keyData && keyData.isActive) {
        activeCount++;
      }
    }

    return Math.max(activeCount, 1); // Ensure at least 1 active user
  } catch (error) {
    console.error('Error counting active users:', error);
    return 1; // Default to 1 on error
  }
}

// Create hourly backup
export async function createHourlyBackup(env) {
  try {
    await backupData(env);
    console.log('Hourly backup created successfully');
    return true;
  } catch (error) {
    console.error('Error creating hourly backup:', error);
    await logError({
      userId: 'SYSTEM',
      command: 'backup',
      errorMessage: error.message,
      api: 'cron'
    }, env);
    return false;
  }
}

// Export all functions
export {
  resetDailyQuotas,
  cleanupExpiredData,
  createHourlyBackup
};