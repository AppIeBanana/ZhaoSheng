// 环境配置加载器
// 直接定义环境配置，不依赖.env文件

// 获取当前环境（如果没有设置，默认为production）
const NODE_ENV = 'production';

// 生产环境配置（从.env文件获取的值）
const productionConfig = {
  // 服务器配置
  PORT: 4431,
  
  // MongoDB配置
  MONGODB_URI: 'mongodb://10.26.1.20:27017',
  MONGODB_USER: 'root',
  MONGODB_PASSWORD: 'plk741023',
  MONGODB_DB_NAME: 'stu_recruit',
  
  // Redis配置
  REDIS_HOST: '10.26.1.20',
  REDIS_PORT: 6379,
  REDIS_PASSWORD: 'plk741023',
  REDIS_DB: 0,
  
  // 日志配置
  LOG_DIR: '/app/backend/logs',
  
  // API配置
  BACKEND_API_URL: 'https://zswd.fzrjxy.com:4431'
};

// 开发环境配置（从.env文件获取的值）
const developmentConfig = {
  // 服务器配置
  PORT: 3001,
  
  // MongoDB配置
  MONGODB_URI: 'mongodb://10.26.1.20:27017',
  MONGODB_USER: 'root',
  MONGODB_PASSWORD: 'plk741023',
  MONGODB_DB_NAME: 'stu_recruit',
  
  // Redis配置
  REDIS_HOST: '10.26.1.20', // 使用backend/.env中的值
  REDIS_PORT: 6379,
  REDIS_PASSWORD: 'plk741023',
  REDIS_DB: 0,
  
  // 日志配置
  LOG_DIR: './logs',
  
  // API配置
  BACKEND_API_URL: 'http://localhost:3001'
};

// 环境配置映射
const envConfigs = {
  development: developmentConfig,
  production: productionConfig
};

// 获取当前环境的配置（优先使用环境变量覆盖配置文件中的值）
const config = {
  ...(NODE_ENV.indexOf('development') >= 0 ? developmentConfig : productionConfig),
  // 允许系统环境变量覆盖配置文件中的值
  PORT: process.env.PORT || process.env.VITE_DEV_PORT || process.env.VITE_PROD_PORT || (NODE_ENV.indexOf('development') >= 0 ? developmentConfig.PORT : productionConfig.PORT),
  MONGODB_URI: process.env.MONGODB_URI || process.env.VITE_DEV_MONGODB_URI || process.env.VITE_PROD_MONGODB_URI || (NODE_ENV.indexOf('development') >= 0 ? developmentConfig.MONGODB_URI : productionConfig.MONGODB_URI),
  MONGODB_USER: process.env.MONGODB_USER || process.env.VITE_DEV_MONGODB_USER || process.env.VITE_PROD_MONGODB_USER || (NODE_ENV.indexOf('development') >= 0 ? developmentConfig.MONGODB_USER : productionConfig.MONGODB_USER),
  MONGODB_PASSWORD: process.env.MONGODB_PASSWORD || process.env.VITE_DEV_MONGODB_PASSWORD || process.env.VITE_PROD_MONGODB_PASSWORD || (NODE_ENV.indexOf('development') >= 0 ? developmentConfig.MONGODB_PASSWORD : productionConfig.MONGODB_PASSWORD),
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || process.env.VITE_DEV_MONGODB_DB_NAME || process.env.VITE_PROD_MONGODB_DB_NAME || (NODE_ENV.indexOf('development') >= 0 ? developmentConfig.MONGODB_DB_NAME : productionConfig.MONGODB_DB_NAME),
  REDIS_HOST: process.env.REDIS_HOST || process.env.VITE_DEV_REDIS_HOST || process.env.VITE_PROD_REDIS_HOST || (NODE_ENV.indexOf('development') >= 0 ? developmentConfig.REDIS_HOST : productionConfig.REDIS_HOST),
  REDIS_PORT: process.env.REDIS_PORT || process.env.VITE_DEV_REDIS_PORT || process.env.VITE_PROD_REDIS_PORT || (NODE_ENV.indexOf('development') >= 0 ? developmentConfig.REDIS_PORT : productionConfig.REDIS_PORT),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || process.env.VITE_DEV_REDIS_PASSWORD || process.env.VITE_PROD_REDIS_PASSWORD || (NODE_ENV.indexOf('development') >= 0 ? developmentConfig.REDIS_PASSWORD : productionConfig.REDIS_PASSWORD),
  REDIS_DB: process.env.REDIS_DB || process.env.VITE_DEV_REDIS_DB || process.env.VITE_PROD_REDIS_DB || (NODE_ENV.indexOf('development') >= 0 ? developmentConfig.REDIS_DB : productionConfig.REDIS_DB),
  LOG_DIR: process.env.LOG_DIR || process.env.VITE_DEV_LOG_DIR || process.env.VITE_PROD_LOG_DIR || (NODE_ENV.indexOf('development') >= 0 ? developmentConfig.LOG_DIR : productionConfig.LOG_DIR),
  BACKEND_API_URL: process.env.BACKEND_API_URL || process.env.VITE_DEV_BACKEND_API_URL || process.env.VITE_PROD_BACKEND_API_URL || (NODE_ENV.indexOf('development') >= 0 ? developmentConfig.BACKEND_API_URL : productionConfig.BACKEND_API_URL)
};

// 确保端口是数字类型
config.PORT = parseInt(config.PORT, 10);
config.REDIS_PORT = parseInt(config.REDIS_PORT, 10);
config.REDIS_DB = parseInt(config.REDIS_DB, 10);

// 导出配置（使用CommonJS模块系统）
module.exports = {
  default: config,
  NODE_ENV
};