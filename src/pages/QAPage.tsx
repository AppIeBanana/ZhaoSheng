import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudentData } from '@/contexts/studentContext.tsx';
import { Message, sendMessageToAPIStream } from '@/lib/api';
import { toast } from 'sonner';
import { questionCategories, questionsByCategory, getRandomQuestions } from '@/data/questionsData';

export default function QAPage() {
  const navigate = useNavigate();
  const { studentData } = useStudentData();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);
  const [displayedQuestions, setDisplayedQuestions] = useState<string[]>(
    getRandomQuestions(questionsByCategory[0], 5)
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [lastUpdatedMessageId, setLastUpdatedMessageId] = useState<string | null>(null);
  
  // Check if student data exists, redirect if not
  useEffect(() => {
    if (!studentData) {
      toast.error("请先填写学生信息");
      navigate('/');
    } else {
      // Add welcome message
      setMessages([{
        id: 'welcome',
content: `Hi~ 我是福软小X\n非常高兴认识您。您有哪些想咨询的问题呢？`,
        sender: 'bot',
        timestamp: new Date()
      }]);
    }
  }, [studentData, navigate]);
  
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
      // Get streaming bot response
      const stream = sendMessageToAPIStream(userMessage.content, studentData);
      let fullContent = '';
      
      // Iterate over each chunk in the stream
      for await (const chunk of stream) {
        fullContent += chunk;
        
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
    } catch (error) {
      // Update message with error information
      setMessages(prev => 
        prev.map(msg => 
          msg.id === botMessageId 
            ? { ...msg, content: '抱歉，获取回答时出现问题。请稍后重试。' } 
            : msg
        )
      );
      console.error("API error:", error);
    } finally {
      setIsLoading(false);
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
          <div className="w-8"></div> {/* Placeholder for alignment */}
        </div>
      </header>
      
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
          <div className="space-y-6">
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
                <div className={`max-w-[80%] ${message.sender === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
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
      <div className="bg-white p-3 border-t fixed bottom-0 left-0 right-0 z-10 max-w-full">
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
               className="text-gray-400 hover:text-blue-600 transition-colors"
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
               className="text-gray-400 hover:text-blue-600 transition-colors"
               disabled={isLoading}
             >
               <i className="fa-solid fa-microphone"></i>
             </button>
             
             {/* 发送按钮 */}
             <button 
               className="text-gray-400 hover:text-blue-600 transition-colors"
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