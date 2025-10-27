// 微信OAuth授权处理模块
// 此模块用于在服务器端安全地处理微信授权流程

import crypto from 'crypto';
import https from 'https';
import querystring from 'querystring';
// import { createClient } from 'redis'; // 已注释：测试环境暂不使用 Redis

// 从环境变量或配置文件获取微信配置
class WechatOAuth {
  constructor() {
    // 使用传入的配置或默认值
    this.appId = process.env.WECHAT_APPID;
    this.appSecret = process.env.WECHAT_APPSECRET;
    // 重定向URI指向服务器的回调端点
    this.redirectUri = process.env.WECHAT_REDIRECT_URI;
    this.scope = process.env.WECHAT_SCOPE;

    // ===== 已注释：测试环境暂不使用 Redis =====
    // // 创建Redis客户端连接
    // this.redisClient = createClient({
    //   url: 'redis://172.21.9.233:6379',
    //   connectTimeout: 5000
    // });

    // // 处理Redis连接错误
    // this.redisClient.on('error', (err) => {
    //   console.error('Redis客户端错误:', err);
    // });

    // // 连接Redis
    // this.redisClient.connect().catch(err => {
    //   console.error('Redis连接失败:', err);
    // });
    // ===== Redis 注释结束 =====

    console.log('微信OAuth配置初始化完成（测试模式：无Redis）');
  }

  /**
   * 生成安全的state参数并返回授权URL
   * @param {string} dialogId - 对话ID，用于后续关联
   * @returns {Promise<string>} - 微信授权URL
   */
  async generateAuthUrl(dialogId) {
    // 生成随机的state参数，包含时间戳以防止重放攻击
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(16).toString('hex');
    const state = `${dialogId}_${timestamp}_${randomString}`;

    // ===== 已注释：测试环境跳过 Redis 存储 =====
    // // 将state参数存储在Redis中，设置过期时间（10分钟）
    // try {
    //   await this.redisClient.set(
    //     `wechat:state:${state}`,
    //     JSON.stringify({ dialogId, timestamp }),
    //     { EX: 600 }
    //   );
    //   console.log(`State参数已存储到Redis: ${state}`);
    // } catch (error) {
    //   console.error('存储state到Redis失败:', error);
    //   throw new Error('生成授权URL失败: 无法存储state参数');
    // }
    // ===== Redis 存储注释结束 =====
    
    console.log(`State参数已生成（测试模式：未存储到Redis）: ${state}`);

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
   * @returns {Promise<object|null>} - 包含dialogId的对象或null
   */
  async verifyState(state) {
    // ===== 警告：测试模式 - 跳过完整的 state 验证 =====
    // 生产环境必须启用完整的 Redis 验证以确保安全性
    // ===== 
    
    if (!state) {
      console.warn('无效的state参数: 参数为空');
      return null;
    }

    try {
      // 测试模式：直接从 state 字符串中提取 dialogId
      // state 格式: dialogId_timestamp_randomString
      const parts = state.split('_');
      if (parts.length < 3) {
        console.warn('state参数格式不正确');
        return null;
      }

      const dialogId = parts[0];
      const timestamp = parseInt(parts[1]);
      const now = Date.now();

      // 基本的时间戳检查（10分钟有效期）
      if (now - timestamp > 10 * 60 * 1000) {
        console.warn('state参数已过期（基于时间戳检查）');
        return null;
      }

      console.log(`state验证成功（测试模式），dialogId: ${dialogId}`);
      return { dialogId };

      // ===== 原 Redis 验证代码已注释 =====
      // // 从Redis获取state数据
      // const stateDataStr = await this.redisClient.get(`wechat:state:${state}`);
      // if (!stateDataStr) {
      //   console.warn('state参数不存在或已过期');
      //   return null;
      // }

      // const stateData = JSON.parse(stateDataStr);
      // const now = Date.now();

      // // 检查state是否在有效期内（Redis已设置过期，但双重验证更安全）
      // if (now - stateData.timestamp > 10 * 60 * 1000) {
      //   console.warn('state参数已过期');
      //   await this.redisClient.del(`wechat:state:${state}`);
      //   return null;
      // }

      // // 验证通过后，从Redis中删除该state（防止重复使用）
      // await this.redisClient.del(`wechat:state:${state}`);

      // console.log(`state验证成功，dialogId: ${stateData.dialogId}`);
      // return { dialogId: stateData.dialogId };
      // ===== Redis 验证注释结束 =====
    } catch (error) {
      console.error('验证state参数失败:', error);
      return null;
    }
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

      console.log(`请求微信access_token: ${apiUrl}?${querystring.stringify({ ...params, secret: '********' })}`);

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

      console.log(`请求微信用户信息: ${apiUrl}?${querystring.stringify({ openid: openId, lang: 'zh_CN', access_token: '********' })}`);

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

            console.log('成功获取用户信息，unionid:', result.unionid);
            // 显式提取unionid确保存在性
            const userInfo = {
              ...result,
              unionid: result.unionid || null
            };
            resolve(userInfo);
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
   * @deprecated 已使用Redis的EXPIRE自动过期，此方法不再需要
   */
  cleanupExpiredStates() {
    console.warn('cleanupExpiredStates方法已弃用，Redis将自动处理过期state');
  }
}

// 创建并导出OAuth实例
const wechatOAuth = new WechatOAuth();

export default wechatOAuth;
export { WechatOAuth };