// MongoDB数据存储模块，用于与后端MongoDB交互
import { fetchWithRetry, getBackendApiUrl } from '../utils';
import config from '../configLoader';

/**
 * 获取后端API基础URL，与Redis模块保持一致
 */
function getApiUrl(): string {
  return getBackendApiUrl() || 'http://localhost:3001';
}

/**
 * 保存用户数据到MongoDB和Redis缓存
 */
export async function saveUserDataMongo(userId: string, userData: any, redisConfig?: { host: string; port: number }): Promise<boolean> {
  try {
    if (!userData || !userData.phone) {
      console.error('用户数据必须包含手机号');
      return false;
    }

    const redisConfigToUse = redisConfig || {
      host: config.redisHost,
      port: config.redisPort
    };

    const response = await fetchWithRetry(`${getApiUrl()}/api/user-data/saveUserData`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        userData,
        redisConfig: redisConfigToUse
      }),
      credentials: 'include'
    });

    if (response.ok) {
      const result = await response.json();
      console.log('用户数据已成功保存到MongoDB:', result.message);
      return true;
    } else {
      console.warn(`保存用户数据到MongoDB失败: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('保存用户数据到MongoDB时发生错误:', error);
    return false;
  }
}

/**
 * 从MongoDB或Redis缓存获取用户数据
 */
export async function getUserDataMongo(userId: string, phone: string, redisConfig?: { host: string; port: number }): Promise<any | null> {
  const startTime = Date.now();
  const operationId = `mongo-get-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`[MONGODB] [${operationId}] 开始获取用户数据: userId=${userId}, phone=${phone}`);
  
  try {
    if (!phone) {
      console.error(`[MONGODB] [${operationId}] 错误: 未提供手机号，跳过MongoDB数据获取`);
      return null;
    }

    // 构建查询参数，保持参数顺序，但修改参数值以匹配后端期望
    const queryParams = new URLSearchParams();
    queryParams.append('userId', userId);  // 保持参数名，但确保传递正确的值
    queryParams.append('phone', phone);    // 保持参数名，但确保传递正确的值
    if (redisConfig) {
      queryParams.append('host', redisConfig.host);
      queryParams.append('port', redisConfig.port.toString());
      console.log(`[MONGODB] [${operationId}] 使用自定义Redis配置: host=${redisConfig.host}, port=${redisConfig.port}`);
    }

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const url = `${getApiUrl()}/api/user-data/getUserData${queryString}`;
    console.log(`[MONGODB] [${operationId}] 请求URL: ${url}`);
    
    const response = await fetchWithRetry(
      url,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      },
      1, // 减少重试次数，避免长时间等待
      5000 // 缩短超时时间到5秒
    );

    if (!response.ok) {
      console.error(`[MONGODB] [${operationId}] ❌ 从MongoDB获取用户数据响应失败: 状态码=${response.status}`);
      
      // 尝试获取响应体中的错误信息
      try {
        const errorData = await response.clone().json();
        console.error(`[MONGODB] [${operationId}] 错误响应内容:`, errorData);
        
        // 分析常见的错误状态码
        if (response.status === 502) {
          console.error(`[MONGODB] [${operationId}] - 分析: 502 Bad Gateway，可能是后端服务不可用或配置错误`);
        } else if (response.status === 503) {
          console.error(`[MONGODB] [${operationId}] - 分析: 503 Service Unavailable，MongoDB服务可能未启动或连接池耗尽`);
        } else if (response.status === 404) {
          console.error(`[MONGODB] [${operationId}] - 分析: 404 Not Found，API端点可能不存在`);
        }
      } catch (jsonError) {
        try {
          const errorText = await response.clone().text();
          console.error(`[MONGODB] [${operationId}] 错误响应文本:`, errorText);
        } catch (textError) {
          console.error(`[MONGODB] [${operationId}] 无法读取错误响应`);
        }
      }
      
      return null;
    }
    
    try {
      const result = await response.json();
      console.log(`[MONGODB] [${operationId}] 收到响应数据:`, {
        success: result.success,
        source: result.source,
        hasData: !!result.data
      });
      
      if (result.success && result.data) {
        console.log(`从MongoDB获取用户数据成功`);
        return result.data;
      } else {
        console.log('从MongoDB获取到的数据格式不正确或请求未成功');
      }
    } catch (jsonError) {
        console.error(`[MONGODB] [${operationId}] ❌ 解析响应JSON失败:`);
        if (jsonError instanceof Error) {
          console.error(`[MONGODB] [${operationId}] - 错误类型: ${jsonError.name}`);
          console.error(`[MONGODB] [${operationId}] - 错误消息: ${jsonError.message}`);
          console.error(`[MONGODB] [${operationId}] - 错误堆栈: ${jsonError.stack}`);
        } else {
          console.error(`[MONGODB] [${operationId}] - 错误对象:`, jsonError);
        }
      }
      
      const endTime = Date.now();
      console.log(`[MONGODB] [${operationId}] 操作完成，耗时: ${endTime - startTime}ms`);
      return null;
    } catch (error) {
      console.error(`[MONGODB] [${operationId}] ❌ 从MongoDB获取用户数据时发生错误:`);
      if (error instanceof Error) {
        console.error(`[MONGODB] [${operationId}] - 错误类型: ${error.name}`);
        console.error(`[MONGODB] [${operationId}] - 错误消息: ${error.message}`);
        console.error(`[MONGODB] [${operationId}] - 错误堆栈: ${error.stack}`);
        
        // 特定错误类型的分析
        if (error.name === 'AbortError') {
          console.error(`[MONGODB] [${operationId}] - 分析: 连接超时或被中止，可能是MongoDB服务器无响应`);
        } else if (error.message.includes('NetworkError')) {
          console.error(`[MONGODB] [${operationId}] - 分析: 网络错误，可能是后端API不可达或CORS问题`);
        } else if (error.message.includes('ECONNREFUSED')) {
          console.error(`[MONGODB] [${operationId}] - 分析: 连接被拒绝，检查MongoDB服务是否运行和端口配置`);
        }
      } else {
        console.error(`[MONGODB] [${operationId}] - 错误对象:`, error);
      }
      
      const endTime = Date.now();
      console.error(`[MONGODB] [${operationId}] 操作失败，耗时: ${endTime - startTime}ms`);
      return null;
    }
}

