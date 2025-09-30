const fs = require('fs');
const path = require('path');

console.log('🚀 创建多AI集成浏览器安装包...');

// 创建安装包目录
const installerDir = path.join(__dirname, 'installer-package');
if (fs.existsSync(installerDir)) {
  fs.rmSync(installerDir, { recursive: true, force: true });
}
fs.mkdirSync(installerDir, { recursive: true });

console.log('📁 创建安装包结构...');

// 复制应用文件
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

// 复制应用源代码
console.log('📋 复制应用文件...');
const appDir = path.join(installerDir, 'app');
fs.mkdirSync(appDir, { recursive: true });

// 检查源目录是否存在
const srcDir = path.join(__dirname, 'src');
if (fs.existsSync(srcDir)) {
  copyDir(srcDir, path.join(appDir, 'src'));
  console.log('✅ 应用文件复制完成');
} else {
  console.log('❌ 源目录不存在:', srcDir);
}

// 创建应用的package.json
const appPackageJson = {
  "name": "multi-ai-browser-installed",
  "version": "1.0.0",
  "description": "多AI集成浏览器",
  "main": "src/main/main.js",
  "scripts": {
    "start": "electron ."
  },
  "dependencies": {
    "electron-store": "^8.1.0"
  }
};

try {
  fs.writeFileSync(
    path.join(installerDir, 'app', 'package.json'), 
    JSON.stringify(appPackageJson, null, 2), 
    'utf8'
  );
  console.log('✅ package.json 创建完成');
} catch (error) {
  console.log('❌ package.json 创建失败:', error.message);
}

// 复制图标
try {
  fs.copyFileSync(
    path.join(__dirname, 'build', 'icon.svg'),
    path.join(installerDir, 'app', 'icon.svg')
  );
  console.log('✅ 图标复制完成');
} catch (error) {
  console.log('❌ 图标复制失败:', error.message);
}

// 创建安装脚本
const installScript = `@echo off
title 多AI集成浏览器 - 安装程序
echo.
echo ========================================
echo    多AI集成浏览器 v1.0.0 安装程序
echo ========================================
echo.

set "INSTALL_DIR=%PROGRAMFILES%\\多AI集成浏览器"
set "DESKTOP_SHORTCUT=%USERPROFILE%\\Desktop\\多AI集成浏览器.lnk"
set "START_MENU_DIR=%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\多AI集成浏览器"

echo 正在安装到: %INSTALL_DIR%
echo.

REM 创建安装目录
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

REM 复制应用文件
echo 正在复制应用文件...
xcopy /E /I /Y "app\\*" "%INSTALL_DIR%\\"

REM 安装Node.js依赖
echo.
echo 正在安装应用依赖...
cd /d "%INSTALL_DIR%"
call npm install --production --silent

REM 下载并安装Electron
echo 正在安装Electron运行时...
call npm install electron@27.3.11 --save-dev --silent

REM 创建启动脚本
echo @echo off > "%INSTALL_DIR%\\启动多AI浏览器.bat"
echo title 多AI集成浏览器 >> "%INSTALL_DIR%\\启动多AI浏览器.bat"
echo cd /d "%%~dp0" >> "%INSTALL_DIR%\\启动多AI浏览器.bat"
echo node_modules\\.bin\\electron.cmd . >> "%INSTALL_DIR%\\启动多AI浏览器.bat"

REM 创建桌面快捷方式
echo 正在创建桌面快捷方式...
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%DESKTOP_SHORTCUT%'); $Shortcut.TargetPath = '%INSTALL_DIR%\\启动多AI浏览器.bat'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.IconLocation = '%INSTALL_DIR%\\icon.svg'; $Shortcut.Save()"

REM 创建开始菜单快捷方式
echo 正在创建开始菜单快捷方式...
if not exist "%START_MENU_DIR%" mkdir "%START_MENU_DIR%"
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%START_MENU_DIR%\\多AI集成浏览器.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\\启动多AI浏览器.bat'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.IconLocation = '%INSTALL_DIR%\\icon.svg'; $Shortcut.Save()"

REM 创建卸载脚本
echo @echo off > "%INSTALL_DIR%\\卸载.bat"
echo title 卸载多AI集成浏览器 >> "%INSTALL_DIR%\\卸载.bat"
echo echo 正在卸载多AI集成浏览器... >> "%INSTALL_DIR%\\卸载.bat"
echo del /f /q "%DESKTOP_SHORTCUT%" 2^>nul >> "%INSTALL_DIR%\\卸载.bat"
echo rmdir /s /q "%START_MENU_DIR%" 2^>nul >> "%INSTALL_DIR%\\卸载.bat"
echo cd /d "%PROGRAMFILES%" >> "%INSTALL_DIR%\\卸载.bat"
echo rmdir /s /q "%INSTALL_DIR%" >> "%INSTALL_DIR%\\卸载.bat"
echo echo 卸载完成！ >> "%INSTALL_DIR%\\卸载.bat"
echo pause >> "%INSTALL_DIR%\\卸载.bat"

REM 创建卸载快捷方式
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%START_MENU_DIR%\\卸载多AI集成浏览器.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\\卸载.bat'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.Save()"

echo.
echo ========================================
echo          安装完成！
echo ========================================
echo.
echo 桌面快捷方式: 多AI集成浏览器
echo 开始菜单: 多AI集成浏览器
echo 安装位置: %INSTALL_DIR%
echo.
echo 是否立即启动应用？
choice /c YN /m "按 Y 启动，按 N 退出"
if errorlevel 2 goto :end
start "" "%INSTALL_DIR%\\启动多AI浏览器.bat"
:end
pause`;

