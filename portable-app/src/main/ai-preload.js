const { contextBridge, ipcRenderer } = require('electron');

// AI窗口专用的preload脚本
contextBridge.exposeInMainWorld('aiAPI', {
  // 向主进程发送消息
  sendToMain: (message) => ipcRenderer.invoke('ai-window-message', message),
  
  // 注入脚本到页面
  injectScript: (script) => {
    try {
      return eval(script);
    } catch (error) {
      console.error('Script injection error:', error);
      return null;
    }
  },
  
  // 获取页面信息
  getPageInfo: () => ({
    url: window.location.href,
    title: document.title,
    domain: window.location.hostname
  }),
  
  // DOM操作工具
  dom: {
    querySelector: (selector) => document.querySelector(selector),
    querySelectorAll: (selector) => Array.from(document.querySelectorAll(selector)),
    getElementById: (id) => document.getElementById(id),
    
    // 安全的文本设置
    setText: (element, text) => {
      if (element && typeof element.textContent !== 'undefined') {
        element.textContent = text;
        return true;
      }
      return false;
    },
    
    // 安全的点击操作
    click: (element) => {
      if (element && typeof element.click === 'function') {
        element.click();
        return true;
      }
      return false;
    },
    
    // 等待元素出现
    waitForElement: (selector, timeout = 5000) => {
      return new Promise((resolve, reject) => {
        const element = document.querySelector(selector);
        if (element) {
          resolve(element);
          return;
        }
        
        const observer = new MutationObserver((mutations) => {
          const element = document.querySelector(selector);
          if (element) {
            observer.disconnect();
            resolve(element);
          }
        });
        
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
        
        setTimeout(() => {
          observer.disconnect();
          reject(new Error(`Element ${selector} not found within ${timeout}ms`));
        }, timeout);
      });
    }
  }
});

// 动态加载适配器脚本和错误处理系统
async function loadAdapterScripts() {
    const scripts = [
        // 错误处理和通知系统
        '../renderer/notification-system.js',
        '../renderer/error-handler.js',
        // 适配器脚本
        '../adapters/base-adapter.js',
        '../adapters/chatgpt-adapter.js',
        '../adapters/claude-adapter.js',
        '../adapters/gemini-adapter.js',
        '../adapters/copilot-adapter.js',
        '../adapters/adapter-manager.js'
    ];
    
    for (const scriptPath of scripts) {
        try {
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = scriptPath;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        } catch (error) {
            console.warn(`Failed to load script ${scriptPath}:`, error);
        }
    }
}

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', async () => {
  console.log('AI window preload script initialized');
  
  // 加载适配器脚本
  await loadAdapterScripts();
  
  // 初始化适配器管理器
  if (typeof adapterManager !== 'undefined') {
      try {
          await adapterManager.initialize();
          console.log('Adapter manager initialized in AI window');
      } catch (error) {
          console.error('Failed to initialize adapter manager:', error);
      }
  }
  
  // 监听页面消息
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'AI_COMMAND') {
      handleAICommand(event.data);
    }
  });
});

// 处理AI命令
function handleAICommand(command) {
  switch (command.action) {
    case 'INPUT_TEXT':
      inputText(command.selector, command.text);
      break;
    case 'CLICK_BUTTON':
      clickButton(command.selector);
      break;
    case 'GET_RESPONSE':
      getResponse(command.selector);
      break;
    default:
      console.warn('Unknown AI command:', command);
  }
}

// 输入文本
function inputText(selector, text) {
  const element = document.querySelector(selector);
  if (element) {
    element.value = text;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

// 点击按钮
function clickButton(selector) {
  const element = document.querySelector(selector);
  if (element) {
    element.click();
  }
}

// 获取响应内容
function getResponse(selector) {
  const element = document.querySelector(selector);
  if (element) {
    return element.textContent || element.innerText;
  }
  return null;
}