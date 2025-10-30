export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

// Mock API call to simulate responses
export async function* sendMessageToAPIStream(message: string, studentData: any): AsyncGenerator<string> {
  // Coze API endpoint - updated to v3/chat as per requirements
  const apiUrl = import.meta.env.VITE_COZE_API_URL || import.meta.env.COZE_API_URL;
  
  // API authorization token (provided by user)
  const authToken = import.meta.env.VITE_COZE_AUTH_TOKEN || import.meta.env.COZE_AUTH_TOKEN; // 从环境变量读取token
  
  try {
    // Prepare request data based on the new API format provided
    const requestData = {
      bot_id: import.meta.env.VITE_COZE_BOT_ID || import.meta.env.COZE_BOT_ID,
      workflow_id: import.meta.env.VITE_COZE_WORKFLOW_ID || import.meta.env.COZE_WORKFLOW_ID,
      user_id: "123456789", // 可以考虑也从环境变量读取
      stream: true,
      additional_messages: [
        {
          content: message,
          content_type: "text",
          role: "user",
          type: "question"
        }
      ],
      parameters: {
        // CONVERSATION_NAME: "talk",
        // USER_INPUT: message,
        exam_type: studentData.examType ,
        minzu: studentData.minzu,
        province: studentData.province,
        score: studentData.score,
        student_type: studentData.studentType
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


