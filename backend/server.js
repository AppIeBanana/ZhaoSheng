// 后端服务器入口文件
// 引入模块化组件
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const https = require('https');
const mongoose = require('mongoose');

// 加载环境变量
dotenv.config();

// 初始化应用
const app = express();

// 引入数据库连接模块
const { connectMongoDB } = require('./config/database');

// 引入Redis连接模块
const { ensureConnection } = require('./config/redis');

// 引入数据模型
require('./models');

// 引入路由模块
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const healthRoutes = require('./routes/healthRoutes');

// 配置中间件
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://zswd.fzrjxy.com'
  ],
  methods: ['GET', 'POST', 'DELETE'],
  credentials: true
}));

app.use(express.json());

// 请求日志中间件
app.use((req, _, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// 注册路由
app.use('/api/user-data', userRoutes);
app.use('/api/chat-history', chatRoutes);
app.use('/api/health', healthRoutes);

// 端口配置
const PORT = process.env.PORT || 3001;

// 启动服务器
async function startServer() {
  try {
    // 初始化数据库连接
    await connectMongoDB();
    
    // 确保Redis连接
    await ensureConnection();
    
    if (PORT === 443) {
      // HTTPS配置
      const privateKey = fs.readFileSync(process.env.VITE_SSL_KEY_PATH || './ssl/private.key', 'utf8');
      const certificate = fs.readFileSync(process.env.VITE_SSL_CERT_PATH || './ssl/certificate.crt', 'utf8');
      const credentials = { key: privateKey, cert: certificate };

      const httpsServer = https.createServer(credentials, app);
      httpsServer.listen(PORT, () => {
        console.log(`后端HTTPS服务器运行在 https://localhost:${PORT}`);
        console.log('Redis连接配置将在首次访问时初始化');
      });
    } else {
      // HTTP配置（开发环境）
      app.listen(PORT, () => {
        console.log(`后端服务器运行在 http://localhost:${PORT}`);
        console.log('Redis连接配置将在首次访问时初始化');
      });
    }
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('正在关闭服务器...');
  
  try {
    // 关闭MongoDB连接
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('MongoDB连接已关闭');
    }
    
    console.log('服务器已成功关闭');
    process.exit(0);
  } catch (error) {
    console.error('关闭服务器时出错:', error);
    process.exit(1);
  }
});

// 启动服务器
startServer();