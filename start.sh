#!/bin/bash

echo "正在启动传感器监控后端服务器..."
echo

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "错误: 未检测到Node.js，请先安装Node.js"
    echo "下载地址: https://nodejs.org/"
    exit 1
fi

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "正在安装依赖包..."
    npm install
    if [ $? -ne 0 ]; then
        echo "错误: 依赖安装失败"
        exit 1
    fi
fi

echo "启动服务器..."
echo
echo "访问地址:"
echo "- 后端API版本: http://localhost:3000/frontend/"
echo "- 前端直连版本: http://localhost:3000/"
echo "- API健康检查: http://localhost:3000/api/health"
echo
echo "按 Ctrl+C 停止服务器"
echo

npm start
