// Node.js后端服务器
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

// 导入配置和模型
const SERVER_CONFIG = require('./config/server');
const SensorData = require('./models/SensorData');
const { router: sensorRoutes, setSensorData, setSocketIO } = require('./routes/sensors');
const AliyunIotService = require('./services/AliyunIotService');

// 创建Express应用
const app = express();
const server = http.createServer(app);
const io = socketIo(server, SERVER_CONFIG.SOCKET_CONFIG);

// 创建传感器数据实例
const sensorData = new SensorData();

// 创建阿里云IoT服务实例
const aliyunIotService = new AliyunIotService(sensorData, io);

// 依赖注入
setSensorData(sensorData);
setSocketIO(io);

// 中间件配置
app.use(cors({ origin: SERVER_CONFIG.CORS_ORIGIN }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务 - 托管前端文件
app.use(express.static(path.join(__dirname, '../')));

// API路由
app.use('/api/sensors', sensorRoutes);

// 阿里云IoT API路由
app.get('/api/aliyun/status', (req, res) => {
    const status = aliyunIotService.getStatus();
    res.json({
        success: true,
        data: status,
        timestamp: Date.now()
    });
});

app.post('/api/aliyun/connect', async (req, res) => {
    try {
        const success = await aliyunIotService.connect();
        res.json({
            success: success,
            message: success ? '阿里云IoT连接成功' : '阿里云IoT连接失败',
            timestamp: Date.now()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '阿里云IoT连接失败',
            message: error.message
        });
    }
});

app.post('/api/aliyun/disconnect', (req, res) => {
    try {
        aliyunIotService.disconnect();
        res.json({
            success: true,
            message: '阿里云IoT已断开连接',
            timestamp: Date.now()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '断开连接失败',
            message: error.message
        });
    }
});

app.post('/api/aliyun/post-props', async (req, res) => {
    try {
        const data = req.body;
        const success = await aliyunIotService.postProps(data);
        res.json({
            success: success,
            message: success ? '数据上报成功' : '数据上报失败',
            timestamp: Date.now()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '数据上报失败',
            message: error.message
        });
    }
});

// 健康检查接口
app.get('/api/health', (req, res) => {
    const status = sensorData.getStatus();
    res.json({
        success: true,
        status: 'healthy',
        server: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: process.version
        },
        data: status,
        timestamp: Date.now()
    });
});

// 根路径重定向到前端
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// Socket.io连接处理
io.on('connection', (socket) => {
    console.log(`🔌 客户端连接: ${socket.id}`);

    // 发送当前数据给新连接的客户端
    socket.emit('sensor-data', sensorData.getCurrentData());

    // 处理客户端请求数据
    socket.on('request-data', () => {
        socket.emit('sensor-data', sensorData.getCurrentData());
    });

    // 处理客户端更新数据
    socket.on('update-data', (data) => {
        try {
            const errors = sensorData.validateData(data);
            if (errors.length === 0) {
                const updatedData = sensorData.updateData(data);
                // 广播给所有客户端
                io.emit('sensor-data', updatedData);
                socket.emit('update-success', { success: true, data: updatedData });

                // 如果阿里云IoT已连接，同时上报数据
                if (aliyunIotService.getStatus().connected) {
                    aliyunIotService.postProps(updatedData).catch(error => {
                        console.error('❌ 阿里云数据上报失败:', error);
                    });
                }
            } else {
                socket.emit('update-error', { success: false, errors });
            }
        } catch (error) {
            socket.emit('update-error', { success: false, error: error.message });
        }
    });

    // 处理阿里云IoT连接请求
    socket.on('aliyun-connect', async () => {
        try {
            const success = await aliyunIotService.connect();
            socket.emit('aliyun-connect-result', {
                success: success,
                message: success ? '阿里云IoT连接成功' : '阿里云IoT连接失败'
            });
        } catch (error) {
            socket.emit('aliyun-connect-result', {
                success: false,
                message: '阿里云IoT连接失败: ' + error.message
            });
        }
    });

    // 处理阿里云IoT断开请求
    socket.on('aliyun-disconnect', () => {
        try {
            aliyunIotService.disconnect();
            socket.emit('aliyun-disconnect-result', {
                success: true,
                message: '阿里云IoT已断开连接'
            });
        } catch (error) {
            socket.emit('aliyun-disconnect-result', {
                success: false,
                message: '断开连接失败: ' + error.message
            });
        }
    });

    // 处理阿里云IoT状态查询
    socket.on('aliyun-status', () => {
        const status = aliyunIotService.getStatus();
        socket.emit('aliyun-status-result', status);
    });

    // 处理断开连接
    socket.on('disconnect', () => {
        console.log(`🔌 客户端断开: ${socket.id}`);
    });
});

// 模拟数据生成器（可选）
let mockDataInterval = null;

function startMockDataGenerator() {
    if (mockDataInterval) return;

    mockDataInterval = setInterval(() => {
        const mockData = sensorData.generateMockData();
        io.emit('sensor-data', mockData);
        console.log('📊 生成模拟数据:', {
            temperature: mockData.temperature.toFixed(1),
            humidity: mockData.humidity.toFixed(1),
            light: Math.round(mockData.light),
            pwm: Math.round(mockData.pwm)
        });
    }, SERVER_CONFIG.SENSOR_CONFIG.UPDATE_INTERVAL);

    console.log('🎲 模拟数据生成器已启动');
}

function stopMockDataGenerator() {
    if (mockDataInterval) {
        clearInterval(mockDataInterval);
        mockDataInterval = null;
        console.log('🎲 模拟数据生成器已停止');
    }
}

// 控制模拟数据的API
app.post('/api/mock/start', (req, res) => {
    startMockDataGenerator();
    res.json({ success: true, message: '模拟数据生成器已启动' });
});

app.post('/api/mock/stop', (req, res) => {
    stopMockDataGenerator();
    res.json({ success: true, message: '模拟数据生成器已停止' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('❌ 服务器错误:', err);
    res.status(500).json({
        success: false,
        error: '服务器内部错误',
        message: process.env.NODE_ENV === 'development' ? err.message : '请稍后重试'
    });
});

// 404处理
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: '接口不存在',
        path: req.path
    });
});

