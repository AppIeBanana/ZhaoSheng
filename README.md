# SSL证书配置与端口冲突解决指南

## 端口80被占用问题解决

如果您遇到"Could not bind TCP port 80"错误，说明端口80已被其他进程占用，解决方法如下：

### 方法1：查找并停止占用端口的进程
```bash
# 查找占用端口80的进程
sudo lsof -i :80
sudo netstat -tulpn | grep :80

# 根据进程ID停止进程
sudo kill -9 <进程ID>
```

### 方法2：使用Docker Compose管理端口
本项目已配置Docker Compose自动管理端口映射，只需：
```bash
# 启动所有服务（包括Nginx，已正确配置端口80和443）
docker-compose up -d

# 如果需要运行Certbot获取证书，请先停止Nginx容器
docker-compose stop web
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
docker-compose up -d
```

### 方法3：修改Nginx配置使用其他端口
如需使用非标准端口，请修改nginx.conf中的端口配置：
```
# 将
listen 80;
# 修改为
listen 8080;  # 或其他未占用的端口
```

并更新docker-compose.yml中的端口映射：
```
ports:
  - "8080:8080"
  - "443:443"
```