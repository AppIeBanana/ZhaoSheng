@echo off

rem 微信服务器验证服务启动脚本
rem 使用Node.js运行server.js，确保正确监听443端口

echo ================================================
echo        微信服务器验证服务启动脚本          
echo ================================================
echo 注意：在Windows系统上，监听443端口需要管理员权限
echo ================================================

rem 检查Node.js是否已安装
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo 错误：未找到Node.js。请先安装Node.js。
    pause
    exit /b 1
)

rem 显示Node.js版本
echo 检测到Node.js版本：
node -v
echo.

rem 设置工作目录为脚本所在目录
cd /d "%~dp0"

rem 设置环境变量
echo 设置环境变量...
set NODE_ENV=development

rem 启动服务器
echo 正在启动微信服务器验证服务...
echo 使用端口：443
echo 使用HTTPS协议
echo 请确保以管理员身份运行此脚本
echo ================================================

rem 运行服务器
node server.js

rem 捕获退出代码
if %errorlevel% neq 0 (
    echo.
    echo ================================================
    echo 错误：服务器启动失败，退出代码：%errorlevel%
    echo 请检查错误信息并尝试以下解决方案：
    echo 1. 确保以管理员身份运行此脚本
    echo 2. 确保443端口未被其他程序占用
    echo 3. 确保证书文件存在且权限正确
    echo ================================================
    pause
    exit /b %errorlevel%
)