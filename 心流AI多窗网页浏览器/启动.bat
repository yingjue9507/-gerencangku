@echo off
chcp 65001 >nul 2>&1

cd /d "%~dp0"

REM 使用VBS脚本实现完全静默启动
echo Set objShell = CreateObject("WScript.Shell") > "%temp%\silent_start.vbs"
echo objShell.CurrentDirectory = "%~dp0" >> "%temp%\silent_start.vbs"
echo objShell.Run "cmd /c npm start", 0, False >> "%temp%\silent_start.vbs"

REM 执行VBS脚本并立即退出
cscript //nologo "%temp%\silent_start.vbs"

REM 清理临时文件
del "%temp%\silent_start.vbs" >nul 2>&1

REM 立即退出，不显示任何信息
exit