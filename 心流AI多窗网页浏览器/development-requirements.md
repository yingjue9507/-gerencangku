# 心流AI多窗网页浏览器 - 开发需求文档

## 功能概述
心流AI多窗网页浏览器是一个基于Electron的多窗口AI服务集成浏览器，支持同时访问多个AI服务，提供统一的用户界面和管理功能。

## 已实现功能

### 1. SSL证书错误处理系统
- **功能描述**: 全面的SSL证书错误处理机制，确保AI服务的稳定连接
- **实现位置**: `src/main/error-handler.js`
- **支持的错误类型**:
  - `handshake failed` - SSL握手失败
  - `ssl_client_socket` - SSL客户端套接字错误
  - `certificate verify failed` - 证书验证失败
  - `net_error -101` - 网络连接重置
  - `net_error -113` - 无网络连接
  - `connection_reset` - 连接重置
- **防护级别**: 三层防护机制（主进程、渲染进程、错误处理级别）

### 2. 谷歌登录安全检测优化系统
- **功能描述**: 针对谷歌服务的安全检测优化，解决"此浏览器或应用可能不安全"问题
- **实现位置**: `src/renderer/app.js`
- **核心功能**:
  - **增强webPreferences设置**: 为谷歌服务添加完整的现代浏览器特性标识
  - **优化User-Agent**: 使用完整的Chrome User-Agent字符串，提高浏览器识别度
  - **现代浏览器特性注入**: 通过JavaScript注入模拟真实Chrome浏览器环境
- **注入的浏览器特性**:
  - Chrome运行时API (`chrome.runtime`)
  - Chrome应用API (`chrome.app`)
  - 增强的Navigator对象（插件、语言、连接信息等）
  - 媒体设备API (`navigator.mediaDevices`)
  - 权限API (`navigator.permissions`)
  - WebGL支持检测
  - 语音合成API (`speechSynthesis`)
  - 通知API (`Notification`)
  - 移除Electron/Webview特征标识

#### 注入的浏览器特性列表
- **Chrome API增强**: 完整的chrome对象结构
- **Navigator对象优化**: 真实的浏览器信息
- **插件信息模拟**: PDF查看器等标准插件
- **语言和地区设置**: 中文环境配置
- **连接信息**: 网络状态模拟
- **设备信息**: 内存、CPU核心数等
- **权限API**: 标准浏览器权限接口
- **媒体设备API**: 音视频设备检测
- **WebGL支持**: 图形渲染能力检测
- **屏幕信息**: 显示器配置
- **清理Electron特征**: 移除webview相关属性

### 4.2 高级反检测系统

#### 功能描述
实现深层次的浏览器指纹伪装和webview检测对抗，通过多种技术手段规避谷歌等服务的安全检测机制。

#### 技术实现
- **深层webview伪装**: 伪装window.parent、window.top、window.frameElement等关键属性
- **Canvas指纹伪装**: 为Canvas渲染添加随机偏移，防止指纹识别
- **WebGL指纹伪装**: 伪装GPU厂商和渲染器信息
- **AudioContext指纹伪装**: 为音频上下文添加微小噪声干扰
- **字体检测对抗**: 为字体测量添加随机变化
- **时区和语言固定**: 统一设置为中国时区和中文环境
- **屏幕分辨率伪装**: 模拟常见的显示器配置
- **触摸设备检测对抗**: 移除触摸相关属性
- **API清理**: 移除可能暴露webview的API和事件监听器

#### 伪装的关键属性
- **窗口关系**: window.parent、window.top、window.frameElement
- **文档属性**: document.domain、document.referrer
- **历史记录**: window.history对象
- **消息传递**: window.postMessage方法
- **设备信息**: navigator.maxTouchPoints、navigator.deviceMemory
- **网络状态**: navigator.onLine、navigator.connection
- **时间信息**: Date.prototype.getTimezoneOffset

### 3. 多窗口AI服务管理
- **功能描述**: 支持同时打开和管理多个AI服务窗口
- **支持的AI服务**: ChatGPT、Claude、Gemini、文心一言等
- **布局管理**: 多种窗口布局模式（网格、分屏等）

### 4. 性能优化系统
- **功能描述**: 实时监控和优化应用性能
- **内存管理**: 自动内存清理和警告机制
- **资源优化**: 动态调整轮询频率和资源使用

## 技术架构

### 主要技术栈
- **框架**: Electron
- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **后端**: Node.js
- **构建工具**: npm scripts

### 核心模块
- **主进程**: `src/main/main.js` - 应用主逻辑和窗口管理
- **渲染进程**: `src/renderer/app.js` - 用户界面和AI服务管理
- **错误处理**: `src/main/error-handler.js` - SSL和网络错误处理
- **预加载脚本**: `src/main/preload.js` - 安全的IPC通信

## 安全特性

### SSL证书处理
- 自动处理各种SSL证书错误
- 智能重试机制
- 详细的错误日志记录

### 浏览器安全检测
- 模拟真实Chrome浏览器环境
- 移除自动化工具特征
- 增强浏览器API兼容性

## 开发规范

### 代码结构
- 模块化设计，功能分离
- 统一的错误处理机制
- 详细的日志记录

### 安全要求
- 禁用Node.js集成（除必要情况）
- 启用上下文隔离
- 安全的IPC通信

## 未来规划

### 待开发功能
- 更多AI服务集成
- 用户自定义服务添加
- 高级布局管理
- 数据同步功能

### 性能优化
- 更智能的资源管理
- 缓存优化
- 启动速度优化

---

*文档最后更新: 2025-01-01*