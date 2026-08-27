"""
Quant Backtest Pro - MT5 Universal Micro-Gateway
High-Performance Python FastAPI Bridge for MetaTrader 5 (Exness, XTB, & Any Broker)
"""

import sys
import os

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

import time
import asyncio
import logging
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("MT5Gateway")

# Try to import native MetaTrader5
HAS_MT5_NATIVE = False
mt5 = None

if sys.platform == "win32":
    try:
        import MetaTrader5 as native_mt5
        mt5 = native_mt5
        HAS_MT5_NATIVE = True
        logger.info("✅ Native MetaTrader5 Python package successfully loaded.")
    except ImportError:
        logger.warning("⚠️ MetaTrader5 module not installed. Running in Mock/Simulation mode.")
else:
    logger.info(f"ℹ️ Platform is {sys.platform}. Running in Mock/Simulation mode.")


TIMEFRAME_MAP = {
    "M1": 1,      # mt5.TIMEFRAME_M1
    "M5": 5,      # mt5.TIMEFRAME_M5
    "M15": 15,    # mt5.TIMEFRAME_M15
    "M30": 30,    # mt5.TIMEFRAME_M30
    "H1": 16385,  # mt5.TIMEFRAME_H1
    "H4": 16388,  # mt5.TIMEFRAME_H4
    "D1": 16408,  # mt5.TIMEFRAME_D1
}

TIMEFRAME_SECONDS = {
    "M1": 60,
    "M5": 300,
    "M15": 900,
    "M30": 1800,
    "H1": 3600,
    "H4": 14400,
    "D1": 86400,
}

