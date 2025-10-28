// 这个脚本用于测试Coze API连接
console.log('开始测试Coze API连接...');

// 模拟学生数据
const mockStudentData = {
  examType: '普通高考',
  ethnicity: '汉族',
  province: '福建省',
  score: '450',
  studentType: '普通类'
};

const message = '学校的招生计划是多少？';
const userId = 'test_user_id';

// API配置
const apiUrl = 'https://api.coze.cn/v3/chat';
const authToken = 'sat_dDeoCs8sajZ2TmC0KKU5LzdeQ5dSPgXVVqlYZ16L7f3vjDzMYkrYMj7BOgfdq0FU';
const botId = '7553550342269550632';
const workflowId = '7553548989958930470';

// 准备请求数据
const requestData = {
  bot_id: botId,
  workflow_id: workflowId,
  user_id: userId,
  stream: false, // 使用非流式请求以便更容易查看完整响应
  additional_messages: [
    {
      content: message,
      content_type: 'text',
      role: 'user',
      type: 'question'
    }
  ],
  parameters: {
    exam_type: mockStudentData.examType,
    minzu: mockStudentData.ethnicity,
    province: mockStudentData.province,
    score: mockStudentData.score,
    student_type: mockStudentData.studentType
  }
};

// 发送请求并记录详细响应
fetch(apiUrl, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(requestData)
})
.then(response => {
  console.log('HTTP状态码:', response.status);
  console.log('响应头:', response.headers);
  
  // 检查响应是否成功
  if (!response.ok) {
    throw new Error(`API请求失败，状态码: ${response.status}`);
  }
  
  // 尝试解析JSON响应
  return response.json().then(data => {
    console.log('API响应数据:', JSON.stringify(data, null, 2));
    return data;
  }).catch(e => {
    console.error('解析JSON响应失败:', e);
    // 如果JSON解析失败，尝试获取原始文本
    return response.text().then(text => {
      console.log('原始响应文本:', text);
      throw new Error('API返回了非JSON格式的响应');
    });
  });
})
.then(data => {
  console.log('API调用成功！');
  if (data?.data?.content) {
    console.log('回答内容:', data.data.content);
  }
})
.catch(error => {
  console.error('API调用失败:', error.message);
  console.error('详细错误信息:', error);
  console.log('\n可能的原因分析:');
  console.log('1. API令牌可能已过期或无效');
  console.log('2. Coze API服务可能暂时不可用');
  console.log('3. 请求参数格式可能有问题');
  console.log('4. 网络连接问题');
});