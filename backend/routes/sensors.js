// 传感器API路由
const express = require('express');
const router = express.Router();

// 传感器数据实例将在server.js中注入
let sensorData = null;
let io = null;

// 设置依赖注入
function setSensorData(data) {
    sensorData = data;
}

function setSocketIO(socketIO) {
    io = socketIO;
}

// GET /api/sensors - 获取所有传感器数据
router.get('/', (req, res) => {
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

// GET /api/sensors/:type - 获取特定类型传感器数据
router.get('/:type', (req, res) => {
    try {
        const { type } = req.params;
        const data = sensorData.getSensorValue(type);

        res.json({
            success: true,
            data: data,
            timestamp: Date.now()
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: '获取传感器数据失败',
            message: error.message
        });
    }
});

// POST /api/sensors - 更新传感器数据
router.post('/', (req, res) => {
    try {
        const newData = req.body;

        // 验证数据格式
        const errors = sensorData.validateData(newData);
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                error: '数据验证失败',
                details: errors
            });
        }

        // 更新数据
        const updatedData = sensorData.updateData(newData);

        // 通过WebSocket广播更新
        if (io) {
            io.emit('sensor-data', updatedData);
        }

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

// GET /api/sensors/history/:limit? - 获取历史数据
router.get('/history/:limit?', (req, res) => {
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

// GET /api/sensors/chart/:type - 获取图表数据
router.get('/chart/:type', (req, res) => {
    try {
        const { type } = req.params;
        const { timeRange = '1h' } = req.query;

        // 验证传感器类型
        const validTypes = ['temperature', 'humidity', 'light', 'pwm'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                error: '无效的传感器类型',
                validTypes: validTypes
            });
        }

        // 验证时间范围
        const validTimeRanges = ['1m', '10m', '1h', '24h'];
        if (!validTimeRanges.includes(timeRange)) {
            return res.status(400).json({
                success: false,
                error: '无效的时间范围',
                validTimeRanges: validTimeRanges
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

// POST /api/sensors/mock - 生成模拟数据
router.post('/mock', (req, res) => {
    try {
        const mockData = sensorData.generateMockData();

        // 通过WebSocket广播更新
        if (io) {
            io.emit('sensor-data', mockData);
        }

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

// POST /api/sensors/clear - 清除历史数据
router.post('/clear', (req, res) => {
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

module.exports = {
    router,
    setSensorData,
    setSocketIO
};