fs.writeFileSync(path.join(installerDir, '安装.bat'), installScript, 'utf8');

// 创建说明文件
const readme = `# 多AI集成浏览器 - 安装包 v1.0.0

## 🎯 真正的Windows安装包

这是一个真正的Windows安装包，安装后会：
✅ 在桌面创建快捷方式
✅ 在开始菜单创建程序组
✅ 安装到Program Files目录
✅ 提供完整的卸载功能

## 🚀 安装步骤

1. **以管理员身份运行**：右键点击"安装.bat" → "以管理员身份运行"
2. **等待安装完成**：安装程序会自动下载依赖和Electron运行时
3. **启动应用**：安装完成后可选择立即启动

## 📍 安装位置

- **程序文件**: C:\\Program Files\\多AI集成浏览器\\
- **桌面快捷方式**: 多AI集成浏览器.lnk
- **开始菜单**: 多AI集成浏览器文件夹

## 🗑️ 卸载方法

1. **开始菜单卸载**: 开始菜单 → 多AI集成浏览器 → 卸载多AI集成浏览器
2. **程序目录卸载**: 运行安装目录下的"卸载.bat"

## ⚡ 功能特性

- 🤖 多AI服务集成 (ChatGPT, Claude, Gemini, Copilot)
- 🖥️ 自定义浏览器界面
- 🪟 多窗口管理
- 🔄 自动收回弹窗功能

## 🔧 系统要求

- Windows 10/11 (64位)
- 管理员权限（仅安装时需要）
- 网络连接（下载依赖）
- 4GB+ 内存推荐

## 📞 技术支持

如果安装过程中遇到问题：
1. 确保以管理员身份运行安装程序
2. 检查网络连接
3. 确保有足够的磁盘空间（约200MB）

---
构建时间: ${new Date().toLocaleString('zh-CN')}
版本: v1.0.0 安装版
`;

fs.writeFileSync(path.join(installerDir, 'README.md'), readme, 'utf8');

console.log('✅ 安装包创建完成！');
console.log(`📦 位置: ${installerDir}`);
console.log('');
console.log('📋 使用说明:');
console.log('1. 进入 installer-package 目录');
console.log('2. 右键"安装.bat" → "以管理员身份运行"');
console.log('3. 按照提示完成安装');
console.log('4. 在桌面或开始菜单找到"多AI集成浏览器"');