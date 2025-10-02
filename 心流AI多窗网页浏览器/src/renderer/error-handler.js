/**
 * 错误处理管理器 - 统一处理应用中的各种错误
 */
class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 100;
        this.retryAttempts = new Map();
        this.maxRetries = 3;
        this.logLevel = 'info'; // debug, info, warn, error, critical
        this.persistentStorage = true;
        this.performanceIntegration = true;
        
        // 应用初始化状态跟踪
        this.appInitialized = false;
        this.pendingHealthAlerts = []; // 存储待显示的健康检查警告
        this.initializationStartTime = Date.now();
        this.initializationGracePeriod = 10000; // 10秒初始化宽限期
        this.startupGracePeriod = 60000; // 启动后60秒内不显示健康检查通知
        
        // 错误去重机制
        this.recentErrors = new Map(); // 存储最近的错误，用于去重
        this.errorDedupeWindow = 5000; // 5秒内的相同错误只显示一次
        this.maxSameErrorNotifications = 3; // 同类型错误最多显示3次通知
        
        // 日志统计
        this.logStats = {
            totalErrors: 0,
            errorsByType: new Map(),
            errorsByHour: new Map(),
            lastCleanup: Date.now()
        };
        
        this.initializeGlobalErrorHandling();
        this.loadStoredLogs();
        this.startLogCleanup();
        this.waitForAppInitialization();
    }

    // 等待应用初始化完成
    waitForAppInitialization() {
        // 监听应用初始化完成事件
        document.addEventListener('appInitialized', () => {
            this.setAppInitialized();
        });
        
        // 设置超时，防止应用初始化事件丢失
        setTimeout(() => {
            if (!this.appInitialized) {
                console.log('应用初始化超时，启用错误处理器');
                this.setAppInitialized();
            }
        }, this.initializationGracePeriod);
    }

    // 设置应用已初始化
    setAppInitialized() {
        this.appInitialized = true;
        console.log('应用初始化完成，错误处理器已启用');
        
        // 处理待显示的健康检查警告
        if (this.pendingHealthAlerts.length > 0) {
            console.log(`处理 ${this.pendingHealthAlerts.length} 个待显示的健康检查警告`);
            this.pendingHealthAlerts.forEach(healthStatus => {
                this.showHealthAlert(healthStatus);
            });
            this.pendingHealthAlerts = [];
        }
    }

    // 检查是否在初始化期间
    isInInitializationPeriod() {
        return !this.appInitialized && 
               (Date.now() - this.initializationStartTime) < this.initializationGracePeriod;
    }

    // 初始化全局错误处理
    initializeGlobalErrorHandling() {
        // 捕获未处理的JavaScript错误
        window.addEventListener('error', (event) => {
            this.handleError({
                type: 'javascript',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error,
                stack: event.error?.stack
            });
        });

        // 捕获未处理的Promise拒绝
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                type: 'promise',
                message: event.reason?.message || 'Unhandled Promise Rejection',
                error: event.reason,
                stack: event.reason?.stack
            });
        });

        // 捕获资源加载错误
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.handleError({
                    type: 'resource',
                    message: `Failed to load resource: ${event.target.src || event.target.href}`,
                    element: event.target.tagName,
                    source: event.target.src || event.target.href
                });
            }
        }, true);
    }

    // 处理错误
    handleError(errorInfo, options = {}) {
        try {
            const error = this.normalizeError(errorInfo);
            
            // 过滤不需要显示给用户的错误
            if (this.shouldIgnoreError(error)) {
                // 只记录到控制台，不显示通知
                console.debug('Filtered error:', error);
                return error.id;
            }
            
            // 检查错误去重
            if (this.isDuplicateError(error)) {
                console.debug('Duplicate error filtered:', error);
                return error.id;
            }
            
            // 记录错误
            this.logError(error);

            // 确定错误严重性
            const severity = this.determineSeverity(error);
            
            // 尝试自动恢复
            const recoveryAttempted = this.attemptAutoRecovery(error);
            if (recoveryAttempted) {
                console.log('自动恢复成功，错误已处理');
                // 记录恢复成功
                this.logError({
                    ...error,
                    message: `自动恢复成功: ${error.message}`,
                    type: 'recovery_success'
                });
                return error.id;
            }

            // 根据错误类型和严重程度决定处理方式
            const shouldNotify = options.notify !== false && severity !== 'debug';
            const shouldRetry = options.retry !== false && this.canRetry(error);

            if (shouldNotify) {
                this.notifyUser(error, severity, shouldRetry);
            }

            // 发送错误报告（如果配置了）
            if (options.report !== false && severity === 'critical') {
                this.reportError(error);
            }
            
            // 检查是否需要进行健康检查
            this.checkHealthIfNeeded(error);

            return error.id;
            
        } catch (handlingError) {
            // 如果错误处理本身出错，记录到控制台
            console.error('错误处理器本身出现错误:', handlingError);
            console.error('原始错误:', errorInfo);
            
            // 尝试基本的错误恢复
            this.performEmergencyRecovery(handlingError, errorInfo);
            return null;
        }
    }
    
    // 检查是否需要健康检查
    checkHealthIfNeeded(error) {
        const severity = this.determineSeverity(error);
        const errorCount = this.logStats.totalErrors;
        
        // 在启动宽限期内，完全禁用健康检查通知（除非是关键错误）
        const timeSinceStartup = Date.now() - this.initializationStartTime;
        if (timeSinceStartup < this.startupGracePeriod && severity !== 'critical') {
            console.debug('应用启动宽限期内，跳过健康检查通知');
            return;
        }
        
        // 在初始化期间，只记录关键错误，不触发健康检查
        if (this.isInInitializationPeriod() && severity !== 'critical') {
            console.debug('应用初始化期间，跳过健康检查');
            return;
        }
        
        // 在以下情况触发健康检查：
        // 1. 关键错误
        // 2. 错误总数达到特定阈值
        // 3. 距离上次健康检查超过一定时间
        const shouldCheck = 
            severity === 'critical' ||
            errorCount % 50 === 0 ||
            !this.lastHealthCheck ||
            Date.now() - this.lastHealthCheck > 3600000; // 1小时
            
        if (shouldCheck) {
            setTimeout(() => {
                const healthStatus = this.performHealthCheck();
                this.lastHealthCheck = Date.now();
                
                if (healthStatus.overall !== 'healthy') {
                    // 格式化健康状态信息，避免显示[object Object]
                    const healthSummary = this.formatHealthSummary(healthStatus);
                    
                    // 检查是否为重复的健康检查警告
                    const healthError = {
                        type: 'health_check',
                        message: healthSummary,
                        source: 'error-handler.js:157'
                    };
                    
                    if (!this.isDuplicateError(healthError)) {
                        console.warn('健康检查发现问题:', healthSummary);
                    }
                    
                    // 如果有高优先级建议，显示通知
                    const highPriorityRecommendations = healthStatus.recommendations
                        .filter(rec => rec.priority === 'high');
                    
                    if (highPriorityRecommendations.length > 0) {
                        // 如果应用还未初始化完成，将警告加入待处理队列
                        if (!this.appInitialized) {
                            console.log('应用未初始化完成，健康检查警告加入待处理队列');
                            this.pendingHealthAlerts.push(healthStatus);
                        } else {
                            this.showHealthAlert(healthStatus);
                        }
                    }
                }
            }, 1000); // 延迟执行，避免阻塞主线程
        }
    }
    
    // 显示健康警告
    showHealthAlert(healthStatus) {
        // 在启动宽限期内不显示健康警告通知
        const timeSinceStartup = Date.now() - this.initializationStartTime;
        if (timeSinceStartup < this.startupGracePeriod) {
            console.debug('应用启动宽限期内，跳过健康警告通知');
            return;
        }
        
        const message = `系统健康状态: ${healthStatus.overall}\n` +
            `发现 ${healthStatus.recommendations.length} 个建议`;
            
        if (window.notificationSystem) {
            window.notificationSystem.warning(message, {
                actions: [
                    {
                        text: '查看详情',
                        action: () => this.showHealthDetails(healthStatus)
                    },
                    {
                        text: '执行修复',
                        action: () => this.executeHealthRecommendations(healthStatus)
                    }
                ]
            });
        }
    }
    
    // 显示健康详情
    showHealthDetails(healthStatus) {
        const details = {
            title: '系统健康检查报告',
            content: this.formatHealthReport(healthStatus),
            type: 'health_report'
        };
        
        if (window.app && window.app.showModal) {
            window.app.showModal(details);
        } else {
            console.log('健康检查报告:', healthStatus);
        }
    }
    
    // 格式化健康报告
    formatHealthReport(healthStatus) {
        let report = `检查时间: ${healthStatus.timestamp}\n`;
        report += `整体状态: ${healthStatus.overall}\n\n`;
        
        report += '详细检查结果:\n';
        Object.entries(healthStatus.checks).forEach(([name, result]) => {
            report += `- ${name}: ${result.status} (${result.message})\n`;
        });
        
        if (healthStatus.recommendations.length > 0) {
            report += '\n建议措施:\n';
            healthStatus.recommendations.forEach((rec, index) => {
                report += `${index + 1}. [${rec.priority}] ${rec.message}\n`;
            });
        }
        
        return report;
    }
    
    // 格式化健康状态摘要信息（用于控制台输出）
    formatHealthSummary(healthStatus) {
        if (!healthStatus || typeof healthStatus !== 'object') {
            return '健康状态信息无效';
        }
        
        const summary = [];
        summary.push(`状态: ${healthStatus.overall || '未知'}`);
        
        // 添加主要问题
        if (healthStatus.checks && typeof healthStatus.checks === 'object') {
            const failedChecks = Object.entries(healthStatus.checks)
                .filter(([name, result]) => result.status !== 'healthy')
                .map(([name, result]) => `${name}: ${result.message || result.status}`);
            
            if (failedChecks.length > 0) {
                summary.push(`问题: ${failedChecks.join(', ')}`);
            }
        }
        
        // 添加高优先级建议数量
        if (healthStatus.recommendations && Array.isArray(healthStatus.recommendations)) {
            const highPriorityCount = healthStatus.recommendations
                .filter(rec => rec.priority === 'high').length;
            if (highPriorityCount > 0) {
                summary.push(`高优先级建议: ${highPriorityCount}个`);
            }
        }
        
        return summary.join(' | ');
    }
    
    // 执行健康建议
    executeHealthRecommendations(healthStatus) {
        const recommendations = healthStatus.recommendations;
        let executedCount = 0;
        
        recommendations.forEach(rec => {
            try {
                switch (rec.action) {
                    case 'memory_cleanup':
                        this.performMemoryCleanup();
                        executedCount++;
                        break;
                    case 'review_error_logs':
                        this.showRecentErrors();
                        executedCount++;
                        break;
                    case 'optimize_resources':
                        this.optimizeSystemResources();
                        executedCount++;
                        break;
                    case 'fix_critical_errors':
                        this.fixCriticalErrors();
                        executedCount++;
                        break;
                }
            } catch (error) {
                console.error(`执行建议失败 (${rec.action}):`, error);
            }
        });
        
        if (window.notificationSystem) {
            window.notificationSystem.success(`已执行 ${executedCount}/${recommendations.length} 个建议`);
        }
    }
    
    // 执行内存清理
    performMemoryCleanup() {
        // 强制垃圾回收
        if (window.gc) {
            window.gc();
        }
        
        // 清理应用缓存
        if (window.app) {
            if (window.app.clearCache) {
                window.app.clearCache();
            }
            if (window.app.cleanupUnusedPanels) {
                window.app.cleanupUnusedPanels();
            }
        }
        
        console.log('内存清理完成');
    }
    
    // 显示最近错误
    showRecentErrors() {
        const recentErrors = this.errorLog.slice(0, 10);
        const errorSummary = recentErrors.map(error => 
            `[${error.timestamp}] ${error.type}: ${error.message}`
        ).join('\n');
        
        if (window.app && window.app.showModal) {
            window.app.showModal({
                title: '最近错误日志',
                content: errorSummary,
                type: 'error_log'
            });
        } else {
            console.log('最近错误:', recentErrors);
        }
    }
    
    // 优化系统资源
    optimizeSystemResources() {
        // 清理DOM
        this.cleanupDOMNodes();
        
        // 清理事件监听器
        this.cleanupEventListeners();
        
        console.log('系统资源优化完成');
    }
    
    // 清理DOM节点
    cleanupDOMNodes() {
        // 移除隐藏或无用的DOM节点
        const hiddenElements = document.querySelectorAll('[style*="display: none"]');
        hiddenElements.forEach(element => {
            if (element.dataset.keepHidden !== 'true') {
                element.remove();
            }
        });
        
        // 清理空的容器
        const emptyContainers = document.querySelectorAll('div:empty, span:empty');
        emptyContainers.forEach(container => {
            if (!container.hasAttribute('data-keep-empty')) {
                container.remove();
            }
        });
    }
    
    // 清理事件监听器
    cleanupEventListeners() {
        // 这里可以实现具体的事件监听器清理逻辑
        // 由于浏览器限制，我们主要依赖应用自身的清理机制
        if (window.app && window.app.cleanupEventListeners) {
            window.app.cleanupEventListeners();
        }
    }
    
    // 修复关键错误
    fixCriticalErrors() {
        const criticalErrors = this.errorLog.filter(error => 
            this.determineSeverity(error) === 'critical' &&
            Date.now() - new Date(error.timestamp).getTime() < 3600000
        );
        
        criticalErrors.forEach(error => {
            this.attemptAutoRecovery(error);
        });
        
        console.log(`尝试修复 ${criticalErrors.length} 个关键错误`);
    }
    
    // 紧急恢复
    performEmergencyRecovery(handlingError, originalError) {
        console.error('执行紧急恢复程序');
        
        try {
            // 基本的错误记录
            const emergencyLog = {
                timestamp: new Date().toISOString(),
                type: 'emergency_recovery',
                message: `错误处理器故障: ${handlingError.message}`,
                originalError: originalError?.message || 'Unknown',
                severity: 'critical'
            };
            
            // 直接推送到错误日志，绕过正常的处理流程
            this.errorLog.unshift(emergencyLog);
            
            // 限制日志大小
            if (this.errorLog.length > this.maxLogSize) {
                this.errorLog = this.errorLog.slice(0, this.maxLogSize);
            }
            
            // 尝试基本的用户通知
            if (window.alert) {
                setTimeout(() => {
                    window.alert('系统遇到严重错误，已启动紧急恢复程序');
                }, 100);
            }
            
        } catch (emergencyError) {
            // 最后的防线：直接输出到控制台
            console.error('紧急恢复也失败了:', emergencyError);
            console.error('处理错误:', handlingError);
            console.error('原始错误:', originalError);
        }
    }

    // 判断是否应该忽略错误
    shouldIgnoreError(error) {
        const message = error.message.toLowerCase();
        const url = error.source || error.url || '';
        
        // 检查是否为谷歌相关域名
        const googleDomains = [
            'accounts.google.com',
            'oauth2.googleapis.com', 
            'www.googleapis.com',
            'ssl.gstatic.com',
            'fonts.googleapis.com',
            'apis.google.com',
            'gemini.google.com'
        ];
        
        const isGoogleDomain = googleDomains.some(domain => url && url.includes(domain));
        
        // 对于谷歌域名，只忽略特定的SSL错误，保持其他错误的正常处理
        if (isGoogleDomain) {
            // 谷歌登录相关的SSL错误处理
            if (message.includes('handshake failed') || 
                message.includes('ssl_client_socket') ||
                message.includes('certificate verify failed') ||
                message.includes('net_error -101') ||
                message.includes('net_error -113') ||
                message.includes('connection_reset') ||
                message.includes('err_connection_reset')) {
                console.log(`谷歌服务SSL/连接错误已忽略: ${url} - ${message}`);
                return true;
            }
            // 其他错误不忽略，让谷歌正常处理
            return false;
        }
        
        // 非谷歌域名的SSL错误处理（保持原有逻辑）
        if (message.includes('handshake failed') || 
            message.includes('ssl error') ||
            message.includes('net_error') ||
            message.includes('ssl_client_socket') ||
            message.includes('connection_reset') ||
            message.includes('err_connection_reset')) {
            return true;
        }
        
        // 忽略webview reload相关的错误
        if (message.includes('webview') && 
            (message.includes('reload') || message.includes('refresh') || 
             message.includes('destroyed') || message.includes('navigation'))) {
            return true;
        }
        
        // 忽略Electron webview相关的错误
        if (message.includes('electron') && 
            (message.includes('webcontents') || message.includes('webview'))) {
            return true;
        }
        
        // 忽略资源加载失败（如果是网络相关）
        if (error.type === 'resource' && 
            (message.includes('net::') || message.includes('failed to load'))) {
            return true;
        }
        
        // 忽略一些常见的无害错误
        if (message.includes('non-passive event listener') ||
            message.includes('deprecated api') ||
            message.includes('violation')) {
            return true;
        }
        
        // 忽略与刷新操作相关的错误
        if (error.context && error.context.action === 'refresh') {
            return true;
        }
        
        return false;
    }

    // 检查是否为重复错误
    isDuplicateError(error) {
        const errorKey = this.generateErrorKey(error);
        const now = Date.now();
        
        // 为健康检查错误设置更长的去重时间窗口
        const isHealthCheck = error.type === 'health_check';
        const dedupeWindow = isHealthCheck ? 30000 : this.errorDedupeWindow; // 健康检查30秒，其他5秒
        const maxNotifications = isHealthCheck ? 1 : this.maxSameErrorNotifications; // 健康检查只显示1次
        
        // 清理过期的错误记录
        for (const [key, data] of this.recentErrors.entries()) {
            const windowToUse = key.startsWith('health_check:') ? 30000 : this.errorDedupeWindow;
            if (now - data.timestamp > windowToUse) {
                this.recentErrors.delete(key);
            }
        }
        
        // 检查是否存在相同的错误
        if (this.recentErrors.has(errorKey)) {
            const errorData = this.recentErrors.get(errorKey);
            errorData.count++;
            
            // 如果同类型错误通知次数超过限制，则忽略
            if (errorData.count > maxNotifications) {
                return true;
            }
            
            // 如果在去重时间窗口内，则忽略
            if (now - errorData.timestamp < dedupeWindow) {
                return true;
            }
        }
        
        // 记录新错误或更新时间戳
        this.recentErrors.set(errorKey, {
            timestamp: now,
            count: this.recentErrors.has(errorKey) ? this.recentErrors.get(errorKey).count : 1
        });
        
        return false;
    }

    // 生成错误唯一标识
    generateErrorKey(error) {
        // 基于错误类型和消息生成唯一键
        const message = error.message || '';
        const type = error.type || 'unknown';
        const source = error.source || '';
        
        // 对于健康检查错误，使用特殊的键生成逻辑
        if (type === 'health_check') {
            // 健康检查错误按类型去重，不考虑具体的状态细节
            // 这样可以避免因为状态变化导致的重复警告
            return `health_check:${source}`;
        }
        
        // 对于JavaScript错误，包含文件名和行号
        if (error.type === 'javascript' && error.filename && error.lineno) {
            return `${type}:${message}:${error.filename}:${error.lineno}`;
        }
        
        // 对于其他错误，使用类型和消息的前100个字符
        return `${type}:${message.substring(0, 100)}`;
    }

    // 标准化错误对象
    normalizeError(errorInfo) {
        const error = {
            id: this.generateErrorId(),
            timestamp: new Date().toISOString(),
            type: errorInfo.type || 'unknown',
            message: errorInfo.message || 'Unknown error',
            stack: errorInfo.stack,
            context: errorInfo.context || {},
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        // 添加特定类型的信息
        if (errorInfo.filename) error.filename = errorInfo.filename;
        if (errorInfo.lineno) error.lineno = errorInfo.lineno;
        if (errorInfo.colno) error.colno = errorInfo.colno;
        if (errorInfo.element) error.element = errorInfo.element;
        if (errorInfo.source) error.source = errorInfo.source;

        return error;
    }

    // 确定错误严重程度
    determineSeverity(error) {
        // 关键错误
        if (error.type === 'javascript' && error.message.includes('Cannot read property')) {
            return 'critical';
        }
        if (error.type === 'promise' && error.message.includes('Network')) {
            return 'high';
        }
        if (error.type === 'adapter' && error.message.includes('initialization failed')) {
            return 'high';
        }
        
        // 中等错误
        if (error.type === 'resource') {
            return 'medium';
        }
        if (error.type === 'validation') {
            return 'medium';
        }
        
        // 低级错误
        if (error.type === 'warning') {
            return 'low';
        }
        
        return 'medium';
    }

    // 通知用户
    notifyUser(error, severity, canRetry) {
        // 在启动宽限期内，只显示关键错误通知
        const timeSinceStartup = Date.now() - this.initializationStartTime;
        if (timeSinceStartup < this.startupGracePeriod && severity !== 'critical') {
            console.debug('应用启动宽限期内，跳过非关键错误通知:', error.message);
            return;
        }
        
        const message = this.getUserFriendlyMessage(error);
        const actions = [];

        if (canRetry) {
            actions.push({
                id: 'retry',
                text: '重试'
            });
        }

        if (severity === 'critical' || severity === 'high') {
            actions.push({
                id: 'report',
                text: '报告问题'
            });
        }

        let notificationType;
        switch (severity) {
            case 'critical':
                notificationType = 'error';
                break;
            case 'high':
                notificationType = 'error';
                break;
            case 'medium':
                notificationType = 'warning';
                break;
            case 'low':
                notificationType = 'info';
                break;
            default:
                notificationType = 'warning';
        }

        const notificationId = notificationSystem.show(message, notificationType, {
            actions,
            duration: severity === 'critical' ? 0 : 8000
        });

        // 监听操作
        document.addEventListener('notificationAction', (event) => {
            if (event.detail.notificationId === notificationId) {
                this.handleNotificationAction(error, event.detail.actionId);
            }
        }, { once: true });
    }

    // 获取用户友好的错误消息
    getUserFriendlyMessage(error) {
        const messageMap = {
            'javascript': '应用程序遇到了一个错误',
            'promise': '网络请求失败',
            'resource': '资源加载失败',
            'adapter': 'AI服务连接失败',
            'validation': '输入验证失败',
            'network': '网络连接错误',
            'timeout': '操作超时',
            'permission': '权限不足'
        };

        const baseMessage = messageMap[error.type] || '发生了未知错误';
        
        // 添加具体的错误信息
        if (error.type === 'adapter') {
            return `${baseMessage}: ${error.context.service || '未知服务'}`;
        }
        if (error.type === 'network') {
            return `${baseMessage}: 请检查网络连接`;
        }
        if (error.type === 'timeout') {
            return `${baseMessage}: 请稍后重试`;
        }

        return baseMessage;
    }

    // 处理通知操作
    handleNotificationAction(error, actionId) {
        switch (actionId) {
            case 'retry':
                this.retryOperation(error);
                break;
            case 'report':
                this.showErrorReport(error);
                break;
        }
    }

    // 重试操作
    retryOperation(error) {
        const retryKey = `${error.type}-${error.context.operation || 'unknown'}`;
        const attempts = this.retryAttempts.get(retryKey) || 0;

        if (attempts >= this.maxRetries) {
            notificationSystem.error('重试次数已达上限，请稍后再试');
            return;
        }

        this.retryAttempts.set(retryKey, attempts + 1);
        
        // 根据错误类型执行重试逻辑
        if (error.context.retryCallback) {
            try {
                error.context.retryCallback();
                notificationSystem.success('重试成功');
                this.retryAttempts.delete(retryKey);
            } catch (retryError) {
                this.handleError({
                    type: error.type,
                    message: `重试失败: ${retryError.message}`,
                    context: error.context
                });
            }
        }
    }

    // 检查是否可以重试
    canRetry(error) {
        const retryableTypes = ['network', 'timeout', 'adapter', 'resource'];
        const retryKey = `${error.type}-${error.context.operation || 'unknown'}`;
        const attempts = this.retryAttempts.get(retryKey) || 0;
        
        return retryableTypes.includes(error.type) && 
               attempts < this.maxRetries && 
               error.context.retryCallback;
    }

    // 显示错误报告
    showErrorReport(error) {
        const reportData = {
            error,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            url: window.location.href
        };

        // 创建错误报告模态框
        const modal = document.createElement('div');
        modal.className = 'error-report-modal';
        modal.innerHTML = `
            <div class="error-report-content">
                <h3>错误报告</h3>
                <p>以下信息将帮助我们改进应用程序：</p>
                <textarea readonly>${JSON.stringify(reportData, null, 2)}</textarea>
                <div class="error-report-actions">
                    <button onclick="errorHandler.copyErrorReport('${error.id}')">复制报告</button>
                    <button onclick="errorHandler.closeErrorReport()">关闭</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.currentReportModal = modal;
    }

    // 复制错误报告
    copyErrorReport(errorId) {
        const error = this.errorLog.find(e => e.id === errorId);
        if (error) {
            const reportText = JSON.stringify(error, null, 2);
            navigator.clipboard.writeText(reportText).then(() => {
                notificationSystem.success('错误报告已复制到剪贴板');
            });
        }
    }

    // 关闭错误报告
    closeErrorReport() {
        if (this.currentReportModal) {
            this.currentReportModal.remove();
            this.currentReportModal = null;
        }
    }

    // 记录错误
    logError(error) {
        const severity = this.determineSeverity(error);
        
        // 检查日志级别
        if (!this.shouldLog(severity)) {
            return;
        }
        
        // 添加额外的元数据
        error.severity = severity;
        error.sessionId = this.getSessionId();
        error.memoryUsage = this.getMemoryInfo();
        
        this.errorLog.unshift(error);
        
        // 更新统计信息
        this.updateLogStats(error);
        
        // 限制日志大小
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog = this.errorLog.slice(0, this.maxLogSize);
        }

        // 持久化存储
        if (this.persistentStorage) {
            this.saveLogsToStorage();
        }
        
        // 性能监控集成
        if (this.performanceIntegration && window.performanceMonitor) {
            window.performanceMonitor.recordError(error);
        }

        // 输出到控制台
        this.logToConsole(error, severity);
    }
    
    // 检查是否应该记录日志
    shouldLog(severity) {
        const levels = ['debug', 'info', 'warn', 'error', 'critical'];
        const currentLevelIndex = levels.indexOf(this.logLevel);
        const errorLevelIndex = levels.indexOf(severity);
        return errorLevelIndex >= currentLevelIndex;
    }
    
    // 更新日志统计
    updateLogStats(error) {
        this.logStats.totalErrors++;
        
        // 按类型统计
        const typeCount = this.logStats.errorsByType.get(error.type) || 0;
        this.logStats.errorsByType.set(error.type, typeCount + 1);
        
        // 按小时统计
        const hour = new Date().getHours();
        const hourCount = this.logStats.errorsByHour.get(hour) || 0;
        this.logStats.errorsByHour.set(hour, hourCount + 1);
    }
    
    // 获取会话ID
    getSessionId() {
        if (!this.sessionId) {
            this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        return this.sessionId;
    }
    
    // 获取内存信息
    getMemoryInfo() {
        try {
            if (performance.memory) {
                return {
                    usedJSHeapSize: performance.memory.usedJSHeapSize,
                    totalJSHeapSize: performance.memory.totalJSHeapSize,
                    jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
                };
            }
        } catch (e) {
            // 忽略内存信息获取失败
        }
        return null;
    }
    
    // 输出到控制台
    logToConsole(error, severity) {
        const isDev = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') ||
                     window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        if (!isDev && severity === 'debug') {
            return;
        }
        
        const logMethod = {
            'debug': console.debug,
            'info': console.info,
            'warn': console.warn,
            'error': console.error,
            'critical': console.error
        }[severity] || console.log;
        
        logMethod(`[${severity.toUpperCase()}] ${error.type}:`, error.message, error);
    }
    
    // 保存日志到本地存储
    saveLogsToStorage() {
        try {
            const logsToSave = this.errorLog.slice(0, 50); // 只保存最近50条
            localStorage.setItem('errorLogs', JSON.stringify({
                logs: logsToSave,
                stats: {
                    totalErrors: this.logStats.totalErrors,
                    errorsByType: Array.from(this.logStats.errorsByType.entries()),
                    lastUpdate: Date.now()
                }
            }));
        } catch (e) {
            console.warn('Failed to save error logs to storage:', e);
        }
    }
    
    // 从本地存储加载日志
    loadStoredLogs() {
        try {
            const stored = localStorage.getItem('errorLogs');
            if (stored) {
                const data = JSON.parse(stored);
                if (data.logs && Array.isArray(data.logs)) {
                    this.errorLog = data.logs;
                }
                if (data.stats) {
                    this.logStats.totalErrors = data.stats.totalErrors || 0;
                    if (data.stats.errorsByType) {
                        this.logStats.errorsByType = new Map(data.stats.errorsByType);
                    }
                }
            }
        } catch (e) {
            console.warn('Failed to load stored error logs:', e);
        }
    }
    
    // 启动日志清理
    startLogCleanup() {
        // 每小时清理一次过期日志
        setInterval(() => {
            this.cleanupOldLogs();
        }, 60 * 60 * 1000);
        
        // 立即执行一次清理
        this.cleanupOldLogs();
    }
    
    // 清理过期日志
    cleanupOldLogs() {
        const now = Date.now();
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7天
        
        this.errorLog = this.errorLog.filter(error => {
            const errorTime = new Date(error.timestamp).getTime();
            return (now - errorTime) < maxAge;
        });
        
        // 清理小时统计（只保留24小时）
        const currentHour = new Date().getHours();
        for (let hour = 0; hour < 24; hour++) {
            if (Math.abs(hour - currentHour) > 12) {
                this.logStats.errorsByHour.delete(hour);
            }
        }
        
        this.logStats.lastCleanup = now;
        
        if (this.persistentStorage) {
            this.saveLogsToStorage();
        }
    }

    // 生成错误ID
    generateErrorId() {
        return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // 报告错误到服务器（如果配置了）
    reportError(error) {
        // 这里可以实现向服务器发送错误报告的逻辑
        console.log('Error reported:', error);
    }

    // 获取错误统计
    getErrorStats() {
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        const oneDay = 24 * oneHour;
        
        const stats = {
            total: this.errorLog.length,
            totalAllTime: this.logStats.totalErrors,
            byType: {},
            bySeverity: {},
            byHour: Object.fromEntries(this.logStats.errorsByHour),
            recent: this.errorLog.slice(0, 10),
            lastHour: 0,
            lastDay: 0,
            trends: {
                increasing: false,
                decreasing: false,
                stable: true
            },
            sessionInfo: {
                sessionId: this.getSessionId(),
                sessionStart: this.sessionStartTime || Date.now(),
                sessionErrors: 0
            }
        };

        // 计算各种统计
        this.errorLog.forEach(error => {
            const errorTime = new Date(error.timestamp).getTime();
            
            // 按类型统计
            stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
            
            // 按严重程度统计
            const severity = error.severity || this.determineSeverity(error);
            stats.bySeverity[severity] = (stats.bySeverity[severity] || 0) + 1;
            
            // 时间范围统计
            if (now - errorTime < oneHour) {
                stats.lastHour++;
            }
            if (now - errorTime < oneDay) {
                stats.lastDay++;
            }
            
            // 会话错误统计
            if (error.sessionId === this.getSessionId()) {
                stats.sessionInfo.sessionErrors++;
            }
        });
        
        // 计算趋势
        this.calculateErrorTrends(stats);
        
        return stats;
    }
    
    // 计算错误趋势
    calculateErrorTrends(stats) {
        const hourlyData = Array.from(this.logStats.errorsByHour.values());
        if (hourlyData.length >= 3) {
            const recent = hourlyData.slice(-3);
            const average = recent.reduce((a, b) => a + b, 0) / recent.length;
            const lastHour = recent[recent.length - 1];
            
            if (lastHour > average * 1.5) {
                stats.trends.increasing = true;
                stats.trends.stable = false;
            } else if (lastHour < average * 0.5) {
                stats.trends.decreasing = true;
                stats.trends.stable = false;
            }
        }
    }
    
    // 导出错误日志
    exportErrorLogs(format = 'json') {
        const exportData = {
            metadata: {
                exportTime: new Date().toISOString(),
                totalLogs: this.errorLog.length,
                sessionId: this.getSessionId(),
                version: '1.0'
            },
            stats: this.getErrorStats(),
            logs: this.errorLog
        };
        
        switch (format.toLowerCase()) {
            case 'json':
                return JSON.stringify(exportData, null, 2);
            case 'csv':
                return this.convertToCSV(exportData.logs);
            case 'txt':
                return this.convertToText(exportData);
            default:
                return JSON.stringify(exportData, null, 2);
        }
    }
    
    // 转换为CSV格式
    convertToCSV(logs) {
        const headers = ['timestamp', 'type', 'severity', 'message', 'filename', 'lineno', 'sessionId'];
        const csvRows = [headers.join(',')];
        
        logs.forEach(log => {
            const row = headers.map(header => {
                const value = log[header] || '';
                return `"${String(value).replace(/"/g, '""')}"`;
            });
            csvRows.push(row.join(','));
        });
        
        return csvRows.join('\n');
    }
    
    // 转换为文本格式
    convertToText(exportData) {
        let text = `错误日志报告\n`;
        text += `导出时间: ${exportData.metadata.exportTime}\n`;
        text += `总错误数: ${exportData.metadata.totalLogs}\n`;
        text += `会话ID: ${exportData.metadata.sessionId}\n\n`;
        
        text += `统计信息:\n`;
        text += `- 最近1小时: ${exportData.stats.lastHour} 个错误\n`;
        text += `- 最近24小时: ${exportData.stats.lastDay} 个错误\n`;
        text += `- 按类型分布: ${JSON.stringify(exportData.stats.byType, null, 2)}\n`;
        text += `- 按严重程度分布: ${JSON.stringify(exportData.stats.bySeverity, null, 2)}\n\n`;
        
        text += `详细日志:\n`;
        exportData.logs.forEach((log, index) => {
            text += `${index + 1}. [${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}\n`;
            if (log.filename) text += `   文件: ${log.filename}:${log.lineno}\n`;
            if (log.stack) text += `   堆栈: ${log.stack.split('\n')[0]}\n`;
            text += '\n';
        });
        
        return text;
    }
    
    // 设置日志级别
    setLogLevel(level) {
        const validLevels = ['debug', 'info', 'warn', 'error', 'critical'];
        if (validLevels.includes(level)) {
            this.logLevel = level;
            console.log(`日志级别已设置为: ${level}`);
        } else {
            console.warn(`无效的日志级别: ${level}，有效级别: ${validLevels.join(', ')}`);
        }
    }
    
    // 获取日志级别
    getLogLevel() {
        return this.logLevel;
    }

    // 清除错误日志
    clearErrorLog() {
        this.errorLog = [];
        this.retryAttempts.clear();
        this.logStats.totalErrors = 0;
        this.logStats.errorsByHour.clear();
        this.logStats.errorsByType.clear();
        if (this.persistentStorage) {
            this.saveLogsToStorage();
        }
        notificationSystem.success('错误日志已清除');
    }
    
    // 健康检查
    performHealthCheck() {
        const healthStatus = {
            timestamp: new Date().toISOString(),
            overall: 'healthy',
            checks: {
                errorRate: this.checkErrorRate(),
                memoryUsage: this.checkMemoryUsage(),
                performanceMetrics: this.checkPerformanceMetrics(),
                criticalErrors: this.checkCriticalErrors(),
                systemResources: this.checkSystemResources()
            },
            recommendations: []
        };
        
        // 评估整体健康状态
        const failedChecks = Object.values(healthStatus.checks).filter(check => check.status !== 'ok');
        if (failedChecks.length > 0) {
            healthStatus.overall = failedChecks.some(check => check.severity === 'critical') ? 'critical' : 'warning';
        }
        
        // 生成建议
        this.generateHealthRecommendations(healthStatus);
        
        return healthStatus;
    }
    
    // 检查错误率
    checkErrorRate() {
        const stats = this.getErrorStats();
        const errorRate = stats.lastHour;
        
        // 在启动期间使用更宽松的阈值
        const timeSinceStartup = Date.now() - this.initializationStartTime;
        const isStartupPeriod = timeSinceStartup < this.startupGracePeriod;
        
        const criticalThreshold = isStartupPeriod ? 100 : 50; // 启动期间阈值翻倍
        const warningThreshold = isStartupPeriod ? 50 : 20;   // 启动期间阈值翻倍
        
        if (errorRate > criticalThreshold) {
            return {
                status: 'critical',
                severity: 'critical',
                message: `错误率过高: ${errorRate} 错误/小时`,
                value: errorRate,
                threshold: criticalThreshold
            };
        } else if (errorRate > warningThreshold) {
            return {
                status: 'warning',
                severity: 'warning',
                message: `错误率较高: ${errorRate} 错误/小时`,
                value: errorRate,
                threshold: warningThreshold
            };
        }
        
        return {
            status: 'ok',
            severity: 'info',
            message: `错误率正常: ${errorRate} 错误/小时`,
            value: errorRate
        };
    }
    
    // 检查内存使用
    checkMemoryUsage() {
        try {
            const memInfo = this.getMemoryInfo();
            if (!memInfo) {
                return {
                    status: 'unknown',
                    severity: 'info',
                    message: '内存信息不可用'
                };
            }
            
            const usagePercent = (memInfo.usedJSHeapSize / memInfo.totalJSHeapSize) * 100;
            
            // 在启动期间使用更宽松的内存阈值
            const timeSinceStartup = Date.now() - this.initializationStartTime;
            const isStartupPeriod = timeSinceStartup < this.startupGracePeriod;
            
            const criticalThreshold = isStartupPeriod ? 95 : 90; // 启动期间阈值更宽松
            const warningThreshold = isStartupPeriod ? 85 : 75;  // 启动期间阈值更宽松
            
            if (usagePercent > criticalThreshold) {
                return {
                    status: 'critical',
                    severity: 'critical',
                    message: `内存使用率过高: ${usagePercent.toFixed(1)}%`,
                    value: usagePercent,
                    threshold: criticalThreshold
                };
            } else if (usagePercent > warningThreshold) {
                return {
                    status: 'warning',
                    severity: 'warning',
                    message: `内存使用率较高: ${usagePercent.toFixed(1)}%`,
                    value: usagePercent,
                    threshold: warningThreshold
                };
            }
            
            return {
                status: 'ok',
                severity: 'info',
                message: `内存使用率正常: ${usagePercent.toFixed(1)}%`,
                value: usagePercent
            };
        } catch (error) {
            return {
                status: 'unknown',
                severity: 'warning',
                message: '无法获取内存信息',
                error: error.message
            };
        }
    }
    
    // 检查性能指标
    checkPerformanceMetrics() {
        try {
            if (window.performance && window.performance.timing) {
                const timing = window.performance.timing;
                const loadTime = timing.loadEventEnd - timing.navigationStart;
                
                if (loadTime > 10000) {
                    return {
                        status: 'warning',
                        severity: 'warning',
                        message: `页面加载时间过长: ${loadTime}ms`,
                        value: loadTime,
                        threshold: 10000
                    };
                }
                
                return {
                    status: 'ok',
                    severity: 'info',
                    message: `页面加载时间正常: ${loadTime}ms`,
                    value: loadTime
                };
            }
            
            return {
                status: 'unknown',
                severity: 'info',
                message: '性能API不可用'
            };
        } catch (error) {
            return {
                status: 'error',
                severity: 'warning',
                message: '性能检查失败',
                error: error.message
            };
        }
    }
    
    // 检查关键错误
    checkCriticalErrors() {
        const criticalErrors = this.errorLog.filter(error => 
            this.determineSeverity(error) === 'critical' &&
            Date.now() - new Date(error.timestamp).getTime() < 3600000 // 最近1小时
        );
        
        if (criticalErrors.length > 0) {
            return {
                status: 'critical',
                severity: 'critical',
                message: `发现 ${criticalErrors.length} 个关键错误`,
                value: criticalErrors.length,
                errors: criticalErrors.slice(0, 3) // 只返回前3个
            };
        }
        
        return {
            status: 'ok',
            severity: 'info',
            message: '无关键错误',
            value: 0
        };
    }
    
    // 检查系统资源
    checkSystemResources() {
        const checks = [];
        
        // 在启动期间使用更宽松的系统资源阈值
        const timeSinceStartup = Date.now() - this.initializationStartTime;
        const isStartupPeriod = timeSinceStartup < this.startupGracePeriod;
        
        // 检查DOM节点数量
        const domNodes = document.querySelectorAll('*').length;
        const domThreshold = isStartupPeriod ? 15000 : 10000; // 启动期间阈值更宽松
        if (domNodes > domThreshold) {
            checks.push({
                type: 'dom',
                status: 'warning',
                message: `DOM节点过多: ${domNodes}`,
                value: domNodes
            });
        }
        
        // 检查事件监听器（如果可用）
        if (window.getEventListeners) {
            const listeners = Object.keys(window.getEventListeners(document)).length;
            const listenersThreshold = isStartupPeriod ? 150 : 100; // 启动期间阈值更宽松
            if (listeners > listenersThreshold) {
                checks.push({
                    type: 'listeners',
                    status: 'warning',
                    message: `事件监听器过多: ${listeners}`,
                    value: listeners
                });
            }
        }
        
        const hasWarnings = checks.some(check => check.status === 'warning');
        
        return {
            status: hasWarnings ? 'warning' : 'ok',
            severity: hasWarnings ? 'warning' : 'info',
            message: hasWarnings ? '系统资源使用异常' : '系统资源使用正常',
            details: checks
        };
    }
    
    // 生成健康建议
    generateHealthRecommendations(healthStatus) {
        const recommendations = [];
        
        Object.entries(healthStatus.checks).forEach(([checkName, result]) => {
            if (result.status === 'critical' || result.status === 'warning') {
                switch (checkName) {
                    case 'errorRate':
                        recommendations.push({
                            type: 'error_rate',
                            priority: result.status === 'critical' ? 'high' : 'medium',
                            message: '建议检查最近的错误日志，识别并修复频繁出现的问题',
                            action: 'review_error_logs'
                        });
                        break;
                    case 'memoryUsage':
                        recommendations.push({
                            type: 'memory',
                            priority: result.status === 'critical' ? 'high' : 'medium',
                            message: '建议清理未使用的对象，检查内存泄漏',
                            action: 'memory_cleanup'
                        });
                        break;
                    case 'criticalErrors':
                        recommendations.push({
                            type: 'critical_errors',
                            priority: 'high',
                            message: '立即处理关键错误，确保应用稳定性',
                            action: 'fix_critical_errors'
                        });
                        break;
                    case 'systemResources':
                        recommendations.push({
                            type: 'resources',
                            priority: 'medium',
                            message: '优化DOM结构和事件监听器使用',
                            action: 'optimize_resources'
                        });
                        break;
                }
            }
        });
        
        healthStatus.recommendations = recommendations;
    }
    
    // 自动修复尝试
    attemptAutoRecovery(error) {
        const recoveryActions = {
            'network': this.recoverNetworkError.bind(this),
            'memory': this.recoverMemoryError.bind(this),
            'dom': this.recoverDOMError.bind(this),
            'webview': this.recoverWebviewError.bind(this),
            'adapter': this.recoverAdapterError.bind(this)
        };
        
        const errorType = this.categorizeError(error);
        const recoveryAction = recoveryActions[errorType];
        
        if (recoveryAction) {
            try {
                console.log(`尝试自动恢复 ${errorType} 错误:`, error.message);
                return recoveryAction(error);
            } catch (recoveryError) {
                console.error('自动恢复失败:', recoveryError);
                return false;
            }
        }
        
        return false;
    }
    
    // 网络错误恢复
    recoverNetworkError(error) {
        // 重置网络连接状态
        if (window.app && window.app.updateConnectionStatus) {
            window.app.updateConnectionStatus();
        }
        
        // 重试失败的请求
        if (error.context && error.context.retry) {
            setTimeout(() => {
                error.context.retry();
            }, 2000);
        }
        
        return true;
    }
    
    // 内存错误恢复
    recoverMemoryError(error) {
        // 强制垃圾回收（如果可用）
        if (window.gc) {
            window.gc();
        }
        
        // 清理缓存
        if (window.app && window.app.clearCache) {
            window.app.clearCache();
        }
        
        return true;
    }
    
    // DOM错误恢复
    recoverDOMError(error) {
        // 重新初始化DOM元素
        if (error.context && error.context.element) {
            try {
                const element = error.context.element;
                element.innerHTML = '';
                // 重新创建元素
                if (window.app && window.app.reinitializeElement) {
                    window.app.reinitializeElement(element);
                }
                return true;
            } catch (e) {
                console.error('DOM恢复失败:', e);
            }
        }
        
        return false;
    }
    
    // Webview错误恢复
    recoverWebviewError(error) {
        if (error.context && error.context.webview) {
            try {
                const webview = error.context.webview;
                webview.reload();
                return true;
            } catch (e) {
                console.error('Webview恢复失败:', e);
            }
        }
        
        return false;
    }
    
    // 适配器错误恢复
    recoverAdapterError(error) {
        if (window.app && window.app.adapterManager) {
            try {
                window.app.adapterManager.resetAdapter(error.context?.adapterId);
                return true;
            } catch (e) {
                console.error('适配器恢复失败:', e);
            }
        }
        
        return false;
    }
    
    // 错误分类
    categorizeError(error) {
        const message = error.message?.toLowerCase() || '';
        const stack = error.stack?.toLowerCase() || '';
        
        if (message.includes('network') || message.includes('fetch') || message.includes('xhr')) {
            return 'network';
        }
        if (message.includes('memory') || message.includes('heap')) {
            return 'memory';
        }
        if (message.includes('dom') || message.includes('element') || stack.includes('dom')) {
            return 'dom';
        }
        if (message.includes('webview') || stack.includes('webview')) {
            return 'webview';
        }
        if (message.includes('adapter') || stack.includes('adapter')) {
            return 'adapter';
        }
        
        return 'unknown';
    }

    // 手动处理特定类型的错误
    handleAdapterError(service, error, retryCallback) {
        return this.handleError({
            type: 'adapter',
            message: error.message || '适配器错误',
            context: {
                service,
                operation: 'adapter_operation',
                retryCallback
            }
        });
    }

    handleNetworkError(error, retryCallback) {
        return this.handleError({
            type: 'network',
            message: error.message || '网络错误',
            context: {
                operation: 'network_request',
                retryCallback
            }
        });
    }

    handleValidationError(field, message) {
        return this.handleError({
            type: 'validation',
            message: `${field}: ${message}`,
            context: { field }
        }, { notify: true, retry: false });
    }
}

