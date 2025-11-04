import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// 60分钟过期时间（毫秒）
export const STORAGE_EXPIRY_TIME = 60 * 60 * 1000;

// 数据项优先级配置（数字越小优先级越高）
export const STORAGE_PRIORITIES: Record<string, number> = {
  'userId': 1,      // 用户ID优先级最高
  'userData': 2,  // 用户数据优先级次之
  'chatMessages': 3,  // 聊天历史优先级再次之
  'theme': 4         // 主题设置优先级最低
};

// 带过期时间的localStorage存储项接口
interface StorageItem {
  value: any;
  timestamp: number;
  expiry: number;
}

/**
 * 安全地存储数据到localStorage，带过期时间
 * 当空间不足时，自动清理最旧或优先级最低的数据
 */
export function safeSetItem(key: string, value: any, expiry: number = STORAGE_EXPIRY_TIME): boolean {
  try {
    const item: StorageItem = {
      value,
      timestamp: Date.now(),
      expiry
    };
    
    localStorage.setItem(key, JSON.stringify(item));
    return true;
  } catch (error) {
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
}

/**
 * 从localStorage获取数据，自动检查过期
 */
export function safeGetItem(key: string): any | null {
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
  } catch (error) {
    console.error('localStorage读取失败:', error);
    // 如果读取失败，尝试删除该项
    try {
      localStorage.removeItem(key);
    } catch (removeError) {
      console.error('删除localStorage项失败:', removeError);
    }
    return null;
  }
}

/**
 * 清理localStorage中最旧或优先级最低的数据
 */
export function cleanupOldestStorageData(): void {
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
  } catch (error) {
    console.error('清理localStorage失败:', error);
  }
}

/**
 * 移除localStorage中的项
 */
export function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`移除localStorage项 ${key} 失败:`, error);
  }
}

/**
 * 带重试和超时的fetch函数
 */
export async function fetchWithRetry(url: string, options: RequestInit, retries = 2, timeoutMs = 10000): Promise<Response> {
  try {
    // 创建一个AbortController来处理超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    // 合并options，添加signal
    const fetchOptions = {
      ...options,
      signal: controller.signal
    };
    
    const response = await fetch(url, fetchOptions);
    
    // 请求成功完成，清除超时定时器
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    if (retries > 0) {
      console.log(`请求失败，正在进行第 ${3 - retries} 次重试...`);
      // 指数退避
      await new Promise(resolve => setTimeout(resolve, (3 - retries) * 500));
      return fetchWithRetry(url, options, retries - 1, timeoutMs);
    }
    throw error;
  }
}

/**
 * 获取后端API基础URL
 */
export function getBackendApiUrl(): string {
  return import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001';
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
