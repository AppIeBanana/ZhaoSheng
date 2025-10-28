# 微信OAuth授权系统

> 完整的微信网页授权解决方案，用于获取用户身份信息（openid 和 unionid）

## 🌟 功能特性

- ✅ **完整的OAuth流程**：从授权申请到用户信息获取
- ✅ **安全可靠**：CSRF防护、HTTPS加密、state参数验证
- ✅ **用户友好**：流畅的授权体验、友好的错误提示
- ✅ **数据持久化**：用户信息自动保存
- ✅ **文档完善**：详细的使用和测试文档

## 📖 目录

- [快速开始](#-快速开始)
- [系统架构](#-系统架构)
- [授权流程](#-授权流程)
- [API文档](#-api文档)
- [配置说明](#-配置说明)
- [测试指南](#-测试指南)
- [常见问题](#-常见问题)

## 🚀 快速开始

### 1. 配置环境变量

创建 `.env` 文件：

```bash
WECHAT_APPID=你的AppID
WECHAT_APPSECRET=你的AppSecret
WECHAT_REDIRECT_URI=https://zswd.fzrjxy.com/api/wechat/callback
WECHAT_SCOPE=snsapi_userinfo
SSL_KEY_PATH=./ssl/private.key
SSL_CERT_PATH=./ssl/certificate.crt
```

详细配置说明：📄 [ENV_SETUP.md](./ENV_SETUP.md)

### 2. 配置微信公众平台

1. 设置网页授权域名：`zswd.fzrjxy.com`
2. 配置IP白名单（可选）
3. 上传验证文件

详细步骤：📄 [QUICKSTART_WECHAT_AUTH.md](./QUICKSTART_WECHAT_AUTH.md)

### 3. 启动服务

```bash
# 安装依赖
npm install

# 启动后端服务
node server.js
```

### 4. 测试授权

在微信中打开：`https://zswd.fzrjxy.com`

详细测试步骤：📄 [TESTING_WECHAT_AUTH.md](./TESTING_WECHAT_AUTH.md)

## 🏗️ 系统架构

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   用户      │         │  前端应用   │         │  后端服务   │
│  (微信)     │         │  (React)    │         │  (Node.js)  │
└──────┬──────┘         └──────┬──────┘         └──────┬──────┘
       │                       │                       │
       │  1. 访问网站           │                       │
       │─────────────────────>│                       │
       │                       │                       │
       │                       │  2. 请求授权URL       │
       │                       │──────────────────────>│
       │                       │                       │
       │                       │  3. 返回授权URL       │
       │                       │<──────────────────────│
       │                       │                       │
       │  4. 跳转到微信授权页    │                       │
       │<─────────────────────│                       │
       │                       │                       │
       │  5. 用户确认授权       │                       │
       │                       │                       │
       │  6. 微信回调           │                       │
       │───────────────────────────────────────────────>│
       │                       │                       │
       │                       │  7. 获取用户信息       │
       │                       │  8. 保存用户数据       │
       │                       │                       │
       │  9. 重定向到QA页面     │                       │
       │<──────────────────────────────────────────────│
       │                       │                       │
       │  10. 开始AI对话        │                       │
       │─────────────────────>│                       │
```

### 核心组件

| 组件 | 文件 | 说明 |
|-----|------|------|
| 前端信息收集页面 | `src/pages/InfoCollection.tsx` | 表单填写、授权跳转 |
| 后端OAuth服务 | `server.js` | 授权处理、用户数据保存 |
| OAuth工具类 | `src/lib/wechatOAuth.js` | 微信API调用封装 |
| 用户数据存储 | `wechat_users.json` | 用户信息持久化 |

## 🔄 授权流程

### 详细步骤

```
第1步：用户访问
├─ 用户在微信中打开 https://zswd.fzrjxy.com
└─ 加载信息收集表单

第2步：填写信息
├─ 考试类型（春季统考/秋季统考）
├─ 考生类型（城镇应届/往届、农村应届/往届）
├─ 生源省份
├─ 民族
└─ 分数（可选）

第3步：提交表单
├─ 验证表单数据
├─ 生成唯一 dialogId
├─ 保存表单数据到 localStorage
│   key: student_data_${dialogId}
└─ 请求后端获取授权URL
    GET /api/wechat/auth-url?dialogId=${dialogId}

第4步：后端生成授权URL
├─ 生成随机 state 参数
│   格式: ${dialogId}_${timestamp}_${randomString}
├─ 缓存 state（有效期10分钟）
└─ 返回微信授权URL
    https://open.weixin.qq.com/connect/oauth2/authorize?
    appid=xxx&redirect_uri=xxx&response_type=code&
    scope=snsapi_userinfo&state=xxx#wechat_redirect

第5步：跳转微信授权
├─ 前端执行 window.location.href = authUrl
├─ 用户看到微信授权页面
│   显示：应用名称、请求的权限
└─ 用户点击"确认授权"

第6步：微信回调
└─ 微信重定向到后端
    GET /api/wechat/callback?code=xxx&state=xxx

第7步：后端处理回调
├─ 验证 state 参数
│   ├─ 检查是否存在于缓存
│   ├─ 检查是否过期（10分钟）
│   └─ 验证后删除（防止重复使用）
├─ 提取 dialogId
├─ 用 code 换取 access_token
│   POST https://api.weixin.qq.com/sns/oauth2/access_token
│   响应包含：openid, unionid, access_token
├─ 获取用户详细信息
│   GET https://api.weixin.qq.com/sns/userinfo
│   响应包含：nickname, headimgurl, sex 等
└─ 保存用户数据
    写入 wechat_users.json

第8步：重定向到前端
└─ 302 重定向到 QA 页面
    https://zswd.fzrjxy.com/qa?
    dialogId=xxx&wechat_authorized=true&openid=xxx

第9步：前端接收回调
├─ 检测 URL 参数
│   ├─ dialogId
│   ├─ wechat_authorized=true
│   └─ openid
├─ 保存 dialogId 到 localStorage
│   key: current_dialog_id
├─ 从 localStorage 恢复表单数据
│   key: student_data_${dialogId}
└─ 跳转到 QA 页面

第10步：开始对话
├─ QA 页面加载
├─ 使用 dialogId 标识会话
├─ 可通过 API 获取用户信息
│   GET /api/wechat/user-info?dialogId=${dialogId}
└─ 开始AI对话，提供个性化服务
```

完整流程说明：📄 [WECHAT_OAUTH_FLOW.md](./WECHAT_OAUTH_FLOW.md)

## 📡 API文档

### 1. 获取授权URL

**请求**
```http
GET /api/wechat/auth-url?dialogId={dialogId}
```

**参数**
- `dialogId` (必填): 对话ID，用于关联用户数据

**响应**
```json
{
  "authUrl": "https://open.weixin.qq.com/connect/oauth2/authorize?..."
}
```

**错误响应**
```json
{
  "error": "错误描述"
}
```

### 2. 微信授权回调

**请求**
```http
GET /api/wechat/callback?code={code}&state={state}
```

**参数**
- `code` (必填): 微信返回的授权码
- `state` (必填): 状态参数，用于验证

**行为**
1. 验证 state 参数
2. 使用 code 获取 access_token
3. 获取用户信息
4. 保存用户数据到 wechat_users.json
5. 重定向到前端 QA 页面

**重定向目标**
```
https://zswd.fzrjxy.com/qa?dialogId={dialogId}&wechat_authorized=true&openid={openid}
```

### 3. 查询用户信息

**请求**
```http
GET /api/wechat/user-info?dialogId={dialogId}
```

**参数**
- `dialogId` (必填): 对话ID

**响应**
```json
{
  "openid": "oXXXXXXXXXXXXXXXXXXXX",
  "unionid": "o6_bmasdasdsad6_2sgVt7hMZOPfL",
  "nickname": "用户昵称",
  "headimgurl": "https://...",
  "createdAt": "2025-10-27T12:00:00.000Z"
}
```

**错误响应**
```json
{
  "error": "未找到用户数据"
}
```

## ⚙️ 配置说明

### 环境变量

| 变量名 | 说明 | 示例 |
|-------|------|------|
| `WECHAT_APPID` | 微信公众号AppID | `wxXXXXXXXXXXXXXXXX` |
| `WECHAT_APPSECRET` | 微信公众号AppSecret | `xxxxxxxxxxxxxxxx` |
| `WECHAT_REDIRECT_URI` | OAuth回调地址 | `https://zswd.fzrjxy.com/api/wechat/callback` |
| `WECHAT_SCOPE` | 授权范围 | `snsapi_userinfo` |
| `SSL_KEY_PATH` | SSL私钥路径 | `./ssl/private.key` |
| `SSL_CERT_PATH` | SSL证书路径 | `./ssl/certificate.crt` |

### 授权范围说明

| Scope | 说明 | 用户体验 | 获取信息 |
|-------|------|---------|---------|
| `snsapi_base` | 静默授权 | 无感知 | 仅 openid |
| `snsapi_userinfo` | 用户授权 | 需确认 | openid, unionid, 昵称, 头像等 |

**推荐使用 `snsapi_userinfo`**，可以获取更完整的用户信息。

### 数据结构

**wechat_users.json**
```json
{
  "dialog_1698764321234_abc123def": {
    "openid": "oXXXXXXXXXXXXXXXXXXXX",
    "unionid": "o6_bmasdasdsad6_2sgVt7hMZOPfL",
    "nickname": "微信用户",
    "headimgurl": "https://thirdwx.qlogo.cn/...",
    "createdAt": "2025-10-27T12:00:00.000Z",
    "lastUpdatedAt": "2025-10-27T12:00:00.000Z",
    "firstAuthAt": "2025-10-27T12:00:00.000Z"
  }
}
```

## 🧪 测试指南

### 前置条件

- ✅ 后端服务运行在端口 8443
- ✅ 微信公众平台已配置
- ✅ SSL 证书已安装
- ✅ 在微信中测试

### 测试步骤

1. **访问网站**
   ```
   在微信中打开：https://zswd.fzrjxy.com
   ```

2. **填写表单**
   - 选择考试类型
   - 选择考生类型
   - 选择省份
   - 选择民族
   - 输入分数（可选）

3. **提交授权**
   - 点击"确认并进入咨询"
   - 应跳转到微信授权页面

4. **确认授权**
   - 点击"确认授权"
   - 应重定向到 QA 页面

5. **验证结果**
   ```bash
   # 检查用户数据
   cat wechat_users.json
   
   # 查询用户信息
   curl "https://zswd.fzrjxy.com:8443/api/wechat/user-info?dialogId=xxx"
   ```

详细测试指南：📄 [TESTING_WECHAT_AUTH.md](./TESTING_WECHAT_AUTH.md)

## 🛠️ 故障排查

### 常见问题

<details>
<summary>点击按钮后没有跳转</summary>

**可能原因：**
- 后端服务未运行
- 表单验证失败
- 网络连接问题

**解决方法：**
```bash
# 检查后端服务
curl -I https://zswd.fzrjxy.com:8443/api/wechat/auth-url?dialogId=test

# 查看浏览器控制台错误
# 检查表单是否填写完整
```
</details>

<details>
<summary>授权页面显示 redirect_uri 参数错误</summary>

**可能原因：**
- 网页授权域名未配置
- 域名配置错误

**解决方法：**
1. 检查微信公众平台的"网页授权域名"
2. 确保配置为 `zswd.fzrjxy.com`（不含协议）
3. 确保验证文件可访问
</details>

<details>
<summary>获取不到 unionid</summary>

**可能原因：**
- 公众号未绑定到微信开放平台
- 使用的是测试号

**解决方法：**
1. 登录 [微信开放平台](https://open.weixin.qq.com)
2. 绑定公众号
3. 使用正式公众号（非测试号）
</details>

<details>
<summary>SSL 证书错误</summary>

**可能原因：**
- 证书路径不正确
- 证书文件权限问题
- 证书已过期

**解决方法：**
```bash
# 检查证书文件
ls -l ssl/

# 检查证书有效期
openssl x509 -in ssl/certificate.crt -text -noout | grep "Not After"
```
</details>

## 📊 监控和日志

### 服务器日志

```bash
# 实时查看日志
tail -f server.log

# 过滤微信相关
tail -f server.log | grep "微信"
```

### 关键日志

```
✓ 私钥文件读取成功
✓ 证书文件读取成功
✓ SSL凭证创建成功
微信OAuth配置初始化完成
HTTPS服务器正在运行在端口 8443

成功生成微信授权URL，dialogId: dialog_xxx
state验证成功，dialogId: dialog_xxx
微信返回的token信息: { openid: 'oXXXXX...', unionid: 'o6_XXX...', ... }
用户数据已保存: dialogId=dialog_xxx, openid=oXXXXX, unionid=o6_XXX
```

## 🔒 安全性

### 实施的安全措施

| 措施 | 实现方式 | 目的 |
|------|---------|------|
| HTTPS 加密 | SSL 证书 | 保护数据传输 |
| CSRF 防护 | State 参数 | 防止跨站请求伪造 |
| State 过期 | 10分钟有效期 | 限制攻击窗口 |
| State 一次性 | 验证后删除 | 防止重放攻击 |
| 数据保护 | .gitignore | 敏感文件不提交 |
| 配置隔离 | 环境变量 | 隐藏敏感信息 |

### 安全建议

- ✅ 使用 HTTPS（必须）
- ✅ 定期更换 AppSecret
- ✅ 限制 IP 白名单
- ✅ 监控异常访问
- ⏰ 考虑使用 Redis 存储 state
- ⏰ 考虑实现请求频率限制

## 📚 文档索引

| 文档 | 说明 |
|------|------|
| [WECHAT_OAUTH_FLOW.md](./WECHAT_OAUTH_FLOW.md) | 完整的授权流程说明 |
| [ENV_SETUP.md](./ENV_SETUP.md) | 环境变量配置指南 |
| [TESTING_WECHAT_AUTH.md](./TESTING_WECHAT_AUTH.md) | 详细测试指南 |
| [QUICKSTART_WECHAT_AUTH.md](./QUICKSTART_WECHAT_AUTH.md) | 5分钟快速启动 |
| [WECHAT_AUTH_IMPLEMENTATION_SUMMARY.md](./WECHAT_AUTH_IMPLEMENTATION_SUMMARY.md) | 实现总结 |

## 🔮 未来规划

- [ ] 迁移到数据库存储（MySQL/MongoDB）
- [ ] 使用 Redis 缓存 state 和 access_token
- [ ] 实现 access_token 自动刷新
- [ ] 添加用户行为分析
- [ ] 实现消息推送功能
- [ ] 添加管理后台

## 📝 更新日志

### v1.0.0 (2025-10-27)

- ✅ 实现完整的微信OAuth授权流程
- ✅ 用户数据保存功能
- ✅ 用户信息查询API
- ✅ 完善的错误处理
- ✅ 详细的日志记录
- ✅ 完整的文档体系

## 📄 许可证

本项目仅供学习和参考使用。

## 🙋 支持

如有问题，请：
1. 查看 [常见问题](#-故障排查)
2. 查看 [测试指南](./TESTING_WECHAT_AUTH.md)
3. 检查服务器日志
4. 联系技术支持

---

**快速链接**
- 📖 [快速开始](./QUICKSTART_WECHAT_AUTH.md)
- 🔄 [授权流程](./WECHAT_OAUTH_FLOW.md)
- ⚙️ [环境配置](./ENV_SETUP.md)
- 🧪 [测试指南](./TESTING_WECHAT_AUTH.md)

**技术栈**
- Frontend: React + TypeScript + Vite
- Backend: Node.js + HTTPS
- WeChat: OAuth 2.0 + OpenAPI

**版本**: 1.0.0  
**最后更新**: 2025-10-27

