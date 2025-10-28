# 微信授权快速启动指南

## 🚀 5分钟快速启动

本指南帮助你快速启动和测试微信OAuth授权功能。

## ✅ 准备工作检查清单

在开始之前，确保你已经完成：

- [ ] 拥有微信公众号（服务号或订阅号）
- [ ] 公众号已认证（获取高级接口权限）
- [ ] 域名已备案并配置 HTTPS
- [ ] 已获取 SSL 证书

## 📝 步骤 1: 配置环境变量

在项目根目录创建 `.env` 文件：

```bash
# 复制以下内容到 .env 文件

# 微信公众号配置（从微信公众平台获取）
WECHAT_APPID=wxXXXXXXXXXXXXXXXX
WECHAT_APPSECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 微信OAuth回调地址
WECHAT_REDIRECT_URI=https://zswd.fzrjxy.com/api/wechat/callback

# 授权范围（snsapi_userinfo 可获取用户详细信息）
WECHAT_SCOPE=snsapi_userinfo

# SSL证书路径
SSL_KEY_PATH=./ssl/private.key
SSL_CERT_PATH=./ssl/certificate.crt

# 环境
NODE_ENV=production
```

### 获取微信配置的方法：

1. 登录 [微信公众平台](https://mp.weixin.qq.com)
2. 进入"设置与开发" > "基本配置"
3. 找到"开发者ID(AppID)"和"开发者密码(AppSecret)"

## 🔐 步骤 2: 配置微信公众平台

### 2.1 配置网页授权域名

1. 进入微信公众平台
2. "设置与开发" > "公众号设置" > "功能设置"
3. 找到"网页授权域名"，点击"修改"
4. 添加：`zswd.fzrjxy.com`（不含 http:// 或 https://）
5. 下载验证文件 `MP_verify_XXXX.txt`
6. 上传到服务器：`https://zswd.fzrjxy.com/MP_verify_XXXX.txt`
7. 确认可以访问后，点击"确定"

### 2.2 配置IP白名单（推荐）

1. "设置与开发" > "基本配置"
2. 找到"IP白名单"
3. 添加你的服务器IP地址

## 🔧 步骤 3: 安装依赖并启动服务

```bash
# 1. 安装依赖
npm install

# 2. 确保SSL证书已放置
# 将 private.key 和 certificate.crt 放到 ssl/ 目录

# 3. 启动后端服务
node server.js

# 应该看到：
# ✓ 私钥文件读取成功
# ✓ 证书文件读取成功
# ✓ SSL凭证创建成功
# 微信OAuth配置初始化完成
# HTTPS服务器正在运行在端口 8443
```

## 🧪 步骤 4: 测试授权流程

### 方法 1: 使用真实手机测试（推荐）

1. 在微信中打开：`https://zswd.fzrjxy.com`
2. 填写表单信息
3. 点击"确认并进入咨询"
4. 在微信授权页面点击"确认授权"
5. 检查是否成功跳转到 QA 页面

### 方法 2: 使用微信开发者工具

1. 下载 [微信Web开发者工具](https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/Web_Developer_Tools.html)
2. 打开工具，输入网址：`https://zswd.fzrjxy.com`
3. 按照步骤测试授权流程

## 🔍 步骤 5: 验证授权结果

### 5.1 检查服务器日志

```bash
# 查看最新日志
tail -f server.log

# 成功的日志应包含：
# 微信返回的token信息: { openid: 'oXXXXX...', unionid: 'o6_XXX...', ... }
# 用户数据已保存: dialogId=dialog_xxx, openid=oXXXXX, unionid=o6_XXX
```

### 5.2 检查用户数据文件

```bash
# 查看保存的用户数据
cat wechat_users.json

# 应该看到类似的内容：
# {
#   "dialog_1698764321234_abc123def": {
#     "openid": "oXXXXXXXXXXXXXXXXXXXX",
#     "unionid": "o6_bmasdasdsad6_2sgVt7hMZOPfL",
#     "nickname": "微信用户",
#     ...
#   }
# }
```

### 5.3 测试用户信息查询 API

```bash
# 获取 dialogId（从日志或 wechat_users.json）
export DIALOG_ID="dialog_1698764321234_abc123def"

# 查询用户信息
curl "https://zswd.fzrjxy.com:8443/api/wechat/user-info?dialogId=$DIALOG_ID"

# 应该返回用户信息（JSON格式）
```

## ✨ 完整工作流程

```
┌─────────────────────────────────────────────────────────────┐
│  1. 用户在微信中打开网站                                       │
│     https://zswd.fzrjxy.com                                 │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  2. 填写信息收集表单                                          │
│     - 考试类型、考生类型、省份、民族、分数                      │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  3. 点击"确认并进入咨询"                                       │
│     - 生成 dialogId                                          │
│     - 保存表单数据到 localStorage                             │
│     - 请求后端获取授权URL                                      │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  4. 跳转到微信授权页面                                         │
│     - 显示应用名称和请求的权限                                  │
│     - 用户点击"确认授权"                                       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  5. 微信回调到后端                                            │
│     - 验证 state 参数                                         │
│     - 用 code 换取 access_token                              │
│     - 获取用户信息（openid、unionid、昵称、头像）              │
│     - 保存到 wechat_users.json                               │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  6. 重定向到问答页面                                          │
│     https://zswd.fzrjxy.com/qa?dialogId=xxx&                │
│     wechat_authorized=true&openid=xxx                       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  7. 开始AI对话                                                │
│     - 用户身份已确认（openid/unionid）                         │
│     - 可以关联对话历史和用户数据                                │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 成功标志

如果以下所有条件都满足，说明授权功能已正常工作：

✅ 后端服务在端口 8443 正常运行  
✅ 点击按钮后能跳转到微信授权页面  
✅ 授权页面显示正确的应用名称  
✅ 授权后能正确跳转回 QA 页面  
✅ URL 包含 `dialogId`、`wechat_authorized=true` 和 `openid`  
✅ `wechat_users.json` 文件中有新增的用户数据  
✅ 用户数据包含 `openid` 和 `unionid`（如果已绑定开放平台）  
✅ 服务器日志中没有错误信息  

## ❌ 常见问题快速修复

### 问题：点击按钮后没有跳转

**快速检查：**
```bash
# 检查后端服务是否运行
curl -I https://zswd.fzrjxy.com:8443/api/wechat/auth-url?dialogId=test

# 应该返回 200 状态码
```

**解决方法：**
- 确保后端服务已启动
- 检查防火墙是否开放 8443 端口
- 查看浏览器控制台的错误信息

### 问题：授权页面显示"redirect_uri参数错误"

**原因：** 网页授权域名未配置或配置错误

**解决方法：**
1. 检查微信公众平台的"网页授权域名"是否为 `zswd.fzrjxy.com`
2. 确保验证文件可以访问
3. 检查 `.env` 中的 `WECHAT_REDIRECT_URI` 是否正确

### 问题：获取不到 unionid

**原因：** 公众号未绑定到微信开放平台

**解决方法：**
1. 登录 [微信开放平台](https://open.weixin.qq.com)
2. 绑定你的公众号
3. 注意：测试号无法获取 unionid

### 问题：SSL 证书错误

**检查：**
```bash
# 检查证书文件是否存在
ls -l ssl/

# 应该看到 private.key 和 certificate.crt
```

**解决方法：**
- 确保证书文件路径正确
- 检查文件权限（建议 600）
- 确认证书未过期

## 📊 监控和日志

### 实时查看日志

```bash
# 实时查看服务器日志
tail -f server.log

# 过滤微信相关日志
tail -f server.log | grep "微信"
```

### 查看用户数据统计

```bash
# 统计授权用户数
cat wechat_users.json | grep "openid" | wc -l

# 查看最新的用户数据
cat wechat_users.json | tail -20
```

## 🔄 下一步

授权功能正常后，可以：

1. **集成到 QA 页面**
   - 使用 openid/unionid 标识用户
   - 关联用户的对话历史
   - 实现个性化推荐

2. **数据持久化**
   - 考虑迁移到数据库（MySQL/MongoDB）
   - 实现用户数据的备份和恢复

3. **用户画像**
   - 记录用户的咨询内容
   - 分析用户行为和偏好
   - 生成数据报表

4. **功能扩展**
   - 实现用户消息推送
   - 添加用户反馈功能
   - 支持多次咨询历史查看

## 📚 相关文档

- [完整授权流程说明](./WECHAT_OAUTH_FLOW.md)
- [环境变量配置详解](./ENV_SETUP.md)
- [测试指南](./TESTING_WECHAT_AUTH.md)
- [微信配置说明](./WECHAT_CONFIG.md)

## 💡 小贴士

1. **开发阶段**：可以使用微信测试号进行测试（虽然无法获取 unionid）
2. **生产环境**：务必使用认证的正式公众号
3. **安全性**：定期更新 AppSecret，不要泄露敏感信息
4. **性能**：考虑使用 Redis 缓存 state 参数和用户会话
5. **日志**：保留详细的操作日志，便于问题排查

## 🆘 需要帮助？

如果遇到问题：

1. 查看服务器日志：`tail -f server.log`
2. 查看浏览器控制台错误
3. 检查微信公众平台的接口调用日志
4. 参考 [测试指南](./TESTING_WECHAT_AUTH.md) 中的故障排查部分

祝你使用愉快！🎉

