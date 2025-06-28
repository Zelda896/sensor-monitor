// 传感器数据模型
class SensorData {
    constructor() {
        this.data = {
            temperature: 25.6, // 温度
            humidity: 65.2,    // 湿度
            light: 750,        // 光感
            pwm: 85,           // PWM占空比
            timestamp: Date.now() // 时间戳
        };
        this.history = []; // 历史数据存储
        this.maxHistorySize = 8640; // 最大历史记录数(24小时*60分钟*6次/分钟)
        this.lastSaveTime = Date.now(); // 上次保存时间
        this.saveInterval = 10000; // 保存间隔(10秒)

        // 启动定时保存
        this.startAutoSave();
    }

    // 获取当前数据
    getCurrentData() {
        return { ...this.data };
    }

    // 更新传感器数据
    updateData(newData) {
        const timestamp = Date.now();

        // 更新数据
        if (newData.temperature !== undefined) this.data.temperature = newData.temperature;
        if (newData.humidity !== undefined) this.data.humidity = newData.humidity;
        if (newData.light !== undefined) this.data.light = newData.light;
        if (newData.pwm !== undefined) this.data.pwm = newData.pwm;

        this.data.timestamp = timestamp;

        // 添加到历史记录
        this.addToHistory({ ...this.data });

        return this.getCurrentData();
    }

    // 生成模拟数据
    generateMockData() {
        const newData = {
            temperature: this.generateRandomValue(this.data.temperature, 15, 35, 0.5),
            humidity: this.generateRandomValue(this.data.humidity, 40, 80, 1),
            light: this.generateRandomValue(this.data.light, 200, 1000, 20),
            pwm: this.generateRandomValue(this.data.pwm, 0, 100, 2),
            timestamp: Date.now()
        };

        this.data = newData;
        this.addToHistory({ ...newData });

        return this.getCurrentData();
    }

    // 生成随机变化值
    generateRandomValue(current, min, max, variance) {
        const change = (Math.random() - 0.5) * variance * 2;
        let newValue = current + change;
        return Math.max(min, Math.min(max, newValue));
    }

    // 添加到历史记录
    addToHistory(data) {
        this.history.push(data);

        // 限制历史记录大小
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
    }

    // 获取历史数据
    getHistory(limit = 50) {
        return this.history.slice(-limit);
    }

    // 获取特定类型的传感器数据
    getSensorValue(type) {
        const validTypes = ['temperature', 'humidity', 'light', 'pwm'];
        if (!validTypes.includes(type)) {
            throw new Error(`无效的传感器类型: ${type}`);
        }

        return {
            type,
            value: this.data[type],
            timestamp: this.data.timestamp,
            unit: this.getUnit(type)
        };
    }

    // 获取传感器单位
    getUnit(type) {
        const units = {
            temperature: '°C',
            humidity: '%',
            light: 'lux',
            pwm: '%'
        };
        return units[type] || '';
    }

    // 验证数据格式
    validateData(data) {
        const errors = [];

        if (data.temperature !== undefined) {
            if (typeof data.temperature !== 'number' || isNaN(data.temperature)) {
                errors.push('温度必须是有效数字');
            } else if (data.temperature < -50 || data.temperature > 100) {
                errors.push('温度超出有效范围(-50°C ~ 100°C)');
            }
        }

        if (data.humidity !== undefined) {
            if (typeof data.humidity !== 'number' || isNaN(data.humidity)) {
                errors.push('湿度必须是有效数字');
            } else if (data.humidity < 0 || data.humidity > 100) {
                errors.push('湿度超出有效范围(0% ~ 100%)');
            }
        }

        if (data.light !== undefined) {
            if (typeof data.light !== 'number' || isNaN(data.light)) {
                errors.push('光感必须是有效数字');
            } else if (data.light < 0 || data.light > 100000) {
                errors.push('光感超出有效范围(0 ~ 100000 lux)');
            }
        }

        if (data.pwm !== undefined) {
            if (typeof data.pwm !== 'number' || isNaN(data.pwm)) {
                errors.push('PWM必须是有效数字');
            } else if (data.pwm < 0 || data.pwm > 100) {
                errors.push('PWM超出有效范围(0% ~ 100%)');
            }
        }

        return errors;
    }

