// Redis存储实现 - 与后端API交互
import { getBackendApiUrl } from '../utils';
import { fetchWithRetry } from '../utils';

/**
 * 获取后端API基础URL
 */
function getApiUrl(): string {
  return getBackendApiUrl() || 'http://localhost:3001';
}

/**
 * 保存用户数据到Redis（通过后端API）
 */
export async function saveUserDataRedis(userId: string, userData: any): Promise<boolean> {
  try {
    if (!userData || !userData.phone) {
      console.error('用户数据必须包含手机号');
      return false;
    }

    // Redis作为缓存层，调用与MongoDB相同的API端点（后端会自动同时更新Redis）
    const response = await fetchWithRetry(`${getApiUrl()}/api/user-data/saveUserData`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        userData,
        redisConfig: {
          host: import.meta.env.VITE_REDIS_HOST,
          port: import.meta.env.VITE_REDIS_PORT
        }
      }),
      credentials: 'include'
    });

    if (response.ok) {
      console.log('用户数据已成功缓存到Redis');
      return true;
    } else {
      console.warn(`缓存用户数据到Redis失败: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('缓存用户数据到Redis时发生错误:', error);
    return false;
  }
}

/**
 * 从Redis获取用户数据（通过后端API）
 */
export async function getUserDataRedis(userId: string, phone: string): Promise<any | null> {
  try {
    if (!phone) {
      console.log('未提供手机号，跳过Redis数据获取');
      return null;
    }

    console.log(`准备从Redis获取用户数据: userId=${userId}, phone=${phone}`);
    
    // 通过API从Redis缓存获取数据，使用查询参数传递userId
    const queryParams = new URLSearchParams();
    queryParams.append('userId', userId);
    queryParams.append('phone', phone);
    queryParams.append('cache', 'true');
    
    const url = `${getApiUrl()}/api/user-data/getUserData?${queryParams.toString()}`;
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
      console.warn(`从Redis获取用户数据响应失败: 状态码=${response.status}`);
      return null;
    }
    
    try {
      const result = await response.json();
      if (result.success && result.data && result.source === 'redis') {
        console.log('从Redis缓存获取用户数据成功');
        return result.data;
      } else {
        console.log('从Redis获取到的数据格式不正确或不是来自Redis');
      }
    } catch (jsonError) {
      console.error('解析响应JSON失败:', jsonError);
    }
    return null;
  } catch (error) {
    console.error('从Redis获取用户数据时发生错误:', error);
    // 即使请求失败，也返回null而不是抛出错误，让流程继续进行
    return null;
  }
}

/**
 * 清除Redis缓存数据（通过后端API）
 */
export async function clearRedisCache(userId: string): Promise<boolean> {
  try {
    const response = await fetch(`${getApiUrl()}/api/user-data/${userId}/cache`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        redisConfig: {
          host: import.meta.env.VITE_REDIS_HOST || '',
          port: import.meta.env.VITE_REDIS_PORT || ''
        }
      })
    });

    if (response.ok) {
      console.log('Redis缓存已成功清除');
      return true;
    } else {
      console.warn(`清除Redis缓存失败: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('清除Redis缓存时发生错误:', error);
    return false;
  }
}