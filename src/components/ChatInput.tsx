interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
}

export default function ChatInput({
  value,
  onChange,
  onSend,
  isLoading
}: ChatInputProps) {
  // 文件上传引用暂时保留，以备将来需要恢复功能

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 处理发送
  const handleSend = () => {
    if (!isLoading && value.trim()) {
      onSend();
    }
  };

  // 已删除未使用的文件上传和语音输入相关函数

  return (
    <div className="bg-white p-2 border-t fixed bottom-0 left-0 right-0 z-10 max-w-full pb-[env(safe-area-inset-bottom)]">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="请输入您想问的问题..."
          className="w-full rounded-full border border-gray-300 pl-3 pr-[4rem] py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[40px] max-h-[80px] overflow-y-auto text-sm"
          disabled={isLoading}
          aria-disabled={isLoading}
          aria-label="输入问题"
        />
        
        {/* 按钮容器 */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-2">
          {/* 文件上传按钮 - 已注释 */}
          {/* <button
            className="text-gray-400 hover:text-blue-600 transition-colors p-1"
            disabled={isLoading}
            onClick={handleFileUploadClick}
            aria-label="上传文件"
            aria-disabled={isLoading}
          >
            <i className="fa-solid fa-file"></i>
          </button>

          {/* 隐藏的文件输入 - 已注释 */}
          {/* <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            disabled={isLoading}
          /> */}

          {/* 语音输入按钮 - 已注释 */}
          {/* <button
            className={`p-1 transition-colors ${isRecording ? 'text-red-500' : 'text-gray-400 hover:text-blue-600'}`}
            disabled={isLoading}
            onClick={handleVoiceClick}
            aria-label={isRecording ? "停止录音" : "开始录音"}
            aria-disabled={isLoading}
          >
            {isRecording ? (
              <i className="fa-solid fa-circle"></i>
            ) : (
              <i className="fa-solid fa-microphone"></i>
            )}
          </button> */}

          {/* 发送按钮 */}
          <button
            className={`p-1 transition-colors ${(!isLoading && value.trim()) ? 'text-blue-600' : 'text-gray-400'}`}
            disabled={isLoading || !value.trim()}
            onClick={handleSend}
            aria-label="发送消息"
            aria-disabled={isLoading || !value.trim()}
          >
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </div>
      </div>
      
      {/* 版权信息 */}
      <div className="text-center text-xs text-gray-500 mt-1">
        技术支持：由福州软件职业技术学院智慧校园规划与建设处提供
      </div>
    </div>
  );
}