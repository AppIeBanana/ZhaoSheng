// 已移除未使用的React和Route导入
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import InfoCollection from '@/pages/InfoCollection';
import QAPage from '@/pages/QAPage';
import { StudentProvider } from '@/contexts/studentContext.tsx';

// 使用createBrowserRouter API创建路由配置
const router = createBrowserRouter([
  {
    path: '/',
    element: <InfoCollection />,
  },
  {
    path: '/qa',
    element: <QAPage />,
  },
]);

export default function App() {
  return (
    <StudentProvider>
      <RouterProvider router={router} />
    </StudentProvider>
  );
}
