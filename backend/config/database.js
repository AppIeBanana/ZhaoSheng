// MongoDB数据库连接配置
const mongoose = require('mongoose');
let mongooseConnection;

/**
 * 连接MongoDB数据库
 * @returns {Promise<boolean>} 连接是否成功
 */
async function connectMongoDB() {
  try {
    // 直接使用.env文件中的MongoDB配置构建连接字符串
    // 移除所有硬编码的默认值，完全依赖环境变量
    const baseURI = process.env.MONGODB_URI || '';
    const user = process.env.MONGODB_USER || '';
    const password = process.env.MONGODB_PASSWORD || '';
    const dbName = process.env.MONGODB_DB_NAME || '';
    
    // 构建带认证的连接字符串
    let mongoURI;
    
    // 正确构建连接字符串，确保格式正确
    if (user && password) {
      // 移除mongodb://前缀以便正确构建
      const baseUriWithoutPrefix = baseURI.replace('mongodb://', '');
      // 构建包含认证信息的连接字符串
      mongoURI = `mongodb://${user}:${password}@${baseUriWithoutPrefix}/${dbName}?authSource=admin`;
    } else {
      // 如果没有认证信息，直接使用基础URI和数据库名
      const baseUriWithoutTrailingSlash = baseURI.endsWith('/') ? baseURI.slice(0, -1) : baseURI;
      mongoURI = `${baseUriWithoutTrailingSlash}/${dbName}`;
    }
    
    mongooseConnection = await mongoose.connect(mongoURI, {
      // 只使用Mongoose明确支持的选项
      serverSelectionTimeoutMS: 5000, // 服务器选择超时时间
      socketTimeoutMS: 45000,        // 套接字超时时间
      family: 4,                     // 使用IPv4
      maxPoolSize: 10                // 最大连接池大小
    });
    
    console.log('MongoDB连接成功');
    
    // 尝试删除不需要的username索引以避免重复键错误
    try {
      // 获取User模型（需要在模型定义加载后执行）
      const UserModel = mongoose.models.User;
      if (UserModel) {
        // 检查并删除username索引
        const indexes = await UserModel.collection.indexes();
        const hasUsernameIndex = indexes.some(index => index.key && index.key.username !== undefined);
        
        if (hasUsernameIndex) {
          console.log('检测到username索引，尝试删除...');
          await UserModel.collection.dropIndex('username_1');
          console.log('username索引已删除');
        }
      }
    } catch (indexError) {
      console.log(`删除username索引时出错（可能索引不存在）: ${indexError.message}`);
    }
    
    return true;
  } catch (error) {
    console.error('MongoDB连接失败:', error.message);
    return false;
  }
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