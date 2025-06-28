// 配置参数
const CONFIG = {
    UPDATE_INTERVAL: 2000, // 更新间隔(毫秒)
    TEMP_MIN: 0,          // 温度最小值
    TEMP_MAX: 50,         // 温度最大值
    HUMIDITY_MIN: 0,      // 湿度最小值
    HUMIDITY_MAX: 100,    // 湿度最大值
    LIGHT_MIN: 0,         // 光感最小值
    LIGHT_MAX: 1000,      // 光感最大值
    PWM_MIN: 0,           // PWM最小值
    PWM_MAX: 100          // PWM最大值
};

// 传感器数据类
class SensorData {
    constructor() {
        this.temperature = 25.6;
        this.humidity = 65.2;
        this.light = 750;
        this.pwm = 85;
    }

    // 模拟数据更新
    updateData() {
        this.temperature = this.generateRandomValue(this.temperature, 15, 35, 0.5);
        this.humidity = this.generateRandomValue(this.humidity, 40, 80, 1);
        this.light = this.generateRandomValue(this.light, 200, 1000, 20);
        this.pwm = this.generateRandomValue(this.pwm, 0, 100, 2);
    }

    // 生成随机变化值
    generateRandomValue(current, min, max, variance) {
        const change = (Math.random() - 0.5) * variance * 2;
        let newValue = current + change;
        return Math.max(min, Math.min(max, newValue));
    }
}

// 显示控制类
class DisplayController {
    constructor() {
        this.elements = {
            temperature: document.getElementById('temperature'),
            humidity: document.getElementById('humidity'),
            light: document.getElementById('light'),
            pwm: document.getElementById('pwm'),
            tempProgress: document.getElementById('temp-progress'),
            humidityProgress: document.getElementById('humidity-progress'),
            lightProgress: document.getElementById('light-progress'),
            pwmProgress: document.getElementById('pwm-progress'),
            lastUpdate: document.getElementById('last-update')
        };
    }

    // 更新显示
    updateDisplay(data) {
        this.updateValue('temperature', data.temperature, '°C', 1);
        this.updateValue('humidity', data.humidity, '%', 1);
        this.updateValue('light', Math.round(data.light), 'lux', 0);
        this.updateValue('pwm', Math.round(data.pwm), '%', 0);

        this.updateProgress('temp-progress', data.temperature, CONFIG.TEMP_MIN, CONFIG.TEMP_MAX);
        this.updateProgress('humidity-progress', data.humidity, CONFIG.HUMIDITY_MIN, CONFIG.HUMIDITY_MAX);
        this.updateProgress('light-progress', data.light, CONFIG.LIGHT_MIN, CONFIG.LIGHT_MAX);
        this.updateProgress('pwm-progress', data.pwm, CONFIG.PWM_MIN, CONFIG.PWM_MAX);

        this.updateTimestamp();
    }

    // 更新数值显示
    updateValue(type, value, unit, decimals) {
        const element = this.elements[type];
        if (element) {
            element.textContent = value.toFixed(decimals);
            this.animateValue(element);
        }
    }

    // 更新进度条
    updateProgress(progressId, value, min, max) {
        const element = this.elements[progressId];
        if (element) {
            const percentage = ((value - min) / (max - min)) * 100;
            element.style.width = `${Math.max(0, Math.min(100, percentage))}%`;
        }
    }

    // 数值变化动画
    animateValue(element) {
        element.style.transform = 'scale(1.1)';
        element.style.transition = 'transform 0.2s ease';
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 200);
    }

    // 更新时间戳
    updateTimestamp() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('zh-CN');
        this.elements.lastUpdate.textContent = timeString;
    }
}

// 主应用类
class SensorApp {
    constructor() {
        this.sensorData = new SensorData();
        this.displayController = new DisplayController();
        this.mqttClient = null;
        this.isRunning = false;
        this.useRealData = false; // 是否使用真实MQTT数据
    }

    // 启动应用
    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.displayController.updateDisplay(this.sensorData);

        // 初始化MQTT客户端
        this.initMqttClient();

        this.intervalId = setInterval(() => {
            // 如果没有使用真实数据，则使用模拟数据
            if (!this.useRealData) {
                this.sensorData.updateData();
                this.displayController.updateDisplay(this.sensorData);
            }
        }, CONFIG.UPDATE_INTERVAL);

