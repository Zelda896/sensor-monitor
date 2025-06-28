# 传感器数据监控系统

一个功能完整的传感器数据监控系统，支持前端直连和后端API双模式，实时显示温度、湿度、光感和PWM数据。

## 功能特点

- **实时数据展示**: 自动更新传感器数据
- **多种连接方式**: 支持阿里云IoT直连、后端API、WebSocket实时推送
- **响应式设计**: 适配桌面和移动设备
- **现代化界面**: 卡片式2×2网格布局，渐变背景
- **数据可视化**: 进度条显示数据范围，折线图展示历史趋势
- **交互功能**: 悬停效果、数值变化动画、点击卡片查看图表
- **多模式运行**: 支持模拟数据、真实MQTT数据、后端API数据
- **Node.js后端**: 提供RESTful API和WebSocket实时通信
- **数据存储**: 内存中存储历史数据，每10秒自动保存
- **历史数据图表**: 支持1分钟、10分钟、1小时、24小时时间范围

## 文件结构

```
sensor-monitor/
├── package.json                    # 项目依赖配置
├── README.md                       # 说明文档
├── index.html                      # 主页面(前端直连版本)
├── style.css                       # 样式文件
├── script.js                       # 前端直连JavaScript逻辑
├── config.js                       # 阿里云三元组配置文件
├── mqtt-client.js                  # MQTT客户端封装
├── backend/                        # Node.js后端
│   ├── server.js                   # 主服务器文件
│   ├── config/
│   │   └── server.js               # 服务器配置
│   ├── models/
│   │   └── SensorData.js           # 传感器数据模型
│   └── routes/
│       └── sensors.js              # 传感器API路由
└── frontend/                       # 后端API版本前端
    ├── index.html                  # 后端API版本页面
    ├── style.css                   # 样式文件
    └── frontend-api.js             # 后端API客户端
```

## 使用方法

### 方式一：Node.js后端模式（推荐）

#### 1. 安装依赖
```bash
npm install
```

#### 2. 启动后端服务器
```bash
# 生产模式
npm start

# 开发模式（自动重启）
npm run dev
```

#### 3. 访问应用
- **后端API版本**: http://localhost:3000/frontend/
- **前端直连版本**: http://localhost:3000/
- **API文档**: http://localhost:3000/api/health

#### 4. 功能使用
- 点击"连接WebSocket"建立实时数据连接
- 点击"连接阿里云IoT"连接到阿里云IoT平台(需配置三元组)
- 点击"测试API"验证后端API连接
- 点击传感器卡片查看历史数据趋势图
- 按空格键手动刷新API数据

### 方式二：前端直连模式（原版本）
1. 直接在浏览器中打开 `index.html` 文件
2. 页面会自动开始显示模拟的传感器数据
3. 数据每2秒自动更新一次
4. 按空格键可手动刷新数据

### 连接阿里云IoT平台（真实数据）

#### 方式一：后端API模式（推荐）
1. **三元组已配置完成**：
   ```javascript
   PRODUCT_KEY: 'k1zfks5ATvF',
   DEVICE_NAME: 'rk3588_web',
   DEVICE_SECRET: 'f7a394d926c9e14e5182dee5218cd061'
   ```

2. **使用后端API版本**：
   - 启动后端服务器：`npm start`
   - 访问：http://localhost:3000/frontend/
   - 后端会自动连接阿里云IoT平台
   - 点击"连接阿里云IoT"按钮控制连接状态

3. **功能特点**：
   - 自动接收阿里云下行数据
   - 通过WebSocket实时推送到前端
   - 支持数据上报到阿里云IoT平台
   - 连接状态实时显示

#### 方式二：前端直连模式
1. **配置三元组参数**：
   - 打开 `config.js` 文件（已配置完成）
   - 根据需要修改 `REGION_ID`（默认：cn-shanghai）

2. **连接设备**：
   - 打开 `index.html` 文件
   - 点击底部的"连接阿里云"按钮
   - 连接成功后会自动切换到真实数据模式

