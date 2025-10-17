import { WECHAT_CONFIG } from './config';

/**
 * 微信服务器验证工具类
 * 用于处理微信公众平台的服务器验证请求
 */
export class WechatVerify {
  /**
   * 验证微信服务器请求
   * @param signature 微信加密签名
   * @param timestamp 时间戳
   * @param nonce 随机数
   * @param echostr 随机字符串
   * @returns 验证成功返回echostr，失败返回null
   */
  static verify(signature: string, timestamp: string, nonce: string, echostr: string): string | null {
    try {
      // 1. 将token、timestamp、nonce三个参数进行字典序排序
      const arr = [WECHAT_CONFIG.TOKEN, timestamp, nonce];
      arr.sort();
      
      // 2. 将三个参数字符串拼接成一个字符串进行sha1加密
      const crypto = require('crypto');
      const str = arr.join('');
      const hash = crypto.createHash('sha1');
      hash.update(str);
      const result = hash.digest('hex');
      
      // 3. 开发者获得加密后的字符串可与signature对比，标识该请求来源于微信
      if (result === signature) {
        return echostr;
      }
      
      return null;
    } catch (error) {
      console.error('微信服务器验证失败:', error);
      return null;
    }
  }
  
  /**
   * 获取当前配置的微信验证Token
   * @returns 当前使用的Token
   */
  static getToken(): string {
    return WECHAT_CONFIG.TOKEN;
  }
}