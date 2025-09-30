@echo off
title 多AI集成浏览器 - 安装程序
echo.
echo ========================================
echo    多AI集成浏览器 v1.0.0 安装程序
echo ========================================
echo.

set "INSTALL_DIR=%PROGRAMFILES%\多AI集成浏览器"
set "DESKTOP_SHORTCUT=%USERPROFILE%\Desktop\多AI集成浏览器.lnk"
set "START_MENU_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\多AI集成浏览器"

echo 正在安装到: %INSTALL_DIR%
echo.

REM 创建安装目录
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

REM 复制应用文件
echo 正在复制应用文件...
xcopy /E /I /Y "app\*" "%INSTALL_DIR%\"

REM 安装Node.js依赖
echo.
echo 正在安装应用依赖...
cd /d "%INSTALL_DIR%"
call npm install --production --silent

REM 下载并安装Electron
echo 正在安装Electron运行时...
call npm install electron@27.3.11 --save-dev --silent

REM 创建启动脚本
echo @echo off > "%INSTALL_DIR%\启动多AI浏览器.bat"
echo title 多AI集成浏览器 >> "%INSTALL_DIR%\启动多AI浏览器.bat"
echo cd /d "%%~dp0" >> "%INSTALL_DIR%\启动多AI浏览器.bat"
echo node_modules\.bin\electron.cmd . >> "%INSTALL_DIR%\启动多AI浏览器.bat"

REM 创建桌面快捷方式
echo 正在创建桌面快捷方式...
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%DESKTOP_SHORTCUT%'); $Shortcut.TargetPath = '%INSTALL_DIR%\启动多AI浏览器.bat'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.IconLocation = '%INSTALL_DIR%\icon.svg'; $Shortcut.Save()"

REM 创建开始菜单快捷方式
echo 正在创建开始菜单快捷方式...
if not exist "%START_MENU_DIR%" mkdir "%START_MENU_DIR%"
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%START_MENU_DIR%\多AI集成浏览器.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\启动多AI浏览器.bat'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.IconLocation = '%INSTALL_DIR%\icon.svg'; $Shortcut.Save()"

REM 创建卸载脚本
echo @echo off > "%INSTALL_DIR%\卸载.bat"
echo title 卸载多AI集成浏览器 >> "%INSTALL_DIR%\卸载.bat"
echo echo 正在卸载多AI集成浏览器... >> "%INSTALL_DIR%\卸载.bat"
echo del /f /q "%DESKTOP_SHORTCUT%" 2^>nul >> "%INSTALL_DIR%\卸载.bat"
echo rmdir /s /q "%START_MENU_DIR%" 2^>nul >> "%INSTALL_DIR%\卸载.bat"
echo cd /d "%PROGRAMFILES%" >> "%INSTALL_DIR%\卸载.bat"
echo rmdir /s /q "%INSTALL_DIR%" >> "%INSTALL_DIR%\卸载.bat"
echo echo 卸载完成！ >> "%INSTALL_DIR%\卸载.bat"
echo pause >> "%INSTALL_DIR%\卸载.bat"

REM 创建卸载快捷方式
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%START_MENU_DIR%\卸载多AI集成浏览器.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\卸载.bat'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.Save()"

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
start "" "%INSTALL_DIR%\启动多AI浏览器.bat"
:end
pause