/**
 * 应用设置管理器
 * 负责管理应用的所有配置和用户偏好设置
 */
class SettingsManager {
    constructor() {
        this.settings = {};
        this.defaultSettings = {
            // 应用外观设置
            appearance: {
                theme: 'dark',
                fontSize: 'medium',
                language: 'zh-CN',
                showStatusBar: true,
                showSidebar: true,
                compactMode: false
            },
            
            // 性能设置
            performance: {
                enablePerformanceMonitoring: true,
                memoryWarningThreshold: 80,
                memoryCriticalThreshold: 95,
                autoCleanupInterval: 300000, // 5分钟
                enableResourceOptimization: true,
                maxConcurrentRequests: 3,
                requestTimeout: 30000
            },
            
            // 通知设置
            notifications: {
                enableNotifications: true,
                showSuccessNotifications: true,
                showErrorNotifications: true,
                showWarningNotifications: true,
                autoHideDelay: 5000,
                soundEnabled: false
            },
            
            // AI服务设置
            aiServices: {
                autoConnect: false,
                defaultService: 'chatgpt',
                enableServiceRotation: false,
                maxRetryAttempts: 3,
                connectionTimeout: 15000,
                enableServiceHealthCheck: true
            },
            
            // 安全设置
            security: {
                enableSandbox: true,
                blockExternalRequests: false,
                enableCookieIsolation: true,
                clearDataOnExit: false,
                enableSecureHeaders: true
            },
            
            // 开发者设置
            developer: {
                enableDevTools: false,
                enableVerboseLogging: false,
                enablePerformanceLogging: false,
                enableErrorReporting: true,
                debugMode: false
            },
            
            // 窗口设置
            window: {
                width: 1200,
                height: 800,
                minWidth: 800,
                minHeight: 600,
                rememberPosition: true,
                rememberSize: true,
                startMaximized: false,
                alwaysOnTop: false
            }
        };
        
        this.settingsFile = 'app-settings.json';
        this.listeners = new Map();
        this.validationRules = this.createValidationRules();
        
        this.init();
    }
    
    /**
     * 初始化设置管理器
     */
    async init() {
        try {
            await this.loadSettings();
            this.validateSettings();
            this.applySettings();
            
            // 监听设置变化
            this.setupSettingsWatcher();
            
            console.log('设置管理器初始化完成');
        } catch (error) {
            console.error('设置管理器初始化失败:', error);
            this.settings = { ...this.defaultSettings };
        }
    }
    
    /**
     * 加载设置
     */
    async loadSettings() {
        try {
            const stored = localStorage.getItem(this.settingsFile);
            if (stored) {
                const parsedSettings = JSON.parse(stored);
                this.settings = this.mergeSettings(this.defaultSettings, parsedSettings);
            } else {
                this.settings = { ...this.defaultSettings };
            }
        } catch (error) {
            console.error('加载设置失败:', error);
            this.settings = { ...this.defaultSettings };
        }
    }
    
    /**
     * 保存设置
     */
    async saveSettings() {
        try {
            localStorage.setItem(this.settingsFile, JSON.stringify(this.settings, null, 2));
            console.log('设置已保存');
            return true;
        } catch (error) {
            console.error('保存设置失败:', error);
            return false;
        }
    }
    