// 启动服务器
const PORT = SERVER_CONFIG.PORT;
const HOST = SERVER_CONFIG.HOST;

server.listen(PORT, HOST, () => {
    console.log('🚀 传感器监控后端服务器启动成功!');
    console.log(`📍 服务器地址: http://${HOST}:${PORT}`);
    console.log(`📊 API文档: http://${HOST}:${PORT}/api/health`);
    console.log(`🌐 前端页面: http://${HOST}:${PORT}`);
    console.log(`🔗 后端API版本: http://${HOST}:${PORT}/frontend/`);
    console.log('⚡ Socket.io已启用，支持实时数据推送');
    console.log('☁️ 阿里云IoT集成已启用');

    // 自动启动阿里云IoT连接(如果配置完整)
    aliyunIotService.autoStart();

    // 可选：自动启动模拟数据生成器
    if (process.env.AUTO_MOCK === 'true') {
        startMockDataGenerator();
    }
});

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('🔄 收到SIGTERM信号，正在关闭服务器...');
    stopMockDataGenerator();
    sensorData.cleanup(); // 清理定时器
    aliyunIotService.disconnect();
    server.close(() => {
        console.log('✅ 服务器已关闭');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🔄 收到SIGINT信号，正在关闭服务器...');
    stopMockDataGenerator();
    sensorData.cleanup(); // 清理定时器
    aliyunIotService.disconnect();
    server.close(() => {
        console.log('✅ 服务器已关闭');
        process.exit(0);
    });
});

module.exports = { app, server, io };
