@echo off
title Quant Backtest Pro - Universal Launcher
echo ===================================================================
echo   QUANT BACKTEST PRO - FULL STACK LIVE TRADING ENVIRONMENT
echo ===================================================================
echo.

cd /d "%~dp0"

echo [1/3] Starting MT5 Universal Micro-Gateway (Port 8765)...
start "QuantPro MT5 Gateway" cmd /k "cd mt5_gateway && start_gateway.bat"

echo [2/3] Starting Backend API Server (Port 3001)...
start "QuantPro Backend API" cmd /k "npm run server:start"

echo [3/3] Starting Frontend Terminal (Port 5173)...
start "QuantPro Web Terminal" cmd /k "npm run dev"

echo.
echo ===================================================================
echo   ALL SERVICES LAUNCHED SUCCESSFULLY!
echo   - Web Terminal:    http://localhost:5173
echo   - MT5 Gateway:     http://localhost:8765/docs
echo   - Backend Server:  http://localhost:3001
echo ===================================================================
echo.
timeout /t 3 >nul
start http://localhost:5173
