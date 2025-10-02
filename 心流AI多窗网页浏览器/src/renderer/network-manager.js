/**
 * 网络连接管理器
 * 负责管理网络连接状态、超时控制、重试机制和反自动化检测处理
 */
class NetworkManager {
    constructor() {
        this.connectionStatus = 'unknown';
        this.retryAttempts = new Map();
        this.activeRequests = new Map();
        this.config = {
            timeout: 30000,           // 30秒超时
            retryDelay: 2000,         // 重试延迟2秒
            maxRetries: 3,            // 最大重试次数
            connectionCheckInterval: 5000,  // 连接检查间隔
            antiAutomationRetryDelay: 10000, // 反自动化检测重试延迟
            maxAntiAutomationRetries: 2      // 反自动化检测最大重试次数
        };
        
        this.init();
    }

    /**
     * 初始化网络管理器
     */
    init() {
        this.setupNetworkMonitoring();
        this.setupConnectionStatusCheck();
        this.setupFetchInterceptor();
        console.log('网络管理器已初始化');
    }

    /**
     * 设置网络监控
     */
    setupNetworkMonitoring() {
        // 监听在线/离线状态
        window.addEventListener('online', () => {
            this.updateConnectionStatus('connected', '网络已连接');
            this.retryFailedRequests();
        });

        window.addEventListener('offline', () => {
            this.updateConnectionStatus('error', '网络连接断开');
        });

        // 初始状态检查
        this.checkNetworkStatus();
    }

    /**
     * 设置连接状态检查
     */
    setupConnectionStatusCheck() {
        setInterval(() => {
            this.checkNetworkStatus();
        }, this.config.connectionCheckInterval);
    }

    /**
     * 设置Fetch拦截器
     */
    setupFetchInterceptor() {
        const originalFetch = window.fetch;
        
        window.fetch = async (...args) => {
            const requestId = this.generateRequestId();
            const url = args[0];
            
            try {
                this.activeRequests.set(requestId, {
                    url,
                    startTime: Date.now(),
                    status: 'pending'
                });

                // 添加超时控制
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => {
                        reject(new Error(`Request timeout: ${url}`));
                    }, this.config.timeout);
                });

                const fetchPromise = originalFetch(...args);
                const response = await Promise.race([fetchPromise, timeoutPromise]);

                this.activeRequests.set(requestId, {
                    url,
                    startTime: Date.now(),
                    status: 'completed',
                    success: response.ok
                });

