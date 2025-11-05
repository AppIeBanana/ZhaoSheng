import config from './configLoader';

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

// Mock API call to simulate responses
export async function* sendMessageToAPIStream(message: string, userData: any): AsyncGenerator<string> {
  // 使用配置加载器获取环境变量
  const apiUrl = config.cozeApiUrl;
  const authToken = config.cozeAuthToken;
  
  try {
    // 检查必要参数
    if (!apiUrl || !authToken) {
      throw new Error('COZE_API_URL or COZE_AUTH_TOKEN is not defined');
    }
    // Prepare request data based on the new API format provided
    const requestData = {
      bot_id: config.cozeBotId,
      workflow_id: config.cozeWorkflowId,
      user_id: userData.phone, // 使用用户填写的手机号，如果不存在则使用默认值
      stream: true,
      additional_messages: [
        {
          content: message,
          content_type: "text",
          role: "user",
          type: "question"
        }
      ],
      conversation_id: userData.phone,
      parameters: {
        // CONVERSATION_NAME: "talk",
        // USER_INPUT: message,
        exam_type: userData.examType ,
    ethnicity: userData.ethnicity,
    province: userData.province,
    score: userData.score,
    user_type: userData.userType
      }
    };
    if(!requestData.bot_id || !requestData.workflow_id) {
      throw new Error('COZE_BOT_ID or COZE_WORKFLOW_ID is not defined');
    }

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
    
    // Check if response is a readable stream
    if (!response.body) {
      throw new Error('Response body is not a readable stream');
    }
    
    // Get reader from response body
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    
    // Read stream chunks until done
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }
      
      // Decode the chunk and add to buffer
      buffer += decoder.decode(value, { stream: true });
      
      // Handle possible multi-line buffer by splitting on newlines
      
      // Process buffer - assuming API returns JSON lines or similar format
      // This is a simplified parser - adjust based on actual API response format
      // Split buffer into complete lines, keeping incomplete line in buffer
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
        // Parse SSE events correctly by handling both event and data lines
        let currentEvent = '';
        let currentData = '';
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          
          if (!trimmedLine) {
            // Empty line indicates end of an event
            if (currentEvent && currentData) {
              try {
                const eventData = JSON.parse(currentData);
                
                // Process different event types - 只处理delta事件避免重复显示
                if (currentEvent === 'conversation.message.delta' && eventData.type === 'answer') {
                  
                  // Parse content which is a JSON string
                  let contentJson;
                  try {
                    contentJson = JSON.parse(eventData.content);
                  } catch (e) {
                    // If content is not valid JSON, use it as plain text
                    contentJson = { output: eventData.content };
                  }
                  
                  // Extract the output content
                  if (contentJson?.output) {
                    yield contentJson.output;
                  }
                } else if (currentEvent === 'error') {
                  // Handle error events
                  console.error('API Error:', eventData);
                  yield `⚠️ 发生错误: ${eventData.msg || '未知错误'}`;
                }
              } catch (e) {
                console.error('Error parsing event:', currentEvent, e);
              }
              
              // Reset for next event
              currentEvent = '';
              currentData = '';
            }
            continue;
          }
          
          // Handle event line
          if (trimmedLine.startsWith('event:')) {
            currentEvent = trimmedLine.replace('event:', '').trim();
            continue;
          }
          
          // Handle data line
          if (trimmedLine.startsWith('data:')) {
            currentData += trimmedLine.replace('data:', '').trim();
            continue;
          }
        }
    }
    
    // Process any remaining data in buffer
    if (buffer.trim()) {
      try {
        const data = JSON.parse(buffer);
        if (data?.data?.content) {
          yield data.data.content;
        }
      } catch (e) {
        console.error('Error parsing final stream chunk:', e);
      }
    }
    
  } catch (error) {
    console.error('API request error:', error);
    // Return user-friendly error message
    yield '抱歉，获取回答时出现问题。请稍后重试或联系系统管理员。';
  }
}

// Original non-streaming version kept for compatibility if needed


