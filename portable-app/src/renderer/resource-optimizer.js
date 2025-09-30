/**
 * 资源加载优化器 - 优化资源加载和管理
 */
class ResourceOptimizer {
    constructor() {
        this.loadingQueue = [];
        this.loadedResources = new Map();
        this.preloadCache = new Map();
        this.loadingPromises = new Map();
        
        this.config = {
            maxConcurrentLoads: 3,
            preloadThreshold: 2000, // 2秒内预加载
            cacheTimeout: 30 * 60 * 1000, // 30分钟缓存
            retryAttempts: 3,
            retryDelay: 1000
        };
        
        this.isProcessingQueue = false;
        this.loadingStats = {
            totalRequests: 0,
            successfulLoads: 0,
            failedLoads: 0,
            cacheHits: 0,
            averageLoadTime: 0
        };
        
        this.initializeOptimizer();
    }

    // 初始化优化器
    initializeOptimizer() {
        // 设置资源预加载
        this.setupPreloading();
        
        // 监控资源加载
        this.setupLoadingMonitoring();
        
        // 设置懒加载
        this.setupLazyLoading();
        
        // 优化图片加载
        this.setupImageOptimization();
    }

    // 设置资源预加载
    setupPreloading() {
        // 预加载关键资源
        this.preloadCriticalResources();
        
        // 监听用户交互，预测性加载
        this.setupPredictiveLoading();
    }

    // 预加载关键资源
    preloadCriticalResources() {
        const criticalResources = [
            'notification-system.js',
            'error-handler.js',
            'validation-system.js'
        ];
        
        criticalResources.forEach(resource => {
            // 检查脚本是否已经存在，避免重复加载
            const existingScript = document.querySelector(`script[src="${resource}"]`);
            if (!existingScript) {
                this.preloadResource(resource, 'script');
            } else {
                console.log(`脚本 ${resource} 已存在，跳过预加载`);
            }
        });
    }

    // 设置预测性加载
    setupPredictiveLoading() {
        // 监听鼠标悬停，预加载可能需要的资源
        document.addEventListener('mouseover', (event) => {
            const target = event.target;
            
            // 预加载AI服务相关资源
            if (target.classList.contains('ai-service-item')) {
                const serviceId = target.dataset.serviceId;
                if (serviceId) {
                    this.preloadAdapterResources(serviceId);
                }
            }
            
            // 预加载按钮相关资源
            if (target.tagName === 'BUTTON') {
                this.preloadButtonResources(target);
            }
        });
    }

