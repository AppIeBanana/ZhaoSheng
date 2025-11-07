import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  showBackButton?: boolean;
}

export default function Header({ showBackButton = true }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="py-2.5 px-4 w-full relative text-center">
      {showBackButton && (
        <button
          onClick={() => navigate(-1)}
          className="absolute left-4 p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="返回"
        >
          <i className="fa-solid fa-arrow-left text-gray-600"></i>
        </button>
      )}
      <img 
        src="../imgs/校徽.png" 
        alt="校徽" 
        className="w-[15vw] h-auto mb-2 mx-auto" 
      />
      <span className="text-blue-600 font-semibold text-lg block mt-1">
        福州软件职业技术学院AI招生
      </span>
      <span className="text-gray-500 text-xs block mt-2">
        请填写以下信息，以便于我们为您提供个性化的问答服务
      </span>
    </header>
  );
}