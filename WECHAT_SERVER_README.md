# 微信服务器验证服务配置说明

本文档详细说明微信服务器验证服务的配置、启动和注意事项，确保服务能够正确监听443端口并响应微信服务器的验证请求。

## 服务概述

- **服务文件**: `server.js`
- **协议**: HTTPS
- **端口**: 443（标准HTTPS端口）
- **验证路径**: `/wechat`
- **生产地址**: `https://zswd.fzrjxy.com/wechat`

## 前提条件

### 1. Node.js环境

确保服务器已安装Node.js。该服务使用Node.js内置模块实现，无需安装额外依赖。

### 2. SSL证书

服务需要有效的SSL证书才能运行：

- **生产环境**: 使用Let's Encrypt证书，路径已配置为：
  - 私钥: `/etc/letsencrypt/live/zswd.fzrjxy.com/privkey.pem`
  - 证书: `/etc/letsencrypt/live/zswd.fzrjxy.com/fullchain.pem`

- **开发环境**: 使用本地证书文件：
  - 私钥: `./plk741023`
  - 证书: `./plk741023.pub`

### 3. 端口权限

监听443端口需要管理员/root权限：
- **Windows**: 以管理员身份运行命令提示符
- **Linux/Mac**: 使用`sudo`命令

## 启动方法

### Windows系统

1. 右键点击`start-wechat-server.bat`，选择"以管理员身份运行"

或者：

1. 以管理员身份打开命令提示符
2. 导航到项目目录
3. 运行：`node server.js`

### Linux/Mac系统

1. 为脚本添加执行权限：`chmod +x start-wechat-server.sh`
2. 使用root权限运行：`sudo ./start-wechat-server.sh`

或者：

1. 直接使用root权限运行：`sudo node server.js`

## 环境变量配置

可以通过设置环境变量来控制服务行为：

- `NODE_ENV=production`: 启用生产环境配置
- `NODE_ENV=development`: 启用开发环境配置（默认）

## 微信公众平台配置

在微信公众平台配置中填写以下信息：

1. **服务器地址(URL)**: `https://zswd.fzrjxy.com/wechat`
2. **Token**: 与`src/lib/config.ts`中的`TOKEN`值保持一致
3. **消息加解密方式**: 明文模式
4. **编码格式**: UTF-8

## 常见问题排查

### 1. 端口占用

如果遇到`EADDRINUSE`错误，表示443端口已被占用：

- **Windows**: 使用`netstat -ano | findstr :443`查看占用端口的进程
- **Linux/Mac**: 使用`sudo lsof -i :443`查看占用端口的进程

### 2. 权限不足

如果遇到`EACCES`错误，表示没有权限监听443端口：

- 确保使用管理员/root权限运行服务

### 3. 证书问题

如果证书加载失败，请检查：

- 证书文件是否存在
- 文件路径是否正确
- 文件权限是否允许读取

### 4. 微信验证失败

如果微信公众平台验证失败，请检查：

- Token值是否与微信公众平台配置一致
- 服务器是否可以从公网访问
- 证书是否有效（不是自签名证书或过期证书）

## 日志说明

服务启动后会输出详细日志，包括：

- 服务启动状态
- 监听端口信息
- SSL证书加载状态
- 微信验证详情
- 测试URL（用于本地测试）

## 优雅关闭

服务支持优雅关闭，可以通过以下方式关闭服务：

- **Windows**: 按`Ctrl + C`
- **Linux/Mac**: 按`Ctrl + C`或发送`SIGTERM`信号

服务会在关闭前完成正在处理的请求，确保不会中断正在进行的微信验证。

## 安全注意事项

1. 确保私钥文件权限正确，仅允许必要的用户访问
2. 定期更新SSL证书以避免过期
3. 在生产环境中，建议配置适当的防火墙规则
4. 考虑使用进程管理器（如PM2）来管理Node.js进程，确保服务稳定运行