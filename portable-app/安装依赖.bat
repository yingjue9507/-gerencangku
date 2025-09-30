@echo off
title 安装依赖
echo 正在安装应用依赖...
npm install
if errorlevel 1 (
    echo 安装失败！请检查网络连接和Node.js环境
) else (
    echo 依赖安装完成！现在可以运行"启动.bat"
)
pause