# 多AI集成浏览器 🤖

一个功能强大的桌面应用程序，集成多个主流AI服务，提供统一的对话界面和智能管理功能。

## ✨ 功能特性

### 🤖 多AI服务支持
- **ChatGPT** - OpenAI的GPT模型
- **Claude** - Anthropic的Claude模型  
- **Gemini** - Google的Gemini模型
- **GitHub Copilot** - GitHub的代码助手

### 🚀 核心功能
- 🔄 **智能适配器系统** - 统一的AI服务接口
- 💬 **统一对话界面** - 无缝切换不同AI服务
- ⚡ **性能监控优化** - 实时监控内存、网络和UI性能
- 🎨 **现代化UI设计** - 支持亮色/暗色主题切换
- 🔧 **灵活配置管理** - 完整的设置和偏好管理
- 🛡️ **错误处理系统** - 智能错误处理和用户反馈
- 📊 **资源优化** - 内存管理和资源加载优化
- 🔔 **通知系统** - 实时状态通知和提醒

## 🚀 快速开始

### 环境要求
- Node.js 16.0 或更高版本
- npm 或 yarn 包管理器

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd duochuangkou
```

2. **安装依赖**
```bash
npm install
```

3. **启动应用**
```bash
npm start
```

### 首次配置

1. 启动应用后点击右上角设置按钮
2. 在"AI服务"标签页中配置各服务的API密钥
3. 选择默认使用的AI服务
4. 根据需要调整其他设置选项

## 📁 项目结构

```
duochuangkou/
├── src/
│   ├── main/                   # Electron主进程
│   │   ├── main.js            # 主进程入口
│   │   ├── preload.js         # 预加载脚本
│   │   └── ai-preload.js      # AI服务预加载
│   ├── renderer/              # 渲染进程
│   │   ├── app.js             # 主应用逻辑
│   │   ├── index.html         # 主界面
│   │   ├── error-handler.js   # 错误处理系统
│   │   ├── notification-system.js  # 通知系统
│   │   ├── validation-system.js    # 输入验证系统
│   │   ├── performance-monitor.js  # 性能监控
│   │   ├── memory-optimizer.js     # 内存优化
│   │   ├── resource-optimizer.js   # 资源优化
│   │   ├── settings-manager.js     # 设置管理
│   │   └── settings-ui.js          # 设置界面
│   └── adapters/              # AI服务适配器
│       ├── adapter-manager.js # 适配器管理器
│       ├── base-adapter.js    # 基础适配器类
│       ├── chatgpt-adapter.js # ChatGPT适配器
│       ├── claude-adapter.js  # Claude适配器
│       ├── copilot-adapter.js # GitHub Copilot适配器
│       └── gemini-adapter.js  # Gemini适配器
├── docs/                      # 项目文档
│   ├── development-requirements.md  # 开发需求文档
│   ├── user-manual.md              # 用户使用手册
│   └── api-documentation.md        # API开发者文档
└── package.json               # 项目配置
```

## 📖 文档

- 📋 [开发需求文档](docs/development-requirements.md) - 详细的功能需求和技术规范
- 👥 [用户使用手册](docs/user-manual.md) - 完整的用户操作指南
- 🔧 [API开发者文档](docs/api-documentation.md) - 开发者API参考和扩展指南

## 🛠️ 开发指南

### 开发模式
```bash
npm start          # 启动开发模式
npm run build      # 构建应用
npm test           # 运行测试
```

### 代码规范
- 使用ES6+语法
- 遵循驼峰命名法
- 使用JSDoc注释
- 实现充分的错误处理

### 添加新的AI适配器
1. 继承`BaseAdapter`类
2. 实现`doSendMessage`方法
3. 在`AdapterManager`中注册
4. 更新UI选择器

详细说明请参考[API开发者文档](docs/api-documentation.md#扩展开发)。

## 🔧 配置说明

### API密钥配置
- **ChatGPT**: 需要OpenAI API密钥
- **Claude**: 需要Anthropic API密钥
- **Gemini**: 需要Google AI Studio API密钥
- **GitHub Copilot**: 需要GitHub Copilot订阅

### 性能优化设置
- 内存监控和自动清理
- 网络请求优化
- UI性能监控
- 资源加载优化

## 开发指南

### 添加新的AI服务适配器

1. 在 `src/adapters/` 目录下创建新的适配器文件
2. 继承 `BaseAdapter` 类
3. 实现必要的方法：
   - `initialize()` - 初始化适配器
   - `checkReady()` - 检查页面是否准备就绪
   - `sendMessage(message)` - 发送消息
   - `getResponse()` - 获取响应

### 适配器示例

```javascript
class NewAIAdapter extends BaseAdapter {
    constructor(config) {
        super(config);
        this.selectors = {
            messageInput: 'textarea[placeholder="输入消息"]',
            sendButton: 'button[type="submit"]',
            responseContainer: '.response-container'
        };
    }

    async initialize() {
        // 初始化逻辑
    }

    async sendMessage(message) {
        // 发送消息逻辑
    }

    async getResponse() {
        // 获取响应逻辑
    }
}
```

## 配置说明

应用配置存储在用户数据目录中，包含以下主要配置：

- **aiServices**: AI服务列表配置
- **windowSettings**: 窗口设置
- **userPreferences**: 用户偏好设置

## 安全考虑

- 所有脚本注入都在沙箱环境中执行
- 使用Content Security Policy (CSP) 保护主界面
- 通过preload脚本安全地暴露API
- 不存储用户敏感信息

## 故障排除

### 常见问题

1. **AI服务无法加载**
   - 检查网络连接
   - 确认AI服务网站可正常访问
   - 查看开发者工具中的错误信息

2. **脚本注入失败**
   - 检查适配器选择器是否正确
   - 确认目标网站没有更新UI结构
   - 查看控制台错误日志

3. **窗口管理问题**
   - 重启应用
   - 清除应用数据
   - 检查系统权限设置

## 开发计划

- [x] 基础Electron框架搭建
- [x] 主窗口界面设计
- [x] AI适配器基础架构
- [x] ChatGPT适配器实现
- [ ] Claude适配器实现
- [ ] Gemini适配器实现
- [ ] 统一对话界面
- [ ] 配置管理系统
- [ ] 自动更新功能

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 联系方式

如有问题或建议，请通过以下方式联系：

- 项目Issues: [GitHub Issues](https://github.com/your-repo/issues)
- 邮箱: your-email@example.com

## 致谢

感谢所有为这个项目做出贡献的开发者和用户。