// 用户数据路由
const express = require('express');
const router = express.Router();
const { redisClient } = require('../config/redis');
const {
  saveUserDataToRedis,
  getUserDataFromRedis,
  clearUserRedisCache
} = require('../services/redisDataService');
const { saveUserDataToMongoDB, getUserDataFromMongoDB } = require('../services/mongodbDataService');

/**
 * 保存用户数据到数据库和Redis缓存
 */
router.post('/', async (req, res) => {
  try {
    const { userId = req.body.userId, userData = req.body.userData || req.body } = req.body;
    const { phone } = userData;
    const host = req.body.host;
    const port = req.body.port;
    const { expireTime } = req.body.redisConfig || {};
    
    // 如果提供了自定义Redis配置，并且与当前配置不同，则重新连接
    if (host && port && 
        (host !== redisClient.getConfig().host || 
         parseInt(port) !== redisClient.getConfig().port)) {
      console.log(`切换到自定义Redis配置: ${host}:${port}`);
      await redisClient.reconnect(host, parseInt(port));
    }
    
    // 验证必需字段
    if (!phone) {
      return res.status(400).json({ 
        success: false, 
        error: '手机号是必需的' 
      });
    }
    
    // 准备要保存的数据
    const saveData = {
      ...userData,
      created_at: new Date(),
      update_at: new Date()
    };
    
    // 删除不需要保存到数据库的字段
    delete saveData.host;
    delete saveData.port;
    
    // 保存到MongoDB（使用服务层）
    const savedUser = await saveUserDataToMongoDB(userId || phone, saveData);
    
    if (!savedUser || !savedUser._id) {
      throw new Error('保存用户数据失败，未获取到MongoDB生成的ID');
    }
    
    console.log('用户数据已保存到MongoDB:', savedUser._id);
    
    // 保存到Redis缓存，使用手机号作为键
    // 如果前端传递了过期时间，使用传递的过期时间，否则使用默认的1小时
    await saveUserDataToRedis(saveData.phone, {
      _id: savedUser._id.toString(),
      ...saveData
    }, expireTime);
    
    res.json({ 
      success: true, 
      message: '用户数据保存成功',
      data: {
        _id: savedUser._id.toString(),
        ...saveData
      }
    });
  } catch (error) {
    console.error('保存用户数据失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 从数据库获取用户数据 - 优先Redis缓存，其次MongoDB
 */
router.get('/', async (req, res) => {
  try {
    const { userId, host, port, phone } = req.query;
    
    // 如果提供了自定义Redis配置，并且与当前配置不同，则重新连接
    if (host && port && 
        (host !== redisClient.getConfig().host || 
         parseInt(port) !== redisClient.getConfig().port)) {
      console.log(`切换到自定义Redis配置: ${host}:${port}`);
      await redisClient.reconnect(host, parseInt(port));
    }
    
    if (!userId || !phone) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }
    
    // 尝试从Redis获取数据
    const redisData = await getUserDataFromRedis(phone, userId);
    if (redisData) {
      return res.status(200).json({
        success: true,
        data: redisData,
        source: 'redis'
      });
    }
    
    // 从MongoDB获取数据（使用服务层）
    // mongodbDataService严格使用手机号进行查询
    const userData = await getUserDataFromMongoDB(userId, phone);
    
    if (!userData) {
      return res.status(404).json({
        success: false,
        message: '用户数据不存在'
      });
    }
    
    // 更新Redis缓存，使用手机号作为键
    // 使用默认的1小时过期时间
    await saveUserDataToRedis(userData.phone, userData, 3600);
    
    res.status(200).json({
      success: true,
      data: userData,
      source: 'mongodb'
    });
  } catch (error) {
    console.error('获取用户数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户数据失败',
      error: error.message
    });
  }
});

/**
 * 清除用户数据 - 清除Redis缓存，MongoDB数据保留（避免误删用户历史数据）
 */
router.delete('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { redisConfig } = req.body;
    
    // 如果提供了自定义Redis配置，并且与当前配置不同，则重新连接
    if (redisConfig && 
        (redisConfig.host !== redisClient.getConfig().host || 
         redisConfig.port !== redisClient.getConfig().port)) {
      console.log(`切换到自定义Redis配置: ${redisConfig.host}:${redisConfig.port}`);
      await redisClient.reconnect(redisConfig.host, redisConfig.port);
    }
    
    // 确保Redis客户端已连接
    const isConnected = await redisClient.ensureConnection();
    
    // 从Redis删除数据
    try {
      if (isConnected) {
        // 先尝试获取userId对应的手机号
        const phoneNumber = await redisClient.get(`userId:${userId}:phone`);
        
        // 删除相关的缓存键
        const keysToDelete = [`user:${userId}`];
        if (phoneNumber) {
          keysToDelete.push(`user:phone:${phoneNumber}`, `userId:${userId}:phone`);
        }
        
        await Promise.all(keysToDelete.map(key => redisClient.del(key)));
        console.log('Redis缓存数据已清除');
        res.json({ success: true, message: '缓存数据已清除' });
      } else {
        throw new Error('Redis连接不可用');
      }
    } catch (redisError) {
      console.error(`清除Redis缓存失败: ${redisError.message}`);
      res.json({ 
        success: false, 
        message: '清除缓存失败',
        redisError: redisError.message 
      });
    }
  } catch (error) {
    console.error('清除数据失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;