import { Routes, Route } from "react-router-dom";
import InfoCollection from "@/pages/InfoCollection";
import QAPage from "@/pages/QAPage";
import { StudentProvider } from '@/contexts/studentContext.tsx';

export default function App() {
  return (
    <StudentProvider>
      <Routes>
        <Route path="/" element={<InfoCollection />} />
        <Route path="/qa" element={<QAPage />} />
      </Routes>
    </StudentProvider>
  );
}
