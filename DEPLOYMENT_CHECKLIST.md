# 微信授权功能部署检查清单

## 📋 部署前检查

在部署到生产环境之前，请逐项确认以下内容：

## ✅ 第一部分：微信公众平台配置

### 1.1 基本配置

- [ ] 已拥有微信公众号（服务号或已认证的订阅号）
- [ ] 公众号已完成认证（获取高级接口权限）
- [ ] 已获取 AppID：`________________`
- [ ] 已获取 AppSecret：`________________`
- [ ] AppSecret 已妥善保管，未泄露

### 1.2 网页授权域名

- [ ] 已进入"设置与开发" > "公众号设置" > "功能设置"
- [ ] 已添加网页授权域名：`zswd.fzrjxy.com`
- [ ] 已下载验证文件：`MP_verify_XXXX.txt`
- [ ] 验证文件已上传到服务器根目录
- [ ] 验证文件可访问：`https://zswd.fzrjxy.com/MP_verify_XXXX.txt`
- [ ] 域名验证已通过

### 1.3 IP白名单（推荐但非必须）

- [ ] 已进入"设置与开发" > "基本配置"
- [ ] 已添加服务器IP到白名单：`________________`
- [ ] IP白名单已生效

### 1.4 微信开放平台绑定（获取 unionid）

- [ ] 已注册微信开放平台账号
- [ ] 公众号已绑定到开放平台
- [ ] 绑定关系已生效

## ✅ 第二部分：服务器环境

### 2.1 域名和证书

- [ ] 域名已备案：`zswd.fzrjxy.com`
- [ ] 已获取 SSL 证书
- [ ] SSL 证书有效期：从 `________` 到 `________`
- [ ] 私钥文件已准备：`private.key`
- [ ] 证书文件已准备：`certificate.crt`
- [ ] 证书文件已放置到 `ssl/` 目录
- [ ] 证书文件权限正确（建议 600）

验证命令：
```bash
ls -l ssl/
# 应该看到 private.key 和 certificate.crt

openssl x509 -in ssl/certificate.crt -text -noout | grep "Not After"
# 检查证书有效期
```

### 2.2 服务器配置

- [ ] 服务器系统：`________________`
- [ ] Node.js 版本：`________________` (建议 >= 14.x)
- [ ] 已安装必要的依赖包
- [ ] 防火墙已开放 8443 端口
- [ ] 防火墙已开放 443 端口（如需要）
- [ ] 服务器有足够的磁盘空间

验证命令：
```bash
node --version
npm --version

# 检查端口
sudo netstat -tlnp | grep 8443
sudo netstat -tlnp | grep 443

# 检查磁盘空间
df -h
```

### 2.3 目录结构

- [ ] 项目已部署到服务器
- [ ] 项目路径：`________________`
- [ ] `ssl/` 目录存在
- [ ] `node_modules/` 目录存在
- [ ] `src/` 目录存在

验证命令：
```bash
ls -la
# 应该看到完整的项目结构
```

## ✅ 第三部分：环境配置

### 3.1 .env 文件

- [ ] `.env` 文件已创建
- [ ] `.env` 文件位置正确（项目根目录）
- [ ] `.env` 文件权限正确（建议 600）

### 3.2 环境变量值

- [ ] `WECHAT_APPID` 已配置
- [ ] `WECHAT_APPSECRET` 已配置
- [ ] `WECHAT_REDIRECT_URI` = `https://zswd.fzrjxy.com/api/wechat/callback`
- [ ] `WECHAT_SCOPE` = `snsapi_userinfo`
- [ ] `SSL_KEY_PATH` = `./ssl/private.key`
- [ ] `SSL_CERT_PATH` = `./ssl/certificate.crt`
- [ ] `NODE_ENV` = `production`

验证命令：
```bash
# 不要直接 cat .env（会泄露敏感信息）
# 而是检查关键字段是否存在
grep -c "WECHAT_APPID" .env
grep -c "WECHAT_APPSECRET" .env
grep -c "WECHAT_REDIRECT_URI" .env
```

### 3.3 .env 文件安全性

- [ ] `.env` 文件未提交到 Git
- [ ] `.env` 在 `.gitignore` 中
- [ ] AppSecret 未在代码中硬编码
- [ ] AppSecret 未在日志中输出
- [ ] 只有必要的人员知道 AppSecret

## ✅ 第四部分：代码检查

### 4.1 关键文件

- [ ] `server.js` 存在且完整
- [ ] `src/pages/InfoCollection.tsx` 存在且完整
- [ ] `src/lib/wechatOAuth.js` 存在且完整
- [ ] `package.json` 存在且完整

### 4.2 依赖包

- [ ] 已运行 `npm install`
- [ ] `node_modules/` 目录完整
- [ ] 没有缺失的依赖包

