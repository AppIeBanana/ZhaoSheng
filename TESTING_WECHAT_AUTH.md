# 微信授权流程测试指南

## 测试目的

确保用户点击"确认并进入咨询"按钮后，能够正确完成微信OAuth授权认证流程。

## 前置条件

### 1. 环境准备

- ✅ 后端服务器已启动（端口 8443）
- ✅ 前端已构建并部署
- ✅ `.env` 文件已正确配置
- ✅ SSL 证书已正确安装
- ✅ 微信公众号网页授权域名已配置

### 2. 验证服务器运行状态

```bash
# 检查后端服务是否运行
curl -I https://zswd.fzrjxy.com:8443/api/wechat/auth-url?dialogId=test

# 应该返回 200 状态码
```

## 测试步骤

### 步骤 1: 访问信息收集页面

1. 使用**微信内置浏览器**打开：`https://zswd.fzrjxy.com`
   - ⚠️ **必须在微信中打开**，外部浏览器无法完成微信授权

2. 确认页面正常加载，显示信息收集表单

### 步骤 2: 填写表单

填写以下信息：
- **考试类型**：选择"春季统考"或"秋季统考"
- **考生类型**：选择一个选项（如"城镇应届"）
- **生源省份**：选择一个省份（如"福建"）
- **民族**：选择一个民族（如"汉族"）
- **分数**（可选）：输入分数或留空

### 步骤 3: 提交表单

1. 点击页面底部的**"确认并进入咨询"**按钮

2. **预期行为：**
   - 按钮显示"处理中..."并带有加载动画
   - 浏览器自动跳转到微信授权页面

### 步骤 4: 微信授权

1. **授权页面应显示：**
   - 应用名称（你的公众号名称）
   - 请求的权限："获取你的昵称、头像、地区及性别"
   - "确认授权"和"取消"按钮

2. 点击**"确认授权"**

### 步骤 5: 授权回调

1. **预期行为：**
   - 页面自动跳转回你的网站
   - URL 格式：`https://zswd.fzrjxy.com/qa?dialogId=xxx&wechat_authorized=true&openid=xxx`
   - 进入问答页面（QA Page）

2. **检查 URL 参数：**
   - `dialogId`：对话ID（如 `dialog_1698764321234_abc123def`）
   - `wechat_authorized=true`：授权成功标志
   - `openid`：微信用户唯一标识

### 步骤 6: 验证数据保存

1. **检查服务器日志：**

```bash
# 查看服务器日志
tail -f server.log  # 或查看你的日志文件

# 应该看到类似的日志：
# 微信返回的token信息: { openid: 'oXXXXX...', unionid: 'o6_XXX...', ... }
# 微信返回的用户信息: { openid: 'oXXXXX...', nickname: '用户名', unionid: 'o6_XXX...' }
# 用户数据已保存: dialogId=dialog_xxx, openid=oXXXXX, unionid=o6_XXX
```

2. **检查 `wechat_users.json` 文件：**

```bash
# 查看用户数据文件
cat wechat_users.json

# 应该包含新增的用户数据：
{
  "dialog_1698764321234_abc123def": {
    "openid": "oXXXXXXXXXXXXXXXXXXXX",
    "unionid": "o6_bmasdasdsad6_2sgVt7hMZOPfL",
    "nickname": "微信用户",
    "headimgurl": "https://...",
    "createdAt": "2025-10-27T12:00:00.000Z",
    "lastUpdatedAt": "2025-10-27T12:00:00.000Z",
    "firstAuthAt": "2025-10-27T12:00:00.000Z"
  }
}
```

### 步骤 7: 验证前端数据获取

在问答页面（QA Page），可以调用 API 获取用户信息：

```javascript
// 在浏览器控制台执行
const dialogId = new URLSearchParams(window.location.search).get('dialogId');
fetch(`https://zswd.fzrjxy.com:8443/api/wechat/user-info?dialogId=${dialogId}`)
  .then(res => res.json())
  .then(data => console.log('用户信息:', data));

// 应该返回：
{
  "openid": "oXXXXXXXXXXXXXXXXXXXX",
  "unionid": "o6_bmasdasdsad6_2sgVt7hMZOPfL",
  "nickname": "微信用户",
  "headimgurl": "https://...",
  "createdAt": "2025-10-27T12:00:00.000Z"
}
```

## 完整流程图

```
用户填写表单
     ↓
点击"确认并进入咨询"
     ↓
前端生成 dialogId
     ↓
保存表单数据到 localStorage (key: student_data_${dialogId})
     ↓
请求后端 /api/wechat/auth-url?dialogId=xxx
     ↓
后端生成授权 URL（包含 state 参数）
     ↓
前端跳转到微信授权页面
     ↓
用户确认授权
     ↓
微信回调到后端 /api/wechat/callback?code=xxx&state=xxx
     ↓
后端验证 state
     ↓
后端用 code 换取 access_token（包含 openid 和 unionid）
     ↓
后端获取用户详细信息
     ↓
后端保存用户数据到 wechat_users.json
     ↓
后端重定向到前端 /qa?dialogId=xxx&wechat_authorized=true&openid=xxx
     ↓
前端接收参数，从 localStorage 恢复表单数据
     ↓
进入问答页面，开始对话
```

## 浏览器控制台检查

### 前端控制台（InfoCollection 页面）

应该看到以下日志：

```
正在获取微信授权URL...
成功获取微信授权URL，即将跳转...
```

### 前端控制台（QA 页面）

可以检查以下信息：

```javascript
// 检查 dialogId
console.log('对话ID:', new URLSearchParams(window.location.search).get('dialogId'));

