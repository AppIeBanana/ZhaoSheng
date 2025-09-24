import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudentData } from '@/contexts/studentContext.tsx';
import { Message, sendMessageToAPI, predefinedQuestions } from '@/lib/api';
import { toast } from 'sonner';

// Question categories and more questions for "Change batch" functionality
const questionCategories = [
  "招生政策", "新生报到", "志愿填报", "专业咨询", "升学就业", "校园生活", "奖助政策", "其他问题"
];

const moreQuestions = [
  // 招生政策
  ["转专业政策", "分数相同的考生，会优先录取谁？", "学校学费标准", "如何查看你校招生章程？", "学校的专业级差是多少？", "学校各专业的录取分数线是多少？", "学校有哪些特色专业？", "学校的招生计划是如何制定的？", "艺术类专业的录取规则是什么？", "高水平运动员的招生政策是什么？"],
  // 新生报到
  ["如何报名新生报到？", "新生报到需要注意什么？", "新生报到的时间是多少？", "新生报到的费用是多少？", "如何查看新生报到结果？", "报到地点在哪里？", "是否可以提前到校？", "需要准备哪些证件和材料？", "档案和党团组织关系如何转移？", "家庭经济困难学生如何申请绿色通道？"],
  // 志愿填报
  ["如何提高录取几率？", "平行志愿如何填报？", "专业服从调剂是什么意思？", "贵校的志愿填报代码是多少？", "填报志愿需要注意什么？", "学校往年的录取情况如何？", "专业之间的分数差距大吗？", "是否有专业志愿清的录取规则？", "填报顺序对录取有影响吗？", "征集志愿的机会有多少？"],
  // 专业咨询
  ["专业咨询的时间是多少？", "专业咨询的费用是多少？", "专业咨询的方式有哪些？", "专业咨询的内容有哪些？", "专业咨询需要注意什么？", "如何预约专业导师咨询？", "各专业的课程设置是怎样的？", "专业的就业方向有哪些？", "是否有专业介绍会或开放日？", "转专业的具体流程是什么？"],
  // 升学就业
  ["学校的就业政策是怎么样的？", "学校的就业岗位有哪些？", "如何申请学校的就业岗位？", "学校的就业岗位的薪资水平是多少？", "学校的就业岗位的工作内容是怎么样的？", "学校的就业率是多少？", "就业指导中心提供哪些服务？", "校企合作的单位有哪些？", "毕业生主要去向是什么？", "考研和留学的支持政策有哪些？"],
  // 校园生活
  ["学校宿舍条件怎么样？", "校园内有哪些餐饮设施？", "学校有哪些学生社团？", "校园安全措施如何？", "校内交通方便吗？", "校园环境如何？", "图书馆的开放时间和资源情况？", "体育设施有哪些？", "校园网络覆盖情况如何？", "校园周边有哪些生活设施？"],
  // 奖助政策
  ["学校有哪些奖学金？", "助学金申请条件是什么？", "勤工助学岗位如何申请？", "助学贷款如何办理？", "成绩优异者有额外奖励吗？", "奖学金的评选标准是什么？", "助学金的发放金额是多少？", "是否有针对家庭经济困难学生的特殊政策？", "国际交流奖学金如何申请？", "创新创业奖学金的设立情况？"],
  // 其他问题
  ["学校的就业率如何？", "有哪些国际交流项目？", "学校的地理位置怎么样？", "校园环境如何？", "学校的师资力量如何？", "学校的办学特色是什么？", "学校的科研实力如何？", "学校的办学层次是什么？", "是否接受专升本学生？", "学校的发展规划是什么？"]
];

