// MongoDB数据库连接配置
const mongoose = require('mongoose');
const { mongodbLogger } = require('../utils/logger');
const configLoader = require('./configLoader');
const config = configLoader.default || {};
let mongooseConnection;

// 连接重试配置
const MAX_RETRIES = 3;
const RETRY_DELAY = 3000; // 3秒

/**
 * 连接MongoDB数据库 - 带重试机制
 * @returns {Promise<boolean>} 连接是否成功
 */
async function connectMongoDB() {
  let retries = 0;
  
  while (retries < MAX_RETRIES) {
    try {
      // 使用配置加载器获取MongoDB配置
      const baseURI = config.MONGODB_URI || 'mongodb://localhost:27017';
      const user = config.MONGODB_USER;
      const password = config.MONGODB_PASSWORD;
      const dbName = config.MONGODB_DB_NAME || 'zhaosheng';
      
      // 构建带认证的连接字符串
      let mongoURI;
      
      // 正确构建连接字符串，确保格式正确
      if (user && password) {
        // 移除mongodb://前缀以便正确构建
        const baseUriWithoutPrefix = baseURI.replace('mongodb://', '');
        // 构建包含认证信息的连接字符串
        mongoURI = `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${baseUriWithoutPrefix}/${dbName}?authSource=admin&retryWrites=true&w=majority`;
      } else {
        // 如果没有认证信息，直接使用基础URI和数据库名
        const baseUriWithoutTrailingSlash = baseURI.endsWith('/') ? baseURI.slice(0, -1) : baseURI;
        mongoURI = `${baseUriWithoutTrailingSlash}/${dbName}?retryWrites=true&w=majority`;
      }
      
      // 配置Mongoose连接选项（使用现代Mongoose支持的选项）
      const mongooseOptions = {
        serverSelectionTimeoutMS: 10000, // 增加服务器选择超时时间到10秒
        socketTimeoutMS: 60000,         // 增加套接字超时时间到60秒
        family: 4,                      // 使用IPv4
        maxPoolSize: 20,                // 增加连接池大小
        minPoolSize: 5,                 // 设置最小连接池大小
        heartbeatFrequencyMS: 10000,    // 心跳频率
        autoIndex: false,               // 禁用自动索引创建
        bufferCommands: true,           // 启用命令缓冲
        connectTimeoutMS: 15000         // 连接超时时间
      };
      
      // 断开可能存在的旧连接
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
        mongodbLogger.info('旧MongoDB连接已断开');
      }
      
      // 建立新连接
      mongooseConnection = await mongoose.connect(mongoURI, mongooseOptions);
      
      // 设置连接事件监听器
      mongoose.connection.on('error', (err) => {
        mongodbLogger.error('MongoDB连接错误:', { error: err.message });
      });
      
      mongoose.connection.on('disconnected', () => {
        mongodbLogger.warn('MongoDB连接已断开，将尝试重新连接');
      });
      
      mongoose.connection.on('reconnected', () => {
        mongodbLogger.info('MongoDB连接已重新建立');
      });
      
      mongodbLogger.info('MongoDB连接成功', { uri: maskPassword(mongoURI) });
      
      // 延迟初始化索引操作，避免影响连接成功状态判断
      setTimeout(() => {
        cleanupUnusedIndexes();
      }, 2000);
      
      return true;
    } catch (error) {
      retries++;
      mongodbLogger.error(`MongoDB连接失败 (尝试 ${retries}/${MAX_RETRIES}):`, { error: error.message });
      
      if (retries < MAX_RETRIES) {
        mongodbLogger.info(`将在 ${RETRY_DELAY/1000} 秒后重试连接...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      } else {
        mongodbLogger.error('MongoDB连接重试次数已耗尽，连接失败');
        return false;
      }
    }
  }
  
  return false;
}

/**
 * 清理未使用的索引
 */
async function cleanupUnusedIndexes() {
  try {
    // 获取User模型（需要在模型定义加载后执行）
    const UserModel = mongoose.models.User;
    if (UserModel && mongoose.connection.readyState === 1) {
      // 检查并删除username索引
      const indexes = await UserModel.collection.indexes();
      const hasUsernameIndex = indexes.some(index => index.key && index.key.username !== undefined);
      
      if (hasUsernameIndex) {
        mongodbLogger.info('检测到username索引，尝试删除...');
        await UserModel.collection.dropIndex('username_1');
        mongodbLogger.info('username索引已删除');
      }
    }
  } catch (indexError) {
    mongodbLogger.warn(`删除username索引时出错（可能索引不存在）: ${indexError.message}`);
  }
}

/**
 * 掩码密码，用于日志记录
 */
function maskPassword(uri) {
  return uri.replace(/mongodb:\/\/(.*?):(.*?)@/, 'mongodb://$1:****@');
}

/**
 * 获取MongoDB连接状态
 * @returns {boolean} 是否已连接
 */
function isMongoConnected() {
  return mongooseConnection && mongooseConnection.connection.readyState === 1;
}

module.exports = {
  connectMongoDB,
  isMongoConnected
};