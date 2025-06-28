// 前端API客户端 - 支持后端API和WebSocket
class FrontendApiClient {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.apiBaseUrl = window.location.origin + '/api';
        this.displayController = new DisplayController();
        this.currentData = {
            temperature: 25.6,
            humidity: 65.2,
            light: 750,
            pwm: 85
        };
        this.connectionMode = 'none'; // 'none', 'websocket', 'api'
        this.chartManager = new ChartManager(this.apiBaseUrl);
    }

    // 初始化应用
    init() {
        this.displayController.updateDisplay(this.currentData);
        this.bindEvents();
        this.chartManager.init();
        this.updateConnectionStatus('未连接');
        console.log('🚀 前端API客户端初始化完成');
    }

    // 绑定事件
    bindEvents() {
        // WebSocket连接按钮
        const wsBtn = document.getElementById('websocket-btn');
        if (wsBtn) {
            wsBtn.addEventListener('click', () => {
                if (this.isConnected && this.connectionMode === 'websocket') {
                    this.disconnectWebSocket();
                } else {
                    this.connectWebSocket();
                }
            });
        }



        // API测试按钮
        const apiBtn = document.getElementById('api-test-btn');
        if (apiBtn) {
            apiBtn.addEventListener('click', () => {
                this.testApi();
            });
        }

        // 阿里云IoT连接按钮
        const aliyunBtn = document.getElementById('aliyun-btn');
        if (aliyunBtn) {
            aliyunBtn.addEventListener('click', () => {
                this.toggleAliyunIot();
            });
        }

        // 键盘快捷键
        document.addEventListener('keydown', (event) => {
            if (event.key === ' ') { // 空格键手动刷新
                event.preventDefault();
                this.fetchDataFromApi();
            }
        });
    }

    // 连接WebSocket
    async connectWebSocket() {
        try {
            this.updateConnectionStatus('连接中...');

            this.socket = io();

            this.socket.on('connect', () => {
                console.log('🔌 WebSocket连接成功');
                this.isConnected = true;
                this.connectionMode = 'websocket';
                this.updateConnectionStatus('WebSocket已连接');
                this.updateButtonState('websocket-btn', 'connected', '断开WebSocket');
            });

            this.socket.on('disconnect', () => {
                console.log('🔌 WebSocket连接断开');
                this.isConnected = false;
                this.connectionMode = 'none';
                this.updateConnectionStatus('WebSocket已断开');
                this.updateButtonState('websocket-btn', '', '连接WebSocket');
            });

            this.socket.on('sensor-data', (data) => {
                console.log('📊 收到WebSocket数据:', data);
                this.currentData = data;
                this.displayController.updateDisplay(data);
            });

            // 监听阿里云IoT数据
            this.socket.on('aliyun-data', (data) => {
                console.log('☁️ 收到阿里云IoT数据:', data);
                this.currentData = data.data;
                this.displayController.updateDisplay(data.data);
                this.updateConnectionStatus('阿里云IoT数据已更新');
            });

            // 监听阿里云IoT状态
            this.socket.on('aliyun-status', (status) => {
                console.log('☁️ 阿里云IoT状态更新:', status);
                this.updateAliyunStatus(status);
            });

            this.socket.on('connect_error', (error) => {
                console.error('❌ WebSocket连接错误:', error);
                this.updateConnectionStatus('WebSocket连接失败');
                this.updateButtonState('websocket-btn', 'error', '重试连接');
            });

        } catch (error) {
            console.error('❌ WebSocket初始化失败:', error);
            this.updateConnectionStatus('WebSocket初始化失败');
            this.updateButtonState('websocket-btn', 'error', '重试连接');
        }
    }

    // 断开WebSocket
    disconnectWebSocket() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.isConnected = false;
        this.connectionMode = 'none';
        this.updateConnectionStatus('已断开');
        this.updateButtonState('websocket-btn', '', '连接WebSocket');
    }

    // 从API获取数据
    async fetchDataFromApi() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/sensors`);
            const result = await response.json();

            if (result.success) {
                console.log('📊 API数据获取成功:', result.data);
                this.currentData = result.data;
                this.displayController.updateDisplay(result.data);
                this.connectionMode = 'api';
                this.updateConnectionStatus('API数据已更新');
            } else {
                throw new Error(result.error || 'API请求失败');
            }
        } catch (error) {
            console.error('❌ API数据获取失败:', error);
            this.updateConnectionStatus('API请求失败');
        }
    }

    // 测试API
    async testApi() {
        this.updateButtonState('api-test-btn', '', '测试中...');

        try {
            // 测试健康检查
            const healthResponse = await fetch(`${this.apiBaseUrl}/health`);
            const healthResult = await healthResponse.json();

            if (healthResult.success) {
                console.log('✅ 健康检查通过:', healthResult);

                // 获取传感器数据
                await this.fetchDataFromApi();

                this.updateButtonState('api-test-btn', 'connected', 'API正常');
                setTimeout(() => {
                    this.updateButtonState('api-test-btn', '', '测试API');
                }, 2000);
            } else {
                throw new Error('健康检查失败');
            }
        } catch (error) {
            console.error('❌ API测试失败:', error);
            this.updateButtonState('api-test-btn', 'error', 'API异常');
            setTimeout(() => {
                this.updateButtonState('api-test-btn', '', '测试API');
            }, 2000);
        }
    }



    // 更新连接状态
    updateConnectionStatus(status) {
        const statusElement = document.getElementById('connection-status');
        if (statusElement) {
            statusElement.textContent = status;
        }
    }

    // 切换阿里云IoT连接
    async toggleAliyunIot() {
        try {
            // 先获取当前状态
            const statusResponse = await fetch(`${this.apiBaseUrl}/aliyun/status`);
            const statusResult = await statusResponse.json();

            if (statusResult.success && statusResult.data.connected) {
                // 如果已连接，则断开
                await this.disconnectAliyunIot();
            } else {
                // 如果未连接，则连接
                await this.connectAliyunIot();
            }
        } catch (error) {
            console.error('❌ 阿里云IoT操作失败:', error);
            this.updateConnectionStatus('阿里云IoT操作失败');
        }
    }

    // 连接阿里云IoT
    async connectAliyunIot() {
        try {
            this.updateButtonState('aliyun-btn', '', '连接中...');
            this.updateConnectionStatus('正在连接阿里云IoT...');

            const response = await fetch(`${this.apiBaseUrl}/aliyun/connect`, {
                method: 'POST'
            });
            const result = await response.json();

            if (result.success) {
                this.updateButtonState('aliyun-btn', 'connected', '断开阿里云IoT');
                this.updateConnectionStatus('阿里云IoT连接成功');
                console.log('☁️ 阿里云IoT连接成功');
            } else {
                throw new Error(result.message || '连接失败');
            }
        } catch (error) {
            console.error('❌ 阿里云IoT连接失败:', error);
            this.updateButtonState('aliyun-btn', 'error', '连接失败');
            this.updateConnectionStatus('阿里云IoT连接失败: ' + error.message);
            setTimeout(() => {
                this.updateButtonState('aliyun-btn', '', '连接阿里云IoT');
            }, 3000);
        }
    }

    // 断开阿里云IoT
    async disconnectAliyunIot() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/aliyun/disconnect`, {
                method: 'POST'
            });
            const result = await response.json();

            if (result.success) {
                this.updateButtonState('aliyun-btn', '', '连接阿里云IoT');
                this.updateConnectionStatus('阿里云IoT已断开');
                console.log('☁️ 阿里云IoT已断开');
            } else {
                throw new Error(result.message || '断开失败');
            }
        } catch (error) {
            console.error('❌ 阿里云IoT断开失败:', error);
            this.updateConnectionStatus('阿里云IoT断开失败: ' + error.message);
        }
    }

    // 更新阿里云IoT状态显示
    updateAliyunStatus(status) {
        if (status.connected) {
            this.updateButtonState('aliyun-btn', 'connected', '断开阿里云IoT');
            this.updateConnectionStatus(`阿里云IoT已连接 (${status.status})`);
        } else {
            this.updateButtonState('aliyun-btn', '', '连接阿里云IoT');
            this.updateConnectionStatus(`阿里云IoT未连接 (${status.status})`);
        }
    }

    // 更新按钮状态
    updateButtonState(buttonId, className, text) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.className = 'connect-btn ' + (className || '');
            if (text) {
                button.textContent = text;
            }
        }
    }
}

