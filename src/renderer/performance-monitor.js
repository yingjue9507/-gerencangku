/**
 * 性能监控系统 - 监控和优化应用性能
 */
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            memory: { current: 0, peak: 0, history: [] },
            cpu: { current: 0, history: [] },
            network: { requests: 0, errors: 0, totalTime: 0 },
            ui: { renderTime: 0, interactions: 0, slowOperations: [] },
            adapters: new Map()
        };
        
        this.observers = new Map();
        this.isMonitoring = false;
        this.monitoringInterval = null;
        this.performanceEntries = [];
        
        this.initializeMonitoring();
    }

    // 初始化性能监控
    initializeMonitoring() {
        // 监控内存使用
        this.setupMemoryMonitoring();
        
        // 监控网络请求
        this.setupNetworkMonitoring();
        
        // 监控UI性能
        this.setupUIMonitoring();
        
        // 监控长任务
        this.setupLongTaskMonitoring();
        
        // 监控资源加载
        this.setupResourceMonitoring();
    }

    // 开始监控
    startMonitoring(interval = 5000) {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        console.log('Performance monitoring started');
        
        // 定期收集性能数据
        this.monitoringInterval = setInterval(() => {
            this.collectMetrics();
        }, interval);
        
        // 立即收集一次数据
        this.collectMetrics();
    }

    // 停止监控
    stopMonitoring() {
        if (!this.isMonitoring) return;
        
        this.isMonitoring = false;
        
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        
        // 断开所有观察者
        this.observers.forEach(observer => {
            if (observer.disconnect) {
                observer.disconnect();
            }
        });
        
        console.log('Performance monitoring stopped');
    }

    // 收集性能指标
    collectMetrics() {
        this.collectMemoryMetrics();
        this.collectNetworkMetrics();
        this.collectUIMetrics();
        this.collectAdapterMetrics();
        
        // 触发性能更新事件
        this.dispatchPerformanceUpdate();
    }

    // 收集内存指标
    collectMemoryMetrics() {
        if (performance.memory) {
            const memory = performance.memory;
            const currentMemory = Math.round(memory.usedJSHeapSize / 1024 / 1024); // MB
            
            this.metrics.memory.current = currentMemory;
            this.metrics.memory.peak = Math.max(this.metrics.memory.peak, currentMemory);
            
            // 保留最近50个数据点
            this.metrics.memory.history.push({
                timestamp: Date.now(),
                value: currentMemory
            });
            
            if (this.metrics.memory.history.length > 50) {
                this.metrics.memory.history.shift();
            }
            
            // 检查内存泄漏
            this.checkMemoryLeak();
        }
    }

    // 收集网络指标
    collectNetworkMetrics() {
        const entries = performance.getEntriesByType('navigation');
        if (entries.length > 0) {
            const navigation = entries[0];
            this.metrics.network.totalTime = navigation.loadEventEnd - navigation.fetchStart;
        }
    }

    // 收集UI指标
    collectUIMetrics() {
        // 收集绘制性能
        const paintEntries = performance.getEntriesByType('paint');
        paintEntries.forEach(entry => {
            if (entry.name === 'first-contentful-paint') {
                this.metrics.ui.renderTime = entry.startTime;
            }
        });
        
        // 收集布局偏移
        if ('LayoutShift' in window) {
            const layoutShifts = performance.getEntriesByType('layout-shift');
            this.metrics.ui.layoutShifts = layoutShifts.length;
        }
    }

    // 收集适配器指标
    collectAdapterMetrics() {
        if (typeof adapterManager !== 'undefined') {
            const stats = adapterManager.getStats();
            
            for (const [adapterId, adapter] of adapterManager.adapters) {
                if (!this.metrics.adapters.has(adapterId)) {
                    this.metrics.adapters.set(adapterId, {
                        responseTime: [],
                        errorCount: 0,
                        messageCount: 0
                    });
                }
            }
        }
    }

    // 设置内存监控
    setupMemoryMonitoring() {
        // 监控内存使用情况
        if ('memory' in performance) {
            console.log('Memory monitoring enabled');
        }
    }

    // 设置网络监控
    setupNetworkMonitoring() {
        // 监控fetch请求
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const startTime = performance.now();
            this.metrics.network.requests++;
            
            try {
                const response = await originalFetch(...args);
                const endTime = performance.now();
                
                // 记录请求时间
                this.recordNetworkRequest(args[0], endTime - startTime, response.ok);
                
                return response;
            } catch (error) {
                this.metrics.network.errors++;
                this.recordNetworkRequest(args[0], performance.now() - startTime, false);
                throw error;
            }
        };
    }

    // 设置UI监控
    setupUIMonitoring() {
        // 监控用户交互
        ['click', 'keydown', 'scroll'].forEach(eventType => {
            document.addEventListener(eventType, () => {
                this.metrics.ui.interactions++;
            }, { passive: true });
        });
        
        // 监控DOM变化
        if ('MutationObserver' in window) {
            const mutationObserver = new MutationObserver((mutations) => {
                if (mutations.length > 10) {
                    console.warn('Large DOM mutation detected:', mutations.length);
                }
            });
            
            mutationObserver.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true
            });
            
            this.observers.set('mutation', mutationObserver);
        }
    }

    // 设置长任务监控
    setupLongTaskMonitoring() {
        if ('PerformanceObserver' in window) {
            try {
                const longTaskObserver = new PerformanceObserver((list) => {
                    list.getEntries().forEach(entry => {
                        if (entry.duration > 50) { // 超过50ms的任务
                            this.metrics.ui.slowOperations.push({
                                name: entry.name,
                                duration: entry.duration,
                                timestamp: entry.startTime
                            });
                            
                            console.warn('Long task detected:', entry.name, entry.duration + 'ms');
                        }
                    });
                });
                
                longTaskObserver.observe({ entryTypes: ['longtask'] });
                this.observers.set('longtask', longTaskObserver);
            } catch (error) {
                console.log('Long task monitoring not supported');
            }
        }
    }

    // 设置资源监控
    setupResourceMonitoring() {
        if ('PerformanceObserver' in window) {
            try {
                const resourceObserver = new PerformanceObserver((list) => {
                    list.getEntries().forEach(entry => {
                        if (entry.duration > 1000) { // 超过1秒的资源加载
                            console.warn('Slow resource loading:', entry.name, entry.duration + 'ms');
                        }
                    });
                });
                
                resourceObserver.observe({ entryTypes: ['resource'] });
                this.observers.set('resource', resourceObserver);
            } catch (error) {
                console.log('Resource monitoring not supported');
            }
        }
    }

    // 记录网络请求
    recordNetworkRequest(url, duration, success) {
        // 这里可以记录详细的网络请求信息
        if (duration > 5000) { // 超过5秒的请求
            console.warn('Slow network request:', url, duration + 'ms');
        }
    }

    // 检查内存泄漏
    checkMemoryLeak() {
        const history = this.metrics.memory.history;
        if (history.length >= 10) {
            // 检查内存是否持续增长
            const recent = history.slice(-5);
            const older = history.slice(-10, -5);
            
            const recentAvg = recent.reduce((sum, item) => sum + item.value, 0) / recent.length;
            const olderAvg = older.reduce((sum, item) => sum + item.value, 0) / older.length;
            
            if (recentAvg > olderAvg * 1.5) {
                console.warn('Potential memory leak detected');
                notificationSystem?.warning('检测到潜在的内存泄漏，建议重启应用');
            }
        }
    }

    // 优化性能
    optimizePerformance() {
        console.log('Starting performance optimization...');
        
        // 清理性能条目
        this.cleanupPerformanceEntries();
        
        // 优化DOM
        this.optimizeDOM();
        
        // 清理事件监听器
        this.cleanupEventListeners();
        
        // 垃圾回收提示
        this.suggestGarbageCollection();
        
        console.log('Performance optimization completed');
    }

    // 清理性能条目
    cleanupPerformanceEntries() {
        if (performance.clearResourceTimings) {
            performance.clearResourceTimings();
        }
        
        if (performance.clearMeasures) {
            performance.clearMeasures();
        }
        
        if (performance.clearMarks) {
            performance.clearMarks();
        }
    }

    // 优化DOM
    optimizeDOM() {
        // 移除不可见的元素
        const hiddenElements = document.querySelectorAll('[style*="display: none"]');
        hiddenElements.forEach(element => {
            if (element.dataset.keepHidden !== 'true') {
                element.remove();
            }
        });
        
        // 清理空的文本节点
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    return node.textContent.trim() === '' ? 
                        NodeFilter.FILTER_ACCEPT : 
                        NodeFilter.FILTER_REJECT;
                }
            }
        );
        
        const emptyTextNodes = [];
        let node;
        while (node = walker.nextNode()) {
            emptyTextNodes.push(node);
        }
        
        emptyTextNodes.forEach(node => node.remove());
    }

    // 清理事件监听器
    cleanupEventListeners() {
        // 这里可以实现事件监听器的清理逻辑
        // 具体实现取决于应用的事件管理策略
    }

    // 建议垃圾回收
    suggestGarbageCollection() {
        if (window.gc && typeof window.gc === 'function') {
            try {
                window.gc();
                console.log('Manual garbage collection triggered');
            } catch (error) {
                console.log('Manual garbage collection not available');
            }
        }
    }

    // 获取性能报告
    getPerformanceReport() {
        return {
            timestamp: new Date().toISOString(),
            memory: {
                current: this.metrics.memory.current,
                peak: this.metrics.memory.peak,
                trend: this.getMemoryTrend()
            },
            network: {
                requests: this.metrics.network.requests,
                errors: this.metrics.network.errors,
                errorRate: this.metrics.network.requests > 0 ? 
                    (this.metrics.network.errors / this.metrics.network.requests * 100).toFixed(2) + '%' : '0%'
            },
            ui: {
                interactions: this.metrics.ui.interactions,
                slowOperations: this.metrics.ui.slowOperations.length,
                renderTime: this.metrics.ui.renderTime
            },
            adapters: Object.fromEntries(this.metrics.adapters),
            recommendations: this.getOptimizationRecommendations()
        };
    }

    // 获取内存趋势
    getMemoryTrend() {
        const history = this.metrics.memory.history;
        if (history.length < 2) return 'stable';
        
        const recent = history.slice(-3);
        const isIncreasing = recent.every((item, index) => 
            index === 0 || item.value >= recent[index - 1].value
        );
        
        const isDecreasing = recent.every((item, index) => 
            index === 0 || item.value <= recent[index - 1].value
        );
        
        if (isIncreasing) return 'increasing';
        if (isDecreasing) return 'decreasing';
        return 'stable';
    }

    // 获取优化建议
    getOptimizationRecommendations() {
        const recommendations = [];
        
        // 内存建议
        if (this.metrics.memory.current > 100) {
            recommendations.push('内存使用较高，建议关闭不必要的AI服务窗口');
        }
        
        // 网络建议
        const errorRate = this.metrics.network.requests > 0 ? 
            this.metrics.network.errors / this.metrics.network.requests : 0;
        if (errorRate > 0.1) {
            recommendations.push('网络错误率较高，请检查网络连接');
        }
        
        // UI建议
        if (this.metrics.ui.slowOperations.length > 5) {
            recommendations.push('检测到多个慢操作，建议优化UI交互');
        }
        
        return recommendations;
    }

    // 分发性能更新事件
    dispatchPerformanceUpdate() {
        const event = new CustomEvent('performanceUpdate', {
            detail: this.getPerformanceReport()
        });
        document.dispatchEvent(event);
    }

    // 记录适配器性能
    recordAdapterPerformance(adapterId, operation, duration, success = true) {
        if (!this.metrics.adapters.has(adapterId)) {
            this.metrics.adapters.set(adapterId, {
                responseTime: [],
                errorCount: 0,
                messageCount: 0
            });
        }
        
        const adapterMetrics = this.metrics.adapters.get(adapterId);
        
        if (operation === 'sendMessage') {
            adapterMetrics.messageCount++;
            adapterMetrics.responseTime.push(duration);
            
            // 保留最近20个响应时间
            if (adapterMetrics.responseTime.length > 20) {
                adapterMetrics.responseTime.shift();
            }
        }
        
        if (!success) {
            adapterMetrics.errorCount++;
        }
    }

    // 获取适配器性能统计
    getAdapterStats(adapterId) {
        const metrics = this.metrics.adapters.get(adapterId);
        if (!metrics) return null;
        
        const avgResponseTime = metrics.responseTime.length > 0 ?
            metrics.responseTime.reduce((sum, time) => sum + time, 0) / metrics.responseTime.length : 0;
        
        return {
            messageCount: metrics.messageCount,
            errorCount: metrics.errorCount,
            averageResponseTime: Math.round(avgResponseTime),
            errorRate: metrics.messageCount > 0 ? 
                (metrics.errorCount / metrics.messageCount * 100).toFixed(2) + '%' : '0%'
        };
    }
}

// 创建全局实例
const performanceMonitor = new PerformanceMonitor();

// 自动启动监控
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        performanceMonitor.startMonitoring();
    });
} else {
    performanceMonitor.startMonitoring();
}

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceMonitor;
}