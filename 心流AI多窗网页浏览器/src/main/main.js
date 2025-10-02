const { app, BrowserWindow, BrowserView, ipcMain, Menu, shell, session } = require('electron');
const path = require('path');
const Store = require('electron-store');

// 初始化配置存储
const store = new Store();

class AIBrowserApp {
  constructor() {
    this.mainWindow = null;
    this.aiWindows = new Map(); // 存储AI服务窗口
    this.popupWindows = new Map(); // 存储弹出窗口
    this.isDev = process.env.NODE_ENV === 'development';
  }

  async initialize() {
    console.log('🚀 Initializing AI Browser...');
    
    // 添加全局错误处理
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Promise Rejection:', reason);
    });

    // 在创建任何窗口之前禁用GPU加速，避免GPU进程异常导致渲染问题
    try {
      app.disableHardwareAcceleration();
      app.commandLine.appendSwitch('disable-gpu');
      app.commandLine.appendSwitch('disable-software-rasterizer');
      console.log('✅ GPU acceleration disabled');
    } catch (e) {
      console.warn('⚠️ Failed to disable GPU acceleration:', e);
    }

    try {
      // 等待Electron准备就绪
      console.log('⏳ Waiting for Electron to be ready...');
      await app.whenReady();
      console.log('✅ Electron is ready');
      
      // 创建主窗口
      console.log('🪟 Creating main window...');
      this.createMainWindow();
      
      // 设置应用菜单
      console.log('📋 Setting up application menu...');
      this.setupMenu();
      
      // 设置IPC监听器
      console.log('🔗 Setting up IPC listeners...');
      this.setupIPC();
      
      // 设置应用事件
      console.log('⚙️ Setting up application events...');
      this.setupAppEvents();
      
      console.log('🎉 AI Browser initialization completed!');
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      app.quit();
    }
  }

  createMainWindow() {
    try {
      console.log('📝 Creating main window configuration...');
      
      // 创建主控制窗口
      this.mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        webSecurity: false, // 允许webview加载外部网站
        allowRunningInsecureContent: true,
        webviewTag: true, // 启用webview标签支持
        experimentalFeatures: true, // 启用实验性功能
        plugins: true, // 启用插件支持
        preload: path.join(__dirname, 'preload.js'),
        // 增强安全配置
        spellcheck: false, // 禁用拼写检查以减少指纹识别
        backgroundThrottling: false, // 禁用后台节流
        offscreen: false, // 禁用离屏渲染
        // 反检测配置
        additionalArguments: [
          '--disable-blink-features=AutomationControlled',
          '--disable-features=VizDisplayCompositor',
          '--disable-web-security',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection'
        ]
      },
        titleBarStyle: 'default',
        show: false
      });

      console.log('✅ Main window created successfully');

      // 加载渲染进程
      const htmlPath = path.join(__dirname, '../renderer/index.html');
      console.log('📄 Loading HTML file:', htmlPath);
      
      if (this.isDev) {
        // 开发模式直接加载本地HTML文件
        this.mainWindow.loadFile(htmlPath);
      } else {
        this.mainWindow.loadFile(htmlPath);
      }

      // 窗口准备好后显示
      this.mainWindow.once('ready-to-show', () => {
        console.log('👁️ Main window ready, showing window');
        this.mainWindow.show();
        
        // 不再默认打开开发者工具，只保留F12快捷键功能
        // if (this.isDev) {
        //   this.mainWindow.webContents.openDevTools();
        // }
      });

      // 添加F12快捷键支持开发者工具
      this.mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'F12') {
          if (this.mainWindow.webContents.isDevToolsOpened()) {
            this.mainWindow.webContents.closeDevTools();
          } else {
            this.mainWindow.webContents.openDevTools();
          }
        }
      });

      // 处理窗口关闭
      this.mainWindow.on('closed', () => {
        console.log('🚪 Main window closed');
        this.mainWindow = null;
      });

      // 添加错误处理
      this.mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        console.error('❌ Page load failed:', {
          errorCode,
          errorDescription,
          validatedURL
        });
      });

      this.mainWindow.webContents.on('crashed', (event, killed) => {
        console.error('💥 Renderer process crashed:', { killed });
      });

      // 监听渲染进程的控制台消息
      this.mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
        const logLevel = ['verbose', 'info', 'warning', 'error'][level] || 'info';
        console.log(`[Renderer ${logLevel.toUpperCase()}] ${message} (${sourceId}:${line})`);
      });

    } catch (error) {
      console.error('❌ Failed to create main window:', error);
      throw error;
    }
  }

  setupMenu() {
    const template = [
      {
        label: '文件',
        submenu: [
          {
            label: '新建AI窗口',
            accelerator: 'CmdOrCtrl+N',
            click: () => this.createAIWindow()
          },
          { type: 'separator' },
          {
            label: '退出',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => app.quit()
          }
        ]
      },
      {
        label: '编辑',
        submenu: [
          { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
          { label: '重做', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
          { type: 'separator' },
          { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
          { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
          { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' }
        ]
      },
      {
        label: '视图',
        submenu: [
          { label: '重新加载', accelerator: 'CmdOrCtrl+R', role: 'reload' },
          { label: '强制重新加载', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
          // { label: '开发者工具', accelerator: 'F12', role: 'toggleDevTools' }, // 已禁用F12快捷键
          { type: 'separator' },
          { label: '实际大小', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
          { label: '放大', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
          { label: '缩小', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
          { type: 'separator' },
          { label: '全屏', accelerator: 'F11', role: 'togglefullscreen' }
        ]
      },
      {
        label: '帮助',
        submenu: [
          {
            label: '关于',
            click: () => {
              shell.openExternal('https://github.com/your-repo/multi-ai-browser');
            }
          }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  setupIPC() {
    // 创建AI窗口
    ipcMain.handle('create-ai-window', async (event, config) => {
      return this.createAIWindow(config);
    });

    // 关闭AI窗口
    ipcMain.handle('close-ai-window', async (event, windowId) => {
      return this.closeAIWindow(windowId);
    });

    // 获取所有AI窗口
    ipcMain.handle('get-ai-windows', async () => {
      const windows = [];
      for (const [windowId, windowData] of this.aiWindows.entries()) {
        if (windowData.window && !windowData.window.isDestroyed()) {
          windows.push({
            id: windowId,
            serviceId: windowData.serviceId
          });
        }
      }
      return windows;
    });

    // 向AI窗口发送消息
    ipcMain.handle('send-to-ai-window', async (event, windowId, message) => {
      const windowData = this.aiWindows.get(windowId);
      if (windowData && windowData.window && !windowData.window.isDestroyed()) {
        windowData.window.webContents.executeJavaScript(`
          window.postMessage(${JSON.stringify(message)}, '*');
        `);
        return true;
      }
      return false;
    });

    // 保存配置
    ipcMain.handle('save-config', async (event, config) => {
      store.set('config', config);
      return true;
    });

    // 加载配置
    ipcMain.handle('load-config', async () => {
      return store.get('config', {});
    });

    // 更新窗口设置
    ipcMain.handle('update-window-settings', async (event, windowSettings) => {
      try {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          // 应用窗口设置
          if (windowSettings.alwaysOnTop !== undefined) {
            this.mainWindow.setAlwaysOnTop(windowSettings.alwaysOnTop);
          }
          if (windowSettings.opacity !== undefined) {
            this.mainWindow.setOpacity(windowSettings.opacity);
          }
          if (windowSettings.width && windowSettings.height) {
            this.mainWindow.setSize(windowSettings.width, windowSettings.height);
          }
          if (windowSettings.x !== undefined && windowSettings.y !== undefined) {
            this.mainWindow.setPosition(windowSettings.x, windowSettings.y);
          }
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to update window settings:', error);
        return false;
      }
    });

    // 会话数据清理：按分区清除存储数据（cookies、localStorage、IndexedDB、ServiceWorkers、caches等）
    ipcMain.handle('clear-session-data', async (event, partitionId, options = {}) => {
      try {
        if (!partitionId || typeof partitionId !== 'string') {
          return { success: false, error: 'Invalid partition ID' };
        }

        // 统一使用持久化分区命名
        const partitionName = partitionId.startsWith('persist:') 
          ? partitionId 
          : `persist:${partitionId}`;

        const ses = session.fromPartition(partitionName);
        if (!ses) {
          return { success: false, error: `Partition not found: ${partitionName}` };
        }

        // 默认清理的存储类型
        const defaultTypes = ['cookies', 'localstorage', 'indexdb', 'serviceworkers', 'caches'];
        const types = Array.isArray(options.types) && options.types.length > 0 
          ? options.types 
          : defaultTypes;

        // Electron API 的类型名称
        const validTypes = ['appcache','cookies','filesystem','indexdb','localstorage','shadercache','serviceworkers','caches','websql'];
        const storages = types
          .map(t => t.toLowerCase())
          .filter(t => validTypes.includes(t));

        // 清理存储数据
        await ses.clearStorageData({ storages });

        // 可选清理缓存
        const includeCache = options.includeCache !== false; // 默认清理缓存
        if (includeCache && ses.clearCache) {
          await ses.clearCache();
        }

        return { success: true };
      } catch (error) {
        console.error('Failed to clear session data:', error);
        return { success: false, error: error.message || String(error) };
      }
    });
  }

  createAIWindow(config = {}) {
    const windowId = `ai-window-${Date.now()}`;
    
    const aiWindow = new BrowserWindow({
      width: config.width || 1000,
      height: config.height || 700,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: false, // 允许跨域请求
        allowRunningInsecureContent: true,
        preload: path.join(__dirname, 'ai-preload.js'),
        // 增强安全配置
        spellcheck: false, // 禁用拼写检查以减少指纹识别
        backgroundThrottling: false, // 禁用后台节流
        offscreen: false, // 禁用离屏渲染
        // 反检测配置
        additionalArguments: [
          '--disable-blink-features=AutomationControlled',
          '--disable-features=VizDisplayCompositor',
          '--disable-web-security',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection',
          '--no-first-run',
          '--no-default-browser-check'
        ]
      },
      title: config.title || 'AI服务窗口',
      show: false
    });

    // 加载AI服务URL
    if (config.url) {
      aiWindow.loadURL(config.url);
    }

    // 窗口准备好后显示
    aiWindow.once('ready-to-show', () => {
      aiWindow.show();
    });

    // 处理窗口关闭
    aiWindow.on('closed', () => {
      this.aiWindows.delete(windowId);
    });

    // 存储窗口引用和配置信息
    this.aiWindows.set(windowId, {
      window: aiWindow,
      serviceId: config.serviceId || null,
      config: config
    });

    return windowId;
  }

  // closeAIWindow方法已在下方重新定义，包含更好的资源清理

  recallPopupWindow(windowId) {
    const windowData = this.popupWindows.get(windowId);
    if (windowData && windowData.window && !windowData.window.isDestroyed()) {
      try {
        // 获取窗口的当前URL
        const currentUrl = windowData.window.webContents.getURL();
        
        // 在父webview中加载这个URL
        windowData.parentWebview.loadURL(currentUrl);
        
        // 关闭弹出窗口
        windowData.window.close();
        this.popupWindows.delete(windowId);
        
        return { success: true };
      } catch (error) {
        console.error('Failed to recall window:', error);
        return { success: false, error: error.message };
      }
    }
    return { success: false, error: 'Window does not exist' };
  }

  setupAppEvents() {
    const self = this;
    
    // 当所有窗口关闭时
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        // 在退出前清理所有资源
        this.cleanup();
        app.quit();
      }
    });

    // 当应用激活时
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createMainWindow();
      }
    });

    // 应用即将退出时的清理
    app.on('before-quit', (event) => {
      console.log('🧹 Application is about to quit, performing cleanup...');
      this.cleanup();
    });

    // 处理应用意外退出
    app.on('will-quit', (event) => {
      console.log('🔄 Application will quit, final cleanup...');
      this.cleanup();
    });

    // 处理第二个实例
    app.on('second-instance', () => {
      if (this.mainWindow) {
        if (this.mainWindow.isMinimized()) {
          this.mainWindow.restore();
        }
        this.mainWindow.focus();
      }
    });

    // 处理证书错误 - 专门针对谷歌登录优化
    app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
      console.log('Certificate error for URL:', url, 'Error:', error);
      
      // 对于谷歌相关域名，采用更宽松的证书验证
      const googleDomains = [
        'accounts.google.com',
        'oauth2.googleapis.com', 
        'www.googleapis.com',
        'ssl.gstatic.com',
        'fonts.googleapis.com',
        'apis.google.com'
      ];
      
      const isGoogleDomain = googleDomains.some(domain => url.includes(domain));
      
      if (isGoogleDomain) {
        console.log('允许谷歌域名的证书错误:', url);
        event.preventDefault();
        callback(true);
      } else if (process.env.NODE_ENV === 'development') {
        // 开发环境忽略所有证书错误
        event.preventDefault();
        callback(true);
      } else {
        // 其他域名严格验证证书
        console.log('拒绝证书错误:', url, error);
        callback(false);
      }
    });



    // 处理新窗口打开
    app.on('web-contents-created', (event, contents) => {
      // OAuth/登录域名白名单（在内嵌 webview 中应以安全子窗口方式打开）
      const OAUTH_URL_PATTERNS = [
        /https?:\/\/accounts\.google\.com\//i,
        /https?:\/\/login\.microsoftonline\.com\//i,
        /https?:\/\/github\.com\/login/i,
        /https?:\/\/auth\.openai\.com\//i,
        /https?:\/\/id\.atlassian\.com\//i,
        /https?:\/\/auth\.slack\.com\//i
      ];

      contents.on('new-window', (event, navigationUrl, frameName, disposition, options) => {
        console.log('Main process received new-window event:', {
          url: navigationUrl,
          disposition: disposition,
          hasHostWebContents: !!contents.hostWebContents,
          hostType: contents.hostWebContents ? contents.hostWebContents.getType() : 'none',
          contentsType: contents.getType()
        });
        
        // 检查是否是webview内的弹窗
        if (contents.hostWebContents && contents.hostWebContents.getType() === 'webview') {
          // 对于webview内的弹窗，创建新的子窗口而不是在外部浏览器打开
          if (disposition === 'new-window' || disposition === 'foreground-tab') {
            event.preventDefault();

            // 判定是否为 OAuth/登录域名
            const isOAuthUrl = OAUTH_URL_PATTERNS.some((re) => re.test(navigationUrl));

            // 使用事件提供的 options 来创建窗口，确保继承父 webview 的分区/安全配置
            const safeOptions = {
              ...options,
              parent: self.mainWindow || options.parent,
              show: true,
              width: options?.width || 800,
              height: options?.height || 600,
              webPreferences: {
                ...(options?.webPreferences || {}),
                // 强化安全，避免被判定为不安全环境
                nodeIntegration: false,
                contextIsolation: true,
                sandbox: true,
                webSecurity: true
              }
            };

            const popupWindow = new BrowserWindow(safeOptions);

            // 存储窗口引用
            const windowId = Date.now().toString();
            self.popupWindows.set(windowId, {
              window: popupWindow,
              url: navigationUrl,
              parentWebview: contents,
              windowId: windowId
            });

            // 现代浏览器 UA，避免显式暴露 Electron 特征
            // 固定使用最新的谷歌Chrome浏览器标识
const MODERN_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

            // 加载URL到弹出窗口并指定 UA
            try {
              popupWindow.loadURL(navigationUrl, { userAgent: MODERN_UA });
            } catch (e) {
              // 回退
              popupWindow.loadURL(navigationUrl);
            }

            // OAuth 弹窗不再使用自动收回，登录成功后由用户关闭或后续导航检测收回
            if (!isOAuthUrl) {
              console.log('Non-OAuth popup, setting auto-recall timer, executing in 2 seconds');
              const autoRecallTimer = setTimeout(() => {
                if (self.popupWindows.has(windowId)) {
                  const windowData = self.popupWindows.get(windowId);
                  if (windowData && windowData.window && !windowData.window.isDestroyed()) {
                    const result = self.recallPopupWindow(windowId);
                    if (result.success) {
                      console.log('Popup window automatically recalled to main window');
                    } else {
                      console.error('Auto-recall failed:', result.error);
                    }
                  }
                }
              }, 2000);
              // 记录定时器，便于清理
              self.popupWindows.get(windowId).autoRecallTimer = autoRecallTimer;
            }
            
            // 为弹出窗口创建自定义菜单
            const popupMenuTemplate = [
              {
                label: '文件',
                submenu: [
                  {
                    label: '收回到主窗口',
                    accelerator: 'CmdOrCtrl+Shift+R',
                    click: () => {
                      // 执行收回操作
                      self.recallPopupWindow(windowId);
                    }
                  },
                  { type: 'separator' },
                  {
                    label: '关闭窗口',
                    accelerator: 'CmdOrCtrl+W',
                    click: () => {
                      popupWindow.close();
                    }
                  }
                ]
              },
              {
                label: '编辑',
                submenu: [
                  { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
                  { label: '重做', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
                  { type: 'separator' },
                  { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
                  { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
                  { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' }
                ]
              },
              {
                label: '视图',
                submenu: [
                  { label: '重新加载', accelerator: 'CmdOrCtrl+R', role: 'reload' },
                  { label: '强制重新加载', accelerator: 'CmdOrCtrl+Shift+F5', role: 'forceReload' },
                  // { label: '开发者工具', accelerator: 'F12', role: 'toggleDevTools' }, // 已禁用F12快捷键
                  { type: 'separator' },
                  { label: '实际大小', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
                  { label: '放大', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
                  { label: '缩小', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
                  { type: 'separator' },
                  { label: '全屏', accelerator: 'F11', role: 'togglefullscreen' }
                ]
              }
            ];
            
            const popupMenu = Menu.buildFromTemplate(popupMenuTemplate);
            popupWindow.setMenu(popupMenu);
            
            // 添加Ctrl+鼠标滚轮缩放功能
            popupWindow.webContents.on('dom-ready', () => {
              popupWindow.webContents.executeJavaScript(`
                // 添加鼠标滚轮缩放功能
                let currentZoomLevel = 1.0;
                
                document.addEventListener('wheel', (event) => {
                  if (event.ctrlKey) {
                    event.preventDefault();
                    
                    // 计算新的缩放级别
                    if (event.deltaY < 0) {
                      // 向上滚动，放大
                      currentZoomLevel = Math.min(currentZoomLevel * 1.1, 3.0);
                    } else {
                      // 向下滚动，缩小
                      currentZoomLevel = Math.max(currentZoomLevel * 0.9, 0.25);
                    }
                    
                    // 应用缩放
                    document.body.style.zoom = currentZoomLevel;
                    console.log('Zoom level:', currentZoomLevel);
                  }
                }, { passive: false });
                
                console.log('Popup window zoom feature enabled: Ctrl+Mouse wheel');
              `).catch(err => {
                console.error('Failed to inject zoom script:', err);
              });
            });
            
            // 窗口关闭时清理引用
            popupWindow.on('closed', () => {
              // 清除自动收回定时器
              const windowData = self.popupWindows.get(windowId);
              if (windowData && windowData.autoRecallTimer) {
                clearTimeout(windowData.autoRecallTimer);
                console.log('Auto-recall timer cleared');
              }
              self.popupWindows.delete(windowId);
            });
            
            return;
          }
        }
        
        // 对于其他情况，在外部浏览器中打开
        event.preventDefault();
        shell.openExternal(navigationUrl);
      });
    });

    // 添加IPC处理器来管理窗口收回功能
    ipcMain.handle('get-popup-windows', () => {
      const windows = [];
      self.popupWindows.forEach((data, id) => {
        if (data.window && !data.window.isDestroyed()) {
          windows.push({
            id: id,
            url: data.url,
            title: data.window.getTitle()
          });
        }
      });
      return windows;
    });

    ipcMain.handle('recall-window', async (event, windowId) => {
      const windowData = self.popupWindows.get(windowId);
      if (windowData && windowData.window && !windowData.window.isDestroyed()) {
        try {
          // 获取窗口的当前URL
          const currentUrl = windowData.window.webContents.getURL();
          
          // 在父webview中加载这个URL
          windowData.parentWebview.loadURL(currentUrl);
          
          // 关闭弹出窗口
          windowData.window.close();
          self.popupWindows.delete(windowId);
          
          return { success: true };
        } catch (error) {
          console.error('Failed to recall window:', error);
          return { success: false, error: error.message };
        }
      }
      return { success: false, error: 'Window does not exist' };
    });
  }

  // 应用清理方法
  cleanup() {
    try {
      console.log('🧹 Starting application cleanup...');
      
      // 清理所有AI窗口
      if (this.aiWindows && this.aiWindows.size > 0) {
        console.log(`🗑️ Cleaning up ${this.aiWindows.size} AI windows...`);
        for (const [windowId, windowData] of this.aiWindows.entries()) {
          try {
            if (windowData.window && !windowData.window.isDestroyed()) {
              windowData.window.removeAllListeners();
              windowData.window.close();
            }
          } catch (error) {
            console.warn(`⚠️ Failed to cleanup AI window ${windowId}:`, error.message);
          }
        }
        this.aiWindows.clear();
      }

      // 清理所有弹出窗口
      if (this.popupWindows && this.popupWindows.size > 0) {
        console.log(`🗑️ Cleaning up ${this.popupWindows.size} popup windows...`);
        for (const [windowId, windowData] of this.popupWindows.entries()) {
          try {
            if (windowData.window && !windowData.window.isDestroyed()) {
              windowData.window.removeAllListeners();
              windowData.window.close();
            }
          } catch (error) {
            console.warn(`⚠️ Failed to cleanup popup window ${windowId}:`, error.message);
          }
        }
        this.popupWindows.clear();
      }

      // 清理主窗口
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        console.log('🗑️ Cleaning up main window...');
        try {
          this.mainWindow.removeAllListeners();
        } catch (error) {
          console.warn('⚠️ Failed to remove main window listeners:', error.message);
        }
      }

      // 清理IPC监听器
      try {
        ipcMain.removeAllListeners();
        console.log('✅ IPC listeners cleaned up');
      } catch (error) {
        console.warn('⚠️ Failed to cleanup IPC listeners:', error.message);
      }

      // 清理会话数据（可选，根据需要）
      try {
        const defaultSession = session.defaultSession;
        if (defaultSession) {
          // 清理缓存和临时数据
          defaultSession.clearCache().catch(err => 
            console.warn('⚠️ Failed to clear session cache:', err.message)
          );
        }
      } catch (error) {
        console.warn('⚠️ Failed to cleanup session data:', error.message);
      }

      console.log('✅ Application cleanup completed');
    } catch (error) {
      console.error('❌ Error during application cleanup:', error);
    }
  }

  // 优化窗口关闭处理
  closeAIWindow(windowId) {
    const windowData = this.aiWindows.get(windowId);
    if (windowData && windowData.window && !windowData.window.isDestroyed()) {
      try {
        // 移除事件监听器防止内存泄漏
        windowData.window.removeAllListeners();
        windowData.window.close();
        this.aiWindows.delete(windowId);
        console.log(`✅ AI window ${windowId} closed and cleaned up`);
        return true;
      } catch (error) {
        console.error(`❌ Failed to close AI window ${windowId}:`, error);
        // 即使关闭失败也要从Map中移除
        this.aiWindows.delete(windowId);
        return false;
      }
    }
    return false;
  }
}

// 创建应用实例并初始化
const aiApp = new AIBrowserApp();
aiApp.initialize().catch(console.error);

// 导出应用实例供其他模块使用
module.exports = aiApp;