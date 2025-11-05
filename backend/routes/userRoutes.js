// 导入所需模块
const express = require('express');
const router = express.Router();

// 导入数据服务
const redisDataService = require('../services/redisDataService');
const mongodbDataService = require('../services/mongodbDataService');

// 验证手机号的辅助函数
function validatePhone(phone) {
  // 简单的手机号验证规则
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

// 保存用户数据的路由 - 合并Redis和MongoDB的操作
router.post('/saveUserData', async (req, res) => {
  try {
    const { userData } = req.body;
    
    // 验证请求数据
    if (!userData || !userData.phone) {
      return res.status(400).json({ error: '缺少必要的用户数据，特别是手机号' });
    }
    
    // 验证手机号格式
    if (!validatePhone(userData.phone)) {
      return res.status(400).json({ error: '手机号格式不正确' });
    }
    
    // 1. 保存到Redis (设置过期时间为7天) - 使用与MongoDB一致的数据结构
    const redisSaveResult = await redisDataService.saveUserDataToRedis(
      userData.phone, 
      userData, // 保持与MongoDB中data字段一致的数据结构
      7 * 24 * 60 * 60 // 7天过期时间（秒）
    );
    
    // 2. 保存到MongoDB (异步进行，不阻塞Redis响应)
    mongodbDataService.saveUserDataToMongoDB(null, userData)
      .then(() => console.log(`MongoDB 异步保存成功: phone=${userData.phone}`))
      .catch(err => console.error(`MongoDB 异步保存失败: ${err.message}`));
    
    // 3. 返回Redis的保存结果
    res.status(200).json({
      success: true,
      message: '用户数据保存成功',
      data: {
        redisResult: redisSaveResult,
        phone: userData.phone
      }
    });
  } catch (error) {
    console.error('保存用户数据失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '保存用户数据时发生错误' 
    });
  }
});

// 获取用户数据的路由 - 优先从Redis读取，Redis未命中时从MongoDB读取
router.get('/getUserData', async (req, res) => {
  try {
    // 从请求参数中获取phone
    const { phone } = req.query;
    
    // 验证必要参数
    if (!phone) {
      return res.status(400).json({ error: '缺少必要参数: phone' });
    }
    
    // 验证手机号格式
    if (!validatePhone(phone)) {
      return res.status(400).json({ error: '手机号格式不正确' });
    }
    
    // 1. 首先尝试从Redis获取数据
    let userData = await redisDataService.getUserDataFromRedis(phone);
    
    // 2. 如果Redis中没有数据，则从MongoDB获取
    if (!userData) {
      userData = await mongodbDataService.getUserDataFromMongoDB(null, phone);
      
      // 3. 如果MongoDB中有数据，将其回填到Redis中
      if (userData) {
        await redisDataService.saveUserDataToRedis(
          phone, 
          userData,
          7 * 24 * 60 * 60 // 7天过期时间（秒）
        );
      } else {
        return res.status(404).json({ error: '用户数据不存在' });
      }
    }
    
    res.status(200).json({
      success: true,
      data: userData
    });
  } catch (error) {
    console.error('获取用户数据失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '获取用户数据时发生错误' 
    });
  }
});

// 更新用户数据的路由 - 同时更新Redis和MongoDB
router.put('/updateUserData', async (req, res) => {
  try {
    const { userData } = req.body;
    
    // 验证请求数据
    if (!userData || !userData.phone) {
      return res.status(400).json({ error: '缺少必要的用户数据，特别是手机号' });
    }
    
    // 验证手机号格式
    if (!validatePhone(userData.phone)) {
      return res.status(400).json({ error: '手机号格式不正确' });
    }
    
    // 1. 更新Redis中的数据
    const redisUpdateResult = await redisDataService.saveUserDataToRedis(
      userData.phone, 
      userData,
      7 * 24 * 60 * 60 // 7天过期时间（秒）
    );
    
    // 2. 更新MongoDB中的数据
    const mongoUpdateResult = await mongodbDataService.updateUserData(null, userData);
    
    res.status(200).json({
      success: true,
      message: '用户数据更新成功',
      data: {
        redisResult: redisUpdateResult,
        mongoResult: mongoUpdateResult,
        phone: userData.phone,
        _id: mongoUpdateResult._id
      }
    });
  } catch (error) {
    console.error('更新用户数据失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '更新用户数据时发生错误' 
    });
  }
});

// 继续添加删除路由和模块导出

// 删除用户缓存的路 route - 保留MongoDB数据，仅清除Redis缓存
router.delete('/clearCache', async (req, res) => {
  try {
    const { phone } = req.query;
    
    // 验证必要参数
    if (!phone) {
      return res.status(400).json({ error: '缺少必要参数: phone' });
    }
    
    // 验证手机号格式
    if (!validatePhone(phone)) {
      return res.status(400).json({ error: '手机号格式不正确' });
    }
    
    // 清除Redis缓存
    const redisClearResult = await redisDataService.clearUserRedisCache(phone);
    
    // 记录操作但不清除MongoDB数据，避免误删用户历史数据
    console.log(`用户缓存清除操作: phone=${phone}`);
    
    res.status(200).json({
      success: true,
      message: '用户缓存清除成功',
      data: {
        redisClearResult: redisClearResult,
        phone: phone,
        note: 'MongoDB数据已保留，仅清除Redis缓存'
      }
    });
  } catch (error) {
    console.error('清除用户缓存失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '清除用户缓存时发生错误' 
    });
  }
});

// 检查用户是否存在的路由
router.get('/checkUserExists', async (req, res) => {
  try {
    const { phone } = req.query;
    
    // 验证必要参数
    if (!phone) {
      return res.status(400).json({ error: '缺少必要参数: phone' });
    }
    
    // 验证手机号格式
    if (!validatePhone(phone)) {
      return res.status(400).json({ error: '手机号格式不正确' });
    }
    
    // 检查用户是否存在
    const exists = await mongodbDataService.checkUserExists(null, phone);
    
    res.status(200).json({
      success: true,
      data: {
        phone: phone,
        exists: exists
      }
    });
  } catch (error) {
    console.error('检查用户是否存在失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '检查用户是否存在时发生错误' 
    });
  }
});

// 导出路由
module.exports = router;