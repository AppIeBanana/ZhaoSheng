import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import InfoCollection from './pages/InfoCollection';
import QAPage from './pages/QAPage';
import { Empty } from './components/Empty';
import { UserProvider, useUserData } from './contexts/userContext';
import { toast } from 'sonner';

// 严格检查用户是否已完成信息收集
const hasCompletedInfoCollection = (userData: any): boolean => {
  // 至少需要包含手机号和其他关键信息字段
  return userData && 
         userData.phone && 
         (userData.examType || userData.userType || userData.province || 
          userData.score || userData.name);
};

// 检查用户访问权限的中间件组件
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData, isLoading } = useUserData();
  const [loadingTimeout, setLoadingTimeout] = React.useState(false);

  // 记录用户尝试访问的路径，便于后续重定向
  useEffect(() => {
    if (location.pathname !== '/' && location.pathname !== '/info-collection') {
      sessionStorage.setItem('redirectPath', location.pathname);
    }
  }, [location.pathname]);

  // 添加超时机制，防止无限加载
  React.useEffect(() => {
    // 设置5秒超时
    const timer = setTimeout(() => {
      console.log('ProtectedRoute - 加载超时，强制检查访问权限');
      setLoadingTimeout(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // 严格检查用户是否已完成信息收集
  useEffect(() => {
    // 只有当加载完成或超时后才进行权限检查
    if (!isLoading || loadingTimeout) {
      const completed = hasCompletedInfoCollection(userData);
      
      // 如果用户未完成信息收集，重定向到信息收集页面
      if (!completed && location.pathname === '/qa') {
        console.log('ProtectedRoute - 用户未完成信息收集，重定向到信息收集页面');
        toast.warning('请先完成个人信息收集才能使用问答功能');
        navigate('/info-collection', { replace: true });
      }
    }
  }, [userData, isLoading, loadingTimeout, navigate, location.pathname]);

  // 加载中状态显示加载提示
  if (isLoading && !loadingTimeout) {
    return (
      <div className="loading-container" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.2rem',
        color: '#666'
      }}>
        正在检查访问权限，请稍候...
      </div>
    );
  }

  // 只有完成信息收集的用户才能访问受保护的内容
  const isAuthorized = hasCompletedInfoCollection(userData);
  return isAuthorized ? children : null;
}

function RootRoute() {
  const { isLoading } = useUserData();
  const navigate = useNavigate();
  
  // 当用户访问根路径时，默认跳转到信息收集页面
  // 这样即使用户已有信息，也可以随时修改
  useEffect(() => {
    if (!isLoading) {
      // 使用setTimeout确保UI有时间更新
      setTimeout(() => {
        navigate('/info-collection', { replace: true });
      }, 100);
    }
  }, [isLoading, navigate]);
  
  // 始终显示加载界面，直到重定向完成
  return (
    <div className="loading-container" style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '1.2rem',
      color: '#666'
    }}>
      正在加载，请稍候...
    </div>
  );
}

function AppContent() {
  return (
    <Routes>
      <Route path="/" element={<RootRoute />} />
      <Route path="/info-collection" element={<InfoCollection />} />
      <Route path="/qa" element={<ProtectedRoute><QAPage /></ProtectedRoute>} />
      <Route path="*" element={<Empty />} />
    </Routes>
  );
}

function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

export default App;
