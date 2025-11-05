// Redis数据服务 - 专门处理用户数据和对话记录的Redis存储
const redisConfig = require('../config/redis');
// 通过getter获取redisClient
const redisClient = redisConfig.redisClient;
// 导入ensureConnection方法
const ensureConnection = redisConfig.ensureConnection;

// 统一的过期时间常量（秒）
const EXPIRY_TIME = {
  USER_DATA: 60 * 60, // 用户数据缓存60分钟
  CHAT_HISTORY: 60 * 60 * 24, // 聊天记录缓存24小时
  USER_ID_MAPPING: 60 * 60 * 24 // 用户ID映射缓存24小时
};

/**
 * 保存用户数据到Redis
 * @param {string} phone - 手机号
 * @param {object} userData - 用户数据对象
 * @param {number} expireTime - 可选的过期时间（秒），默认使用EXPIRY_TIME.USER_DATA
 * @returns {Promise<boolean>} 是否保存成功
 */
async function saveUserDataToRedis(phone, userData, expireTime) {
  try {
    // 确保Redis连接可用
    const isConnected = await ensureConnection();
    if (!isConnected) {
      console.error('Redis连接不可用，无法保存用户数据');
      return false;
    }

    // 使用users前缀的键名格式，与chats保持一致的命名风格
    const userKey = `users:${phone}`;
    // 使用提供的过期时间或默认过期时间
    const finalExpireTime = expireTime || EXPIRY_TIME.USER_DATA;
    await redisClient.setAsync(userKey, JSON.stringify(userData));
    await redisClient.expireAsync(userKey, finalExpireTime);

    console.log(`用户数据已成功保存到Redis，手机号: ${phone}`);
    return true;
  } catch (error) {
    console.error(`保存用户数据到Redis失败，手机号: ${phone}`, error);
    return false;
  }
}

/**
 * 从Redis获取用户数据
 * @param {string} phone - 手机号（必需）
 * @param {string} userId - 用户ID（可选，不再使用）
 * @returns {Promise<object|null>} 用户数据或null
 */
async function getUserDataFromRedis(phone, userId) {
  try {
    // 确保Redis连接可用
    const isConnected = await ensureConnection();
    if (!isConnected) {
      console.error('Redis连接不可用，无法获取用户数据');
      return null;
    }

    // 只通过手机号查询数据
    if (phone) {
      const userKey = `users:${phone}`;
      const userData = await redisClient.getAsync(userKey);
      return userData ? JSON.parse(userData) : null;
    }
    
    // 如果没有提供手机号，返回null
    console.warn('获取用户数据需要提供手机号');
    return null;
  } catch (error) {
    console.error(`从Redis获取用户数据失败，手机号: ${phone}`, error);
    return null;
  }
}

/**
 * 保存聊天记录到Redis
 * @param {string} userId - 用户ID（可选，不再使用）
 * @param {Array} messages - 聊天消息数组
 * @param {string} phone - 手机号（必需）
 * @returns {Promise<boolean>} 是否保存成功
 */
async function saveChatHistoryToRedis(userId, messages, phone = '') {
  try {
    // 确保Redis连接可用
    const isConnected = await ensureConnection();
    if (!isConnected) {
      console.error('Redis连接不可用，无法保存聊天记录');
      return false;
    }

    // 只使用手机号作为key，使用chats前缀
    if (!phone) {
      console.error('保存聊天记录需要提供手机号');
      return false;
    }
    
    const mainKey = `chats:${phone}`;
    await redisClient.setAsync(mainKey, JSON.stringify(messages));
    await redisClient.expireAsync(mainKey, EXPIRY_TIME.CHAT_HISTORY);

    console.log(`聊天记录已成功保存到Redis，手机号: ${phone}，共${messages.length}条消息`);
    return true;
  } catch (error) {
    console.error(`保存聊天记录到Redis失败，手机号: ${phone}`, error);
    return false;
  }
}

/**
 * 从Redis获取聊天记录
 * @param {string} userId - 用户ID（可选，不再使用）
 * @param {string} phone - 手机号（必需）
 * @returns {Promise<Array>} 聊天消息数组
 */
async function getChatHistoryFromRedis(userId = '', phone = '') {
  try {
    // 确保Redis连接可用
    const isConnected = await ensureConnection();
    if (!isConnected) {
      console.error('Redis连接不可用，无法获取聊天记录');
      return [];
    }

    // 只通过手机号查询聊天记录，使用chats前缀
    if (phone) {
      const phoneKey = `chats:${phone}`;
      const cachedMessages = await redisClient.getAsync(phoneKey);
      return cachedMessages ? JSON.parse(cachedMessages) : [];
    }
    
    console.warn('获取聊天记录需要提供手机号');
    return [];
  } catch (error) {
    console.error(`从Redis获取聊天记录失败，手机号: ${phone}`, error);
    return [];
  }
}

/**
 * 清除用户的Redis缓存
 * @param {string} userId - 用户ID（可选，不再使用）
 * @param {string} phone - 手机号（必需）
 * @returns {Promise<boolean>} 是否清除成功
 */
async function clearUserRedisCache(userId, phone) {
  try {
    // 确保Redis连接可用
    const isConnected = await ensureConnection();
    if (!isConnected) {
      console.error('Redis连接不可用，无法清除缓存');
      return false;
    }

    const keysToDelete = [];

    // 只删除手机号相关的key，使用users前缀
    if (phone) {
      keysToDelete.push(`users:${phone}`);
    } else {
      console.warn('清除用户缓存需要提供手机号');
      return false;
    }

    // 删除所有相关的key
    await redisClient.delAsync(keysToDelete);
    console.log(`已清除用户Redis缓存，手机号: ${phone}`);

    return true;
  } catch (error) {
    console.error(`清除用户Redis缓存失败，手机号: ${phone}`, error);
    return false;
  }
}

/**
 * 批量保存数据到Redis
 * @param {Array} dataPairs - 数据对数组，每项包含[key, value, expiry]
 * @returns {Promise<boolean>} 是否全部保存成功
 */
async function batchSaveToRedis(dataPairs) {
  try {
    // 确保Redis连接可用
    const isConnected = await ensureConnection();
    if (!isConnected) {
      console.error('Redis连接不可用，无法批量保存数据');
      return false;
    }

    // 使用pipeline提高性能，设置键使用users前缀
    const pipeline = redisClient.pipeline();

    // 添加所有命令到pipeline
    for (const [key, value, expiry] of dataPairs) {
      pipeline.set(key, JSON.stringify(value));
    pipeline.expire(key, expiry || EXPIRY_TIME.USER_DATA);
    }

    // 执行pipeline
    await pipeline.exec();
    console.log(`批量保存${dataPairs.length}条数据到Redis成功`);
    return true;
  } catch (error) {
    console.error('批量保存数据到Redis失败', error);
    return false;
  }
}

// 导出所有方法
module.exports = {
  saveUserDataToRedis,
  getUserDataFromRedis,
  saveChatHistoryToRedis,
  getChatHistoryFromRedis,
  clearUserRedisCache,
  batchSaveToRedis,
  EXPIRY_TIME
};