@echo off

:: 这个批处理文件用于启动福州软件职业技术学院AI招生系统

echo =====================================
echo 正在启动福州软件职业技术学院AI招生系统
echo =====================================
echo.

echo 当前目录: %cd%
echo.

echo 1. 检查是否安装了pnpm...
where pnpm >nul 2>nul
if errorlevel 1 (
echo 警告: 未找到pnpm，尝试使用npm代替
set package_manager=npm
) else (
echo 找到pnpm，将使用pnpm运行项目
set package_manager=pnpm
)

echo.
echo 2. 检查依赖是否已安装...
if not exist "node_modules" (
echo 未找到node_modules目录，建议先安装依赖
set /p choice=是否现在安装依赖? (y/n): 
if /i "%choice%"=="y" (
echo 正在安装依赖...
%package_manager% install
if errorlevel 1 (
echo 错误: 依赖安装失败！
pause
exit /b 1
)
)
)

echo.
echo 3. 正在启动开发服务器...
echo 服务器将在端口3303上运行

echo 命令: %package_manager% run dev
%package_manager% run dev

if errorlevel 1 (
echo.
echo 错误: 启动失败！
echo 可能的原因：
echo - 依赖包未正确安装

echo 请按任意键退出...
pause
exit /b 1
)