验证命令：
```bash
npm list --depth=0
# 检查是否有未安装的包
```

### 4.3 代码版本

- [ ] 代码已更新到最新版本
- [ ] 包含用户数据保存功能
- [ ] 包含 `/api/wechat/user-info` 端点
- [ ] 前端包含改进的错误处理

验证：检查 `server.js` 中是否有 `saveUserData` 函数

### 4.4 安全文件配置

- [ ] `wechat_users.json` 在 `.gitignore` 中
- [ ] `.env` 在 `.gitignore` 中
- [ ] SSL 证书文件在 `.gitignore` 中（如果需要）

验证命令：
```bash
cat .gitignore | grep "wechat_users.json"
cat .gitignore | grep ".env"
```

## ✅ 第五部分：服务启动

### 5.1 启动前检查

- [ ] 已安装所有依赖：`npm install`
- [ ] 已检查语法错误：`node --check server.js`
- [ ] 端口 8443 未被占用

验证命令：
```bash
# 检查端口占用
lsof -i :8443
# 如果有输出，说明端口被占用
```

### 5.2 启动服务

- [ ] 启动命令：`node server.js`
- [ ] 看到日志：`✓ 私钥文件读取成功`
- [ ] 看到日志：`✓ 证书文件读取成功`
- [ ] 看到日志：`✓ SSL凭证创建成功`
- [ ] 看到日志：`微信OAuth配置初始化完成`
- [ ] 看到日志：`HTTPS服务器正在运行在端口 8443`
- [ ] 没有错误日志

### 5.3 进程管理（推荐）

- [ ] 使用 PM2 或 systemd 管理进程
- [ ] 配置自动重启
- [ ] 配置日志输出
- [ ] 配置开机自启动

PM2 示例：
```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start server.js --name wechat-oauth

# 保存配置
pm2 save

# 设置开机自启
pm2 startup
```

## ✅ 第六部分：功能测试

### 6.1 后端 API 测试

- [ ] 授权 URL 端点正常
```bash
curl -I "https://zswd.fzrjxy.com:8443/api/wechat/auth-url?dialogId=test"
# 应该返回 200
```

- [ ] 返回的 JSON 格式正确
```bash
curl "https://zswd.fzrjxy.com:8443/api/wechat/auth-url?dialogId=test"
# 应该包含 authUrl 字段
```

### 6.2 前端访问测试

- [ ] 在微信中打开：`https://zswd.fzrjxy.com`
- [ ] 页面正常加载
- [ ] 表单显示正常
- [ ] 无 JavaScript 错误

### 6.3 完整授权流程测试

- [ ] 填写表单信息
- [ ] 点击"确认并进入咨询"
- [ ] 跳转到微信授权页面
- [ ] 授权页面显示正确的应用名称
- [ ] 点击"确认授权"
- [ ] 成功重定向到 QA 页面
- [ ] URL 包含 `dialogId` 参数
- [ ] URL 包含 `wechat_authorized=true` 参数
- [ ] URL 包含 `openid` 参数

### 6.4 数据验证

- [ ] `wechat_users.json` 文件已创建
- [ ] 文件中包含用户数据
- [ ] 用户数据包含 `openid`
- [ ] 用户数据包含 `unionid`（如果已绑定开放平台）
- [ ] 用户数据包含 `nickname`
- [ ] 用户数据包含 `headimgurl`
- [ ] 时间戳正确

验证命令：
```bash
cat wechat_users.json | python -m json.tool
# 格式化查看 JSON 内容
```

### 6.5 用户信息查询测试

- [ ] 获取一个 dialogId（从 wechat_users.json）
- [ ] 查询用户信息
```bash
curl "https://zswd.fzrjxy.com:8443/api/wechat/user-info?dialogId=DIALOG_ID"
# 应该返回用户信息
```

## ✅ 第七部分：监控和日志

### 7.1 日志配置

- [ ] 服务器日志正常输出
- [ ] 日志包含关键操作记录
- [ ] 日志中不包含敏感信息（如 AppSecret）
- [ ] 配置了日志轮转（避免文件过大）

### 7.2 错误监控

- [ ] 已配置错误告警（可选）
- [ ] 定期检查日志文件
- [ ] 监控服务器资源使用

查看日志：
```bash
# 实时查看日志
tail -f server.log

# 查看错误日志
grep "错误" server.log
grep "失败" server.log
```

### 7.3 性能监控

- [ ] 监控响应时间
- [ ] 监控请求量
- [ ] 监控错误率
- [ ] 定期检查 `wechat_users.json` 文件大小

## ✅ 第八部分：安全检查

### 8.1 敏感信息保护

- [ ] `.env` 文件权限设为 600
```bash
chmod 600 .env
```

