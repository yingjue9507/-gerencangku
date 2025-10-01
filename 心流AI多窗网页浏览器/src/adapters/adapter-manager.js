/**
 * AI适配器管理器
 * 统一管理所有AI服务适配器
 */
class AdapterManager {
    constructor() {
        this.adapters = new Map();
        this.adapterClasses = new Map();
        this.initialized = false;
    }

    /**
     * 初始化适配器管理器
     */
    async initialize() {
        if (this.initialized) return;

        try {
            // 注册所有适配器类
            this.registerAdapterClasses();
            
            this.initialized = true;
            console.log('AdapterManager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize AdapterManager:', error);
            throw error;
        }
    }

    /**
     * 注册适配器类
     */
    registerAdapterClasses() {
        // 注册基础适配器
        if (typeof BaseAdapter !== 'undefined') {
            this.adapterClasses.set('BaseAdapter', BaseAdapter);
        }

        // 注册ChatGPT适配器
        if (typeof ChatGPTAdapter !== 'undefined') {
            this.adapterClasses.set('ChatGPTAdapter', ChatGPTAdapter);
        }

        // 注册Claude适配器
        if (typeof ClaudeAdapter !== 'undefined') {
            this.adapterClasses.set('ClaudeAdapter', ClaudeAdapter);
        }

        // 注册Gemini适配器
        if (typeof GeminiAdapter !== 'undefined') {
            this.adapterClasses.set('GeminiAdapter', GeminiAdapter);
        }

        // 注册Copilot适配器
        if (typeof CopilotAdapter !== 'undefined') {
            this.adapterClasses.set('CopilotAdapter', CopilotAdapter);
        }

        console.log(`Registered ${this.adapterClasses.size} adapter classes`);
    }

    /**
     * 创建适配器实例
     * @param {string} adapterType - 适配器类型
     * @param {Object} config - 配置对象
     * @returns {BaseAdapter} 适配器实例
     */
    createAdapter(adapterType, config) {
        if (!this.initialized) {
            throw new Error('AdapterManager not initialized');
        }

        const AdapterClass = this.adapterClasses.get(adapterType);
        if (!AdapterClass) {
            throw new Error(`Unknown adapter type: ${adapterType}`);
        }

        try {
            const adapter = new AdapterClass(config);
            const adapterId = `${adapterType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            this.adapters.set(adapterId, adapter);
            
            console.log(`Created adapter instance: ${adapterId} (${adapterType})`);
            return { id: adapterId, adapter };
        } catch (error) {
            console.error(`Failed to create adapter ${adapterType}:`, error);
            throw error;
        }
    }

    /**
     * 获取适配器实例
     * @param {string} adapterId - 适配器ID
     * @returns {BaseAdapter|null} 适配器实例
     */
    getAdapter(adapterId) {
        return this.adapters.get(adapterId) || null;
    }

    /**
     * 移除适配器实例
     * @param {string} adapterId - 适配器ID
     */
    removeAdapter(adapterId) {
        const adapter = this.adapters.get(adapterId);
        if (adapter) {
            try {
                // 清理适配器资源
                if (typeof adapter.cleanup === 'function') {
                    adapter.cleanup();
                }
            } catch (error) {
                console.warn(`Error cleaning up adapter ${adapterId}:`, error);
            }
            
            this.adapters.delete(adapterId);
            console.log(`Removed adapter: ${adapterId}`);
        }
    }

    /**
     * 获取所有适配器实例
     * @returns {Map} 适配器实例映射
     */
    getAllAdapters() {
        return new Map(this.adapters);
    }

    /**
     * 获取支持的适配器类型列表
     * @returns {Array} 适配器类型数组
     */
    getSupportedAdapterTypes() {
        return Array.from(this.adapterClasses.keys()).filter(type => type !== 'BaseAdapter');
    }

    /**
     * 检查适配器类型是否支持
     * @param {string} adapterType - 适配器类型
     * @returns {boolean} 是否支持
     */
    isAdapterTypeSupported(adapterType) {
        return this.adapterClasses.has(adapterType) && adapterType !== 'BaseAdapter';
    }

    /**
     * 获取适配器统计信息
     * @returns {Object} 统计信息
     */
    getStats() {
        const stats = {
            totalAdapters: this.adapters.size,
            supportedTypes: this.getSupportedAdapterTypes().length,
            adaptersByType: {}
        };

        // 统计各类型适配器数量
        this.adapters.forEach(adapter => {
            const type = adapter.constructor.name;
            stats.adaptersByType[type] = (stats.adaptersByType[type] || 0) + 1;
        });

        return stats;
    }

    /**
     * 清理所有适配器
     */
    cleanup() {
        console.log('Cleaning up all adapters...');
        
        this.adapters.forEach((adapter, adapterId) => {
            try {
                if (typeof adapter.cleanup === 'function') {
                    adapter.cleanup();
                }
            } catch (error) {
                console.warn(`Error cleaning up adapter ${adapterId}:`, error);
            }
        });

        this.adapters.clear();
        console.log('All adapters cleaned up');
    }

    /**
     * 重置适配器管理器
     */
    reset() {
        this.cleanup();
        this.adapterClasses.clear();
        this.initialized = false;
        console.log('AdapterManager reset');
    }
}

// 创建全局适配器管理器实例
const adapterManager = new AdapterManager();

// 导出适配器管理器
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AdapterManager, adapterManager };
} else {
    window.AdapterManager = AdapterManager;
    window.adapterManager = adapterManager;
}