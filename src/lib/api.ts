export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

// Mock API call to simulate responses
export async function sendMessageToAPI(message: string, studentData: any): Promise<string> {
  // Coze API endpoint
  const apiUrl = 'https://api.coze.cn/v1/workflows/chat';
  
  // API authorization token (replace with actual token in production)
  const authToken = 'pat_*****'; // 注意：在实际部署时替换为真实token
  
  try {
    // Prepare request data based on the cURL example provided
    const requestData = {
      workflow_id: "74423***",  // 替换为实际的workflow_id
      app_id: "7439828073***",  // 替换为实际的app_id
      additional_messages: [
        {
          role: "user",
          content_type: "text",
          content: message
        }
      ],
      parameters: {
        input: JSON.stringify(studentData)  // 将学生数据作为输入参数
      }
    };
    
    // Send HTTP POST request to Coze API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    // Check if response is successful
    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }
    
    // Parse response data
    const responseData = await response.json();
    
    // Extract the answer content from response (adjust based on actual API response structure)
    // This assumes the API returns a structure with content in responseData.data.content
    if (responseData?.data?.content) {
      return responseData.data.content;
    } else {
      throw new Error('Invalid API response structure');
    }
  } catch (error) {
    console.error('API request error:', error);
    // Return user-friendly error message
    return '抱歉，获取回答时出现问题。请稍后重试或联系系统管理员。';
  }
}

// Predefined questions for "Guess you want to ask" section
export const predefinedQuestions = [
  "我这个分数能考上贵校吗？",
  "贵校各专业的录取分数线是多少？",
  "学校的宿舍条件怎么样？",
  "学校有哪些热门专业？",
  "毕业后就业情况如何？",
  "校园生活有什么特色活动？"
];