// 显示控制器类
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

        this.updateProgress('temp-progress', data.temperature, 0, 50);
        this.updateProgress('humidity-progress', data.humidity, 0, 100);
        this.updateProgress('light-progress', data.light, 0, 1000);
        this.updateProgress('pwm-progress', data.pwm, 0, 100);

        this.updateTimestamp();
    }

    // 更新数值显示
    updateValue(elementId, value, unit, decimals) {
        const element = this.elements[elementId];
        if (element) {
            const displayValue = decimals > 0 ? value.toFixed(decimals) : Math.round(value);
            element.textContent = displayValue;

            // 添加数值变化动画
            element.style.transform = 'scale(1.1)';
            setTimeout(() => {
                element.style.transform = 'scale(1)';
            }, 200);
        }
    }

    // 更新进度条
    updateProgress(elementId, value, min, max) {
        const element = this.elements[elementId];
        if (element) {
            const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
            element.style.width = percentage + '%';
        }
    }

    // 更新时间戳
    updateTimestamp() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('zh-CN');
        if (this.elements.lastUpdate) {
            this.elements.lastUpdate.textContent = timeString;
        }
    }
}

// 图表管理器类
class ChartManager {
    constructor(apiBaseUrl) {
        this.apiBaseUrl = apiBaseUrl;
        this.chart = null;
        this.currentSensorType = null;
        this.currentTimeRange = '1h';
        this.modal = null;
        this.isLoading = false;
    }

