// 数据模型定义
const mongoose = require('mongoose');

// 用户数据模型 - 根据集合结构定义
const UserSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  created_at: { type: Date, default: Date.now },
  ethnicity: { type: String },
  exam_type: { type: String },
  phone: { type: String, required: true, unique: true, trim: true },
  province: { type: String },
  score: { type: Number },
  user_type: { type: String },
  update_at: { type: Date, default: Date.now }
});

// 更新update_at字段的中间件
UserSchema.pre('save', function(next) {
  this.update_at = new Date();
  next();
});

// 创建消息数据模型
const MessageSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  conversation_id: { type: String, required: true },
  user_id: { type: String, required: true }, // 修改为String类型，以匹配前端传入的格式
  phone: { type: String }, // 添加phone字段用于查询
  question: { type: String, required: true },
  answer: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

// 创建模型实例
const User = mongoose.model('User', UserSchema);
const Message = mongoose.model('Message', MessageSchema);

// 导出模型
module.exports = {
  User,
  Message
};