    // 设置加载监控
    setupLoadingMonitoring() {
        // 监控所有网络请求
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const startTime = performance.now();
            const url = args[0];
            
            this.loadingStats.totalRequests++;
            
            try {
                const response = await originalFetch(...args);
                const loadTime = performance.now() - startTime;
                
                this.recordLoadSuccess(url, loadTime);
                return response;
            } catch (error) {
                this.recordLoadFailure(url, error);
                throw error;
            }
        };
    }

    // 设置懒加载
    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const lazyLoadObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadLazyResource(entry.target);
                        lazyLoadObserver.unobserve(entry.target);
                    }
                });
            }, {
                rootMargin: '50px'
            });
            
            // 观察所有懒加载元素
            document.querySelectorAll('[data-lazy-src]').forEach(element => {
                lazyLoadObserver.observe(element);
            });
            
            this.lazyLoadObserver = lazyLoadObserver;
        }
    }

    // 设置图片优化
    setupImageOptimization() {
        // 优化图片加载
        document.addEventListener('DOMContentLoaded', () => {
            this.optimizeImages();
        });
        
        // 监听新图片添加
        if ('MutationObserver' in window) {
            const imageObserver = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const images = node.querySelectorAll ? 
                                node.querySelectorAll('img') : 
                                (node.tagName === 'IMG' ? [node] : []);
                            
                            images.forEach(img => this.optimizeImage(img));
                        }
                    });
                });
            });
            
            imageObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    }

    // 加载资源
    async loadResource(url, type = 'auto', priority = 'normal') {
        // 检查缓存
        const cached = this.getCachedResource(url);
        if (cached) {
            this.loadingStats.cacheHits++;
            return cached;
        }
        
        // 检查是否正在加载
        if (this.loadingPromises.has(url)) {
            return this.loadingPromises.get(url);
        }
        
        // 创建加载Promise
        const loadPromise = this.createLoadPromise(url, type, priority);
        this.loadingPromises.set(url, loadPromise);
        
        try {
            const result = await loadPromise;
            this.cacheResource(url, result);
            return result;
        } finally {
            this.loadingPromises.delete(url);
        }
    }

    // 创建加载Promise
    async createLoadPromise(url, type, priority) {
        return new Promise((resolve, reject) => {
            const loadItem = {
                url,
                type,
                priority,
                resolve,
                reject,
                attempts: 0,
                startTime: performance.now()
            };
            
            // 根据优先级插入队列
            if (priority === 'high') {
                this.loadingQueue.unshift(loadItem);
            } else {
                this.loadingQueue.push(loadItem);
            }
            
            this.processLoadingQueue();
        });
    }

    // 处理加载队列
    async processLoadingQueue() {
        if (this.isProcessingQueue) return;
        
        this.isProcessingQueue = true;
        
        while (this.loadingQueue.length > 0) {
            const concurrentLoads = Math.min(
                this.config.maxConcurrentLoads,
                this.loadingQueue.length
            );
            
            const loadPromises = [];
            for (let i = 0; i < concurrentLoads; i++) {
                const loadItem = this.loadingQueue.shift();
                if (loadItem) {
                    loadPromises.push(this.executeLoad(loadItem));
                }
            }
            
            await Promise.allSettled(loadPromises);
        }
        
        this.isProcessingQueue = false;
    }

    // 执行加载
    async executeLoad(loadItem) {
        const { url, type, resolve, reject, startTime } = loadItem;
        
        try {
            let result;
            
            switch (type) {
                case 'script':
                    result = await this.loadScript(url);
                    break;
                case 'style':
                    result = await this.loadStylesheet(url);
                    break;
                case 'image':
                    result = await this.loadImage(url);
                    break;
                case 'json':
                    result = await this.loadJSON(url);
                    break;
                default:
                    result = await this.loadGeneric(url);
            }
            
            const loadTime = performance.now() - startTime;
            this.recordLoadSuccess(url, loadTime);
            resolve(result);
            
        } catch (error) {
            // 重试逻辑
            if (loadItem.attempts < this.config.retryAttempts) {
                loadItem.attempts++;
                
                setTimeout(() => {
                    this.loadingQueue.unshift(loadItem);
                    this.processLoadingQueue();
                }, this.config.retryDelay * loadItem.attempts);
                
                return;
            }
            
            this.recordLoadFailure(url, error);
            reject(error);
        }
    }

    // 加载脚本
    loadScript(url) {
        return new Promise((resolve, reject) => {
            // 检查脚本是否已经存在
            const existingScript = document.querySelector(`script[src="${url}"]`);
            if (existingScript) {
                console.log(`脚本 ${url} 已存在，跳过加载`);
                resolve(existingScript);
                return;
            }

            const script = document.createElement('script');
            script.src = url;
            script.onload = () => resolve(script);
            script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
            document.head.appendChild(script);
        });
    }

    // 加载样式表
    loadStylesheet(url) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = url;
            link.onload = () => resolve(link);
            link.onerror = () => reject(new Error(`Failed to load stylesheet: ${url}`));
            document.head.appendChild(link);
        });
    }

    // 加载图片
    loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
            img.src = url;
        });
    }

    // 加载JSON
    async loadJSON(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load JSON: ${url}`);
        }
        return response.json();
    }

    // 加载通用资源
    async loadGeneric(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load resource: ${url}`);
        }
        return response;
    }

    // 预加载资源
    preloadResource(url, type = 'auto') {
        if (this.preloadCache.has(url)) return;
        
        this.preloadCache.set(url, true);
        
        // 使用低优先级预加载
        this.loadResource(url, type, 'low').catch(error => {
            console.warn('Preload failed:', url, error);
        });
    }

    // 预加载适配器资源
    preloadAdapterResources(serviceId) {
        const adapterPath = `/src/adapters/${serviceId}-adapter.js`;
        this.preloadResource(adapterPath, 'script');
    }

    // 预加载按钮资源
    preloadButtonResources(button) {
        const action = button.dataset.action;
        if (action) {
            // 根据按钮动作预加载相关资源
            switch (action) {
                case 'test':
                    // 测试页面资源已内置，无需预加载
                    break;
                case 'settings':
                    this.preloadResource('settings-ui.js', 'script');
                    break;
            }
        }
    }

    // 加载懒加载资源
    loadLazyResource(element) {
        const lazySrc = element.dataset.lazySrc;
        if (lazySrc) {
            if (element.tagName === 'IMG') {
                element.src = lazySrc;
            } else if (element.tagName === 'SCRIPT') {
                element.src = lazySrc;
            }
            element.removeAttribute('data-lazy-src');
        }
    }

    // 优化图片
    optimizeImages() {
        const images = document.querySelectorAll('img');
        images.forEach(img => this.optimizeImage(img));
    }

    // 优化单个图片
    optimizeImage(img) {
        // 添加懒加载
        if (!img.src && !img.dataset.lazySrc) {
            return;
        }
        
        // 设置加载优先级
        if (img.getBoundingClientRect().top < window.innerHeight) {
            img.loading = 'eager';
        } else {
            img.loading = 'lazy';
        }
        
        // 添加错误处理
        img.onerror = () => {
            console.warn('Image load failed:', img.src);
            img.style.display = 'none';
        };
    }

    // 缓存资源
    cacheResource(url, resource) {
        this.loadedResources.set(url, {
            resource,
            timestamp: Date.now(),
            accessCount: 1
        });
        
        // 清理过期缓存
        this.cleanupCache();
    }

    // 获取缓存资源
    getCachedResource(url) {
        const cached = this.loadedResources.get(url);
        if (!cached) return null;
        
        // 检查是否过期
        if (Date.now() - cached.timestamp > this.config.cacheTimeout) {
            this.loadedResources.delete(url);
            return null;
        }
        
        cached.accessCount++;
        return cached.resource;
    }

    // 清理缓存
    cleanupCache() {
        const now = Date.now();
        const maxSize = 100;
        
        // 删除过期项
        for (const [url, cached] of this.loadedResources.entries()) {
            if (now - cached.timestamp > this.config.cacheTimeout) {
                this.loadedResources.delete(url);
            }
        }
        
        // 如果缓存仍然太大，删除最少使用的项
        if (this.loadedResources.size > maxSize) {
            const entries = Array.from(this.loadedResources.entries())
                .sort((a, b) => a[1].accessCount - b[1].accessCount);
            
            const toDelete = entries.slice(0, this.loadedResources.size - maxSize);
            toDelete.forEach(([url]) => this.loadedResources.delete(url));
        }
    }

    // 记录加载成功
    recordLoadSuccess(url, loadTime) {
        this.loadingStats.successfulLoads++;
        
        // 更新平均加载时间
        const totalTime = this.loadingStats.averageLoadTime * (this.loadingStats.successfulLoads - 1) + loadTime;
        this.loadingStats.averageLoadTime = totalTime / this.loadingStats.successfulLoads;
        
        console.log(`Resource loaded: ${url} (${Math.round(loadTime)}ms)`);
    }

    // 记录加载失败
    recordLoadFailure(url, error) {
        this.loadingStats.failedLoads++;
        console.error(`Resource load failed: ${url}`, error);
    }

    // 获取加载统计
    getLoadingStats() {
        const successRate = this.loadingStats.totalRequests > 0 ?
            (this.loadingStats.successfulLoads / this.loadingStats.totalRequests * 100).toFixed(2) : 0;
        
        const cacheHitRate = this.loadingStats.totalRequests > 0 ?
            (this.loadingStats.cacheHits / this.loadingStats.totalRequests * 100).toFixed(2) : 0;
        
        return {
            ...this.loadingStats,
            successRate: successRate + '%',
            cacheHitRate: cacheHitRate + '%',
            averageLoadTime: Math.round(this.loadingStats.averageLoadTime) + 'ms',
            cacheSize: this.loadedResources.size,
            queueSize: this.loadingQueue.length
        };
    }

    // 清理资源
    cleanup() {
        // 清理缓存
        this.loadedResources.clear();
        this.preloadCache.clear();
        
        // 清理队列
        this.loadingQueue.length = 0;
        this.loadingPromises.clear();
        
        // 断开观察者
        if (this.lazyLoadObserver) {
            this.lazyLoadObserver.disconnect();
        }
    }

    // 设置配置
    setConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
}

// 创建全局实例
const resourceOptimizer = new ResourceOptimizer();

// 监听页面卸载事件
window.addEventListener('beforeunload', () => {
    resourceOptimizer.cleanup();
});

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResourceOptimizer;
}