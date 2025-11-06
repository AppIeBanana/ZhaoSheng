import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import config from './configLoader';

// 60分钟过期时间（毫秒）- 仅用于历史兼容性，项目现在只使用Redis和MongoDB
export const STORAGE_EXPIRY_TIME = 60 * 60 * 1000;

// 数据项优先级配置 - 已禁用，保留仅为历史兼容性
export const STORAGE_PRIORITIES: Record<string, number> = {
  'userId': 1,      // 用户ID优先级最高
  'userData': 2,  // 用户数据优先级次之
  'chatMessages': 3,  // 聊天历史优先级再次之
  'theme': 4         // 主题设置优先级最低
};

// 带过期时间的localStorage存储项接口（已禁用，保留注释）
// interface StorageItem {
//   value: any;
//   timestamp: number;
//   expiry: number;
// }

/**
 * 安全地存储数据到localStorage，带过期时间（已禁用）
 */
export function safeSetItem(_key: string, _value: any, _expiry: number = STORAGE_EXPIRY_TIME): boolean {
  console.warn('localStorage已禁用，改用Redis和MongoDB存储数据');
  return false; // 已禁用，返回存储失败
  /*
  try {
    const item: StorageItem = {
      value,
      timestamp: Date.now(),
      expiry
    };
    
    localStorage.setItem(key, JSON.stringify(item));
    return true;
  } catch (error: unknown) {
    // 如果是空间不足错误，尝试清理数据
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('localStorage空间不足，尝试清理最旧数据...');
      
      // 清理最旧或优先级最低的数据
      cleanupOldestStorageData();
      
      // 再次尝试存储
      try {
        const item: StorageItem = {
          value,
          timestamp: Date.now(),
          expiry
        };
        localStorage.setItem(key, JSON.stringify(item));
        console.log('清理后存储成功');
        return true;
      } catch (retryError) {
        console.error('清理后仍然无法存储:', retryError);
        return false;
      }
    }
    
    console.error('localStorage存储失败:', error);
    return false;
  }
  */
}

/**
 * 从localStorage获取数据，自动检查过期（已禁用）
 */
export function safeGetItem(_key: string): any | null {
  console.warn('localStorage已禁用，请从Redis和MongoDB获取数据');
  return null; // 已禁用，始终返回null
  /*
  try {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;
    
    // 尝试解析JSON
    let item: StorageItem;
    try {
      item = JSON.parse(itemStr);
    } catch (parseError) {
      console.error('localStorage解析失败，删除损坏的数据:', parseError);
      // 解析失败，删除损坏的数据
      try {
        localStorage.removeItem(key);
      } catch (removeError) {
        console.error('删除损坏的localStorage项失败:', removeError);
      }
      return null;
    }
    
    // 检查数据格式是否正确
    if (!item || typeof item.timestamp !== 'number' || typeof item.expiry !== 'number') {
      console.error('localStorage数据格式不正确，删除无效数据');
      try {
        localStorage.removeItem(key);
      } catch (removeError) {
        console.error('删除无效的localStorage项失败:', removeError);
      }
      return null;
    }
    
    const now = Date.now();
    
    // 检查是否过期
    if (now - item.timestamp > item.expiry) {
      // 自动删除过期数据
      try {
        localStorage.removeItem(key);
        console.log(`localStorage项 ${key} 已过期，自动删除`);
      } catch (removeError) {
        console.error('删除过期的localStorage项失败:', removeError);
      }
      return null;
    }
    
    return item.value;
  } catch (error: unknown) {
    console.error('localStorage读取失败:', error);
    // 如果读取失败，尝试删除该项
    try {
      localStorage.removeItem(key);
    } catch (removeError) {
      console.error('删除localStorage项失败:', removeError);
    }
    return null;
  }
  */
}

/**
 * 清理localStorage中最旧或优先级最低的数据
 */
export function cleanupOldestStorageData(): void {
  console.warn('localStorage已禁用，不再清理本地存储数据');
  /*
  try {
    // 获取所有存储项的信息
    const storageItems: Array<{
      key: string;
      timestamp: number;
      priority: number;
    }> = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        try {
          const itemStr = localStorage.getItem(key);
          if (itemStr) {
            const item: StorageItem = JSON.parse(itemStr);
            storageItems.push({
              key,
              timestamp: item.timestamp,
              priority: STORAGE_PRIORITIES[key] || 999  // 默认低优先级
            });
          }
        } catch (e) {
          // 忽略无法解析的项
          console.warn(`无法解析localStorage项: ${key}`);
        }
      }
    }
    
    // 按优先级和时间戳排序（优先级高的排在前，同优先级按时间戳新的排在前）
    storageItems.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return b.timestamp - a.timestamp;
    });
    
    // 删除最旧的一半数据（从末尾开始删除）
    const itemsToDelete = Math.ceil(storageItems.length / 2);
    for (let i = storageItems.length - 1; i >= storageItems.length - itemsToDelete; i--) {
      if (i >= 0) {
        console.log(`删除localStorage项: ${storageItems[i].key}`);
        localStorage.removeItem(storageItems[i].key);
      }
    }
  } catch (error: unknown) {
    console.error('清理localStorage失败:', error);
  }
  */
}

