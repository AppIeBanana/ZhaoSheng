// 这个脚本用于测试Coze API的流式响应
console.log('开始测试Coze API流式响应...');

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

// API配置 - 可以直接从配置文件导入，或者保持硬编码用于独立测试
// 如果需要导入配置文件，请确保路径正确
const apiUrl = 'https://api.coze.cn/v3/chat';
const authToken = 'sat_dDeoCs8sajZ2TmC0KKU5LzdeQ5dSPgXVVqlYZ16L7f3vjDzMYkrYMj7BOgfdq0FU';
const botId = '7553550342269550632';
const workflowId = '7553548989958930470';

// 注意：在实际应用中，这些配置应该从配置文件中导入
// 例如: const { API_CONFIG } = require('./src/lib/config');

// 准备请求数据
const requestData = {
  bot_id: botId,
  workflow_id: workflowId,
  user_id: userId,
  stream: true, // 使用流式请求
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

// 发送流式请求
async function testStream() {
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    console.log('HTTP状态码:', response.status);
    
    if (!response.ok) {
      throw new Error(`API请求失败，状态码: ${response.status}`);
    }
    
    if (!response.body) {
      throw new Error('响应体不是可读流');
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let fullResponse = '';
    
    console.log('\n开始接收流式响应:');
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        console.log('\n流式响应结束');
        break;
      }
      
      const chunk = decoder.decode(value, { stream: true });
      fullResponse += chunk;
      buffer += chunk;
      
      // 简单的流式处理，类似于应用中的实现
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine) {
          console.log('接收到的原始数据行:', trimmedLine);
          
          // 尝试解析可能的错误信息
          if (trimmedLine.startsWith('data:')) {
            const dataPart = trimmedLine.replace('data:', '').trim();
            try {
              const parsedData = JSON.parse(dataPart);
              if (parsedData.code !== undefined && parsedData.code !== 0) {
                console.error('API返回错误:', parsedData);
              }
            } catch (e) {
              // 不是有效的JSON，继续处理
            }
          }
        }
      }
    }
    
    console.log('\n完整响应内容:');
    console.log(fullResponse);
    
    // 分析API调用结果
    console.log('\nAPI调用分析:');
    if (fullResponse.includes('conversation.message.delta')) {
      console.log('✅ 成功接收到消息增量更新');
    } else if (fullResponse.includes('error')) {
      console.log('❌ 检测到错误信息');
    } else {
      console.log('ℹ️ 未检测到明显的错误或成功消息增量');
      console.log('可能的原因:');
      console.log('1. API返回格式可能与预期不同');
      console.log('2. 工作流配置可能有问题');
      console.log('3. 响应解析逻辑需要调整');
    }
    
  } catch (error) {
    console.error('API调用失败:', error.message);
    console.error('详细错误信息:', error);
  }
}

testStream();