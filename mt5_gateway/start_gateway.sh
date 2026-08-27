#!/bin/bash
echo "==================================================================="
echo "  QUANT BACKTEST PRO - MT5 UNIVERSAL MICRO-GATEWAY"
echo "==================================================================="

cd "$(dirname "$0")"

if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python 3 is not installed."
    exit 1
fi

if [ ! -d "venv" ]; then
    echo "[INFO] Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt

echo "[SUCCESS] Starting MT5 Gateway on port 8765..."
python app.py
