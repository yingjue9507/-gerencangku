/**
 * 错误处理管理器 - 统一处理应用中的各种错误
 */
class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 100;
        this.retryAttempts = new Map();
        this.maxRetries = 3;
        
        this.initializeGlobalErrorHandling();
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
        const error = this.normalizeError(errorInfo);
        
        // 过滤不需要显示给用户的错误
        if (this.shouldIgnoreError(error)) {
            // 只记录到控制台，不显示通知
            console.debug('Filtered error:', error);
            return error.id;
        }
        
        // 记录错误
        this.logError(error);

        // 根据错误类型和严重程度决定处理方式
        const severity = this.determineSeverity(error);
        const shouldNotify = options.notify !== false && severity !== 'debug';
        const shouldRetry = options.retry !== false && this.canRetry(error);

        if (shouldNotify) {
            this.notifyUser(error, severity, shouldRetry);
        }

        // 发送错误报告（如果配置了）
        if (options.report !== false && severity === 'critical') {
            this.reportError(error);
        }

        return error.id;
    }

    // 判断是否应该忽略错误
    shouldIgnoreError(error) {
        const message = error.message.toLowerCase();
        
        // 忽略SSL握手失败等网络错误
        if (message.includes('handshake failed') || 
            message.includes('ssl error') ||
            message.includes('net_error') ||
            message.includes('ssl_client_socket')) {
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
        this.errorLog.unshift(error);
        
        // 限制日志大小
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog = this.errorLog.slice(0, this.maxLogSize);
        }

        // 输出到控制台（开发模式）
        if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
            console.error('Error logged:', error);
        } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            // 开发环境的备用检测方式
            console.error('Error logged:', error);
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
        const stats = {
            total: this.errorLog.length,
            byType: {},
            bySeverity: {},
            recent: this.errorLog.slice(0, 10)
        };

        this.errorLog.forEach(error => {
            stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
            const severity = this.determineSeverity(error);
            stats.bySeverity[severity] = (stats.bySeverity[severity] || 0) + 1;
        });

        return stats;
    }

    // 清除错误日志
    clearErrorLog() {
        this.errorLog = [];
        this.retryAttempts.clear();
        notificationSystem.success('错误日志已清除');
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