3. **数据格式**：
   - 系统会自动订阅属性设置主题接收下行数据
   - JSON格式示例（使用阿里云标准标识符）：
   ```json
   {
     "params": {
       "temperature": 25.6,    // 温度
       "Humidity": 65.2,       // 湿度
       "LightLux": 750,        // 光照值
       "pwm": 85               // PWM占空比
     }
   }
   ```

## 数据说明

### 传感器数据范围
- **温度**: 显示范围 0-50°C，当前模拟范围 15-35°C
- **湿度**: 显示范围 0-100%，当前模拟范围 40-80%
- **光感**: 显示范围 0-1000lux，当前模拟范围 200-1000lux
- **PWM**: 显示范围 0-100%，当前模拟范围 0-100%

### 阿里云数据标识符映射
| 显示名称 | 阿里云标识符 | 数据类型 | 说明 |
|---------|-------------|---------|------|
| 温度 | `temperature` | Number | 环境温度值(°C) |
| 湿度 | `Humidity` | Number | 环境湿度百分比(%) |
| 光感 | `LightLux` | Number | 光照强度值(lux) |
| PWM占空比 | `pwm` | Number | PWM输出占空比(%) |

## 自定义配置

在 `script.js` 文件中的 `CONFIG` 对象可以调整：
- `UPDATE_INTERVAL`: 数据更新间隔（毫秒）
- 各传感器的最小值和最大值范围

## MQTT主题说明

系统使用以下阿里云IoT标准主题：

- **属性设置主题（下行）**: `/sys/${productKey}/${deviceName}/thing/service/property/set`
  - 用于接收云端下发的传感器数据
  - 自动订阅，无需手动配置

- **属性上报主题（上行）**: `/sys/${productKey}/${deviceName}/thing/event/property/post`
  - 预留用于设备上报数据（当前版本未使用）

## 故障排除

1. **连接失败**：
   - 检查三元组参数是否正确
   - 确认设备在阿里云IoT控制台中状态正常
   - 检查网络连接和防火墙设置

2. **数据不更新**：
   - 确认设备端正在发送数据到正确的主题
   - 检查JSON数据格式是否符合要求
   - 查看浏览器控制台错误信息

3. **SDK加载失败**：
   - 检查网络连接
   - 尝试刷新页面重新加载SDK

## 浏览器兼容性

支持所有现代浏览器：
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 后端API接口

### 传感器数据接口

#### GET /api/sensors
获取所有传感器数据
```json
{
  "success": true,
  "data": {
    "temperature": 25.6,
    "humidity": 65.2,
    "light": 750,
    "pwm": 85,
    "timestamp": 1703123456789
  },
  "timestamp": 1703123456789
}
```

#### GET /api/sensors/:type
获取特定类型传感器数据（temperature/humidity/light/pwm）
```json
{
  "success": true,
  "data": {
    "type": "temperature",
    "value": 25.6,
    "timestamp": 1703123456789,
    "unit": "°C"
  }
}
```

#### POST /api/sensors
更新传感器数据
```json
// 请求体
{
  "temperature": 26.5,
  "humidity": 68.0,
  "light": 800,
  "pwm": 90
}

// 响应
{
  "success": true,
  "data": { /* 更新后的数据 */ },
  "message": "传感器数据更新成功"
}
```

#### GET /api/sensors/history/:limit?
获取历史数据（默认50条）

#### GET /api/sensors/chart/:type?timeRange=1m|10m|1h|24h
获取图表数据
```json
{
  "success": true,
  "data": {
    "timestamps": ["2025-06-28T13:49:34.653Z"],
    "values": [25.6],
    "unit": "°C",
    "type": "temperature",
    "count": 1,
    "timeRange": "1h"
  }
}
```

#### GET /api/health
系统健康检查

### 模拟数据控制

#### POST /api/mock/start
启动模拟数据生成器

#### POST /api/mock/stop
停止模拟数据生成器

#### POST /api/sensors/clear
清除所有历史数据

