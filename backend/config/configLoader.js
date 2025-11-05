// 环境配置加载器
// 加载环境变量
require('dotenv').config();

// 获取当前环境
const NODE_ENV = process.env.NODE_ENV;

// 环境配置映射
const envConfigs = {
  development: {
    // 开发环境配置
    PORT: process.env.VITE_DEV_PORT,
    MONGODB_URI: process.env.VITE_DEV_MONGODB_URI,
    MONGODB_USER: process.env.VITE_DEV_MONGODB_USER,
    MONGODB_PASSWORD: process.env.VITE_DEV_MONGODB_PASSWORD,
    MONGODB_DB_NAME: process.env.VITE_DEV_MONGODB_DB_NAME,
    REDIS_HOST: process.env.VITE_DEV_REDIS_HOST,
    REDIS_PORT: process.env.VITE_DEV_REDIS_PORT,
    REDIS_PASSWORD: process.env.VITE_DEV_REDIS_PASSWORD,
    REDIS_DB: process.env.VITE_DEV_REDIS_DB,
    LOG_DIR: process.env.VITE_DEV_LOG_DIR,
    BACKEND_API_URL: process.env.VITE_DEV_BACKEND_API_URL
  },
  production: {
    // 生产环境配置
    PORT: process.env.VITE_PROD_PORT,
    MONGODB_URI: process.env.VITE_PROD_MONGODB_URI,
    MONGODB_USER: process.env.VITE_PROD_MONGODB_USER,
    MONGODB_PASSWORD: process.env.VITE_PROD_MONGODB_PASSWORD,
    MONGODB_DB_NAME: process.env.VITE_PROD_MONGODB_DB_NAME,
    REDIS_HOST: process.env.VITE_PROD_REDIS_HOST,
    REDIS_PORT: process.env.VITE_PROD_REDIS_PORT,
    REDIS_PASSWORD: process.env.VITE_PROD_REDIS_PASSWORD,
    REDIS_DB: process.env.VITE_PROD_REDIS_DB,
    LOG_DIR: process.env.VITE_PROD_LOG_DIR,
    BACKEND_API_URL: process.env.VITE_PROD_BACKEND_API_URL
  }
};

// 获取当前环境的配置
const config = envConfigs[NODE_ENV] || envConfigs.development;

// 导出配置（使用CommonJS模块系统）
module.exports = {
  default: config,
  NODE_ENV
};