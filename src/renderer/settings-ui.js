/**
 * 设置界面管理器
 * 负责创建和管理设置界面的UI组件
 */
class SettingsUI {
    constructor() {
        this.modal = null;
        this.currentSection = 'appearance';
        this.unsavedChanges = false;
        this.tempSettings = {};
        
        this.init();
    }
    
    /**
     * 初始化设置界面
     */
    init() {
        this.createModal();
        this.bindEvents();
        this.injectStyles();
    }
    
    /**
     * 显示设置界面
     */
    show(section = 'appearance') {
        this.currentSection = section;
        this.loadCurrentSettings();
        this.renderContent();
        this.modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // 聚焦到第一个输入框
        setTimeout(() => {
            const firstInput = this.modal.querySelector('input, select, textarea');
            if (firstInput) firstInput.focus();
        }, 100);
    }
    
    /**
     * 隐藏设置界面
     */
    hide() {
        if (this.unsavedChanges) {
            if (!confirm('有未保存的更改，确定要关闭吗？')) {
                return;
            }
        }
        
        this.modal.style.display = 'none';
        document.body.style.overflow = '';
        this.unsavedChanges = false;
        this.tempSettings = {};
    }
    
    /**
     * 创建模态框
     */
    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'settings-modal';
        this.modal.innerHTML = `
            <div class="settings-container">
                <div class="settings-header">
                    <h2>应用设置</h2>
                    <button class="settings-close" title="关闭">×</button>
                </div>
                
                <div class="settings-body">
                    <div class="settings-sidebar">
                        <nav class="settings-nav">
                            <button class="nav-item" data-section="appearance">
                                <span class="nav-icon">🎨</span>
                                <span class="nav-text">外观</span>
                            </button>
                            <button class="nav-item" data-section="performance">
                                <span class="nav-icon">⚡</span>
                                <span class="nav-text">性能</span>
                            </button>
                            <button class="nav-item" data-section="notifications">
                                <span class="nav-icon">🔔</span>
                                <span class="nav-text">通知</span>
                            </button>
                            <button class="nav-item" data-section="aiServices">
                                <span class="nav-icon">🤖</span>
                                <span class="nav-text">AI服务</span>
                            </button>
                            <button class="nav-item" data-section="security">
                                <span class="nav-icon">🔒</span>
                                <span class="nav-text">安全</span>
                            </button>
                            <button class="nav-item" data-section="window">
                                <span class="nav-icon">🪟</span>
                                <span class="nav-text">窗口</span>
                            </button>
                            <button class="nav-item" data-section="developer">
                                <span class="nav-icon">🛠️</span>
                                <span class="nav-text">开发者</span>
                            </button>
                        </nav>
                    </div>
                    
                    <div class="settings-content">
                        <div class="settings-section-content">
                            <!-- 动态内容 -->
                        </div>
                    </div>
                </div>
                
                <div class="settings-footer">
                    <div class="settings-actions">
                        <button class="btn btn-secondary" id="resetSettings">重置</button>
                        <button class="btn btn-secondary" id="importSettings">导入</button>
                        <button class="btn btn-secondary" id="exportSettings">导出</button>
                        <div class="spacer"></div>
                        <button class="btn btn-secondary" id="cancelSettings">取消</button>
                        <button class="btn btn-primary" id="saveSettings">保存</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.modal);
    }
    
    /**
     * 绑定事件
     */
    bindEvents() {
        // 关闭按钮
        this.modal.querySelector('.settings-close').addEventListener('click', () => {
            this.hide();
        });
        
        // 点击背景关闭
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide();
            }
        });
        
        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'flex') {
                this.hide();
            }
        });
        
        // 导航按钮
        this.modal.querySelector('.settings-nav').addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item');
            if (navItem) {
                const section = navItem.dataset.section;
                this.switchSection(section);
            }
        });
        
        // 底部按钮
        this.modal.querySelector('#saveSettings').addEventListener('click', () => {
            this.saveSettings();
        });
        
        this.modal.querySelector('#cancelSettings').addEventListener('click', () => {
            this.hide();
        });
        
        this.modal.querySelector('#resetSettings').addEventListener('click', () => {
            this.resetSettings();
        });
        
        this.modal.querySelector('#importSettings').addEventListener('click', () => {
            this.importSettings();
        });
        
        this.modal.querySelector('#exportSettings').addEventListener('click', () => {
            this.exportSettings();
        });
    }
    
    /**
     * 切换设置分区
     */
    switchSection(section) {
        this.currentSection = section;
        
        // 更新导航状态
        this.modal.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.section === section);
        });
        
        // 渲染内容
        this.renderContent();
    }
    
    /**
     * 渲染设置内容
     */
    renderContent() {
        const content = this.modal.querySelector('.settings-section-content');
        const sectionData = this.getSectionData(this.currentSection);
        
        content.innerHTML = `
            <div class="section-header">
                <h3>${sectionData.title}</h3>
                <p class="section-description">${sectionData.description}</p>
            </div>
            
