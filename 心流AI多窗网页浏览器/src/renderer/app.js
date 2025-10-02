// 主应用逻辑
class MultiAIBrowser {
    constructor() {
        this.aiWindows = new Map(); // 保留用于兼容性
        this.aiPanels = new Map(); // 新的面板管理
        this.config = {};
        this.currentLayout = 'grid-2x2'; // 当前布局模式
        
        // 初始化安全管理器
        this.securityManager = new SecurityManager();
        
        // 初始化网络管理器
        this.networkManager = null;
        
        // 加载保存的布局设置
        this.loadLayoutConfig();
        
        this.init();
    }

    async init() {
        console.log('初始化心流AI多窗网页浏览器...');
        
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
            
            // 初始化网络管理器
            console.log('步骤3: 初始化网络管理器');
            this.initializeNetworkManager();
            console.log('网络管理器初始化完成');
            
            // 初始化性能优化系统
            console.log('步骤4: 初始化性能优化系统');
            this.initializePerformanceOptimization();
            console.log('性能优化系统初始化完成');
            
            // 初始化适配器管理器
            console.log('步骤5: 检查并初始化适配器管理器');
            if (typeof adapterManager !== 'undefined') {
                console.log('适配器管理器存在，开始初始化...');
                await adapterManager.initialize();
                console.log('适配器管理器初始化完成');
            } else {
                console.warn('适配器管理器未定义，跳过初始化');
            }
            
            // 加载配置
            console.log('步骤6: 加载配置');
            await this.loadConfig();
            console.log('配置加载完成');
            
            // 初始化UI
            console.log('步骤7: 初始化UI');
            this.initUI();
            console.log('UI初始化完成');
            
            // 加载已有的AI窗口
            console.log('步骤8: 加载已有的AI窗口');
            await this.loadAIWindows();
            console.log('AI窗口加载完成');
            
            console.log('步骤9: 更新连接状态');
            this.updateConnectionStatus('ready', '就绪');
            
            // 初始化右键菜单
            console.log('步骤10: 初始化右键菜单');
            if (typeof initializeContextMenu === 'function') {
                initializeContextMenu();
            }
            
            // 转换加载通知为成功通知
            console.log('步骤11: 转换初始化通知为成功状态');
            console.log('转换通知ID:', initNotificationId);
            notificationSystem.convertLoading(initNotificationId, 'success', '应用程序初始化完成');
            console.log('初始化通知已转换为成功状态');
            
            // 触发应用初始化完成事件，通知错误处理器和性能监控器
            console.log('步骤12: 触发应用初始化完成事件');
            
            // 设置全局标志
            window.appInitialized = true;
            
            const appInitializedEvent = new CustomEvent('appInitialized', {
                detail: { timestamp: Date.now() }
            });
            document.dispatchEvent(appInitializedEvent);
            console.log('应用初始化完成事件已触发');
            
            console.log('心流AI多窗网页浏览器初始化完成');
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
                },
                {
                    id: 'perplexity',
                    name: 'Perplexity',
                    url: 'https://www.perplexity.ai',
                    icon: '🔍',
                    adapter: 'BaseAdapter',
                    enabled: true
                },
                {
                    id: 'poe',
                    name: 'Poe',
                    url: 'https://poe.com',
                    icon: '🎭',
                    adapter: 'BaseAdapter',
                    enabled: true
                },
                {
                    id: 'character-ai',
                    name: 'Character.AI',
                    url: 'https://character.ai',
                    icon: '🎪',
                    adapter: 'BaseAdapter',
                    enabled: true
                },
                {
                    id: 'huggingface',
                    name: 'HuggingFace Chat',
                    url: 'https://huggingface.co/chat',
                    icon: '🤗',
                    adapter: 'BaseAdapter',
                    enabled: true
                },
                {
                    id: 'you-chat',
                    name: 'You.com',
                    url: 'https://you.com',
                    icon: '🔎',
                    adapter: 'BaseAdapter',
                    enabled: true
                },
                {
                    id: 'phind',
                    name: 'Phind',
                    url: 'https://www.phind.com',
                    icon: '💻',
                    adapter: 'BaseAdapter',
                    enabled: true
                },
                {
                    id: 'writesonic',
                    name: 'WriteSonic',
                    url: 'https://writesonic.com',
                    icon: '✍️',
                    adapter: 'BaseAdapter',
                    enabled: true
                },
                {
                    id: 'jasper',
                    name: 'Jasper',
                    url: 'https://www.jasper.ai',
                    icon: '💎',
                    adapter: 'BaseAdapter',
                    enabled: true
                },
                {
                    id: 'anthropic-console',
                    name: 'Anthropic Console',
                    url: 'https://console.anthropic.com',
                    icon: '🏛️',
                    adapter: 'BaseAdapter',
                    enabled: true
                },
                {
                    id: 'openai-playground',
                    name: 'OpenAI Playground',
                    url: 'https://platform.openai.com/playground',
                    icon: '🎮',
                    adapter: 'BaseAdapter',
                    enabled: true
                },
                {
                    id: 'cohere',
                    name: 'Cohere',
                    url: 'https://cohere.com',
                    icon: '🌊',
                    adapter: 'BaseAdapter',
                    enabled: true
                },
                {
                    id: 'replicate',
                    name: 'Replicate',
                    url: 'https://replicate.com',
                    icon: '🔄',
                    adapter: 'BaseAdapter',
                    enabled: true
                },
                {
                    id: 'stability-ai',
                    name: 'Stability AI',
                    url: 'https://stability.ai',
                    icon: '🎨',
                    adapter: 'BaseAdapter',
                    enabled: true
                },
                {
                    id: 'midjourney',
                    name: 'Midjourney',
                    url: 'https://www.midjourney.com',
                    icon: '🖼️',
                    adapter: 'BaseAdapter',
                    enabled: true
                },
                {
                    id: 'tongyi-qianwen',
                    name: '通义千问',
                    url: 'https://tongyi.aliyun.com/qianwen',
                    icon: '🌟',
                    adapter: 'BaseAdapter',
                    enabled: true
                },
                {
                    id: 'baidu-wenxin',
                    name: '文心一言',
                    url: 'https://yiyan.baidu.com',
                    icon: '🎯',
                    adapter: 'BaseAdapter',
                    enabled: true
                },
                {
                    id: 'doubao',
                    name: '豆包',
                    url: 'https://www.doubao.com/chat',
                    icon: '🫘',
                    adapter: 'BaseAdapter',
                    enabled: true
                },
                {
                    id: 'kimi-chat',
                    name: 'Kimi',
                    url: 'https://kimi.moonshot.cn',
                    icon: '🌙',
                    adapter: 'BaseAdapter',
                    enabled: true
                },
                {
                    id: 'zhipu-chatglm',
                    name: '智谱清言',
                    url: 'https://chatglm.cn',
                    icon: '💫',
                    adapter: 'BaseAdapter',
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

        // 加载用户自定义的排序
        this.loadServiceOrder();

        this.config.aiServices.forEach((service, index) => {
            if (!service.enabled) return;

            const serviceElement = document.createElement('div');
            // 根据是否为自定义服务设置不同的CSS类
            serviceElement.className = service.isCustom ? 'custom-service-item' : 'service-item';
            serviceElement.dataset.serviceId = service.id;
            serviceElement.dataset.originalIndex = index;
            
            // 添加拖拽属性
            serviceElement.draggable = true;
            
            serviceElement.innerHTML = `
                <div class="drag-handle">⋮⋮</div>
                <div class="service-icon" style="background-color: ${service.icon}">
                    ${service.name.charAt(0)}
                </div>
                <div class="service-info">
                    <div class="service-name">${service.name}</div>
                    <div class="service-status">点击打开</div>
                </div>
            `;

            // 添加拖拽事件监听器
            this.addDragEventListeners(serviceElement);

            serviceElement.addEventListener('click', (e) => {
                // 如果点击的是拖拽手柄，不触发打开服务
                if (e.target.classList.contains('drag-handle')) {
                    return;
                }
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

    // 添加拖拽事件监听器
    addDragEventListeners(element) {
        element.addEventListener('dragstart', (e) => {
            this.draggedElement = element;
            element.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', element.outerHTML);
        });

        element.addEventListener('dragend', (e) => {
            element.classList.remove('dragging');
            this.draggedElement = null;
            // 移除所有拖拽指示器
            document.querySelectorAll('.drag-over').forEach(el => {
                el.classList.remove('drag-over');
            });
        });

        element.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            if (this.draggedElement && this.draggedElement !== element) {
                element.classList.add('drag-over');
            }
        });

        element.addEventListener('dragleave', (e) => {
            element.classList.remove('drag-over');
        });

        element.addEventListener('drop', (e) => {
            e.preventDefault();
            element.classList.remove('drag-over');
            
            if (this.draggedElement && this.draggedElement !== element) {
                this.handleDrop(this.draggedElement, element);
            }
        });
    }

    // 处理拖拽放置
    handleDrop(draggedElement, targetElement) {
        const draggedServiceId = draggedElement.dataset.serviceId;
        const targetServiceId = targetElement.dataset.serviceId;
        
        // 获取当前服务列表
        const services = this.config.aiServices.filter(service => service.enabled);
        
        // 找到被拖拽和目标服务的索引
        const draggedIndex = services.findIndex(service => service.id === draggedServiceId);
        const targetIndex = services.findIndex(service => service.id === targetServiceId);
        
        if (draggedIndex !== -1 && targetIndex !== -1) {
            // 重新排序服务列表
            const draggedService = services[draggedIndex];
            services.splice(draggedIndex, 1);
            services.splice(targetIndex, 0, draggedService);
            
            // 更新配置中的服务顺序
            this.updateServiceOrder(services);
            
            // 重新渲染服务列表
            this.renderAIServices();
            
            console.log(`服务 ${draggedService.name} 已移动到 ${services[targetIndex].name} 的位置`);
        }
    }

    // 更新服务顺序
    updateServiceOrder(newOrderedServices) {
        // 保持禁用的服务在原位置，只重新排序启用的服务
        const enabledServices = newOrderedServices;
        const disabledServices = this.config.aiServices.filter(service => !service.enabled);
        
        // 合并启用和禁用的服务
        this.config.aiServices = [...enabledServices, ...disabledServices];
        
        // 保存到本地存储
        this.saveServiceOrder();
        this.saveConfig();
    }

    // 保存服务排序到本地存储
    saveServiceOrder() {
        try {
            const serviceOrder = this.config.aiServices.map(service => service.id);
            localStorage.setItem('aiServiceOrder', JSON.stringify(serviceOrder));
            console.log('服务排序已保存到本地存储');
        } catch (error) {
            console.error('保存服务排序失败:', error);
        }
    }

    // 从本地存储加载服务排序
    loadServiceOrder() {
        try {
            const savedOrder = localStorage.getItem('aiServiceOrder');
            if (savedOrder) {
                const orderArray = JSON.parse(savedOrder);
                
                // 根据保存的顺序重新排序服务
                const orderedServices = [];
                const remainingServices = [...this.config.aiServices];
                
                // 按照保存的顺序添加服务
                orderArray.forEach(serviceId => {
                    const serviceIndex = remainingServices.findIndex(service => service.id === serviceId);
                    if (serviceIndex !== -1) {
                        orderedServices.push(remainingServices.splice(serviceIndex, 1)[0]);
                    }
                });
                
                // 添加任何新的服务（不在保存的顺序中的）
                orderedServices.push(...remainingServices);
                
                this.config.aiServices = orderedServices;
                console.log('已从本地存储加载服务排序');
            }
        } catch (error) {
            console.error('加载服务排序失败:', error);
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
        bindEventWithRetry('layoutList', 'click', () => this.setLayout('vertical-list'), '列表布局按钮');
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
            
            // 检查是否为谷歌服务，如果是则提供独立窗口选项
            const isGoogleService = service.url && (
                service.url.includes('google.com') || 
                service.url.includes('gemini.google.com') ||
                service.url.includes('bard.google.com')
            );
            
            if (isGoogleService) {
                // 谷歌服务默认使用增强的webview，提供更好的嵌入体验
                console.log(`正在为 ${service.name} 启用增强反检测模式...`);
                // 可以在这里添加特殊的webview配置或预处理
                // 独立窗口功能保留，但不默认提示（可通过设置或右键菜单访问）
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
            <button class="panel-control-btn maximize-btn" title="最大化" onclick="multiAIBrowser.toggleMaximizePanel('${service.id}')">⬜</button>
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
        
        // 设置webview基本样式，避免在加载事件前出现被遮挡的空白区域
        webview.style.background = 'transparent';
        webview.style.backgroundColor = 'transparent';
        
        // 使用安全管理器配置webview
        this.securityManager.configureWebview(webview, service);
        
        webview.setAttribute('allowpopups', 'true');
        
        // 根据无痕模式设置分区
        if (service.incognitoMode) {
            // 无痕模式：使用临时分区，每次都生成新的分区ID
            const incognitoPartitionId = `incognito-${service.id}-${Date.now()}`;
            webview.setAttribute('partition', incognitoPartitionId);
            console.log(`${service.name} 使用无痕模式，分区ID: ${incognitoPartitionId}`);
        } else {
            // 普通模式：使用稳定的持久化分区ID，确保登录会话可跨重启保存
            const partitionId = this.getPersistentServiceId(service);
            webview.setAttribute('partition', `persist:${partitionId}`);
        }
        
        // 直接设置src
        webview.src = service.url;

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

        // webview开始加载
        webview.addEventListener('did-start-loading', () => {
            console.log(`${service.name} 开始加载...`);
            loading.style.display = 'flex';
        });

        // webview停止加载
        webview.addEventListener('did-stop-loading', () => {
            console.log(`${service.name} 停止加载`);
        });

        // webview加载完成后隐藏loading
        webview.addEventListener('dom-ready', () => {
            // 使用安全管理器注入反检测脚本
            this.securityManager.injectAntiDetection(webview, service);
            
            // 检查页面标题，判断是否被重定向到Google登录页面
            webview.executeJavaScript('document.title').then(title => {
                console.log(`${service.name} 页面标题:`, title);
                
                if (title && (title.includes('Google') || title.includes('登录') || title.includes('Sign in'))) {
                    console.warn(`${service.name} 可能被重定向到Google登录页面`);
                    loading.innerHTML = `
                        <div style="color: #ffc107;">⚠️</div>
                        <div class="panel-loading-text">检测到登录页面</div>
                        <button onclick="window.app.refreshPanel('${service.id}')" 
                                style="margin-top: 10px; padding: 5px 10px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer;">
                            重试
                        </button>
                    `;
                    this.updateServiceStatus(service.id, '需要登录');
                } else {
                    loading.style.display = 'none';
                    panel.status = 'loaded';
                    this.updateServiceStatus(service.id, '已连接');
                }
            }).catch(err => {
                console.error(`获取${service.name}页面标题失败:`, err);
                loading.style.display = 'none';
                panel.status = 'loaded';
                this.updateServiceStatus(service.id, '已连接');
            });
            
            webview.style.background = 'transparent';
            webview.style.backgroundColor = 'transparent';
            
            // 为Gemini等服务启用输入事件处理
            this.enableInputEvents(webview, service.id);
        });

        webview.addEventListener('did-fail-load', (event) => {
            console.error(`${service.name} 加载失败:`, event);
            loading.innerHTML = `
                <div style="color: #dc3545;">❌</div>
                <div class="panel-loading-text">网络连接失败</div>
                <div style="font-size: 12px; color: #666; margin-top: 5px;">
                    错误代码: ${event.errorCode || '未知'}
                </div>
                <button onclick="window.app.refreshPanel('${service.id}')" 
                        style="margin-top: 10px; padding: 5px 10px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer;">
                    重试
                </button>
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

    injectBrowserFeatures(webview, service) {
        try {
            console.log(`为${service.name}注入现代浏览器特性...`);
            
            const browserFeaturesScript = `
                (function() {
                    // 增强Chrome对象
                    if (!window.chrome) {
                        window.chrome = {};
                    }
                    
                    // 添加Chrome运行时API
                    window.chrome.runtime = window.chrome.runtime || {
                        onConnect: { addListener: function() {} },
                        onMessage: { addListener: function() {} },
                        sendMessage: function() {},
                        connect: function() { return { postMessage: function() {}, onMessage: { addListener: function() {} } }; },
                        getManifest: function() { return { version: '131.0.0.0' }; },
                        getURL: function(path) { return 'chrome-extension://fake/' + path; },
                        id: 'fake-extension-id'
                    };
                    
                    // 添加Chrome应用API
                    window.chrome.app = window.chrome.app || {
                        isInstalled: false,
                        InstallState: { DISABLED: 'disabled', INSTALLED: 'installed', NOT_INSTALLED: 'not_installed' },
                        RunningState: { CANNOT_RUN: 'cannot_run', READY_TO_RUN: 'ready_to_run', RUNNING: 'running' }
                    };
                    
                    // 增强Navigator对象
                    Object.defineProperty(navigator, 'webdriver', {
                        get: () => undefined,
                        configurable: true
                    });
                    
                    // 添加更多插件信息
                    const mockPlugins = [
                        { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
                        { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '' },
                        { name: 'Native Client', filename: 'internal-nacl-plugin', description: '' }
                    ];
                    
                    Object.defineProperty(navigator, 'plugins', {
                        get: () => mockPlugins,
                        configurable: true
                    });
                    
                    // 添加语言信息
                    Object.defineProperty(navigator, 'languages', {
                        get: () => ['zh-CN', 'zh', 'en-US', 'en'],
                        configurable: true
                    });
                    
                    // 添加连接信息
                    Object.defineProperty(navigator, 'connection', {
                        get: () => ({
                            effectiveType: '4g',
                            rtt: 50,
                            downlink: 10,
                            saveData: false
                        }),
                        configurable: true
                    });
                    
                    // 添加设备内存信息
                    Object.defineProperty(navigator, 'deviceMemory', {
                        get: () => 8,
                        configurable: true
                    });
                    
                    // 添加硬件并发信息
                    Object.defineProperty(navigator, 'hardwareConcurrency', {
                        get: () => 8,
                        configurable: true
                    });
                    
                    // 添加权限API
                    if (!navigator.permissions) {
                        navigator.permissions = {
                            query: function(permission) {
                                return Promise.resolve({ state: 'granted' });
                            }
                        };
                    }
                    
                    // 添加媒体设备API
                    if (!navigator.mediaDevices) {
                        navigator.mediaDevices = {
                            enumerateDevices: function() {
                                return Promise.resolve([
                                    { deviceId: 'default', kind: 'audioinput', label: 'Default - 麦克风 (Realtek Audio)' },
                                    { deviceId: 'default', kind: 'audiooutput', label: 'Default - 扬声器 (Realtek Audio)' },
                                    { deviceId: 'default', kind: 'videoinput', label: 'Default - 摄像头' }
                                ]);
                            },
                            getUserMedia: function() { return Promise.reject(new Error('Permission denied')); }
                        };
                    }
                    
                    // 添加WebGL支持检测
                    const canvas = document.createElement('canvas');
                    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                    if (gl) {
                        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                        if (debugInfo) {
                            Object.defineProperty(gl, 'UNMASKED_VENDOR_WEBGL', { value: debugInfo.UNMASKED_VENDOR_WEBGL });
                            Object.defineProperty(gl, 'UNMASKED_RENDERER_WEBGL', { value: debugInfo.UNMASKED_RENDERER_WEBGL });
                        }
                    }
                    
                    // 添加屏幕信息
                    Object.defineProperty(screen, 'colorDepth', {
                        get: () => 24,
                        configurable: true
                    });
                    
                    Object.defineProperty(screen, 'pixelDepth', {
                        get: () => 24,
                        configurable: true
                    });
                    
                    // 移除Electron/Webview特征
                    delete window.webview;
                    delete window.electron;
                    delete window.electronAPI;
                    delete window.require;
                    delete window.module;
                    delete window.exports;
                    delete window.global;
                    delete window.process;
                    
                    // 深层webview检测对抗 - 伪装window层级关系
                    try {
                        // 伪装window.parent和window.top，让页面认为它在顶级窗口中
                        Object.defineProperty(window, 'parent', {
                            get: () => window,
                            configurable: false
                        });
                        
                        Object.defineProperty(window, 'top', {
                            get: () => window,
                            configurable: false
                        });
                        
                        // 伪装window.frameElement，让页面认为它不在iframe中
                        Object.defineProperty(window, 'frameElement', {
                            get: () => null,
                            configurable: false
                        });
                        
                        // 伪装window.frames，模拟顶级窗口
                        Object.defineProperty(window, 'frames', {
                            get: () => window,
                            configurable: false
                        });
                        
                        // 伪装window.length，表示没有子框架
                        Object.defineProperty(window, 'length', {
                            get: () => 0,
                            configurable: false
                        });
                        
                        // 伪装document.domain
                        try {
                            Object.defineProperty(document, 'domain', {
                                get: () => window.location.hostname,
                                set: () => {},
                                configurable: false
                            });
                        } catch(e) {}
                        
                        // 伪装window.opener
                        Object.defineProperty(window, 'opener', {
                            get: () => null,
                            configurable: false
                        });
                        
                        // 移除webview特有的事件和方法
                        delete window.postMessage;
                        window.postMessage = function(message, targetOrigin) {
                            // 模拟正常的postMessage行为
                            console.log('PostMessage intercepted:', message, targetOrigin);
                        };
                        
                        // 伪装window.name
                        Object.defineProperty(window, 'name', {
                            get: () => '',
                            set: () => {},
                            configurable: false
                        });
                        
                        // 检测并移除可能暴露webview的属性
                        const webviewProps = ['webkitStorageInfo', 'webkitIndexedDB', 'webkitRequestFileSystem'];
                        webviewProps.forEach(prop => {
                            if (window[prop]) {
                                delete window[prop];
                            }
                        });
                        
                        // 伪装document.referrer
                        Object.defineProperty(document, 'referrer', {
                            get: () => '',
                            configurable: false
                        });
                        
                        // 伪装window.history
                        const originalHistory = window.history;
                        Object.defineProperty(window, 'history', {
                            get: () => ({
                                length: 1,
                                state: null,
                                back: () => {},
                                forward: () => {},
                                go: () => {},
                                pushState: originalHistory.pushState.bind(originalHistory),
                                replaceState: originalHistory.replaceState.bind(originalHistory)
                            }),
                            configurable: false
                        });
                        
                        console.log('深层webview检测对抗已激活');
                    } catch (error) {
                        console.warn('部分webview对抗功能设置失败:', error);
                    }
                    
                    // 添加真实浏览器的window属性
                    if (!window.speechSynthesis) {
                        window.speechSynthesis = {
                            getVoices: function() { return []; },
                            speak: function() {},
                            cancel: function() {},
                            pause: function() {},
                            resume: function() {}
                        };
                    }
                    
                    // 添加Notification API
                    if (!window.Notification) {
                        window.Notification = function() {};
                        window.Notification.permission = 'default';
                        window.Notification.requestPermission = function() { return Promise.resolve('default'); };
                    }
                    
                    console.log('现代浏览器特性注入完成 - ${service.name}');
                })();
            `;
            
            webview.executeJavaScript(browserFeaturesScript);
            console.log(`${service.name} 现代浏览器特性注入完成`);
        } catch (error) {
            console.error(`${service.name} 浏览器特性注入失败:`, error);
        }
    }

    injectAdvancedAntiDetection(webview, service) {
        try {
            console.log(`为${service.name}注入高级反检测特性...`);
            
            const advancedAntiDetectionScript = `
                (function() {
                    // 高级Canvas指纹伪装
                    const originalGetContext = HTMLCanvasElement.prototype.getContext;
                    HTMLCanvasElement.prototype.getContext = function(contextType, contextAttributes) {
                        const context = originalGetContext.call(this, contextType, contextAttributes);
                        
                        if (contextType === '2d') {
                            const originalFillText = context.fillText;
                            context.fillText = function(text, x, y, maxWidth) {
                                // 添加微小的随机偏移来避免指纹识别
                                const offset = Math.random() * 0.1 - 0.05;
                                return originalFillText.call(this, text, x + offset, y + offset, maxWidth);
                            };
                        }
                        
                        return context;
                    };
                    
                    // WebGL指纹伪装
                    const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
                    WebGLRenderingContext.prototype.getParameter = function(parameter) {
                        // 伪装GPU信息
                        if (parameter === this.RENDERER) {
                            return 'ANGLE (Intel, Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0, D3D11)';
                        }
                        if (parameter === this.VENDOR) {
                            return 'Google Inc. (Intel)';
                        }
                        return originalGetParameter.call(this, parameter);
                    };
                    
                    // AudioContext指纹伪装
                    if (window.AudioContext || window.webkitAudioContext) {
                        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                        const originalCreateAnalyser = AudioContextClass.prototype.createAnalyser;
                        AudioContextClass.prototype.createAnalyser = function() {
                            const analyser = originalCreateAnalyser.call(this);
                            const originalGetFloatFrequencyData = analyser.getFloatFrequencyData;
                            analyser.getFloatFrequencyData = function(array) {
                                originalGetFloatFrequencyData.call(this, array);
                                // 添加微小的噪声
                                for (let i = 0; i < array.length; i++) {
                                    array[i] += Math.random() * 0.001 - 0.0005;
                                }
                            };
                            return analyser;
                        };
                    }
                    
                    // 字体检测对抗
                    const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');
                    const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
                    
                    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
                        get: function() {
                            const width = originalOffsetWidth.get.call(this);
                            // 为字体检测添加微小的随机变化
                            if (this.style && this.style.fontFamily) {
                                return width + Math.floor(Math.random() * 3) - 1;
                            }
                            return width;
                        }
                    });
                    
                    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
                        get: function() {
                            const height = originalOffsetHeight.get.call(this);
                            if (this.style && this.style.fontFamily) {
                                return height + Math.floor(Math.random() * 3) - 1;
                            }
                            return height;
                        }
                    });
                    
                    // 时区检测对抗
                    const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;
                    Date.prototype.getTimezoneOffset = function() {
                        return -480; // 固定为中国时区 UTC+8
                    };
                    
                    // 语言检测增强
                    Object.defineProperty(navigator, 'language', {
                        get: () => 'zh-CN',
                        configurable: true
                    });
                    
                    // 屏幕分辨率伪装
                    Object.defineProperty(screen, 'width', {
                        get: () => 1920,
                        configurable: true
                    });
                    
                    Object.defineProperty(screen, 'height', {
                        get: () => 1080,
                        configurable: true
                    });
                    
                    Object.defineProperty(screen, 'availWidth', {
                        get: () => 1920,
                        configurable: true
                    });
                    
                    Object.defineProperty(screen, 'availHeight', {
                        get: () => 1040,
                        configurable: true
                    });
                    
                    // 触摸设备检测对抗
                    Object.defineProperty(navigator, 'maxTouchPoints', {
                        get: () => 0,
                        configurable: true
                    });
                    
                    // 电池API移除（避免指纹识别）
                    delete navigator.getBattery;
                    
                    // 网络连接API伪装
                    Object.defineProperty(navigator, 'onLine', {
                        get: () => true,
                        configurable: true
                    });
                    
                    // 内存信息伪装
                    if (performance.memory) {
                        Object.defineProperty(performance.memory, 'jsHeapSizeLimit', {
                            get: () => 2172649472,
                            configurable: true
                        });
                    }
                    
                    // 移除可能暴露webview的事件监听器
                    const originalAddEventListener = window.addEventListener;
                    window.addEventListener = function(type, listener, options) {
                        // 过滤掉可能暴露webview的事件
                        const blockedEvents = ['beforeunload', 'unload'];
                        if (blockedEvents.includes(type)) {
                            return;
                        }
                        return originalAddEventListener.call(this, type, listener, options);
                    };
                    
                    // 谷歌特定的反检测措施
                    // 1. 伪装Chrome浏览器特征
                    Object.defineProperty(navigator, 'vendor', {
                        get: () => 'Google Inc.',
                        configurable: true
                    });
                    
                    Object.defineProperty(navigator, 'productSub', {
                        get: () => '20030107',
                        configurable: true
                    });
                    
                    // 2. 伪装Chrome版本信息
                    Object.defineProperty(navigator, 'appVersion', {
                        get: () => '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        configurable: true
                    });
                    
                    // 3. 添加Chrome特有的API
                    if (!window.chrome) {
                        window.chrome = {
                            runtime: {
                                onConnect: null,
                                onMessage: null
                            },
                            app: {
                                isInstalled: false
                            }
                        };
                    }
                    
                    // 4. 伪装插件信息
                    Object.defineProperty(navigator, 'plugins', {
                        get: () => {
                            const plugins = [
                                {
                                    name: 'Chrome PDF Plugin',
                                    filename: 'internal-pdf-viewer',
                                    description: 'Portable Document Format'
                                },
                                {
                                    name: 'Chrome PDF Viewer',
                                    filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai',
                                    description: ''
                                },
                                {
                                    name: 'Native Client',
                                    filename: 'internal-nacl-plugin',
                                    description: ''
                                }
                            ];
                            return plugins;
                        },
                        configurable: true
                    });
                    
                    // 5. 移除webview特有的属性
                    delete window.webview;
                    delete window.electronAPI;
                    
                    // 6. 伪装权限API
                    if (navigator.permissions) {
                        const originalQuery = navigator.permissions.query;
                        navigator.permissions.query = function(permissionDesc) {
                            // 对于某些权限，返回granted状态以模拟正常浏览器
                            if (permissionDesc.name === 'notifications') {
                                return Promise.resolve({ state: 'granted' });
                            }
                            return originalQuery.call(this, permissionDesc);
                        };
                    }
                    
                    // 7. 伪装WebRTC API
                    if (window.RTCPeerConnection) {
                        const originalCreateDataChannel = RTCPeerConnection.prototype.createDataChannel;
                        RTCPeerConnection.prototype.createDataChannel = function(label, dataChannelDict) {
                            // 正常创建数据通道，但添加一些延迟来模拟真实网络
                            const channel = originalCreateDataChannel.call(this, label, dataChannelDict);
                            return channel;
                        };
                    }
                    
                    // 8. 伪装Notification API
                    if (window.Notification) {
                        Object.defineProperty(Notification, 'permission', {
                            get: () => 'granted',
                            configurable: true
                        });
                    }
                    
                    // 9. 伪装存储API
                    if (navigator.storage && navigator.storage.estimate) {
                        const originalEstimate = navigator.storage.estimate;
                        navigator.storage.estimate = function() {
                            return originalEstimate.call(this).then(estimate => ({
                                quota: 120000000000, // 120GB
                                usage: 50000000000,  // 50GB
                                usageDetails: estimate.usageDetails || {}
                            }));
                        };
                    }
                    
                    // 10. 移除可能暴露自动化的痕迹
                    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
                    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
                    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
                    
                    console.log('高级反检测特性注入完成（包含谷歌特定优化）');
                })();
            `;
            
            webview.executeJavaScript(advancedAntiDetectionScript);
            console.log(`${service.name} 高级反检测特性注入完成`);
        } catch (error) {
            console.error(`${service.name} 高级反检测特性注入失败:`, error);
        }
    }

    shouldOpenInNewWindow(url) {
        // 判断是否应该在新窗口中打开URL（登录/OAuth等流程）
        const newWindowPatterns = [
            // 通用登录/认证关键词
            /login/i,
            /signin/i,
            /auth/i,
            /oauth/i,
            /sso/i,
            // 注册页面
            /register/i,
            /signup/i,
            // 精确域名匹配（OAuth 常见提供方）
            /https?:\/\/accounts\.google\.com\//i,
            /https?:\/\/login\.microsoftonline\.com\//i,
            /https?:\/\/github\.com\/login/i,
            /https?:\/\/auth\.openai\.com\//i,
            // DeepSeek相关
            /https?:\/\/chat\.deepseek\.com.*(login|auth)/i,
            // 其他AI服务的登录页面
            /https?:\/\/openai\.com.*login/i,
            /https?:\/\/claude\.ai.*login/i,
            /https?:\/\/gemini\.google\.com.*login/i
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

        // 添加面板到容器并清除可能的内联样式
        panels.forEach(panel => {
            // 清除面板元素的内联样式，防止全屏退出后样式残留
            if (panel.element) {
                panel.element.style.width = '';
                panel.element.style.height = '';
                panel.element.style.position = '';
                panel.element.style.top = '';
                panel.element.style.left = '';
                panel.element.style.zIndex = '';
                panel.element.style.transform = '';
                
                // 清除webview的内联样式
                const webview = panel.element.querySelector('webview');
                if (webview) {
                    webview.style.width = '';
                    webview.style.height = '';
                }
            }
            aiPanelsContainer.appendChild(panel.element);
        });

        // 根据面板数量和当前布局设置样式 - 强制2x2x2布局原则
        if (panels.length === 1) {
            // 单窗口：占满整个容器
            aiPanelsContainer.classList.add('single-panel');
        } else if (panels.length === 2) {
            // 双窗口：左右并排或上下分割
            aiPanelsContainer.classList.add(this.currentLayout === 'horizontal-split' ? 'horizontal-split' : 'vertical-split');
        } else {
            // 三窗口及以上：强制使用2x2x2网格布局
            aiPanelsContainer.classList.add('smart-grid-layout');
            // 设置面板数量属性，用于CSS选择器
            aiPanelsContainer.setAttribute('data-panel-count', panels.length);
        }

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
        try {
            const panel = this.aiPanels.get(serviceId);
            if (!panel) {
                console.warn(`尝试关闭不存在的面板: ${serviceId}`);
                return false;
            }

            console.log(`🗑️ 开始关闭面板: ${serviceId}`);

            // 如果是无痕模式，清理会话数据
            if (panel.service && panel.service.incognitoMode) {
                try {
                    this.clearIncognitoData(panel.webview, panel.service);
                    console.log(`✅ 无痕模式数据已清理: ${serviceId}`);
                } catch (error) {
                    console.warn(`⚠️ 清理无痕数据失败: ${serviceId}`, error);
                }
            }

            // 清理webview事件监听器
            if (panel.webview) {
                try {
                    // 移除所有事件监听器
                    panel.webview.removeAllListeners();
                    
                    // 停止加载
                    if (panel.webview.stop) {
                        panel.webview.stop();
                    }
                    
                    // 清理webview内容
                    if (panel.webview.getWebContents) {
                        const webContents = panel.webview.getWebContents();
                        if (webContents && !webContents.isDestroyed()) {
                            webContents.removeAllListeners();
                        }
                    }
                    
                    console.log(`✅ Webview事件监听器已清理: ${serviceId}`);
                } catch (error) {
                    console.warn(`⚠️ 清理webview事件监听器失败: ${serviceId}`, error);
                }
            }

            // 移除DOM元素
            if (panel.element) {
                try {
                    // 移除元素上的事件监听器
                    const clonedElement = panel.element.cloneNode(true);
                    if (panel.element.parentNode) {
                        panel.element.parentNode.replaceChild(clonedElement, panel.element);
                        clonedElement.parentNode.removeChild(clonedElement);
                    }
                    console.log(`✅ DOM元素已移除: ${serviceId}`);
                } catch (error) {
                    console.warn(`⚠️ 移除DOM元素失败: ${serviceId}`, error);
                    // 备用方法
                    try {
                        if (panel.element.parentNode) {
                            panel.element.parentNode.removeChild(panel.element);
                        }
                    } catch (fallbackError) {
                        console.error(`❌ 备用移除方法也失败: ${serviceId}`, fallbackError);
                    }
                }
            }

            // 从映射中删除
            this.aiPanels.delete(serviceId);
            
            // 同时从旧的aiWindows映射中删除（兼容性）
            if (this.aiWindows && this.aiWindows.has(serviceId)) {
                this.aiWindows.delete(serviceId);
            }

            // 更新服务状态
            try {
                this.updateServiceStatus(serviceId, '未连接');
            } catch (error) {
                console.warn(`⚠️ 更新服务状态失败: ${serviceId}`, error);
            }

            // 更新布局
            try {
                this.updateLayout();
            } catch (error) {
                console.warn(`⚠️ 更新布局失败: ${serviceId}`, error);
            }

            // 显示通知
            try {
                const serviceName = panel.service ? panel.service.name : serviceId;
                const modeText = panel.service && panel.service.incognitoMode ? ' (无痕模式数据已清理)' : '';
                notificationSystem.info(`${serviceName} 已关闭${modeText}`);
            } catch (error) {
                console.warn(`⚠️ 显示关闭通知失败: ${serviceId}`, error);
            }

            console.log(`✅ 面板关闭完成: ${serviceId}`);
            return true;

        } catch (error) {
            console.error(`❌ 关闭面板时发生错误: ${serviceId}`, error);
            
            // 即使出错也要尝试从映射中移除
            try {
                this.aiPanels.delete(serviceId);
                if (this.aiWindows && this.aiWindows.has(serviceId)) {
                    this.aiWindows.delete(serviceId);
                }
            } catch (cleanupError) {
                console.error(`❌ 清理映射失败: ${serviceId}`, cleanupError);
            }

            // 记录错误
            if (typeof errorHandler !== 'undefined') {
                errorHandler.handleError({
                    type: 'javascript',
                    message: `关闭面板失败: ${error.message}`,
                    context: { 
                        operation: 'close_panel',
                        serviceId: serviceId
                    },
                    error
                });
            }

            return false;
        }
    }

    // 清理无痕模式数据
    clearIncognitoData(webview, service) {
        try {
            if (webview && webview.getWebContents) {
                const webContents = webview.getWebContents();
                if (webContents) {
                    // 清理会话数据
                    webContents.session.clearStorageData({
                        storages: [
                            'appcache',
                            'cookies',
                            'filesystem',
                            'indexdb',
                            'localstorage',
                            'shadercache',
                            'websql',
                            'serviceworkers',
                            'cachestorage'
                        ]
                    }).then(() => {
                        console.log(`${service.name} 无痕模式数据已清理`);
                    }).catch(error => {
                        console.error(`清理 ${service.name} 无痕模式数据失败:`, error);
                    });
                }
            } else if (window.electronAPI && window.electronAPI.clearSessionData) {
                // 使用主进程API清理分区数据
                const partitionId = webview.getAttribute('partition');
                if (partitionId && partitionId.startsWith('incognito-')) {
                    window.electronAPI.clearSessionData(partitionId).then(() => {
                        console.log(`${service.name} 无痕模式分区数据已清理: ${partitionId}`);
                    }).catch(error => {
                        console.error(`清理 ${service.name} 无痕模式分区数据失败:`, error);
                    });
                }
            }
        } catch (error) {
            console.error(`清理 ${service.name} 无痕模式数据时发生错误:`, error);
        }
    }

    toggleMaximizePanel(serviceId) {
        const panel = this.aiPanels.get(serviceId);
        if (!panel || !panel.element) {
            return;
        }

        const panelElement = panel.element;
        const workspace = document.querySelector('.workspace');
        const maximizeBtn = panelElement.querySelector('.maximize-btn');
        
        // 检查当前是否已最大化
        const isMaximized = panelElement.classList.contains('maximized');
        
        if (isMaximized) {
            // 收回到原始状态
            panelElement.classList.remove('maximized');
            panelElement.style.position = '';
            panelElement.style.top = '';
            panelElement.style.left = '';
            panelElement.style.width = '';
            panelElement.style.height = '';
            panelElement.style.zIndex = '';
            
            // 更新按钮图标和提示
            maximizeBtn.innerHTML = '⬜';
            maximizeBtn.title = '最大化';
            
            // 恢复其他面板的显示
            this.aiPanels.forEach((otherPanel, otherId) => {
                if (otherId !== serviceId && otherPanel.element) {
                    otherPanel.element.style.display = '';
                }
            });
            
            // 恢复侧边栏
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) {
                sidebar.style.display = '';
            }
            
            // 更新布局
            this.updateLayout();
            
            notificationSystem.info(`${panel.service.name} 已收回`);
        } else {
            // 最大化面板
            panelElement.classList.add('maximized');
            panelElement.style.position = 'fixed';
            panelElement.style.top = '0';
            panelElement.style.left = '0';
            panelElement.style.width = '100vw';
            panelElement.style.height = '100vh';
            panelElement.style.zIndex = '9999';
            
            // 更新按钮图标和提示
            maximizeBtn.innerHTML = '🗗';
            maximizeBtn.title = '收回';
            
            // 隐藏其他面板
            this.aiPanels.forEach((otherPanel, otherId) => {
                if (otherId !== serviceId && otherPanel.element) {
                    otherPanel.element.style.display = 'none';
                }
            });
            
            // 隐藏侧边栏
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) {
                sidebar.style.display = 'none';
            }
            
            notificationSystem.info(`${panel.service.name} 已最大化`);
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
            'horizontal-split': 'layoutHorizontal',
            'vertical-list': 'layoutList'
        };
        return mapping[layoutType] || 'layoutGrid';
    }

    getLayoutName(layoutType) {
        const mapping = {
            'grid-2x2': '网格布局',
            'vertical-split': '垂直分割',
            'horizontal-split': '水平分割',
            'vertical-list': '列表布局',
            'single-panel': '单面板',
            'smart-grid-layout': '智能网格布局'
        };
        return mapping[layoutType] || '未知布局';
    }

    getSmartGridLayoutName(panelCount) {
        if (panelCount === 3) return "三窗口2×2网格模式";
        if (panelCount === 4) return "四窗口2×2网格模式";
        if (panelCount >= 5 && panelCount <= 6) return "多窗口2×2×2网格模式";
        if (panelCount >= 7 && panelCount <= 8) return "多窗口2×2×2网格模式";
        return "多窗口2×2×2网格模式";
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

    initializeNetworkManager() {
        console.log('初始化网络管理器...');
        
        try {
            // 初始化网络管理器
            if (typeof NetworkManager !== 'undefined') {
                this.networkManager = new NetworkManager();
                window.networkManager = this.networkManager;
                console.log('网络管理器初始化完成');
            } else {
                console.warn('NetworkManager未定义，跳过网络管理器初始化');
            }
        } catch (error) {
            console.error('网络管理器初始化失败:', error);
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
        
        // 检查是否需要优化 - 提高内存阈值
        if (performanceData.memory.current > 200) {
            console.warn('High memory usage detected:', performanceData.memory.current + 'MB');
        }
        
        // 减少性能建议的日志频率
        if (performanceData.recommendations.length > 0) {
            // 只在开发模式下或者有严重问题时输出
            const hasSerious = performanceData.recommendations.some(rec => 
                rec.includes('内存使用较高') || rec.includes('网络错误率较高')
            );
            
            if (hasSerious || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
                console.log('Performance recommendations:', performanceData.recommendations);
            }
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
            const incognitoMode = document.getElementById('incognitoMode').checked;
            
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
                isCustom: true, // 标记为自定义服务
                incognitoMode: incognitoMode // 无痕模式设置
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
            const modeText = incognitoMode ? '（无痕模式）' : '';
            this.notificationSystem?.success(`成功添加AI服务: ${serviceName}${modeText}`);

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

    // 为webview生成稳定的持久化分区ID（优先使用已有id，否则基于URL主机名或名称生成）
    getPersistentServiceId(service) {
        if (service && service.id) return service.id;
        try {
            const urlObj = new URL(service?.url || '');
            const host = (urlObj.hostname || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            if (host) return `custom_${host}`;
        } catch (e) {
            // ignore parse error, fallback to name
        }
        const base = (service?.name || 'service').toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20) || 'service';
        return `custom_${base}`;
    }

    // 当历史数据缺少id时，基于URL或名称生成稳定id（避免因名称调整导致分区变化）
    generateStableServiceId(url, name) {
        let base = '';
        try {
            const host = new URL(url || '').hostname;
            base = (host || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        } catch (e) {
            base = (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        }
        base = (base || 'service').substring(0, 20);
        let id = `custom_${base}`;
        let counter = 1;
        while (this.config?.aiServices?.find(s => s.id === id)) {
            id = `custom_${base}_${counter++}`;
        }
        return id;
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
                const rawCustomServices = JSON.parse(customServicesJson);
                // 兼容历史数据：补充缺失的id，并确保结构完整
                const customServices = rawCustomServices.map(s => {
                    const normalized = { ...s };
                    if (!normalized.id) {
                        normalized.id = this.generateStableServiceId(normalized.url, normalized.name);
                    }
                    // 标记为自定义服务，确保渲染类名与行为一致
                    normalized.isCustom = true;
                    // 适配器缺省使用基础适配器
                    if (!normalized.adapter) normalized.adapter = 'BaseAdapter';
                    if (typeof normalized.enabled === 'undefined') normalized.enabled = true;
                    return normalized;
                });

                // 将自定义服务添加到配置中（避免重复，按id判重）
                customServices.forEach(customService => {
                    const exists = this.config.aiServices.find(service => service.id === customService.id);
                    if (!exists) {
                        this.config.aiServices.push(customService);
                    } else {
                        // 如果已存在，用本地存储的最新数据更新（避免编辑后不生效）
                        const idx = this.config.aiServices.findIndex(s => s.id === customService.id);
                        if (idx !== -1) this.config.aiServices[idx] = customService;
                    }
                });
            }
        } catch (error) {
            console.error('加载自定义服务失败:', error);
        }
    }

    // 应用清理方法
    cleanup() {
        try {
            console.log('🧹 开始清理应用资源...');

            // 清理所有AI面板
            if (this.aiPanels && this.aiPanels.size > 0) {
                console.log(`🗑️ 清理 ${this.aiPanels.size} 个AI面板...`);
                const panelIds = Array.from(this.aiPanels.keys());
                panelIds.forEach(serviceId => {
                    try {
                        this.closePanel(serviceId);
                    } catch (error) {
                        console.warn(`⚠️ 清理面板失败: ${serviceId}`, error);
                    }
                });
            }

            // 清理事件监听器
            try {
                // 移除窗口事件监听器
                if (this.onWindowFocus) {
                    window.removeEventListener('focus', this.onWindowFocus);
                }
                if (this.onWindowBlur) {
                    window.removeEventListener('blur', this.onWindowBlur);
                }
                if (this.handleWindowResize) {
                    window.removeEventListener('resize', this.handleWindowResize);
                }
                
                // 移除文档事件监听器
                if (this.onPageVisible) {
                    document.removeEventListener('visibilitychange', this.onPageVisible);
                }
                if (this.handlePerformanceUpdate) {
                    document.removeEventListener('performanceUpdate', this.handlePerformanceUpdate);
                }
                if (this.handleMemoryWarning) {
                    document.removeEventListener('memoryWarning', this.handleMemoryWarning);
                }
                if (this.reducePollingFrequency) {
                    document.removeEventListener('reducePolling', this.reducePollingFrequency);
                }
                
                console.log('✅ 事件监听器已清理');
            } catch (error) {
                console.warn('⚠️ 清理事件监听器失败:', error);
            }

            // 清理性能监控
            try {
                if (typeof performanceMonitor !== 'undefined' && performanceMonitor.cleanup) {
                    performanceMonitor.cleanup();
                }
                if (typeof memoryOptimizer !== 'undefined' && memoryOptimizer.cleanup) {
                    memoryOptimizer.cleanup();
                }
                console.log('✅ 性能监控已清理');
            } catch (error) {
                console.warn('⚠️ 清理性能监控失败:', error);
            }

            // 清理适配器管理器
            try {
                if (typeof adapterManager !== 'undefined' && adapterManager.cleanup) {
                    adapterManager.cleanup();
                }
                console.log('✅ 适配器管理器已清理');
            } catch (error) {
                console.warn('⚠️ 清理适配器管理器失败:', error);
            }

            // 清理定时器
            try {
                if (this.statusUpdateInterval) {
                    clearInterval(this.statusUpdateInterval);
                    this.statusUpdateInterval = null;
                }
                console.log('✅ 定时器已清理');
            } catch (error) {
                console.warn('⚠️ 清理定时器失败:', error);
            }

            // 清理映射和引用
            try {
                if (this.aiPanels) {
                    this.aiPanels.clear();
                }
                if (this.aiWindows) {
                    this.aiWindows.clear();
                }
                console.log('✅ 映射和引用已清理');
            } catch (error) {
                console.warn('⚠️ 清理映射失败:', error);
            }

            console.log('✅ 应用资源清理完成');
        } catch (error) {
            console.error('❌ 应用清理过程中发生错误:', error);
        }
    }

    // 在页面卸载前清理资源
    beforeUnload() {
        this.cleanup();
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
        
        // 添加页面卸载事件监听器
        window.addEventListener('beforeunload', () => {
            if (window.app && typeof window.app.beforeUnload === 'function') {
                window.app.beforeUnload();
            }
        });
        
        // 添加页面隐藏事件监听器（用于处理标签页关闭等情况）
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && window.app && typeof window.app.cleanup === 'function') {
                // 页面被隐藏时进行轻量级清理
                console.log('页面被隐藏，执行轻量级清理...');
            }
        });
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
        
        // 允许删除所有服务（用户高度自由）
        const deleteItem = document.getElementById('deleteService');
        deleteItem.style.display = 'flex';
        console.log('所有服务均可删除，用户拥有完全自由度');

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
        const serviceId = this.currentService.dataset.serviceId;
        
        let serviceUrl = '';
        let iconLetter = '';
        let iconColor = '';
        let incognitoMode = false;

        // 检查是否为自定义服务
        if (this.currentService.classList.contains('custom-service-item')) {
            const customServices = JSON.parse(localStorage.getItem('customAIServices') || '[]');
            const customService = customServices.find(s => s.id === serviceId) || customServices.find(s => s.name === serviceName);
            if (customService) {
                serviceUrl = customService.url;
                iconLetter = customService.icon;
                iconColor = customService.color;
                incognitoMode = customService.incognitoMode || false;
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
            incognitoMode = false; // 默认服务不支持无痕模式
        }

        // 填充表单
        document.getElementById('editServiceName').value = serviceName;
        document.getElementById('editServiceUrl').value = serviceUrl;
        document.getElementById('editServiceIcon').value = iconLetter;
        document.getElementById('editIncognitoMode').checked = incognitoMode;
        
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
        const incognitoMode = document.getElementById('editIncognitoMode').checked;
        const serviceId = this.currentService.dataset.serviceId;

        if (!newName || !newUrl) {
            alert('请填写完整的服务名称和网址');
            return;
        }

        // 检查是否为自定义服务
        if (this.currentService.classList.contains('custom-service-item')) {
            // 更新自定义服务
            const customServices = JSON.parse(localStorage.getItem('customAIServices') || '[]');
            const serviceIndex = customServices.findIndex(s => s.id === serviceId);
            if (serviceIndex !== -1) {
                const updated = {
                    ...customServices[serviceIndex],
                    id: customServices[serviceIndex].id, // 保留稳定id
                    name: newName,
                    url: newUrl,
                    icon: newIcon,
                    color: selectedColor,
                    isCustom: true,
                    adapter: customServices[serviceIndex].adapter || 'BaseAdapter',
                    enabled: true,
                    incognitoMode: incognitoMode // 无痕模式设置
                };
                customServices[serviceIndex] = updated;
                localStorage.setItem('customAIServices', JSON.stringify(customServices));

                // 同步更新到内存配置并重新渲染
                if (window.app && window.app.config && Array.isArray(window.app.config.aiServices)) {
                    const aiIdx = window.app.config.aiServices.findIndex(s => s.id === serviceId);
                    if (aiIdx !== -1) {
                        window.app.config.aiServices[aiIdx] = updated;
                    }
                    window.app.renderAIServices();
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
            const modeText = incognitoMode ? '（无痕模式）' : '';
            window.app.notificationSystem.show(`服务信息已更新${modeText}`, 'success');
        }
    }

    deleteService() {
        if (!this.currentService) {
            return; // 没有选中的服务
        }

        const serviceName = this.currentService.querySelector('.service-name')?.textContent || 
                           this.currentService.textContent.trim();
        const serviceId = this.currentService.dataset.serviceId;

        // 使用更友好的确认对话框
        const confirmMessage = `确定要删除服务 "${serviceName}" 吗？\n\n⚠️ 此操作无法撤销，删除后该服务将从列表中永久移除。`;
        
        if (confirm(confirmMessage)) {
            try {
                let serviceDeleted = false;

                // 检查是否为自定义服务（从localStorage删除）
                const customServices = JSON.parse(localStorage.getItem('customAIServices') || '[]');
                const originalCustomCount = customServices.length;
                const updatedCustomServices = customServices.filter(s => s.id !== serviceId);
                
                if (updatedCustomServices.length < originalCustomCount) {
                    localStorage.setItem('customAIServices', JSON.stringify(updatedCustomServices));
                    serviceDeleted = true;
                }

                // 从内存配置中移除（处理默认服务和自定义服务）
                if (window.app && window.app.config && Array.isArray(window.app.config.aiServices)) {
                    const originalCount = window.app.config.aiServices.length;
                    window.app.config.aiServices = window.app.config.aiServices.filter(s => s.id !== serviceId);
                    
                    if (window.app.config.aiServices.length < originalCount) {
                        serviceDeleted = true;
                    }
                    
                    // 重新渲染服务列表
                    window.app.renderAIServices();
                    
                    // 保存配置更改
                    window.app.saveConfig();
                }

                if (serviceDeleted) {
                    // 显示成功通知
                    if (window.app && window.app.notificationSystem) {
                        window.app.notificationSystem.show(`服务 "${serviceName}" 已成功删除`, 'success');
                    } else {
                        console.log(`Service "${serviceName}" deleted successfully`);
                    }
                } else {
                    throw new Error('服务未找到或删除失败');
                }
            } catch (error) {
                console.error('Delete service failed:', error);
                if (window.app && window.app.notificationSystem) {
                    window.app.notificationSystem.show('删除服务失败，请重试', 'error');
                } else {
                    alert('删除服务失败，请重试');
                }
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

// 显示谷歌服务打开方式选择对话框
function showGoogleServiceDialog(service) {
    return new Promise((resolve) => {
        // 创建对话框HTML
        const dialogHTML = `
            <div id="google-service-dialog" class="modal-overlay" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            ">
                <div class="modal-content" style="
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                    max-width: 500px;
                    width: 90%;
                    text-align: center;
                ">
                    <h3 style="margin-bottom: 20px; color: #333;">选择打开方式</h3>
                    <p style="margin-bottom: 30px; color: #666; line-height: 1.5;">
                        检测到您要打开谷歌服务。为了避免"此浏览器或应用可能不安全"的错误，建议在独立窗口中打开。
                    </p>
                    <div style="display: flex; gap: 15px; justify-content: center;">
                        <button id="open-in-window" style="
                            background: #4285f4;
                            color: white;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 14px;
                            font-weight: 500;
                        ">独立窗口（推荐）</button>
                        <button id="open-in-webview" style="
                            background: #f8f9fa;
                            color: #333;
                            border: 1px solid #dadce0;
                            padding: 12px 24px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 14px;
                        ">内嵌窗口</button>
                        <button id="cancel-open" style="
                            background: #ea4335;
                            color: white;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 14px;
                        ">取消</button>
                    </div>
                </div>
            </div>
        `;

        // 添加对话框到页面
        document.body.insertAdjacentHTML('beforeend', dialogHTML);
        
        const dialog = document.getElementById('google-service-dialog');
        const openInWindowBtn = document.getElementById('open-in-window');
        const openInWebviewBtn = document.getElementById('open-in-webview');
        const cancelBtn = document.getElementById('cancel-open');

        // 绑定事件
        openInWindowBtn.addEventListener('click', () => {
            dialog.remove();
            resolve('window');
        });

        openInWebviewBtn.addEventListener('click', () => {
            dialog.remove();
            resolve('webview');
        });

        cancelBtn.addEventListener('click', () => {
            dialog.remove();
            resolve('cancel');
        });

        // 点击背景关闭
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                dialog.remove();
                resolve('cancel');
            }
        });
    });
}

// 在独立窗口中打开谷歌服务
async function openGoogleServiceInWindow(service) {
    try {
        console.log('在独立窗口中打开谷歌服务:', service.name);
        
        // 通过IPC调用主进程创建独立窗口
        if (window.electronAPI && window.electronAPI.createAIWindow) {
            const windowConfig = {
                url: service.url,
                title: `${service.name} - 心流AI浏览器`,
                width: 1200,
                height: 800,
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true,
                    webSecurity: true,
                    allowRunningInsecureContent: false,
                    experimentalFeatures: false
                }
            };
            
            await window.electronAPI.createAIWindow(windowConfig);
            console.log('谷歌服务独立窗口创建成功');
        } else {
            console.error('electronAPI不可用，无法创建独立窗口');
            // 降级到webview方案
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('创建谷歌服务独立窗口失败:', error);
        return false;
    }
}