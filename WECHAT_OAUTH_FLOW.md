# 微信OAuth授权流程说明

## 流程概览

本系统实现了完整的微信网页授权流程，用于获取用户的微信身份信息（openid 和 unionid），以便唯一标识用户。

## 详细流程

### 1. 用户发起授权

**前端操作 (InfoCollection.tsx)**
- 用户填写信息收集表单（姓名、性别、民族等）
- 点击"确认并进入咨询"按钮
- 前端生成唯一的 `dialogId`（UUID格式）
- 将表单数据保存到 `localStorage`（键：`student_data_${dialogId}`）
- 调用后端API：`GET /api/wechat/auth-url?dialogId=${dialogId}`

**后端响应 (server.js)**
- 接收 `dialogId` 参数
- 调用 `wechatOAuth.generateAuthUrl(dialogId)` 生成授权URL
- 返回格式：
```json
{
  "authUrl": "https://open.weixin.qq.com/connect/oauth2/authorize?appid=你的AppID&redirect_uri=重定向网址&response_type=code&scope=snsapi_userinfo&state=state#wechat_redirect"
}
```

**前端跳转**
- 收到授权URL后，使用 `window.location.href` 跳转到微信授权页面

### 2. 微信授权页面

用户在微信中看到授权确认页面，显示应用名称和请求的权限（获取用户基本信息）。

### 3. 微信回调

**微信重定向**
- 用户确认授权后，微信将用户重定向到：
```
https://zswd.fzrjxy.com/api/wechat/callback?code=授权码&state=state参数
```

**后端处理 (server.js - `/api/wechat/callback`)**

1. **验证 state 参数**
   - 调用 `wechatOAuth.verifyState(state)`
   - 检查 state 是否有效且未过期（10分钟有效期）
   - 从 state 中提取 `dialogId`

2. **获取 access_token**
   - 使用 `code` 调用微信API：
   ```
   GET https://api.weixin.qq.com/sns/oauth2/access_token?appid=你的AppID&secret=你的AppSecret&code=code&grant_type=authorization_code
   ```
   - 成功响应示例：
   ```json
   {
     "access_token": "ACCESS_TOKEN",
     "expires_in": 7200,
     "refresh_token": "REFRESH_TOKEN",
     "openid": "OPENID",
     "scope": "SCOPE",
     "unionid": "o6_bmasdasdsad6_2sgVt7hMZOPfL"
   }
   ```

3. **获取用户信息**
   - 使用 `access_token` 和 `openid` 调用微信API：
   ```
   GET https://api.weixin.qq.com/sns/userinfo?access_token=ACCESS_TOKEN&openid=OPENID&lang=zh_CN
   ```
   - 成功响应包含：`openid`、`nickname`、`sex`、`province`、`city`、`country`、`headimgurl`、`unionid` 等

4. **保存用户数据**
   - 将用户信息保存到 `wechat_users.json` 文件
   - 数据结构：
   ```json
   {
     "dialogId": {
       "openid": "用户的openid",
       "unionid": "用户的unionid",
       "nickname": "用户昵称",
       "headimgurl": "头像URL",
       "createdAt": "创建时间",
       "lastUpdatedAt": "最后更新时间",
       "firstAuthAt": "首次授权时间"
     }
   }
   ```

5. **重定向到前端**
   - 重定向到：
   ```
   https://zswd.fzrjxy.com/qa?dialogId=${dialogId}&wechat_authorized=true&openid=${openid}
   ```

### 4. 前端处理授权回调

**InfoCollection 页面**
- 检测到 URL 参数：`dialogId` 和 `wechat_authorized=true`
- 保存 `dialogId` 到 `localStorage`（键：`current_dialog_id`）
- 从 `localStorage` 恢复用户填写的表单数据
- 跳转到 QA 页面并传递参数

**QA 页面**
- 接收 `dialogId` 参数
- 可以使用 `dialogId` 调用 `/api/wechat/user-info?dialogId=${dialogId}` 获取用户的微信信息

## API 端点说明

### 1. 获取授权URL

**请求**
```
GET /api/wechat/auth-url?dialogId=${dialogId}
```

**响应**
```json
{
  "authUrl": "https://open.weixin.qq.com/connect/oauth2/authorize?..."
}
```

### 2. 微信回调处理

