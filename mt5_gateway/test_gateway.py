"""
Unit & Integration Tests for MT5 Micro-Gateway
"""
import os
import sys

# Ensure local imports resolve correctly
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import unittest
from fastapi.testclient import TestClient
from app import app, mock_engine

client = TestClient(app)

class TestMT5Gateway(unittest.TestCase):
    def setUp(self):
        mock_engine.positions.clear()
        mock_engine.orders.clear()
        mock_engine.history_deals.clear()
        mock_engine.account_info["balance"] = 10000.0

    def test_health_check(self):
        response = client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "online")

    def test_connect_and_account(self):
        # Connect
        conn_res = client.post("/connect", json={
            "account": 84920184,
            "password": "samplePassword",
            "server": "Exness-MT5Real"
        })
        self.assertEqual(conn_res.status_code, 200)
        self.assertTrue(conn_res.json()["success"])

        # Account Info
        acc_res = client.get("/account")
        self.assertEqual(acc_res.status_code, 200)
        acc = acc_res.json()
        self.assertEqual(acc["login"], 84920184)
        self.assertEqual(acc["balance"], 10000.0)

    def test_order_lifecycle(self):
        # 1. Open Market BUY Order
        buy_res = client.post("/order/send", json={
            "symbol": "XAUUSD",
            "side": "BUY",
            "type": "MARKET",
            "volume": 0.5,
            "sl": 2710.0,
            "tp": 2750.0,
            "comment": "Test Buy"
        })
        self.assertEqual(buy_res.status_code, 200)
        buy_data = buy_res.json()
        self.assertTrue(buy_data["success"])
        ticket = buy_data["ticket"]
        self.assertIsNotNone(ticket)

        # 2. Check Open Positions
        pos_res = client.get("/positions")
        self.assertEqual(pos_res.status_code, 200)
        positions = pos_res.json()
        self.assertEqual(len(positions), 1)
        self.assertEqual(positions[0]["ticket"], ticket)
        self.assertEqual(positions[0]["volume"], 0.5)

        # 3. Modify SL / TP
        mod_res = client.post("/order/modify", json={
            "ticket": ticket,
            "sl": 2715.0,
            "tp": 2760.0
        })
        self.assertEqual(mod_res.status_code, 200)
        self.assertTrue(mod_res.json()["success"])

        # Verify Modified
        pos_res2 = client.get("/positions")
        self.assertEqual(pos_res2.json()[0]["sl"], 2715.0)
        self.assertEqual(pos_res2.json()[0]["tp"], 2760.0)

        # 4. Partial Close 0.2 Lot
        close_part = client.post("/order/close", json={
            "ticket": ticket,
            "volume": 0.2
        })
        self.assertEqual(close_part.status_code, 200)
        self.assertTrue(close_part.json()["success"])

        # Check remaining volume is 0.3
        pos_res3 = client.get("/positions")
        self.assertEqual(pos_res3.json()[0]["volume"], 0.3)

        # 5. Full Close Remaining 0.3 Lot
        close_full = client.post("/order/close", json={
            "ticket": ticket
        })
        self.assertEqual(close_full.status_code, 200)
        self.assertTrue(close_full.json()["success"])

        # Check positions is empty
        pos_res4 = client.get("/positions")
        self.assertEqual(len(pos_res4.json()), 0)

        # 6. Check History Deals
        hist_res = client.get("/history")
        self.assertEqual(hist_res.status_code, 200)
        self.assertEqual(len(hist_res.json()), 2)

    def test_pending_order_lifecycle(self):
        # 1. Place BUY_LIMIT
        limit_res = client.post("/order/send", json={
            "symbol": "EURUSD",
            "side": "BUY",
            "type": "LIMIT",
            "volume": 1.0,
            "price": 1.0750,
            "sl": 1.0700,
            "tp": 1.0850
        })
        self.assertEqual(limit_res.status_code, 200)
        limit_ticket = limit_res.json()["ticket"]

        # 2. Check Pending Orders
        ord_res = client.get("/orders")
        self.assertEqual(ord_res.status_code, 200)
        orders = ord_res.json()
        self.assertEqual(len(orders), 1)
        self.assertEqual(orders[0]["ticket"], limit_ticket)

        # 3. Cancel Pending Order
        cancel_res = client.post(f"/order/cancel?ticket={limit_ticket}")
        self.assertEqual(cancel_res.status_code, 200)
        self.assertTrue(cancel_res.json()["success"])

        # Verify Empty
        ord_res2 = client.get("/orders")
        self.assertEqual(len(ord_res2.json()), 0)

    def test_symbols_endpoint(self):
        sym_res = client.get("/symbols")
        self.assertEqual(sym_res.status_code, 200)
        symbols = sym_res.json()
        self.assertIn("XAUUSD", symbols)
        self.assertIn("EURUSD", symbols)
        self.assertIn("BTCUSD", symbols)
        self.assertGreater(symbols["XAUUSD"]["bid"], 0)
        self.assertGreater(symbols["EURUSD"]["digits"], 0)

    def test_symbols_all_endpoint(self):
        res = client.get("/symbols/all")
        self.assertEqual(res.status_code, 200)
        symbols = res.json()
        self.assertIsInstance(symbols, list)
        self.assertGreaterEqual(len(symbols), 5)
        
        tickers = [s["symbol"] for s in symbols]
        self.assertIn("XAUUSD", tickers)
        self.assertIn("EURUSD", tickers)
        self.assertIn("BTCUSD", tickers)
        self.assertIn("US30", tickers)

        # Check Category
        gold = next(s for s in symbols if s["symbol"] == "XAUUSD")
        self.assertEqual(gold["category"], "METALS")
        btc = next(s for s in symbols if s["symbol"] == "BTCUSD")
        self.assertEqual(btc["category"], "CRYPTO")

    def test_candles_endpoint(self):
        res = client.get("/candles?symbol=XAUUSD&timeframe=M5&count=50")
        self.assertEqual(res.status_code, 200)
        candles = res.json()
        self.assertIsInstance(candles, list)
        self.assertEqual(len(candles), 50)
        
        first = candles[0]
        self.assertIn("timestamp", first)
        self.assertIn("open", first)
        self.assertIn("high", first)
        self.assertIn("low", first)
        self.assertIn("close", first)
        self.assertIn("volume", first)
        self.assertGreater(first["close"], 0)
        self.assertGreaterEqual(first["high"], first["low"])

    def test_negative_cases(self):
        # 1. Modify non-existent ticket
        mod_bad = client.post("/order/modify", json={
            "ticket": 99999999,
            "sl": 2700.0
        })
        self.assertEqual(mod_bad.status_code, 200)
        self.assertFalse(mod_bad.json()["success"])

        # 2. Close non-existent position
        close_bad = client.post("/order/close", json={
            "ticket": 99999999
        })
        self.assertEqual(close_bad.status_code, 200)
        self.assertFalse(close_bad.json()["success"])

        # 3. Cancel non-existent pending order
        cancel_bad = client.post("/order/cancel?ticket=99999999")
        self.assertEqual(cancel_bad.status_code, 200)
        self.assertFalse(cancel_bad.json()["success"])

    def test_disconnect_endpoint(self):
        disc_res = client.post("/disconnect")
        self.assertEqual(disc_res.status_code, 200)
        self.assertTrue(disc_res.json()["success"])

if __name__ == "__main__":
    unittest.main()
