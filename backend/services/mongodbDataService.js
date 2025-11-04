// MongoDB数据服务 - 处理用户数据和聊天记录的持久化存储
const mongoose = require('mongoose');

// 由于项目已使用mongoose连接，我们直接使用现有的连接

// 定义并注册模型
const UserSchema = new mongoose.Schema({
  userId: String,
  data: Object,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { collection: 'users' }); // 显式指定集合名称为users

const ChatHistorySchema = new mongoose.Schema({
  user_id: String, // 修改为String类型，以匹配前端传入的格式
  phone: String, // 添加phone字段用于查询
  conversationId: String,
  messages: Array,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { collection: 'messages' }); // 显式指定集合名称为messages

// 确保模型只注册一次
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const ChatHistory = mongoose.models.ChatHistory || mongoose.model('ChatHistory', ChatHistorySchema);

// 保存用户数据到MongoDB
async function saveUserDataToMongoDB(userId, userData) {
  try {
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB未连接');
    }
    
    if (!userData || !userData.phone) {
      throw new Error('用户数据必须包含手机号');
    }
    
    // 使用已在文件顶部定义的User模型
    
    // 添加更新时间
    const updateData = {
      ...userData,
      updated_at: new Date()
    };
    
    // 先查询是否存在该用户
    const result = await User.findOneAndUpdate(
      { 'data.phone': userData.phone },
      { 
        $set: {
          'data': updateData,
          'updatedAt': new Date()
        },
        $setOnInsert: {
          'userId': userId || userData.phone,
          'createdAt': new Date()
        }
      },
      { 
        upsert: true, // 如果不存在则创建
        new: true,    // 返回更新后的文档
        runValidators: true // 运行验证器
      }
    );
    
    console.log(`用户数据保存成功: userId=${userId}, phone=${userData.phone}, mongo_id=${result._id}`);
    return { ...result.toObject(), _id: result._id }; // 返回完整的用户对象，包含MongoDB生成的_id
  } catch (error) {
    console.error('保存用户数据到MongoDB失败:', error);
    throw error;
  }
}

// 从MongoDB获取用户数据
async function getUserDataFromMongoDB(userId, phone) {
  try {
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB未连接');
    }
    
    if (!phone) {
      throw new Error('缺少必要参数: 必须提供手机号');
    }
    
    // 严格使用手机号进行查询，不使用userId
    const query = {
      'data.phone': phone
    };
    
    // 使用已在文件顶部定义的User模型
    
    // 查询用户数据
    const user = await User.findOne(query, { data: 1, _id: 1 });
    
    if (user) {
      // 返回数据时包含_id，以便前端使用
      return {
        ...user.data,
        _id: user._id.toString()
      };
    }
    
    return null;
  } catch (error) {
    console.error('从MongoDB获取用户数据失败:', error);
    throw error;
  }
}

// 保存聊天记录到MongoDB
async function saveChatHistoryToMongoDB(user_id, messages, phone = '') {
  try {
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB未连接');
    }
    
    if (!user_id || !Array.isArray(messages) || messages.length === 0) {
      throw new Error('缺少必要参数或消息格式不正确');
    }
    
    // 使用已在文件顶部定义的ChatHistory模型
    
    // 确保每条消息都有时间戳
    const messagesWithTimestamp = messages.map(msg => ({
      ...msg,
      timestamp: msg.timestamp || new Date()
    }));
    
    // 保存聊天记录 - 使用user_id和phone作为查询条件
    const result = await ChatHistory.updateOne(
      { user_id, phone },
      {
        $set: {
          messages: messagesWithTimestamp,
          updatedAt: new Date(),
          phone: phone // 保存phone字段用于后续查询
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true }
    );
    
    console.log(`聊天记录保存成功: user_id=${user_id}, phone=${phone}`);
    return { result };
  } catch (error) {
    console.error('保存聊天记录到MongoDB失败:', error);
    throw error;
  }
}

// 从MongoDB获取聊天记录 - 使用phone作为唯一条件
async function getChatHistoryFromMongoDB(phone) {
  try {
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB未连接');
    }
    
    if (!phone) {
      throw new Error('缺少必要参数: phone');
    }
    
    // 直接通过phone字段查询聊天记录
    const chatHistory = await ChatHistory.findOne(
      { phone: phone },
      { messages: 1, _id: 0 }
    ).sort({ updatedAt: -1 }); // 按更新时间降序排序
    
    return chatHistory ? chatHistory.messages : [];
  } catch (error) {
    console.error('从MongoDB获取聊天记录失败:', error);
    throw error;
  }
}

// 清除用户缓存（如果需要）
async function clearUserMongoCache(userId, phone) {
  try {
    // 在MongoDB中，通常不需要显式清除缓存，但可以提供此方法以备将来扩展
    console.log(`用户缓存清除操作: userId=${userId}, phone=${phone}`);
    return true;
  } catch (error) {
    console.error('清除用户MongoDB缓存失败:', error);
    return false;
  }
}

module.exports = {
  saveUserDataToMongoDB,
  getUserDataFromMongoDB,
  saveChatHistoryToMongoDB,
  getChatHistoryFromMongoDB,
  clearUserMongoCache
};