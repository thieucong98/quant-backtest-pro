"""
Unit & Integration Tests for MT5 Micro-Gateway
"""
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

if __name__ == "__main__":
    unittest.main()
