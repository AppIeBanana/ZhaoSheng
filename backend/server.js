// 后端服务器入口文件
// 引入模块化组件
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const https = require('https');
const mongoose = require('mongoose');
const { systemLogger } = require('./utils/logger');

// 加载环境变量
dotenv.config();

// 环境配置
const configLoader = require('./config/configLoader');
const config = configLoader.default || {};
const NODE_ENV = configLoader.NODE_ENV || 'development';

// 确保配置中包含SSL路径
if (NODE_ENV.indexOf('production') >= 0) {
  config.SSL_KEY_PATH = config.SSL_KEY_PATH || '/etc/letsencrypt/live/zswd.fzrjxy.com/privkey.pem';
  config.SSL_CERT_PATH = config.SSL_CERT_PATH || '/etc/letsencrypt/live/zswd.fzrjxy.com/fullchain.pem';
} else {
  // 开发环境不使用SSL
  config.SSL_KEY_PATH = null;
  config.SSL_CERT_PATH = null;
}

// 初始化应用
const app = express();

// 引入数据库连接模块
const { connectMongoDB } = require('./config/mongodb');

// 引入Redis连接模块
const { ensureConnection } = require('./config/redis');

// 引入数据模型
require('./models');

// 引入路由模块
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const healthRoutes = require('./routes/healthRoutes');

// 配置中间件 - 根据环境配置CORS
const corsOptions = {
  methods: ['GET', 'POST', 'DELETE', 'PUT'],
  credentials: true
};

// 根据环境设置不同的CORS源
if (NODE_ENV.indexOf('development') >= 0) {
  corsOptions.origin = [
    'http://localhost:3000',
    'http://192.168.5.3:3000' // 局域网IP地址
  ];
} else {
  // 生产环境设置
  corsOptions.origin = [
    'https://zswd.fzrjxy.com',
    'http://175.42.63.9:82'
  ];
}

app.use(cors(corsOptions));

app.use(express.json());

// 请求日志中间件
app.use((req, _, next) => {
  const logMessage = `[${new Date().toISOString()}] ${req.method} ${req.path}`;
  systemLogger.info(logMessage, { ip: req.ip, method: req.method, path: req.path });
  next();
});

// 注册路由
app.use('/api/user-data', userRoutes);
app.use('/api/chat-history', chatRoutes);
app.use('/api/health', healthRoutes);

// 端口配置 - 使用配置加载器中的端口
const PORT = config.PORT;

// 启动服务器
async function startServer() {
  try {
    // 初始化数据库连接
    await connectMongoDB();
    
    // 确保Redis连接
    await ensureConnection();
    
    // 记录环境信息
    systemLogger.info(`服务器启动 - 环境: ${NODE_ENV}, 端口: ${PORT}`);
    
    // 根据环境决定是否使用HTTPS
    if (NODE_ENV.indexOf('production') >= 0 && config.SSL_KEY_PATH && config.SSL_CERT_PATH) {
      try {
        // 检查证书文件是否存在
        if (fs.existsSync(config.SSL_KEY_PATH) && fs.existsSync(config.SSL_CERT_PATH)) {
          // HTTPS配置
          const privateKey = fs.readFileSync(config.SSL_KEY_PATH, 'utf8');
          const certificate = fs.readFileSync(config.SSL_CERT_PATH, 'utf8');
          const credentials = { key: privateKey, cert: certificate };

          const httpsServer = https.createServer(credentials, app);
          httpsServer.listen(PORT, () => {
            const serverMessage = `后端HTTPS服务器运行在 https://localhost:${PORT}`;
            systemLogger.info(serverMessage);
            console.log(serverMessage);
            
            const redisInitMessage = 'Redis连接配置将在首次访问时初始化';
            systemLogger.info(redisInitMessage);
            console.log(redisInitMessage);
          });
        } else {
          // 证书文件不存在，使用HTTP
          systemLogger.warn('SSL证书文件不存在，将使用HTTP协议');
          console.warn('SSL证书文件不存在，将使用HTTP协议');
          app.listen(PORT, '0.0.0.0', () => {
            const serverMessage = `后端服务器运行在 http://0.0.0.0:${PORT}`;
            systemLogger.info(serverMessage);
            console.log(serverMessage);
            
            const lanMessage = '服务器可通过局域网IP访问，支持多用户测试';
            systemLogger.info(lanMessage);
            console.log(lanMessage);
            
            const redisInitMessage = 'Redis连接配置将在首次访问时初始化';
            systemLogger.info(redisInitMessage);
            console.log(redisInitMessage);
          });
        }
      } catch (sslError) {
        // SSL配置出错，降级使用HTTP
        systemLogger.error('SSL配置错误，将使用HTTP协议:', { error: sslError.message });
        console.error('SSL配置错误，将使用HTTP协议:', sslError);
        app.listen(PORT, '0.0.0.0', () => {
          const serverMessage = `后端服务器运行在 http://0.0.0.0:${PORT}`;
          systemLogger.info(serverMessage);
          console.log(serverMessage);
          
          const lanMessage = '服务器可通过局域网IP访问，支持多用户测试';
          systemLogger.info(lanMessage);
          console.log(lanMessage);
          
          const redisInitMessage = 'Redis连接配置将在首次访问时初始化';
          systemLogger.info(redisInitMessage);
          console.log(redisInitMessage);
        });
      }
    } else {
      // HTTP配置（开发环境或SSL配置不完整）
      app.listen(PORT, '0.0.0.0', () => {
        const serverMessage = `后端服务器运行在 http://0.0.0.0:${PORT}`;
        systemLogger.info(serverMessage);
        console.log(serverMessage);
        
        const lanMessage = '服务器可通过局域网IP访问，支持多用户测试';
        systemLogger.info(lanMessage);
        console.log(lanMessage);
        
        const redisInitMessage = 'Redis连接配置将在首次访问时初始化';
        systemLogger.info(redisInitMessage);
        console.log(redisInitMessage);
      });
    }
  } catch (error) {
    systemLogger.error('服务器启动失败:', { error: error.message, stack: error.stack });
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGINT', async () => {
  const shutdownMessage = '正在关闭服务器...';
  systemLogger.info(shutdownMessage);
  console.log(shutdownMessage);
  
  try {
    // 关闭MongoDB连接
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      const mongoCloseMessage = 'MongoDB连接已关闭';
      systemLogger.info(mongoCloseMessage);
      console.log(mongoCloseMessage);
    }
    
    const successMessage = '服务器已成功关闭';
    systemLogger.info(successMessage);
    console.log(successMessage);
    process.exit(0);
  } catch (error) {
    systemLogger.error('关闭服务器时出错:', { error: error.message, stack: error.stack });
    console.error('关闭服务器时出错:', error);
    process.exit(1);
  }
});

// 启动服务器
startServer();