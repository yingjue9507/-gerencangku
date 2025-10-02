@echo off
chcp 65001 >nul 2>&1

echo Starting AI Browser in background...

cd /d "%~dp0"

REM 使用start命令在新窗口中启动应用，然后当前窗口自动关闭
start "AI Browser" /min cmd /c "npm start"

REM 等待2秒确保应用开始启动
timeout /t 2 /nobreak >nul

echo AI Browser is starting...
echo This window will close automatically.

REM 自动关闭当前cmd窗口
exit