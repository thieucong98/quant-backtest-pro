@echo off
title Quant Backtest Pro - MT5 Universal Micro-Gateway
echo ===================================================================
echo   QUANT BACKTEST PRO - MT5 UNIVERSAL MICRO-GATEWAY
echo ===================================================================
echo.

cd /d "%~dp0"

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH. Please install Python 3.9+.
    pause
    exit /b 1
)

if not exist "venv" (
    echo [INFO] Creating Python virtual environment...
    python -m venv venv
)

echo [INFO] Activating virtual environment...
call venv\Scripts\activate.bat

echo [INFO] Installing/Updating dependencies...
pip install -r requirements.txt

echo.
echo [SUCCESS] Starting MT5 Gateway on port 8765...
echo Access Swagger Docs at: http://localhost:8765/docs
echo.

python app.py
pause
