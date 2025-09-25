import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudentData } from '@/contexts/studentContext.tsx';
import { Message, sendMessageToAPIStream } from '@/lib/api';
import { toast } from 'sonner';

// Question categories and more questions for "Change batch" functionality
// 问题类型定义
const questionCategories = [
  "招生政策", "新生报到", "志愿填报", "校园生活", "奖助政策", "升学就业", "新高考", "其他问题"
];

// 问题库 - 每个类型包含20个问题
const questionsByCategory = [
  // 0: 招生政策
  [
    "贵校的招生计划是多少？",
    "今年的录取分数线预计是多少？",
    "有哪些特色专业？",
    "学校的录取规则是什么？",
    "是否承认加分政策？",
    "专业级差如何设置？",
    "对单科成绩有要求吗？",
    "艺术类专业的录取标准是什么？",
    "体育特长生有什么录取政策？",
    "校企合作专业有哪些？",
    "中外合作办学项目介绍？",
    "转专业政策是什么？",
    "第二学士学位如何申请？",
    "大类招生如何分流？",
    "录取通知书何时发放？",
    "如何查询录取结果？",
    "退档的主要原因有哪些？",
    "预科班的招生政策是什么？",
    "学校的招生咨询方式有哪些？",
    "能否介绍一下近年的就业情况？"
  ],
  // 1: 新生报到
  [
    "新生报到时间是什么时候？",
    "报到需要准备哪些材料？",
    "可以提前报到吗？",
    "学校有接站服务吗？",
    "报到流程是怎样的？",
    "档案如何转递？",
    "党团组织关系如何转接？",
    "户口迁移需要注意什么？",
    "住宿安排是怎样的？",
    "床上用品需要自带吗？",
    "如何缴纳学费？",
    "校园卡如何办理？",
    "报到后何时开始军训？",
    "军训有哪些注意事项？",
    "新生入学教育内容是什么？",
    "因故不能按时报到怎么办？",
    "家长可以进入校园吗？",
    "学校周边交通情况如何？",
    "报到期间食堂开放吗？",
    "新生绿色通道如何申请？"
  ],
  // 2: 志愿填报
  [
    "如何提高录取几率？",
    "平行志愿如何填报？",
    "专业服从调剂是什么意思？",
    "贵校的志愿填报代码是多少？",
    "填报志愿需要注意什么？",
    "各专业的选考科目要求？",
    "志愿填报截止时间是什么时候？",
    "可以填报多少个专业志愿？",
    "征集志愿的机会有几次？",
    "如何理解专业级差？",
    "高分考生会被退档吗？",
    "志愿填报系统如何操作？",
    "填报后可以修改吗？",
    "如何参考往年录取数据？",
    "专业和学校哪个更重要？",
    "冷门专业有机会转专业吗？",
    "志愿填报有哪些常见误区？",
    "服从调剂会调到中外合作专业吗？",
    "地方专项计划如何报考？",
    "高校专项计划的条件是什么？"
  ],
  // 3: 校园生活
  [
    "学校宿舍条件怎么样？",
    "校园内有哪些餐饮设施？",
    "学校有哪些学生社团？",
    "校园安全措施如何？",
    "校内交通方便吗？",
    "宿舍是几人间？",
    "宿舍有独立卫生间吗？",
    "宿舍有空调和暖气吗？",
    "食堂的消费水平如何？",
    "有清真食堂吗？",
    "校园内有便利店吗？",
    "图书馆开放时间？",
    "校内有健身房吗？",
    "校医院的服务时间？",
    "校园网如何办理？",
    "宿舍用电有功率限制吗？",
    "可以在校外租房住吗？",
    "校园内有ATM机吗？",
    "学校的快递点在哪里？",
    "校园内可以骑电动车吗？"
  ],
  // 4: 奖助政策
  [
    "学校有哪些奖学金？",
    "国家奖学金的金额是多少？",
    "助学金申请条件是什么？",
    "勤工助学岗位如何申请？",
    "助学贷款如何办理？",
    "奖学金的评定标准是什么？",
    "助学金的发放时间？",
    "是否有临时困难补助？",
    "绿色通道的具体政策？",
    "企业奖学金有哪些？",
    "获奖学金对成绩有什么要求？",
    "可以同时获得多个奖学金吗？",
    "奖学金如何申请？",
    "助学贷款的还款期限？",
    "家庭经济困难证明如何开具？",
    "研究生奖学金政策？",
    "退役士兵有什么资助政策？",
    "少数民族学生有额外资助吗？",
    "奖学金的评审流程是什么？",
    "国家励志奖学金的申请条件？"
  ],
  // 5: 升学就业
  [
    "学校的就业率如何？",
    "主要就业方向有哪些？",
    "有哪些合作企业？",
    "学校提供就业指导吗？",
    "校园招聘会什么时候举行？",
    "考研氛围怎么样？",
    "有考研辅导班吗？",
    "保研的条件是什么？",
    "出国留学的机会多吗？",
    "学校有哪些国际交流项目？",
    "毕业生平均薪资是多少？",
    "创业支持政策有哪些？",
    "就业信息如何获取？",
    "学校会安排实习吗？",
    "职业规划课程有哪些？",
    "考公考研的比例是多少？",
    "就业质量报告在哪里查看？",
    "对毕业生有跟踪服务吗？",
    "校企合作的实习机会多吗？",
    "如何申请学校的就业推荐表？"
  ],
  // 6: 新高考
  [
    "新高考改革对录取有什么影响？",
    "选考科目要求是什么？",
    "专业组如何设置？",
    "赋分制如何计算？",
    "综合素质评价重要吗？",
    "新高考下如何填报志愿？",
    "专业服从调剂范围是什么？",
    "与传统高考有什么区别？",
    "选考科目可以更换吗？",
    "三位一体招生政策？",
    "强基计划如何报考？",
    "综合素质档案如何准备？",
    "新高考录取规则是什么？",
    "专业平行志愿是什么意思？",
    "高考改革后的教学有何变化？",
    "选考科目与专业的关系？",
    "新高考下如何进行生涯规划？",
    "外语可以考几次？",
    "学业水平考试重要吗？",
    "新高考对学生有什么挑战？"
  ],
  // 7: 其他问题
  [
    "学校的地理位置怎么样？",
    "校园环境如何？",
    "学校的师资力量如何？",
    "图书馆的藏书量有多少？",
    "学校的占地面积是多少？",
    "有几个校区？",
    "各校区之间有校车吗？",
    "学校的历史沿革？",
    "校园内有哪些标志性建筑？",
    "学校的校训是什么？",
    "有哪些知名校友？",
    "学校的科研实力如何？",
    "能否介绍一下学校的排名情况？",
    "校园文化有什么特色？",
    "学校的办学定位是什么？",
    "国际交流项目有哪些？",
    "学校的收费标准如何？",
    "有哪些知名教授？",
    "学校的发展规划是什么？",
    "如何联系招生办公室？"
  ]
];

// 从数组中随机选择n个不重复的元素
const getRandomQuestions = (questions: string[], count: number): string[] => {
  // 创建数组的副本并打乱顺序
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  // 返回前count个元素
  return shuffled.slice(0, count);
};

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
                <img 
                  src="https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=cartoon%20female%20teacher%20avatar%2C%20friendly%20expression%2C%20blue%20background&sign=153bfaa46621c73e80628e542f1f3354" 
                  alt="AI Assistant" 
                  className="w-10 h-10 rounded-full mr-2 object-cover flex-shrink-0"
                />
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