### 阿里云IoT接口

#### GET /api/aliyun/status
获取阿里云IoT连接状态

#### POST /api/aliyun/connect
连接到阿里云IoT平台

#### POST /api/aliyun/disconnect
断开阿里云IoT连接

#### POST /api/aliyun/post-props
上报数据到阿里云IoT平台

### WebSocket事件

- **连接**: `connection`
- **数据推送**: `sensor-data`
- **请求数据**: `request-data`
- **更新数据**: `update-data`
- **阿里云数据**: `aliyun-data`
- **阿里云状态**: `aliyun-status`
- **阿里云连接**: `aliyun-connect`
- **阿里云断开**: `aliyun-disconnect`

## 技术栈

### 前端
- HTML5
- CSS3 (Grid, Flexbox, 渐变)
- 原生JavaScript (ES6+)
- Socket.io客户端
- 阿里云IoT Device SDK
- MQTT over WebSocket
- 响应式设计

### 后端
- Node.js
- Express.js
- Socket.io
- CORS支持
- 内存数据存储
- 阿里云IoT Device SDK (alibabacloud-iot-device-sdk)
- 定时数据保存（每10秒）

### 图表功能
- Chart.js图表库
- 时间序列折线图
- 多时间范围支持（1分钟、10分钟、1小时、24小时）
- 响应式图表设计
- 实时数据更新

## 使用说明

### 快速开始
1. **安装依赖**：`npm install`
2. **启动服务器**：`npm start`
3. **访问应用**：
   - 后端API版本：http://localhost:3000/frontend/
   - 前端直连版本：http://localhost:3000/

### 功能测试
1. **WebSocket连接**：点击"连接WebSocket"建立实时通信
2. **阿里云IoT**：点击"连接阿里云IoT"连接到IoT平台
3. **API测试**：点击"测试API"验证后端接口
4. **历史数据图表**：点击任意传感器卡片查看历史数据趋势图

### 数据格式
阿里云IoT平台数据格式：
```json
{
  "temperature": 26.5,    // 温度 (°C)
  "Humidity": 68.0,       // 湿度 (%)
  "LightLux": 800,        // 光照值 (lux)
  "pwm": 90               // PWM占空比 (%)
}
```

### 故障排除
- **阿里云IoT连接失败**：检查三元组配置和网络连接
- **WebSocket连接失败**：确保后端服务器正常运行
- **数据不更新**：检查设备是否正常上报数据

## 开发说明

- **config.js**: 三元组配置，使用宏定义方式便于修改
- **mqtt-client.js**: MQTT客户端封装，处理连接、订阅、消息解析
- **script.js**: 主逻辑，集成模拟数据和真实数据双模式
- **backend/**: Node.js后端，提供API和WebSocket服务
- **frontend/**: 后端API版本前端页面
- 支持自动重连和错误处理
- 代码采用ES6类结构，便于维护和扩展

## 在线部署

### 快速部署到Vercel

1. **Fork本项目到您的GitHub**
2. **登录Vercel并导入项目**
3. **一键部署**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/sensor-monitor)

### 部署后访问

- **在线演示**: `https://your-project.vercel.app/frontend/`
- **API接口**: `https://your-project.vercel.app/api/health`
- **原版前端**: `https://your-project.vercel.app/`

详细部署说明请查看 [DEPLOYMENT.md](./DEPLOYMENT.md)

## 总结

这个传感器监控系统提供了完整的IoT数据监控解决方案，支持前端直连和后端API双模式，集成阿里云IoT平台，具有实时数据展示、WebSocket通信、数据上报等功能，是IoT项目开发和监控的理想选择。

### 特色功能
- 🌐 **在线访问**: 支持GitHub Pages和Vercel部署
- 📊 **实时图表**: 交互式传感器数据趋势图
- ☁️ **云端集成**: 阿里云IoT平台无缝对接
- 📱 **响应式设计**: 完美适配桌面和移动设备
- 🔄 **实时通信**: WebSocket支持实时数据推送
