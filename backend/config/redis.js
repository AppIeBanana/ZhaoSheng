// Redis配置和连接管理
const redis = require('redis');
const { promisify } = require('util');
const { redisLogger } = require('../utils/logger');

// 获取Redis配置
function getRedisConfig() {
  const config = require('./configLoader').default;
  
  return {
    host: config.REDIS_HOST ,
    port: parseInt(config.REDIS_PORT, 10),
    password: config.REDIS_PASSWORD
  };
}

// 创建Redis客户端
let redisClient = null;

// 初始化Redis客户端
async function initializeRedis() {
  try {
    const config = getRedisConfig();
    
    redisLogger.info(`初始化Redis连接: ${config.host}:${config.port}`);
    console.log(`初始化Redis连接: ${config.host}:${config.port}`);
    
    // 创建新的Redis客户端
    redisClient = redis.createClient({
      url: config.password 
        ? `redis://:${encodeURIComponent(config.password)}@${config.host}:${config.port}` 
        : `redis://${config.host}:${config.port}`,
      password: config.password,
      db: 0,
      socket: {
        reconnectStrategy: (retries) => {
          const delay = Math.min(retries * 100, 3000);
          redisLogger.warn(`Redis尝试第 ${retries} 次重连，延迟 ${delay}ms`);
          console.log(`Redis尝试第 ${retries} 次重连，延迟 ${delay}ms`);
          return delay;
        },
        connectTimeout: 10000
      }
    });
    
    // 连接事件处理
    redisClient.on('connect', () => {
      redisLogger.info('Redis客户端已连接');
      console.log('Redis客户端已连接');
    });
    
    redisClient.on('error', (err) => {
      redisLogger.error('Redis连接错误:', { error: err.message, stack: err.stack });
      console.error('Redis连接错误:', err);
    });
    
    redisClient.on('end', () => {
      redisLogger.info('Redis连接已关闭');
      console.log('Redis连接已关闭');
    });
    
    redisClient.on('reconnecting', (info) => {
      redisLogger.warn(`Redis重新连接中，延迟: ${info.delay}ms, 尝试次数: ${info.attempt}`);
      console.log(`Redis重新连接中，延迟: ${info.delay}ms, 尝试次数: ${info.attempt}`);
    });
    
    // 转换Promise方法 - 使用更安全的方式
    // 现代Redis客户端已经原生返回Promise，直接赋值
    if (typeof redisClient.get === 'function' && !redisClient.getAsync) {
      redisClient.getAsync = redisClient.get;
    }
    if (typeof redisClient.set === 'function' && !redisClient.setAsync) {
      redisClient.setAsync = redisClient.set;
    }
    if (typeof redisClient.del === 'function' && !redisClient.delAsync) {
      redisClient.delAsync = redisClient.del;
    }
    if (typeof redisClient.expire === 'function' && !redisClient.expireAsync) {
      redisClient.expireAsync = redisClient.expire;
    }
    
    // 尝试连接
    await redisClient.connect();
    redisLogger.info('Redis初始化连接成功');
    console.log('Redis初始化连接成功');
    return true;
  } catch (error) {
    redisLogger.error('Redis初始化失败:', { error: error.message, stack: error.stack });
    console.error('Redis初始化失败:', error);
    return false;
  }
}

// 检查Redis连接状态
async function ensureConnection() {
  try {
    if (!redisClient || !redisClient.isOpen) {
      redisLogger.info('Redis连接不可用，尝试初始化...');
      console.log('Redis连接不可用，尝试初始化...');
      return await initializeRedis();
    }
    
    // 测试连接
    await redisClient.ping();
    return true;
  } catch (error) {
    redisLogger.error('Redis连接测试失败:', { error: error.message, stack: error.stack });
    console.error('Redis连接测试失败:', error);
    return false;
  }
}

/**
 * 重新连接到Redis（使用新配置）
 * @param {string} host Redis主机
 * @param {number} port Redis端口
 * @param {string} password Redis密码
 * @returns {Promise<boolean>} 连接是否成功
 */
async function reconnectRedis(host, port, password = null) {
  try {
    // 如果已有连接，先断开
    if (redisClient && redisClient.isOpen) {
      try {
        await redisClient.disconnect();
      } catch (e) {
        console.warn('关闭现有Redis连接时出错:', e);
      }
    }
    
    // 创建临时配置对象
    const tempConfig = {
      host: host || getRedisConfig().host,
      port: port ? parseInt(port, 10) : getRedisConfig().port,
      password: password || getRedisConfig().password
    };
    
    // 直接使用临时配置创建新的Redis客户端
    redisLogger.info(`重新初始化Redis连接: ${tempConfig.host}:${tempConfig.port}`);
    console.log(`重新初始化Redis连接: ${tempConfig.host}:${tempConfig.port}`);
    
    redisClient = redis.createClient({
      url: tempConfig.password 
        ? `redis://:${encodeURIComponent(tempConfig.password)}@${tempConfig.host}:${tempConfig.port}` 
        : `redis://${tempConfig.host}:${tempConfig.port}`,
      password: tempConfig.password,
      db: 0,
      socket: {
        reconnectStrategy: (retries) => {
          const delay = Math.min(retries * 100, 3000);
          redisLogger.warn(`Redis尝试第 ${retries} 次重连，延迟 ${delay}ms`);
          console.log(`Redis尝试第 ${retries} 次重连，延迟 ${delay}ms`);
          return delay;
        },
        connectTimeout: 10000
      }
    });
    
    // 重新绑定事件处理器
    redisClient.on('connect', () => {
      redisLogger.info('Redis客户端已连接');
      console.log('Redis客户端已连接');
    });
    
    redisClient.on('error', (err) => {
      redisLogger.error('Redis连接错误:', { error: err.message, stack: err.stack });
      console.error('Redis连接错误:', err);
    });
    
    // 尝试连接
    await redisClient.connect();
    redisLogger.info('Redis重新连接成功');
    console.log('Redis重新连接成功');
    return true;
  } catch (error) {
    console.error('Redis重新连接失败:', error);
    redisLogger.error('Redis重新连接失败:', { error: error.message, stack: error.stack });
    return false;
  }
}

// 导出模块
module.exports = {
  get redisClient() {
    return redisClient;
  },
  initializeRedis,
  ensureConnection,
  ensureRedisConnection: ensureConnection,
  reconnectRedis,
  getConfig: getRedisConfig
};

// 自动初始化
initializeRedis();