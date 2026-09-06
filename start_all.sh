#!/usr/bin/env bash
# ===================================================================
#   QUANT BACKTEST PRO - FULL STACK LIVE TRADING LAUNCHER (POSIX)
# ===================================================================

set -e

# Colors for terminal output
BOLD='\033[1m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Ensure we are running in the project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${BOLD}${CYAN}===================================================================${NC}"
echo -e "${BOLD}${CYAN}  QUANT BACKTEST PRO - FULL STACK LIVE TRADING ENVIRONMENT${NC}"
echo -e "${BOLD}${CYAN}===================================================================${NC}"
echo ""

# Cleanup trap to gracefully kill all background child processes on exit/interrupt
cleanup() {
  echo ""
  echo -e "${BOLD}${YELLOW}===================================================================${NC}"
  echo -e "${BOLD}${YELLOW}  Shutting down all Quant Backtest Pro background services...${NC}"
  echo -e "${BOLD}${YELLOW}===================================================================${NC}"
  # Terminate all processes in the current process group
  trap - EXIT SIGINT SIGTERM
  kill 0 2>/dev/null || true
  exit 0
}

trap cleanup EXIT SIGINT SIGTERM

# Check for Node.js
if ! command -v node >/dev/null 2>&1; then
  echo -e "${YELLOW}[WARNING] Node.js is not found in PATH. Please install Node.js 18+.${NC}"
  exit 1
fi

# 1. Start MT5 Universal Micro-Gateway (Port 8765) if python3/python is available
if [ -d "mt5_gateway" ]; then
  echo -e "${MAGENTA}[1/3] Starting MT5 Universal Micro-Gateway (Port 8765)...${NC}"
  (
    cd mt5_gateway
    if [ -f "start_gateway.sh" ]; then
      bash start_gateway.sh
    elif command -v python3 >/dev/null 2>&1; then
      python3 app.py
    elif command -v python >/dev/null 2>&1; then
      python app.py
    fi
  ) >/dev/null 2>&1 &
  MT5_PID=$!
else
  echo -e "${YELLOW}[INFO] mt5_gateway directory not found. Skipping MT5 Gateway.${NC}"
fi

# 2. Start Backend API Server (Port 3001)
echo -e "${MAGENTA}[2/3] Starting Backend API Server (Port 3001)...${NC}"
npm run server:start &
BACKEND_PID=$!

# 3. Start Frontend Terminal (Port 5173)
echo -e "${CYAN}[3/3] Starting Frontend Web Terminal (Port 5173)...${NC}"
npm run dev &
FRONTEND_PID=$!

echo ""
echo -e "${BOLD}${GREEN}===================================================================${NC}"
echo -e "${BOLD}${GREEN}  ALL SERVICES LAUNCHED SUCCESSFULLY!${NC}"
echo -e "  - Web Terminal:    ${CYAN}http://localhost:5173${NC}"
echo -e "  - MT5 Gateway:     ${MAGENTA}http://localhost:8765/docs${NC}"
echo -e "  - Backend Server:  ${GREEN}http://localhost:3001${NC}"
echo -e "  ${YELLOW}(Press Ctrl + C anytime to stop all services)${NC}"
echo -e "${BOLD}${GREEN}===================================================================${NC}"
echo ""

# Try opening the default browser after a brief delay
(
  sleep 2.5
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "http://localhost:5173" >/dev/null 2>&1 || true
  elif command -v open >/dev/null 2>&1; then
    open "http://localhost:5173" >/dev/null 2>&1 || true
  elif command -v powershell.exe >/dev/null 2>&1; then
    powershell.exe -Command "Start-Process 'http://localhost:5173'" >/dev/null 2>&1 || true
  elif command -v cmd.exe >/dev/null 2>&1; then
    cmd.exe /c start "http://localhost:5173" >/dev/null 2>&1 || true
  fi
) &

# Wait for all background jobs to keep the script running
wait
