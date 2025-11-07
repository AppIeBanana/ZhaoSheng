import { useNavigate } from 'react-router-dom';

interface QAHeaderProps {
  showBackButton?: boolean;
}

export default function QAHeader({ showBackButton = true }: QAHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="py-3 px-4 w-full relative bg-white shadow-sm">
      {showBackButton && (
        <button
          onClick={() => navigate(-1)}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="返回"
        >
          <i className="fa-solid fa-arrow-left text-gray-600"></i>
        </button>
      )}
      <h1 className="text-blue-600 font-semibold text-lg text-center">
        智能问答
      </h1>
    </div>
  );
}