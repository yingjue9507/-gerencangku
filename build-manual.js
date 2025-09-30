const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 开始手动打包多AI浏览器...');

// 创建dist目录
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// 创建应用目录
const appDir = path.join(distDir, '多AI集成浏览器-win32-x64');
if (!fs.existsSync(appDir)) {
  fs.mkdirSync(appDir, { recursive: true });
}

console.log('📁 创建应用目录结构...');

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
copyDir(path.join(__dirname, 'src'), path.join(appDir, 'src'));
fs.copyFileSync(path.join(__dirname, 'package.json'), path.join(appDir, 'package.json'));

// 创建启动脚本
const startScript = `@echo off
title 多AI集成浏览器
echo 正在启动多AI集成浏览器...
node_modules\\.bin\\electron.cmd .
pause`;

fs.writeFileSync(path.join(appDir, '启动.bat'), startScript, 'utf8');

// 创建安装说明
const readme = `# 多AI集成浏览器 v1.0.0

## 安装说明

1. 确保已安装 Node.js (版本 16 或更高)
2. 在此目录下打开命令行
3. 运行: npm install
4. 双击"启动.bat"或运行: npm start

## 功能特性

- 集成多个AI服务 (ChatGPT, Claude, Gemini, Copilot)
- 自定义浏览器界面
- 多窗口管理
- 自动收回弹窗功能

## 技术支持

如有问题，请联系开发团队。

---
构建时间: ${new Date().toLocaleString('zh-CN')}
`;

fs.writeFileSync(path.join(appDir, 'README.md'), readme, 'utf8');

console.log('✅ 手动打包完成！');
console.log(`📦 应用位置: ${appDir}`);
console.log('');
console.log('📋 使用说明:');
console.log('1. 进入应用目录');
console.log('2. 运行: npm install');
console.log('3. 双击"启动.bat"启动应用');