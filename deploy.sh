#!/bin/bash

echo "正在初始化Git仓库并部署到GitHub..."
echo

# 检查Git是否安装
if ! command -v git &> /dev/null; then
    echo "错误: 未检测到Git，请先安装Git"
    echo "下载地址: https://git-scm.com/"
    exit 1
fi

# 初始化Git仓库
if [ ! -d ".git" ]; then
    echo "初始化Git仓库..."
    git init
    git branch -M main
fi

# 添加所有文件
echo "添加文件到Git..."
git add .

# 提交代码
echo "提交代码..."
git commit -m "Initial commit: 传感器监控系统"

echo
echo "========================================"
echo "Git仓库初始化完成！"
echo
echo "接下来请按照以下步骤操作："
echo
echo "1. 在GitHub上创建新仓库 'sensor-monitor'"
echo "2. 复制仓库地址，例如: https://github.com/YOUR_USERNAME/sensor-monitor.git"
echo "3. 运行以下命令推送代码:"
echo "   git remote add origin YOUR_REPO_URL"
echo "   git push -u origin main"
echo
echo "4. 访问 https://vercel.com 部署项目"
echo "5. 选择您的GitHub仓库进行部署"
echo
echo "========================================"
