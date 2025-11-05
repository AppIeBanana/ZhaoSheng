// 统一存储服务 - 整合MongoDB和Redis
import * as mongodbService from './storage/mongodb';
import * as redisService from './storage/redis';

// 存储策略常量
export const STORAGE_STRATEGIES = {
  PERSISTENT: 'mongodb',  // 持久化存储
  CACHE: 'redis'        // 缓存存储
};

// 移除未使用的防抖机制

/**
 * 保存用户数据 - MongoDB和Redis两级存储策略
 * Redis设置1小时过期时间
 */
export async function saveUserData(userData: any): Promise<boolean> {
  try {
    // 验证必须包含手机号
    if (!userData || !userData.phone) {
      console.error('用户数据必须包含手机号');
      return false;
    }
    
    // 生成用户ID
    const userId = generateUserId(userData.phone);
    
    // 添加Redis配置（包含连接信息和1小时过期时间）
    const redisConfig = {
      host: import.meta.env.VITE_REDIS_HOST || 'localhost',
      port: import.meta.env.VITE_REDIS_PORT || 6379,
      expireTime: 3600 // 1小时过期时间（秒）
    };
    
    // 1. 持久化保存到MongoDB
    let mongodbResult = await mongodbService.saveUserDataMongo(userId, userData, redisConfig);
    
    // 2. 缓存到Redis（设置1小时过期）
    const redisResult = await redisService.saveUserDataRedis(userId, userData);
    
    // 确保MongoDB和Redis数据同步 - 添加重试机制
    let finalRedisResult = redisResult;
    
    // 如果MongoDB保存成功但Redis缓存失败，尝试重试Redis操作
    if (mongodbResult && !redisResult) {
      console.warn('MongoDB保存成功，但Redis缓存失败，开始重试...');
      // 最多重试2次
      let redisRetry = 0;
      const maxRedisRetries = 2;
      
      while (redisRetry < maxRedisRetries) {
        redisRetry++;
        console.log(`Redis缓存重试 ${redisRetry}/${maxRedisRetries}`);
        const retryResult = await redisService.saveUserDataRedis(userId, userData);
        if (retryResult) {
          console.log('Redis缓存重试成功');
          finalRedisResult = true;
          break;
        }
        // 等待1秒后重试
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } 
    
    // 如果MongoDB保存失败但Redis缓存成功，尝试重试MongoDB操作
    else if (!mongodbResult && redisResult) {
      console.warn('Redis缓存成功，但MongoDB保存失败，开始重试...');
      // 最多重试2次
      let mongoRetry = 0;
      const maxMongoRetries = 2;
      
      while (mongoRetry < maxMongoRetries) {
        mongoRetry++;
        console.log(`MongoDB保存重试 ${mongoRetry}/${maxMongoRetries}`);
        const retryResult = await mongodbService.saveUserDataMongo(userId, userData, redisConfig);
        if (retryResult) {
          console.log('MongoDB保存重试成功');
          mongodbResult = true;
          break;
        }
        // 等待1秒后重试
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // 记录最终同步状态
    console.log(`数据保存完成 - MongoDB: ${mongodbResult ? '成功' : '失败'}, Redis: ${finalRedisResult ? '成功' : '失败'}`);
    
    // 返回MongoDB的保存结果（以持久化存储为准）
    return mongodbResult;
  } catch (error) {
    console.error('保存用户数据失败:', error);
    return false;
  }
}

/**
 * 获取用户数据 - MongoDB和Redis两级存储策略
 * 优先从Redis缓存获取，其次从MongoDB
 * 即使获取失败也确保应用正常运行
 * 添加重试机制，最多尝试3次后停止
 */
export async function getUserData(phone: string): Promise<any | null> {
  if (!phone) {
    console.log('未提供手机号，跳过用户数据获取');
    return null;
  }
  
  let retryCount = 0;
  const maxRetries = 3;
  
  while (retryCount < maxRetries) {
    retryCount++;
    try {
      console.log(`尝试获取用户数据 (${retryCount}/${maxRetries}): phone=${phone}`);
      
      // 生成用户ID
      const userId = generateUserId(phone);
      
      // 1. 尝试从Redis缓存获取（1小时内的数据）
      try {
        const redisData = await redisService.getUserDataRedis(userId, phone);
        if (redisData) {
          console.log('从Redis缓存获取用户数据成功');
          return redisData;
        }
      } catch (redisError: unknown) {
        console.warn('Redis获取失败，但继续尝试MongoDB:', redisError);
      }
      
      // 2. 从MongoDB获取（持久化数据）
      try {
        const mongoData = await mongodbService.getUserDataMongo(userId, phone);
        if (mongoData) {
          console.log('从MongoDB获取用户数据成功');
          // 尝试更新Redis缓存，但即使失败也不影响返回结果
          try {
            await redisService.saveUserDataRedis(userId, mongoData);
          } catch (cacheError: unknown) {
            console.warn('更新Redis缓存失败，但不影响数据获取:', cacheError);
          }
          return mongoData;
        }
      } catch (mongoError: unknown) {
        console.warn('MongoDB获取失败:', mongoError);
      }
      
      console.log('无法从Redis或MongoDB获取用户数据，返回null');
      return null;
    } catch (error) {
      console.error(`第${retryCount}次获取用户数据失败:`, error);
      if (retryCount >= maxRetries) {
        console.log(`已达到最大重试次数(${maxRetries})，停止重试`);
        // 确保即使发生任何错误，也返回null而不是抛出异常
        return null;
      }
      // 等待一段时间后重试
      await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
    }
  }
  
  return null;
}

// 不再需要localStorage相关的异步更新函数

/**
 * 保存聊天记录 - MongoDB存储策略
 */
export async function saveChatHistory(phone: string, messages: any[]): Promise<boolean> {
  try {
    if (!phone || !Array.isArray(messages) || messages.length === 0) {
      return false;
    }
    
    // 尝试获取用户数据，以获取MongoDB中的_id
    let user_id: string;
    const userData = await getUserData(phone);
    
    if (userData && userData._id) {
      // 使用MongoDB中的_id作为user_id
      user_id = userData._id;
      console.log('使用MongoDB用户ID:', user_id);
    } else {
      // 如果获取不到用户数据或_id，使用基于手机号生成的userId作为后备方案
      user_id = generateUserId(phone);
      console.log('使用基于手机号生成的用户ID（后备方案）:', user_id);
    }
    
    // 保存到MongoDB（持久化存储）
    return await mongodbService.saveChatHistoryMongo(user_id, messages, phone);
  } catch (error) {
    console.error('保存聊天记录失败:', error);
    return false;
  }
}

/**
 * 获取聊天记录 - MongoDB和Redis存储策略
 * 添加重试机制，最多尝试3次后停止
 */
export async function getChatHistory(phone: string): Promise<any[]> {
  if (!phone) {
    return [];
  }
  
  let retryCount = 0;
  const maxRetries = 3;
  
  while (retryCount < maxRetries) {
    retryCount++;
    try {
      console.log(`尝试获取聊天记录 (${retryCount}/${maxRetries}): phone=${phone}`);
      
      // 直接从MongoDB获取聊天记录（后端会优先从Redis缓存获取）
      const history = await mongodbService.getChatHistoryMongo(phone);
      
      return history || [];
    } catch (error) {
      console.error(`第${retryCount}次获取聊天记录失败:`, error);
      if (retryCount >= maxRetries) {
        console.log(`已达到最大重试次数(${maxRetries})，停止重试`);
        return [];
      }
      // 等待一段时间后重试
      await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
    }
  }
  
  return [];
}

// 不再需要localStorage相关的异步更新函数

/**
 * 清除用户数据 - 清除Redis缓存，保留MongoDB持久化数据
 */
/**
 * 设置当前使用的手机号
 */
export function setCurrentPhone(phone: string): void {
  try {
    if (phone) {
      sessionStorage.setItem('currentPhone', phone);
      console.log('当前手机号已设置为:', phone);
    }
  } catch (error) {
    console.error('设置手机号到sessionStorage失败:', error);
  }
}

/**
 * 获取存储的手机号
 */
export function getStoredPhone(): string | null {
  try {
    const phone = sessionStorage.getItem('currentPhone');
    console.log('获取存储的手机号:', phone || '未找到');
    return phone;
  } catch (error) {
    console.error('从sessionStorage获取手机号失败:', error);
    return null;
  }
}

/**
 * 清除用户数据 - 清除Redis缓存，保留MongoDB持久化数据
 */
export async function clearUserData(phone: string): Promise<boolean> {
  try {
    // 生成用户ID
    const userId = generateUserId(phone);
    
    // 清除Redis缓存
    return await redisService.clearRedisCache(userId);
  } catch (error) {
    console.error('清除数据失败:', error);
    return false;
  }
}

/**
 * 生成用户ID的辅助方法
 */
function generateUserId(phone: string): string {
  return `user_${phone}`;
}