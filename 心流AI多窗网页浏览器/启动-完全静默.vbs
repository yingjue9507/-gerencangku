' AI Browser 完全静默启动脚本
' 此脚本将完全在后台启动应用，不显示任何窗口

Dim objShell, objFSO, strScriptPath, strWorkingDir

' 创建Shell对象
Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

' 获取脚本所在目录
strScriptPath = WScript.ScriptFullName
strWorkingDir = objFSO.GetParentFolderName(strScriptPath)

' 切换到应用目录
objShell.CurrentDirectory = strWorkingDir

' 在后台启动npm start，完全隐藏窗口
' 参数说明：
' 第一个参数：要执行的命令
' 第二个参数：窗口样式 (0 = 隐藏窗口)
' 第三个参数：是否等待命令完成 (False = 不等待)
objShell.Run "cmd /c npm start", 0, False

' 清理对象
Set objShell = Nothing
Set objFSO = Nothing