// Redis存储实现 - 与后端API交互
import { getBackendApiUrl } from '../utils';
import { fetchWithRetry } from '../utils';
import config from '../configLoader';

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
          host: config.redisHost,
          port: config.redisPort
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
  const startTime = Date.now();
  const operationId = `redis-get-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`[REDIS] [${operationId}] 开始获取用户数据: userId=${userId}, phone=${phone}`);
  
  try {
    if (!phone) {
      console.error(`[REDIS] [${operationId}] 错误: 未提供手机号，跳过Redis数据获取`);
      return null;
    }
    
    // 通过API从Redis缓存获取数据，使用查询参数传递userId
    const queryParams = new URLSearchParams();
    queryParams.append('userId', userId);
    queryParams.append('phone', phone);
    queryParams.append('cache', 'true');
    
    const url = `${getApiUrl()}/api/user-data/getUserData?${queryParams.toString()}`;
    console.log(`[REDIS] [${operationId}] 请求URL: ${url}`);
    console.log(`[REDIS] [${operationId}] Redis配置: host=${config.redisHost}, port=${config.redisPort}`);
    
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
      console.error(`[REDIS] [${operationId}] ❌ 从Redis获取用户数据响应失败: 状态码=${response.status}`);
      
      // 尝试获取响应体中的错误信息
      try {
        const errorData = await response.clone().json();
        console.error(`[REDIS] [${operationId}] 错误响应内容:`, errorData);
      } catch (jsonError) {
        try {
          const errorText = await response.clone().text();
          console.error(`[REDIS] [${operationId}] 错误响应文本:`, errorText);
        } catch (textError) {
          console.error(`[REDIS] [${operationId}] 无法读取错误响应`);
        }
      }
      
      return null;
    }
    
    try {
      const result = await response.json();
      console.log(`[REDIS] [${operationId}] 收到响应数据:`, {
        success: result.success,
        source: result.source,
        hasData: !!result.data
      });
      
      if (result.success && result.data) {
        if (result.source === 'redis') {
          console.log(`[REDIS] [${operationId}] ✅ 从Redis缓存获取用户数据成功`);
          return result.data;
        } else {
          console.warn(`[REDIS] [${operationId}] ⚠️ 数据源不是Redis，而是: ${result.source || '未知'}`);
        }
      } else {
        console.warn(`[REDIS] [${operationId}] ⚠️ 从Redis获取到的数据格式不正确:`);
        console.warn(`[REDIS] [${operationId}] - success: ${result.success}`);
        console.warn(`[REDIS] [${operationId}] - source: ${result.source}`);
        console.warn(`[REDIS] [${operationId}] - data: ${result.data ? '存在' : '不存在'}`);
      }
    } catch (jsonError) {
      console.error(`[REDIS] [${operationId}] ❌ 解析响应JSON失败:`);
      if (jsonError instanceof Error) {
        console.error(`[REDIS] [${operationId}] - 错误类型: ${jsonError.name}`);
        console.error(`[REDIS] [${operationId}] - 错误消息: ${jsonError.message}`);
        console.error(`[REDIS] [${operationId}] - 错误堆栈: ${jsonError.stack}`);
      } else {
        console.error(`[REDIS] [${operationId}] - 错误对象:`, jsonError);
      }
    }
    
    const endTime = Date.now();
    console.log(`[REDIS] [${operationId}] 操作完成，耗时: ${endTime - startTime}ms`);
    return null;
  } catch (error) {
    console.error(`[REDIS] [${operationId}] ❌ 从Redis获取用户数据时发生错误:`);
    if (error instanceof Error) {
      console.error(`[REDIS] [${operationId}] - 错误类型: ${error.name}`);
      console.error(`[REDIS] [${operationId}] - 错误消息: ${error.message}`);
      console.error(`[REDIS] [${operationId}] - 错误堆栈: ${error.stack}`);
      
      // 特定错误类型的分析
      if (error.name === 'AbortError') {
        console.error(`[REDIS] [${operationId}] - 分析: 连接超时或被中止，可能是Redis服务器无响应`);
      } else if (error.message.includes('NetworkError')) {
        console.error(`[REDIS] [${operationId}] - 分析: 网络错误，可能是后端API不可达或CORS问题`);
      } else if (error.message.includes('ECONNREFUSED')) {
        console.error(`[REDIS] [${operationId}] - 分析: 连接被拒绝，检查Redis服务是否运行和端口配置`);
      }
    } else {
      console.error(`[REDIS] [${operationId}] - 错误对象:`, error);
    }
    
    const endTime = Date.now();
    console.error(`[REDIS] [${operationId}] 操作失败，耗时: ${endTime - startTime}ms`);
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
          host: config.redisHost || '',
          port: config.redisPort || ''
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