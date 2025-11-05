// 前端环境配置加载器
// 根据NODE_ENV自动加载对应的环境变量配置

// 获取当前环境
const currentEnv = import.meta.env.NODE_ENV || 'development';

// 统一环境变量配置（不区分环境的变量）
const commonConfig = {
  // 前端应用配置
  appTitle: import.meta.env.VITE_APP_TITLE || '招生智能问答',
  
  // Coze API配置
  cozeAuthToken: import.meta.env.VITE_COZE_AUTH_TOKEN,
  cozeApiUrl: import.meta.env.VITE_COZE_API_URL,
  cozeBotId: import.meta.env.VITE_COZE_BOT_ID,
  cozeWorkflowId: import.meta.env.VITE_COZE_WORKFLOW_ID
};

// 开发环境配置
const devConfig = {
  ...commonConfig,
  // 后端API配置
  backendApiUrl: import.meta.env.VITE_DEV_BACKEND_API_URL,
  
  // Redis配置
  redisHost: import.meta.env.VITE_DEV_REDIS_HOST,
  redisPort: import.meta.env.VITE_DEV_REDIS_PORT,
  redisPassword: import.meta.env.VITE_DEV_REDIS_PASSWORD,
  
  // 环境标识
  isDevelopment: true,
  isProduction: false
};

// 生产环境配置
const prodConfig = {
  ...commonConfig,
  // 后端API配置
  backendApiUrl: import.meta.env.VITE_PROD_BACKEND_API_URL,
  
  // Redis配置
  redisHost: import.meta.env.VITE_PROD_REDIS_HOST,
  redisPort: import.meta.env.VITE_PROD_REDIS_PORT,
  redisPassword: import.meta.env.VITE_PROD_REDIS_PASSWORD,
  
  // 服务器配置
  port: import.meta.env.VITE_PROD_PORT,
  
  // SSL配置
  sslCertPath: import.meta.env.VITE_PROD_SSL_CERT_PATH,
  sslKeyPath: import.meta.env.VITE_PROD_SSL_KEY_PATH,
  
  // 环境标识
  isDevelopment: false,
  isProduction: true
};

// 根据当前环境选择配置
const config = currentEnv === 'production' ? prodConfig : devConfig;

// 导出配置
console.log(`环境配置已加载: ${currentEnv}`);
export default config;