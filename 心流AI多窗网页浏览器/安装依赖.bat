@echo off
title AI Browser - Install Dependencies

echo.
echo ========================================
echo    AI Browser - Install Dependencies
echo ========================================
echo.

echo Checking Node.js environment...
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js not found
    echo Please install Node.js: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo Node.js environment OK
echo Current Node.js version:
node --version

echo.
echo Installing project dependencies...
echo This may take a few minutes, please wait...
echo.

npm install

if errorlevel 1 (
    echo.
    echo Installation failed, trying with China mirror...
    echo Setting npm registry...
    npm config set registry https://registry.npmmirror.com/
    echo.
    echo Reinstalling dependencies...
    npm install
    
    if errorlevel 1 (
        echo Installation still failed
        echo Please check network connection or run manually: npm install
        echo.
        pause
        exit /b 1
    )
)

echo.
echo Dependencies installed successfully!
echo Now you can run "startup.bat" to start the application
echo.
pause