// 检查 localStorage 中的表单数据
const dialogId = new URLSearchParams(window.location.search).get('dialogId');
console.log('表单数据:', localStorage.getItem(`student_data_${dialogId}`));

// 检查当前对话ID
console.log('当前对话ID:', localStorage.getItem('current_dialog_id'));
```

## 常见问题和解决方案

### 问题 1: 点击按钮后页面无反应

**可能原因：**
- 表单验证失败
- 后端服务未运行
- 网络连接问题

**解决方法：**
1. 检查表单是否填写完整（除了分数，其他都是必填）
2. 检查浏览器控制台是否有错误
3. 验证后端服务是否运行：`curl https://zswd.fzrjxy.com:8443/api/wechat/auth-url?dialogId=test`

### 问题 2: 跳转到微信授权页面后显示错误

**可能原因：**
- AppID 不正确
- 网页授权域名未配置或配置错误
- redirect_uri 参数不合法

**解决方法：**
1. 检查 `.env` 文件中的 `WECHAT_APPID` 是否正确
2. 确认微信公众平台的"网页授权域名"已配置为 `zswd.fzrjxy.com`
3. 检查 `WECHAT_REDIRECT_URI` 是否为 `https://zswd.fzrjxy.com/api/wechat/callback`

### 问题 3: 授权后重定向失败或显示 404

**可能原因：**
- 前端路由配置问题
- 后端回调处理错误
- state 验证失败

**解决方法：**
1. 检查服务器日志，查看错误信息
2. 确认 `/qa` 路由已正确配置
3. 检查 state 参数是否过期（有效期 10 分钟）

### 问题 4: 获取不到 unionid

**可能原因：**
- 公众号未绑定到微信开放平台
- 使用的是测试号

**解决方法：**
1. 登录 [微信开放平台](https://open.weixin.qq.com)
2. 绑定你的公众号
3. 使用正式公众号而非测试号

### 问题 5: 用户数据未保存

**可能原因：**
- 文件写入权限问题
- 服务器磁盘空间不足
- 代码逻辑错误

**解决方法：**
1. 检查 `wechat_users.json` 文件权限
2. 查看服务器日志中的错误信息
3. 确认服务器有足够的磁盘空间

## 调试技巧

### 1. 启用详细日志

在 `server.js` 中，所有关键步骤都有日志输出。确保查看完整的服务器日志。

### 2. 使用微信开发者工具

- 打开微信公众平台"开发" > "开发者工具"
- 使用"微信 Web 开发者工具"进行调试
- 可以模拟微信内置浏览器环境

### 3. 检查网络请求

在浏览器开发者工具的"网络"标签中：
- 检查 `/api/wechat/auth-url` 请求是否成功
- 查看返回的授权 URL 是否正确
- 检查微信回调时的 URL 参数

### 4. State 参数调试

```javascript
// 在服务器端添加日志
console.log('State 缓存内容:', wechatOAuth.stateCache);
```

## 性能测试

### 测试授权流程响应时间

```javascript
// 在前端测试
console.time('微信授权流程');
// 点击"确认并进入咨询"按钮
// 完成授权后执行
console.timeEnd('微信授权流程');

// 正常情况下应该在 3-5 秒内完成
```

### 并发测试

模拟多个用户同时进行授权：
- 使用不同的设备或浏览器
- 同时填写表单并提交
- 检查所有用户数据是否正确保存

## 测试检查清单

完成以下检查，确保系统正常运行：

### 前端检查
- [ ] 表单页面正常加载
- [ ] 表单验证工作正常
- [ ] 点击提交按钮后显示加载状态
- [ ] 成功跳转到微信授权页面
- [ ] 授权后正确重定向到 QA 页面
- [ ] URL 参数包含 dialogId、wechat_authorized 和 openid
- [ ] localStorage 中保存了表单数据

### 后端检查
- [ ] 服务器在端口 8443 正常运行
- [ ] `/api/wechat/auth-url` 端点返回正确的授权 URL
- [ ] state 参数正确生成并缓存
- [ ] `/api/wechat/callback` 端点正确处理回调
- [ ] 成功获取 access_token
- [ ] 成功获取用户信息
- [ ] openid 和 unionid 都已获取
- [ ] 用户数据正确保存到 `wechat_users.json`
- [ ] 正确重定向到前端 QA 页面
- [ ] `/api/wechat/user-info` 端点可以查询用户信息

### 数据检查
- [ ] `wechat_users.json` 文件已创建
- [ ] 用户数据结构正确
- [ ] 包含 openid
- [ ] 包含 unionid（如果公众号已绑定开放平台）
- [ ] 包含昵称和头像
- [ ] 包含时间戳信息

### 安全检查
- [ ] state 参数随机且唯一
- [ ] state 参数有过期时间
- [ ] state 参数使用后被删除
- [ ] HTTPS 连接正常
- [ ] 敏感信息不在 URL 中明文传输
- [ ] `.env` 文件不在版本控制中
- [ ] `wechat_users.json` 不在版本控制中

## 成功标准

以下所有条件都满足，表示测试通过：

1. ✅ 用户能够顺利完成整个授权流程
2. ✅ 服务器成功获取 openid 和 unionid
3. ✅ 用户数据正确保存到 `wechat_users.json`
4. ✅ 用户被正确重定向到 QA 页面
5. ✅ 前端可以通过 API 获取用户信息
6. ✅ 整个流程在 5 秒内完成（网络正常情况下）
7. ✅ 没有 JavaScript 错误
8. ✅ 没有服务器错误（500）

## 下一步

测试通过后，可以：
1. 在 QA 页面中使用 openid/unionid 来标识用户
2. 将用户信息与对话历史关联
3. 实现用户数据的持久化存储（考虑使用数据库）
4. 添加用户行为分析和统计功能

