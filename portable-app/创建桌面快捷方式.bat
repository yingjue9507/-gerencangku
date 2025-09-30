@echo off
title 创建桌面快捷方式 - 多AI集成浏览器（便携版）
echo 正在创建桌面快捷方式...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "
$desktop = [Environment]::GetFolderPath('Desktop');
$shortcutPath = Join-Path $desktop '多AI集成浏览器-便携版.lnk';
$target = 'D:\\ai\\duochuangkou\\portable-app\\node_modules\\electron\\dist\\electron.exe';
$workingDir = 'D:\\ai\\duochuangkou\\portable-app';
$icoPath = 'D:\\ai\\duochuangkou\\portable-app\\assets\\icon.ico';
if (Test-Path $icoPath) { $icon = $icoPath + ',0' } else { $icon = 'D:\\ai\\duochuangkou\\portable-app\\node_modules\\electron\\dist\\electron.exe,0' }
$wsh = New-Object -ComObject WScript.Shell;
$sc = $wsh.CreateShortcut($shortcutPath);
$sc.TargetPath = $target;
$sc.WorkingDirectory = $workingDir;
$sc.Arguments = '.';
$sc.IconLocation = $icon;
$sc.WindowStyle = 1;
$sc.Description = '多AI集成浏览器（便携版）';
$sc.Save();
"

if errorlevel 1 (
  echo 创建失败，请尝试以管理员身份运行或检查路径设置。
) else (
  echo 创建完成：%%USERPROFILE%%\Desktop\多AI集成浏览器-便携版.lnk
)
pause