    /**
     * 获取设置值
     */
    get(path, defaultValue = null) {
        const keys = path.split('.');
        let value = this.settings;
        
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return defaultValue;
            }
        }
        
        return value;
    }
    
    /**
     * 设置值
     */
    async set(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let target = this.settings;
        
        // 导航到目标对象
        for (const key of keys) {
            if (!target[key] || typeof target[key] !== 'object') {
                target[key] = {};
            }
            target = target[key];
        }
        
        // 验证值
        if (!this.validateValue(path, value)) {
            throw new Error(`无效的设置值: ${path} = ${value}`);
        }
        
        const oldValue = target[lastKey];
        target[lastKey] = value;
        
        // 保存设置
        await this.saveSettings();
        
        // 触发变化事件
        this.notifyListeners(path, value, oldValue);
        
        // 应用设置
        this.applySetting(path, value);
        
        return true;
    }
    
    /**
     * 重置设置
     */
    async reset(section = null) {
        if (section) {
            this.settings[section] = { ...this.defaultSettings[section] };
        } else {
            this.settings = { ...this.defaultSettings };
        }
        
        await this.saveSettings();
        this.applySettings();
        this.notifyListeners('reset', this.settings, null);
    }
    
    /**
     * 导入设置
     */
    async importSettings(settingsData) {
        try {
            const imported = typeof settingsData === 'string' 
                ? JSON.parse(settingsData) 
                : settingsData;
            
            this.settings = this.mergeSettings(this.defaultSettings, imported);
            this.validateSettings();
            
            await this.saveSettings();
            this.applySettings();
            
            return true;
        } catch (error) {
            console.error('导入设置失败:', error);
            return false;
        }
    }
    
    /**
     * 导出设置
     */
    exportSettings() {
        return JSON.stringify(this.settings, null, 2);
    }
    
    /**
     * 添加设置变化监听器
     */
    addListener(path, callback) {
        if (!this.listeners.has(path)) {
            this.listeners.set(path, new Set());
        }
        this.listeners.get(path).add(callback);
    }
    
    /**
     * 移除设置变化监听器
     */
    removeListener(path, callback) {
        if (this.listeners.has(path)) {
            this.listeners.get(path).delete(callback);
        }
    }
    
    /**
     * 通知监听器
     */
    notifyListeners(path, newValue, oldValue) {
        // 通知具体路径的监听器
        if (this.listeners.has(path)) {
            this.listeners.get(path).forEach(callback => {
                try {
                    callback(newValue, oldValue, path);
                } catch (error) {
                    console.error('设置监听器执行失败:', error);
                }
            });
        }
        
        // 通知通配符监听器
        if (this.listeners.has('*')) {
            this.listeners.get('*').forEach(callback => {
                try {
                    callback(newValue, oldValue, path);
                } catch (error) {
                    console.error('设置监听器执行失败:', error);
                }
            });
        }
    }
    
    /**
     * 合并设置
     */
    mergeSettings(defaults, user) {
        const result = {};
        
        for (const key in defaults) {
            if (typeof defaults[key] === 'object' && defaults[key] !== null) {
                result[key] = this.mergeSettings(
                    defaults[key], 
                    user[key] || {}
                );
            } else {
                result[key] = user.hasOwnProperty(key) ? user[key] : defaults[key];
            }
        }
        
        return result;
    }
    
    /**
     * 验证设置
     */
    validateSettings() {
        for (const section in this.settings) {
            for (const key in this.settings[section]) {
                const path = `${section}.${key}`;
                const value = this.settings[section][key];
                
                if (!this.validateValue(path, value)) {
                    console.warn(`无效的设置值，使用默认值: ${path}`);
                    this.settings[section][key] = this.defaultSettings[section][key];
                }
            }
        }
    }
    
    /**
     * 验证单个值
     */
    validateValue(path, value) {
        const rule = this.validationRules[path];
        if (!rule) return true;
        
        return rule(value);
    }
    
    /**
     * 创建验证规则
     */
    createValidationRules() {
        return {
            'appearance.theme': (value) => ['light', 'dark', 'auto'].includes(value),
            'appearance.fontSize': (value) => ['small', 'medium', 'large'].includes(value),
            'appearance.language': (value) => ['zh-CN', 'en-US'].includes(value),
            'performance.memoryWarningThreshold': (value) => 
                typeof value === 'number' && value >= 50 && value <= 100,
            'performance.memoryCriticalThreshold': (value) => 
                typeof value === 'number' && value >= 80 && value <= 100,
            'performance.autoCleanupInterval': (value) => 
                typeof value === 'number' && value >= 60000,
            'performance.maxConcurrentRequests': (value) => 
                typeof value === 'number' && value >= 1 && value <= 10,
            'performance.requestTimeout': (value) => 
                typeof value === 'number' && value >= 5000 && value <= 120000,
            'notifications.autoHideDelay': (value) => 
                typeof value === 'number' && value >= 1000 && value <= 30000,
            'aiServices.maxRetryAttempts': (value) => 
                typeof value === 'number' && value >= 0 && value <= 10,
            'aiServices.connectionTimeout': (value) => 
                typeof value === 'number' && value >= 5000 && value <= 60000,
            'window.width': (value) => 
                typeof value === 'number' && value >= 400 && value <= 4000,
            'window.height': (value) => 
                typeof value === 'number' && value >= 300 && value <= 3000
        };
    }
    
    /**
     * 应用设置
     */
    applySettings() {
        this.applyTheme();
        this.applyFontSize();
        this.applyLanguage();
        this.applyPerformanceSettings();
        this.applyWindowSettings();
    }
    
    /**
     * 应用单个设置
     */
    applySetting(path, value) {
        const [section, key] = path.split('.');
        
        switch (section) {
            case 'appearance':
                if (key === 'theme') this.applyTheme();
                if (key === 'fontSize') this.applyFontSize();
                if (key === 'language') this.applyLanguage();
                break;
            case 'performance':
                this.applyPerformanceSettings();
                break;
            case 'window':
                this.applyWindowSettings();
                break;
        }
    }
    
    /**
     * 应用主题设置
     */
    applyTheme() {
        const theme = this.get('appearance.theme');
        document.documentElement.setAttribute('data-theme', theme);
        
        if (theme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        }
    }
    
    /**
     * 应用字体大小设置
     */
    applyFontSize() {
        const fontSize = this.get('appearance.fontSize');
        document.documentElement.setAttribute('data-font-size', fontSize);
    }
    
    /**
     * 应用语言设置
     */
    applyLanguage() {
        const language = this.get('appearance.language');
        document.documentElement.setAttribute('lang', language);
    }
    
    /**
     * 应用性能设置
     */
    applyPerformanceSettings() {
        if (window.memoryManager) {
            const warningThreshold = this.get('performance.memoryWarningThreshold');
            const criticalThreshold = this.get('performance.memoryCriticalThreshold');
            const cleanupInterval = this.get('performance.autoCleanupInterval');
            
            window.memoryManager.setThresholds(warningThreshold, criticalThreshold);
            window.memoryManager.setCleanupInterval(cleanupInterval);
        }
        
        if (window.cacheManager) {
            const maxRequests = this.get('performance.maxConcurrentRequests');
            window.cacheManager.setMaxConcurrentRequests(maxRequests);
        }
    }
    
    /**
     * 应用窗口设置
     */
    applyWindowSettings() {
        // 这些设置通常在主进程中处理
        // 这里只是记录，实际应用需要通过IPC通信
        const windowSettings = this.get('window');
        console.log('窗口设置:', windowSettings);
    }
    
    /**
     * 设置监听器
     */
    setupSettingsWatcher() {
        // 监听系统主题变化
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addListener(() => {
                if (this.get('appearance.theme') === 'auto') {
                    this.applyTheme();
                }
            });
        }
    }
    
    /**
     * 获取所有设置
     */
    getAllSettings() {
        return { ...this.settings };
    }
    
    /**
     * 获取默认设置
     */
    getDefaultSettings() {
        return { ...this.defaultSettings };
    }
    
    /**
     * 检查设置是否为默认值
     */
    isDefault(path) {
        const current = this.get(path);
        const defaultValue = this.getDefaultValue(path);
        return JSON.stringify(current) === JSON.stringify(defaultValue);
    }
    
    /**
     * 获取默认值
     */
    getDefaultValue(path) {
        const keys = path.split('.');
        let value = this.defaultSettings;
        
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return null;
            }
        }
        
        return value;
    }
    
    /**
     * 销毁设置管理器
     */
    destroy() {
        this.listeners.clear();
        this.settings = {};
    }
}

// 创建全局设置管理器实例
window.settingsManager = new SettingsManager();

// 导出设置管理器
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SettingsManager;
}