            <div class="section-fields">
                ${sectionData.fields.map(field => this.renderField(field)).join('')}
            </div>
        `;
        
        // 绑定字段事件
        this.bindFieldEvents();
        
        // 更新导航状态
        this.modal.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.section === this.currentSection);
        });
    }
    
    /**
     * 渲染单个字段
     */
    renderField(field) {
        const value = this.tempSettings[`${this.currentSection}.${field.key}`] ?? 
                     window.settingsManager.get(`${this.currentSection}.${field.key}`);
        
        switch (field.type) {
            case 'select':
                return `
                    <div class="field-group">
                        <label class="field-label">${field.label}</label>
                        <select class="field-input" data-path="${this.currentSection}.${field.key}">
                            ${field.options.map(option => `
                                <option value="${option.value}" ${value === option.value ? 'selected' : ''}>
                                    ${option.label}
                                </option>
                            `).join('')}
                        </select>
                        ${field.description ? `<p class="field-description">${field.description}</p>` : ''}
                    </div>
                `;
                
            case 'checkbox':
                return `
                    <div class="field-group">
                        <label class="field-label checkbox-label">
                            <input type="checkbox" class="field-input" 
                                   data-path="${this.currentSection}.${field.key}"
                                   ${value ? 'checked' : ''}>
                            <span class="checkbox-text">${field.label}</span>
                        </label>
                        ${field.description ? `<p class="field-description">${field.description}</p>` : ''}
                    </div>
                `;
                
            case 'number':
                return `
                    <div class="field-group">
                        <label class="field-label">${field.label}</label>
                        <input type="number" class="field-input" 
                               data-path="${this.currentSection}.${field.key}"
                               value="${value}"
                               min="${field.min || ''}"
                               max="${field.max || ''}"
                               step="${field.step || '1'}">
                        ${field.description ? `<p class="field-description">${field.description}</p>` : ''}
                    </div>
                `;
                
            case 'range':
                return `
                    <div class="field-group">
                        <label class="field-label">${field.label}</label>
                        <div class="range-input-group">
                            <input type="range" class="field-input range-input" 
                                   data-path="${this.currentSection}.${field.key}"
                                   value="${value}"
                                   min="${field.min || 0}"
                                   max="${field.max || 100}"
                                   step="${field.step || 1}">
                            <span class="range-value">${value}${field.unit || ''}</span>
                        </div>
                        ${field.description ? `<p class="field-description">${field.description}</p>` : ''}
                    </div>
                `;
                
            default:
                return `
                    <div class="field-group">
                        <label class="field-label">${field.label}</label>
                        <input type="text" class="field-input" 
                               data-path="${this.currentSection}.${field.key}"
                               value="${value}">
                        ${field.description ? `<p class="field-description">${field.description}</p>` : ''}
                    </div>
                `;
        }
    }
    
    /**
     * 绑定字段事件
     */
    bindFieldEvents() {
        const inputs = this.modal.querySelectorAll('.field-input');
        
        inputs.forEach(input => {
            const path = input.dataset.path;
            
            const updateValue = () => {
                let value;
                
                if (input.type === 'checkbox') {
                    value = input.checked;
                } else if (input.type === 'number' || input.type === 'range') {
                    value = parseFloat(input.value);
                } else {
                    value = input.value;
                }
                
                this.tempSettings[path] = value;
                this.unsavedChanges = true;
                
                // 更新范围输入的显示值
                if (input.type === 'range') {
                    const valueSpan = input.parentElement.querySelector('.range-value');
                    if (valueSpan) {
                        const unit = valueSpan.textContent.replace(/[0-9.]/g, '');
                        valueSpan.textContent = value + unit;
                    }
                }
                
                // 实时预览某些设置
                this.previewSetting(path, value);
            };
            
            input.addEventListener('change', updateValue);
            input.addEventListener('input', updateValue);
        });
    }
    
    /**
     * 实时预览设置
     */
    previewSetting(path, value) {
        const [section, key] = path.split('.');
        
        // 只预览外观相关设置
        if (section === 'appearance') {
            if (key === 'theme') {
                document.documentElement.setAttribute('data-theme', value);
            } else if (key === 'fontSize') {
                document.documentElement.setAttribute('data-font-size', value);
            }
        }
    }
    
    /**
     * 加载当前设置
     */
    loadCurrentSettings() {
        this.tempSettings = {};
    }
    
    /**
     * 保存设置
     */
    async saveSettings() {
        try {
            // 保存所有临时设置
            for (const [path, value] of Object.entries(this.tempSettings)) {
                await window.settingsManager.set(path, value);
            }
            
            this.unsavedChanges = false;
            this.tempSettings = {};
            
            // 显示成功通知
            if (window.notificationSystem) {
                window.notificationSystem.success('设置已保存');
            }
            
            this.hide();
        } catch (error) {
            console.error('保存设置失败:', error);
            
            if (window.notificationSystem) {
                window.notificationSystem.error('保存设置失败: ' + error.message);
            }
        }
    }
    
    /**
     * 重置设置
     */
    async resetSettings() {
        if (!confirm('确定要重置当前分区的设置吗？这将恢复所有默认值。')) {
            return;
        }
        
        try {
            await window.settingsManager.reset(this.currentSection);
            this.tempSettings = {};
            this.unsavedChanges = false;
            this.renderContent();
            
            if (window.notificationSystem) {
                window.notificationSystem.success('设置已重置');
            }
        } catch (error) {
            console.error('重置设置失败:', error);
            
            if (window.notificationSystem) {
                window.notificationSystem.error('重置设置失败: ' + error.message);
            }
        }
    }
    
    /**
     * 导入设置
     */
    importSettings() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const success = await window.settingsManager.importSettings(text);
                
                if (success) {
                    this.tempSettings = {};
                    this.unsavedChanges = false;
                    this.renderContent();
                    
                    if (window.notificationSystem) {
                        window.notificationSystem.success('设置导入成功');
                    }
                } else {
                    throw new Error('导入失败');
                }
            } catch (error) {
                console.error('导入设置失败:', error);
                
                if (window.notificationSystem) {
                    window.notificationSystem.error('导入设置失败: ' + error.message);
                }
            }
        };
        
        input.click();
    }
    
    /**
     * 导出设置
     */
    exportSettings() {
        try {
            const settings = window.settingsManager.exportSettings();
            const blob = new Blob([settings], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `app-settings-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            
            if (window.notificationSystem) {
                window.notificationSystem.success('设置导出成功');
            }
        } catch (error) {
            console.error('导出设置失败:', error);
            
            if (window.notificationSystem) {
                window.notificationSystem.error('导出设置失败: ' + error.message);
            }
        }
    }
    
    /**
     * 获取分区数据
     */
    getSectionData(section) {
        const sections = {
            appearance: {
                title: '外观设置',
                description: '自定义应用的外观和主题',
                fields: [
                    {
                        key: 'theme',
                        label: '主题',
                        type: 'select',
                        options: [
                            { value: 'light', label: '浅色' },
                            { value: 'dark', label: '深色' },
                            { value: 'auto', label: '跟随系统' }
                        ],
                        description: '选择应用主题'
                    },
                    {
                        key: 'fontSize',
                        label: '字体大小',
                        type: 'select',
                        options: [
                            { value: 'small', label: '小' },
                            { value: 'medium', label: '中' },
                            { value: 'large', label: '大' }
                        ],
                        description: '调整界面字体大小'
                    },
                    {
                        key: 'language',
                        label: '语言',
                        type: 'select',
                        options: [
                            { value: 'zh-CN', label: '简体中文' },
                            { value: 'en-US', label: 'English' }
                        ],
                        description: '选择界面语言'
                    },
                    {
                        key: 'showStatusBar',
                        label: '显示状态栏',
                        type: 'checkbox',
                        description: '在底部显示状态信息'
                    },
                    {
                        key: 'showSidebar',
                        label: '显示侧边栏',
                        type: 'checkbox',
                        description: '显示AI服务列表侧边栏'
                    },
                    {
                        key: 'compactMode',
                        label: '紧凑模式',
                        type: 'checkbox',
                        description: '使用更紧凑的界面布局'
                    }
                ]
            },
            
            performance: {
                title: '性能设置',
                description: '优化应用性能和资源使用',
                fields: [
                    {
                        key: 'enablePerformanceMonitoring',
                        label: '启用性能监控',
                        type: 'checkbox',
                        description: '监控应用性能指标'
                    },
                    {
                        key: 'memoryWarningThreshold',
                        label: '内存警告阈值',
                        type: 'range',
                        min: 50,
                        max: 100,
                        step: 5,
                        unit: '%',
                        description: '内存使用超过此值时显示警告'
                    },
                    {
                        key: 'memoryCriticalThreshold',
                        label: '内存临界阈值',
                        type: 'range',
                        min: 80,
                        max: 100,
                        step: 5,
                        unit: '%',
                        description: '内存使用超过此值时强制清理'
                    },
                    {
                        key: 'autoCleanupInterval',
                        label: '自动清理间隔',
                        type: 'number',
                        min: 60000,
                        max: 3600000,
                        step: 60000,
                        description: '自动清理内存的间隔时间（毫秒）'
                    },
                    {
                        key: 'enableResourceOptimization',
                        label: '启用资源优化',
                        type: 'checkbox',
                        description: '自动优化资源加载和缓存'
                    },
                    {
                        key: 'maxConcurrentRequests',
                        label: '最大并发请求',
                        type: 'number',
                        min: 1,
                        max: 10,
                        description: '同时进行的最大请求数量'
                    }
                ]
            },
            
            notifications: {
                title: '通知设置',
                description: '配置通知行为和显示',
                fields: [
                    {
                        key: 'enableNotifications',
                        label: '启用通知',
                        type: 'checkbox',
                        description: '显示应用通知'
                    },
                    {
                        key: 'showSuccessNotifications',
                        label: '显示成功通知',
                        type: 'checkbox',
                        description: '显示操作成功的通知'
                    },
                    {
                        key: 'showErrorNotifications',
                        label: '显示错误通知',
                        type: 'checkbox',
                        description: '显示错误和警告通知'
                    },
                    {
                        key: 'showWarningNotifications',
                        label: '显示警告通知',
                        type: 'checkbox',
                        description: '显示警告类型的通知'
                    },
                    {
                        key: 'autoHideDelay',
                        label: '自动隐藏延迟',
                        type: 'range',
                        min: 1000,
                        max: 30000,
                        step: 1000,
                        unit: 'ms',
                        description: '通知自动消失的延迟时间'
                    },
                    {
                        key: 'soundEnabled',
                        label: '启用声音',
                        type: 'checkbox',
                        description: '通知时播放声音'
                    }
                ]
            },
            
            aiServices: {
                title: 'AI服务设置',
                description: '配置AI服务连接和行为',
                fields: [
                    {
                        key: 'autoConnect',
                        label: '自动连接',
                        type: 'checkbox',
                        description: '启动时自动连接AI服务'
                    },
                    {
                        key: 'defaultService',
                        label: '默认服务',
                        type: 'select',
                        options: [
                            { value: 'chatgpt', label: 'ChatGPT' },
                            { value: 'claude', label: 'Claude' },
                            { value: 'gemini', label: 'Gemini' },
                            { value: 'copilot', label: 'Copilot' }
                        ],
                        description: '默认使用的AI服务'
                    },
                    {
                        key: 'enableServiceRotation',
                        label: '启用服务轮换',
                        type: 'checkbox',
                        description: '自动轮换使用不同的AI服务'
                    },
                    {
                        key: 'maxRetryAttempts',
                        label: '最大重试次数',
                        type: 'number',
                        min: 0,
                        max: 10,
                        description: '连接失败时的最大重试次数'
                    },
                    {
                        key: 'connectionTimeout',
                        label: '连接超时',
                        type: 'number',
                        min: 5000,
                        max: 60000,
                        step: 1000,
                        description: '连接超时时间（毫秒）'
                    },
                    {
                        key: 'enableServiceHealthCheck',
                        label: '启用健康检查',
                        type: 'checkbox',
                        description: '定期检查服务连接状态'
                    }
                ]
            },
            
            security: {
                title: '安全设置',
                description: '配置应用安全选项',
                fields: [
                    {
                        key: 'enableSandbox',
                        label: '启用沙箱',
                        type: 'checkbox',
                        description: '在沙箱环境中运行AI服务'
                    },
                    {
                        key: 'blockExternalRequests',
                        label: '阻止外部请求',
                        type: 'checkbox',
                        description: '阻止向外部服务器的请求'
                    },
                    {
                        key: 'enableCookieIsolation',
                        label: '启用Cookie隔离',
                        type: 'checkbox',
                        description: '隔离不同服务的Cookie'
                    },
                    {
                        key: 'clearDataOnExit',
                        label: '退出时清除数据',
                        type: 'checkbox',
                        description: '应用退出时清除所有数据'
                    },
                    {
                        key: 'enableSecureHeaders',
                        label: '启用安全头',
                        type: 'checkbox',
                        description: '添加安全相关的HTTP头'
                    }
                ]
            },
            
            window: {
                title: '窗口设置',
                description: '配置应用窗口行为',
                fields: [
                    {
                        key: 'width',
                        label: '窗口宽度',
                        type: 'number',
                        min: 400,
                        max: 4000,
                        description: '应用窗口的默认宽度'
                    },
                    {
                        key: 'height',
                        label: '窗口高度',
                        type: 'number',
                        min: 300,
                        max: 3000,
                        description: '应用窗口的默认高度'
                    },
                    {
                        key: 'rememberPosition',
                        label: '记住窗口位置',
                        type: 'checkbox',
                        description: '记住窗口的位置和大小'
                    },
                    {
                        key: 'rememberSize',
                        label: '记住窗口大小',
                        type: 'checkbox',
                        description: '记住窗口的大小设置'
                    },
                    {
                        key: 'startMaximized',
                        label: '启动时最大化',
                        type: 'checkbox',
                        description: '应用启动时自动最大化窗口'
                    },
                    {
                        key: 'alwaysOnTop',
                        label: '总是置顶',
                        type: 'checkbox',
                        description: '窗口总是保持在最前面'
                    }
                ]
            },
            
            developer: {
                title: '开发者设置',
                description: '开发和调试相关选项',
                fields: [
                    {
                        key: 'enableDevTools',
                        label: '启用开发者工具',
                        type: 'checkbox',
                        description: '允许打开开发者工具'
                    },
                    {
                        key: 'enableVerboseLogging',
                        label: '详细日志',
                        type: 'checkbox',
                        description: '输出详细的调试日志'
                    },
                    {
                        key: 'enablePerformanceLogging',
                        label: '性能日志',
                        type: 'checkbox',
                        description: '记录性能相关日志'
                    },
                    {
                        key: 'enableErrorReporting',
                        label: '错误报告',
                        type: 'checkbox',
                        description: '自动报告错误信息'
                    },
                    {
                        key: 'debugMode',
                        label: '调试模式',
                        type: 'checkbox',
                        description: '启用调试模式'
                    }
                ]
            }
        };
        
        return sections[section] || sections.appearance;
    }
    
    /**
     * 注入样式
     */
    injectStyles() {
        if (document.getElementById('settings-ui-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'settings-ui-styles';
        style.textContent = `
            .settings-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                backdrop-filter: blur(4px);
            }
            
            .settings-container {
                background: var(--bg-primary);
                border-radius: 12px;
                width: 90vw;
                max-width: 900px;
                height: 80vh;
                max-height: 700px;
                display: flex;
                flex-direction: column;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                border: 1px solid var(--border-color);
            }
            
            .settings-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 20px 24px;
                border-bottom: 1px solid var(--border-color);
                background: var(--bg-secondary);
                border-radius: 12px 12px 0 0;
            }
            
            .settings-header h2 {
                margin: 0;
                color: var(--text-primary);
                font-size: 1.5rem;
                font-weight: 600;
            }
            
            .settings-close {
                background: none;
                border: none;
                font-size: 24px;
                color: var(--text-secondary);
                cursor: pointer;
                padding: 4px 8px;
                border-radius: 4px;
                transition: all 0.2s ease;
            }
            
            .settings-close:hover {
                background: var(--bg-hover);
                color: var(--text-primary);
            }
            
            .settings-body {
                display: flex;
                flex: 1;
                overflow: hidden;
            }
            
            .settings-sidebar {
                width: 200px;
                background: var(--bg-secondary);
                border-right: 1px solid var(--border-color);
                overflow-y: auto;
            }
            
            .settings-nav {
                padding: 16px 0;
            }
            
            .nav-item {
                display: flex;
                align-items: center;
                width: 100%;
                padding: 12px 20px;
                background: none;
                border: none;
                color: var(--text-secondary);
                cursor: pointer;
                transition: all 0.2s ease;
                text-align: left;
                gap: 12px;
            }
            
            .nav-item:hover {
                background: var(--bg-hover);
                color: var(--text-primary);
            }
            
            .nav-item.active {
                background: var(--accent-color);
                color: white;
            }
            
            .nav-icon {
                font-size: 16px;
                width: 20px;
                text-align: center;
            }
            
            .nav-text {
                font-size: 14px;
                font-weight: 500;
            }
            
            .settings-content {
                flex: 1;
                overflow-y: auto;
                padding: 24px;
            }
            
            .section-header {
                margin-bottom: 24px;
            }
            
            .section-header h3 {
                margin: 0 0 8px 0;
                color: var(--text-primary);
                font-size: 1.25rem;
                font-weight: 600;
            }
            
            .section-description {
                margin: 0;
                color: var(--text-secondary);
                font-size: 14px;
            }
            
            .section-fields {
                display: flex;
                flex-direction: column;
                gap: 20px;
            }
            
            .field-group {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .field-label {
                color: var(--text-primary);
                font-weight: 500;
                font-size: 14px;
            }
            
            .checkbox-label {
                display: flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
            }
            
            .checkbox-text {
                color: var(--text-primary);
            }
            
            .field-input {
                padding: 8px 12px;
                border: 1px solid var(--border-color);
                border-radius: 6px;
                background: var(--bg-primary);
                color: var(--text-primary);
                font-size: 14px;
                transition: all 0.2s ease;
            }
            
            .field-input:focus {
                outline: none;
                border-color: var(--accent-color);
                box-shadow: 0 0 0 3px rgba(var(--accent-rgb), 0.1);
            }
            
            .field-input[type="checkbox"] {
                width: 16px;
                height: 16px;
                margin: 0;
                cursor: pointer;
            }
            
            .range-input-group {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .range-input {
                flex: 1;
                height: 6px;
                background: var(--bg-secondary);
                border-radius: 3px;
                outline: none;
                cursor: pointer;
            }
            
            .range-input::-webkit-slider-thumb {
                appearance: none;
                width: 18px;
                height: 18px;
                background: var(--accent-color);
                border-radius: 50%;
                cursor: pointer;
            }
            
            .range-value {
                min-width: 60px;
                text-align: right;
                color: var(--text-secondary);
                font-size: 14px;
                font-weight: 500;
            }
            
            .field-description {
                margin: 0;
                color: var(--text-secondary);
                font-size: 12px;
                line-height: 1.4;
            }
            
            .settings-footer {
                padding: 20px 24px;
                border-top: 1px solid var(--border-color);
                background: var(--bg-secondary);
                border-radius: 0 0 12px 12px;
            }
            
            .settings-actions {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .spacer {
                flex: 1;
            }
            
            .btn {
                padding: 8px 16px;
                border: 1px solid var(--border-color);
                border-radius: 6px;
                background: var(--bg-primary);
                color: var(--text-primary);
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s ease;
            }
            
            .btn:hover {
                background: var(--bg-hover);
            }
            
            .btn-primary {
                background: var(--accent-color);
                color: white;
                border-color: var(--accent-color);
            }
            
            .btn-primary:hover {
                background: var(--accent-hover);
                border-color: var(--accent-hover);
            }
            
            .btn-secondary {
                background: var(--bg-secondary);
            }
            
            .btn-secondary:hover {
                background: var(--bg-hover);
            }
            
            /* 响应式设计 */
            @media (max-width: 768px) {
                .settings-container {
                    width: 95vw;
                    height: 90vh;
                }
                
                .settings-sidebar {
                    width: 160px;
                }
                
                .nav-text {
                    font-size: 12px;
                }
                
                .settings-content {
                    padding: 16px;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
}

// 创建全局设置界面实例
window.settingsUI = new SettingsUI();

// 导出设置界面
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SettingsUI;
}