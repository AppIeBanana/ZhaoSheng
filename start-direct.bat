@echo off

:: 这个批处理文件直接运行vite命令，绕过PowerShell执行策略限制
:: 适用于无法运行npm或pnpm脚本的环境

echo =====================================
echo 正在启动福州软件职业技术学院AI招生系统
echo (直接运行vite，绕过执行策略限制)
echo =====================================
echo.

:: 检查是否已安装依赖
echo 1. 检查node_modules是否存在...
if not exist "node_modules" (
echo 错误: 未找到node_modules目录！
echo 请先安装依赖：
echo 1. 打开命令提示符（以管理员身份运行）
echo 2. 运行：npm install
pause
exit /b 1
)

echo 依赖已存在，继续启动服务器...
echo.

echo 2. 正在启动开发服务器（端口3303）...
echo 请稍候，服务器正在初始化...

:: 直接运行vite命令
node_modules\.bin\vite --host --port 3303

if errorlevel 1 (
echo.
echo 错误: 服务器启动失败！
echo 请按任意键退出...
pause
exit /b 1
)