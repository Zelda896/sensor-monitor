// 阿里云IoT服务 - 后端集成
const iot = require('alibabacloud-iot-device-sdk');
const path = require('path');
const fs = require('fs');

// 动态读取配置，避免缓存问题
function loadConfig() {
    const configPath = path.resolve(__dirname, '../../config.js');
    console.log('📁 配置文件路径:', configPath);

    try {
        // 清除模块缓存
        delete require.cache[configPath];

        const config = require(configPath);

        // 如果读取到的是默认配置，使用用户提供的三元组
        if (config.PRODUCT_KEY === 'YOUR_PRODUCT_KEY') {
            config.PRODUCT_KEY = 'k1zfks5ATvF';
            config.DEVICE_NAME = 'rk3588_web';
            config.DEVICE_SECRET = 'f7a394d926c9e14e5182dee5218cd061';
        }

        return config;
    } catch (error) {
        console.error('❌ 配置文件读取失败:', error);
        return {
            PRODUCT_KEY: 'YOUR_PRODUCT_KEY',
            DEVICE_NAME: 'YOUR_DEVICE_NAME',
            DEVICE_SECRET: 'YOUR_DEVICE_SECRET',
            REGION_ID: 'cn-shanghai',
            MQTT_CONFIG: { MAX_RECONNECT_ATTEMPTS: 10 },
            TOPICS: {}
        };
    }
}

class AliyunIotService {
    constructor(sensorData, socketIO) {
        this.sensorData = sensorData;
        this.io = socketIO;
        this.device = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.config = loadConfig(); // 动态加载配置
        this.maxReconnectAttempts = this.config.MQTT_CONFIG.MAX_RECONNECT_ATTEMPTS;
    }

    // 初始化阿里云IoT设备
    async init() {
        try {
            // 重新加载配置以确保获取最新配置
            this.config = loadConfig();

            // 检查三元组配置
            if (!this.validateConfig()) {
                console.warn('⚠️ 阿里云三元组配置不完整，跳过IoT连接');
                return false;
            }

            // 创建设备实例
            this.device = iot.device({
                productKey: this.config.PRODUCT_KEY,
                deviceName: this.config.DEVICE_NAME,
                deviceSecret: this.config.DEVICE_SECRET,
                region: this.config.REGION_ID
            });

            // 绑定事件监听器
            this.bindEventListeners();

            console.log('🔧 阿里云IoT设备初始化完成');
            return true;
        } catch (error) {
            console.error('❌ 阿里云IoT设备初始化失败:', error);
            return false;
        }
    }

    // 验证配置
    validateConfig() {
        return this.config.PRODUCT_KEY !== 'YOUR_PRODUCT_KEY' &&
               this.config.DEVICE_NAME !== 'YOUR_DEVICE_NAME' &&
               this.config.DEVICE_SECRET !== 'YOUR_DEVICE_SECRET' &&
               this.config.PRODUCT_KEY &&
               this.config.DEVICE_NAME &&
               this.config.DEVICE_SECRET;
    }

