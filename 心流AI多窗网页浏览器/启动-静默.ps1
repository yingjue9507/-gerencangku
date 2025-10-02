# AI Browser 静默启动脚本
# 此脚本将在后台启动应用，不显示任何命令行窗口

# 设置工作目录
Set-Location -Path $PSScriptRoot

# 显示启动提示（可选）
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.MessageBox]::Show("AI Browser 正在启动中...", "启动提示", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information)

# 使用Start-Process在后台启动npm
try {
    $process = Start-Process -FilePath "npm" -ArgumentList "start" -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -PassThru
    
    # 等待一小段时间确保启动成功
    Start-Sleep -Seconds 3
    
    if ($process -and !$process.HasExited) {
        # 可选：显示启动成功消息
        # [System.Windows.Forms.MessageBox]::Show("AI Browser 启动成功！", "启动完成", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information)
    }
} catch {
    [System.Windows.Forms.MessageBox]::Show("启动失败: $($_.Exception.Message)", "错误", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Error)
}