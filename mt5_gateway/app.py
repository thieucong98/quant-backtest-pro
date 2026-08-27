"""
Quant Backtest Pro - MT5 Universal Micro-Gateway
High-Performance Python FastAPI Bridge for MetaTrader 5 (Exness, XTB, & Any Broker)
"""

import sys
import os
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
            "XAUUSD": {"bid": 2724.50, "ask": 2724.70, "digits": 2, "point": 0.01, "spread": 20, "min_lot": 0.01, "max_lot": 100.0, "step": 0.01, "contract_size": 100},
            "EURUSD": {"bid": 1.08350, "ask": 1.08362, "digits": 5, "point": 0.00001, "spread": 12, "min_lot": 0.01, "max_lot": 100.0, "step": 0.01, "contract_size": 100000},
            "GBPUSD": {"bid": 1.29420, "ask": 1.29435, "digits": 5, "point": 0.00001, "spread": 15, "min_lot": 0.01, "max_lot": 100.0, "step": 0.01, "contract_size": 100000},
            "USDJPY": {"bid": 153.450, "ask": 153.465, "digits": 3, "point": 0.001, "spread": 15, "min_lot": 0.01, "max_lot": 100.0, "step": 0.01, "contract_size": 100000},
            "BTCUSD": {"bid": 94250.0, "ask": 94265.0, "digits": 2, "point": 0.01, "spread": 1500, "min_lot": 0.01, "max_lot": 50.0, "step": 0.01, "contract_size": 1},
        }

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
            return {"retcode": 10009, "comment": "Order executed successfully", "ticket": ticket, "price": execution_price, "volume": volume}
        else:
            order = {
                "ticket": ticket,
                "symbol": symbol,
                "type": order_type,
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
            return {"retcode": 10009, "comment": "Pending order placed", "ticket": ticket, "price": execution_price, "volume": volume}

    def order_modify(self, ticket: int, sl: Optional[float] = None, tp: Optional[float] = None, price: Optional[float] = None) -> Dict[str, Any]:
        if ticket in self.positions:
            pos = self.positions[ticket]
            if sl is not None:
                pos["sl"] = sl
            if tp is not None:
                pos["tp"] = tp
            return {"retcode": 10009, "comment": "Position SL/TP modified", "ticket": ticket}
        elif ticket in self.orders:
            order = self.orders[ticket]
            if sl is not None:
                order["sl"] = sl
            if tp is not None:
                order["tp"] = tp
            if price is not None:
                order["price_open"] = price
            return {"retcode": 10009, "comment": "Pending order modified", "ticket": ticket}
        return {"retcode": 10013, "comment": "Position or Order not found", "ticket": ticket}

    def order_close(self, ticket: int, volume: Optional[float] = None) -> Dict[str, Any]:
        if ticket not in self.positions:
            return {"retcode": 10013, "comment": "Position not found", "ticket": ticket}
        
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

        return {"retcode": 10009, "comment": f"Position #{ticket} closed at {close_price}", "profit": pnl}

    def order_cancel(self, ticket: int) -> Dict[str, Any]:
        if ticket in self.orders:
            del self.orders[ticket]
            return {"retcode": 10009, "comment": f"Order #{ticket} cancelled"}
        return {"retcode": 10013, "comment": "Order not found"}


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
    symbol: str = Field(..., example="XAUUSD")
    side: str = Field(..., example="BUY")  # BUY or SELL
    type: str = Field("MARKET", example="MARKET")  # MARKET, LIMIT, STOP, STOP_LIMIT
    volume: float = Field(0.1, example=0.1)
    price: Optional[float] = Field(None, description="Trigger/Limit price for pending orders")
    sl: Optional[float] = Field(None, description="Stop Loss price")
    tp: Optional[float] = Field(None, description="Take Profit price")
    deviation: Optional[int] = Field(20, description="Max allowed slippage in points")
    comment: Optional[str] = Field("QuantPro Live", description="Order comment")
    magic: Optional[int] = Field(202608, description="Expert Advisor Magic ID")

class OrderModifyRequest(BaseModel):
    ticket: int = Field(..., example=982140)
    sl: Optional[float] = Field(None, description="New Stop Loss price")
    tp: Optional[float] = Field(None, description="New Take Profit price")
    price: Optional[float] = Field(None, description="New pending trigger price")

class OrderCloseRequest(BaseModel):
    ticket: int = Field(..., example=982140)
    volume: Optional[float] = Field(None, description="Partial close volume. Omit for 100% close.")


# ==============================================================================
# FASTAPI APPLICATION SETUP
# ==============================================================================
app = FastAPI(
    title="Quant Backtest Pro - MT5 Micro Gateway",
    version="2.0.0",
    description="High-Speed Local/Remote REST and WebSocket Bridge for MetaTrader 5"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

connected_clients: List[WebSocket] = []


# ==============================================================================
# HELPER FUNCTIONS FOR NATIVE MT5
# ==============================================================================
def native_get_account_info() -> Dict[str, Any]:
    if not HAS_MT5_NATIVE or mt5 is None:
        return mock_engine.get_account()
    
    acc = mt5.account_info()
    if acc is None:
        error = mt5.last_error()
        raise HTTPException(status_code=500, detail=f"MT5 account_info failed: {error}")
    
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
    if not HAS_MT5_NATIVE or mt5 is None:
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
    if not HAS_MT5_NATIVE or mt5 is None:
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
    is_connected = False
    if HAS_MT5_NATIVE and mt5 is not None:
        is_connected = mt5.terminal_info() is not None
    else:
        is_connected = mock_engine.connected
    
    return {
        "status": "online",
        "has_native_mt5": HAS_MT5_NATIVE,
        "is_connected": is_connected,
        "timestamp": int(time.time()),
        "version": "2.0.0"
    }

@app.post("/connect")
def connect_mt5(req: ConnectRequest):
    if not HAS_MT5_NATIVE or mt5 is None:
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
        init_params["path"] = req.path
    if req.portable:
        init_params["portable"] = req.portable
    
    initialized = mt5.initialize(**init_params)
    if not initialized:
        error = mt5.last_error()
        raise HTTPException(status_code=500, detail=f"MT5 initialize failed: {error}")
    
    # Login if credentials provided
    if req.account and req.password:
        logged_in = mt5.login(req.account, password=req.password, server=req.server)
        if not logged_in:
            error = mt5.last_error()
            raise HTTPException(status_code=401, detail=f"MT5 login failed for account #{req.account} on {req.server}: {error}")
    
    acc_info = native_get_account_info()
    logger.info(f"Connected to Live MT5 account #{acc_info.get('login')} on {acc_info.get('server')}")
    return {
        "success": True,
        "mode": "native",
        "message": f"Successfully connected to {acc_info.get('server')}",
        "account": acc_info
    }

@app.post("/disconnect")
def disconnect_mt5():
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
    if not HAS_MT5_NATIVE or mt5 is None:
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
    if not HAS_MT5_NATIVE or mt5 is None:
        return mock_engine.order_send(req.dict())
    
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
        "type_filling": mt5.ORDER_FILLING_IOC,
    }

    if req.sl:
        mt5_request["sl"] = float(req.sl)
    if req.tp:
        mt5_request["tp"] = float(req.tp)

    result = mt5.order_send(mt5_request)
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
    if not HAS_MT5_NATIVE or mt5 is None:
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
    if not HAS_MT5_NATIVE or mt5 is None:
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
def cancel_order(ticket: int = Query(...)):
    if not HAS_MT5_NATIVE or mt5 is None:
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

@app.get("/symbols")
def get_symbols():
    if not HAS_MT5_NATIVE or mt5 is None:
        return mock_engine.symbols
    
    symbols = mt5.symbols_get()
    if symbols is None:
        return {}
    
    res = {}
    for s in symbols[:50]:  # Cap to popular 50 symbols
        res[s.name] = {
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
            # Poll account & positions state every 500ms
            acc = native_get_account_info()
            positions = native_get_positions()
            orders = native_get_orders()
            
            payload = {
                "type": "SNAPSHOT",
                "timestamp": int(time.time() * 1000),
                "account": acc,
                "positions": positions,
                "orders": orders
            }
            await websocket.send_json(payload)
            await asyncio.sleep(0.5)
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
