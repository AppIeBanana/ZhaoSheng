// 前端环境配置加载器
// 直接定义环境配置，不依赖.env文件

// 获取当前环境（如果没有设置，默认为production）
const currentEnv = 'development';

// 生产环境配置（从.env文件获取的值）
const productionConfig = {
  // 前端应用配置 
  appTitle: '福软招生智能问答',
  
  // 后端API配置
  backendApiUrl: 'https://zswd.fzrjxy.com:4431',
  
  // Redis配置
  redisHost: '10.26.1.20',
  redisPort: 6379,
  redisPassword: 'plk741023',
  
  // Coze API配置（使用默认值）
  cozeAuthToken: 'sat_7Qnr3CY75R4HT1RJcLi0h4hS35aurFuT0Ow4uAAna9OAyfHzpQnnRlZ9kNT3qMZI',
  cozeApiUrl: 'https://api.coze.cn/v3/chat',
  cozeBotId: '7553550342269550632',
  cozeWorkflowId: '7553548989958930470',
  
  // 服务器配置
  port: 4431,
  
  // SSL证书路径（生产环境）
  sslCertPath: '/etc/letsencrypt/live/zswd.fzrjxy.com/fullchain.pem',
  sslKeyPath: '/etc/letsencrypt/live/zswd.fzrjxy.com/privkey.pem',
  
  // 环境标识
  isDevelopment: false,
  isProduction: true
};

// 开发环境配置（从.env文件获取的值）
const developmentConfig = {
  // 前端应用配置
  appTitle: '福软招生智能问答',
  
  // 后端API配置
  backendApiUrl: 'http://localhost:3001',
  
  // Redis配置
  redisHost: '172.21.9.233',
  redisPort: 6379,
  redisPassword: 'redisadmin',
  
  // Coze API配置（使用默认值）
  cozeAuthToken: 'sat_7Qnr3CY75R4HT1RJcLi0h4hS35aurFuT0Ow4uAAna9OAyfHzpQnnRlZ9kNT3qMZI',
  cozeApiUrl: 'https://api.coze.cn/v3/chat',
  cozeBotId: '7553550342269550632',
  cozeWorkflowId: '7553548989958930470',
  
  // 服务器配置
  port: 3001,
  
  // 环境标识
  isDevelopment: true,
  isProduction: false
};

// 根据当前环境选择配置
let config = currentEnv.indexOf('development') >= 0 ? developmentConfig : productionConfig;

// 允许环境变量覆盖默认配置
config = {
  ...config,
  // 后端API配置覆盖
  backendApiUrl: import.meta.env.VITE_BACKEND_API_URL || 
                (currentEnv.indexOf('production') >= 0 ? 
                  import.meta.env.VITE_PROD_BACKEND_API_URL : 
                  import.meta.env.VITE_DEV_BACKEND_API_URL) || 
                config.backendApiUrl,
  // 应用标题覆盖
  appTitle: import.meta.env.VITE_APP_TITLE || config.appTitle,
  // Redis配置覆盖
  redisHost: import.meta.env.VITE_REDIS_HOST || 
            (currentEnv.indexOf('production') >= 0 ? 
              import.meta.env.VITE_PROD_REDIS_HOST : 
              import.meta.env.VITE_DEV_REDIS_HOST) || 
            config.redisHost,
  redisPort: import.meta.env.VITE_REDIS_PORT || 
             (currentEnv.indexOf('production') >= 0 ? 
               import.meta.env.VITE_PROD_REDIS_PORT : 
               import.meta.env.VITE_DEV_REDIS_PORT) || 
             config.redisPort,
  redisPassword: import.meta.env.VITE_REDIS_PASSWORD || 
                 (currentEnv.indexOf('production') >= 0 ? 
                   import.meta.env.VITE_PROD_REDIS_PASSWORD : 
                   import.meta.env.VITE_DEV_REDIS_PASSWORD) || 
                 config.redisPassword,
  // Coze API配置覆盖
  cozeAuthToken: import.meta.env.VITE_COZE_AUTH_TOKEN || config.cozeAuthToken,
  cozeApiUrl: import.meta.env.VITE_COZE_API_URL || config.cozeApiUrl,
  cozeBotId: import.meta.env.VITE_COZE_BOT_ID || config.cozeBotId,
  cozeWorkflowId: import.meta.env.VITE_COZE_WORKFLOW_ID || config.cozeWorkflowId,
  // 端口配置覆盖
  port: import.meta.env.VITE_PORT || 
        (currentEnv.indexOf('production') >= 0 ? 
          import.meta.env.VITE_PROD_PORT : 
          import.meta.env.VITE_DEV_PORT) || 
        config.port
};

// 导出配置
console.log(`环境配置已加载: ${currentEnv}`);
export default config;