- [ ] SSL 私钥权限设为 600
```bash
chmod 600 ssl/private.key
```

- [ ] `wechat_users.json` 权限适当（600 或 640）
```bash
chmod 600 wechat_users.json
```

### 8.2 代码安全

- [ ] 无 SQL 注入风险（当前使用 JSON 文件）
- [ ] 无 XSS 漏洞
- [ ] State 参数正确验证
- [ ] State 过期时间合理（10分钟）
- [ ] State 使用后被删除

### 8.3 网络安全

- [ ] 强制使用 HTTPS
- [ ] 配置了防火墙规则
- [ ] 限制了访问 IP（如果需要）
- [ ] 配置了 IP 白名单（微信公众平台）

## ✅ 第九部分：备份和恢复

### 9.1 数据备份

- [ ] 配置了 `wechat_users.json` 定期备份
- [ ] 备份策略：每天/每周/每月
- [ ] 备份存储位置：`________________`
- [ ] 测试过备份恢复流程

备份脚本示例：
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
cp wechat_users.json backups/wechat_users_$DATE.json
# 保留最近30天的备份
find backups/ -name "wechat_users_*.json" -mtime +30 -delete
```

### 9.2 配置备份

- [ ] `.env` 文件有安全备份（不在 Git 中）
- [ ] SSL 证书有备份
- [ ] 代码已提交到 Git

## ✅ 第十部分：文档和知识转移

### 10.1 文档完整性

- [ ] `README_WECHAT_AUTH.md` 存在
- [ ] `WECHAT_OAUTH_FLOW.md` 存在
- [ ] `ENV_SETUP.md` 存在
- [ ] `TESTING_WECHAT_AUTH.md` 存在
- [ ] `QUICKSTART_WECHAT_AUTH.md` 存在
- [ ] `WECHAT_AUTH_IMPLEMENTATION_SUMMARY.md` 存在
- [ ] 本检查清单文件存在

### 10.2 运维文档

- [ ] 记录了启动/停止服务的方法
- [ ] 记录了常见问题和解决方案
- [ ] 记录了紧急联系方式
- [ ] 记录了 AppID 和域名等关键信息（安全位置）

### 10.3 团队培训

- [ ] 相关人员已了解授权流程
- [ ] 相关人员知道如何查看日志
- [ ] 相关人员知道如何重启服务
- [ ] 相关人员知道如何排查常见问题

## ✅ 第十一部分：上线后验证

### 11.1 立即验证

上线后立即进行以下测试：

- [ ] 完整的授权流程测试（至少 3 次）
- [ ] 检查用户数据是否正确保存
- [ ] 检查服务器日志是否正常
- [ ] 检查资源占用（CPU、内存、磁盘）

### 11.2 持续监控

上线后前 24 小时：

- [ ] 每小时检查一次服务状态
- [ ] 监控错误率
- [ ] 收集用户反馈
- [ ] 准备回滚方案

### 11.3 一周后评估

- [ ] 收集使用数据
- [ ] 分析常见问题
- [ ] 优化性能瓶颈
- [ ] 更新文档

## 📊 检查清单总结

### 必须完成的项目（❗）

- ❗ 微信公众号已认证
- ❗ 网页授权域名已配置并验证
- ❗ SSL 证书已安装且有效
- ❗ `.env` 文件已正确配置
- ❗ 后端服务已启动且正常运行
- ❗ 完整授权流程测试通过
- ❗ 用户数据正确保存
- ❗ 敏感文件不在版本控制中

### 强烈推荐的项目（⭐）

- ⭐ 配置 IP 白名单
- ⭐ 绑定微信开放平台（获取 unionid）
- ⭐ 使用进程管理工具（PM2）
- ⭐ 配置数据备份
- ⭐ 配置日志轮转
- ⭐ 设置错误告警

### 可选的项目（💡）

- 💡 使用 Redis 缓存 state
- 💡 迁移到数据库存储
- 💡 实现性能监控
- 💡 实现用户行为分析

## 🎯 上线标准

当以下所有条件都满足时，可以上线：

✅ **环境配置**：所有必需的环境变量已配置  
✅ **微信配置**：公众号配置完成且验证通过  
✅ **服务运行**：后端服务稳定运行  
✅ **功能测试**：完整流程测试通过  
✅ **数据验证**：用户数据正确保存和查询  
✅ **安全检查**：敏感信息已保护  
✅ **日志正常**：无错误日志  
✅ **文档完整**：所有文档已准备  

## 📝 签署确认

- 配置人员：`________________` 日期：`________`
- 测试人员：`________________` 日期：`________`
- 审核人员：`________________` 日期：`________`
- 上线负责人：`________________` 日期：`________`

---

**提示**：请打印此清单，逐项确认后在对应位置打 ✓，确保万无一失！

**最后更新**：2025-10-27

