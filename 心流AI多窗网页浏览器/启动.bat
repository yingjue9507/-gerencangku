@echo off
chcp 65001 >nul 2>&1
title AI Browser - Startup

echo.
echo ========================================
echo    AI Browser - Starting Application
echo ========================================
echo.

echo Starting AI Browser...
echo Note: Console output will be in UTF-8 encoding
echo.

cd /d "%~dp0"
npm start

echo.
echo Application closed
pause