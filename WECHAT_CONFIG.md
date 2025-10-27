# 微信服务器配置说明

本文档说明微信公众平台与服务器的对接配置。

## 环境变量配置

所有敏感信息通过环境变量配置，不在代码中硬编码。

### 生产环境配置

在服务器上设置以下环境变量：

- `WECHAT_APPID` - 微信公众号 AppID
- `WECHAT_APPSECRET` - 微信公众号 AppSecret
- `WECHAT_TOKEN` - 服务器验证 Token（3-32位英文数字组合）
- `SSL_KEY_PATH` - SSL 私钥路径
- `SSL_CERT_PATH` - SSL 证书路径

## 微信公众平台配置

1. 登录[微信公众平台](https://mp.weixin.qq.com/)
2. 进入「开发」→「基本配置」
3. 填写服务器配置：
   - **服务器地址(URL)**: `https://你的域名/api/wechat/callback`
   - **Token**: 与环境变量中的 WECHAT_TOKEN 一致
   - **消息加解密方式**: 明文模式
4. 提交配置

## 配置文件说明

- **前端配置**: `src/lib/config.ts` - 从环境变量读取配置
- **微信验证**: `src/lib/wechatVerify.ts` - 服务器验证逻辑
- **后端服务**: `server.js` - OAuth 回调处理

## 注意事项

1. 确保服务器防火墙已开放 443 端口
2. SSL 证书必须有效且正确配置
3. 不要在代码或版本控制中包含敏感信息
4. 定期更新 Token 以提高安全性