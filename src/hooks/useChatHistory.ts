import { useState, useEffect, useRef } from 'react';
import { Message } from '@/lib/coze_api';
// 注释掉localStorage相关导入，只使用Redis和MongoDB
// import { safeSetItem, STORAGE_EXPIRY_TIME } from '@/lib/utils';
import { getChatHistory, saveChatHistory as saveChatToStorage, setCurrentPhone } from '@/lib/storageService';
import { useUserData } from '@/contexts/userContext';

export default function useChatHistory() {
  const { userData } = useUserData();
  const isInitializedRef = useRef(false);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [lastUpdatedMessageId, setLastUpdatedMessageId] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // 从MongoDB/Redis加载聊天历史（最多尝试3次）
  const loadMessagesByPhone = async (phone: string) => {
    if (!phone) return;
    
    setIsLoadingHistory(true);
    let retryCount = 0;
    const maxRetries = 3;
    let success = false;
    
    while (retryCount < maxRetries && !success) {
      retryCount++;
      try {
        console.log(`尝试加载聊天记录 (${retryCount}/${maxRetries})`);
        // 确保手机号已保存到sessionStorage
        setCurrentPhone(phone);
        
        // 从MongoDB/Redis获取历史聊天记录
        const historyMessages = await getChatHistory(phone);
        if (historyMessages && historyMessages.length > 0) {
          // 转换timestamp字符串回Date对象
          const formattedMessages = historyMessages.map((msg: any) => ({
            ...msg,
            timestamp: typeof msg.timestamp === 'string' ? new Date(msg.timestamp) : msg.timestamp
          }));
          setMessages(formattedMessages);
          console.log(`已加载${phone}的历史聊天记录，共${formattedMessages.length}条`);
          success = true;
        } else {
          // 没有历史记录，保持空消息状态
          console.log('没有历史记录，保持空消息状态');
          success = true; // 没有记录不算失败，直接成功
        }
      } catch (error) {
        console.error(`第${retryCount}次加载${phone}的聊天记录失败:`, error);
        if (retryCount >= maxRetries) {
          console.log(`已达到最大重试次数(${maxRetries})，停止重试`);
          // 达到最大重试次数后，保持空消息状态
        } else {
          // 等待一段时间后重试
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
    }
    
    setIsLoadingHistory(false);
  };

  // 添加用户消息
  const addUserMessage = (content: string): Message => {
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    return userMessage;
  };

  // 添加机器人初始消息
  const addInitialBotMessage = (): string => {
    const botMessageId = `bot-${Date.now()}`;
    const initialBotMessage: Message = {
      id: botMessageId,
      content: '',
      sender: 'bot',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, initialBotMessage]);
    return botMessageId;
  };

  // 更新机器人消息内容
  const updateBotMessage = (messageId: string, content: string) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, content } : msg
      )
    );
    setLastUpdatedMessageId(messageId);
  };

  // 监听学生数据变化，加载对应手机号的聊天记录
  useEffect(() => {
    console.log('用户数据变化，当前手机号:', userData?.phone);
    
    const initializeChat = async () => {
      try {
        if (!isInitializedRef.current) {
          isInitializedRef.current = true;
          console.log('初始化聊天历史组件');
          
          // 初始化时，直接根据是否有手机号来加载数据
          if (userData?.phone) {
            console.log('初始化，有手机号，加载聊天记录');
            await loadMessagesByPhone(userData.phone);
          } else {
            console.log('初始化，无手机号，保持空消息状态');
            // 没有手机号时保持空消息状态
          }
        } else {
          // 当学生数据变化时，如果有手机号，加载对应聊天记录
          if (userData?.phone) {
            console.log('数据变化，有手机号，加载聊天记录');
            await loadMessagesByPhone(userData.phone);
          } else {
            console.log('数据变化，无手机号，保持空消息状态');
            // 没有手机号时保持空消息状态
          }
        }
      } catch (error) {
        console.error('初始化聊天出错:', error);
        // 出错时保持空消息状态
      }
    };
    
    initializeChat();
  }, [userData?.phone]);

  // 保存聊天历史到MongoDB和localStorage - 添加防抖处理
  useEffect(() => {
    // 添加防抖处理，避免频繁保存
    const saveTimer = setTimeout(() => {
      if (messages.length > 0) {
        try {
          // 转换Date对象为ISO字符串以便存储
          const messagesToSave = messages.map(msg => ({
            ...msg,
            timestamp:
              msg.timestamp instanceof Date
                ? msg.timestamp.toISOString()
                : msg.timestamp,
          }));
          
          // 如果有手机号，保存到MongoDB（持久化存储）和带phone标识的localStorage
          // 保存聊天记录，当最后一条消息是用户消息或机器人消息内容不为空时
          const lastMessage = messages[messages.length - 1];
          if (userData?.phone && lastMessage) {
            // 调用storageService中的saveChatHistory函数
            console.log('保存聊天记录到服务器');
            saveChatToStorage(userData.phone, messagesToSave);
          } else {
            // 如果没有手机号，不保存聊天记录（仅使用Redis和MongoDB）
            console.warn('没有手机号，聊天记录不保存（项目已禁用localStorage）');
            // 注释掉localStorage相关代码，仅使用Redis和MongoDB
            // safeSetItem('temp_chatMessages', messagesToSave, STORAGE_EXPIRY_TIME);
          }
        } catch (error) {
          console.error('保存聊天历史失败:', error);
        }
      }
    }, 1000); // 1秒防抖延迟

    return () => clearTimeout(saveTimer);
  }, [messages, userData?.phone]);

  return {
    messages,
    lastUpdatedMessageId,
    isLoadingHistory,
    addUserMessage,
    addInitialBotMessage,
    updateBotMessage,
    loadMessagesByPhone
  };
}