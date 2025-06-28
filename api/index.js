// Vercel Serverless API
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 简化的传感器数据模型（无定时器）
class SimpleSensorData {
    constructor() {
        this.data = {
            temperature: 25.6,
            humidity: 65.2,
            light: 750,
            pwm: 85,
            timestamp: Date.now()
        };
        this.history = [];
    }

    getCurrentData() {
        return { ...this.data };
    }

    updateData(newData) {
        const timestamp = Date.now();
        if (newData.temperature !== undefined) this.data.temperature = newData.temperature;
        if (newData.humidity !== undefined) this.data.humidity = newData.humidity;
        if (newData.light !== undefined) this.data.light = newData.light;
        if (newData.pwm !== undefined) this.data.pwm = newData.pwm;
        this.data.timestamp = timestamp;
        
        // 添加到历史记录
        this.history.push({ ...this.data });
        if (this.history.length > 100) {
            this.history.shift();
        }
        
        return this.getCurrentData();
    }

    getHistory(limit = 50) {
        return this.history.slice(-limit);
    }

    getChartData(sensorType, timeRange) {
        const now = Date.now();
        let startTime;
        
        switch (timeRange) {
            case '1m':
                startTime = now - 60 * 1000;
                break;
            case '10m':
                startTime = now - 10 * 60 * 1000;
                break;
            case '1h':
                startTime = now - 60 * 60 * 1000;
                break;
            case '24h':
                startTime = now - 24 * 60 * 60 * 1000;
                break;
            default:
                startTime = now - 60 * 1000;
        }

        const filteredData = this.history.filter(item => 
            item.timestamp >= startTime && item.timestamp <= now
        );

        return {
            timestamps: filteredData.map(item => new Date(item.timestamp)),
            values: filteredData.map(item => item[sensorType]),
            unit: this.getUnit(sensorType),
            type: sensorType,
            count: filteredData.length,
            timeRange: timeRange
        };
    }

    getUnit(type) {
        const units = {
            temperature: '°C',
            humidity: '%',
            light: 'lux',
            pwm: '%'
        };
        return units[type] || '';
    }

    generateMockData() {
        const newData = {
            temperature: 20 + Math.random() * 15,
            humidity: 40 + Math.random() * 40,
            light: 200 + Math.random() * 800,
            pwm: Math.random() * 100,
            timestamp: Date.now()
        };
        
        this.data = newData;
        this.history.push({ ...newData });
        if (this.history.length > 100) {
            this.history.shift();
        }
        
        return this.getCurrentData();
    }

    clearHistory() {
        this.history = [];
    }
}

// 创建全局实例
const sensorData = new SimpleSensorData();

// 静态文件服务
app.use(express.static(path.join(__dirname, '../')));
app.use('/frontend', express.static(path.join(__dirname, '../frontend')));

// API路由
app.get('/api/sensors', (req, res) => {
    try {
        const data = sensorData.getCurrentData();
        res.json({
            success: true,
            data: data,
            timestamp: Date.now()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '获取传感器数据失败',
            message: error.message
        });
    }
});

app.get('/api/sensors/:type', (req, res) => {
    try {
        const { type } = req.params;
        const validTypes = ['temperature', 'humidity', 'light', 'pwm'];
        
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                error: '无效的传感器类型'
            });
        }
        
        const data = sensorData.getCurrentData();
        res.json({
            success: true,
            data: {
                type: type,
                value: data[type],
                timestamp: data.timestamp,
                unit: sensorData.getUnit(type)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '获取传感器数据失败',
            message: error.message
        });
    }
});

app.post('/api/sensors', (req, res) => {
    try {
        const newData = req.body;
        const updatedData = sensorData.updateData(newData);
        
        res.json({
            success: true,
            data: updatedData,
            message: '传感器数据更新成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '更新传感器数据失败',
            message: error.message
        });
    }
});

app.get('/api/sensors/chart/:type', (req, res) => {
    try {
        const { type } = req.params;
        const { timeRange = '1h' } = req.query;
        
        const validTypes = ['temperature', 'humidity', 'light', 'pwm'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                error: '无效的传感器类型'
            });
        }
        
        const chartData = sensorData.getChartData(type, timeRange);
        
        res.json({
            success: true,
            data: chartData,
            timestamp: Date.now()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '获取图表数据失败',
            message: error.message
        });
    }
});

app.get('/api/sensors/history/:limit?', (req, res) => {
    try {
        const limit = parseInt(req.params.limit) || 50;
        const history = sensorData.getHistory(limit);
        
        res.json({
            success: true,
            data: history,
            count: history.length,
            timestamp: Date.now()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '获取历史数据失败',
            message: error.message
        });
    }
});

app.post('/api/sensors/clear', (req, res) => {
    try {
        sensorData.clearHistory();
        res.json({
            success: true,
            message: '历史数据已清除'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '清除历史数据失败',
            message: error.message
        });
    }
});

app.post('/api/sensors/mock', (req, res) => {
    try {
        const mockData = sensorData.generateMockData();
        res.json({
            success: true,
            data: mockData,
            message: '模拟数据生成成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '生成模拟数据失败',
            message: error.message
        });
    }
});

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: Date.now(),
        message: 'Sensor Monitor API is running'
    });
});

// 阿里云IoT状态（简化版）
app.get('/api/aliyun/status', (req, res) => {
    res.json({
        success: true,
        data: {
            connected: false,
            message: 'IoT connection disabled in serverless mode'
        },
        timestamp: Date.now()
    });
});

// 根路径
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

app.get('/frontend', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// 404处理
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: '接口不存在',
        path: req.path
    });
});

module.exports = app;
