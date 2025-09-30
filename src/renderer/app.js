// 主应用逻辑
class MultiAIBrowser {
    constructor() {
        this.aiWindows = new Map(); // 保留用于兼容性
        this.aiPanels = new Map(); // 新的面板管理
        this.config = {};
        this.currentLayout = 'grid-2x2'; // 当前布局模式
        
        // 加载保存的布局设置
        this.loadLayoutConfig();
        
        this.init();
    }

    async init() {
        console.log('初始化多AI浏览器...');
        
        this.showLoading(true);
        this.updateConnectionStatus('connecting', '初始化中...');
        
        try {
            // 显示初始化通知
            console.log('步骤1: 创建初始化通知');
            const initNotificationId = notificationSystem.loading('正在初始化应用程序...');
            console.log('初始化通知ID:', initNotificationId);
            
            // 初始化计数器
            console.log('步骤2: 初始化计数器');
            this.messageCount = 0;
            
            // 初始化性能优化系统
            console.log('步骤3: 初始化性能优化系统');
            this.initializePerformanceOptimization();
            console.log('性能优化系统初始化完成');
            
            // 初始化适配器管理器
            console.log('步骤4: 检查并初始化适配器管理器');
            if (typeof adapterManager !== 'undefined') {
                console.log('适配器管理器存在，开始初始化...');
                await adapterManager.initialize();
                console.log('适配器管理器初始化完成');
            } else {
                console.warn('适配器管理器未定义，跳过初始化');
            }
            
            // 加载配置
            console.log('步骤5: 加载配置');
            await this.loadConfig();
            console.log('配置加载完成');
            
            // 初始化UI
            console.log('步骤6: 初始化UI');
            this.initUI();
            console.log('UI初始化完成');
            
            // 加载已有的AI窗口
            console.log('步骤7: 加载已有的AI窗口');
            await this.loadAIWindows();
            console.log('AI窗口加载完成');
            
            console.log('步骤8: 更新连接状态');
            this.updateConnectionStatus('ready', '就绪');
            
            // 初始化右键菜单
            console.log('步骤9: 初始化右键菜单');
            if (typeof initializeContextMenu === 'function') {
                initializeContextMenu();
            }
            
            // 转换加载通知为成功通知
            console.log('步骤10: 转换初始化通知为成功状态');
            console.log('转换通知ID:', initNotificationId);
            notificationSystem.convertLoading(initNotificationId, 'success', '应用程序初始化完成');
            console.log('初始化通知已转换为成功状态');
            
            console.log('多AI浏览器初始化完成');
        } catch (error) {
            console.error('应用初始化失败:', error);
            console.error('错误堆栈:', error.stack);
            errorHandler.handleError({
                type: 'javascript',
                message: `应用初始化失败: ${error.message}`,
                context: { operation: 'app_initialization' },
                error
            });
        } finally {
            console.log('步骤10: 隐藏加载状态');
            this.showLoading(false);
        }
    }

    async loadConfig() {
        try {
            this.config = await window.electronAPI.loadConfig();
            console.log('配置加载成功:', this.config);
        } catch (error) {
            console.error('配置加载失败:', error);
            this.config = this.getDefaultConfig();
        }
        
        // 加载自定义服务
        this.loadCustomServices();
    }

    getDefaultConfig() {
        return {
            aiServices: [
                {
                    id: 'chatgpt',
                    name: 'ChatGPT',
                    url: 'https://chat.openai.com',
                    icon: '🤖',
                    adapter: 'ChatGPTAdapter',
                    enabled: true
                },
                {
                    id: 'claude',
                    name: 'Claude',
                    url: 'https://claude.ai',
                    icon: '🧠',
                    adapter: 'ClaudeAdapter',
                    enabled: true
                },
                {
                    id: 'gemini',
                    name: 'Gemini',
                    url: 'https://gemini.google.com',
                    icon: '✨',
                    adapter: 'GeminiAdapter',
                    enabled: true
                },
                {
                    id: 'copilot',
                    name: 'Copilot',
                    url: 'https://copilot.microsoft.com',
                    icon: '🚀',
                    adapter: 'CopilotAdapter',
                    enabled: true
                }
            ],
            windowSettings: {
                width: 1200,
                height: 800,
                alwaysOnTop: false
            }
        };
    }

    initUI() {
        console.log('开始初始化UI...');
        
        // 渲染AI服务列表
        console.log('渲染AI服务列表...');
        this.renderAIServices();
        console.log('AI服务列表渲染完成');
        
        // 绑定事件
        console.log('开始绑定事件...');
        this.bindEvents();
        console.log('事件绑定完成');
        
        // 初始化布局按钮状态
        this.updateLayoutButtons();
        
        // 初始化设置系统
        console.log('初始化设置系统...');
        this.initializeSettings();
        console.log('设置系统初始化完成');
        
        console.log('UI初始化完成');
    }

    renderAIServices() {
        const container = document.getElementById('aiServices');
        container.innerHTML = '';

        // 安全检查：确保config和aiServices存在
        if (!this.config || !this.config.aiServices || !Array.isArray(this.config.aiServices)) {
            console.error('配置或AI服务列表不存在，使用默认配置');
            this.config = this.getDefaultConfig();
        }

        this.config.aiServices.forEach(service => {
            if (!service.enabled) return;

            const serviceElement = document.createElement('div');
            // 根据是否为自定义服务设置不同的CSS类
            serviceElement.className = service.isCustom ? 'custom-service-item' : 'service-item';
            serviceElement.dataset.serviceId = service.id;
            
            serviceElement.innerHTML = `
                <div class="service-icon" style="background-color: ${service.icon}">
                    ${service.name.charAt(0)}
                </div>
                <div class="service-info">
                    <div class="service-name">${service.name}</div>
                    <div class="service-status">点击打开</div>
                </div>
            `;

            serviceElement.addEventListener('click', () => {
                this.openAIService(service);
            });

            container.appendChild(serviceElement);
        });

        // 添加"添加新服务"按钮
        const addServiceBtn = document.createElement('div');
        addServiceBtn.className = 'add-service-btn';
        addServiceBtn.innerHTML = `
            <span class="plus-icon">+</span>
            <span>添加新的AI服务</span>
        `;
        
        addServiceBtn.addEventListener('click', () => {
            this.showAddServiceModal();
        });

        container.appendChild(addServiceBtn);
        
        // 重新绑定右键菜单事件
        if (window.contextMenuManager) {
            console.log('重新绑定右键菜单事件...');
            setTimeout(() => {
                window.contextMenuManager.refreshContextMenuBindings();
            }, 100);
        }
    }

