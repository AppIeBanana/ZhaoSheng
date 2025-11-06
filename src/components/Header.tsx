import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  showBackButton?: boolean;
}

export default function Header({ showBackButton = true }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-sm py-2.5 px-4 border-b z-50 w-full">
      {showBackButton && (
        <button
          onClick={() => navigate(-1)}
          className="absolute left-4 p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="返回"
        >
          <i className="fa-solid fa-arrow-left text-gray-600"></i>
        </button>
      )}
      <div className="flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-sm font-medium text-gray-500">智能问答系统</h1>
          <div className="flex items-center justify-center mt-1">
            <span className="text-blue-600 font-semibold">
              福州软件职业技术学院AI招生
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}