    // 启动定时保存
    startAutoSave() {
        this.autoSaveTimer = setInterval(() => {
            this.saveCurrentData();
        }, this.saveInterval);
        console.log(`📊 定时数据保存已启动，间隔: ${this.saveInterval/1000}秒`);
    }

    // 停止定时保存
    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
            console.log('📊 定时数据保存已停止');
        }
    }

    // 保存当前数据到历史记录
    saveCurrentData() {
        const now = Date.now();
        if (now - this.lastSaveTime >= this.saveInterval) {
            // 创建数据副本并更新时间戳为当前时间
            const dataToSave = {
                ...this.data,
                timestamp: now
            };
            this.addToHistory(dataToSave);
            this.lastSaveTime = now;
        }
    }

    // 获取指定时间范围的历史数据
    getHistoryByTimeRange(timeRange, sensorType = null) {
        const now = Date.now();
        let startTime;

        // 计算开始时间
        switch (timeRange) {
            case '1m':
                startTime = now - 60 * 1000; // 1分钟
                break;
            case '10m':
                startTime = now - 10 * 60 * 1000; // 10分钟
                break;
            case '1h':
                startTime = now - 60 * 60 * 1000; // 1小时
                break;
            case '24h':
                startTime = now - 24 * 60 * 60 * 1000; // 24小时
                break;
            default:
                startTime = now - 60 * 1000; // 默认1分钟
        }

        // 过滤时间范围内的数据
        const filteredData = this.history.filter(item =>
            item.timestamp >= startTime && item.timestamp <= now
        );

        // 如果指定了传感器类型，只返回该类型的数据
        if (sensorType) {
            return {
                timestamps: filteredData.map(item => new Date(item.timestamp)),
                values: filteredData.map(item => item[sensorType]),
                unit: this.getUnit(sensorType),
                type: sensorType,
                count: filteredData.length,
                timeRange: timeRange
            };
        }

        // 返回所有传感器数据
        return {
            timestamps: filteredData.map(item => new Date(item.timestamp)),
            temperature: filteredData.map(item => item.temperature),
            humidity: filteredData.map(item => item.humidity),
            light: filteredData.map(item => item.light),
            pwm: filteredData.map(item => item.pwm),
            count: filteredData.length,
            timeRange: timeRange
        };
    }

    // 获取图表数据（优化版本，支持数据抽样）
    getChartData(sensorType, timeRange) {
        const historyData = this.getHistoryByTimeRange(timeRange, sensorType);

        // 如果数据点太多，进行抽样以提高性能
        let sampledData = historyData;
        if (historyData.values && historyData.values.length > 100) {
            const step = Math.ceil(historyData.values.length / 100);
            sampledData = {
                ...historyData,
                timestamps: historyData.timestamps.filter((_, index) => index % step === 0),
                values: historyData.values.filter((_, index) => index % step === 0)
            };
            sampledData.count = sampledData.values.length;
        }

        return sampledData;
    }

    // 获取系统状态
    getStatus() {
        return {
            dataCount: this.history.length,
            lastUpdate: this.data.timestamp,
            lastSaveTime: this.lastSaveTime,
            saveInterval: this.saveInterval,
            maxHistorySize: this.maxHistorySize,
            uptime: Date.now() - (this.history[0]?.timestamp || Date.now())
        };
    }

    // 清除历史数据
    clearHistory() {
        this.history = [];
        console.log('📊 历史数据已清除');
    }

    // 重置到初始状态
    reset() {
        this.data = {
            temperature: 25.6,
            humidity: 65.2,
            light: 750,
            pwm: 85,
            timestamp: Date.now()
        };
        this.clearHistory();
        console.log('📊 传感器数据已重置到初始状态');
    }

    // 清理方法
    cleanup() {
        this.stopAutoSave();
    }
}

module.exports = SensorData;