    bindEvents() {
        console.log('开始绑定事件...');
        
        // 使用更安全的方式绑定事件，添加重试机制
        const bindEventWithRetry = (elementId, eventType, handler, description) => {
            const maxRetries = 3;
            let retries = 0;
            
            const tryBind = () => {
                const element = document.getElementById(elementId);
                console.log(`尝试绑定 ${elementId} (第${retries + 1}次):`, element);
                
                if (element) {
                    element.addEventListener(eventType, (e) => {
                        console.log(`${description} 被点击`, e);
                        try {
                            handler.call(this, e);
                        } catch (error) {
                             console.error(`${description} 处理函数执行错误:`, error);
                             this.notificationSystem?.error(`${description} 执行失败: ${error.message}`);
                         }
                    });
                    console.log(`${description} 事件已绑定`);
                    return true;
                } else {
                    console.error(`未找到元素: ${elementId}`);
                    retries++;
                    if (retries < maxRetries) {
                        console.log(`将在100ms后重试绑定 ${elementId}`);
                        setTimeout(tryBind, 100);
                    } else {
                         console.error(`绑定 ${elementId} 失败，已达到最大重试次数`);
                         this.notificationSystem?.error(`无法找到按钮: ${elementId}`);
                     }
                    return false;
                }
            };
            
            return tryBind();
        };

        // 绑定所有按钮事件
        bindEventWithRetry('quickStartBtn', 'click', this.quickStart, '快速开始按钮');
        bindEventWithRetry('openTestBtn', 'click', this.openTestPage, '打开测试页面按钮');
        bindEventWithRetry('refreshBtn', 'click', this.refreshAIWindows, '刷新按钮');
        bindEventWithRetry('settingsBtn', 'click', this.openSettings, '设置按钮');
        bindEventWithRetry('testBtn', 'click', this.openTestPage, '测试按钮');
        bindEventWithRetry('recallWindowBtn', 'click', this.showRecallWindowDialog, '收回窗口按钮');
        
        // 窗口控制按钮
        bindEventWithRetry('minimizeBtn', 'click', this.minimizeWindow, '最小化按钮');
        bindEventWithRetry('closeBtn', 'click', this.closeWindow, '关闭按钮');
        
        // 布局控制按钮
        bindEventWithRetry('layoutGrid', 'click', () => this.setLayout('grid-2x2'), '网格布局按钮');
        bindEventWithRetry('layoutVertical', 'click', () => this.setLayout('vertical-split'), '垂直分割按钮');
        bindEventWithRetry('layoutHorizontal', 'click', () => this.setLayout('horizontal-split'), '水平分割按钮');
        bindEventWithRetry('resetLayout', 'click', this.resetLayout, '重置布局按钮');
        
        // 绑定窗口大小变化事件
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });
        
        // 性能优化相关事件监听器
        this.setupPerformanceEventListeners();

        // 启动状态栏更新
        this.startStatusBarUpdates();
        
        console.log('所有事件绑定完成');
    }

    async openAIService(service) {
        try {
            this.showLoading(true);
            this.updateConnectionStatus('connecting', `正在连接 ${service.name}...`);
            
            // 显示连接通知
            const connectNotificationId = notificationSystem.loading(`正在连接 ${service.name}...`);
            
            console.log(`正在打开 ${service.name}...`);
            
            // 检查是否已经打开
            if (this.aiPanels.has(service.id)) {
                notificationSystem.convertLoading(connectNotificationId, 'info', `${service.name} 已经打开`);
                this.showLoading(false);
                return;
            }
            
            // 创建AI面板
            const panel = this.createAIPanel(service);
            this.aiPanels.set(service.id, panel);
            
            // 显示AI容器并隐藏欢迎界面
            this.showAIContainer();
            
            // 更新布局
            this.updateLayout();
            
            this.updateServiceStatus(service.id, '已打开');
            this.updateConnectionStatus('connected', `${service.name} 已连接`);
            
            // 转换为成功通知
            notificationSystem.convertLoading(connectNotificationId, 'success', `${service.name} 连接成功`);
            
            console.log(`${service.name} 面板创建成功`);
            
        } catch (error) {
            console.error(`打开 ${service.name} 失败:`, error);
            this.updateConnectionStatus('error', `连接 ${service.name} 失败`);
            
            // 处理错误
            errorHandler.handleError({
                type: 'service_connection',
                message: `连接 ${service.name} 失败: ${error.message}`,
                context: { serviceId: service.id, serviceName: service.name },
                error
            });
        } finally {
            this.showLoading(false);
        }
    }

    createAIPanel(service) {
        const panel = {
            id: service.id,
            service: service,
            element: null,
            webview: null,
            status: 'loading'
        };

        // 创建面板元素
        const panelElement = document.createElement('div');
        panelElement.className = 'ai-panel';
        panelElement.dataset.serviceId = service.id;

        // 创建面板头部
        const header = document.createElement('div');
        header.className = 'ai-panel-header';
        header.style.background = service.color || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

        const title = document.createElement('div');
        title.className = 'ai-panel-title';
        title.innerHTML = `
            <span style="font-size: 14px;">${service.icon || '🤖'}</span>
            <span>${service.name}</span>
        `;

        const controls = document.createElement('div');
        controls.className = 'ai-panel-controls';
        controls.innerHTML = `
            <button class="panel-control-btn" title="刷新" onclick="multiAIBrowser.refreshPanel('${service.id}')">↻</button>
            <button class="panel-control-btn" title="关闭" onclick="multiAIBrowser.closePanel('${service.id}')">×</button>
        `;

        header.appendChild(title);
        header.appendChild(controls);

        // 创建面板内容
        const content = document.createElement('div');
        content.className = 'ai-panel-content';

        // 创建加载界面
        const loading = document.createElement('div');
        loading.className = 'ai-panel-loading';
        loading.innerHTML = `
            <div class="panel-loading-spinner"></div>
            <div class="panel-loading-text">正在加载 ${service.name}...</div>
        `;

        // 创建webview (替代iframe以绕过CSP限制)
        const webview = document.createElement('webview');
        webview.className = 'ai-webview';
        webview.src = service.url;
        // 设置webview基本样式，避免在加载事件前出现被遮挡的空白区域
        webview.style.background = 'transparent';
        webview.style.backgroundColor = 'transparent';
        webview.setAttribute('nodeintegration', 'false');
        webview.setAttribute('websecurity', 'false');
        webview.setAttribute('allowpopups', 'true');
        webview.setAttribute('webpreferences', 'contextIsolation=false');
        webview.setAttribute('partition', `persist:${service.id}`);
        
        // 设置User-Agent以避免被检测为自动化工具
        const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        webview.setAttribute('useragent', userAgent);

        // 处理webview内的新窗口请求
        webview.addEventListener('new-window', (event) => {
            console.log('webview new-window event:', event.url);
            
            // 检查是否是需要在新窗口中打开的URL（如登录页面）
            const shouldOpenInNewWindow = this.shouldOpenInNewWindow(event.url);
            
            if (shouldOpenInNewWindow) {
                // 允许在新窗口中打开（不调用preventDefault）
                console.log('允许在新窗口中打开:', event.url);
                // 不调用event.preventDefault()，让主进程处理
            } else {
                // 在当前webview中导航
                event.preventDefault();
                webview.src = event.url;
            }
        });

        // webview加载完成后隐藏loading
        webview.addEventListener('dom-ready', () => {
            loading.style.display = 'none';
            webview.style.background = 'transparent';
            webview.style.backgroundColor = 'transparent';
            panel.status = 'loaded';
            this.updateServiceStatus(service.id, '已连接');
            
            // 为Gemini等服务启用输入事件处理
            this.enableInputEvents(webview, service.id);
            
            // 针对Gemini的特殊处理
            if (service.id === 'gemini') {
                this.setupGeminiAntiDetection(webview);
            }
        });

        webview.addEventListener('did-fail-load', () => {
            loading.innerHTML = `
                <div style="color: #dc3545;">❌</div>
                <div class="panel-loading-text">加载失败</div>
            `;
            panel.status = 'error';
            this.updateServiceStatus(service.id, '连接失败');
        });

        content.appendChild(loading);
        content.appendChild(webview);

        panelElement.appendChild(header);
        panelElement.appendChild(content);

        panel.element = panelElement;
        panel.webview = webview;

        return panel;
    }

    showAIContainer() {
        const welcomeScreen = document.getElementById('welcomeScreen');
        const aiContainer = document.getElementById('aiContainer');
        
        if (welcomeScreen && aiContainer) {
            welcomeScreen.style.display = 'none';
            aiContainer.style.display = 'flex';
        }
    }

    enableInputEvents(webview, serviceId) {
        try {
            // 确保webview能够处理键盘和鼠标事件
            webview.addEventListener('focus', () => {
                webview.focus();
            });
            
            // 为特定服务添加额外的事件处理
            if (serviceId === 'gemini') {
                // Gemini特殊处理：确保输入框能够正常工作
                webview.addEventListener('keydown', (event) => {
                    // 允许所有键盘事件传递到webview
                    event.stopPropagation();
                });
                
                webview.addEventListener('keyup', (event) => {
                    event.stopPropagation();
                });
                
                webview.addEventListener('keypress', (event) => {
                    event.stopPropagation();
                });
            }
            
            console.log(`已为 ${serviceId} 启用输入事件处理`);
        } catch (error) {
            console.error(`启用 ${serviceId} 输入事件失败:`, error);
        }
    }

    setupGeminiAntiDetection(webview) {
        try {
            // 注入反检测脚本
            const antiDetectionScript = `
                // 隐藏webview特征
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined,
                });
                
                // 隐藏自动化工具特征
                window.chrome = window.chrome || {};
                window.chrome.runtime = window.chrome.runtime || {};
                
                // 模拟真实浏览器环境
                Object.defineProperty(navigator, 'plugins', {
                    get: () => [1, 2, 3, 4, 5],
                });
                
                // 移除webview相关的全局变量
                delete window.webview;
                delete window.electron;
                
                console.log('Gemini反检测脚本已注入');
            `;
            
            webview.executeJavaScript(antiDetectionScript);
            console.log('Gemini反检测设置完成');
        } catch (error) {
            console.error('Gemini反检测设置失败:', error);
        }
    }

    shouldOpenInNewWindow(url) {
        // 判断是否应该在新窗口中打开URL
        const newWindowPatterns = [
            // 登录相关页面
            /login/i,
            /signin/i,
            /auth/i,
            /oauth/i,
            /sso/i,
            // 注册页面
            /register/i,
            /signup/i,
            // 第三方认证
            /github\.com\/login/i,
            /google\.com\/accounts/i,
            /microsoft\.com\/.*\/oauth/i,
            // DeepSeek相关
            /chat\.deepseek\.com.*login/i,
            /chat\.deepseek\.com.*auth/i,
            // 其他AI服务的登录页面
            /openai\.com.*login/i,
            /claude\.ai.*login/i,
            /gemini\.google\.com.*login/i
        ];

        return newWindowPatterns.some(pattern => pattern.test(url));
    }

    updateLayout() {
        const aiPanelsContainer = document.getElementById('aiPanels');
        if (!aiPanelsContainer) return;

        // 清空现有面板
        aiPanelsContainer.innerHTML = '';

        // 移除所有布局类
        aiPanelsContainer.className = 'ai-panels';

        // 获取所有面板
        const panels = Array.from(this.aiPanels.values());
        
        if (panels.length === 0) {
            this.showWelcomeScreen();
            return;
        }

        // 根据面板数量和当前布局设置样式
        if (panels.length === 1) {
            aiPanelsContainer.classList.add('single-panel');
        } else if (panels.length === 2) {
            aiPanelsContainer.classList.add(this.currentLayout === 'horizontal-split' ? 'horizontal-split' : 'vertical-split');
        } else {
            aiPanelsContainer.classList.add('grid-2x2');
        }

        // 添加面板到容器
        panels.forEach(panel => {
            aiPanelsContainer.appendChild(panel.element);
        });

        // 延迟初始化调整手柄和恢复面板尺寸，确保DOM已更新
        setTimeout(() => {
            this.initializeResizeHandles();
            this.restorePanelSizes();
        }, 100);

        // 更新活跃服务数量
        this.updateWelcomeStats();
    }

    showWelcomeScreen() {
        const welcomeScreen = document.getElementById('welcomeScreen');
        const aiContainer = document.getElementById('aiContainer');
        
        if (welcomeScreen && aiContainer) {
            welcomeScreen.style.display = 'flex';
            aiContainer.style.display = 'none';
        }
    }

    refreshPanel(serviceId) {
        try {
            const panel = this.aiPanels.get(serviceId);
            if (panel && panel.webview) {
                // 检查webview是否有效且未被销毁
                if (panel.webview.isDestroyed && panel.webview.isDestroyed()) {
                    console.warn(`${serviceId} webview已被销毁，无法刷新`);
                    this.updateServiceStatus(serviceId, '刷新失败');
                    return;
                }
                
                try {
                    // 安全地调用reload方法
                    panel.webview.reload();
                    panel.status = 'loading';
                    this.updateServiceStatus(serviceId, '重新加载中...');
                    console.log(`${serviceId} 面板刷新成功`);
                } catch (reloadError) {
                    // 使用错误处理器处理reload错误，添加刷新上下文
                    if (window.errorHandler) {
                        window.errorHandler.handleError(reloadError, {
                            notify: false, // 不显示通知
                            context: { action: 'refresh', service: serviceId }
                        });
                    } else {
                        console.error(`${serviceId} webview reload失败:`, reloadError);
                    }
                    this.updateServiceStatus(serviceId, '刷新失败');
                }
            } else {
                console.warn(`未找到 ${serviceId} 面板或webview`);
                this.updateServiceStatus(serviceId, '刷新失败');
            }
        } catch (error) {
            // 使用错误处理器处理一般错误，添加刷新上下文
            if (window.errorHandler) {
                window.errorHandler.handleError(error, {
                    notify: false, // 不显示通知
                    context: { action: 'refresh', service: serviceId }
                });
            } else {
                console.error(`刷新 ${serviceId} 面板失败:`, error);
            }
            this.updateServiceStatus(serviceId, '刷新失败');
        }
    }

    closePanel(serviceId) {
        const panel = this.aiPanels.get(serviceId);
        if (panel) {
            // 移除面板
            if (panel.element && panel.element.parentNode) {
                panel.element.parentNode.removeChild(panel.element);
            }
            
            // 从映射中删除
            this.aiPanels.delete(serviceId);
            
            // 更新服务状态
            this.updateServiceStatus(serviceId, '未连接');
            
            // 更新布局
            this.updateLayout();
            
            // 显示通知
            notificationSystem.info(`${panel.service.name} 已关闭`);
        }
    }

    setLayout(layoutType) {
        this.currentLayout = layoutType;
        this.updateLayout();
        this.updateLayoutButtons();
        
        // 保存布局设置
        this.saveLayoutConfig();
        
        notificationSystem.info(`布局已切换为: ${this.getLayoutName(layoutType)}`);
    }

    resetLayout() {
        // 关闭所有面板
        const panels = Array.from(this.aiPanels.keys());
        panels.forEach(serviceId => {
            this.closePanel(serviceId);
        });
        
        // 重置布局
        this.currentLayout = 'grid-2x2';
        this.updateLayoutButtons();
        
        notificationSystem.info('布局已重置');
    }

    updateLayoutButtons() {
        // 移除所有按钮的active类
        const layoutButtons = document.querySelectorAll('.layout-btn');
        layoutButtons.forEach(btn => btn.classList.remove('active'));
        
        // 为当前布局按钮添加active类
        const currentButton = document.getElementById(this.getLayoutButtonId(this.currentLayout));
        if (currentButton) {
            currentButton.classList.add('active');
        }
    }

    getLayoutButtonId(layoutType) {
        const mapping = {
            'grid-2x2': 'layoutGrid',
            'vertical-split': 'layoutVertical',
            'horizontal-split': 'layoutHorizontal'
        };
        return mapping[layoutType] || 'layoutGrid';
    }

    getLayoutName(layoutType) {
        const mapping = {
            'grid-2x2': '网格布局',
            'vertical-split': '垂直分割',
            'horizontal-split': '水平分割',
            'single-panel': '单面板'
        };
        return mapping[layoutType] || '未知布局';
    }

    initializeResizeHandles() {
        const aiPanelsContainer = document.querySelector('.ai-panels');
        if (!aiPanelsContainer) return;

        // 为垂直分割和水平分割布局添加调整手柄
        if (this.currentLayout === 'vertical-split' || this.currentLayout === 'horizontal-split') {
            this.addResizeHandles(aiPanelsContainer);
        }
    }

    addResizeHandles(container) {
        // 移除现有的调整手柄
        const existingHandles = container.querySelectorAll('.resize-handle');
        existingHandles.forEach(handle => handle.remove());

        const panels = container.querySelectorAll('.ai-panel');
        if (panels.length < 2) return;

        // 为相邻面板之间添加调整手柄
        for (let i = 0; i < panels.length - 1; i++) {
            const handle = document.createElement('div');
            handle.className = `resize-handle ${this.currentLayout === 'vertical-split' ? 'vertical' : 'horizontal'}`;
            handle.dataset.panelIndex = i;

            // 插入到面板之间
            panels[i].parentNode.insertBefore(handle, panels[i + 1]);

            // 添加拖拽事件
            this.addResizeEventListeners(handle);
        }
    }

    addResizeEventListeners(handle) {
        let isResizing = false;
        let startPos = 0;
        let startSizes = [];

        const startResize = (e) => {
            isResizing = true;
            startPos = this.currentLayout === 'vertical-split' ? e.clientX : e.clientY;
            // 仅在拖拽时启用手柄事件拦截，避免覆盖面板交互
            handle.style.pointerEvents = 'auto';
            
            const container = handle.parentNode;
            const panels = Array.from(container.querySelectorAll('.ai-panel'));
            startSizes = panels.map(panel => {
                const rect = panel.getBoundingClientRect();
                return this.currentLayout === 'vertical-split' ? rect.width : rect.height;
            });

            document.addEventListener('mousemove', doResize);
            document.addEventListener('mouseup', stopResize);
            document.body.style.cursor = this.currentLayout === 'vertical-split' ? 'col-resize' : 'row-resize';
            e.preventDefault();
        };

        const doResize = (e) => {
            if (!isResizing) return;

            const currentPos = this.currentLayout === 'vertical-split' ? e.clientX : e.clientY;
            const delta = currentPos - startPos;
            const panelIndex = parseInt(handle.dataset.panelIndex);

            const container = handle.parentNode;
            const panels = Array.from(container.querySelectorAll('.ai-panel'));
            
            if (panels.length > panelIndex + 1) {
                const panel1 = panels[panelIndex];
                const panel2 = panels[panelIndex + 1];

                const newSize1 = Math.max(100, startSizes[panelIndex] + delta);
                const newSize2 = Math.max(100, startSizes[panelIndex + 1] - delta);

                if (this.currentLayout === 'vertical-split') {
                    panel1.style.width = `${newSize1}px`;
                    panel2.style.width = `${newSize2}px`;
                } else {
                    panel1.style.height = `${newSize1}px`;
                    panel2.style.height = `${newSize2}px`;
                }
            }
        };

        const stopResize = () => {
            isResizing = false;
            document.removeEventListener('mousemove', doResize);
            document.removeEventListener('mouseup', stopResize);
            document.body.style.cursor = '';
            // 恢复为不拦截事件，避免常态遮挡
            handle.style.pointerEvents = 'none';
        };

        handle.addEventListener('mousedown', startResize);
    }

    loadLayoutConfig() {
        try {
            const savedLayout = localStorage.getItem('aiLayoutConfig');
            if (savedLayout) {
                const layoutConfig = JSON.parse(savedLayout);
                this.currentLayout = layoutConfig.layout || 'grid-2x2';
                
                // 如果有保存的面板尺寸，也可以在这里恢复
                if (layoutConfig.panelSizes) {
                    this.savedPanelSizes = layoutConfig.panelSizes;
                }
            }
        } catch (error) {
            console.warn('加载布局配置失败:', error);
            this.currentLayout = 'grid-2x2';
        }
    }

    saveLayoutConfig() {
        try {
            const layoutConfig = {
                layout: this.currentLayout,
                panelSizes: this.getCurrentPanelSizes(),
                timestamp: Date.now()
            };
            
            localStorage.setItem('aiLayoutConfig', JSON.stringify(layoutConfig));
        } catch (error) {
            console.warn('保存布局配置失败:', error);
        }
    }

    getCurrentPanelSizes() {
        const sizes = {};
        const panels = document.querySelectorAll('.ai-panel');
        
        panels.forEach((panel, index) => {
            const rect = panel.getBoundingClientRect();
            sizes[`panel_${index}`] = {
                width: rect.width,
                height: rect.height
            };
        });
        
        return sizes;
    }

    restorePanelSizes() {
        if (!this.savedPanelSizes) return;
        
        const panels = document.querySelectorAll('.ai-panel');
        panels.forEach((panel, index) => {
            const savedSize = this.savedPanelSizes[`panel_${index}`];
            if (savedSize) {
                if (this.currentLayout === 'vertical-split') {
                    panel.style.width = `${savedSize.width}px`;
                } else if (this.currentLayout === 'horizontal-split') {
                    panel.style.height = `${savedSize.height}px`;
                }
            }
        });
    }

    async loadAIWindows() {
        try {
            const windows = await window.electronAPI.getAIWindows();
            console.log('已有AI窗口:', windows);
            
            windows.forEach(window => {
                const service = this.config.aiServices.find(s => s.id === window.serviceId);
                if (service) {
                    this.aiWindows.set(service.id, {
                        windowId: window.id,
                        service,
                        status: 'active'
                    });
                    this.updateServiceStatus(service.id, '已打开');
                }
            });
        } catch (error) {
            console.error('加载AI窗口失败:', error);
        }
    }

    async refreshAIWindows() {
        try {
            this.showLoading(true);
            await this.loadAIWindows();
            console.log('AI窗口列表已刷新');
        } catch (error) {
            console.error('刷新失败:', error);
        } finally {
            this.showLoading(false);
        }
    }

    updateServiceStatus(serviceId, status) {
        const serviceElement = document.querySelector(`[data-service-id="${serviceId}"]`);
        if (serviceElement) {
            const statusElement = serviceElement.querySelector('.service-status');
            statusElement.textContent = status;
        }
    }

    showSettings() {
        // TODO: 实现设置界面
        alert('设置功能即将推出！');
    }

    openTestPage() {
        // 打开测试页面
        const testWindow = window.open('about:blank', '_blank');
        testWindow.document.write(`
            <html>
                <head><title>AI Browser Test</title></head>
                <body>
                    <h1>AI Browser 测试页面</h1>
                    <p>这是一个测试页面，用于验证浏览器功能。</p>
                    <p>当前时间: ${new Date().toLocaleString()}</p>
                </body>
            </html>
        `);
    }

    minimizeWindow() {
        if (window.electronAPI && window.electronAPI.minimizeWindow) {
            window.electronAPI.minimizeWindow();
        }
    }

    closeWindow() {
        if (window.electronAPI && window.electronAPI.closeWindow) {
            window.electronAPI.closeWindow();
        } else {
            window.close();
        }
    }

    quickStart() {
        try {
            // 快速启动所有启用的AI服务
            this.showLoading(true);
            const enabledServices = this.config.aiServices.filter(service => service.enabled);
            
            // 显示快速启动通知
            const quickStartNotificationId = notificationSystem.loading(`正在启动 ${enabledServices.length} 个AI服务...`);
            
            enabledServices.forEach(async (service, index) => {
                setTimeout(() => {
                    this.openAIService(service);
                }, index * 1000); // 每秒打开一个服务，避免同时打开太多窗口
            });
            
            setTimeout(() => {
                this.showLoading(false);
                // 转换为成功通知
                notificationSystem.convertLoading(quickStartNotificationId, 'success', '所有AI服务启动完成');
            }, enabledServices.length * 1000 + 2000);
        } catch (error) {
            console.error('快速启动失败:', error);
            errorHandler.handleError({
                type: 'javascript',
                message: `快速启动失败: ${error.message}`,
                context: { operation: 'quick_start' },
                error
            });
            this.showLoading(false);
        }
    }

    startStatusBarUpdates() {
        // 更新状态栏信息
        this.updateStatusBar();
        
        // 每30秒更新一次状态
        setInterval(() => {
            this.updateStatusBar();
        }, 30000);
    }

    updateStatusBar() {
         // 更新适配器状态
         const adapterStatusEl = document.getElementById('adapterStatus');
         if (adapterStatusEl) {
             const activeAdapters = this.aiWindows.size;
             const totalAdapters = this.config.aiServices.filter(s => s.enabled).length;
             adapterStatusEl.textContent = `适配器: ${activeAdapters}/${totalAdapters} 活跃`;
         }

         // 更新内存使用情况（使用性能监控数据）
         const memoryUsageEl = document.getElementById('memoryUsage');
         if (memoryUsageEl) {
             if (typeof performanceMonitor !== 'undefined') {
                 const memoryStats = performanceMonitor.getPerformanceReport().memory;
                 memoryUsageEl.textContent = `内存: ${memoryStats.current}MB`;
                 
                 // 根据内存使用情况设置颜色
                 if (memoryStats.current > 100) {
                     memoryUsageEl.style.color = '#ff4444';
                 } else if (memoryStats.current > 80) {
                     memoryUsageEl.style.color = '#ffaa00';
                 } else {
                     memoryUsageEl.style.color = '#00aa00';
                 }
             } else if (window.performance && window.performance.memory) {
                 const used = Math.round(window.performance.memory.usedJSHeapSize / 1024 / 1024);
                 const total = Math.round(window.performance.memory.totalJSHeapSize / 1024 / 1024);
                 memoryUsageEl.textContent = `内存: ${used}/${total}MB`;
             }
         }

         // 更新当前时间
         const currentTimeEl = document.getElementById('currentTime');
         if (currentTimeEl) {
             currentTimeEl.textContent = new Date().toLocaleTimeString();
         }

         // 更新统计数据
         this.updateWelcomeStats();
     }

     updateWelcomeStats() {
         const totalServicesEl = document.getElementById('totalServices');
         const activeServicesEl = document.getElementById('activeServices');
         const totalMessagesEl = document.getElementById('totalMessages');

         if (totalServicesEl) {
             totalServicesEl.textContent = this.config.aiServices.length;
         }

         if (activeServicesEl) {
             activeServicesEl.textContent = this.aiWindows.size;
         }

         if (totalMessagesEl) {
             // 这里可以添加消息计数逻辑
             totalMessagesEl.textContent = this.messageCount || 0;
         }
     }

     updateConnectionStatus(status = 'ready', text = '就绪') {
         const statusIndicator = document.querySelector('.status-indicator');
         const statusText = document.querySelector('.status-text');

         if (statusIndicator) {
             statusIndicator.className = 'status-indicator';
             switch (status) {
                 case 'connected':
                     statusIndicator.style.background = '#28a745';
                     break;
                 case 'connecting':
                     statusIndicator.style.background = '#ffc107';
                     break;
                 case 'error':
                     statusIndicator.style.background = '#dc3545';
                     break;
                 default:
                     statusIndicator.style.background = '#6c757d';
             }
         }

         if (statusText) {
             statusText.textContent = text;
         }
     }

    showLoading(show) {
        const loading = document.getElementById('loading');
        loading.style.display = show ? 'flex' : 'none';
    }

    showError(message) {
        // 使用通知系统显示错误
        notificationSystem.error(message);
    }

    async saveConfig() {
        try {
            await window.electronAPI.saveConfig(this.config);
            console.log('配置保存成功');
        } catch (error) {
            console.error('配置保存失败:', error);
        }
    }

    initializePerformanceOptimization() {
        // 性能监控已在模块加载时自动启动
        console.log('Performance optimization systems initialized');
        
        // 监听性能更新事件
        document.addEventListener('performanceUpdate', (event) => {
            this.handlePerformanceUpdate(event.detail);
        });
        
        // 监听内存警告事件
        document.addEventListener('memoryWarning', (event) => {
            this.handleMemoryWarning(event.detail);
        });
        
        // 监听减少轮询事件
        document.addEventListener('reducePolling', () => {
            this.reducePollingFrequency();
        });
    }

    setupPerformanceEventListeners() {
        // 监听窗口焦点变化
        window.addEventListener('focus', () => {
            this.onWindowFocus();
        });
        
        window.addEventListener('blur', () => {
            this.onWindowBlur();
        });
        
        // 监听页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.onPageHidden();
            } else {
                this.onPageVisible();
            }
        });
    }
    
    handlePerformanceUpdate(performanceData) {
        // 更新UI中的性能指标
        this.updatePerformanceUI(performanceData);
        
        // 检查是否需要优化
        if (performanceData.memory.current > 100) {
            console.warn('High memory usage detected:', performanceData.memory.current + 'MB');
        }
        
        if (performanceData.recommendations.length > 0) {
            console.log('Performance recommendations:', performanceData.recommendations);
        }
    }
    
    handleMemoryWarning(warningData) {
        console.warn('Memory warning:', warningData);
        notificationSystem?.warning(`内存使用警告: ${warningData.message}`);
        
        // 触发内存优化
        if (typeof memoryOptimizer !== 'undefined') {
            memoryOptimizer.optimize();
        }
    }
    
    reducePollingFrequency() {
        // 减少状态栏更新频率
        if (this.statusBarInterval) {
            clearInterval(this.statusBarInterval);
            this.statusBarInterval = setInterval(() => {
                this.updateStatusBar();
            }, 10000); // 从5秒改为10秒
        }
        
        console.log('Reduced polling frequency for background mode');
    }
    
    onWindowFocus() {
        // 窗口获得焦点时恢复正常频率
        this.startStatusBarUpdates();
        console.log('Window focused - restored normal polling');
    }
    
    onWindowBlur() {
        // 窗口失去焦点时减少更新频率
        this.reducePollingFrequency();
        console.log('Window blurred - reduced polling frequency');
    }
    
    onPageHidden() {
        // 页面隐藏时暂停非必要操作
        console.log('Page hidden - pausing non-essential operations');
    }
    
    onPageVisible() {
        // 页面可见时恢复操作
        this.startStatusBarUpdates();
        console.log('Page visible - resumed operations');
    }
    
    updatePerformanceUI(performanceData) {
        // 更新欢迎界面的统计信息
        const memoryUsageEl = document.getElementById('memoryUsage');
        if (memoryUsageEl) {
            memoryUsageEl.textContent = `内存使用: ${performanceData.memory.current}MB`;
            
            // 设置颜色指示
            if (performanceData.memory.current > 100) {
                memoryUsageEl.style.color = '#ff4444';
            } else if (performanceData.memory.current > 80) {
                memoryUsageEl.style.color = '#ffaa00';
            } else {
                memoryUsageEl.style.color = '#00aa00';
            }
        }
        
        // 更新网络统计
        const networkStatsEl = document.getElementById('networkStats');
        if (networkStatsEl) {
            networkStatsEl.textContent = `网络请求: ${performanceData.network.requests} (错误率: ${performanceData.network.errorRate})`;
        }
    }

    // 处理窗口大小变化
      handleWindowResize() {
          console.log('窗口大小发生变化');
          
          // 重新计算布局尺寸
          this.handleLayoutResize();
          
          // 重新初始化调整手柄
          setTimeout(() => {
              this.initializeResizeHandles();
          }, 100);
          
          // 保存当前面板尺寸
          this.saveLayoutConfig();
          
          // 通知所有面板窗口大小已变化
          this.aiPanels.forEach((panel, serviceId) => {
              if (panel.webview) {
                  // 触发webview重新计算尺寸
                  panel.webview.style.width = '100%';
                  panel.webview.style.height = '100%';
              }
          });
      }

     // 处理布局尺寸变化
     handleLayoutResize() {
         const aiPanelsContainer = document.querySelector('.ai-panels');
         if (!aiPanelsContainer) return;

         // 获取容器尺寸
         const containerRect = aiPanelsContainer.getBoundingClientRect();
         console.log('容器尺寸:', containerRect.width, 'x', containerRect.height);

         // 确保所有面板都正确填充
         const panels = document.querySelectorAll('.ai-panel');
         panels.forEach(panel => {
             const webview = panel.querySelector('webview');
             if (webview) {
                 // 强制webview重新计算尺寸
                 webview.style.width = '100%';
                 webview.style.height = '100%';
                 
                 // 触发webview的resize事件
                 setTimeout(() => {
                     if (webview.executeJavaScript) {
                         webview.executeJavaScript('window.dispatchEvent(new Event("resize"))');
                     }
                 }, 50);
             }
         });
     }

    // 初始化设置系统
    initializeSettings() {
        try {
            // 初始化设置管理器
            this.settingsManager = new SettingsManager();
            this.settingsUI = new SettingsUI(this.settingsManager);
            
            // 监听设置变化
            this.settingsManager.addListener('theme', (value) => {
                this.applyTheme(value);
            });
            
            this.settingsManager.addListener('fontSize', (value) => {
                this.applyFontSize(value);
            });
            
            this.settingsManager.addListener('language', (value) => {
                this.applyLanguage(value);
            });
            
            // 应用当前设置
            this.applyCurrentSettings();
            
            console.log('设置系统初始化完成');
        } catch (error) {
            console.error('设置系统初始化失败:', error);
            this.notificationSystem?.show('设置系统初始化失败', 'error');
        }
    }

    // 打开设置界面
    openSettings() {
        if (this.settingsUI) {
            this.settingsUI.show();
        } else {
            console.error('设置界面未初始化');
            this.notificationSystem?.show('设置界面未初始化', 'error');
        }
    }

    // 显示收回窗口对话框
    async showRecallWindowDialog() {
        const modal = document.getElementById('recallWindowModal');
        if (!modal) {
            console.error('收回窗口对话框未找到');
            return;
        }

        // 显示对话框
        modal.style.display = 'flex';

        // 加载弹出窗口列表
        await this.loadPopupWindowsList();

        // 绑定事件
        this.bindRecallWindowEvents();
    }

    // 加载弹出窗口列表
    async loadPopupWindowsList() {
        const listContainer = document.getElementById('popupWindowsList');
        if (!listContainer) return;

        try {
            // 通过IPC获取弹出窗口列表
            const windows = await window.electronAPI.invoke('get-popup-windows');
            
            if (windows.length === 0) {
                listContainer.innerHTML = '<div class="no-windows-message">当前没有弹出窗口</div>';
                return;
            }

            // 生成窗口列表HTML
            const windowsHTML = windows.map(window => `
                <div class="popup-window-item" data-window-id="${window.id}">
                    <div class="popup-window-info">
                        <div class="popup-window-title">${window.title || '未知窗口'}</div>
                        <div class="popup-window-url">${window.url}</div>
                    </div>
                    <div class="popup-window-actions">
                        <button class="recall-btn" data-window-id="${window.id}">收回</button>
                    </div>
                </div>
            `).join('');

            listContainer.innerHTML = windowsHTML;

            // 绑定收回按钮事件
            listContainer.querySelectorAll('.recall-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const windowId = e.target.getAttribute('data-window-id');
                    await this.recallWindow(windowId);
                });
            });

        } catch (error) {
            console.error('加载弹出窗口列表失败:', error);
            listContainer.innerHTML = '<div class="no-windows-message">加载窗口列表失败</div>';
        }
    }

    // 收回指定窗口
    async recallWindow(windowId) {
        try {
            const result = await window.electronAPI.invoke('recall-window', windowId);
            
            if (result.success) {
                this.notificationSystem?.show('窗口收回成功', 'success');
                // 刷新窗口列表
                await this.loadPopupWindowsList();
                // 如果没有更多窗口，关闭对话框
                const windows = await window.electronAPI.invoke('get-popup-windows');
                if (windows.length === 0) {
                    this.hideRecallWindowDialog();
                }
            } else {
                this.notificationSystem?.show(`收回窗口失败: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('收回窗口失败:', error);
            this.notificationSystem?.show('收回窗口失败', 'error');
        }
    }

    // 绑定收回窗口对话框事件
    bindRecallWindowEvents() {
        const modal = document.getElementById('recallWindowModal');
        const closeBtn = document.getElementById('closeRecallWindowModal');
        const cancelBtn = document.getElementById('cancelRecallWindow');
        const refreshBtn = document.getElementById('refreshWindowsList');

        // 关闭按钮
        if (closeBtn) {
            closeBtn.onclick = () => this.hideRecallWindowDialog();
        }

        // 取消按钮
        if (cancelBtn) {
            cancelBtn.onclick = () => this.hideRecallWindowDialog();
        }

        // 刷新列表按钮
        if (refreshBtn) {
            refreshBtn.onclick = () => this.loadPopupWindowsList();
        }

        // 点击背景关闭
        if (modal) {
            modal.onclick = (e) => {
                if (e.target === modal) {
                    this.hideRecallWindowDialog();
                }
            };
        }
    }

    // 隐藏收回窗口对话框
    hideRecallWindowDialog() {
        const modal = document.getElementById('recallWindowModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // 应用当前设置
    applyCurrentSettings() {
        const settings = this.settingsManager.getAllSettings();
        
        // 应用主题
        this.applyTheme(settings.appearance.theme);
        
        // 应用字体大小
        this.applyFontSize(settings.appearance.fontSize);
        
        // 应用语言
        this.applyLanguage(settings.appearance.language);
        
        // 应用性能设置
        this.applyPerformanceSettings(settings.performance);
        
        // 应用窗口设置
        this.applyWindowSettings(settings.window);
    }

    // 应用主题
    applyTheme(theme) {
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${theme}`);
        
        // 更新CSS变量
        const root = document.documentElement;
        switch (theme) {
            case 'dark':
                root.style.setProperty('--bg-color', '#1a1a1a');
                root.style.setProperty('--text-color', '#ffffff');
                root.style.setProperty('--border-color', '#333333');
                break;
            case 'light':
                root.style.setProperty('--bg-color', '#ffffff');
                root.style.setProperty('--text-color', '#000000');
                root.style.setProperty('--border-color', '#cccccc');
                break;
            case 'auto':
                // 根据系统主题自动切换
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                this.applyTheme(prefersDark ? 'dark' : 'light');
                break;
        }
    }

    // 应用字体大小
    applyFontSize(fontSize) {
        document.documentElement.style.setProperty('--font-size', `${fontSize}px`);
    }

    // 应用语言设置
    applyLanguage(language) {
        document.documentElement.lang = language;
        // 这里可以添加国际化逻辑
    }

    // 应用性能设置
    applyPerformanceSettings(performanceSettings) {
        if (this.performanceMonitor) {
            // 更新性能监控配置
            this.performanceMonitor.updateConfig({
                enableMemoryMonitoring: performanceSettings.enableMemoryMonitoring,
                enableNetworkMonitoring: performanceSettings.enableNetworkMonitoring,
                enableUIMonitoring: performanceSettings.enableUIMonitoring,
                memoryWarningThreshold: performanceSettings.memoryWarningThreshold,
                performanceReportInterval: performanceSettings.performanceReportInterval
            });
        }
        
        if (this.memoryManager) {
            // 更新内存管理配置
            this.memoryManager.updateConfig({
                enableAutoCleanup: performanceSettings.enableAutoCleanup,
                cleanupInterval: performanceSettings.cleanupInterval,
                memoryThreshold: performanceSettings.memoryThreshold
            });
        }
    }

    // 应用窗口设置
    applyWindowSettings(windowSettings) {
        // 这里可以通过IPC与主进程通信来应用窗口设置
        if (window.electronAPI) {
            window.electronAPI.updateWindowSettings(windowSettings);
        }
    }

    // 显示添加新服务的弹窗
    showAddServiceModal() {
        const modal = document.getElementById('addServiceModal');
        if (modal) {
            modal.classList.add('show');
            this.initAddServiceModal();
        }
    }

    // 隐藏添加新服务的弹窗
    hideAddServiceModal() {
        const modal = document.getElementById('addServiceModal');
        if (modal) {
            modal.classList.remove('show');
            this.resetAddServiceForm();
        }
    }

    // 初始化添加服务弹窗的事件
    initAddServiceModal() {
        // 绑定关闭按钮事件
        const closeBtn = document.getElementById('closeAddServiceModal');
        const cancelBtn = document.getElementById('cancelAddService');
        const form = document.getElementById('addServiceForm');

        // 移除之前的事件监听器（避免重复绑定）
        if (closeBtn) {
            closeBtn.replaceWith(closeBtn.cloneNode(true));
        }
        if (cancelBtn) {
            cancelBtn.replaceWith(cancelBtn.cloneNode(true));
        }

        // 重新获取元素并绑定事件
        const newCloseBtn = document.getElementById('closeAddServiceModal');
        const newCancelBtn = document.getElementById('cancelAddService');
        const newForm = document.getElementById('addServiceForm');

        // 绑定新的事件监听器
        if (newCloseBtn) {
            newCloseBtn.addEventListener('click', () => this.hideAddServiceModal());
        }
        if (newCancelBtn) {
            newCancelBtn.addEventListener('click', () => this.hideAddServiceModal());
        }
        
        // 绑定表单提交事件
        if (newForm) {
            console.log('绑定表单提交事件');
            newForm.addEventListener('submit', (e) => {
                console.log('表单提交事件被触发');
                e.preventDefault();
                this.handleAddService();
            });

            // 绑定颜色选择事件
            const colorOptions = newForm.querySelectorAll('.color-option');
            colorOptions.forEach(option => {
                option.addEventListener('click', () => {
                    colorOptions.forEach(opt => opt.classList.remove('selected'));
                    option.classList.add('selected');
                });
            });

            // 默认选择第一个颜色
            if (colorOptions.length > 0) {
                colorOptions[0].classList.add('selected');
            }
        }

        // 点击遮罩层关闭弹窗
        const modal = document.getElementById('addServiceModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideAddServiceModal();
                }
            });
        }
    }

    // 重置添加服务表单
    resetAddServiceForm() {
        const form = document.getElementById('addServiceForm');
        if (form) {
            form.reset();
            const colorOptions = form.querySelectorAll('.color-option');
            colorOptions.forEach(opt => opt.classList.remove('selected'));
            if (colorOptions.length > 0) {
                colorOptions[0].classList.add('selected');
            }
        }
    }

    // 处理添加新服务
    async handleAddService() {
        console.log('handleAddService 方法被调用');
        try {
            const form = document.getElementById('addServiceForm');
            const formData = new FormData(form);
            
            const serviceName = document.getElementById('serviceName').value.trim();
            const serviceUrl = document.getElementById('serviceUrl').value.trim();
            const serviceIcon = document.getElementById('serviceIcon').value.trim();
            const selectedColor = form.querySelector('.color-option.selected');
            
            // 验证输入
            if (!serviceName || !serviceUrl || !serviceIcon) {
                this.notificationSystem?.error('请填写所有必填字段');
                return;
            }

            // 验证URL格式
            try {
                new URL(serviceUrl);
            } catch (error) {
                this.notificationSystem?.error('请输入有效的网址');
                return;
            }

            // 检查服务名称是否已存在
            const existingService = this.config.aiServices.find(service => 
                service.name.toLowerCase() === serviceName.toLowerCase()
            );
            if (existingService) {
                this.notificationSystem?.error('该服务名称已存在');
                return;
            }

            // 生成唯一ID
            const serviceId = this.generateServiceId(serviceName);
            
            // 获取选中的颜色
            const iconColor = selectedColor ? selectedColor.dataset.color : '#667eea';

            // 创建新服务配置
            const newService = {
                id: serviceId,
                name: serviceName,
                url: serviceUrl,
                icon: iconColor,
                adapter: 'BaseAdapter', // 使用基础适配器
                enabled: true,
                isCustom: true // 标记为自定义服务
            };

            // 添加到配置中
            this.config.aiServices.push(newService);

            // 保存配置到本地存储
            await this.saveCustomServices();

            // 重新渲染服务列表
            this.renderAIServices();

            // 关闭弹窗
            this.hideAddServiceModal();

            // 显示成功通知
            this.notificationSystem?.success(`成功添加AI服务: ${serviceName}`);

        } catch (error) {
            console.error('添加服务失败:', error);
            this.notificationSystem?.error(`添加服务失败: ${error.message}`);
        }
    }

    // 生成服务ID
    generateServiceId(serviceName) {
        const baseId = serviceName.toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .substring(0, 10);
        
        // 确保ID唯一
        let counter = 1;
        let serviceId = baseId;
        while (this.config.aiServices.find(service => service.id === serviceId)) {
            serviceId = `${baseId}${counter}`;
            counter++;
        }
        
        return serviceId;
    }

    // 保存自定义服务到本地存储
    async saveCustomServices() {
        try {
            const customServices = this.config.aiServices.filter(service => service.isCustom);
            localStorage.setItem('customAIServices', JSON.stringify(customServices));
        } catch (error) {
            console.error('保存自定义服务失败:', error);
        }
    }

    // 加载自定义服务
    loadCustomServices() {
        try {
            const customServicesJson = localStorage.getItem('customAIServices');
            if (customServicesJson) {
                const customServices = JSON.parse(customServicesJson);
                
                // 将自定义服务添加到配置中（避免重复）
                customServices.forEach(customService => {
                    const exists = this.config.aiServices.find(service => service.id === customService.id);
                    if (!exists) {
                        this.config.aiServices.push(customService);
                    }
                });
            }
        } catch (error) {
            console.error('加载自定义服务失败:', error);
        }
    }
}

