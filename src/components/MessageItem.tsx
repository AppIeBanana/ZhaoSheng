import { Message } from '@/lib/coze_api';

interface MessageItemProps {
  message: Message;
  isLoading?: boolean;
  onVoiceClick?: (message: Message) => void;
  onThumbsUpClick?: (message: Message) => void;
  onThumbsDownClick?: (message: Message) => void;
}

export default function MessageItem({
  message,
  isLoading = false,
  onVoiceClick,
  onThumbsUpClick,
  onThumbsDownClick
}: MessageItemProps) {
  // 格式化时间
  const formatTime = (timestamp: Date | string): string => {
    if (!timestamp) return '';
    
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    
    // 检查是否是有效的Date对象
    if (isNaN(date.getTime())) return '';
    
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 渲染加载指示器
  const renderLoadingIndicator = () => (
    <div className="flex space-x-2">
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
    </div>
  );

  // 渲染消息操作按钮
  const renderMessageActions = () => {
    if (message.sender !== 'bot' || (message.id?.includes('welcome') ?? false)) return null;

    return (
      <div className="flex justify-end mt-2 space-x-2.5">
        <button 
          className="text-gray-400 hover:text-gray-600 transition-colors"
          onClick={() => onVoiceClick?.(message)}
          aria-label="朗读消息"
        >
          <i className="fa-solid fa-volume-up"></i>
        </button>
        <button 
          className="text-gray-400 hover:text-green-500 transition-colors"
          onClick={() => onThumbsUpClick?.(message)}
          aria-label="点赞"
        >
          <i className="fa-solid fa-thumbs-up"></i>
        </button>
        <button 
          className="text-gray-400 hover:text-red-500 transition-colors"
          onClick={() => onThumbsDownClick?.(message)}
          aria-label="点踩"
        >
          <i className="fa-solid fa-thumbs-down"></i>
        </button>
      </div>
    );
  };

  // 将文本中的URL转换为可点击链接或图片
  const formatMessageContent = (content: string) => {
    if (!content) return '';
    
    // 匹配常见URL格式的正则表达式
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    // 替换URL为可点击的链接或图片
    const formattedContent = content.replace(
      urlRegex,
      (match) => {
        // 判断是否为图片URL
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
        const isImage = imageExtensions.some(ext => 
          match.toLowerCase().includes(ext) || 
          // 对于可能没有扩展名但包含image相关参数的URL
          match.includes('image=') || 
          match.includes('img=') ||
          // 匹配oceancloudapi.com等可能返回图片的API
          match.includes('oceancloudapi.com')
        );
        
        if (isImage) {
          // 返回图片标签
          return `<img src="${match}" alt="图片" class="max-w-full h-auto rounded-lg my-2" loading="lazy" />`;
        } else {
          // 返回普通链接
          return `<a href="${match}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:text-blue-700 underline break-all">${match}</a>`;
        }
      }
    );
    
    return formattedContent;
  };

  const isBotMessage = message.sender === 'bot';
  const isWelcomeMessage = message.id?.includes('welcome') || false;

  return (
    <div 
      className={`flex ${isBotMessage ? 'justify-start' : 'justify-end'} mb-4`}
      data-testid={`message-${message.id}`}
    >
      {isBotMessage && (
        <img
          src="/imgs/小象.png"
          alt="AI Assistant"
          className="w-10 h-10 md:w-12 md:h-12 rounded-full mr-2 object-cover flex-shrink-0"
          aria-hidden="true"
        />
      )}
      
      <div className={`${isBotMessage ? 'max-w-[80%] sm:max-w-[65%] md:max-w-[60%] items-start' : 'max-w-[90%] sm:max-w-[80%] md:max-w-[70%] items-end'} flex flex-col`}>
        <div
          className={`
            rounded-2xl p-4 shadow-sm relative word-break-all overflow-hidden break-all
            ${isBotMessage ? 'bg-white text-gray-800 rounded-tl-none border border-gray-100' : 'bg-blue-600 text-white rounded-tr-none'}
          `}
        >
          {isLoading && message.sender === 'bot' && message.content === '' ? (
            renderLoadingIndicator()
          ) : (
            <div className="whitespace-pre-line word-break-all text-sm leading-relaxed" 
                 dangerouslySetInnerHTML={{ __html: formatMessageContent(message.content) }}>
            </div>
          )}
          
          {renderMessageActions()}
        </div>

        {/* 时间戳 - 欢迎消息不显示时间 */}
        {!isWelcomeMessage && (
          <span
            className={`text-xs mt-1 ${isBotMessage ? 'self-start' : 'self-end'} text-gray-400`}
          >
            {formatTime(message.timestamp)}
          </span>
        )}
      </div>
    </div>
  );
}