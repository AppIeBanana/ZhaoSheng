// 后端服务器，用于处理Redis操作
const express = require('express');
const cors = require('cors');
const redis = require('redis');
const dotenv = require('dotenv');
const fs = require('fs');
const https = require('https');
const app = express();

// 加载环境变量
dotenv.config();

// 中间件
// 配置CORS，允许前端访问
// - 开发环境：本地开发服务器端口
// - 生产环境：正式域名
app.use(cors({ 
  origin: [
    // 开发环境端口 - 前端运行端口
    'http://localhost:3000',
    // 开发环境端口 - 后端端口
    'http://localhost:3001',
    // 生产环境域名
    'https://zswd.fzrjxy.com'
  ], 
  methods: ['GET', 'POST', 'DELETE'],
  credentials: true // 允许携带凭证
}));
app.use(express.json());

// 添加请求日志中间件
app.use((req, _, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Redis客户端配置和连接
let redisClient;
let currentRedisConfig = {
  host: process.env.VITE_REDIS_HOST,
  port: parseInt(process.env.VITE_REDIS_PORT),
  password: process.env.VITE_REDIS_PASSWORD
};

// 端口配置：从环境变量获取，默认值为开发环境端口3001
const PORT = process.env.PORT || 3001;

// 检查Redis连接状态的函数
async function ensureRedisConnection() {
  try {
    if (!redisClient || !redisClient.isOpen) {
      console.log('Redis连接不可用，重新连接...');
      await connectRedis(currentRedisConfig.host, currentRedisConfig.port, currentRedisConfig.password);
    }
    // 测试连接
    await redisClient.ping();
    return true;
  } catch (error) {
    console.error('Redis连接测试失败:', error);
    return false;
  }
}

async function connectRedis(host = process.env.VITE_REDIS_HOST, port = parseInt(process.env.VITE_REDIS_PORT), password = process.env.VITE_REDIS_PASSWORD) {
  try {
    // 如果已有连接，先断开
    if (redisClient) {
      try {
        await redisClient.disconnect();
      } catch (e) {
        console.warn('关闭现有Redis连接时出错:', e);
      }
    }
    
    // 更新当前配置
    currentRedisConfig = { host, port, password };
    
    // 创建Redis客户端（添加认证支持）
    redisClient = redis.createClient({
      url: password ? `redis://:${encodeURIComponent(password)}@${host}:${port}` : `redis://${host}:${port}`,
      password: password,
      // 数据库配置（默认使用第0个数据库）
      db: 0,
      // 配置重试策略
      socket: {
        reconnectStrategy: (retries) => {
          // 指数退避重试
          const delay = Math.min(retries * 100, 3000);
          console.log(`Redis尝试第 ${retries} 次重连，延迟 ${delay}ms`);
          return delay;
        },
        connectTimeout: 10000 // 10秒连接超时
      }
    });

    // 连接事件处理
    redisClient.on('connect', () => {
      console.log('Redis客户端已连接');
    });

    redisClient.on('error', (err) => {
      console.error('Redis连接错误:', err);
    });

    redisClient.on('end', () => {
      console.log('Redis连接已关闭');
    });
    
    redisClient.on('reconnecting', (info) => {
      console.log('Redis正在重新连接:', info);
    });

    // 连接到Redis
    await redisClient.connect();
    return true;
  } catch (error) {
    console.error('Redis连接失败:', error);
    return false;
  }
}

// 初始化Redis连接
connectRedis();

// 统一的过期时间常量（秒） - 60分钟
const EXPIRY_TIME_SECONDS = 60 * 60;

// API路由

// 保存学生数据到Redis
app.post('/api/student-data', async (req, res) => {
  try {
    const { userId, studentData, redisConfig } = req.body;
    
    // 如果提供了自定义Redis配置，并且与当前配置不同，则重新连接
    if (redisConfig && (redisConfig.host !== currentRedisConfig.host || redisConfig.port !== currentRedisConfig.port)) {
      console.log(`切换到自定义Redis配置: ${redisConfig.host}:${redisConfig.port}`);
      await connectRedis(redisConfig.host, redisConfig.port);
    }
    
    // 确保Redis客户端已连接
    const isConnected = await ensureRedisConnection();
    
    // 设置过期时间
    try {
      if (isConnected) {
        // 使用新的redis客户端API格式
        await redisClient.set(`student:${userId}`, JSON.stringify(studentData), {          EX: EXPIRY_TIME_SECONDS
        });
        res.json({ success: true, message: '学生数据已保存到Redis' });
      } else {
        throw new Error('Redis连接不可用');
      }
    } catch (redisError) {
      console.error(`保存学生数据到Redis失败: ${redisError.message}`);
      // 即使Redis保存失败，也返回成功，因为前端会使用localStorage作为备用
      res.json({ 
        success: true, 
        message: '使用备用存储',
        redisError: redisError.message 
      });
    }
  } catch (error) {
    console.error('保存学生数据到Redis失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 从Redis获取学生数据
app.get('/api/student-data/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { host, port } = req.query;
    
    // 如果提供了自定义Redis配置，并且与当前配置不同，则重新连接
    if (host && port && (host !== currentRedisConfig.host || parseInt(port) !== currentRedisConfig.port)) {
      console.log(`切换到自定义Redis配置: ${host}:${port}`);
      await connectRedis(host, parseInt(port));
    }
    
    // 确保Redis客户端已连接
    const isConnected = await ensureRedisConnection();
    
    // 从Redis获取数据
    try {
      if (isConnected) {
        const data = await redisClient.get(`student:${userId}`);
        res.json({ 
          success: true, 
          data: data ? JSON.parse(data) : null 
        });
      } else {
        throw new Error('Redis连接不可用');
      }
    } catch (redisError) {
      console.error(`从Redis获取学生数据失败: ${redisError.message}`);
      res.json({ 
        success: true, 
        data: null, // 无数据时返回null，前端会使用localStorage作为备用
        redisError: redisError.message 
      });
    }
  } catch (error) {
    console.error('从Redis获取学生数据失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 清除Redis中的学生数据
app.delete('/api/student-data/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { redisConfig } = req.body;
    
    // 如果提供了自定义Redis配置，并且与当前配置不同，则重新连接
    if (redisConfig && (redisConfig.host !== currentRedisConfig.host || redisConfig.port !== currentRedisConfig.port)) {
      console.log(`切换到自定义Redis配置: ${redisConfig.host}:${redisConfig.port}`);
      await connectRedis(redisConfig.host, redisConfig.port);
    }
    
    // 确保Redis客户端已连接
    const isConnected = await ensureRedisConnection();
    
    // 从Redis删除数据
    try {
      if (isConnected) {
        await redisClient.del(`student:${userId}`);
        res.json({ success: true, message: '学生数据已清除' });
      } else {
        throw new Error('Redis连接不可用');
      }
    } catch (redisError) {
      console.error(`从Redis删除学生数据失败: ${redisError.message}`);
      res.json({ 
        success: false, 
        message: '清除数据失败',
        redisError: redisError.message 
      });
    }
  } catch (error) {
    console.error('从Redis删除学生数据失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 健康检查端点
app.get('/api/health', async (req, res) => {
  try {
    // 检查Redis连接
    const isConnected = await ensureRedisConnection();
    
    res.json({ 
      success: true, 
      redisConnected: isConnected,
      message: isConnected ? '服务运行正常' : '服务运行但Redis连接不可用',
      redisConfig: currentRedisConfig
    });
  } catch (error) {
    console.error('健康检查失败:', error);
    res.status(500).json({ 
      success: false, 
      redisConnected: false,
      error: error.message,
      redisConfig: currentRedisConfig
    });
  }
});

// 启动服务器
if (PORT === 443) {
    // HTTPS配置
    const privateKey = fs.readFileSync(process.env.VITE_SSL_KEY_PATH || './ssl/private.key', 'utf8');
    const certificate = fs.readFileSync(process.env.VITE_SSL_CERT_PATH || './ssl/certificate.crt', 'utf8');
    const credentials = { key: privateKey, cert: certificate };
  
  const httpsServer = https.createServer(credentials, app);
  httpsServer.listen(PORT, () => {
    console.log(`后端HTTPS服务器运行在 https://localhost:${PORT}`);
    console.log(`Redis连接配置: 主机=${currentRedisConfig.host}, 端口=${currentRedisConfig.port}`);
  });
} else {
  // HTTP配置（开发环境）
  app.listen(PORT, () => {
    console.log(`后端服务器运行在 http://localhost:${PORT}`);
    console.log(`Redis连接配置: 主机=${currentRedisConfig.host}, 端口=${currentRedisConfig.port}`);
  });
}

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('正在关闭服务器...');
  if (redisClient && redisClient.isOpen) {
    await redisClient.disconnect();
  }
  process.exit(0);
});