// 测试函数 - 验证DOM元素和事件绑定
function testDOMElements() {
    console.log('=== DOM元素测试 ===');
    
    const elements = [
        'quickStartBtn',
        'openTestBtn', 
        'refreshBtn',
        'settingsBtn',
        'testBtn',
        'minimizeBtn',
        'closeBtn'
    ];
    
    elements.forEach(id => {
        const element = document.getElementById(id);
        console.log(`${id}:`, element ? '✓ 找到' : '✗ 未找到', element);
        
        if (element) {
            // 测试点击事件
            element.addEventListener('click', () => {
                console.log(`${id} 被点击了！`);
                alert(`${id} 按钮工作正常！`);
            });
        }
    });
    
    console.log('=== DOM元素测试完成 ===');
}

// 应用启动
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM加载完成，启动应用...');
    
    // 延迟一点时间确保所有元素都已加载
    setTimeout(() => {
        console.log('开始测试DOM元素...');
        testDOMElements();
        
        console.log('创建应用实例...');
        window.app = new MultiAIBrowser();
        
        // 为HTML内联事件处理器提供全局引用
        window.multiAIBrowser = window.app;
    }, 100);
});

// 监听AI窗口消息
if (window.electronAPI) {
    window.electronAPI.onAIWindowMessage((data) => {
        console.log('收到AI窗口消息:', data);
        // TODO: 处理AI窗口发来的消息
    });
}

