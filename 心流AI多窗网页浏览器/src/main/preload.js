const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // AI窗口管理
  createAIWindow: (config) => ipcRenderer.invoke('create-ai-window', config),
  closeAIWindow: (windowId) => ipcRenderer.invoke('close-ai-window', windowId),
  getAIWindows: () => ipcRenderer.invoke('get-ai-windows'),
  sendToAIWindow: (windowId, message) => ipcRenderer.invoke('send-to-ai-window', windowId, message),
  
  // 配置管理
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  loadConfig: () => ipcRenderer.invoke('load-config'),
  
  // 窗口设置
  updateWindowSettings: (windowSettings) => ipcRenderer.invoke('update-window-settings', windowSettings),

  // 会话清理
  clearSessionData: (partitionId, options) => ipcRenderer.invoke('clear-session-data', partitionId, options),
  
  // 系统信息
  platform: process.platform,
  version: process.versions.electron,
  
  // 事件监听
  onAIWindowMessage: (callback) => {
    ipcRenderer.on('ai-window-message', (event, data) => callback(data));
  },
  
  // 移除事件监听
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },

  // 窗口收回功能
  invoke: (channel, ...args) => {
    const validChannels = ['get-popup-windows', 'recall-window', 'clear-session-data'];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
  }
});

// 开发模式下的调试信息
if (process.env.NODE_ENV === 'development') {
  console.log('Preload script loaded for main window');
}