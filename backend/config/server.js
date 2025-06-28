// 服务器配置文件
const SERVER_CONFIG = {
    PORT: process.env.PORT || 3000, // 服务器端口
    HOST: process.env.HOST || 'localhost', // 服务器主机
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*', // CORS允许的源
    
    // 传感器数据配置
    SENSOR_CONFIG: {
        UPDATE_INTERVAL: 2000, // 数据更新间隔(毫秒)
        TEMP_MIN: 0,          // 温度最小值
        TEMP_MAX: 50,         // 温度最大值
        HUMIDITY_MIN: 0,      // 湿度最小值
        HUMIDITY_MAX: 100,    // 湿度最大值
        LIGHT_MIN: 0,         // 光感最小值
        LIGHT_MAX: 1000,      // 光感最大值
        PWM_MIN: 0,           // PWM最小值
        PWM_MAX: 100          // PWM最大值
    },
    
    // Socket.io配置
    SOCKET_CONFIG: {
        CORS: {
            origin: process.env.CORS_ORIGIN || '*',
            methods: ['GET', 'POST']
        }
    }
};

module.exports = SERVER_CONFIG;
