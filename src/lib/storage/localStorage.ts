// localStorage存储实现
import { safeSetItem, safeGetItem, safeRemoveItem, STORAGE_EXPIRY_TIME } from '../utils';

// 存储键名常量
export const STORAGE_KEYS = {
  USER_DATA: 'userData',
  CHAT_MESSAGES: 'chatMessages',
  USER_ID: 'userId',
  CURRENT_PHONE: 'currentPhone'
};

/**
 * 保存用户数据到localStorage
 */
export function saveUserDataLocal(data: any): boolean {
  try {
    return safeSetItem(STORAGE_KEYS.USER_DATA, data, STORAGE_EXPIRY_TIME);
  } catch (error) {
    console.error('保存用户数据到localStorage失败:', error);
    return false;
  }
}

/**
 * 从localStorage获取用户数据
 */
export function getUserDataLocal(): any | null {
  try {
    return safeGetItem(STORAGE_KEYS.USER_DATA);
  } catch (error) {
    console.error('从localStorage获取用户数据失败:', error);
    return null;
  }
}

/**
 * 保存聊天记录到localStorage，与phone关联
 */
export function saveChatMessagesLocal(messages: any[], phone?: string): boolean {
  try {
    if (!phone) {
      console.error('保存聊天记录失败：缺少phone参数');
      return false;
    }
    const key = `${STORAGE_KEYS.CHAT_MESSAGES}_${phone}`;
    // 聊天记录保存更长时间（24小时）
    return safeSetItem(key, messages, STORAGE_EXPIRY_TIME * 24);
  } catch (error) {
    console.error('保存聊天记录到localStorage失败:', error);
    return false;
  }
}

/**
 * 从localStorage获取聊天记录，与phone关联
 */
export function getChatMessagesLocal(phone?: string): any[] {
  try {
    if (!phone) {
      console.error('获取聊天记录失败：缺少phone参数');
      return [];
    }
    const key = `${STORAGE_KEYS.CHAT_MESSAGES}_${phone}`;
    const messages = safeGetItem(key);
    return messages && Array.isArray(messages) ? messages : [];
  } catch (error) {
    console.error('从localStorage获取聊天记录失败:', error);
    return [];
  }
}

/**
 * 生成或获取用户ID
 */
export function getUserIdLocal(): string {
  let userId = safeGetItem(STORAGE_KEYS.USER_ID);
  if (!userId) {
    // 生成新的用户ID
    userId = 'user_' + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    safeSetItem(STORAGE_KEYS.USER_ID, userId, STORAGE_EXPIRY_TIME);
  }
  return userId;
}

/**
 * 保存当前手机号到sessionStorage
 */
export function setCurrentPhoneSession(phone: string): void {
  try {
    sessionStorage.setItem(STORAGE_KEYS.CURRENT_PHONE, phone);
  } catch (error) {
    console.error('保存手机号到sessionStorage失败:', error);
  }
}

/**
 * 从sessionStorage获取当前手机号
 */
export function getCurrentPhoneSession(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEYS.CURRENT_PHONE);
  } catch (error) {
    console.error('从sessionStorage获取手机号失败:', error);
    return null;
  }
}

/**
 * 清除本地存储的数据
 */
export function clearLocalData(): void {
  try {
    safeRemoveItem(STORAGE_KEYS.USER_DATA);
    safeRemoveItem(STORAGE_KEYS.CHAT_MESSAGES);
    safeRemoveItem(STORAGE_KEYS.USER_ID);
    sessionStorage.removeItem(STORAGE_KEYS.CURRENT_PHONE);
  } catch (error) {
    console.error('清除本地数据失败:', error);
  }
}