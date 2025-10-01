/**
 * AI服务适配器基类
 * 定义了所有AI服务适配器的通用接口和基础功能
 */
class BaseAdapter {
    constructor(config) {
        this.config = config;
        this.isInitialized = false;
        this.isReady = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.retryDelay = 1000;
    }

    /**
     * 初始化适配器
     * 子类必须实现此方法
     */
    async initialize() {
        try {
            throw new Error('initialize() method must be implemented by subclass');
        } catch (error) {
            console.error(`Failed to initialize ${this.config.name} adapter:`, error);
            
            // 使用错误处理器处理初始化错误
            if (typeof errorHandler !== 'undefined') {
                errorHandler.handleAdapterError(this.config.name, error, () => {
                    this.initialize();
                });
            }
            
            throw error;
        }
    }

    /**
     * 检查页面是否准备就绪
     * 子类必须实现此方法
     */
    async checkReady() {
        throw new Error('checkReady() method must be implemented by subclass');
    }

    /**
     * 发送消息到AI服务
     * 子类必须实现此方法
     */
    async sendMessage(message) {
        const startTime = performance.now();
        
        try {
            if (!this.isInitialized) {
                throw new Error('Adapter not initialized');
            }
            
            const response = await this.doSendMessage(message);
            const duration = performance.now() - startTime;
            
            // 记录性能数据
            if (typeof performanceMonitor !== 'undefined') {
                performanceMonitor.recordAdapterPerformance(this.config.name, 'sendMessage', duration, true);
            }
            
            // 更新最后活动时间
            this.lastActivity = Date.now();
            
            return response;
        } catch (error) {
            const duration = performance.now() - startTime;
            
            // 记录失败的性能数据
            if (typeof performanceMonitor !== 'undefined') {
                performanceMonitor.recordAdapterPerformance(this.config.name, 'sendMessage', duration, false);
            }
            
            console.error(`Failed to send message in ${this.config.name}:`, error);
            
            // 使用错误处理器处理发送消息错误
            if (typeof errorHandler !== 'undefined') {
                errorHandler.handleAdapterError(this.config.name, error, () => {
                    this.sendMessage(message);
                });
            }
            
            throw error;
        }
    }

    /**
     * 实际发送消息的方法
     * 子类必须实现此方法
     */
    async doSendMessage(message) {
        throw new Error('doSendMessage() method must be implemented by subclass');
    }

    /**
     * 获取AI响应
     * 子类必须实现此方法
     */
    async getResponse() {
        throw new Error('getResponse() method must be implemented by subclass');
    }

    /**
     * 清空对话
     * 子类可以重写此方法
     */
    async clearConversation() {
        console.log('clearConversation() not implemented for this adapter');
    }

    /**
     * 获取对话历史
     * 子类可以重写此方法
     */
    async getConversationHistory() {
        console.log('getConversationHistory() not implemented for this adapter');
        return [];
    }

    /**
     * 等待元素出现
     */
    async waitForElement(selector, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const checkElement = () => {
                const element = document.querySelector(selector);
                if (element) {
                    resolve(element);
                    return;
                }
                
                if (Date.now() - startTime > timeout) {
                    reject(new Error(`Element ${selector} not found within ${timeout}ms`));
                    return;
                }
                
                setTimeout(checkElement, 100);
            };
            
            checkElement();
        });
    }

    /**
     * 等待指定时间
     */
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 获取输入延迟（毫秒）
     * 优先从设置管理器读取；若不可用则默认500ms
     */
    getInputDelay() {
        try {
            const defaultDelay = 500;
            if (typeof window !== 'undefined' && window.settingsManager) {
                const val = window.settingsManager.get('aiServices.inputDelay');
                if (typeof val === 'number' && val >= 0) return val;
            }
            return defaultDelay;
        } catch (e) {
            return 500;
        }
    }

    /**
     * 安全地点击元素
     */
    async safeClick(element) {
        if (!element) return false;
        
        try {
            // 确保元素可见和可点击
            if (element.offsetParent === null) {
                console.warn('Element is not visible');
                return false;
            }
            
            element.click();
            return true;
        } catch (error) {
            console.error('Click failed:', error);
            return false;
        }
    }

    /**
     * 安全地输入文本
     */
    async safeInput(element, text) {
        if (!element) return false;
        
        try {
            // 清空现有内容
            element.value = '';
            element.textContent = '';
            
            // 输入新文本
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.value = text;
                element.dispatchEvent(new Event('input', { bubbles: true }));
                element.dispatchEvent(new Event('change', { bubbles: true }));
            } else {
                element.textContent = text;
                element.dispatchEvent(new Event('input', { bubbles: true }));
            }
            
            return true;
        } catch (error) {
            console.error('Input failed:', error);
            return false;
        }
    }

    /**
     * 重试机制
     */
    async retry(operation, maxRetries = this.maxRetries) {
        let lastError;
        
        for (let i = 0; i <= maxRetries; i++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                console.warn(`Operation failed (attempt ${i + 1}/${maxRetries + 1}):`, error.message);
                
                if (i < maxRetries) {
                    await this.sleep(this.retryDelay * (i + 1));
                }
            }
        }
        
        throw lastError;
    }

    /**
     * 检测反自动化机制
     */
    async detectAntiAutomation() {
        const indicators = [
            // 检查是否有验证码
            'iframe[src*="captcha"]',
            '[class*="captcha"]',
            '[id*="captcha"]',
            
            // 检查是否有反机器人检测
            '[class*="cloudflare"]',
            '[class*="challenge"]',
            '[id*="challenge"]',
            
            // 检查是否被阻止
            '[class*="blocked"]',
            '[class*="forbidden"]',
            'text*="Access denied"',
            'text*="Forbidden"'
        ];
        
        for (const selector of indicators) {
            if (document.querySelector(selector)) {
                return {
                    detected: true,
                    type: selector,
                    element: document.querySelector(selector)
                };
            }
        }
        
        return { detected: false };
    }

    /**
     * 获取页面状态信息
     */
    getPageInfo() {
        return {
            url: window.location.href,
            title: document.title,
            domain: window.location.hostname,
            readyState: document.readyState,
            timestamp: Date.now()
        };
    }

    /**
     * 记录日志
     */
    log(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${this.config.name}] [${level.toUpperCase()}] ${message}`;
        
        console[level](logMessage, data || '');
        
        // 发送日志到主进程（如果需要）
        if (window.aiAPI) {
            window.aiAPI.sendToMain({
                type: 'LOG',
                level,
                message: logMessage,
                data
            });
        }
    }

    /**
     * 获取适配器状态
     */
    getStatus() {
        return {
            name: this.config.name,
            isInitialized: this.isInitialized,
            isReady: this.isReady,
            retryCount: this.retryCount,
            pageInfo: this.getPageInfo()
        };
    }
}

// 导出基类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BaseAdapter;
} else {
    window.BaseAdapter = BaseAdapter;
}