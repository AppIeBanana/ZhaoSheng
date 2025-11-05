// MongoDB数据服务 - 处理用户数据和聊天记录的持久化存储
const mongoose = require('mongoose');

// 由于项目已使用mongoose连接，我们直接使用现有的连接

// 定义并注册模型
const UserSchema = new mongoose.Schema({
  data: Object,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { collection: 'users' }); // 显式指定集合名称为users

const ChatHistorySchema = new mongoose.Schema({
  phone: String, // phone作为唯一标识符
  conversationId: String,
  messages: Array,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { collection: 'messages' }); // 显式指定集合名称为messages

// 确保模型只注册一次
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const ChatHistory = mongoose.models.ChatHistory || mongoose.model('ChatHistory', ChatHistorySchema);

// 底层数据访问函数 - 保持合并实现
async function saveUserDataToMongoDB(_userId, userData) {
  try {
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB未连接');
    }
    
    if (!userData || !userData.phone) {
      throw new Error('用户数据必须包含手机号');
    }
    
    // 只使用手机号作为查询条件
    const query = { 'phone': userData.phone };
    
    // 查询现有文档
    const existingDoc = await User.findOne(query);
    
    // 使用findOneAndUpdate进行更新或插入
    const result = await User.findOneAndUpdate(
      query,
      { 
        $set: {
          ...userData, // 直接更新用户数据，不再嵌套在data字段下
          'updatedAt': new Date() // 更新时间戳
        },
        $setOnInsert: {
          'createdAt': new Date()
        }
      },
      { 
        upsert: true, 
        new: true,    
        runValidators: true 
      }
    );
    
    const operationType = existingDoc ? '更新' : '插入';
    console.log(`MongoDB${operationType}操作成功: phone=${userData.phone}`);
    
    return result.toObject();
  } catch (error) {
    console.error('保存用户数据到MongoDB失败:', error);
    throw error;
  }
}

// 服务层：创建新用户
async function createUserData(_userId, userData) {
  try {
    if (!userData || !userData.phone) {
      throw new Error('用户数据必须包含手机号');
    }
    
    // 移除预检查以避免竞态条件，依赖saveUserDataToMongoDB的upsert机制
    // 设置创建特定的字段
    const createData = {
      ...userData,
      created_at: new Date(),
      createdBy: 'system',
      updated_at: new Date()
    };
    
    // 调用底层数据访问函数，利用其upsert机制处理用户存在或不存在的情况
    const result = await saveUserDataToMongoDB(null, createData);
    console.log(`用户创建/更新成功: phone=${userData.phone}`);
    
    return result;
  } catch (error) {
    console.error('创建/更新用户失败:', error);
    throw error;
  }
}

// 服务层：更新用户数据 - 通过手机号查找用户后使用_id进行更新，找不到则创建
async function updateUserData(_userId, userData) {
  try {
    if (!userData || !userData.phone) {
      throw new Error('用户数据必须包含手机号');
    }
    
    // 设置更新特定的字段
    const updateData = {
      ...userData,
      updated_at: new Date(),
      updatedBy: 'system'
    };
    
    // 直接使用saveUserDataToMongoDB的upsert机制，处理用户存在或不存在的情况
    // 这避免了额外的查询操作和潜在的竞态条件
    const result = await saveUserDataToMongoDB(null, updateData);
    
    console.log(`用户数据更新/创建成功: phone=${userData.phone}, _id=${result._id}`);
    
    return result;
  } catch (error) {
    console.error('更新或创建用户失败:', error);
    throw error;
  }
}

// 检查用户是否存在
async function checkUserExists(_userId, phone) {
  try {
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB未连接');
    }
    
    if (!phone) {
      throw new Error('缺少必要参数: 必须提供手机号');
    }
    
    // 仅通过手机号检查用户是否存在
    const query = {
      'phone': phone
    };
    
    const user = await User.findOne(query, { _id: 1 });
    return !!user;
  } catch (error) {
    console.error('检查用户是否存在失败:', error);
    throw error;
  }
}

// 从MongoDB获取用户数据
async function getUserDataFromMongoDB(_userId, phone) {
  try {
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB未连接');
    }
    
    if (!phone) {
      throw new Error('缺少必要参数: 必须提供手机号');
    }
    
    // 严格使用手机号进行查询，不使用userId
    const query = {
      'phone': phone
    };
    
    // 使用已在文件顶部定义的User模型
    
    // 查询用户数据
    const user = await User.findOne(query);
    
    if (user) {
      // 返回数据时包含_id，以便前端使用
      return {
        ...user.toObject(),
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
async function saveChatHistoryToMongoDB(_userId, messages, phone = '') {
  try {
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB未连接');
    }
    
    if (!phone || !Array.isArray(messages) || messages.length === 0) {
      throw new Error('缺少必要参数或消息格式不正确');
    }
    
    // 使用已在文件顶部定义的ChatHistory模型
    
    // 确保每条消息都有时间戳
    const messagesWithTimestamp = messages.map(msg => ({
      ...msg,
      timestamp: msg.timestamp || new Date()
    }));
    
    // 保存聊天记录 - 只使用phone作为查询条件
    const result = await ChatHistory.updateOne(
      { phone },
      {
        $set: {
          messages: messagesWithTimestamp,
          updatedAt: new Date()
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true }
    );
    
    console.log(`聊天记录保存成功: phone=${phone}`);
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
  clearUserMongoCache,
  createUserData,
  updateUserData,
  checkUserExists
};