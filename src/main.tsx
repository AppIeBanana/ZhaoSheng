
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from 'sonner';
import App from "./App.tsx";
// import "./index.css";

// 添加适当的类型检查，避免使用非空断言
const container = document.getElementById("root");

if (!container) {
  throw new Error("Root element not found in the DOM");
}

// 在DOM加载完成后挂载应用
const root = createRoot(container);
root.render(
  <StrictMode>
    <App />
    <Toaster />
  </StrictMode>
);