# ==============================================================================
# MOCK MT5 ENGINE (Fallback for Development / Testing / Non-Windows)
# ==============================================================================
class MockMT5Engine:
    def __init__(self):
        self.connected = False
        self.account_info = {
            "login": 84920184,
            "trade_mode": 0,  # 0: Demo, 1: Contest, 2: Real
            "leverage": 500,
            "limit_orders": 200,
            "margin_so_mode": 0,
            "trade_allowed": True,
            "trade_expert": True,
            "margin_mode": 2,  # Hedging
            "currency_digits": 2,
            "balance": 10000.0,
            "credit": 0.0,
            "profit": 0.0,
            "equity": 10000.0,
            "margin": 0.0,
            "margin_free": 10000.0,
            "margin_level": 0.0,
            "margin_so_call": 60.0,
            "margin_so_so": 0.0,
            "server": "Exness-MT5Real",
            "currency": "USD",
            "company": "Exness Technologies Ltd",
            "name": "Quant Pro Trader"
        }
        self.positions: Dict[int, Dict[str, Any]] = {}
        self.orders: Dict[int, Dict[str, Any]] = {}
        self.history_deals: List[Dict[str, Any]] = []
        self.ticket_seq = 982001
        self.symbols = {
            "XAUUSD": {"symbol": "XAUUSD", "description": "Gold vs US Dollar", "category": "METALS", "bid": 2724.50, "ask": 2724.62, "digits": 2, "point": 0.01, "spread": 12, "min_lot": 0.01, "max_lot": 100.0, "step": 0.01, "contract_size": 100, "change24h": 0.85},
            "XAGUSD": {"symbol": "XAGUSD", "description": "Silver vs US Dollar", "category": "METALS", "bid": 31.85, "ask": 31.87, "digits": 3, "point": 0.001, "spread": 20, "min_lot": 0.01, "max_lot": 50.0, "step": 0.01, "contract_size": 5000, "change24h": -0.42},
            "EURUSD": {"symbol": "EURUSD", "description": "Euro vs US Dollar", "category": "FOREX", "bid": 1.08350, "ask": 1.08362, "digits": 5, "point": 0.00001, "spread": 12, "min_lot": 0.01, "max_lot": 200.0, "step": 0.01, "contract_size": 100000, "change24h": 0.18},
            "GBPUSD": {"symbol": "GBPUSD", "description": "Great Britain Pound vs US Dollar", "category": "FOREX", "bid": 1.29420, "ask": 1.29435, "digits": 5, "point": 0.00001, "spread": 15, "min_lot": 0.01, "max_lot": 200.0, "step": 0.01, "contract_size": 100000, "change24h": -0.12},
            "USDJPY": {"symbol": "USDJPY", "description": "US Dollar vs Japanese Yen", "category": "FOREX", "bid": 153.450, "ask": 153.465, "digits": 3, "point": 0.001, "spread": 15, "min_lot": 0.01, "max_lot": 200.0, "step": 0.01, "contract_size": 100000, "change24h": 0.45},
            "AUDUSD": {"symbol": "AUDUSD", "description": "Australian Dollar vs US Dollar", "category": "FOREX", "bid": 0.65420, "ask": 0.65434, "digits": 5, "point": 0.00001, "spread": 14, "min_lot": 0.01, "max_lot": 200.0, "step": 0.01, "contract_size": 100000, "change24h": 0.08},
            "USDCAD": {"symbol": "USDCAD", "description": "US Dollar vs Canadian Dollar", "category": "FOREX", "bid": 1.38520, "ask": 1.38538, "digits": 5, "point": 0.00001, "spread": 18, "min_lot": 0.01, "max_lot": 200.0, "step": 0.01, "contract_size": 100000, "change24h": -0.22},
            "BTCUSD": {"symbol": "BTCUSD", "description": "Bitcoin vs US Dollar", "category": "CRYPTO", "bid": 94250.0, "ask": 94265.0, "digits": 2, "point": 0.01, "spread": 1500, "min_lot": 0.01, "max_lot": 50.0, "step": 0.01, "contract_size": 1, "change24h": 3.45},
            "ETHUSD": {"symbol": "ETHUSD", "description": "Ethereum vs US Dollar", "category": "CRYPTO", "bid": 2785.50, "ask": 2786.20, "digits": 2, "point": 0.01, "spread": 70, "min_lot": 0.01, "max_lot": 100.0, "step": 0.01, "contract_size": 1, "change24h": 2.15},
            "SOLUSD": {"symbol": "SOLUSD", "description": "Solana vs US Dollar", "category": "CRYPTO", "bid": 188.40, "ask": 188.55, "digits": 2, "point": 0.01, "spread": 15, "min_lot": 0.1, "max_lot": 500.0, "step": 0.1, "contract_size": 1, "change24h": 5.80},
            "US30": {"symbol": "US30", "description": "Wall Street 30 (Dow Jones)", "category": "INDICES", "bid": 43850.0, "ask": 43852.5, "digits": 1, "point": 0.1, "spread": 25, "min_lot": 0.1, "max_lot": 100.0, "step": 0.1, "contract_size": 1, "change24h": 0.65},
            "NAS100": {"symbol": "NAS100", "description": "US Tech 100 (Nasdaq)", "category": "INDICES", "bid": 21120.0, "ask": 21121.8, "digits": 1, "point": 0.1, "spread": 18, "min_lot": 0.1, "max_lot": 100.0, "step": 0.1, "contract_size": 1, "change24h": 1.12},
            "USOIL": {"symbol": "USOIL", "description": "Crude Oil WTI", "category": "COMMODITIES", "bid": 72.40, "ask": 72.43, "digits": 2, "point": 0.01, "spread": 3, "min_lot": 0.01, "max_lot": 100.0, "step": 0.01, "contract_size": 1000, "change24h": -1.45},
        }

    def get_candles(self, symbol: str, timeframe: str = "M5", count: int = 500) -> List[Dict[str, Any]]:
        sym = self.symbols.get(symbol, self.symbols["XAUUSD"])
        current_price = sym["bid"]
        digits = sym["digits"]
        tf_secs = TIMEFRAME_SECONDS.get(timeframe, 300)
        
        # Volatility percentage per bar based on asset
        volatility = 0.0012 if sym["category"] == "FOREX" else 0.0025 if sym["category"] == "METALS" else 0.0050
        
        now = int(time.time())
        # Align now to timeframe interval
        current_bar_time = (now // tf_secs) * tf_secs
        
        candles = []
        # Walk backwards from current price
        prices = [current_price]
        import math
        import random
        
        # Deterministic seed based on symbol name for stable chart
        rng = random.Random(42 + sum(ord(c) for c in symbol))
        
        for _ in range(count):
            change = prices[-1] * volatility * (rng.random() - 0.495)
            prices.append(prices[-1] - change)
            
        prices.reverse()
        
        for i in range(count):
            bar_time = (current_bar_time - (count - 1 - i) * tf_secs) * 1000
            o = round(prices[i], digits)
            c = round(prices[i+1] if i + 1 < len(prices) else current_price, digits)
            hl_range = max(0.0001, abs(c - o) * (1.2 + rng.random() * 0.8))
            h = round(max(o, c) + hl_range * rng.random() * 0.6, digits)
            l = round(min(o, c) - hl_range * rng.random() * 0.6, digits)
            vol = round(10 + rng.random() * 90, 1)
            candles.append({
                "timestamp": bar_time,
                "open": o,
                "high": h,
                "low": l,
                "close": c,
                "volume": vol
            })
            
        return candles

    def get_all_symbols(self) -> List[Dict[str, Any]]:
        return list(self.symbols.values())

    def connect(self, account: Optional[int] = None, password: Optional[str] = None, server: Optional[str] = None) -> bool:
        self.connected = True
        if account:
            self.account_info["login"] = account
        if server:
            self.account_info["server"] = server
        logger.info(f"Mock MT5 Connected to {self.account_info['server']} account #{self.account_info['login']}")
        return True

    def disconnect(self):
        self.connected = False
        logger.info("Mock MT5 Disconnected.")

    def get_account(self) -> Dict[str, Any]:
        # Recalculate floating profit & equity
        total_floating = sum(p.get("profit", 0.0) for p in self.positions.values())
        total_margin = sum(p.get("margin", 0.0) for p in self.positions.values())
        self.account_info["profit"] = round(total_floating, 2)
        self.account_info["equity"] = round(self.account_info["balance"] + total_floating, 2)
        self.account_info["margin"] = round(total_margin, 2)
        self.account_info["margin_free"] = round(max(0, self.account_info["equity"] - total_margin), 2)
        if total_margin > 0:
            self.account_info["margin_level"] = round((self.account_info["equity"] / total_margin) * 100, 2)
        else:
            self.account_info["margin_level"] = 0.0
        return self.account_info

    def order_send(self, req: Dict[str, Any]) -> Dict[str, Any]:
        self.ticket_seq += 1
        ticket = self.ticket_seq
        symbol = req.get("symbol", "XAUUSD")
        side = req.get("side", "BUY").upper()
        volume = float(req.get("volume", 0.1))
        sl = float(req.get("sl", 0)) if req.get("sl") else None
        tp = float(req.get("tp", 0)) if req.get("tp") else None
        order_type = req.get("type", "MARKET").upper()
        
        sym_info = self.symbols.get(symbol, self.symbols["XAUUSD"])
        current_price = sym_info["ask"] if side == "BUY" else sym_info["bid"]
        execution_price = float(req.get("price")) if req.get("price") and order_type != "MARKET" else current_price

        if order_type == "MARKET":
            margin = (volume * sym_info["contract_size"] * execution_price) / self.account_info["leverage"]
            pos = {
                "ticket": ticket,
                "symbol": symbol,
                "type": 0 if side == "BUY" else 1,  # 0: BUY, 1: SELL
                "volume": volume,
                "price_open": execution_price,
                "price_current": current_price,
                "sl": sl or 0.0,
                "tp": tp or 0.0,
                "profit": 0.0,
                "swap": 0.0,
                "commission": round(-volume * 3.5, 2),
                "comment": req.get("comment", "QuantBacktestPro"),
                "magic": int(req.get("magic", 202608)),
                "time": int(time.time()),
                "margin": margin
            }
            self.positions[ticket] = pos
            return {"success": True, "retcode": 10009, "comment": "Order executed successfully", "ticket": ticket, "price": execution_price, "volume": volume}
        else:
            full_type = f"{side}_{order_type}" if f"{side}_{order_type}" in ["BUY_LIMIT", "SELL_LIMIT", "BUY_STOP", "SELL_STOP"] else order_type
            order = {
                "ticket": ticket,
                "symbol": symbol,
                "type": full_type,
                "volume": volume,
                "price_open": execution_price,
                "price_current": current_price,
                "sl": sl or 0.0,
                "tp": tp or 0.0,
                "comment": req.get("comment", "QuantBacktestPro Pending"),
                "magic": int(req.get("magic", 202608)),
                "time_setup": int(time.time()),
                "state": "ORDER_STATE_PLACED"
            }
            self.orders[ticket] = order
            return {"success": True, "retcode": 10009, "comment": "Pending order placed", "ticket": ticket, "price": execution_price, "volume": volume}

    def order_modify(self, ticket: int, sl: Optional[float] = None, tp: Optional[float] = None, price: Optional[float] = None) -> Dict[str, Any]:
        if ticket in self.positions:
            pos = self.positions[ticket]
            if sl is not None:
                pos["sl"] = sl
            if tp is not None:
                pos["tp"] = tp
            return {"success": True, "retcode": 10009, "comment": "Position SL/TP modified", "ticket": ticket}
        elif ticket in self.orders:
            order = self.orders[ticket]
            if sl is not None:
                order["sl"] = sl
            if tp is not None:
                order["tp"] = tp
            if price is not None:
                order["price_open"] = price
            return {"success": True, "retcode": 10009, "comment": "Pending order modified", "ticket": ticket}
        return {"success": False, "retcode": 10013, "comment": "Position or Order not found", "ticket": ticket}

    def order_close(self, ticket: int, volume: Optional[float] = None) -> Dict[str, Any]:
        if ticket not in self.positions:
            return {"success": False, "retcode": 10013, "comment": "Position not found", "ticket": ticket}
        
        pos = self.positions[ticket]
        close_vol = volume if volume and volume < pos["volume"] else pos["volume"]
        sym_info = self.symbols.get(pos["symbol"], self.symbols["XAUUSD"])
        close_price = sym_info["bid"] if pos["type"] == 0 else sym_info["ask"]
        
        # Calculate realized PnL
        diff = (close_price - pos["price_open"]) if pos["type"] == 0 else (pos["price_open"] - close_price)
        pnl = round(diff * sym_info["contract_size"] * close_vol + pos.get("commission", 0.0), 2)

        self.account_info["balance"] = round(self.account_info["balance"] + pnl, 2)
        
        deal = {
            "ticket": self.ticket_seq + 1,
            "order": ticket,
            "time": int(time.time()),
            "type": 1 if pos["type"] == 0 else 0,
            "entry": 1,  # OUT
            "symbol": pos["symbol"],
            "volume": close_vol,
            "price": close_price,
            "profit": pnl,
            "comment": "Closed from QuantPro Terminal"
        }
        self.history_deals.append(deal)

        if close_vol >= pos["volume"]:
            del self.positions[ticket]
        else:
            pos["volume"] = round(pos["volume"] - close_vol, 2)

        return {"success": True, "retcode": 10009, "comment": f"Position #{ticket} closed at {close_price}", "profit": pnl}

    def order_cancel(self, ticket: int) -> Dict[str, Any]:
        if ticket in self.orders:
            del self.orders[ticket]
            return {"success": True, "retcode": 10009, "comment": f"Order #{ticket} cancelled"}
        return {"success": False, "retcode": 10013, "comment": "Order not found"}


mock_engine = MockMT5Engine()


# ==============================================================================
# PYDANTIC DATA MODELS
# ==============================================================================
class ConnectRequest(BaseModel):
    account: Optional[int] = Field(None, description="MT5 Account Login Number (e.g. 84920184)")
    password: Optional[str] = Field(None, description="MT5 Account Master/Investor Password")
    server: Optional[str] = Field("Exness-MT5Real", description="MT5 Server Name (e.g. Exness-MT5Real, Exness-MT5Trial)")
    path: Optional[str] = Field(None, description="Optional path to terminal64.exe")
    portable: Optional[bool] = Field(False, description="Run in portable mode")

class OrderSendRequest(BaseModel):
    symbol: str = Field(..., description="Symbol ticker (e.g. XAUUSD)")
    side: str = Field(..., description="BUY or SELL")
    type: str = Field("MARKET", description="MARKET, LIMIT, STOP, STOP_LIMIT")
    volume: float = Field(0.1, description="Lot size (e.g. 0.1)")
    price: Optional[float] = Field(None, description="Trigger/Limit price for pending orders")
    sl: Optional[float] = Field(None, description="Stop Loss price")
    tp: Optional[float] = Field(None, description="Take Profit price")
    deviation: Optional[int] = Field(20, description="Max allowed slippage in points")
    comment: Optional[str] = Field("QuantPro Live", description="Order comment")
    magic: Optional[int] = Field(202608, description="Expert Advisor Magic ID")

class OrderModifyRequest(BaseModel):
    ticket: int = Field(..., description="Position or Order Ticket ID")
    sl: Optional[float] = Field(None, description="New Stop Loss price")
    tp: Optional[float] = Field(None, description="New Take Profit price")
    price: Optional[float] = Field(None, description="New pending trigger price")

class OrderCloseRequest(BaseModel):
    ticket: int = Field(..., description="Position Ticket ID to close")
    volume: Optional[float] = Field(None, description="Partial close volume. Omit for 100% close.")


# ==============================================================================
# FASTAPI APPLICATION SETUP
# ==============================================================================
app = FastAPI(
    title="Quant Backtest Pro - MT5 Micro Gateway",
    version="2.0.0",
    description="High-Speed Local/Remote REST and WebSocket Bridge for MetaTrader 5"
)

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

connected_clients: List[WebSocket] = []


_is_native_connected: bool = False

def is_live_connected() -> bool:
    global _is_native_connected
    if not HAS_MT5_NATIVE or mt5 is None or not _is_native_connected:
        return False
    try:
        term = mt5.terminal_info()
        acc = mt5.account_info()
        is_ok = term is not None and acc is not None and getattr(acc, "login", 0) > 0
        if not is_ok:
            _is_native_connected = False
        return is_ok
    except Exception:
        _is_native_connected = False
        return False

def native_get_account_info() -> Dict[str, Any]:
    if not is_live_connected():
        return mock_engine.get_account()
    
    acc = mt5.account_info()
    if acc is None:
        return mock_engine.get_account()
    
    return {
        "login": acc.login,
        "trade_mode": acc.trade_mode,
        "leverage": acc.leverage,
        "limit_orders": acc.limit_orders,
        "margin_so_mode": acc.margin_so_mode,
        "trade_allowed": acc.trade_allowed,
        "trade_expert": acc.trade_expert,
        "margin_mode": acc.margin_mode,
        "currency_digits": acc.currency_digits,
        "balance": acc.balance,
        "credit": acc.credit,
        "profit": acc.profit,
        "equity": acc.equity,
        "margin": acc.margin,
        "margin_free": acc.margin_free,
        "margin_level": acc.margin_level,
        "margin_so_call": acc.margin_so_call,
        "margin_so_so": acc.margin_so_so,
        "server": acc.server,
        "currency": acc.currency,
        "company": acc.company,
        "name": acc.name
    }

def native_get_positions() -> List[Dict[str, Any]]:
    if not is_live_connected():
        return list(mock_engine.positions.values())
    
    pos_tuples = mt5.positions_get()
    if pos_tuples is None:
        return []
    
    result = []
    for p in pos_tuples:
        result.append({
            "ticket": p.ticket,
            "time": p.time,
            "time_msc": p.time_msc,
            "time_update": p.time_update,
            "time_update_msc": p.time_update_msc,
            "type": p.type,  # 0: BUY, 1: SELL
            "magic": p.magic,
            "identifier": p.identifier,
            "reason": p.reason,
            "volume": p.volume,
            "price_open": p.price_open,
            "sl": p.sl,
            "tp": p.tp,
            "price_current": p.price_current,
            "swap": p.swap,
            "profit": p.profit,
            "symbol": p.symbol,
            "comment": p.comment,
            "external_id": p.external_id
        })
    return result

def native_get_orders() -> List[Dict[str, Any]]:
    if not is_live_connected():
        return list(mock_engine.orders.values())
    
    ord_tuples = mt5.orders_get()
    if ord_tuples is None:
        return []
    
    result = []
    for o in ord_tuples:
        result.append({
            "ticket": o.ticket,
            "time_setup": o.time_setup,
            "time_setup_msc": o.time_setup_msc,
            "time_expiration": o.time_expiration,
            "type": o.type,
            "type_time": o.type_time,
            "type_filling": o.type_filling,
            "state": o.state,
            "magic": o.magic,
            "volume_initial": o.volume_initial,
            "volume_current": o.volume_current,
            "price_open": o.price_open,
            "sl": o.sl,
            "tp": o.tp,
            "price_current": o.price_current,
            "symbol": o.symbol,
            "comment": o.comment,
            "external_id": o.external_id
        })
    return result


# ==============================================================================
# REST API ENDPOINTS
# ==============================================================================
@app.get("/health")
def health_check():
    return {
        "status": "online",
        "has_native_mt5": HAS_MT5_NATIVE,
        "is_connected": is_live_connected(),
        "timestamp": int(time.time()),
        "version": "2.0.0"
    }

@app.post("/connect")
def connect_mt5(req: ConnectRequest):
    if not HAS_MT5_NATIVE or mt5 is None or req.brokerType == "MT5_MOCK" or (req.password and "Mock" in req.password) or (req.server and "Mock" in req.server):
        mock_engine.connect(req.account, req.password, req.server)
        return {
            "success": True,
            "mode": "mock",
            "message": f"Connected to Mock MT5 ({req.server}) account #{mock_engine.account_info['login']}",
            "account": mock_engine.get_account()
        }
    
    # Initialize native MT5
    init_params = {}
    if req.path:
        norm_path = os.path.normpath(req.path).lower()
        if not (norm_path.endswith("terminal64.exe") or norm_path.endswith("terminal.exe")):
            return {
                "success": False,
                "mode": "invalid_path",
                "message": "Đường dẫn không hợp lệ. Chỉ chấp nhận file terminal64.exe hoặc terminal.exe.",
            }
        init_params["path"] = req.path
    if req.portable:
        init_params["portable"] = req.portable
    
    initialized = False
    try:
        initialized = mt5.initialize(**init_params)
    except Exception as e:
        logger.warning(f"MT5 initialize exception: {e}")

    # If default initialize failed, search known installed terminal paths
    if not initialized and not req.path:
        common_paths = [
            r"C:\Program Files\Exness MetaTrader 5\terminal64.exe",
            r"C:\Program Files\MetaTrader 5\terminal64.exe",
            r"C:\Program Files\Exness MT5\terminal64.exe",
            r"C:\Program Files (x86)\MetaTrader 5\terminal64.exe",
            os.path.expandvars(r"%LOCALAPPDATA%\Programs\MetaTrader 5\terminal64.exe"),
            os.path.expandvars(r"%LOCALAPPDATA%\Programs\Exness MetaTrader 5\terminal64.exe"),
        ]
        for p in common_paths:
            if os.path.exists(p):
                try:
                    init_res = mt5.initialize(path=p)
                    if init_res:
                        initialized = True
                        logger.info(f"Successfully attached to MetaTrader 5 via path: {p}")
                        break
                except Exception:
                    pass

    if not initialized:
        err = mt5.last_error()
        logger.warning(f"MetaTrader 5 desktop client not running or not found: {err}")
        return {
            "success": False,
            "mode": "not_running",
            "message": "Không tìm thấy phần mềm MetaTrader 5 Terminal đang chạy trên máy tính. Vui lòng mở ứng dụng Exness MT5 trước khi bấm kết nối.",
            "detail": f"MT5 Native IPC Error: {err}"
        }
    
    # Login if credentials provided
    if req.account and req.password:
        try:
            account_int = int(req.account)
        except ValueError:
            account_int = req.account
        logged_in = mt5.login(account_int, password=req.password, server=req.server)
        if not logged_in:
            err = mt5.last_error()
            logger.warning(f"MT5 login failed for account #{req.account} on {req.server}: {err}")
            return {
                "success": False,
                "mode": "login_failed",
                "message": f"Đăng nhập thất bại vào tài khoản #{req.account} trên server {req.server}. Vui lòng kiểm tra lại Số tài khoản, Mật khẩu hoặc Tên Server.",
                "detail": f"MT5 Login Error: {err}"
            }
    
    global _is_native_connected
    _is_native_connected = True
    acc_info = native_get_account_info()
    logger.info(f"Connected to Live MT5 account #{acc_info.get('login')} on {acc_info.get('server')}")
    return {
        "success": True,
        "mode": "native",
        "message": f"Kết nối thành công với tài khoản thật #{acc_info.get('login')} trên server {acc_info.get('server')}",
        "account": acc_info
    }

@app.post("/disconnect")
def disconnect_mt5():
    global _is_native_connected
    _is_native_connected = False
    if not HAS_MT5_NATIVE or mt5 is None:
        mock_engine.disconnect()
        return {"success": True, "message": "Mock MT5 Disconnected"}
    
    mt5.shutdown()
    return {"success": True, "message": "MT5 Terminal Connection Closed"}

@app.get("/account")
def get_account():
    return native_get_account_info()

@app.get("/positions")
def get_positions():
    return native_get_positions()

@app.get("/orders")
def get_orders():
    return native_get_orders()

@app.get("/history")
def get_history(from_timestamp: Optional[int] = None, to_timestamp: Optional[int] = None):
    if not is_live_connected():
        return mock_engine.history_deals
    
    from_time = from_timestamp if from_timestamp else int(time.time() - 7 * 86400)
    to_time = to_timestamp if to_timestamp else int(time.time() + 86400)
    
    deals = mt5.history_deals_get(from_time, to_time)
    if deals is None:
        return []
    
    result = []
    for d in deals:
        result.append({
            "ticket": d.ticket,
            "order": d.order,
            "time": d.time,
            "time_msc": d.time_msc,
            "type": d.type,
            "entry": d.entry,
            "magic": d.magic,
            "reason": d.reason,
            "position_id": d.position_id,
            "volume": d.volume,
            "price": d.price,
            "commission": d.commission,
            "swap": d.swap,
            "profit": d.profit,
            "fee": d.fee,
            "symbol": d.symbol,
            "comment": d.comment
        })
    return result

@app.post("/order/send")
def send_order(req: OrderSendRequest):
    if not is_live_connected():
        return mock_engine.order_send(req.model_dump())
    
    side_upper = req.side.upper()
    type_upper = req.type.upper()
    
    # Get current symbol tick
    symbol_tick = mt5.symbol_info_tick(req.symbol)
    if symbol_tick is None:
        raise HTTPException(status_code=400, detail=f"Cannot fetch tick for symbol {req.symbol}")
    
    # Determine action & order type constants
    if type_upper == "MARKET":
        action = mt5.TRADE_ACTION_DEAL
        order_type = mt5.ORDER_TYPE_BUY if side_upper == "BUY" else mt5.ORDER_TYPE_SELL
        price = symbol_tick.ask if side_upper == "BUY" else symbol_tick.bid
    elif type_upper == "LIMIT":
        action = mt5.TRADE_ACTION_PENDING
        order_type = mt5.ORDER_TYPE_BUY_LIMIT if side_upper == "BUY" else mt5.ORDER_TYPE_SELL_LIMIT
        price = req.price or (symbol_tick.ask if side_upper == "BUY" else symbol_tick.bid)
    elif type_upper == "STOP":
        action = mt5.TRADE_ACTION_PENDING
        order_type = mt5.ORDER_TYPE_BUY_STOP if side_upper == "BUY" else mt5.ORDER_TYPE_SELL_STOP
        price = req.price or (symbol_tick.ask if side_upper == "BUY" else symbol_tick.bid)
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported order type: {type_upper}")

    symbol_info = mt5.symbol_info(req.symbol)
    filling_type = mt5.ORDER_FILLING_IOC
    if symbol_info is not None:
        filling_mode = getattr(symbol_info, "filling_mode", 2)
        if filling_mode == 1:
            filling_type = mt5.ORDER_FILLING_FOK
        elif filling_mode == 2:
            filling_type = mt5.ORDER_FILLING_IOC
        elif filling_mode == 0:
            filling_type = mt5.ORDER_FILLING_RETURN

    mt5_request = {
        "action": action,
        "symbol": req.symbol,
        "volume": float(req.volume),
        "type": order_type,
        "price": float(price),
        "deviation": int(req.deviation or 20),
        "magic": int(req.magic or 202608),
        "comment": req.comment or "QuantPro Live",
        "type_time": mt5.ORDER_TIME_GTC,
        "type_filling": filling_type,
    }

    if req.sl:
        mt5_request["sl"] = float(req.sl)
    if req.tp:
        mt5_request["tp"] = float(req.tp)

    result = mt5.order_send(mt5_request)
    
    # Retry with FOK or RETURN if unsupported filling mode (code 10030)
    if result is not None and result.retcode == 10030:
        for alt_fill in [mt5.ORDER_FILLING_FOK, mt5.ORDER_FILLING_RETURN, mt5.ORDER_FILLING_IOC]:
            if alt_fill != filling_type:
                mt5_request["type_filling"] = alt_fill
                retry_res = mt5.order_send(mt5_request)
                if retry_res is not None and retry_res.retcode == mt5.TRADE_RETCODE_DONE:
                    result = retry_res
                    break

    if result is None:
        error = mt5.last_error()
        raise HTTPException(status_code=500, detail=f"MT5 order_send returned None: {error}")
    
    if result.retcode != mt5.TRADE_RETCODE_DONE:
        return {
            "success": False,
            "retcode": result.retcode,
            "comment": result.comment,
            "message": f"MT5 order rejected with code {result.retcode}: {result.comment}"
        }
    
    return {
        "success": True,
        "retcode": result.retcode,
        "ticket": result.order,
        "price": result.price,
        "volume": result.volume,
        "comment": result.comment
    }

@app.post("/order/modify")
def modify_order(req: OrderModifyRequest):
    if not is_live_connected():
        return mock_engine.order_modify(req.ticket, req.sl, req.tp, req.price)
    
    # Check if ticket is in positions
    positions = mt5.positions_get(ticket=req.ticket)
    if positions and len(positions) > 0:
        pos = positions[0]
        modify_req = {
            "action": mt5.TRADE_ACTION_SLTP,
            "position": req.ticket,
            "symbol": pos.symbol,
            "sl": float(req.sl) if req.sl is not None else float(pos.sl),
            "tp": float(req.tp) if req.tp is not None else float(pos.tp),
        }
        res = mt5.order_send(modify_req)
        if res is None or res.retcode != mt5.TRADE_RETCODE_DONE:
            comment = res.comment if res else str(mt5.last_error())
            return {"success": False, "comment": comment, "ticket": req.ticket}
        return {"success": True, "comment": "Position SL/TP updated", "ticket": req.ticket}
    
    # Check if ticket is in pending orders
    orders = mt5.orders_get(ticket=req.ticket)
    if orders and len(orders) > 0:
        ord_obj = orders[0]
        modify_req = {
            "action": mt5.TRADE_ACTION_MODIFY,
            "order": req.ticket,
            "price": float(req.price) if req.price is not None else float(ord_obj.price_open),
            "sl": float(req.sl) if req.sl is not None else float(ord_obj.sl),
            "tp": float(req.tp) if req.tp is not None else float(ord_obj.tp),
            "type_time": ord_obj.type_time,
            "type_filling": ord_obj.type_filling
        }
        res = mt5.order_send(modify_req)
        if res is None or res.retcode != mt5.TRADE_RETCODE_DONE:
            comment = res.comment if res else str(mt5.last_error())
            return {"success": False, "comment": comment, "ticket": req.ticket}
        return {"success": True, "comment": "Pending order modified", "ticket": req.ticket}
    
    raise HTTPException(status_code=404, detail=f"Ticket #{req.ticket} not found in positions or orders")

@app.post("/order/close")
def close_order(req: OrderCloseRequest):
    if not is_live_connected():
        return mock_engine.order_close(req.ticket, req.volume)
    
    positions = mt5.positions_get(ticket=req.ticket)
    if not positions or len(positions) == 0:
        raise HTTPException(status_code=404, detail=f"Position #{req.ticket} not found")
    
    pos = positions[0]
    symbol_tick = mt5.symbol_info_tick(pos.symbol)
    if symbol_tick is None:
        raise HTTPException(status_code=400, detail=f"Cannot get tick for {pos.symbol}")
    
    close_type = mt5.ORDER_TYPE_SELL if pos.type == mt5.ORDER_TYPE_BUY else mt5.ORDER_TYPE_BUY
    close_price = symbol_tick.bid if pos.type == mt5.ORDER_TYPE_BUY else symbol_tick.ask
    close_vol = float(req.volume) if req.volume and req.volume < pos.volume else float(pos.volume)

    close_req = {
        "action": mt5.TRADE_ACTION_DEAL,
        "position": req.ticket,
        "symbol": pos.symbol,
        "volume": close_vol,
        "type": close_type,
        "price": close_price,
        "deviation": 20,
        "magic": 202608,
        "comment": "QuantPro Close",
        "type_time": mt5.ORDER_TIME_GTC,
        "type_filling": mt5.ORDER_FILLING_IOC,
    }

    result = mt5.order_send(close_req)
    if result is None or result.retcode != mt5.TRADE_RETCODE_DONE:
        comment = result.comment if result else str(mt5.last_error())
        return {"success": False, "comment": comment, "ticket": req.ticket}
    
    return {"success": True, "comment": f"Position #{req.ticket} closed at {close_price}", "ticket": req.ticket}

@app.post("/order/cancel")
def cancel_order(ticket: int = Query(..., description="Ticket ID of pending order")):
    if not is_live_connected():
        return mock_engine.order_cancel(ticket)
    
    cancel_req = {
        "action": mt5.TRADE_ACTION_REMOVE,
        "order": ticket
    }
    result = mt5.order_send(cancel_req)
    if result is None or result.retcode != mt5.TRADE_RETCODE_DONE:
        comment = result.comment if result else str(mt5.last_error())
        return {"success": False, "comment": comment, "ticket": ticket}
    return {"success": True, "comment": f"Order #{ticket} cancelled"}

@app.get("/candles")
def get_candles(
    symbol: str = Query(..., description="Symbol ticker (e.g. XAUUSD)"),
    timeframe: str = Query("M5", description="Timeframe: M1, M5, M15, M30, H1, H4, D1"),
    count: int = Query(500, description="Number of candles to fetch")
):
    if not is_live_connected():
        return mock_engine.get_candles(symbol, timeframe, count)
    
    tf_const = TIMEFRAME_MAP.get(timeframe.upper(), 5)
    rates = mt5.copy_rates_from_pos(symbol, tf_const, 0, count)
    if rates is None or len(rates) == 0:
        return mock_engine.get_candles(symbol, timeframe, count)
    
    result = []
    for r in rates:
        result.append({
            "timestamp": int(r["time"]) * 1000,
            "open": float(r["open"]),
            "high": float(r["high"]),
            "low": float(r["low"]),
            "close": float(r["close"]),
            "volume": float(r["tick_volume"])
        })
    return result

@app.get("/symbols")
def get_symbols():
    if not is_live_connected():
        return mock_engine.symbols
    
    symbols = mt5.symbols_get()
    if symbols is None:
        return mock_engine.symbols
    
    res = {}
    for s in symbols[:50]:  # Cap to popular 50 symbols
        res[s.name] = {
            "symbol": s.name,
            "description": s.description or s.name,
            "digits": s.digits,
            "point": s.point,
            "spread": s.spread,
            "min_lot": s.volume_min,
            "max_lot": s.volume_max,
            "step": s.volume_step,
            "contract_size": s.trade_contract_size,
            "bid": s.bid,
            "ask": s.ask
        }
    return res

@app.get("/symbols/all")
def get_all_symbols():
    if not is_live_connected():
        return mock_engine.get_all_symbols()
    
    symbols = mt5.symbols_get()
    if symbols is None:
        return mock_engine.get_all_symbols()
    
    res = []
    for s in symbols:
        name = s.name
        # Classify category
        cat = "FOREX"
        if "XAU" in name or "XAG" in name or "GOLD" in name or "SILVER" in name:
            cat = "METALS"
        elif "BTC" in name or "ETH" in name or "SOL" in name or "CRYPTO" in name or "XRP" in name:
            cat = "CRYPTO"
        elif "US30" in name or "NAS" in name or "SPX" in name or "GER" in name or "HK50" in name:
            cat = "INDICES"
        elif "OIL" in name or "BRENT" in name or "GAS" in name:
            cat = "COMMODITIES"

        res.append({
            "symbol": s.name,
            "description": s.description or s.name,
            "category": cat,
            "digits": s.digits,
            "point": s.point,
            "spread": s.spread,
            "min_lot": s.volume_min,
            "max_lot": s.volume_max,
            "step": s.volume_step,
            "contract_size": s.trade_contract_size,
            "bid": s.bid,
            "ask": s.ask
        })
    return res


# ==============================================================================
# WEBSOCKET STREAM (Real-Time Tick & Account Events)
# ==============================================================================
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)
    logger.info("New WebSocket client connected to MT5 Gateway")
    try:
        while True:
            # Poll account, positions, and live ticks
            acc = native_get_account_info()
            positions = native_get_positions()
            orders = native_get_orders()
            
            # Fetch ticks
            ticks: Dict[str, Any] = {}
            if is_live_connected():
                for sym_name in ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "BTCUSD", "US30", "NAS100"]:
                    t = mt5.symbol_info_tick(sym_name)
                    if t:
                        ticks[sym_name] = {
                            "symbol": sym_name,
                            "bid": t.bid,
                            "ask": t.ask,
                            "last": t.last or t.bid,
                            "volume": t.volume,
                            "spread": int(round((t.ask - t.bid) / (0.01 if "XAU" in sym_name else 0.00001))),
                            "timestamp": int(t.time_msc)
                        }
            else:
                # Mock tick variation
                import random
                for sym_name, s_info in mock_engine.symbols.items():
                    jitter = (random.random() - 0.5) * (s_info["point"] * 5)
                    bid = round(s_info["bid"] + jitter, s_info["digits"])
                    spread_price = s_info["spread"] * s_info["point"]
                    ask = round(bid + spread_price, s_info["digits"])
                    ticks[sym_name] = {
                        "symbol": sym_name,
                        "bid": bid,
                        "ask": ask,
                        "last": bid,
                        "spread": s_info["spread"],
                        "timestamp": int(time.time() * 1000),
                        "digits": s_info["digits"]
                    }
            
            payload = {
                "type": "SNAPSHOT",
                "timestamp": int(time.time() * 1000),
                "account": acc,
                "positions": positions,
                "orders": orders,
                "ticks": ticks
            }
            await websocket.send_json(payload)
            await asyncio.sleep(0.3)
    except WebSocketDisconnect:
        connected_clients.remove(websocket)
        logger.info("WebSocket client disconnected")
    except Exception as e:
        if websocket in connected_clients:
            connected_clients.remove(websocket)
        logger.error(f"WebSocket error: {e}")


# ==============================================================================
# MAIN RUNNER
# ==============================================================================
if __name__ == "__main__":
    port = int(os.environ.get("MT5_GATEWAY_PORT", 8765))
    host = os.environ.get("MT5_GATEWAY_HOST", "0.0.0.0")
    print(f"\n⚡ Quant Backtest Pro - MT5 Universal Micro-Gateway")
    print(f"   ├─ Host:           {host}")
    print(f"   ├─ Port:           {port}")
    print(f"   ├─ Native MT5:     {'Available ✅' if HAS_MT5_NATIVE else 'Mock Engine Fallback ⚠️'}")
    print(f"   └─ API Docs:       http://localhost:{port}/docs\n")
    uvicorn.run(app, host=host, port=port, log_level="info")
