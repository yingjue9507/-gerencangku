# 多AI集成浏览器 - API和开发者文档

## 目录
1. [项目架构](#项目架构)
2. [核心模块API](#核心模块api)
3. [适配器系统](#适配器系统)
4. [性能监控系统](#性能监控系统)
5. [设置管理系统](#设置管理系统)
6. [错误处理系统](#错误处理系统)
7. [开发指南](#开发指南)
8. [扩展开发](#扩展开发)

## 项目架构

### 目录结构
```
src/
├── main/                   # 主进程
│   ├── main.js            # Electron主进程入口
│   ├── preload.js         # 预加载脚本
│   └── ai-preload.js      # AI服务预加载
├── renderer/              # 渲染进程
│   ├── app.js             # 主应用逻辑
│   ├── index.html         # 主界面
│   ├── error-handler.js   # 错误处理
│   ├── notification-system.js  # 通知系统
│   ├── validation-system.js    # 验证系统
│   ├── performance-monitor.js  # 性能监控
│   ├── memory-optimizer.js     # 内存优化
│   ├── resource-optimizer.js   # 资源优化
│   ├── settings-manager.js     # 设置管理
│   └── settings-ui.js          # 设置界面
└── adapters/              # AI服务适配器
    ├── adapter-manager.js # 适配器管理器
    ├── base-adapter.js    # 基础适配器
    ├── chatgpt-adapter.js # ChatGPT适配器
    ├── claude-adapter.js  # Claude适配器
    ├── copilot-adapter.js # Copilot适配器
    └── gemini-adapter.js  # Gemini适配器
```

### 技术栈
- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **桌面框架**: Electron
- **构建工具**: npm
- **开发工具**: Node.js, Git

## 核心模块API

### App类 (app.js)

#### 构造函数
```javascript
class App {
    constructor()
}
```

#### 主要方法

##### initializeApp()
```javascript
async initializeApp()
```
初始化应用的所有组件和系统。

**返回值**: `Promise<void>`

##### sendMessage(message, adapterId)
```javascript
async sendMessage(message, adapterId = null)
```
发送消息到指定的AI服务。

**参数**:
- `message` (string): 要发送的消息
- `adapterId` (string, 可选): AI服务适配器ID

**返回值**: `Promise<string>` - AI的响应

##### switchAdapter(adapterId)
```javascript
switchAdapter(adapterId)
```
切换当前使用的AI服务适配器。

**参数**:
- `adapterId` (string): 目标适配器ID

##### addMessage(content, sender, timestamp)
```javascript
addMessage(content, sender, timestamp = null)
```
添加消息到对话历史。

**参数**:
- `content` (string): 消息内容
- `sender` (string): 发送者 ('user' | 'ai')
- `timestamp` (Date, 可选): 消息时间戳

## 适配器系统

### BaseAdapter类 (base-adapter.js)

#### 构造函数
```javascript
class BaseAdapter {
    constructor(config = {})
}
```

**参数**:
- `config` (Object): 适配器配置
  - `name` (string): 适配器名称
  - `apiKey` (string): API密钥
  - `baseURL` (string): API基础URL
  - `timeout` (number): 请求超时时间
  - `retryCount` (number): 重试次数

#### 抽象方法

##### doSendMessage(message)
```javascript
async doSendMessage(message)
```
发送消息的具体实现，需要在子类中重写。

**参数**:
- `message` (string): 要发送的消息

**返回值**: `Promise<string>` - AI响应

#### 公共方法

##### sendMessage(message)
```javascript
async sendMessage(message)
```
发送消息的公共接口，包含性能监控和错误处理。

##### isConfigured()
```javascript
isConfigured()
```
检查适配器是否已正确配置。

**返回值**: `boolean`

##### updateConfig(config)
```javascript
updateConfig(config)
```
更新适配器配置。

### 具体适配器实现

#### ChatGPTAdapter
```javascript
class ChatGPTAdapter extends BaseAdapter {
    constructor(config) {
        super({
            name: 'ChatGPT',
            baseURL: 'https://api.openai.com/v1',
            ...config
        });
    }
}
```

#### ClaudeAdapter
```javascript
class ClaudeAdapter extends BaseAdapter {
    constructor(config) {
        super({
            name: 'Claude',
            baseURL: 'https://api.anthropic.com/v1',
            ...config
        });
    }
}
```

### AdapterManager类

#### 构造函数
```javascript
class AdapterManager {
    constructor()
}
```

#### 主要方法

##### registerAdapter(id, adapter)
```javascript
registerAdapter(id, adapter)
```
注册新的适配器。

**参数**:
- `id` (string): 适配器唯一标识
- `adapter` (BaseAdapter): 适配器实例

##### getAdapter(id)
```javascript
getAdapter(id)
```
获取指定的适配器。

**返回值**: `BaseAdapter | null`

##### getAllAdapters()
```javascript
getAllAdapters()
```
获取所有已注册的适配器。

**返回值**: `Map<string, BaseAdapter>`

## 性能监控系统

### PerformanceMonitor类

#### 构造函数
```javascript
class PerformanceMonitor {
    constructor(config = {})
}
```

#### 主要方法

##### startMonitoring()
```javascript
startMonitoring()
```
开始性能监控。

##### stopMonitoring()
```javascript
stopMonitoring()
```
停止性能监控。

##### getPerformanceData()
```javascript
getPerformanceData()
```
获取当前性能数据。

**返回值**: `Object`
```javascript
{
    memory: {
        usedJSHeapSize: number,
        totalJSHeapSize: number,
        jsHeapSizeLimit: number
    },
    network: {
        requests: number,
        errors: number,
        totalTime: number
    },
    ui: {
        longTasks: number,
        interactions: number
    }
}
```

### MemoryOptimizer类

#### 构造函数
```javascript
class MemoryOptimizer {
    constructor(config = {})
}
```

#### 主要方法

##### initialize()
```javascript
initialize()
```
初始化内存优化器。

##### cleanup(level = 'gentle')
```javascript
cleanup(level = 'gentle')
```
执行内存清理。

**参数**:
- `level` (string): 清理级别 ('gentle' | 'moderate' | 'aggressive' | 'emergency')

##### getMemoryStats()
```javascript
getMemoryStats()
```
获取内存使用统计。

## 设置管理系统

### SettingsManager类

#### 构造函数
```javascript
class SettingsManager {
    constructor()
}
```

#### 主要方法

##### getSetting(key)
```javascript
getSetting(key)
```
获取指定设置值。

**参数**:
- `key` (string): 设置键名，支持点号分隔的嵌套路径

**返回值**: `any`

##### setSetting(key, value)
```javascript
setSetting(key, value)
```
设置指定设置值。

**参数**:
- `key` (string): 设置键名
- `value` (any): 设置值

##### getAllSettings()
```javascript
getAllSettings()
```
获取所有设置。

**返回值**: `Object`

##### resetSettings(category = null)
```javascript
resetSettings(category = null)
```
重置设置到默认值。

**参数**:
- `category` (string, 可选): 要重置的设置分类

##### exportSettings()
```javascript
exportSettings()
```
导出设置为JSON字符串。

**返回值**: `string`

##### importSettings(settingsJson)
```javascript
importSettings(settingsJson)
```
从JSON字符串导入设置。

**参数**:
- `settingsJson` (string): 设置的JSON字符串

##### addListener(key, callback)
```javascript
addListener(key, callback)
```
添加设置变化监听器。

**参数**:
- `key` (string): 要监听的设置键名
- `callback` (Function): 回调函数

### SettingsUI类

#### 构造函数
```javascript
class SettingsUI {
    constructor(settingsManager)
}
```

#### 主要方法

##### show()
```javascript
show()
```
显示设置界面。

##### hide()
```javascript
hide()
```
隐藏设置界面。

##### updatePreview()
```javascript
updatePreview()
```
更新设置预览。

## 错误处理系统

### ErrorHandler类

#### 构造函数
```javascript
class ErrorHandler {
    constructor()
}
```

#### 主要方法

##### handleError(error, context = {})
```javascript
handleError(error, context = {})
```
处理错误。

**参数**:
- `error` (Error): 错误对象
- `context` (Object): 错误上下文信息

##### logError(error, context)
```javascript
logError(error, context)
```
记录错误日志。

##### showErrorNotification(error)
```javascript
showErrorNotification(error)
```
显示错误通知。

### NotificationSystem类

#### 构造函数
```javascript
class NotificationSystem {
    constructor(config = {})
}
```

#### 主要方法

##### show(message, type = 'info', duration = 3000)
```javascript
show(message, type = 'info', duration = 3000)
```
显示通知。

**参数**:
- `message` (string): 通知消息
- `type` (string): 通知类型 ('info' | 'success' | 'warning' | 'error')
- `duration` (number): 显示持续时间（毫秒）

## 开发指南

### 环境设置

1. **安装依赖**
```bash
npm install
```

2. **开发模式启动**
```bash
npm start
```

3. **构建应用**
```bash
npm run build
```

### 代码规范

#### JavaScript规范
- 使用ES6+语法
- 使用驼峰命名法
- 类名使用PascalCase
- 常量使用UPPER_SNAKE_CASE
- 使用JSDoc注释

#### 文件组织
- 每个类一个文件
- 文件名使用kebab-case
- 相关功能放在同一目录

#### 错误处理
- 使用try-catch处理异步操作
- 提供有意义的错误消息
- 记录错误日志

### 调试技巧

#### 开发者工具
```javascript
// 打开开发者工具
webContents.openDevTools();
```

#### 日志记录
```javascript
// 使用console.log进行调试
console.log('Debug info:', data);

// 使用ErrorHandler记录错误
errorHandler.logError(error, { context: 'function_name' });
```

#### 性能分析
```javascript
// 使用Performance API
const start = performance.now();
// ... 代码执行
const end = performance.now();
console.log(`执行时间: ${end - start}ms`);
```

## 扩展开发

### 添加新的AI适配器

1. **创建适配器类**
```javascript
class NewAIAdapter extends BaseAdapter {
    constructor(config) {
        super({
            name: 'NewAI',
            baseURL: 'https://api.newai.com/v1',
            ...config
        });
    }

    async doSendMessage(message) {
        // 实现具体的API调用逻辑
        const response = await fetch(`${this.baseURL}/chat`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });
        
        const data = await response.json();
        return data.response;
    }
}
```

2. **注册适配器**
```javascript
// 在app.js中注册
this.adapterManager.registerAdapter('newai', new NewAIAdapter(config));
```

### 添加新的设置分类

1. **更新默认设置**
```javascript
// 在settings-manager.js中添加
this.defaultSettings.newCategory = {
    setting1: 'default_value',
    setting2: true
};
```

2. **更新设置界面**
```javascript
// 在settings-ui.js中添加
this.categories.newCategory = {
    label: '新分类',
    fields: {
        setting1: { type: 'text', label: '设置1' },
        setting2: { type: 'checkbox', label: '设置2' }
    }
};
```

### 添加新的性能监控指标

1. **扩展PerformanceMonitor**
```javascript
class ExtendedPerformanceMonitor extends PerformanceMonitor {
    collectCustomMetrics() {
        // 收集自定义性能指标
        return {
            customMetric: this.calculateCustomMetric()
        };
    }
}
```

### 自定义通知类型

1. **扩展NotificationSystem**
```javascript
// 添加新的通知类型
this.notificationTypes.custom = {
    className: 'notification-custom',
    icon: '🔔',
    defaultDuration: 5000
};
```

### 事件系统扩展

1. **添加自定义事件**
```javascript
// 触发自定义事件
window.dispatchEvent(new CustomEvent('customEvent', {
    detail: { data: 'custom_data' }
}));

// 监听自定义事件
window.addEventListener('customEvent', (event) => {
    console.log('Custom event received:', event.detail);
});
```

## 最佳实践

### 性能优化
- 使用防抖和节流优化频繁操作
- 实现虚拟滚动处理大量数据
- 使用Web Workers处理计算密集型任务
- 合理使用缓存减少重复计算

### 安全考虑
- 验证所有用户输入
- 安全存储敏感信息
- 使用HTTPS进行网络通信
- 实现适当的错误处理

### 可维护性
- 编写清晰的文档和注释
- 使用一致的代码风格
- 实现充分的错误处理
- 编写单元测试

---

**版本**: 1.0.0  
**更新日期**: 2024年9月30日  
**文档维护**: 开发团队