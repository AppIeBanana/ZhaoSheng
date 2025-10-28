# 环境变量配置说明

## 概述

本项目需要配置多个环境变量来启用微信OAuth授权和AI问答功能。请按照以下步骤创建并配置 `.env` 文件。

## 创建 .env 文件

在项目根目录创建 `.env` 文件，并添加以下配置：

```env
# 微信公众号配置
# 在微信公众平台获取 (https://mp.weixin.qq.com)
WECHAT_APPID=你的微信AppID
WECHAT_APPSECRET=你的微信AppSecret

# 微信OAuth授权回调地址
# 这个地址必须在微信公众平台的"网页授权域名"中配置
# 格式：https://你的域名/api/wechat/callback
WECHAT_REDIRECT_URI=https://zswd.fzrjxy.com/api/wechat/callback

# 微信授权范围
# snsapi_base: 静默授权，只能获取openid
# snsapi_userinfo: 需要用户确认，可以获取用户基本信息（昵称、头像等）和unionid
WECHAT_SCOPE=snsapi_userinfo

# SSL证书配置
# HTTPS服务器需要SSL证书，用于安全通信
SSL_KEY_PATH=./ssl/private.key
SSL_CERT_PATH=./ssl/certificate.crt

# 服务器环境
NODE_ENV=production

# Coze API配置（用于AI问答功能）
VITE_COZE_AUTH_TOKEN=你的Coze授权Token
VITE_COZE_API_URL=https://api.coze.cn/v3/chat
VITE_COZE_BOT_ID=你的Coze机器人ID
VITE_COZE_WORKFLOW_ID=你的Coze工作流ID

# 微信服务器验证Token（用于微信服务器验证）
VITE_WECHAT_TOKEN=你的微信Token
```

## 配置步骤

### 1. 微信公众号配置

#### 1.1 获取 AppID 和 AppSecret

1. 登录 [微信公众平台](https://mp.weixin.qq.com)
2. 进入"开发" > "基本配置"
3. 找到"开发者ID(AppID)"和"开发者密码(AppSecret)"
4. 复制这两个值到 `.env` 文件中的 `WECHAT_APPID` 和 `WECHAT_APPSECRET`

#### 1.2 配置网页授权域名

1. 在微信公众平台，进入"设置与开发" > "公众号设置" > "功能设置"
2. 找到"网页授权域名"，点击"修改"
3. 添加你的域名：`zswd.fzrjxy.com`（不含 http:// 或 https://）
4. 下载验证文件并上传到你的服务器根目录
5. 点击确认完成验证

**重要提示：**
- 网页授权域名必须是备案过的域名
- 域名不能包含端口号
- 必须使用 HTTPS 协议
- 验证文件必须能通过 `https://你的域名/验证文件名` 访问

#### 1.3 配置 IP 白名单（可选但建议）

1. 在"开发" > "基本配置"中找到"IP白名单"
2. 添加你的服务器 IP 地址
3. 这样可以提高 API 调用的安全性

### 2. SSL 证书配置

#### 2.1 证书文件准备

确保你有以下 SSL 证书文件：
- `private.key` - 私钥文件
- `certificate.crt` - 证书文件

#### 2.2 放置证书文件

1. 在项目根目录创建 `ssl` 文件夹
2. 将证书文件放入该文件夹
3. 确保文件路径与 `.env` 中配置的一致

**证书获取方式：**
- **Let's Encrypt**（免费）：使用 Certbot 自动获取
- **阿里云/腾讯云**：购买或申请免费证书
- **其他 CA 机构**：购买商业证书

### 3. Coze API 配置

如果你使用 Coze 平台提供 AI 问答功能：

1. 登录 [Coze 平台](https://www.coze.cn)
2. 创建或选择一个机器人
3. 获取以下信息：
   - 授权 Token
   - 机器人 ID
   - 工作流 ID（如果使用工作流）
4. 填入 `.env` 文件对应字段

### 4. 微信服务器验证 Token

这是用于微信服务器验证的自定义 Token：

1. 在微信公众平台"开发" > "基本配置"中找到"服务器配置"
2. 设置一个自定义的 Token（英文或数字，长度3-32字符）
3. 将相同的 Token 填入 `.env` 文件的 `VITE_WECHAT_TOKEN`

## 验证配置

### 检查环境变量是否加载

启动服务器后，检查控制台输出：

```bash
node server.js
```

应该看到类似的日志：
```
✓ 私钥文件读取成功
✓ 证书文件读取成功
✓ SSL凭证创建成功
微信OAuth配置初始化完成
HTTPS服务器正在运行在端口 8443
```

### 测试微信授权流程

1. 访问你的网站：`https://zswd.fzrjxy.com`
2. 填写信息收集表单
3. 点击"确认并进入咨询"按钮
4. 应该自动跳转到微信授权页面
5. 确认授权后，应该重定向回 QA 页面

## 常见问题

### 1. 获取不到 unionid

**问题原因：**
- 公众号未绑定到微信开放平台
- 使用的是测试号（测试号不提供 unionid）

**解决方案：**
- 确保公众号已绑定到 [微信开放平台](https://open.weixin.qq.com)
- 使用正式的公众号而非测试号

### 2. 授权回调失败

**检查项：**
- 确认网页授权域名配置正确
- 确认 `WECHAT_REDIRECT_URI` 与实际回调地址一致
- 检查服务器是否运行在 8443 端口
- 查看服务器日志排查错误

### 3. SSL 证书错误

**检查项：**
- 确认证书文件路径正确
- 确认证书文件有读取权限
- 确认证书未过期
- 确认证书域名与实际域名匹配

### 4. 跨域问题

如果前端和后端部署在不同域名：
- 确保后端配置了正确的 CORS 头
- 检查前端请求的 URL 是否正确

## 安全建议

1. **不要将 `.env` 文件提交到 Git**
   - 已在 `.gitignore` 中排除
   - 敏感信息不应出现在版本控制中

2. **定期更新 AppSecret**
   - 建议每 3-6 个月更换一次
   - 更换后需要同步更新 `.env` 文件

3. **保护私钥文件**
   - 私钥文件权限应设为 600
   - 不要在公共场合分享私钥

4. **使用环境隔离**
   - 开发/测试/生产环境使用不同的配置
   - 避免在生产环境使用测试密钥

## 部署检查清单

- [ ] 创建 `.env` 文件
- [ ] 配置微信 AppID 和 AppSecret
- [ ] 配置网页授权域名
- [ ] 上传并放置 SSL 证书
- [ ] 配置 Coze API（如果使用）
- [ ] 启动后端服务器（端口 8443）
- [ ] 测试微信授权流程
- [ ] 检查用户数据是否正确保存到 `wechat_users.json`

## 技术支持

如有问题，请检查：
1. 服务器日志：查看详细错误信息
2. 浏览器控制台：查看前端错误
3. 微信公众平台后台：查看接口调用日志

