#!/bin/bash

# 微信服务器验证服务启动脚本
# 使用Node.js运行server.js，确保正确监听443端口

echo "==============================================="
echo "        微信服务器验证服务启动脚本          "
echo "==============================================="
echo "注意：在Linux/Mac系统上，监听443端口需要root权限"
echo "建议使用 sudo 运行此脚本"
echo "==============================================="

# 检查Node.js是否已安装
if ! command -v node &> /dev/null; then
    echo "错误：未找到Node.js。请先安装Node.js。"
    exit 1
fi

# 显示Node.js版本
echo "检测到Node.js版本："
node -v
echo

# 设置工作目录为脚本所在目录
cd "$(dirname "$0")"

# 设置环境变量
echo "设置环境变量..."
export NODE_ENV=development

# 检查是否有root权限
if [ "$(id -u)" -ne 0 ]; then
    echo "警告：未使用root权限运行，监听443端口可能会失败"
    echo "建议使用 'sudo ./start-wechat-server.sh' 运行此脚本"
    echo "是否继续？(y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 启动服务器
echo "正在启动微信服务器验证服务..."
echo "使用端口：443"
echo "使用HTTPS协议"
echo "==============================================="

# 运行服务器
node server.js

# 捕获退出代码
exit_code=$?
if [ $exit_code -ne 0 ]; then
    echo
    echo "==============================================="
    echo "错误：服务器启动失败，退出代码：$exit_code"
    echo "请检查错误信息并尝试以下解决方案："
    echo "1. 确保使用 sudo 运行此脚本"
    echo "2. 确保443端口未被其他程序占用 (使用 'sudo lsof -i :443' 检查)"
    echo "3. 确保证书文件存在且权限正确"
    echo "==============================================="
    exit $exit_code
fi