// 健康检查路由
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const redisClient = require('../config/redis');

/**
 * 健康检查端点 - 检查Redis和MongoDB连接状态
 */
router.get('/', async (req, res) => {
  try {
    // 检查Redis连接
    const redisConnected = await redisClient.ensureConnection();
    
    // 检查MongoDB连接
    const mongoConnected = mongoose.connection.readyState === 1;
    
    // 获取Redis配置信息
    const redisConfig = redisClient.getConfig();
    
    res.json({ 
      success: true, 
      redisConnected,
      mongoConnected,
      message: redisConnected && mongoConnected ? '服务运行正常' : '部分服务不可用',
      redisConfig,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('健康检查失败:', error);
    
    // 即使发生错误也要尝试获取各服务状态
    let redisConnected = false;
    let redisConfig = {};
    
    try {
      redisConnected = await redisClient.ensureConnection();
      redisConfig = redisClient.getConfig();
    } catch (redisError) {
      console.error('Redis连接检查失败:', redisError);
    }
    
    const mongoConnected = mongoose.connection.readyState === 1;
    
    res.status(500).json({ 
      success: false, 
      redisConnected,
      mongoConnected,
      error: error.message,
      redisConfig,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;