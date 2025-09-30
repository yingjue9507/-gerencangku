const fs = require('fs');
const path = require('path');

console.log('🚀 创建便携版多AI浏览器...');

// 创建便携版目录
const portableDir = path.join(__dirname, 'portable-app');
if (fs.existsSync(portableDir)) {
  fs.rmSync(portableDir, { recursive: true, force: true });
}
fs.mkdirSync(portableDir, { recursive: true });

console.log('📁 创建目录结构...');

// 复制源代码
const copyDir = (src, dest) => {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const files = fs.readdirSync(src);
  files.forEach(file => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
};

// 复制必要文件
console.log('📋 复制应用文件...');
copyDir(path.join(__dirname, 'src'), path.join(portableDir, 'src'));

// 创建简化的package.json
const packageJson = {
  "name": "multi-ai-browser-portable",
  "version": "1.0.0",
  "description": "多AI集成浏览器 - 便携版",
  "main": "src/main/main.js",
  "scripts": {
    "start": "electron ."
  },
  "dependencies": {
    "electron-store": "^8.1.0"
  },
  "devDependencies": {
    "electron": "^27.3.11"
  }
};

fs.writeFileSync(
  path.join(portableDir, 'package.json'), 
  JSON.stringify(packageJson, null, 2), 
  'utf8'
);

// 创建启动脚本
const startBat = `@echo off
title 多AI集成浏览器
echo 正在启动多AI集成浏览器...
echo.
echo 如果这是第一次运行，请先执行：npm install
echo.
node_modules\\.bin\\electron.cmd .
if errorlevel 1 (
    echo.
    echo 启动失败！请确保已安装依赖：npm install
    pause
) else (
    echo 应用已关闭
)`;

fs.writeFileSync(path.join(portableDir, '启动.bat'), startBat, 'utf8');

// 创建安装脚本
const installBat = `@echo off
title 安装依赖
echo 正在安装应用依赖...
npm install
if errorlevel 1 (
    echo 安装失败！请检查网络连接和Node.js环境
) else (
    echo 依赖安装完成！现在可以运行"启动.bat"
)
pause`;

fs.writeFileSync(path.join(portableDir, '安装依赖.bat'), installBat, 'utf8');

// 创建说明文件
const readme = `# 多AI集成浏览器 - 便携版 v1.0.0

## 快速开始

1. **首次使用**：
   - 双击 "安装依赖.bat" 安装必要组件
   - 等待安装完成

2. **启动应用**：
   - 双击 "启动.bat" 启动应用

## 系统要求

- Windows 10/11 (64位)
- Node.js 16+ (如果未安装，请从 https://nodejs.org 下载)
- 网络连接

## 功能特性

- 🤖 多AI服务集成 (ChatGPT, Claude, Gemini, Copilot)
- 🖥️ 自定义浏览器界面
- 🪟 多窗口管理
- 🔄 自动收回弹窗功能

## 故障排除

### 应用无法启动
1. 确保已运行"安装依赖.bat"
2. 检查Node.js是否正确安装
3. 尝试以管理员身份运行

### 安装依赖失败
1. 检查网络连接
2. 尝试使用管理员权限运行
3. 手动运行：npm install

---
构建时间: ${new Date().toLocaleString('zh-CN')}
版本: v1.0.0 便携版
`;

fs.writeFileSync(path.join(portableDir, 'README.md'), readme, 'utf8');

console.log('✅ 便携版创建完成！');
console.log(`📦 位置: ${portableDir}`);
console.log('');
console.log('📋 使用说明:');
console.log('1. 进入 portable-app 目录');
console.log('2. 双击"安装依赖.bat"');
console.log('3. 双击"启动.bat"启动应用');