        console.log('传感器监控已启动');
    }

    // 停止应用
    stop() {
        if (!this.isRunning) return;

        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }

        console.log('传感器监控已停止');
    }

    // 手动更新数据
    manualUpdate() {
        if (!this.useRealData) {
            this.sensorData.updateData();
            this.displayController.updateDisplay(this.sensorData);
        }
    }

    // 初始化MQTT客户端
    initMqttClient() {
        try {
            // 检查配置是否存在
            if (typeof ALIYUN_CONFIG === 'undefined') {
                console.warn('阿里云配置未找到，使用模拟数据模式');
                return;
            }

            // 检查三元组是否已配置
            if (ALIYUN_CONFIG.PRODUCT_KEY === 'YOUR_PRODUCT_KEY' ||
                ALIYUN_CONFIG.DEVICE_NAME === 'YOUR_DEVICE_NAME' ||
                ALIYUN_CONFIG.DEVICE_SECRET === 'YOUR_DEVICE_SECRET') {
                console.warn('请先配置阿里云三元组参数');
                this.updateMqttStatus('请配置三元组');
                return;
            }

            // 创建MQTT客户端
            this.mqttClient = new AliyunMqttClient(ALIYUN_CONFIG);

            // 设置数据接收回调
            this.mqttClient.setDataReceivedCallback((topic, data) => {
                this.handleMqttData(topic, data);
            });

            // 设置状态变化回调
            this.mqttClient.setStatusChangedCallback((status) => {
                this.updateMqttStatus(status);
            });

            console.log('MQTT客户端初始化完成');
        } catch (error) {
            console.error('MQTT客户端初始化失败:', error);
            this.updateMqttStatus('初始化失败');
        }
    }

    // 处理MQTT数据
    handleMqttData(topic, data) {
        if (topic === 'sensor_data' && data) {
            // 更新传感器数据
            if (data.temperature !== null) this.sensorData.temperature = data.temperature;
            if (data.humidity !== null) this.sensorData.humidity = data.humidity;
            if (data.light !== null) this.sensorData.light = data.light;
            if (data.pwm !== null) this.sensorData.pwm = data.pwm;

            // 更新显示
            this.displayController.updateDisplay(this.sensorData);
            this.useRealData = true;

            console.log('收到真实传感器数据:', data);
        }
    }

    // 连接MQTT
    async connectMqtt() {
        if (!this.mqttClient) {
            console.warn('MQTT客户端未初始化');
            return false;
        }

        try {
            const success = await this.mqttClient.connect();
            if (success) {
                this.useRealData = true;
                console.log('MQTT连接成功，切换到真实数据模式');
            }
            return success;
        } catch (error) {
            console.error('MQTT连接失败:', error);
            return false;
        }
    }

    // 断开MQTT连接
    disconnectMqtt() {
        if (this.mqttClient) {
            this.mqttClient.disconnect();
            this.useRealData = false;
            console.log('MQTT连接已断开，切换到模拟数据模式');
        }
    }

    // 更新MQTT状态显示
    updateMqttStatus(status) {
        const statusElement = document.getElementById('mqtt-status');
        const connectBtn = document.getElementById('connect-btn');

        if (statusElement) {
            statusElement.textContent = status;
        }

        if (connectBtn) {
            if (status === '已连接') {
                connectBtn.textContent = '断开连接';
                connectBtn.disabled = false;
            } else if (status === '连接中...') {
                connectBtn.textContent = '连接中...';
                connectBtn.disabled = true;
            } else {
                connectBtn.textContent = '连接阿里云';
                connectBtn.disabled = false;
            }
        }
    }

    // 获取连接状态
    getMqttStatus() {
        return this.mqttClient ? this.mqttClient.getConnectionStatus() : null;
    }
}

// 页面加载完成后启动应用
document.addEventListener('DOMContentLoaded', () => {
    const app = new SensorApp();
    app.start();

    // 连接按钮事件处理
    const connectBtn = document.getElementById('connect-btn');
    if (connectBtn) {
        connectBtn.addEventListener('click', async () => {
            const mqttStatus = app.getMqttStatus();

            if (mqttStatus && mqttStatus.connected) {
                // 如果已连接，则断开
                app.disconnectMqtt();
            } else {
                // 如果未连接，则连接
                await app.connectMqtt();
            }
        });
    }

    // 添加键盘快捷键
    document.addEventListener('keydown', (event) => {
        if (event.key === ' ') { // 空格键手动更新
            event.preventDefault();
            app.manualUpdate();
        }
    });

    // 页面可见性变化时控制更新
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            app.stop();
        } else {
            app.start();
        }
    });

    // 全局暴露app实例，方便调试
    window.sensorApp = app;
});
