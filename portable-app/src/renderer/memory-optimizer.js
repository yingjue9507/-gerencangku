/**
 * 内存优化管理器 - 管理和优化应用内存使用
 */
class MemoryOptimizer {
    constructor() {
        this.caches = new Map();
        this.cleanupTasks = new Set();
        this.memoryThresholds = {
            warning: 80, // MB
            critical: 120, // MB
            cleanup: 100 // MB
        };
        
        this.isOptimizing = false;
        this.optimizationInterval = null;
        this.lastCleanup = Date.now();
        
        this.initializeOptimizer();
    }

    // 初始化优化器
    initializeOptimizer() {
        // 监听内存警告
        this.setupMemoryWarnings();
        
        // 设置定期清理
        this.setupPeriodicCleanup();
        
        // 监听页面可见性变化
        this.setupVisibilityHandling();
        
        // 设置缓存管理
        this.setupCacheManagement();
    }

    // 设置内存警告
    setupMemoryWarnings() {
        if (performance.memory) {
            // 监听性能更新事件
            document.addEventListener('performanceUpdate', (event) => {
                const memoryUsage = event.detail.memory.current;
                this.handleMemoryUsage(memoryUsage);
            });
        }
    }

    // 处理内存使用情况
    handleMemoryUsage(memoryUsage) {
        if (memoryUsage > this.memoryThresholds.critical) {
            this.performEmergencyCleanup();
        } else if (memoryUsage > this.memoryThresholds.warning) {
            this.performGentleCleanup();
        }
    }

    // 设置定期清理
    setupPeriodicCleanup() {
        // 每5分钟执行一次清理
        this.optimizationInterval = setInterval(() => {
            this.performScheduledCleanup();
        }, 5 * 60 * 1000);
    }

