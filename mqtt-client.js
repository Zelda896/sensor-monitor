// 阿里云MQTT客户端类
class AliyunMqttClient {
    constructor(config) {
        this.config = config;
        this.client = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.onDataReceived = null; // 数据接收回调
        this.onStatusChanged = null; // 状态变化回调
        this.subscribeTopics = []; // 订阅的主题列表
    }

    // 初始化MQTT客户端
    async init() {
        try {
            // 检查阿里云SDK是否加载
            if (typeof Device === 'undefined') {
                throw new Error('阿里云IoT SDK未加载，请检查网络连接');
            }

            // 构建连接参数
            const options = this.buildConnectionOptions();

            // 创建设备实例
            this.client = new Device(options);

            // 绑定事件监听器
            this.bindEventListeners();

            console.log('MQTT客户端初始化成功');
            return true;
        } catch (error) {
            console.error('MQTT客户端初始化失败:', error);
            this.updateStatus('初始化失败: ' + error.message);
            return false;
        }
    }

    // 构建连接参数
    buildConnectionOptions() {
        const { PRODUCT_KEY, DEVICE_NAME, DEVICE_SECRET, REGION_ID, MQTT_CONFIG } = this.config;

        return {
            productKey: PRODUCT_KEY,
            deviceName: DEVICE_NAME,
            deviceSecret: DEVICE_SECRET,
            region: REGION_ID,
            // WebSocket连接配置
            protocol: 'wss',
            connectTimeout: MQTT_CONFIG.CONNECT_TIMEOUT,
            keepalive: MQTT_CONFIG.KEEPALIVE,
            // 自动重连配置
            reconnectPeriod: MQTT_CONFIG.RECONNECT_INTERVAL,
            // 清除会话
            clean: true
        };
    }

    // 绑定事件监听器
    bindEventListeners() {
        // 连接成功事件
        this.client.on('connect', () => {
            console.log('MQTT连接成功');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.updateStatus('已连接');
            this.subscribeToTopics();
        });

        // 连接断开事件
        this.client.on('disconnect', () => {
            console.log('MQTT连接断开');
            this.isConnected = false;
            this.updateStatus('连接断开');
        });

        // 重连事件
        this.client.on('reconnect', () => {
            this.reconnectAttempts++;
            console.log(`MQTT重连中... (${this.reconnectAttempts}/${this.config.MQTT_CONFIG.MAX_RECONNECT_ATTEMPTS})`);
            this.updateStatus(`重连中 (${this.reconnectAttempts})`);
        });

        // 连接错误事件
        this.client.on('error', (error) => {
            console.error('MQTT连接错误:', error);
            this.updateStatus('连接错误: ' + error.message);
        });

        // 消息接收事件
        this.client.on('message', (topic, message) => {
            this.handleMessage(topic, message);
        });

        // 离线事件
        this.client.on('offline', () => {
            console.log('MQTT客户端离线');
            this.isConnected = false;
            this.updateStatus('离线');
        });
    }

    // 连接到阿里云
    async connect() {
        try {
            if (!this.client) {
                const initSuccess = await this.init();
                if (!initSuccess) return false;
            }

            this.updateStatus('连接中...');

            // 开始连接
            await this.client.connect();
            return true;
        } catch (error) {
            console.error('MQTT连接失败:', error);
            this.updateStatus('连接失败: ' + error.message);
            return false;
        }
    }

    // 断开连接
    disconnect() {
        if (this.client && this.isConnected) {
            this.client.end();
            this.isConnected = false;
            this.updateStatus('已断开');
            console.log('MQTT连接已断开');
        }
    }

    // 订阅主题
    subscribeToTopics() {
        const topics = this.buildSubscribeTopics();

        topics.forEach(topic => {
            this.client.subscribe(topic, (error) => {
                if (error) {
                    console.error(`订阅主题失败 ${topic}:`, error);
                } else {
                    console.log(`订阅主题成功: ${topic}`);
                    this.subscribeTopics.push(topic);
                }
            });
        });
    }

    // 构建订阅主题列表
    buildSubscribeTopics() {
        const { PRODUCT_KEY, DEVICE_NAME } = this.config;
        const topics = [];

        // 属性设置主题(下行数据)
        const propertySetTopic = this.config.TOPICS.PROPERTY_SET
            .replace('${productKey}', PRODUCT_KEY)
            .replace('${deviceName}', DEVICE_NAME);
        topics.push(propertySetTopic);

        return topics;
    }

    // 处理接收到的消息
    handleMessage(topic, message) {
        try {
            console.log(`收到消息 [${topic}]:`, message.toString());

            // 解析JSON数据
            const data = JSON.parse(message.toString());

            // 检查是否为属性设置消息
            if (topic.includes('/thing/service/property/set')) {
                this.handlePropertySetMessage(data);
            }

            // 触发数据接收回调
            if (this.onDataReceived) {
                this.onDataReceived(topic, data);
            }
        } catch (error) {
            console.error('消息处理失败:', error);
        }
    }

    // 处理属性设置消息(下行数据)
    handlePropertySetMessage(data) {
        try {
            // 提取传感器数据，使用阿里云标准标识符
            const params = data.params || {};

            // 数据映射和验证
            const sensorData = {
                temperature: this.validateNumber(params.temperature, '温度'),     // 温度
                humidity: this.validateNumber(params.Humidity, '湿度'),          // 湿度
                light: this.validateNumber(params.LightLux, '光照值'),           // 光照值
                pwm: this.validateNumber(params.pwm, 'PWM占空比'),              // PWM占空比
                timestamp: Date.now()
            };

            console.log('🔄 阿里云数据解析:');
            console.log('📥 原始数据:', params);
            console.log('📊 解析结果:', sensorData);

            // 检查是否有有效数据
            const hasValidData = Object.values(sensorData).some(value => value !== null && !isNaN(value));
            if (!hasValidData) {
                console.warn('⚠️ 未检测到有效的传感器数据');
                return;
            }

            // 触发数据更新
            if (this.onDataReceived) {
                this.onDataReceived('sensor_data', sensorData);
            }
        } catch (error) {
            console.error('❌ 属性设置消息处理失败:', error);
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

    // 发布消息
    publish(topic, message) {
        if (!this.isConnected) {
            console.warn('MQTT未连接，无法发布消息');
            return false;
        }

        try {
            const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
            this.client.publish(topic, messageStr);
            console.log(`消息发布成功 [${topic}]:`, messageStr);
            return true;
        } catch (error) {
            console.error('消息发布失败:', error);
            return false;
        }
    }

    // 更新连接状态
    updateStatus(status) {
        if (this.onStatusChanged) {
            this.onStatusChanged(status);
        }
    }

    // 获取连接状态
    getConnectionStatus() {
        return {
            connected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts,
            subscribedTopics: this.subscribeTopics.length
        };
    }

    // 设置数据接收回调
    setDataReceivedCallback(callback) {
        this.onDataReceived = callback;
    }

    // 设置状态变化回调
    setStatusChangedCallback(callback) {
        this.onStatusChanged = callback;
    }
}