/**
 * 保存聊天记录到MongoDB
 */
export async function saveChatHistoryMongo(user_id: string, messages: Array<any>, phone: string = ''): Promise<boolean> {
  try {
    if (!user_id || !Array.isArray(messages) || messages.length === 0) {
      return false;
    }

    const response = await fetchWithRetry(`${getApiUrl()}/api/chat-history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_id, messages, phone }),
      credentials: 'include'
    });

    if (response.ok) {
      const result = await response.json();
      console.log('聊天记录已成功保存到MongoDB:', result.message);
      return true;
    } else {
      console.warn(`保存聊天记录到MongoDB失败: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('保存聊天记录到MongoDB时发生错误:', error);
    return false;
  }
}

/**
 * 从MongoDB获取聊天记录 - 使用phone作为查询条件
 */
export async function getChatHistoryMongo(phone: string): Promise<any[]> {
  try {
    if (!phone) {
      return [];
    }

    // 构建查询参数，使用phone作为查询条件
    const queryParams = new URLSearchParams();
    queryParams.append('phone', phone);
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

    const response = await fetchWithRetry(`${getApiUrl()}/api/chat-history${queryString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data && Array.isArray(result.data)) {
        console.log(`从MongoDB获取聊天记录成功，共${result.data.length}条`);
        return result.data;
      }
    }
    return [];
  } catch (error) {
    console.error('从MongoDB获取聊天记录时发生错误:', error);
    return [];
  }
}

/**
 * 清除学生缓存数据（仅清除Redis缓存，保留MongoDB数据）
 */
export async function clearStudentCacheMongo(userId: string, redisConfig?: { host: string; port: number }): Promise<boolean> {
  try {
    const redisConfigToUse = redisConfig || {
      host: config.redisHost || '',
      port: config.redisPort || ''
    };

    const response = await fetchWithRetry(`${getApiUrl()}/api/student-data/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        redisConfig: redisConfigToUse
      }),
      credentials: 'include'
    });

    return response.ok;
  } catch (error) {
    console.error('清除学生缓存数据时发生错误:', error);
    return false;
  }
}