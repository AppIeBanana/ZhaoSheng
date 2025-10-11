// 这个脚本用于检查特定对话ID的本地存储数据
console.log('开始检查对话ID的本地存储数据...');

// 测试的对话ID
const testDialogId = '12345';
const userId = `dialog_${testDialogId}`;

// 检查与该对话ID关联的学生数据
const savedStudentData = localStorage.getItem(`student_data_${testDialogId}`);
console.log('\n1. 学生数据检查:');
if (savedStudentData) {
  console.log(`找到与对话ID ${testDialogId} 关联的学生数据:`);
  try {
    const parsedData = JSON.parse(savedStudentData);
    console.log(JSON.stringify(parsedData, null, 2));
  } catch (error) {
    console.error('解析学生数据失败:', error);
    console.log('原始数据:', savedStudentData);
  }
} else {
  console.log(`未找到与对话ID ${testDialogId} 关联的学生数据`);
}

// 检查与该用户ID关联的聊天历史
const savedChatHistory = localStorage.getItem(`chat_history_${userId}`);
console.log('\n2. 聊天历史检查:');
if (savedChatHistory) {
  console.log(`找到与用户ID ${userId} 关联的聊天历史:`);
  try {
    const parsedData = JSON.parse(savedChatHistory);
    console.log(`消息数量: ${parsedData.messages?.length || 0}`);
    if (parsedData.messages && parsedData.messages.length > 0) {
      console.log('最近5条消息:');
      const recentMessages = parsedData.messages.slice(-5);
      recentMessages.forEach((msg, index) => {
        console.log(`${index + 1}. [${msg.sender}] ${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}`);
      });
    }
  } catch (error) {
    console.error('解析聊天历史失败:', error);
    console.log('原始数据:', savedChatHistory);
  }
} else {
  console.log(`未找到与用户ID ${userId} 关联的聊天历史`);
}

// 检查本地存储中的其他相关数据
console.log('\n3. 其他相关数据检查:');
const wechatUserId = localStorage.getItem('wechat_user_id');
console.log(`wechat_user_id: ${wechatUserId || '未设置'}`);

// 列出所有与对话相关的本地存储键
console.log('\n4. 所有与对话相关的本地存储键:');
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && (key.startsWith('student_data_') || key.startsWith('chat_history_'))) {
    console.log(`- ${key}`);
  }
}

console.log('\n检查完成。如果没有找到相关数据，可能需要先在应用中创建该对话ID的记录。');