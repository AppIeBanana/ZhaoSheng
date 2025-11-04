import { useState } from 'react';
import { toast } from 'sonner';
import { questionCategories, questionsByCategory, getRandomQuestions } from '@/data/questionsData';

interface PredefinedQuestionsProps {
  onQuestionSelect: (question: string) => void;
}

export default function PredefinedQuestions({ onQuestionSelect }: PredefinedQuestionsProps) {
  const [activeCategory, setActiveCategory] = useState(0);
  const [displayedQuestions, setDisplayedQuestions] = useState(
    getRandomQuestions(questionsByCategory[0], 5)
  );

  // 切换问题分类
  const handleCategoryChange = (index: number) => {
    setActiveCategory(index);
    // 从当前分类获取新的随机问题
    setDisplayedQuestions(getRandomQuestions(questionsByCategory[index], 5));
  };

  // 更换推荐问题
  const handleChangeQuestions = () => {
    // 从当前分类重新随机选择5个问题
    const newQuestions = getRandomQuestions(questionsByCategory[activeCategory], 5);
    setDisplayedQuestions(newQuestions);
    
    // 显示更新提示
    toast.info('已为您更新推荐问题');
  };

  // 处理预设问题点击
  const handleQuestionClick = (question: string) => {
    onQuestionSelect(question);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm mx-2 sm:mx-4 mt-4 mb-6 p-4">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mr-2">
            <i className="fa-solid fa-question text-blue-600 text-xs"></i>
          </div>
          <h3 className="font-medium text-gray-800">猜你想问</h3>
        </div>
        <button
          onClick={handleChangeQuestions}
          className="text-blue-600 text-sm flex items-center hover:underline transition-colors"
          aria-label="换一批问题"
        >
          <i className="fa-solid fa-sync-alt mr-1"></i>换一批
        </button>
      </div>

      {/* 分类标签栏 */}
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
            aria-pressed={activeCategory === index}
          >
            {category}
          </button>
        ))}
      </div>

      {/* 问题列表 */}
      <div className="space-y-2">
        {displayedQuestions.map((question, index) => (
          <button
            key={index}
            onClick={() => handleQuestionClick(question)}
            className="w-full text-left bg-blue-50 rounded-xl p-2.5 text-gray-700 hover:bg-blue-100 transition-colors flex justify-between items-center"
            aria-label={`选择问题: ${question}`}
          >
            <span>{question}</span>
            <i className="fa-solid fa-angle-right text-gray-400"></i>
          </button>
        ))}
      </div>
    </div>
  );
}