    // 初始化图表管理器
    init() {
        this.modal = document.getElementById('chartModal');
        this.bindEvents();
        console.log('📊 图表管理器初始化完成');
    }

    // 绑定事件
    bindEvents() {
        // 卡片点击事件
        document.querySelectorAll('.card.clickable').forEach(card => {
            card.addEventListener('click', (e) => {
                const sensorType = card.getAttribute('data-sensor');
                this.openChart(sensorType);
            });
        });

        // 模态框关闭事件
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeChart();
        });

        // 点击模态框外部关闭
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeChart();
            }
        });

        // ESC键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'block') {
                this.closeChart();
            }
        });

        // 时间范围选择
        document.getElementById('timeRangeSelect').addEventListener('change', (e) => {
            this.currentTimeRange = e.target.value;
            if (this.currentSensorType) {
                this.loadChartData(this.currentSensorType, this.currentTimeRange);
            }
        });

        // 刷新按钮
        document.getElementById('refreshChart').addEventListener('click', () => {
            if (this.currentSensorType) {
                this.loadChartData(this.currentSensorType, this.currentTimeRange);
            }
        });
    }

    // 打开图表
    async openChart(sensorType) {
        this.currentSensorType = sensorType;
        this.modal.style.display = 'block';

        // 设置标题
        const titles = {
            temperature: '温度趋势图',
            humidity: '湿度趋势图',
            light: '光感趋势图',
            pwm: 'PWM趋势图'
        };
        document.getElementById('chartTitle').textContent = titles[sensorType] || '传感器数据趋势';

        // 加载数据
        await this.loadChartData(sensorType, this.currentTimeRange);
    }

    // 关闭图表
    closeChart() {
        this.modal.style.display = 'none';
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
        this.currentSensorType = null;
    }

    // 加载图表数据
    async loadChartData(sensorType, timeRange) {
        if (this.isLoading) return;

        this.isLoading = true;
        this.showLoading(true);

        try {
            const response = await fetch(`${this.apiBaseUrl}/sensors/chart/${sensorType}?timeRange=${timeRange}`);
            const result = await response.json();

            if (result.success) {
                this.renderChart(result.data);
            } else {
                throw new Error(result.error || '获取图表数据失败');
            }
        } catch (error) {
            console.error('❌ 图表数据加载失败:', error);
            this.showError('图表数据加载失败: ' + error.message);
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
    }

    // 渲染图表
    renderChart(data) {
        const canvas = document.getElementById('sensorChart');
        const ctx = canvas.getContext('2d');

        // 销毁现有图表
        if (this.chart) {
            this.chart.destroy();
        }

        // 获取传感器配置
        const sensorConfig = this.getSensorConfig(data.type);

        // 创建新图表
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.timestamps,
                datasets: [{
                    label: `${sensorConfig.name} (${data.unit})`,
                    data: data.values,
                    borderColor: sensorConfig.color,
                    backgroundColor: sensorConfig.backgroundColor,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    pointBackgroundColor: sensorConfig.color,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    title: {
                        display: true,
                        text: `${sensorConfig.name}数据趋势 (${this.getTimeRangeText(data.timeRange)})`,
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        padding: 20
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: sensorConfig.color,
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            title: function(context) {
                                const date = new Date(context[0].parsed.x);
                                return date.toLocaleString('zh-CN');
                            },
                            label: function(context) {
                                return `${sensorConfig.name}: ${context.parsed.y.toFixed(1)} ${data.unit}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            displayFormats: {
                                minute: 'HH:mm',
                                hour: 'HH:mm',
                                day: 'MM-DD HH:mm'
                            }
                        },
                        title: {
                            display: true,
                            text: '时间'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: `${sensorConfig.name} (${data.unit})`
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        beginAtZero: sensorConfig.beginAtZero
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                }
            }
        });

        canvas.style.display = 'block';
        console.log(`📊 ${sensorConfig.name}图表渲染完成，数据点数: ${data.count}`);
    }

    // 获取传感器配置
    getSensorConfig(type) {
        const configs = {
            temperature: {
                name: '温度',
                color: '#e74c3c',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                beginAtZero: false
            },
            humidity: {
                name: '湿度',
                color: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                beginAtZero: true
            },
            light: {
                name: '光感',
                color: '#f1c40f',
                backgroundColor: 'rgba(241, 196, 15, 0.1)',
                beginAtZero: true
            },
            pwm: {
                name: 'PWM',
                color: '#9b59b6',
                backgroundColor: 'rgba(155, 89, 182, 0.1)',
                beginAtZero: true
            }
        };
        return configs[type] || configs.temperature;
    }

    // 获取时间范围文本
    getTimeRangeText(timeRange) {
        const texts = {
            '1m': '最近1分钟',
            '10m': '最近10分钟',
            '1h': '最近1小时',
            '24h': '最近24小时'
        };
        return texts[timeRange] || '未知时间范围';
    }

    // 显示/隐藏加载状态
    showLoading(show) {
        const loading = document.getElementById('chartLoading');
        const canvas = document.getElementById('sensorChart');

        if (show) {
            loading.style.display = 'flex';
            canvas.style.display = 'none';
        } else {
            loading.style.display = 'none';
        }
    }

    // 显示错误信息
    showError(message) {
        const loading = document.getElementById('chartLoading');
        loading.innerHTML = `❌ ${message}`;
        loading.style.display = 'flex';
        loading.style.color = '#e74c3c';

        setTimeout(() => {
            loading.innerHTML = '加载中...';
            loading.style.color = '#666';
        }, 3000);
    }
}

// 页面加载完成后启动应用
document.addEventListener('DOMContentLoaded', () => {
    const apiClient = new FrontendApiClient();
    apiClient.init();

    // 全局暴露实例，方便调试
    window.apiClient = apiClient;

    console.log('🌐 前端API客户端已启动');
    console.log('💡 使用说明:');
    console.log('  - 点击"连接WebSocket"按钮建立实时连接');
    console.log('  - 点击"连接阿里云IoT"按钮连接IoT平台');
    console.log('  - 点击"测试API"按钮测试后端API');
    console.log('  - 点击传感器卡片查看历史数据趋势图');
    console.log('  - 按空格键手动刷新API数据');
});
