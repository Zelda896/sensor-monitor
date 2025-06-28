// 阿里云IoT平台三元组配置
// 请在阿里云IoT控制台获取以下参数并填写
const ALIYUN_CONFIG = {
    // 产品密钥 - 在阿里云IoT控制台产品管理中获取
    PRODUCT_KEY: 'k1zfks5ATvF',
    
    // 设备名称 - 在阿里云IoT控制台设备管理中获取  
    DEVICE_NAME: 'rk3588_web',
    
    // 设备密钥 - 在阿里云IoT控制台设备管理中获取
    DEVICE_SECRET: 'f7a394d926c9e14e5182dee5218cd061',
    
    // 区域ID - 根据您的阿里云区域设置，如: cn-shanghai, ap-southeast-1等
    REGION_ID: 'cn-shanghai',
    
    // MQTT连接配置
    MQTT_CONFIG: {
        // 连接超时时间(毫秒)
        CONNECT_TIMEOUT: 10000,
        // 心跳间隔(秒)  
        KEEPALIVE: 60,
        // 重连间隔(毫秒)
        RECONNECT_INTERVAL: 5000,
        // 最大重连次数
        MAX_RECONNECT_ATTEMPTS: 10
    },
    
    // 主题配置 - 根据您的业务需求修改
    TOPICS: {
        // 数据上报主题
        PROPERTY_POST: '/sys/${productKey}/${deviceName}/thing/event/property/post',
        // 数据下发主题  
        PROPERTY_SET: '/sys/${productKey}/${deviceName}/thing/service/property/set',
        // 设备状态主题
        STATUS: '/sys/${productKey}/${deviceName}/thing/status'
    }
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ALIYUN_CONFIG; // Node.js环境
} else {
    window.ALIYUN_CONFIG = ALIYUN_CONFIG; // 浏览器环境
}
