// MongoDB数据存储模块，用于与后端MongoDB交互
import { getBackendApiUrl } from '../utils';
import { fetchWithRetry } from '../utils';

/**
 * 获取后端API基础URL
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
      host: import.meta.env.VITE_REDIS_HOST,
      port: import.meta.env.VITE_REDIS_PORT
    };

    const response = await fetchWithRetry(`${getApiUrl()}/api/user-data`, {
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
  try {
    if (!phone) {
      console.log('未提供手机号，跳过MongoDB数据获取');
      return null;
    }

    console.log(`准备从MongoDB获取用户数据: userId=${userId}, phone=${phone}`);

    // 构建查询参数，保持参数顺序，但修改参数值以匹配后端期望
    const queryParams = new URLSearchParams();
    queryParams.append('userId', userId);  // 保持参数名，但确保传递正确的值
    queryParams.append('phone', phone);    // 保持参数名，但确保传递正确的值
    if (redisConfig) {
      queryParams.append('host', redisConfig.host);
      queryParams.append('port', redisConfig.port.toString());
    }

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const url = `${getApiUrl()}/api/user-data${queryString}`;
    console.log(`请求URL: ${url}`);
    
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
      console.warn(`从MongoDB获取用户数据响应失败: 状态码=${response.status}`);
      return null;
    }
    
    try {
      const result = await response.json();
      if (result.success && result.data) {
        console.log(`从MongoDB获取用户数据成功`);
        return result.data;
      } else {
        console.log('从MongoDB获取到的数据格式不正确或请求未成功');
      }
    } catch (jsonError) {
      console.error('解析响应JSON失败:', jsonError);
    }
    return null;
  } catch (error) {
    console.error('从MongoDB获取用户数据时发生错误:', error);
    // 即使请求失败，也返回null而不是抛出错误，让流程继续进行
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
      host: import.meta.env.VITE_REDIS_HOST || '',
      port: import.meta.env.VITE_REDIS_PORT || ''
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