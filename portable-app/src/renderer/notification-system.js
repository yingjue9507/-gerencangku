/**
 * 通知系统 - 用于显示各种类型的用户反馈
 */
class NotificationSystem {
    constructor() {
        this.notifications = new Map();
        this.notificationId = 0;
        this.maxNotifications = 5;
        this.defaultDuration = 5000; // 5秒
        
        this.initializeContainer();
    }

    // 初始化通知容器
    initializeContainer() {
        // 检查是否已存在容器
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
        this.container = container;
    }

    // 显示成功通知
    success(message, options = {}) {
        return this.show(message, 'success', options);
    }

    // 显示错误通知
    error(message, options = {}) {
        return this.show(message, 'error', { ...options, duration: options.duration || 8000 });
    }

    // 显示警告通知
    warning(message, options = {}) {
        return this.show(message, 'warning', options);
    }

    // 显示信息通知
    info(message, options = {}) {
        return this.show(message, 'info', options);
    }

    // 显示加载通知
    loading(message, options = {}) {
        return this.show(message, 'loading', { ...options, duration: 0 }); // 不自动消失
    }

    // 显示通知
    show(message, type = 'info', options = {}) {
        const id = ++this.notificationId;
        const duration = options.duration !== undefined ? options.duration : this.defaultDuration;
        const closable = options.closable !== false;
        const actions = options.actions || [];

        // 如果通知数量超过限制，移除最旧的
        if (this.notifications.size >= this.maxNotifications) {
            const oldestId = this.notifications.keys().next().value;
            this.hide(oldestId);
        }

        const notification = this.createNotificationElement(id, message, type, closable, actions);
        this.container.appendChild(notification);

        // 添加到管理器
        const notificationData = {
            id,
            element: notification,
            type,
            message,
            timestamp: Date.now(),
            duration
        };
        this.notifications.set(id, notificationData);

        // 显示动画
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // 自动隐藏
        if (duration > 0) {
            setTimeout(() => {
                this.hide(id);
            }, duration);
        }

        return id;
    }

    // 创建通知元素
    createNotificationElement(id, message, type, closable, actions) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.setAttribute('data-id', id);

        const icon = this.getTypeIcon(type);
        
        let actionsHtml = '';
        if (actions.length > 0) {
            actionsHtml = `
                <div class="notification-actions">
                    ${actions.map(action => `
                        <button class="notification-action-btn" onclick="notificationSystem.handleAction(${id}, '${action.id}')">
                            ${action.text}
                        </button>
                    `).join('')}
                </div>
            `;
        }

        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">${icon}</div>
                <div class="notification-message">${message}</div>
                ${closable ? `<button class="notification-close" onclick="notificationSystem.hide(${id})">&times;</button>` : ''}
            </div>
            ${actionsHtml}
            ${type === 'loading' ? '<div class="notification-progress"></div>' : ''}
        `;

        return notification;
    }

    // 获取类型图标
    getTypeIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
            loading: '⏳'
        };
        return icons[type] || icons.info;
    }

    // 隐藏通知
    hide(id) {
        const notificationData = this.notifications.get(id);
        if (!notificationData) return;

        const element = notificationData.element;
        element.classList.add('hide');

        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            this.notifications.delete(id);
        }, 300);
    }

    // 处理操作按钮点击
    handleAction(notificationId, actionId) {
        const notificationData = this.notifications.get(notificationId);
        if (!notificationData) return;

        // 触发自定义事件
        const event = new CustomEvent('notificationAction', {
            detail: { notificationId, actionId, notificationData }
        });
        document.dispatchEvent(event);

        // 隐藏通知
        this.hide(notificationId);
    }

    // 清除所有通知
    clearAll() {
        const ids = Array.from(this.notifications.keys());
        ids.forEach(id => this.hide(id));
    }

    // 清除指定类型的通知
    clearByType(type) {
        const ids = Array.from(this.notifications.entries())
            .filter(([id, data]) => data.type === type)
            .map(([id]) => id);
        ids.forEach(id => this.hide(id));
    }

    // 更新加载通知
    updateLoading(id, message) {
        const notificationData = this.notifications.get(id);
        if (!notificationData || notificationData.type !== 'loading') return;

        const messageElement = notificationData.element.querySelector('.notification-message');
        if (messageElement) {
            messageElement.textContent = message;
        }
    }

    // 将加载通知转换为其他类型
    convertLoading(id, type, message) {
        this.hide(id);
        return this.show(message, type);
    }
}

// 添加CSS样式
const notificationStyles = `
<style>
.notification-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    pointer-events: none;
}

.notification {
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    margin-bottom: 10px;
    min-width: 300px;
    max-width: 400px;
    opacity: 0;
    transform: translateX(100%);
    transition: all 0.3s ease;
    pointer-events: auto;
    border-left: 4px solid #007bff;
}

.notification.show {
    opacity: 1;
    transform: translateX(0);
}

.notification.hide {
    opacity: 0;
    transform: translateX(100%);
}

.notification-success {
    border-left-color: #28a745;
}

.notification-error {
    border-left-color: #dc3545;
}

.notification-warning {
    border-left-color: #ffc107;
}

.notification-info {
    border-left-color: #17a2b8;
}

.notification-loading {
    border-left-color: #6c757d;
}

.notification-content {
    display: flex;
    align-items: flex-start;
    padding: 16px;
    gap: 12px;
}

.notification-icon {
    font-size: 18px;
    flex-shrink: 0;
    margin-top: 2px;
}

.notification-message {
    flex: 1;
    font-size: 14px;
    line-height: 1.4;
    color: #333;
    word-wrap: break-word;
}

.notification-close {
    background: none;
    border: none;
    font-size: 18px;
    color: #999;
    cursor: pointer;
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.notification-close:hover {
    color: #666;
}

.notification-actions {
    padding: 0 16px 16px;
    display: flex;
    gap: 8px;
    justify-content: flex-end;
}

.notification-action-btn {
    background: #007bff;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    transition: background 0.2s ease;
}

.notification-action-btn:hover {
    background: #0056b3;
}

.notification-progress {
    height: 3px;
    background: #f8f9fa;
    position: relative;
    overflow: hidden;
}

.notification-progress::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, #007bff, transparent);
    animation: loading-progress 2s infinite;
}

@keyframes loading-progress {
    0% { left: -100%; }
    100% { left: 100%; }
}

/* 深色主题适配 */
.dark-theme .notification {
    background: #2d3748;
    color: #e2e8f0;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.dark-theme .notification-message {
    color: #e2e8f0;
}

.dark-theme .notification-close {
    color: #a0aec0;
}

.dark-theme .notification-close:hover {
    color: #e2e8f0;
}
</style>
`;

// 注入样式
if (!document.getElementById('notification-styles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'notification-styles';
    styleElement.innerHTML = notificationStyles;
    document.head.appendChild(styleElement);
}

// 创建全局实例
const notificationSystem = new NotificationSystem();

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationSystem;
}