**请求**
```
GET /api/wechat/callback?code=${code}&state=${state}
```

**响应**
- HTTP 302 重定向到前端 QA 页面

### 3. 获取用户信息

**请求**
```
GET /api/wechat/user-info?dialogId=${dialogId}
```

**响应**
```json
{
  "openid": "用户的openid",
  "unionid": "用户的unionid",
  "nickname": "用户昵称",
  "headimgurl": "头像URL",
  "createdAt": "创建时间"
}
```

## 数据存储

### 本地存储 (localStorage)

**表单数据**
- 键：`student_data_${dialogId}`
- 值：用户填写的表单数据（JSON格式）

**当前对话ID**
- 键：`current_dialog_id`
- 值：当前会话的 dialogId

**自动检测ID**
- 键：`auto_detected_id`
- 值：自动检测到的 dialogId

### 服务器存储 (wechat_users.json)

**文件位置**：项目根目录的 `wechat_users.json`

**数据结构**：
```json
{
  "dialogId-1": {
    "openid": "用户1的openid",
    "unionid": "用户1的unionid",
    "nickname": "用户1昵称",
    "headimgurl": "用户1头像URL",
    "createdAt": "2025-10-27T12:00:00.000Z",
    "lastUpdatedAt": "2025-10-27T12:00:00.000Z",
    "firstAuthAt": "2025-10-27T12:00:00.000Z"
  },
  "dialogId-2": {
    "openid": "用户2的openid",
    "unionid": "用户2的unionid",
    ...
  }
}
```

**注意**：
- 此文件包含用户敏感信息，已添加到 `.gitignore`
- 生产环境建议使用数据库（如 MySQL、MongoDB）存储
- 当前实现仅用于开发和测试

## 安全性考虑

1. **HTTPS 通信**：所有通信都通过 HTTPS 进行，确保数据传输安全
2. **state 参数验证**：防止 CSRF 攻击
3. **state 过期时间**：state 参数有效期为 10 分钟
4. **state 一次性使用**：验证后立即删除，防止重放攻击
5. **敏感信息保护**：`wechat_users.json` 不提交到版本控制系统

## openid 和 unionid 的区别

- **openid**：用户在当前公众号/小程序的唯一标识
  - 同一用户，在不同公众号/小程序下，openid 不同
  - 用于识别用户在当前应用中的身份

- **unionid**：用户在同一开放平台账号下的唯一标识
  - 同一用户，在同一开放平台账号下的所有应用，unionid 相同
  - 用于跨应用识别用户身份

**建议使用 unionid 作为用户的全局唯一标识**，特别是当你有多个公众号或小程序时。

## 环境变量配置

需要在 `.env` 文件中配置以下变量：

```env
# 微信公众号配置
WECHAT_APPID=你的AppID
WECHAT_APPSECRET=你的AppSecret
WECHAT_REDIRECT_URI=https://zswd.fzrjxy.com/api/wechat/callback
WECHAT_SCOPE=snsapi_userinfo

# SSL证书配置
SSL_KEY_PATH=./ssl/private.key
SSL_CERT_PATH=./ssl/certificate.crt
```

## 故障排查

### 1. 获取不到 unionid

**原因**：
- 公众号未绑定到开放平台
- 使用的是测试号（测试号不提供 unionid）

**解决方案**：
- 确保公众号已绑定到微信开放平台
- 使用正式的公众号而非测试号

### 2. 授权后无法跳转

**检查项**：
- 确认微信公众平台配置的 OAuth2.0 授权回调域名正确
- 检查后端服务是否正常运行（端口 8443）
- 查看浏览器控制台和服务器日志

### 3. state 验证失败

**可能原因**：
- 用户在授权页面停留超过 10 分钟
- 服务器重启导致内存中的 state 缓存丢失

**解决方案**：
- 提示用户重新发起授权
- 考虑使用 Redis 等持久化存储来保存 state

## 后续优化建议

1. **数据库存储**：使用 MySQL 或 MongoDB 替代 JSON 文件
2. **Redis 缓存**：使用 Redis 存储 state 参数和 access_token
3. **用户关联**：将微信身份与系统用户账号关联
4. **access_token 刷新**：实现 access_token 自动刷新机制
5. **日志记录**：完善授权流程的日志记录
6. **错误处理**：优化错误提示和用户体验

