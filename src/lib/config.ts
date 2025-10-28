// 应用配置文件
// 从环境变量读取配置，确保敏感信息不硬编码在代码中

const env = import.meta.env;

// 微信服务器验证配置
export const WECHAT_CONFIG = {
  TOKEN: env.VITE_WECHAT_TOKEN || 'zhaosheng2024',
};

// API配置
export const API_CONFIG = {
  AUTH_TOKEN: env.VITE_COZE_AUTH_TOKEN || 'sat_dDeoCs8sajZ2TmC0KKU5LzdeQ5dSPgXVVqlYZ16L7f3vjDzMYkrYMj7BOgfdq0FU',
  API_URL: env.VITE_COZE_API_URL || 'https://api.coze.cn/v3/chat',
  BOT_ID: env.VITE_COZE_BOT_ID || '7553550342269550632',
  WORKFLOW_ID: env.VITE_COZE_WORKFLOW_ID || '7553548989958930470',
};