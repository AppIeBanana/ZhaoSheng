// 应用配置文件
// 所有配置值从环境变量读取，不在代码中硬编码敏感信息
// 请在 .env.development 或 .env.production 文件中配置

const env = import.meta.env;

// 微信服务器验证配置
export const WECHAT_CONFIG = {
  TOKEN: env.VITE_WECHAT_TOKEN || '',
};

// API配置
export const API_CONFIG = {
  AUTH_TOKEN: env.VITE_COZE_AUTH_TOKEN || '',
  API_URL: env.VITE_COZE_API_URL || 'https://api.coze.cn/v3/chat',
  BOT_ID: env.VITE_COZE_BOT_ID || '',
  WORKFLOW_ID: env.VITE_COZE_WORKFLOW_ID || '',
};

// 配置验证：确保必要的环境变量已设置
if (!API_CONFIG.AUTH_TOKEN) {
  console.warn('⚠️ 警告: VITE_COZE_AUTH_TOKEN 未设置，请检查环境变量配置');
}
if (!API_CONFIG.BOT_ID) {
  console.warn('⚠️ 警告: VITE_COZE_BOT_ID 未设置，请检查环境变量配置');
}
if (!API_CONFIG.WORKFLOW_ID) {
  console.warn('⚠️ 警告: VITE_COZE_WORKFLOW_ID 未设置，请检查环境变量配置');
}