    // 绑定事件监听器
    bindEventListeners() {
        // 连接成功事件
        this.device.on('connect', () => {
            console.log('🔌 阿里云IoT连接成功');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.broadcastStatus('阿里云IoT已连接');
        });

        // 连接断开事件
        this.device.on('disconnect', () => {
            console.log('🔌 阿里云IoT连接断开');
            this.isConnected = false;
            this.broadcastStatus('阿里云IoT连接断开');
        });

        // 重连事件
        this.device.on('reconnect', () => {
            this.reconnectAttempts++;
            console.log(`🔄 阿里云IoT重连中... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            this.broadcastStatus(`阿里云IoT重连中 (${this.reconnectAttempts})`);
        });

        // 连接错误事件
        this.device.on('error', (error) => {
            console.error('❌ 阿里云IoT连接错误:', error);
            this.broadcastStatus('阿里云IoT连接错误: ' + error.message);
        });

        // 离线事件
        this.device.on('offline', () => {
            console.log('📴 阿里云IoT设备离线');
            this.isConnected = false;
            this.broadcastStatus('阿里云IoT设备离线');
        });

        // 属性设置事件(下行数据)
        this.device.on('props', (data) => {
            this.handlePropertySet(data);
        });

        // 服务调用事件
        this.device.on('service', (data) => {
            console.log('🔧 收到服务调用:', data);
        });
    }

    // 处理属性设置(下行数据)
    handlePropertySet(data) {
        try {
            console.log('📥 收到阿里云属性设置:', data);

            // 数据映射和验证
            const sensorData = {
                temperature: this.validateNumber(data.temperature, '温度'),
                humidity: this.validateNumber(data.Humidity, '湿度'),
                light: this.validateNumber(data.LightLux, '光照值'),
                pwm: this.validateNumber(data.pwm, 'PWM占空比'),
                timestamp: Date.now()
            };

            // 检查是否有有效数据
            const hasValidData = Object.values(sensorData).some(value =>
                value !== null && !isNaN(value) && typeof value === 'number'
            );

            if (hasValidData) {
                // 更新传感器数据
                const updatedData = this.sensorData.updateData(sensorData);

                // 通过WebSocket广播更新
                this.io.emit('sensor-data', updatedData);
                this.io.emit('aliyun-data', {
                    source: 'aliyun-iot',
                    data: updatedData,
                    timestamp: Date.now()
                });

                console.log('📊 阿里云数据已更新并广播:', {
                    temperature: sensorData.temperature?.toFixed(1),
                    humidity: sensorData.humidity?.toFixed(1),
                    light: Math.round(sensorData.light || 0),
                    pwm: Math.round(sensorData.pwm || 0)
                });
            } else {
                console.warn('⚠️ 阿里云数据中未检测到有效的传感器数据');
            }

        } catch (error) {
            console.error('❌ 阿里云属性设置处理失败:', error);
        }
    }

    // 验证数值类型数据
    validateNumber(value, name) {
        if (value === null || value === undefined) {
            return null;
        }

        const numValue = Number(value);
        if (isNaN(numValue)) {
            console.warn(`⚠️ ${name}数据格式错误:`, value);
            return null;
        }

        return numValue;
    }

    // 连接到阿里云IoT
    async connect() {
        try {
            if (!this.device) {
                const initSuccess = await this.init();
                if (!initSuccess) {
                    return false;
                }
            }

            if (this.isConnected) {
                console.log('🔌 阿里云IoT已连接');
                return true;
            }

            console.log('🔌 阿里云IoT设备已创建，等待连接事件...');
            this.broadcastStatus('阿里云IoT设备已创建，等待连接...');

            // 阿里云SDK在创建设备时会自动连接，我们只需要等待连接事件
            return true;

        } catch (error) {
            console.error('❌ 阿里云IoT连接失败:', error);
            this.broadcastStatus('阿里云IoT连接失败: ' + error.message);
            return false;
        }
    }

    // 断开连接
    disconnect() {
        if (this.device && this.isConnected) {
            this.device.end();
            this.isConnected = false;
            this.broadcastStatus('阿里云IoT已断开');
            console.log('🔌 阿里云IoT连接已断开');
        }
    }

    // 上报属性数据
    async postProps(data) {
        if (!this.isConnected) {
            console.warn('⚠️ 阿里云IoT未连接，无法上报数据');
            return false;
        }

        try {
            // 格式化数据为阿里云标准格式
            const aliyunData = {
                temperature: data.temperature,
                Humidity: data.humidity,
                LightLux: data.light,
                pwm: data.pwm
            };

            await this.device.postProps(aliyunData);
            console.log('📤 数据上报成功:', aliyunData);
            return true;

        } catch (error) {
            console.error('❌ 数据上报失败:', error);
            return false;
        }
    }

    // 广播状态更新
    broadcastStatus(status) {
        if (this.io) {
            this.io.emit('aliyun-status', {
                status: status,
                connected: this.isConnected,
                timestamp: Date.now()
            });
        }
    }

    // 获取连接状态
    getStatus() {
        return {
            connected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts,
            maxReconnectAttempts: this.maxReconnectAttempts,
            config: {
                productKey: this.config.PRODUCT_KEY,
                deviceName: this.config.DEVICE_NAME,
                region: this.config.REGION_ID
            }
        };
    }

    // 自动启动(如果配置完整)
    async autoStart() {
        if (this.validateConfig()) {
            console.log('🚀 检测到完整的阿里云配置，自动启动IoT连接...');
            const initSuccess = await this.init();
            if (initSuccess) {
                // 延迟连接，避免启动时的网络问题
                setTimeout(() => {
                    this.connect().catch(error => {
                        console.error('❌ 自动连接阿里云IoT失败:', error);
                    });
                }, 2000);
            }
        } else {
            console.log('ℹ️ 阿里云三元组配置不完整，跳过自动连接');
        }
    }
}

module.exports = AliyunIotService;
