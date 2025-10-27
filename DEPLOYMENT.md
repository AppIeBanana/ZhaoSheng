# 部署指南

## 环境变量配置

### 本地开发环境

1. 复制 `.env.example` 文件为 `.env`：
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，填入实际的配置值：
```bash
# 微信配置
WECHAT_TOKEN=你的微信token
WECHAT_APPID=你的微信appid
WECHAT_APPSECRET=你的微信appsecret
WECHAT_SCOPE=snsapi_userinfo
WECHAT_REDIRECT_URI=https://zswd.fzrjxy.com/api/wechat/callback

# Coze API配置
COZE_AUTH_TOKEN=你的coze授权token
COZE_API_URL=https://api.coze.cn/v3/chat
COZE_BOT_ID=你的bot_id
COZE_WORKFLOW_ID=你的workflow_id

# 服务器配置
NODE_ENV=development
PORT=443

# SSL证书路径（本地开发可能不需要）
SSL_CERT_PATH=/path/to/your/cert.pem
SSL_KEY_PATH=/path/to/your/key.pem
```

### 生产环境部署

#### 方式一：使用 .env 文件（推荐）

1. 登录到生产服务器

2. 进入项目目录：
```bash
cd /path/to/your/project
```

3. 创建 `.env` 文件：
```bash
nano .env
```

4. 填入生产环境的配置（参考 `.env.example`）

5. 设置文件权限（重要！）：
```bash
chmod 600 .env
chown www-data:www-data .env  # 根据实际运行用户调整
```

#### 方式二：使用系统环境变量

在服务器上设置系统级环境变量：

1. 编辑 systemd 服务文件（如果使用 systemd）：
```bash
sudo nano /etc/systemd/system/zhaosheng.service
```

2. 在 `[Service]` 部分添加环境变量：
```ini
[Service]
Environment="WECHAT_TOKEN=你的值"
Environment="WECHAT_APPID=你的值"
Environment="WECHAT_APPSECRET=你的值"
Environment="COZE_AUTH_TOKEN=你的值"
Environment="COZE_BOT_ID=你的值"
Environment="COZE_WORKFLOW_ID=你的值"
Environment="NODE_ENV=production"
Environment="PORT=443"
Environment="SSL_CERT_PATH=/etc/letsencrypt/live/zswd.fzrjxy.com/fullchain.pem"
Environment="SSL_KEY_PATH=/etc/letsencrypt/live/zswd.fzrjxy.com/privkey.pem"
```

3. 重新加载 systemd 配置并重启服务：
```bash
sudo systemctl daemon-reload
sudo systemctl restart zhaosheng
```

#### 方式三：使用 PM2 生态系统文件

如果使用 PM2 管理进程：

1. 创建 `ecosystem.config.js`：
```javascript
module.exports = {
  apps: [{
    name: 'zhaosheng',
    script: 'server.js',
    env: {
      NODE_ENV: 'production',
      WECHAT_TOKEN: '你的值',
      WECHAT_APPID: '你的值',
      WECHAT_APPSECRET: '你的值',
      COZE_AUTH_TOKEN: '你的值',
      COZE_BOT_ID: '你的值',
      COZE_WORKFLOW_ID: '你的值',
      PORT: 443,
      SSL_CERT_PATH: '/etc/letsencrypt/live/zswd.fzrjxy.com/fullchain.pem',
      SSL_KEY_PATH: '/etc/letsencrypt/live/zswd.fzrjxy.com/privkey.pem'
    }
  }]
};
```

2. 使用 PM2 启动：
```bash
pm2 start ecosystem.config.js
```

**注意：不要将 `ecosystem.config.js` 提交到 Git！** 应该将它添加到 `.gitignore`。

## 安全建议

1. **永远不要将 `.env` 文件提交到 Git**
2. **限制 `.env` 文件的访问权限**（chmod 600）
3. **定期更换敏感信息**（如 Token、密钥等）
4. **使用不同的配置值用于开发和生产环境**
5. **考虑使用密钥管理服务**（如 AWS Secrets Manager、HashiCorp Vault 等）

## SSL 证书配置

当前配置使用 Let's Encrypt 证书：
- 证书路径: `/etc/letsencrypt/live/zswd.fzrjxy.com/fullchain.pem`
- 私钥路径: `/etc/letsencrypt/live/zswd.fzrjxy.com/privkey.pem`

### 证书自动续期

Let's Encrypt 证书有效期为 90 天，需要定期续期。

1. 安装 certbot（如果尚未安装）：
```bash
sudo apt-get install certbot
```

2. 设置自动续期：
```bash
sudo certbot renew --dry-run
```

3. 添加到 cron 任务：
```bash
sudo crontab -e
```

添加以下行（每天凌晨 2 点检查）：
```
0 2 * * * certbot renew --quiet && systemctl restart zhaosheng
```

## 首次部署检查清单

- [ ] 从 GitLab 克隆代码
- [ ] 安装依赖：`pnpm install`
- [ ] 创建 `.env` 文件并填入正确的配置
- [ ] 设置 `.env` 文件权限：`chmod 600 .env`
- [ ] 验证 SSL 证书文件存在且可访问
- [ ] 构建前端：`pnpm build`
- [ ] 启动服务：`node server.js` 或使用 PM2/systemd
- [ ] 验证服务是否正常运行：`curl https://zswd.fzrjxy.com`

## 更新部署

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 安装新依赖（如果有）
pnpm install

# 3. 重新构建前端
pnpm build

# 4. 重启服务
sudo systemctl restart zhaosheng
# 或
pm2 restart zhaosheng
```

## 故障排查

### 服务无法启动

1. 检查环境变量是否正确配置：
```bash
node -e "require('dotenv').config(); console.log(process.env.WECHAT_APPID)"
```

2. 检查 SSL 证书文件：
```bash
ls -l /etc/letsencrypt/live/zswd.fzrjxy.com/
```

3. 检查端口是否被占用：
```bash
sudo netstat -tulpn | grep :443
```

4. 查看服务日志：
```bash
sudo journalctl -u zhaosheng -f
# 或
pm2 logs zhaosheng
```

