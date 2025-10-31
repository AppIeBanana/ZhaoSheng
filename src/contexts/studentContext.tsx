import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { safeGetItem, safeSetItem, STORAGE_EXPIRY_TIME } from '@/lib/utils';
import { getStudentDataFromRedis } from '@/lib/redis';

// Define the type for student data
interface StudentData {
  examType: string;
  studentType: string;
  province: string;
  minzu: string;
  score: string;
  phone?: string;
}

// Define the context type
interface StudentContextType {
  studentData: StudentData | null;
  setStudentData: (data: StudentData) => void;
}

// Create the context with a default value
const StudentContext = createContext<StudentContextType | undefined>(undefined);

// Create the provider component
export const StudentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 初始化时从localStorage读取数据，使用与redis.ts相同的键名
  const [studentData, setStudentData] = useState<StudentData | null>(() => {
    try {
      const savedData = safeGetItem('studentData');
      return savedData || null;
    } catch (error) {
      console.error('初始化学生数据失败:', error);
      return null;
    }
  });

  // 组件挂载时尝试从Redis获取最新数据
  useEffect(() => {
    const loadStudentData = async () => {
      try {
        const data = await getStudentDataFromRedis();
        if (data && !studentData) {
          setStudentData(data);
        }
      } catch (error) {
        console.debug('从Redis加载数据失败:', error);
        // 失败时不做处理，保持当前状态
      }
    };
    
    loadStudentData();
  }, []);

  // 当studentData变化时，保存到localStorage，使用与redis.ts相同的过期时间
  useEffect(() => {
    if (studentData) {
      try {
        safeSetItem('studentData', studentData, STORAGE_EXPIRY_TIME);
      } catch (error) {
        console.error('保存学生数据到本地存储失败:', error);
      }
    }
  }, [studentData]);

  return (
    <StudentContext.Provider value={{ studentData, setStudentData }}>
      {children}
    </StudentContext.Provider>
  );
};

// Create a custom hook to use the context
export const useStudentData = () => {
  const context = useContext(StudentContext);
  if (context === undefined) {
    throw new Error('useStudentData must be used within a StudentProvider');
  }
  return context;
};