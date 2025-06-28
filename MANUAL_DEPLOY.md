# 手动部署指南

## 问题解决
如果运行脚本出现乱码，请按照以下手动步骤操作：

## 第一步：初始化Git仓库

打开命令提示符，运行以下命令：

```bash
# 1. 初始化Git仓库
git init

# 2. 设置主分支
git branch -M main

# 3. 添加所有文件
git add .

# 4. 提交代码
git commit -m "Initial commit: Sensor Monitor System"
```

## 第二步：创建GitHub仓库

1. **访问GitHub**
   - 打开 https://github.com
   - 登录您的账号

2. **创建新仓库**
   - 点击右上角 "+" 号
   - 选择 "New repository"

3. **填写信息**
   ```
   Repository name: sensor-monitor
   Description: 传感器数据监控系统
   选择: Public (公开)
   
   重要：不要勾选任何选项！
   ❌ Add a README file
   ❌ Add .gitignore  
   ❌ Choose a license
   ```

4. **点击 "Create repository"**

## 第三步：推送代码到GitHub

1. **复制仓库地址**
   - 从GitHub页面复制HTTPS地址
   - 例如：`https://github.com/YOUR_USERNAME/sensor-monitor.git`

2. **在命令行运行**（替换为您的地址）
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/sensor-monitor.git
   git push -u origin main
   ```

3. **输入凭据**
   - 用户名：您的GitHub用户名
   - 密码：Personal Access Token（不是登录密码）

## 第四步：获取GitHub Token（如果需要）

1. **访问设置**
   - GitHub右上角头像 → Settings
   - 左侧菜单 → Developer settings
   - Personal access tokens → Tokens (classic)

2. **生成新Token**
   - 点击 "Generate new token"
   - Note: "Sensor Monitor Deploy"
   - Expiration: 选择时间
   - 勾选权限：`repo` (完整仓库访问)

3. **复制Token**
   - 生成后立即复制保存
   - 这个Token就是您的"密码"

## 第五步：部署到Vercel

### 5.1 注册Vercel
1. 访问 https://vercel.com
2. 点击 "Continue with GitHub"
3. 授权Vercel访问GitHub

### 5.2 导入项目
1. 登录后点击 "New Project"
2. 找到 `sensor-monitor` 仓库
3. 点击 "Import"

### 5.3 配置部署
```
Project Name: sensor-monitor
Framework Preset: Other
Root Directory: ./
Build Command: npm run build
Output Directory: (留空)
Install Command: npm install
```

### 5.4 部署
1. 点击 "Deploy"
2. 等待部署完成（约2-3分钟）
3. 获得访问链接

## 第六步：验证部署

访问以下链接测试：

1. **主页**
   ```
   https://your-project.vercel.app/
   ```

2. **后端API版本**
   ```
   https://your-project.vercel.app/frontend/
   ```

3. **API测试**
   ```
   https://your-project.vercel.app/api/health
   ```

## 常用Git命令

```bash
# 查看状态
git status

# 查看远程仓库
git remote -v

# 重新设置远程仓库
git remote set-url origin NEW_URL

# 强制推送（谨慎使用）
git push -f origin main

# 查看提交历史
git log --oneline
```

## 故障排除

### 问题1：推送被拒绝
```bash
# 解决方案：先拉取再推送
git pull origin main --allow-unrelated-histories
git push origin main
```

### 问题2：认证失败
- 确保使用Personal Access Token作为密码
- 检查Token权限是否包含repo

### 问题3：Vercel构建失败
- 检查package.json文件
- 确保所有依赖都已安装

### 问题4：中文乱码
- 在命令行运行：`chcp 65001`
- 或使用Git Bash代替命令提示符

## 完成！

按照以上步骤，您的项目就成功部署到云端了！

**最终结果：**
- GitHub仓库：存储代码
- Vercel部署：在线访问
- 自动HTTPS：安全访问
- 全球CDN：快速加载