    // 设置页面可见性处理
    setupVisibilityHandling() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // 页面隐藏时进行清理
                setTimeout(() => {
                    if (document.hidden) {
                        this.performBackgroundCleanup();
                    }
                }, 30000); // 30秒后清理
            }
        });
    }

    // 设置缓存管理
    setupCacheManagement() {
        // 创建各种缓存
        this.caches.set('messages', new Map());
        this.caches.set('adapters', new Map());
        this.caches.set('ui', new Map());
        this.caches.set('images', new Map());
        this.caches.set('responses', new Map());
    }

    // 执行紧急清理
    performEmergencyCleanup() {
        if (this.isOptimizing) return;
        
        console.warn('Emergency memory cleanup triggered');
        this.isOptimizing = true;
        
        try {
            // 清理所有缓存
            this.clearAllCaches();
            
            // 清理DOM
            this.cleanupDOM();
            
            // 清理事件监听器
            this.cleanupEventListeners();
            
            // 强制垃圾回收
            this.forceGarbageCollection();
            
            // 通知用户
            notificationSystem?.warning('内存使用过高，已执行紧急清理');
            
        } finally {
            this.isOptimizing = false;
            this.lastCleanup = Date.now();
        }
    }

    // 执行温和清理
    performGentleCleanup() {
        if (this.isOptimizing) return;
        
        console.log('Gentle memory cleanup triggered');
        this.isOptimizing = true;
        
        try {
            // 清理过期缓存
            this.clearExpiredCaches();
            
            // 清理不活跃的适配器
            this.cleanupInactiveAdapters();
            
            // 清理旧消息
            this.cleanupOldMessages();
            
        } finally {
            this.isOptimizing = false;
            this.lastCleanup = Date.now();
        }
    }

    // 执行计划清理
    performScheduledCleanup() {
        if (this.isOptimizing) return;
        
        console.log('Scheduled memory cleanup');
        this.isOptimizing = true;
        
        try {
            // 清理过期数据
            this.clearExpiredData();
            
            // 优化缓存大小
            this.optimizeCacheSizes();
            
            // 清理临时文件
            this.cleanupTempFiles();
            
        } finally {
            this.isOptimizing = false;
            this.lastCleanup = Date.now();
        }
    }

    // 执行后台清理
    performBackgroundCleanup() {
        if (this.isOptimizing) return;
        
        console.log('Background memory cleanup');
        this.isOptimizing = true;
        
        try {
            // 暂停不必要的适配器
            this.pauseInactiveAdapters();
            
            // 清理UI缓存
            this.clearUICache();
            
            // 减少轮询频率
            this.reducePollingFrequency();
            
        } finally {
            this.isOptimizing = false;
        }
    }

    // 清理所有缓存
    clearAllCaches() {
        this.caches.forEach((cache, name) => {
            cache.clear();
            console.log(`Cleared ${name} cache`);
        });
    }

    // 清理过期缓存
    clearExpiredCaches() {
        const now = Date.now();
        const maxAge = 10 * 60 * 1000; // 10分钟
        
        this.caches.forEach((cache, name) => {
            let cleared = 0;
            for (const [key, value] of cache.entries()) {
                if (value.timestamp && now - value.timestamp > maxAge) {
                    cache.delete(key);
                    cleared++;
                }
            }
            if (cleared > 0) {
                console.log(`Cleared ${cleared} expired items from ${name} cache`);
            }
        });
    }

    // 清理过期数据
    clearExpiredData() {
        // 清理过期的性能数据
        if (typeof performanceMonitor !== 'undefined') {
            performanceMonitor.cleanupPerformanceEntries();
        }
        
        // 清理过期的错误日志
        if (typeof errorHandler !== 'undefined' && errorHandler.clearOldLogs) {
            errorHandler.clearOldLogs();
        }
    }

    // 优化缓存大小
    optimizeCacheSizes() {
        const maxSizes = {
            messages: 100,
            adapters: 50,
            ui: 200,
            images: 20,
            responses: 50
        };
        
        this.caches.forEach((cache, name) => {
            const maxSize = maxSizes[name] || 100;
            if (cache.size > maxSize) {
                // 删除最旧的条目
                const entries = Array.from(cache.entries());
                const toDelete = entries.slice(0, cache.size - maxSize);
                toDelete.forEach(([key]) => cache.delete(key));
                
                console.log(`Trimmed ${name} cache from ${cache.size + toDelete.length} to ${cache.size}`);
            }
        });
    }

    // 清理DOM
    cleanupDOM() {
        // 移除隐藏的元素
        const hiddenElements = document.querySelectorAll('.hidden, [style*="display: none"]');
        let removed = 0;
        
        hiddenElements.forEach(element => {
            if (!element.dataset.keepHidden) {
                element.remove();
                removed++;
            }
        });
        
        if (removed > 0) {
            console.log(`Removed ${removed} hidden DOM elements`);
        }
        
        // 清理空的容器
        const emptyContainers = document.querySelectorAll('div:empty, span:empty');
        emptyContainers.forEach(container => {
            if (!container.dataset.keepEmpty && container.children.length === 0) {
                container.remove();
            }
        });
    }

    // 清理事件监听器
    cleanupEventListeners() {
        // 移除已分离的元素的事件监听器
        // 这需要应用维护事件监听器的引用
        this.cleanupTasks.forEach(task => {
            try {
                task();
            } catch (error) {
                console.warn('Cleanup task failed:', error);
            }
        });
    }

    // 强制垃圾回收
    forceGarbageCollection() {
        if (window.gc && typeof window.gc === 'function') {
            try {
                window.gc();
                console.log('Forced garbage collection');
            } catch (error) {
                console.log('Garbage collection not available');
            }
        }
    }

    // 清理不活跃的适配器
    cleanupInactiveAdapters() {
        if (typeof adapterManager !== 'undefined') {
            const inactiveThreshold = 30 * 60 * 1000; // 30分钟
            const now = Date.now();
            
            adapterManager.adapters.forEach((adapter, id) => {
                if (adapter.lastActivity && now - adapter.lastActivity > inactiveThreshold) {
                    console.log(`Cleaning up inactive adapter: ${id}`);
                    // 这里可以实现适配器的清理逻辑
                }
            });
        }
    }

    // 清理旧消息
    cleanupOldMessages() {
        const messageCache = this.caches.get('messages');
        if (messageCache) {
            const maxMessages = 50;
            if (messageCache.size > maxMessages) {
                const entries = Array.from(messageCache.entries());
                const toDelete = entries.slice(0, messageCache.size - maxMessages);
                toDelete.forEach(([key]) => messageCache.delete(key));
                
                console.log(`Cleaned up ${toDelete.length} old messages`);
            }
        }
    }

    // 清理临时文件
    cleanupTempFiles() {
        // 清理浏览器缓存中的临时数据
        if ('caches' in window) {
            caches.keys().then(cacheNames => {
                cacheNames.forEach(cacheName => {
                    if (cacheName.includes('temp') || cacheName.includes('tmp')) {
                        caches.delete(cacheName);
                    }
                });
            });
        }
    }

    // 暂停不活跃的适配器
    pauseInactiveAdapters() {
        if (typeof adapterManager !== 'undefined') {
            adapterManager.adapters.forEach((adapter, id) => {
                if (adapter.pause && !adapter.isActive) {
                    adapter.pause();
                    console.log(`Paused inactive adapter: ${id}`);
                }
            });
        }
    }

    // 清理UI缓存
    clearUICache() {
        const uiCache = this.caches.get('ui');
        if (uiCache) {
            uiCache.clear();
            console.log('Cleared UI cache');
        }
    }

    // 减少轮询频率
    reducePollingFrequency() {
        // 通知其他组件减少轮询频率
        document.dispatchEvent(new CustomEvent('reducePolling'));
    }

    // 添加缓存项
    addToCache(cacheName, key, value, ttl = 10 * 60 * 1000) {
        const cache = this.caches.get(cacheName);
        if (cache) {
            cache.set(key, {
                value,
                timestamp: Date.now(),
                ttl
            });
        }
    }

    // 从缓存获取项
    getFromCache(cacheName, key) {
        const cache = this.caches.get(cacheName);
        if (!cache) return null;
        
        const item = cache.get(key);
        if (!item) return null;
        
        // 检查是否过期
        if (Date.now() - item.timestamp > item.ttl) {
            cache.delete(key);
            return null;
        }
        
        return item.value;
    }

    // 添加清理任务
    addCleanupTask(task) {
        this.cleanupTasks.add(task);
    }

    // 移除清理任务
    removeCleanupTask(task) {
        this.cleanupTasks.delete(task);
    }

    // 获取内存使用统计
    getMemoryStats() {
        const stats = {
            caches: {},
            cleanupTasks: this.cleanupTasks.size,
            lastCleanup: this.lastCleanup,
            isOptimizing: this.isOptimizing
        };
        
        this.caches.forEach((cache, name) => {
            stats.caches[name] = cache.size;
        });
        
        if (performance.memory) {
            stats.memory = {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            };
        }
        
        return stats;
    }

    // 设置内存阈值
    setMemoryThresholds(thresholds) {
        this.memoryThresholds = { ...this.memoryThresholds, ...thresholds };
    }

    // 手动触发优化
    optimize() {
        this.performGentleCleanup();
    }

    // 销毁优化器
    destroy() {
        if (this.optimizationInterval) {
            clearInterval(this.optimizationInterval);
            this.optimizationInterval = null;
        }
        
        this.clearAllCaches();
        this.cleanupTasks.clear();
    }
}

// 创建全局实例
const memoryOptimizer = new MemoryOptimizer();

// 监听页面卸载事件
window.addEventListener('beforeunload', () => {
    memoryOptimizer.destroy();
});

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MemoryOptimizer;
}