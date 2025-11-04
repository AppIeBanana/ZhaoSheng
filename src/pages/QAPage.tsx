import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserData } from "@/contexts/userContext.tsx";
import { sendMessageToAPIStream } from "@/lib/coze_api";
import { toast } from "sonner";
import MessageItem from "../components/MessageItem";
import ChatInput from "../components/ChatInput";
import PredefinedQuestions from "../components/PredefinedQuestions";
import useChatHistory from "../hooks/useChatHistory";
import { setCurrentPhone } from "@/lib/storageService";

export default function QAPage() {
  const navigate = useNavigate();
  const { userData } = useUserData();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');
  
  // 使用自定义Hook管理聊天历史
  const {
    messages,
    isLoadingHistory,
    addUserMessage,
    addInitialBotMessage,
    updateBotMessage,
    lastUpdatedMessageId
  } = useChatHistory();

  // 聊天历史保存逻辑已在useChatHistory Hook中实现

  // 加载聊天记录的逻辑已在useChatHistory Hook中实现
  
  // 检查学生数据
  useEffect(() => {
    if (!userData) {
      toast.error("请先填写学生信息");
      navigate("/");
    } else if (userData?.phone) {
      // 确保手机号已保存到sessionStorage
      setCurrentPhone(userData.phone);
    }
  }, [userData, navigate]);
  
  // 注意：聊天记录的加载逻辑已在useChatHistory钩子内部处理

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, lastUpdatedMessageId]);

  // 处理输入变化
  const handleInputChange = (value: string) => {
    setInputValue(value);
  };
  
  // 核心消息发送函数
  const sendQuestion = async (content: string) => {
    console.log('sendQuestion called with:', content);
    if (!content || isLoadingHistory) {
      console.log('Message sending skipped: content empty or loading history');
      return;
    }
    
    // 添加用户消息
    addUserMessage(content);
    // 创建机器人初始消息并获取ID
    const botMessageId = addInitialBotMessage();
    console.log('Bot message ID created:', botMessageId);

    try {
      // 安全检查userData
      if (!userData) {
        throw new Error("学生数据未找到，请先填写学生信息");
      }

      console.log('Calling API with user data:', !!userData);
      // 获取流式机器人响应
      const stream = await sendMessageToAPIStream(content, userData);
      let fullContent = "";

      // 处理流中的每个数据块
      for await (const chunk of stream) {
        fullContent += chunk;
        // 更新机器人消息
        updateBotMessage(botMessageId, fullContent);
        console.log('Received chunk, updated message content');
      }
    } catch (error) {
      console.error("API error in sendQuestion:", error);
      // 更新消息为错误信息
      updateBotMessage(botMessageId, "抱歉，获取回答时出现问题。请稍后重试。");
    }
  };

  // 处理发送消息（从输入框）
  const handleSendMessage = () => {
    const content = inputValue.trim();
    if (!content || isLoadingHistory) return;
    
    // 清空输入框
    setInputValue('');
    
    // 调用核心发送函数
    sendQuestion(content);
  };

  // 处理预定义问题点击
  const handlePredefinedQuestion = (question: string) => {
    // 直接调用核心发送函数，不设置输入框内容
    sendQuestion(question);
  };

  return (
    <div className="flex flex-col min-h-screen bg-blue-50 overflow-x-hidden">
      {/* Header with school branding */}
      <header className="bg-white shadow-sm py-2.5 px-4 border-b sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <i className="fa-solid fa-arrow-left text-gray-600"></i>
          </button>
          <div className="text-center">
            <h1 className="text-sm font-medium text-gray-500">智能问答系统</h1>
            <div className="flex items-center justify-center mt-1">
              <span className="text-blue-600 font-semibold">
                福州软件职业技术学院AI招生
              </span>
              {/* <i className="fa-solid fa-home ml-2 text-gray-400"></i> */}
          {/* <i className="fa-solid fa-bars ml-3 text-gray-400"></i> */}
            </div>
          </div>
          <div className="w-8"></div> {/* Placeholder for alignment */}
        </div>
      </header>

      {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto pb-40">
          {/* 猜你想问部分 - 使用组件 */}
          <PredefinedQuestions onQuestionSelect={handlePredefinedQuestion} />

        {/* Messages Container - Now part of the main scrollable content */}
        <div className="mx-4 space-y-6">
          {/* Messages */}
          <div className="space-y-6">
            {/* Historical records separator */}
            {messages.length > 1 && (
              <div className="flex items-center justify-center my-4">
                <div className="h-px bg-gray-200 flex-1"></div>
                <span className="px-3 text-xs text-gray-400">
                  以上是历史记录
                </span>
                <div className="h-px bg-gray-200 flex-1"></div>
              </div>
            )}

            {messages.map((message) => (
              <MessageItem 
                key={message.id} 
                message={message} 
                isLoading={message.id.includes("bot-") && message.content === ""} 
              />
            ))}

            {/* Loading indicator */}
            {isLoadingHistory && <div className="flex items-start"></div>}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input Area - Fixed at bottom - 使用组件 */}
      <ChatInput 
        value={inputValue} 
        onChange={handleInputChange} 
        onSend={handleSendMessage} 
        isLoading={isLoadingHistory} 
      />
    </div>
  );
}