/**
 * 移除localStorage中的项（已禁用）
 */
export function safeRemoveItem(_key: string): void {
  console.warn('localStorage已禁用，不再删除本地存储数据');
  /*
  try {
    localStorage.removeItem(key);
  } catch (error: unknown) {
    console.error(`移除localStorage项 ${key} 失败:`, error);
  }
  */
}

/**
 * 带重试和超时的fetch函数
 */
export async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 2, timeoutMs = 10000): Promise<Response> {
  // 记录请求的详细信息
  const method = options.method || 'GET';
  const requestDetails = {
    method,
    url,
    headers: options.headers || {},
    hasBody: !!options.body,
    timeout: timeoutMs,
    retryCount: retries
  };
  
  // 创建一个AbortController来处理超时
  const controller = new AbortController();
  
  try {
    // 只有在options中没有signal时才添加我们的signal
    const fetchOptions = {
      ...options,
      signal: options.signal || controller.signal
    };
    
    console.log(`[FETCH] 执行请求 (1/${retries + 1}): ${method} ${url}`);
    console.log(`[FETCH] 请求详情:`, requestDetails);
    
    // 设置超时
    const timeoutPromise = new Promise<never>((_, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`请求超时: ${timeoutMs}ms`));
        // 只有在使用我们自己的signal时才abort
        if (!options.signal) {
          controller.abort();
        }
      }, timeoutMs);
      
      // 清理函数，防止内存泄漏
      return () => clearTimeout(timeoutId);
    });
    
    // 竞争fetch和timeout
    const response = await Promise.race([
      fetch(url, fetchOptions),
      timeoutPromise
    ]);
    
    console.log(`[FETCH] 请求响应: ${url}, 状态码: ${response.status}`);
    
    if (!response.ok) {
      console.error(`[FETCH] 请求失败: ${url}, 状态码: ${response.status}`);
      
      // 尝试获取错误响应体
      try {
        const errorData = await response.clone().json();
        console.error(`[FETCH] 错误响应内容:`, errorData);
      } catch (jsonError: unknown) {
        try {
          const errorText = await response.clone().text();
          console.error(`[FETCH] 错误响应文本:`, errorText);
        } catch (textError: unknown) {
          console.error(`[FETCH] 无法读取错误响应`);
        }
      }
    } else {
      console.log(`[FETCH] 请求成功: ${url}`);
    }
    
    return response;
  } catch (error: unknown) {
    // 清理controller资源
    if (!options.signal) {
      controller.abort(); // 确保资源被释放
    }
    
    // 详细记录错误信息
    if (error instanceof Error) {
      console.error(`[FETCH] 请求异常: ${url}`, error);
      console.error(`[FETCH] 错误类型: ${error.name}`);
      console.error(`[FETCH] 错误消息: ${error.message}`);
      console.error(`[FETCH] 错误堆栈: ${error.stack}`);
      
      // 区分不同类型的网络错误
      if (error.name === 'AbortError') {
        console.error(`[FETCH] 中止错误: 请求被中止或超时`);
      } else if (error.message.includes('NetworkError')) {
        console.error(`[FETCH] 网络错误: 可能是连接问题、CORS或服务器不可达`);
      } else if (error.message.includes('请求超时')) {
        console.error(`[FETCH] 超时错误: 服务器响应时间超过${timeoutMs}ms`);
      }
    }
    
    // 如果是AbortError或超时错误，尝试重试
    if ((error as Error).name === 'AbortError' || (error as Error).message?.includes('请求超时') && retries > 0) {
      const retryNum = 3 - retries;
      console.log(`[FETCH] 请求超时或被中止，正在进行第 ${retryNum} 次重试...`);
      
      // 指数退避
      const waitTime = Math.pow(2, retryNum - 1) * 500;
      console.log(`[FETCH] 等待 ${waitTime}ms 后重试请求: ${url}`);
      
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return fetchWithRetry(url, options, retries - 1, timeoutMs);
    }
    
    // 其他错误或重试次数用完，抛出错误
    console.error('[FETCH] fetch请求失败，已达到最大重试次数');
    throw error;
  }
}

/**
 * 获取后端API基础URL
 */
export function getBackendApiUrl(): string {
  // 从配置加载器获取后端API URL
  return config.backendApiUrl;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