// 添加错误报告模态框样式
const errorReportStyles = `
<style>
.error-report-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10001;
}

.error-report-content {
    background: white;
    padding: 24px;
    border-radius: 8px;
    max-width: 600px;
    width: 90%;
    max-height: 80%;
    overflow: auto;
}

.error-report-content h3 {
    margin: 0 0 16px 0;
    color: #333;
}

.error-report-content textarea {
    width: 100%;
    height: 300px;
    font-family: monospace;
    font-size: 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 12px;
    resize: vertical;
    margin: 16px 0;
}

.error-report-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
}

.error-report-actions button {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
}

.error-report-actions button:first-child {
    background: #007bff;
    color: white;
}

.error-report-actions button:last-child {
    background: #6c757d;
    color: white;
}

.error-report-actions button:hover {
    opacity: 0.9;
}

/* 深色主题适配 */
.dark-theme .error-report-content {
    background: #2d3748;
    color: #e2e8f0;
}

.dark-theme .error-report-content h3 {
    color: #e2e8f0;
}

.dark-theme .error-report-content textarea {
    background: #4a5568;
    color: #e2e8f0;
    border-color: #718096;
}
</style>
`;

// 注入样式
if (!document.getElementById('error-report-styles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'error-report-styles';
    styleElement.innerHTML = errorReportStyles;
    document.head.appendChild(styleElement);
}

// 创建全局实例
const errorHandler = new ErrorHandler();

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandler;
}