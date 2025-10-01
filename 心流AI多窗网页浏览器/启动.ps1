# 心流AI多窗网页浏览器 - 应觉出品
# PowerShell启动脚本

Write-Host ""
Write-Host "========================================"
Write-Host "   心流AI多窗网页浏览器 - 应觉出品"
Write-Host "========================================"
Write-Host ""

# 设置控制台编码为UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# 切换到脚本所在目录
Set-Location $PSScriptRoot

Write-Host "🚀 正在启动心流AI多窗网页浏览器..." -ForegroundColor Green
Write-Host ""

try {
    # 启动应用
    npm start
}
catch {
    Write-Host "❌ 启动失败: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "请检查以下事项:" -ForegroundColor Yellow
    Write-Host "1. 确保已安装Node.js" -ForegroundColor Yellow
    Write-Host "2. 确保已安装项目依赖 (运行 npm install)" -ForegroundColor Yellow
    Write-Host "3. 检查网络连接" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host ""
Write-Host "应用已关闭" -ForegroundColor Cyan
Read-Host "按回车键退出"