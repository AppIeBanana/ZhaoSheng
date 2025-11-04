// 聊天记录路由
const express = require('express');
const router = express.Router();
const { redisClient } = require('../config/redis');

// 导入数据服务
const { saveChatHistoryToRedis, getChatHistoryFromRedis } = require('../services/redisDataService');
const { saveChatHistoryToMongoDB, getChatHistoryFromMongoDB } = require('../services/mongodbDataService');

/**
 * 保存聊天记录 - 使用服务层方法
 */
router.post('/', async (req, res) => {
  try {
    const { user_id, messages, phone } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ success: false, error: '用户ID不能为空' });
    }
    
    if (!Array.isArray(messages)) {
      return res.status(400).json({ success: false, error: '消息列表格式错误' });
    }
    
    // 保存到MongoDB（使用服务层）
    await saveChatHistoryToMongoDB(user_id, messages, phone);
    
    // 保存到Redis缓存
    try {
      await saveChatHistoryToRedis(user_id.toString(), messages, phone);
    } catch (error) {
      console.error('保存到Redis失败:', error);
    }
    
    res.status(200).json({
      success: true,
      message: '聊天记录保存成功',
      data: { user_id, messages }
    });
  } catch (error) {
    console.error('保存聊天记录失败:', error);
    res.status(500).json({
      success: false,
      message: '保存聊天记录失败',
      error: error.message
    });
  }
});

/**
 * 获取聊天记录 - 优先Redis缓存，其次MongoDB的messages集合
 * 使用phone作为唯一查询条件
 */
router.get('/', async (req, res) => {
  try {
    const { phone } = req.query;
    
    if (!phone) {
      return res.status(400).json({ success: false, error: '手机号不能为空' });
    }
    
    let chatHistory = [];
    
    // 1. 尝试从Redis缓存获取（使用phone作为缓存键）
    try {
      chatHistory = await getChatHistoryFromRedis('', phone);
    } catch (error) {
      console.error('从Redis获取聊天记录失败:', error);
      chatHistory = [];
    }
    
    if (chatHistory.length > 0) {
      console.log(`从Redis缓存获取聊天记录成功，手机号: ${phone}`);
      return res.json({ success: true, data: chatHistory, source: 'cache' });
    }
    
    // 2. 从MongoDB获取（使用服务层）
    try {
      // 使用mongodbDataService获取聊天记录，传入phone参数
      const messages = await getChatHistoryFromMongoDB(phone);
      
      if (messages && messages.length > 0) {
        chatHistory = messages.map(msg => ({
          ...msg,
          created_at: msg.timestamp ? new Date(msg.timestamp).toISOString() : new Date().toISOString()
        }));
        
        console.log(`从MongoDB获取聊天记录成功，手机号: ${phone}`);
        
        // 更新Redis缓存
        if (messages.length > 0) {
          // 缓存聊天记录，使用phone作为键
          await saveChatHistoryToRedis(phone, chatHistory);
        }
      }
    } catch (mongoError) {
      console.error(`从MongoDB获取聊天记录失败: ${mongoError.message}`);
    }
    
    res.json({ 
      success: true, 
      data: chatHistory, 
      source: chatHistory.length > 0 ? 'database' : 'none' 
    });
  } catch (error) {
    console.error('获取聊天记录失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;