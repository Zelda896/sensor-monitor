# 部署指南

## GitHub + Vercel 部署方案

### 前置条件
- GitHub账号
- Vercel账号（可用GitHub登录）

### 部署步骤

#### 1. 推送代码到GitHub

```bash
# 初始化Git仓库
git init

# 添加所有文件
git add .

# 提交代码
git commit -m "Initial commit: 传感器监控系统"

# 添加远程仓库（替换为您的GitHub仓库地址）
git remote add origin https://github.com/YOUR_USERNAME/sensor-monitor.git

# 推送到GitHub
git push -u origin main
```

#### 2. 在Vercel部署

1. 访问 [vercel.com](https://vercel.com)
2. 使用GitHub账号登录
3. 点击 "New Project"
4. 选择您的 `sensor-monitor` 仓库
5. 配置项目：
   - **Framework Preset**: Other
   - **Root Directory**: ./
   - **Build Command**: npm run build
   - **Output Directory**: 留空
   - **Install Command**: npm install

#### 3. 环境变量配置

在Vercel项目设置中添加环境变量：

```
NODE_ENV=production
PORT=3000
```

#### 4. 自定义域名（可选）

在Vercel项目设置的Domains部分可以：
- 使用免费的 `.vercel.app` 域名
- 绑定自定义域名

### 访问地址

部署成功后，您将获得：
- **主域名**: `https://your-project-name.vercel.app`
- **API接口**: `https://your-project-name.vercel.app/api/health`
- **前端页面**: `https://your-project-name.vercel.app/frontend/`

### 注意事项

1. **阿里云IoT连接**: 在生产环境中，阿里云IoT SDK可能需要额外配置
2. **WebSocket**: Vercel支持WebSocket，但有连接时间限制
3. **数据存储**: 当前使用内存存储，重启会丢失数据
4. **HTTPS**: Vercel自动提供HTTPS证书

### 故障排除

1. **构建失败**: 检查 `package.json` 中的依赖
2. **运行时错误**: 查看Vercel的Function Logs
3. **API不可访问**: 检查 `vercel.json` 路由配置

### 替代方案

如果Vercel不适合，可以考虑：

1. **Railway**: 
   - 访问 [railway.app](https://railway.app)
   - 连接GitHub仓库
   - 自动部署

2. **Render**:
   - 访问 [render.com](https://render.com)
   - 创建Web Service
   - 连接GitHub仓库

3. **Heroku**:
   - 需要添加 `Procfile` 文件
   - 免费额度有限制

### 本地测试生产环境

```bash
# 安装Vercel CLI
npm i -g vercel

# 本地运行（模拟生产环境）
vercel dev
```
