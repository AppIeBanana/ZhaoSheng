import React, { createContext, useState, useContext, useEffect } from 'react';
import { getUserData, saveUserData, clearUserData, getStoredPhone, setCurrentPhone } from '../lib/storageService';

// 定义用户数据类型
interface UserData {
  examType?: string;
  userType?: string;
  province?: string;
  ethnicity?: string;
  score?: string;
  phone?: string;
  name?: string;
  email?: string;
  age?: string;
  education?: string;
  subject?: string;
  message?: string;
}

// 定义上下文类型
interface UserContextType {
  userData: UserData | null;
  updateUserData: (data: UserData, saveToServer?: boolean) => Promise<void>;
  clearUserData: () => Promise<boolean>;
  isLoading: boolean;
  reloadData: (phone?: string) => Promise<void>;
}

// 创建上下文
const UserContext = createContext<UserContextType | undefined>(undefined);

// 创建提供者组件
export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化时从服务器加载数据
  useEffect(() => {
    loadUserData();
  }, []);

  // 从服务器加载数据（支持MongoDB和Redis）
  const loadUserData = async () => {
    try {
      setIsLoading(true);
      // 获取当前保存的手机号
      const phone = getStoredPhone();
      // 通过手机号加载数据
      let data = null;
      if (phone) {
        data = await getUserData(phone);
      }
      if (data) {
        setUserData(data);
        if (data.phone) {
          setCurrentPhone(data.phone);
        }
      }
    } catch (error) {
      console.error('加载用户数据失败:', error);
    } finally {
      // 确保无论如何都会将loading状态设置为false
      setIsLoading(false);
      console.log('数据加载完成，isLoading设置为false');
    }
  };

  // 重新加载数据（可以指定手机号）
  const reloadData = async (phone?: string) => {
    try {
      setIsLoading(true);
      // 如果没有提供手机号，使用存储的手机号，确保类型兼容
      const storedPhone = getStoredPhone();
      const targetPhone = phone || storedPhone;
      let data = null;
      if (targetPhone) {
        data = await getUserData(targetPhone);
      }
      if (data) {
        setUserData(data);
        if (data.phone) {
          setCurrentPhone(data.phone);
        }
      }
    } catch (error) {
      console.error('重新加载用户数据失败:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 更新用户数据
  const updateUserData = async (data: UserData, saveToServer = true) => {
    try {
      setUserData(data);
      // 只有当saveToServer为true时才保存到服务器
      if (saveToServer) {
        // 保存到MongoDB（持久化）和Redis（缓存）
        // 以手机号为主键
        await saveUserData(data);
      } else {
        // 仅更新内存状态，不保存到任何存储
        // 注释掉localStorage相关代码，只使用Redis和MongoDB
        // const localStorageService = await import('./../lib/storage/localStorage');
        // localStorageService.saveUserDataLocal(data);
        console.log('仅更新内存状态，不保存到存储');
      }
      if (data.phone) {
        setCurrentPhone(data.phone);
      }
    } catch (error) {
      console.error('更新用户数据失败:', error);
      throw error;
    }
  };

  // 清除用户数据
  const clearUserDataContext = async (): Promise<boolean> => {
    try {
      setUserData(null);
      // 获取当前存储的手机号
      const phone = getStoredPhone();
      // 清除本地缓存，保留MongoDB持久化数据
      if (phone) {
        return await clearUserData(phone);
      }
      return false;
    } catch (error) {
      console.error('清除用户数据失败:', error);
      return false;
    }
  };

  return (
    <UserContext.Provider value={{ 
      userData, 
      updateUserData, 
      clearUserData: clearUserDataContext, 
      isLoading, 
      reloadData 
    }}>
      {children}
    </UserContext.Provider>
  );
};

// 创建自定义Hook以使用上下文
export const useUserData = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserData must be used within a UserProvider');
  }
  return context;
};

// 导出上下文，供其他组件使用
export { UserContext };