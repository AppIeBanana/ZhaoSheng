// Redis连接和操作功能实现 - 使用后端API
import { safeSetItem, safeGetItem, safeRemoveItem, STORAGE_EXPIRY_TIME } from './utils';

// 获取后端API基础URL
const getBackendApiUrl = (): string => {
  return import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001';
};

// 生成或获取用户唯一标识（30分钟过期）
function getUserId(): string {
  let userId = safeGetItem('userId');
  if (!userId) {
    // 生成新的用户ID
    userId = 'user_' + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    safeSetItem('userId', userId, STORAGE_EXPIRY_TIME);
  }
  return userId;
}

// 添加防抖机制，防止短时间内重复请求
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 最小请求间隔1秒

// 检查是否应该发起请求
function shouldMakeRequest(): boolean {
  const now = Date.now();
  if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
    console.log('请求过于频繁，已节流');
    return false;
  }
  lastRequestTime = now;
  return true;
}

// 带重试的fetch函数
async function fetchWithRetry(url: string, options: RequestInit, retries = 2): Promise<Response> {
  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    if (retries > 0) {
      console.log(`请求失败，正在进行第 ${3 - retries} 次重试...`);
      // 指数退避
      await new Promise(resolve => setTimeout(resolve, (3 - retries) * 500)); // 减少重试间隔
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

// 保存学生数据到Redis，如果API失败则使用localStorage作为备用
export async function saveStudentDataToRedis(studentData: any): Promise<boolean> {
  try {
    const userId = getUserId();
    const backendUrl = getBackendApiUrl();
    
    // 先保存到localStorage作为备份（30分钟过期）
    try {
      safeSetItem('studentData', studentData, STORAGE_EXPIRY_TIME);
      console.log('学生数据已保存到localStorage备份');
    } catch (localStorageError) {
      console.error('localStorage备份失败:', localStorageError);
    }
    
    // 尝试通过API保存数据到Redis（带重试）
    const response = await fetchWithRetry(`${backendUrl}/api/student-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        studentData,
        redisConfig: {
          host: import.meta.env.VITE_REDIS_HOST || '172.21.9.233',
          port: import.meta.env.VITE_REDIS_PORT || 6379
        }
      }),
      credentials: 'include'
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('学生数据保存结果:', result.message || '成功保存到Redis');
      return true;
    } else {
      throw new Error(`API请求失败: ${response.status}`);
    }
  } catch (error) {
    console.error('通过API保存学生数据到Redis失败:', error);
    
    // 检查是否已经保存到localStorage
    try {
      const savedData = safeGetItem('studentData');
      if (savedData) {
        console.log('已使用localStorage作为备用存储');
        return true;
      }
      // 如果之前的localStorage保存也失败了，再次尝试
      return safeSetItem('studentData', studentData, STORAGE_EXPIRY_TIME);
    } catch (localStorageError) {
      console.error('localStorage存储也失败:', localStorageError);
      return false;
    }
  }
}

// 从Redis获取学生数据，如果API失败则使用localStorage作为备用
export async function getStudentDataFromRedis(): Promise<any | null> {
  // 先快速检查localStorage
  try {
    const studentData = safeGetItem('studentData');
    if (studentData) {
      console.log('快速返回localStorage中的学生数据');
      // 然后异步尝试更新Redis数据，不阻塞返回
      updateStudentDataFromRedis();
      return studentData;
    }
  } catch (localStorageError) {
    console.error('localStorage读取失败:', localStorageError);
  }
  
  // 没有有效localStorage数据或读取失败，尝试从Redis获取
  if (!shouldMakeRequest()) {
    // 如果请求过于频繁，直接返回null
    return null;
  }
  
  try {
    const userId = getUserId();
    const backendUrl = getBackendApiUrl();
    
    // 尝试通过API从Redis获取数据（带重试）
    const response = await fetchWithRetry(`${backendUrl}/api/student-data/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data) {
        console.log('成功从Redis获取学生数据');
        // 同时更新localStorage作为备份（30分钟过期）
        try {
          safeSetItem('studentData', result.data, STORAGE_EXPIRY_TIME);
        } catch (e) {
          console.warn('更新localStorage备份失败:', e);
        }
        return result.data;
      }
      return null;
    } else {
      // 不要在404等正常错误时抛出异常，直接返回null
      console.log(`API返回非成功状态: ${response.status}`);
      return null;
    }
  } catch (error) {
    console.error('通过API从Redis获取学生数据失败:', error);
    return null;
  }
}

// 异步更新Redis数据，不阻塞主流程
async function updateStudentDataFromRedis() {
  try {
    if (!shouldMakeRequest()) {
      return;
    }
    
    const userId = getUserId();
    const backendUrl = getBackendApiUrl();
    
    const response = await fetchWithRetry(`${backendUrl}/api/student-data/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data) {
        // 更新localStorage（30分钟过期）
        try {
          safeSetItem('studentData', result.data, STORAGE_EXPIRY_TIME);
          console.log('异步更新了localStorage备份');
        } catch (e) {
          console.warn('异步更新localStorage备份失败:', e);
        }
      }
    }
  } catch (error) {
    // 静默处理异步更新错误
    console.debug('异步更新Redis数据失败:', error);
  }
}

// 清除Redis中的学生数据
export async function clearStudentDataFromRedis(): Promise<boolean> {
  try {
    const userId = getUserId();
    const backendUrl = getBackendApiUrl();
    
    // 尝试通过API清除Redis中的数据
    const response = await fetch(`${backendUrl}/api/student-data/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        redisConfig: {
          host: import.meta.env.VITE_REDIS_HOST || '172.21.9.233',
          port: import.meta.env.VITE_REDIS_PORT || 6379
        }
      })
    });
    
    if (!response.ok) {
      console.warn('通过API清除Redis数据失败，但将继续清除localStorage');
    }
    
    // 同时清除localStorage中的数据
    safeRemoveItem('studentData');
    safeRemoveItem('userId'); // 也清除用户ID，确保完全重置
    return true;
  } catch (error) {
    console.error('清除学生数据失败:', error);
    return false;
  }
}