                return response;
            } catch (error) {
                this.activeRequests.set(requestId, {
                    url,
                    startTime: Date.now(),
                    status: 'failed',
                    error: error.message
                });

                // 处理网络错误
                await this.handleNetworkError(error, url, args);
                throw error;
            } finally {
                // 清理过期请求记录
                setTimeout(() => {
                    this.activeRequests.delete(requestId);
                }, 60000);
            }
        };
    }

    /**
     * 检查网络状态
     */
    async checkNetworkStatus() {
        try {
            // 尝试连接到一个可靠的服务
            const response = await fetch('https://www.google.com/favicon.ico', {
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-cache'
            });
            
            this.updateConnectionStatus('connected', '网络连接正常');
            return true;
        } catch (error) {
            this.updateConnectionStatus('error', '网络连接异常');
            return false;
        }
    }

    /**
     * 处理网络错误
     */
    async handleNetworkError(error, url, fetchArgs) {
        const errorType = this.categorizeNetworkError(error);
        
        switch (errorType) {
            case 'timeout':
                await this.handleTimeoutError(error, url, fetchArgs);
                break;
            case 'connection':
                await this.handleConnectionError(error, url, fetchArgs);
                break;
            case 'anti_automation':
                await this.handleAntiAutomationError(error, url, fetchArgs);
                break;
            default:
                console.warn('未知网络错误:', error);
        }
    }

    /**
     * 分类网络错误
     */
    categorizeNetworkError(error) {
        const message = error.message.toLowerCase();
        
        if (message.includes('timeout')) {
            return 'timeout';
        } else if (message.includes('network') || message.includes('connection')) {
            return 'connection';
        } else if (message.includes('blocked') || message.includes('forbidden') || 
                   message.includes('captcha') || message.includes('verification')) {
            return 'anti_automation';
        }
        
        return 'unknown';
    }

    /**
     * 处理超时错误
     */
    async handleTimeoutError(error, url, fetchArgs) {
        const retryKey = `timeout_${url}`;
        const attempts = this.retryAttempts.get(retryKey) || 0;

        if (attempts < this.config.maxRetries) {
            this.retryAttempts.set(retryKey, attempts + 1);
            
            console.log(`网络超时，正在重试 (${attempts + 1}/${this.config.maxRetries}): ${url}`);
            
            // 增加超时时间并重试
            await this.sleep(this.config.retryDelay * (attempts + 1));
            
            try {
                return await fetch(...fetchArgs);
            } catch (retryError) {
                if (attempts + 1 >= this.config.maxRetries) {
                    this.retryAttempts.delete(retryKey);
                    throw new Error(`网络请求重试失败: ${url}`);
                }
            }
        }
    }

    /**
     * 处理连接错误
     */
    async handleConnectionError(error, url, fetchArgs) {
        const retryKey = `connection_${url}`;
        const attempts = this.retryAttempts.get(retryKey) || 0;

        if (attempts < this.config.maxRetries) {
            this.retryAttempts.set(retryKey, attempts + 1);
            
            console.log(`连接错误，正在重试 (${attempts + 1}/${this.config.maxRetries}): ${url}`);
            
            // 等待网络恢复
            await this.waitForNetworkRecovery();
            
            try {
                return await fetch(...fetchArgs);
            } catch (retryError) {
                if (attempts + 1 >= this.config.maxRetries) {
                    this.retryAttempts.delete(retryKey);
                    throw new Error(`网络连接重试失败: ${url}`);
                }
            }
        }
    }

    /**
     * 处理反自动化检测错误
     */
    async handleAntiAutomationError(error, url, fetchArgs) {
        const retryKey = `anti_automation_${url}`;
        const attempts = this.retryAttempts.get(retryKey) || 0;

        if (attempts < this.config.maxAntiAutomationRetries) {
            this.retryAttempts.set(retryKey, attempts + 1);
            
            console.log(`检测到反自动化机制，等待后重试 (${attempts + 1}/${this.config.maxAntiAutomationRetries}): ${url}`);
            
            // 更新状态显示
            this.updateConnectionStatus('connecting', '正在处理验证...');
            
            // 等待更长时间
            await this.sleep(this.config.antiAutomationRetryDelay);
            
            // 通知适配器处理反自动化检测
            if (window.app && window.app.currentAdapter) {
                try {
                    await window.app.currentAdapter.handleAntiAutomation();
                } catch (handlerError) {
                    console.warn('反自动化处理失败:', handlerError);
                }
            }
            
            try {
                return await fetch(...fetchArgs);
            } catch (retryError) {
                if (attempts + 1 >= this.config.maxAntiAutomationRetries) {
                    this.retryAttempts.delete(retryKey);
                    this.updateConnectionStatus('error', '验证失败，请手动处理');
                    throw new Error(`反自动化检测处理失败: ${url}`);
                }
            }
        }
    }

    /**
     * 等待网络恢复
     */
    async waitForNetworkRecovery() {
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts) {
            if (navigator.onLine && await this.checkNetworkStatus()) {
                return true;
            }
            
            await this.sleep(1000);
            attempts++;
        }
        
        return false;
    }

    /**
     * 重试失败的请求
     */
    retryFailedRequests() {
        // 清除重试计数，允许重新尝试
        this.retryAttempts.clear();
        console.log('网络恢复，清除重试计数');
    }

    /**
     * 更新连接状态
     */
    updateConnectionStatus(status, text) {
        this.connectionStatus = status;
        
        if (window.app && window.app.updateConnectionStatus) {
            window.app.updateConnectionStatus(status, text);
        }
        
        // 触发状态变化事件
        window.dispatchEvent(new CustomEvent('networkStatusChange', {
            detail: { status, text }
        }));
    }

    /**
     * 生成请求ID
     */
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 睡眠函数
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 获取网络统计信息
     */
    getNetworkStats() {
        const activeCount = this.activeRequests.size;
        const retryCount = this.retryAttempts.size;
        
        return {
            connectionStatus: this.connectionStatus,
            activeRequests: activeCount,
            pendingRetries: retryCount,
            isOnline: navigator.onLine
        };
    }

    /**
     * 重置网络管理器
     */
    reset() {
        this.retryAttempts.clear();
        this.activeRequests.clear();
        this.updateConnectionStatus('ready', '就绪');
        console.log('网络管理器已重置');
    }

    /**
     * 销毁网络管理器
     */
    destroy() {
        this.retryAttempts.clear();
        this.activeRequests.clear();
        
        // 移除事件监听器
        window.removeEventListener('online', this.handleOnline);
        window.removeEventListener('offline', this.handleOffline);
        
        console.log('网络管理器已销毁');
    }
}

// 导出网络管理器
window.NetworkManager = NetworkManager;

// 自动初始化
if (typeof window !== 'undefined') {
    window.networkManager = new NetworkManager();
}