@echo off
title 多AI集成浏览器
echo 正在启动多AI集成浏览器...
echo.
echo 如果这是第一次运行，请先执行：npm install
echo.
node_modules\.bin\electron.cmd .
if errorlevel 1 (
    echo.
    echo 启动失败！请确保已安装依赖：npm install
    pause
) else (
    echo 应用已关闭
)