export default function QAPage() {
  const navigate = useNavigate();
  const { studentData } = useStudentData();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);
  const [displayedQuestions, setDisplayedQuestions] = useState<string[]>(moreQuestions[0].slice(0, 5));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Check if student data exists, redirect if not
  useEffect(() => {
    if (!studentData) {
      toast.error("请先填写学生信息");
      navigate('/');
    } else {
      // Add welcome message
      setMessages([{
        id: 'welcome',
        content: `Hi~ 我是福软XX\n非常高兴认识您。您有哪些想咨询的问题呢?`,
        sender: 'bot',
        timestamp: new Date()
      }]);
    }
  }, [studentData, navigate]);
  
  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: input.trim(),
      sender: 'user',
      timestamp: new Date()
    };
    
    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Get bot response
      const botResponse = await sendMessageToAPI(userMessage.content, studentData);
      
      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        content: botResponse,
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      toast.error("获取回复失败，请重试");
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
    // Get the current category questions
    const categoryQuestions = moreQuestions[activeCategory];
    // Get the next batch of 5 questions (or start from beginning if at end)
    const currentQuestions = displayedQuestions;
    const currentIndex = categoryQuestions.findIndex(q => q === currentQuestions[0]);
    const nextIndex = (currentIndex + 5) % categoryQuestions.length;
    
    let nextBatch;
    if (nextIndex + 5 <= categoryQuestions.length) {
      nextBatch = categoryQuestions.slice(nextIndex, nextIndex + 5);
    } else {
      // If not enough questions to make a full batch, wrap around to beginning
      nextBatch = [
        ...categoryQuestions.slice(nextIndex),
        ...categoryQuestions.slice(0, 5 - (categoryQuestions.length - nextIndex))
      ];
    }
    
    setDisplayedQuestions(nextBatch);
    
    // Show toast message
    toast.info("已为您更新推荐问题");
  };
  
  // Change question category
  const handleCategoryChange = (index: number) => {
    setActiveCategory(index);
    // Only show first 5 questions of the selected category
    setDisplayedQuestions(moreQuestions[index].slice(0, 5));
  };
  
  return (
    <div className="flex flex-col h-screen bg-blue-50">
      {/* Header with school branding */}
      <header className="bg-white shadow-sm py-3 px-4 border-b">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <i className="fa-solid fa-arrow-left text-gray-600"></i>
          </button>
          <div className="text-center">
            <h1 className="text-sm font-medium text-gray-500">问答页 - 智能问答系统</h1>
            <div className="flex items-center justify-center mt-1">
              <span className="text-blue-600 font-semibold">福州外语外贸学院AI招生</span>
              <i className="fa-solid fa-home ml-2 text-gray-400"></i>
              <i className="fa-solid fa-bars ml-3 text-gray-400"></i>
            </div>
          </div>
          <div className="w-8"></div> {/* Placeholder for alignment */}
        </div>
      </header>
      
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
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
          
          {messages.map((message, index) => (
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
                  <p className="whitespace-pre-line">{message.content}</p>
                  
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
              <img 
                src="https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=cartoon%20female%20teacher%20avatar%2C%20friendly%20expression%2C%20blue%20background&sign=153bfaa46621c73e80628e542f1f3354" 
                alt="AI Assistant" 
                className="w-10 h-10 rounded-full mr-2 object-cover flex-shrink-0"
              />
              <div className="bg-white rounded-2xl p-4 shadow-sm rounded-tl-none border border-gray-100 max-w-[80%]">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
                </div>
              </div>
            </div>
          )}
          
          {/* "Guess You Want to Ask" Section */}
          {(messages.length <= 1 || isLoading) && (
            <div className="bg-white rounded-2xl p-4 shadow-sm mt-6">
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
          )}
          
          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Input Area */}
      <div className="bg-white p-3 border-t fixed bottom-0 left-0 right-0">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="请输入您想问的问题..."
            className="w-full rounded-full border border-gray-300 pl-4 pr-14 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          {/* 文件上传按钮 */}
          <button 
            className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
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
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
            disabled={isLoading}
          >
            <i className="fa-solid fa-microphone"></i>
          </button>
        </div>
        
        {/* Copyright information */}
        <div className="text-center text-xs text-gray-500 mt-2">
          版权所有: 中教智网（北京）信息技术有限公司
        </div>
      </div>
    </div>
  );
}