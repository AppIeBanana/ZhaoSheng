import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStudentData } from '@/contexts/studentContext.tsx';
import { Message, sendMessageToAPIStream } from '@/lib/api';
import { toast } from 'sonner';
import { questionCategories, questionsByCategory, getRandomQuestions } from '@/data/questionsData';

// 在QAPage.tsx中添加本地存储功能
// const saveMessagesToLocalStorage = (userId: string, messages: Message[]) => {
//   localStorage.setItem(`chat_history_${userId}`, JSON.stringify({
//     messages: messages.map(msg => ({ ...msg, timestamp: msg.timestamp.toISOString() })),
//     lastUpdated: new Date().toISOString()
//   }));
// };

// const loadMessagesFromLocalStorage = (userId: string): Message[] => {
//   const saved = localStorage.getItem(`chat_history_${userId}`);
//   if (!saved) return [];
//   try {
//     const data = JSON.parse(saved);
//     return data.messages.map((msg: any) => ({
//       ...msg,
//       timestamp: new Date(msg.timestamp)
//     }));
//   } catch (e) {
//     console.error('Failed to load chat history:', e);
//     return [];
//   }
// };

export default function QAPage() {
  const navigate = useNavigate();
  const { studentData, setStudentData } = useStudentData();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);
  const [displayedQuestions, setDisplayedQuestions] = useState<string[]>(
    getRandomQuestions(questionsByCategory[0], 5)
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [lastUpdatedMessageId, setLastUpdatedMessageId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [dialogIdInput, setDialogIdInput] = useState('');
  
  // 获取当前对话ID（从URL参数中）
  const currentDialogId = searchParams.get('dialogId');
  
  // 设置对话ID到URL
  const setDialogId = (dialogId: string) => {
    if (dialogId) {
      setSearchParams({ dialogId });
    } else {
      // 如果没有对话ID，则移除该参数
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('dialogId');
      setSearchParams(newParams);
    }
  };
  
  // 应用对话ID
  const applyDialogId = () => {
    if (dialogIdInput.trim()) {
      setDialogId(dialogIdInput.trim());
      setDialogIdInput('');
      toast.success(`已切换到对话ID: ${dialogIdInput.trim()}`);
    }
  };
  
  // 生成新的随机对话ID
  const generateNewDialogId = () => {
    const newDialogId = `dialog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setDialogIdInput(newDialogId);
  };

  // 修改为基于对话ID的用户标识管理逻辑
  const getUserIdentifier = () => {
    // 优先使用URL中的对话ID（调试模式）
    if (currentDialogId) {
      // 为对话ID添加验证逻辑，防止格式错误
      const safeDialogId = currentDialogId.replace(/[^a-zA-Z0-9_\-]/g, '');
      return `dialog_${safeDialogId}`;
    }
    
    // 没有对话ID时，使用之前的逻辑
    let userId = localStorage.getItem('wechat_user_id');
    
    if (!userId) {
      userId = 'wechat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('wechat_user_id', userId);
    }
    
    return userId;
  };
  
  const userId = getUserIdentifier();

// 修改加载学生数据和历史消息的useEffect
useEffect(() => {
  // 首先检查是否有对话ID
  if (currentDialogId) {
    // 尝试从localStorage加载与该ID关联的学生数据
    const savedStudentData = localStorage.getItem(`student_data_${currentDialogId}`);
    
    if (savedStudentData) {
        try {
          const parsedData = JSON.parse(savedStudentData);
          // 如果上下文没有学生数据，则使用本地存储的数据更新上下文
          if (!studentData && setStudentData) {
            setStudentData(parsedData);
          }
        } catch (error) {
          console.error('Failed to parse saved student data:', error);
          toast.warning('检测到数据格式问题，建议创建新对话');
        }
      } else {
        // 没有找到与对话ID关联的学生数据
        toast.warning(`未找到与对话ID ${currentDialogId} 关联的学生信息，可能需要重新填写`);
      }
    
    // 尝试从本地存储加载历史消息
    const savedMessages = loadMessagesFromLocalStorage(userId);
    
    if (savedMessages.length > 0) {
      setMessages(savedMessages);
    } else {
      // 添加欢迎消息
      setMessages([{
        id: 'welcome',
        content: `Hi~ 我是福软小X\n非常高兴认识您。您有哪些想咨询的问题呢？`,
        sender: 'bot',
        timestamp: new Date()
      }]);
    }
  } else if (!studentData) {
    // 如果没有对话ID且没有学生数据，则重定向到信息收集页
    toast.error("请先填写学生信息");
    navigate('/');
  } else {
    // 原有逻辑：有学生数据但没有对话ID
    const savedMessages = loadMessagesFromLocalStorage(userId);
    
    if (savedMessages.length > 0) {
      setMessages(savedMessages);
    } else {
      // 添加欢迎消息
      setMessages([{
        id: 'welcome',
        content: `Hi~ 我是福软小X\n非常高兴认识您。您有哪些想咨询的问题呢？`,
        sender: 'bot',
        timestamp: new Date()
      }]);
    }
  }
}, [studentData, setStudentData, navigate, userId, currentDialogId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, lastUpdatedMessageId]);
  
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: input.trim(),
      sender: 'user',
      timestamp: new Date()
    };
    
    // Create a temporary bot message that will be updated with streaming content
    const botMessageId = `bot-${Date.now()}`;
    const initialBotMessage: Message = {
      id: botMessageId,
      content: '',
      sender: 'bot',
      timestamp: new Date()
    };
    
    // Add user message and initial bot message immediately
    setMessages(prev => [...prev, userMessage, initialBotMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // 验证studentData是否完整
      if (!studentData || !studentData.examType || !studentData.province || !studentData.score) {
        throw new Error('学生信息不完整，请重新填写');
      }
      
      // Get streaming bot response，传入userId参数
      const stream = sendMessageToAPIStream(userMessage.content, studentData, userId);
      let fullContent = '';
      let hasReceivedContent = false;
      
      // Iterate over each chunk in the stream
      for await (const chunk of stream) {
        fullContent += chunk;
        hasReceivedContent = true;
        
        // Update the bot message with new content
        setMessages(prev => 
          prev.map(msg => 
            msg.id === botMessageId 
              ? { ...msg, content: fullContent } 
              : msg
          )
        );
        
        // Trigger scroll by updating lastUpdatedMessageId
        setLastUpdatedMessageId(botMessageId);
      }
      
      // 如果没有接收到实际内容，显示特定的错误信息
      if (!hasReceivedContent && fullContent.includes('抱歉，获取回答时出现问题')) {
        throw new Error('API返回了错误响应，可能是临时问题');
      }
    } catch (error) {
      // 更详细的错误信息处理
      let errorMessage = '抱歉，获取回答时出现问题。请稍后重试。';
      if (error instanceof Error && error.message.includes('学生信息不完整')) {
        errorMessage = '学生信息不完整，可能是数据已损坏。请重新创建对话。';
        toast.error(errorMessage);
      } else if (currentDialogId) {
        errorMessage = `当前对话ID(${currentDialogId})可能存在问题。\n建议：1. 尝试生成新的对话ID继续使用\n2. 复制重要聊天记录后重新创建对话`;
        toast.error('对话可能存在问题，建议创建新对话');
      }
      
      // Update message with error information
      setMessages(prev => 
        prev.map(msg => 
          msg.id === botMessageId 
            ? { ...msg, content: errorMessage } 
            : msg
        )
      );
      console.error("API error:", error);
    } finally {
      setIsLoading(false);
      // 保存到本地存储
      setTimeout(() => {
        setMessages(prevMessages => {
          saveMessagesToLocalStorage(userId, prevMessages);
          return prevMessages;
        });
      }, 100);
    }
  };
  
  const handlePredefinedQuestion = (question: string) => {
    setInput(question);
    // Auto-send after a short delay to allow user to see the question
    setTimeout(handleSendMessage, 300);
  };
  
  // Change to another batch of questions
  const handleChangeQuestions = () => {
    // 从当前分类的20个问题中随机选择5个
    const newQuestions = getRandomQuestions(questionsByCategory[activeCategory], 5);
    setDisplayedQuestions(newQuestions);
    
    // 显示更新提示
    toast.info("已为您更新推荐问题");
  };
  
  // Change question category
  const handleCategoryChange = (index: number) => {
    setActiveCategory(index);
    setDisplayedQuestions(getRandomQuestions(questionsByCategory[index], 5));
  };

  // 在QAPage.tsx中添加本地存储功能
const saveMessagesToLocalStorage = (userId: string, messages: Message[]) => {
  localStorage.setItem(`chat_history_${userId}`, JSON.stringify({
    messages: messages.map(msg => ({ ...msg, timestamp: msg.timestamp.toISOString() })),
    lastUpdated: new Date().toISOString()
  }));
};

const loadMessagesFromLocalStorage = (userId: string): Message[] => {
  const saved = localStorage.getItem(`chat_history_${userId}`);
  if (!saved) return [];
  try {
    const data = JSON.parse(saved);
    return data.messages.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }));
  } catch (e) {
    console.error('Failed to load chat history:', e);
    return [];
  }
};


  
  return (
    <div className="flex flex-col h-screen bg-blue-50">
      {/* Header with school branding */}
      <header className="bg-white shadow-sm py-3 px-4 border-b sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <i className="fa-solid fa-arrow-left text-gray-600"></i>
          </button>
          <div className="text-center">
            <h1 className="text-sm font-medium text-gray-500">智能问答系统</h1>
            <div className="flex items-center justify-center mt-1">
              <span className="text-blue-600 font-semibold">福州软件职业技术学院AI招生</span>
              <i className="fa-solid fa-home ml-2 text-gray-400"></i>
              <i className="fa-solid fa-bars ml-3 text-gray-400"></i>
            </div>
          </div>
          {currentDialogId && (
            <div className="bg-blue-50 px-2 py-1 rounded text-xs text-blue-600 border border-blue-100">
              ID: {currentDialogId}
            </div>
          )}
        </div>
      </header>
      
      {/* 对话ID输入区域 - 调试模式使用 */}
      {!currentDialogId && (
        <div className="bg-yellow-50 border-b border-yellow-100 p-3 px-4">
          <div className="flex space-x-2 items-center">
            <input
              type="text"
              placeholder="输入对话ID以加载历史记录"
              value={dialogIdInput}
              onChange={(e) => setDialogIdInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyDialogId()}
              className="flex-1 px-3 py-1.5 text-sm border border-yellow-200 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            <button
              onClick={applyDialogId}
              className="px-3 py-1.5 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700 transition-colors"
            >
              应用
            </button>
            <button
              onClick={generateNewDialogId}
              className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 transition-colors"
            >
              生成
            </button>
          </div>
          <p className="text-xs text-yellow-700 mt-1">调试模式：输入对话ID可加载历史记录，该ID将显示在URL中</p>
        </div>
      )}
      
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto pb-32">
        {/* Predefined Questions Section - Now part of the scrollable content */}
        <div className="bg-white rounded-2xl shadow-sm mx-4 mt-4 mb-6 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                <i className="fa-solid fa-question text-blue-600 text-xs"></i>
              </div>
              <h3 className="font-medium text-gray-800">猜你想问</h3>
            </div>
            <button 
              onClick={handleChangeQuestions}
              className="text-blue-600 text-sm flex items-center"
            >
              <i className="fa-solid fa-sync-alt mr-1"></i>换一批
            </button>
          </div>
          
          {/* Category tabs */}
          <div className="flex overflow-x-auto pb-2 mb-3 space-x-1 -mx-1 px-1">
            {questionCategories.map((category, index) => (
              <button
                key={index}
                onClick={() => handleCategoryChange(index)}
                className={`
                  whitespace-nowrap px-3 py-1 text-sm rounded-full flex-shrink-0
                  ${activeCategory === index 
                    ? 'bg-blue-100 text-blue-600 font-medium' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                  transition-colors
                `}
              >
                {category}
              </button>
            ))}
          </div>
          
          {/* Question list */}
          <div className="space-y-2">
            {displayedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handlePredefinedQuestion(question)}
                className="w-full text-left bg-blue-50 rounded-xl p-3 text-gray-700 hover:bg-blue-100 transition-colors flex justify-between items-center"
              >
                <span>{question}</span>
                <i className="fa-solid fa-angle-right text-gray-400"></i>
              </button>
            ))}
          </div>
        </div>
        
        {/* Messages Container - Now part of the main scrollable content */}
        <div className="p-4 space-y-6">
          {/* Messages */}
          <div className="space-y-4 sm:space-y-6">
            {/* Historical records separator */}
            {messages.length > 1 && (
              <div className="flex items-center justify-center my-4">
                <div className="h-px bg-gray-200 flex-1"></div>
                <span className="px-3 text-xs text-gray-400">以上是历史记录</span>
                <div className="h-px bg-gray-200 flex-1"></div>
              </div>
            )}
            
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
                {message.sender === 'bot' && (
                  <img 
                    src="https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=cartoon%20female%20teacher%20avatar%2C%20friendly%20expression%2C%20blue%20background&sign=153bfaa46621c73e80628e542f1f3354" 
                    alt="AI Assistant" 
                    className="w-10 h-10 rounded-full mr-2 object-cover flex-shrink-0"
                  />
                )}
                <div className={`max-w-[85%] sm:max-w-[80%] ${message.sender === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className={`
                    rounded-2xl p-4 shadow-sm relative
                    ${message.sender === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'}
                  `}>
                    {isLoading && message.id.includes('bot-') && message.content === '' ? (
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
                      </div>
                    ) : (
                      <p className="whitespace-pre-line">{message.content}</p>
                    )}
                    
                    {/* Message actions for bot messages */}
                    {message.sender === 'bot' && message.id !== 'welcome' && (
                      <div className="flex justify-end mt-3 space-x-3">
                        <button className="text-gray-400 hover:text-gray-600 transition-colors">
                          <i className="fa-solid fa-volume-up"></i>
                        </button>
                        <button className="text-gray-400 hover:text-green-500 transition-colors">
                          <i className="fa-solid fa-thumbs-up"></i>
                        </button>
                        <button className="text-gray-400 hover:text-red-500 transition-colors">
                          <i className="fa-solid fa-thumbs-down"></i>
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Time stamp - hidden for welcome message */}
                  {message.id !== 'welcome' && (
                    <span className={`text-xs mt-1 ${message.sender === 'user' ? 'self-end' : 'self-start'} text-gray-400`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            ))}
            
            {/* Loading indicator */}
             {isLoading && (
               <div className="flex items-start">
               </div>
             )}
            
            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
      
       {/* Input Area - Fixed at bottom */}
      <div className="bg-white p-3 px-4 border-t fixed bottom-0 left-0 right-0 z-10 max-w-full shadow-md">
        <div className="relative">
           <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="请输入您想问的问题..."
            className="w-full rounded-full border border-gray-300 pl-4 pr-16 sm:pr-24 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
           {/* 按钮容器 - 使用弹性布局 */}
           <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-3">
             {/* 文件上传按钮 */}
             <button 
               className="text-gray-600 hover:text-blue-600 transition-colors"
               disabled={isLoading}
               onClick={() => document.getElementById('file-upload')?.click()}
             >
               <i className="fa-solid fa-file"></i>
             </button>
             
             {/* 隐藏的文件输入 */}
             <input
               id="file-upload"
               type="file"
               className="hidden"
               onChange={(e) => {
                 const file = e.target.files?.[0];
                 if (file) {
                   toast.info(`已选择文件: ${file.name}`);
                   // 这里可以添加文件上传逻辑
                   e.target.value = ''; // 重置文件输入，允许重复上传同一文件
                 }
               }}
             />
             
             {/* 语音输入按钮 */}
             <button 
               className="text-gray-600 hover:text-blue-600 transition-colors"
               disabled={isLoading}
             >
               <i className="fa-solid fa-microphone"></i>
             </button>
             
             {/* 发送按钮 */}
             <button 
               className="text-gray-600 hover:text-blue-600 transition-colors"
               disabled={isLoading || !input.trim()}
               onClick={handleSendMessage}
             >
               <i className="fa-solid fa-paper-plane"></i>
             </button>
           </div>
        </div>
        
{/* Copyright information */}
        <div className="text-center text-xs text-gray-500 mt-2">
          技术支持：由福州软件职业技术学院智慧校园规划与建设处提供
        </div>
      </div>
    </div>
  )
}