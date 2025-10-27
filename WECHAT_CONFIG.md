# 微信服务器验证配置说明

本文档说明如何配置微信服务器验证功能，用于微信公众平台与开发者服务器的对接。

## 配置信息

### 配置说明

### Token配置

**默认Token**: `zhaosheng2024`

> **注意**: 这是一个3-32位的英文数字组合，符合微信公众平台的要求。

### 使用环境变量配置

为了提高安全性，现在推荐通过环境变量配置敏感信息：

```bash
# 设置Token环境变量
WECHAT_TOKEN=your_custom_token node server.js

# 或者设置多个环境变量
WECHAT_APPID=your_appid WECHAT_APPSECRET=your_appsecret WECHAT_TOKEN=your_token node server.js
```

### 环境变量文件配置

您也可以创建 `.env` 文件来管理所有环境变量：

1. 复制模板文件：`cp .env.example .env`
2. 编辑 `.env` 文件，修改相应的配置值
3. 启动服务时，系统会自动读取这些环境变量

## 配置文件位置

- **配置文件**: `src/lib/config.ts`
- **验证工具**: `src/lib/wechatVerify.ts`
- **后端服务**: `server.js`

## 微信公众平台配置步骤

1. 登录[微信公众平台](https://mp.weixin.qq.com/)
2. 进入「开发」→「基本配置」
3. 填写以下信息：
   - **服务器地址(URL)**: `http://你的域名/wechat`
   - **Token**: `zhaosheng2024`
   - **消息加解密方式**: 明文模式
4. 点击「提交」按钮，微信会向服务器发送验证请求

## 启动后端服务

### 前置条件

- Node.js 环境
- 已安装依赖：`express`

### 启动步骤

1. 安装依赖：
   ```bash
   npm install express
   ```

2. 启动服务：
   ```bash
   node server.js
   ```

3. 服务将在 80 端口启动，这是微信服务器验证的默认端口

### 配置文件位置更新

- **配置文件**: `src/lib/config.ts`（已更新为从环境变量读取配置）
- **验证工具**: `src/lib/wechatVerify.ts`
- **后端服务**: `server.js`（已更新为从环境变量读取配置）

## 注意事项

1. 确保服务器防火墙已开放80/443端口
2. 如果使用HTTPS，请配置相应的SSL证书并使用443端口
3. **重要安全措施**: Token等敏感信息已移至环境变量管理，请避免在代码中硬编码
4. 定期更新Token以提高安全性
5. 确保 `.env` 文件不被提交到版本控制系统（已在 `.gitignore` 中配置）

## 开发说明

- 前端代码中的微信相关配置在 `src/lib/config.ts` 中管理
- 微信验证逻辑封装在 `src/lib/wechatVerify.ts` 中
- 后端服务 `server.js` 提供了完整的验证端点实现

如需进一步定制或有任何问题，请联系技术支持。