// 开发模式下的调试信息
if ((typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') || 
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('开发模式已启用');
    
    // 暴露调试接口
    window.debug = {
        app: () => window.app,
        config: () => window.app?.config,
        aiWindows: () => window.app?.aiWindows
    };
}

// 右键菜单功能
class ContextMenuManager {
    constructor() {
        this.contextMenu = null;
        this.editServiceModal = null;
        this.currentService = null;
        this.init();
    }

    init() {
        this.contextMenu = document.getElementById('contextMenu');
        this.editServiceModal = document.getElementById('editServiceModal');
        
        // 绑定事件
        this.bindEvents();
    }

    bindEvents() {
        // 点击其他地方隐藏右键菜单
        document.addEventListener('click', (e) => {
            if (!this.contextMenu.contains(e.target)) {
                this.hideContextMenu();
            }
        });

        // 右键菜单项点击事件
        document.getElementById('editService').addEventListener('click', () => {
            this.showEditModal();
            this.hideContextMenu();
        });

        document.getElementById('deleteService').addEventListener('click', () => {
            this.deleteService();
            this.hideContextMenu();
        });

        // 编辑弹窗事件
        document.getElementById('cancelEditService').addEventListener('click', () => {
            this.hideEditModal();
        });

        document.getElementById('editServiceForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveServiceChanges();
        });

        // 编辑弹窗颜色选择器事件
        const editColorOptions = document.querySelectorAll('#editColorPicker .color-option');
        editColorOptions.forEach(option => {
            option.addEventListener('click', () => {
                editColorOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
            });
        });

        // 为服务列表项添加右键事件
        this.addContextMenuToServices();
    }

    addContextMenuToServices() {
        console.log('开始为服务添加右键菜单事件...');
        
        // 为默认服务添加右键菜单
        const defaultServices = document.querySelectorAll('.service-item');
        console.log('找到默认服务数量:', defaultServices.length);
        defaultServices.forEach((service, index) => {
            console.log(`为默认服务 ${index + 1} 添加右键事件:`, service);
            service.addEventListener('contextmenu', (e) => {
                console.log('默认服务右键事件触发:', service);
                e.preventDefault();
                this.showContextMenu(e, service);
            });
        });

        // 为自定义服务添加右键菜单
        const customServices = document.querySelectorAll('.custom-service-item');
        console.log('找到自定义服务数量:', customServices.length);
        customServices.forEach((service, index) => {
            console.log(`为自定义服务 ${index + 1} 添加右键事件:`, service);
            service.addEventListener('contextmenu', (e) => {
                console.log('自定义服务右键事件触发:', service);
                e.preventDefault();
                this.showContextMenu(e, service);
            });
        });
        
        console.log('右键菜单事件绑定完成');
    }

    showContextMenu(event, serviceElement) {
        console.log('显示右键菜单，事件:', event, '服务元素:', serviceElement);
        this.currentService = serviceElement;
        
        // 获取服务信息
        const serviceName = serviceElement.querySelector('.service-name')?.textContent || 
                           serviceElement.textContent.trim();
        console.log('服务名称:', serviceName);
        
        // 检查是否为默认服务（不允许删除）
        const isDefaultService = serviceElement.classList.contains('service-item');
        console.log('是否为默认服务:', isDefaultService);
        const deleteItem = document.getElementById('deleteService');
        
        if (isDefaultService) {
            deleteItem.style.display = 'none';
        } else {
            deleteItem.style.display = 'flex';
        }

        // 显示右键菜单
        console.log('设置右键菜单显示，菜单元素:', this.contextMenu);
        this.contextMenu.style.display = 'block';
        this.contextMenu.style.left = event.pageX + 'px';
        this.contextMenu.style.top = event.pageY + 'px';

        // 确保菜单不超出屏幕边界
        const rect = this.contextMenu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            this.contextMenu.style.left = (event.pageX - rect.width) + 'px';
        }
        if (rect.bottom > window.innerHeight) {
            this.contextMenu.style.top = (event.pageY - rect.height) + 'px';
        }
    }

    hideContextMenu() {
        if (this.contextMenu) {
            this.contextMenu.style.display = 'none';
        }
    }

    showEditModal() {
        if (!this.currentService) return;

        // 获取当前服务信息
        const serviceName = this.currentService.querySelector('.service-name')?.textContent || 
                           this.currentService.textContent.trim();
        
        let serviceUrl = '';
        let iconLetter = '';
        let iconColor = '';

        // 检查是否为自定义服务
        if (this.currentService.classList.contains('custom-service-item')) {
            const customServices = JSON.parse(localStorage.getItem('customServices') || '[]');
            const customService = customServices.find(s => s.name === serviceName);
            if (customService) {
                serviceUrl = customService.url;
                iconLetter = customService.icon;
                iconColor = customService.color;
            }
        } else {
            // 默认服务的URL映射
            const defaultUrls = {
                'ChatGPT': 'https://chat.openai.com',
                'Claude': 'https://claude.ai',
                'Gemini': 'https://gemini.google.com',
                'Copilot': 'https://copilot.microsoft.com',
                'deepseek': 'https://chat.deepseek.com'
            };
            serviceUrl = defaultUrls[serviceName] || '';
            iconLetter = serviceName.charAt(0).toUpperCase();
            iconColor = '#667eea';
        }

        // 填充表单
        document.getElementById('editServiceName').value = serviceName;
        document.getElementById('editServiceUrl').value = serviceUrl;
        document.getElementById('editServiceIcon').value = iconLetter;
        
        // 设置颜色选择器
        const colorOptions = document.querySelectorAll('#editServiceModal .color-option');
        colorOptions.forEach(option => {
            option.classList.remove('selected');
            if (option.dataset.color === iconColor) {
                option.classList.add('selected');
            }
        });

        // 显示弹窗
        this.editServiceModal.style.display = 'flex';
    }

    hideEditModal() {
        if (this.editServiceModal) {
            this.editServiceModal.style.display = 'none';
        }
    }

    saveServiceChanges() {
        if (!this.currentService) return;

        const newName = document.getElementById('editServiceName').value.trim();
        const newUrl = document.getElementById('editServiceUrl').value.trim();
        const newIcon = document.getElementById('editServiceIcon').value.trim();
        const selectedColor = document.querySelector('#editServiceModal .color-option.selected')?.dataset.color || '#667eea';

        if (!newName || !newUrl) {
            alert('请填写完整的服务名称和网址');
            return;
        }

        // 检查是否为自定义服务
        if (this.currentService.classList.contains('custom-service-item')) {
            // 更新自定义服务
            const customServices = JSON.parse(localStorage.getItem('customServices') || '[]');
            const oldName = this.currentService.querySelector('.service-name')?.textContent || 
                           this.currentService.textContent.trim();
            
            const serviceIndex = customServices.findIndex(s => s.name === oldName);
            if (serviceIndex !== -1) {
                customServices[serviceIndex] = {
                    name: newName,
                    url: newUrl,
                    icon: newIcon,
                    color: selectedColor
                };
                localStorage.setItem('customServices', JSON.stringify(customServices));
                
                // 刷新自定义服务列表
                if (window.app && window.app.loadCustomServices) {
                    window.app.loadCustomServices();
                }
            }
        } else {
            // 对于默认服务，只能修改URL（如果需要的话）
            console.log(`默认服务 ${newName} 的URL更新为: ${newUrl}`);
            // 这里可以添加更新默认服务URL的逻辑
        }

        this.hideEditModal();
        
        // 显示成功通知
        if (window.app && window.app.notificationSystem) {
            window.app.notificationSystem.show('服务信息已更新', 'success');
        }
    }

    deleteService() {
        if (!this.currentService || this.currentService.classList.contains('service-item')) {
            return; // 不能删除默认服务
        }

        const serviceName = this.currentService.querySelector('.service-name')?.textContent || 
                           this.currentService.textContent.trim();

        if (confirm(`确定要删除服务 "${serviceName}" 吗？`)) {
            // 从localStorage中删除
            const customServices = JSON.parse(localStorage.getItem('customServices') || '[]');
            const updatedServices = customServices.filter(s => s.name !== serviceName);
            localStorage.setItem('customServices', JSON.stringify(updatedServices));

            // 刷新自定义服务列表
            if (window.app && window.app.loadCustomServices) {
                window.app.loadCustomServices();
            }

            // 显示成功通知
            if (window.app && window.app.notificationSystem) {
                window.app.notificationSystem.show('服务已删除', 'success');
            }
        }
    }

    // 刷新右键菜单绑定（在服务列表更新后调用）
    refreshContextMenuBindings() {
        this.addContextMenuToServices();
    }
}

// 初始化右键菜单管理器的函数
function initializeContextMenu() {
    console.log('初始化右键菜单管理器...');
    window.contextMenuManager = new ContextMenuManager();
    
    // 监听自定义服务列表更新
    const originalLoadCustomServices = window.app?.loadCustomServices;
    if (originalLoadCustomServices) {
        window.app.loadCustomServices = function() {
            originalLoadCustomServices.call(this);
            // 延迟绑定事件，确保DOM已更新
            setTimeout(() => {
                window.contextMenuManager?.refreshContextMenuBindings();
            }, 100);
        };
    }
    console.log('右键菜单管理器初始化完成');
}