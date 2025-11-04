import { useState, useRef } from 'react';
import { toast } from 'sonner';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
  onFileSelect?: (file: File) => void;
  onVoiceStart?: () => void;
  onVoiceStop?: () => void;
}

export default function ChatInput({
  value,
  onChange,
  onSend,
  isLoading,
  onFileSelect,
  onVoiceStart,
  onVoiceStop
}: ChatInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // 处理文件上传点击
  const handleFileUploadClick = () => {
    if (!isLoading) {
      fileInputRef.current?.click();
    }
  };

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast.info(`已选择文件: ${file.name}`);
      onFileSelect?.(file);
      // 重置文件输入，允许重复上传同一文件
      e.target.value = '';
    }
  };

  // 处理语音输入点击
  const handleVoiceClick = () => {
    if (isLoading) return;

    if (isRecording) {
      // 停止录音
      setIsRecording(false);
      onVoiceStop?.();
    } else {
      // 开始录音
      setIsRecording(true);
      onVoiceStart?.();
    }
  };

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
          {/* 文件上传按钮 */}
          <button
            className="text-gray-400 hover:text-blue-600 transition-colors p-1"
            disabled={isLoading}
            onClick={handleFileUploadClick}
            aria-label="上传文件"
            aria-disabled={isLoading}
          >
            <i className="fa-solid fa-file"></i>
          </button>

          {/* 隐藏的文件输入 */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            disabled={isLoading}
          />

          {/* 语音输入按钮 */}
          <button
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
          </button>

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