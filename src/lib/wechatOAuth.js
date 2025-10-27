// 微信OAuth授权处理模块
// 此模块用于在服务器端安全地处理微信授权流程

import crypto from 'crypto';
import https from 'https';
import url from 'url';
import querystring from 'querystring';

// 从环境变量或配置文件获取微信配置
class WechatOAuth {
  constructor(options = {}) {
    // 使用传入的配置或默认值
    this.appId = options.appId || process.env.WECHAT_APPID;
    this.appSecret = options.appSecret || process.env.WECHAT_APPSECRET;
    // 重定向URI应该指向服务器的回调端点，而不是前端页面
    this.redirectUri = options.redirectUri || process.env.WECHAT_REDIRECT_URI;
    this.scope = options.scope || process.env.WECHAT_SCOPE;
    
    // 用于存储state参数的缓存（生产环境应使用Redis等持久化存储）
    this.stateCache = new Map();
    
    console.log('微信OAuth配置初始化完成');
  }

  /**
   * 生成安全的state参数并返回授权URL
   * @param {string} dialogId - 对话ID，用于后续关联
   * @returns {string} - 微信授权URL
   */
  generateAuthUrl(dialogId) {
    // 生成随机的state参数，包含时间戳以防止重放攻击
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(16).toString('hex');
    const state = `${dialogId}_${timestamp}_${randomString}`;
    
    // 将state参数存储在缓存中，设置过期时间（10分钟）
    this.stateCache.set(state, {
      dialogId,
      timestamp,
      createdAt: new Date()
    });
    
    // 定期清理过期的state参数
    this.cleanupExpiredStates();
    
    // 构建微信授权URL
    const baseUrl = 'https://open.weixin.qq.com/connect/oauth2/authorize';
    const params = {
      appid: this.appId,
      redirect_uri: encodeURIComponent(this.redirectUri),
      response_type: 'code',
      scope: this.scope,
      state: state
    };
    
    const queryString = querystring.stringify(params);
    const authUrl = `${baseUrl}?${queryString}#wechat_redirect`;
    
    console.log(`生成微信授权URL: ${authUrl}`);
    return authUrl;
  }

  /**
   * 验证state参数是否有效
   * @param {string} state - 从微信返回的state参数
   * @returns {object|null} - 包含dialogId的对象或null
   */
  verifyState(state) {
    if (!state || !this.stateCache.has(state)) {
      console.warn('无效的state参数或state已过期');
      return null;
    }
    
    const stateData = this.stateCache.get(state);
    const now = Date.now();
    
    // 检查state是否在10分钟有效期内
    if (now - stateData.timestamp > 10 * 60 * 1000) {
      console.warn('state参数已过期');
      this.stateCache.delete(state);
      return null;
    }
    
    // 验证通过后，从缓存中移除该state（防止重复使用）
    this.stateCache.delete(state);
    
    console.log(`state验证成功，dialogId: ${stateData.dialogId}`);
    return { dialogId: stateData.dialogId };
  }

  /**
   * 使用code获取微信access_token
   * @param {string} code - 微信返回的授权code
   * @returns {Promise<object>} - 微信返回的token信息
   */
  async getAccessToken(code) {
    return new Promise((resolve, reject) => {
      const apiUrl = `https://api.weixin.qq.com/sns/oauth2/access_token`;
      const params = {
        appid: this.appId,
        secret: this.appSecret,
        code: code,
        grant_type: 'authorization_code'
      };
      
      const queryString = querystring.stringify(params);
      const requestUrl = `${apiUrl}?${queryString}`;
      
      console.log(`请求微信access_token: ${apiUrl}?${querystring.stringify({...params, secret: '********'})}`);
      
      https.get(requestUrl, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            
            // 检查是否有错误
            if (result.errcode) {
              console.error('获取access_token失败:', result);
              reject(new Error(`微信API错误: ${result.errmsg}`));
              return;
            }
            
            console.log('成功获取access_token');
            resolve(result);
          } catch (error) {
            console.error('解析微信响应失败:', error);
            reject(error);
          }
        });
      }).on('error', (error) => {
        console.error('请求微信API失败:', error);
        reject(error);
      });
    });
  }

  /**
   * 使用access_token获取用户信息
   * @param {string} accessToken - 微信access_token
   * @param {string} openId - 用户的openId
   * @returns {Promise<object>} - 用户信息
   */
  async getUserInfo(accessToken, openId) {
    return new Promise((resolve, reject) => {
      const apiUrl = `https://api.weixin.qq.com/sns/userinfo`;
      const params = {
        access_token: accessToken,
        openid: openId,
        lang: 'zh_CN'
      };
      
      const queryString = querystring.stringify(params);
      const requestUrl = `${apiUrl}?${queryString}`;
      
      console.log(`请求微信用户信息: ${apiUrl}?${querystring.stringify({openid: openId, lang: 'zh_CN', access_token: '********'})}`);
      
      https.get(requestUrl, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            
            // 检查是否有错误
            if (result.errcode) {
              console.error('获取用户信息失败:', result);
              reject(new Error(`微信API错误: ${result.errmsg}`));
              return;
            }
            
            console.log('成功获取用户信息');
            resolve(result);
          } catch (error) {
            console.error('解析微信响应失败:', error);
            reject(error);
          }
        });
      }).on('error', (error) => {
        console.error('请求微信API失败:', error);
        reject(error);
      });
    });
  }

  /**
   * 清理过期的state参数
   */
  cleanupExpiredStates() {
    const now = Date.now();
    for (const [state, data] of this.stateCache.entries()) {
      // 清理超过10分钟的state
      if (now - data.timestamp > 10 * 60 * 1000) {
        this.stateCache.delete(state);
      }
    }
  }
}

// 创建并导出OAuth实例
const wechatOAuth = new WechatOAuth();

export default wechatOAuth;
export { WechatOAuth };