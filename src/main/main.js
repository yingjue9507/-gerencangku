const { app, BrowserWindow, BrowserView, ipcMain, Menu, shell } = require('electron');
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
    console.log('🚀 开始初始化多AI浏览器...');
    
    // 添加全局错误处理
    process.on('uncaughtException', (error) => {
      console.error('未捕获的异常:', error);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('未处理的Promise拒绝:', reason);
    });

    // 在创建任何窗口之前禁用GPU加速，避免GPU进程异常导致渲染问题
    try {
      app.disableHardwareAcceleration();
      app.commandLine.appendSwitch('disable-gpu');
      app.commandLine.appendSwitch('disable-software-rasterizer');
      console.log('✅ GPU加速已禁用');
    } catch (e) {
      console.warn('⚠️ 禁用GPU加速失败:', e);
    }

    try {
      // 等待Electron准备就绪
      console.log('⏳ 等待Electron准备就绪...');
      await app.whenReady();
      console.log('✅ Electron已准备就绪');
      
      // 创建主窗口
      console.log('🪟 创建主窗口...');
      this.createMainWindow();
      
      // 设置应用菜单
      console.log('📋 设置应用菜单...');
      this.setupMenu();
      
      // 设置IPC监听器
      console.log('🔗 设置IPC监听器...');
      this.setupIPC();
      
      // 处理应用事件
      console.log('⚙️ 设置应用事件...');
      this.setupAppEvents();
      
      console.log('🎉 多AI浏览器初始化完成！');
    } catch (error) {
      console.error('❌ 初始化失败:', error);
      throw error;
    }
  }

  createMainWindow() {
    try {
      console.log('📝 创建主窗口配置...');
      
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
          preload: path.join(__dirname, 'preload.js')
        },
        titleBarStyle: 'default',
        show: false
      });

      console.log('✅ 主窗口创建成功');

      // 加载渲染进程
      const htmlPath = path.join(__dirname, '../renderer/index.html');
      console.log('📄 加载HTML文件:', htmlPath);
      
      if (this.isDev) {
        // 开发模式直接加载本地HTML文件
        this.mainWindow.loadFile(htmlPath);
      } else {
        this.mainWindow.loadFile(htmlPath);
      }

      // 窗口准备好后显示
      this.mainWindow.once('ready-to-show', () => {
        console.log('👁️ 主窗口准备就绪，显示窗口');
        this.mainWindow.show();
        
        // 开发模式下打开开发者工具 - 已禁用
        // if (this.isDev) {
        //   this.mainWindow.webContents.openDevTools();
        // }
      });

      // 处理窗口关闭
      this.mainWindow.on('closed', () => {
        console.log('🚪 主窗口已关闭');
        this.mainWindow = null;
      });

      // 添加错误处理
      this.mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        console.error('❌ 页面加载失败:', {
          errorCode,
          errorDescription,
          validatedURL
        });
      });

      this.mainWindow.webContents.on('crashed', (event, killed) => {
        console.error('💥 渲染进程崩溃:', { killed });
      });

    } catch (error) {
      console.error('❌ 创建主窗口失败:', error);
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
        console.error('更新窗口设置失败:', error);
        return false;
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
        preload: path.join(__dirname, 'ai-preload.js')
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

  closeAIWindow(windowId) {
    const windowData = this.aiWindows.get(windowId);
    if (windowData && windowData.window && !windowData.window.isDestroyed()) {
      windowData.window.close();
      return true;
    }
    return false;
  }

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
        console.error('收回窗口失败:', error);
        return { success: false, error: error.message };
      }
    }
    return { success: false, error: '窗口不存在' };
  }

  setupAppEvents() {
    const self = this;
    
    // 当所有窗口关闭时
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    // 当应用激活时
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createMainWindow();
      }
    });



    // 处理新窗口打开
    app.on('web-contents-created', (event, contents) => {
      contents.on('new-window', (event, navigationUrl, frameName, disposition, options) => {
        console.log('主进程收到new-window事件:', {
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
            
            // 创建新的子窗口
            const popupWindow = new BrowserWindow({
              width: 800,
              height: 600,
              parent: mainWindow,
              modal: false,
              show: true,
              webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                webSecurity: false,
                allowRunningInsecureContent: true
              }
            });
            
            // 存储窗口引用
            const windowId = Date.now().toString();
            self.popupWindows.set(windowId, {
              window: popupWindow,
              url: navigationUrl,
              parentWebview: contents,
              windowId: windowId
            });
            
            // 加载URL到弹出窗口
            popupWindow.loadURL(navigationUrl);
            
            console.log('弹出窗口已创建，设置自动收回定时器，2秒后执行');
            
            // 设置自动收回机制 - 给用户2秒时间看到弹窗，然后自动收回
            const autoRecallTimer = setTimeout(() => {
              console.log('自动收回定时器触发，开始检查窗口状态');
              // 检查窗口是否仍然存在且未被手动关闭
              if (self.popupWindows.has(windowId)) {
                const windowData = self.popupWindows.get(windowId);
                if (windowData && windowData.window && !windowData.window.isDestroyed()) {
                  console.log('自动收回弹出窗口:', navigationUrl);
                  
                  // 执行自动收回
                  const result = self.recallPopupWindow(windowId);
                  if (result.success) {
                    console.log('弹出窗口已自动收回到主窗口');
                  } else {
                    console.error('自动收回失败:', result.error);
                  }
                }
              }
            }, 2000); // 2秒后自动收回
            
            // 将定时器ID存储到窗口数据中，以便在手动关闭时清除
            self.popupWindows.get(windowId).autoRecallTimer = autoRecallTimer;
            
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
            
            popupWindow.loadURL(navigationUrl);
            
            // 窗口关闭时清理引用
            popupWindow.on('closed', () => {
              // 清除自动收回定时器
              const windowData = self.popupWindows.get(windowId);
              if (windowData && windowData.autoRecallTimer) {
                clearTimeout(windowData.autoRecallTimer);
                console.log('已清除自动收回定时器');
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
          console.error('收回窗口失败:', error);
          return { success: false, error: error.message };
        }
      }
      return { success: false, error: '窗口不存在' };
    });
  }
}

// 创建应用实例并初始化
const aiApp = new AIBrowserApp();
aiApp.initialize().catch(console.error);

// 导出应用实例供其他模块使用
module.exports = aiApp;