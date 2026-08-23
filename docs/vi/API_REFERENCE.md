# TÀI LIỆU API RESTFUL (API REFERENCE)
## QUANT BACKTEST PRO (TIẾNG VIỆT)

Máy chủ backend Express (`server/index.ts`) cung cấp các REST API endpoints để quản lý phiên giao dịch, chiến lược AI và nến lịch sử lưu trong cơ sở dữ liệu SQLite (`server/backtest.db`).

- **Base URL mặc định**: `http://localhost:3001/api`

---

## 1. BACKTEST SESSIONS API (`/api/sessions`)

### 1.1. Lấy danh sách tất cả các phiên
- **Endpoint**: `GET /api/sessions`
- **Response**: `200 OK`
```json
[
  {
    "id": "session_1740000000000",
    "name": "EURUSD M15 Trend Following",
    "symbol": "EURUSD",
    "timeframe": "M15",
    "initialBalance": 10000,
    "finalBalance": 11450.50,
    "totalTrades": 28,
    "winRate": 64.28,
    "profitFactor": 2.15,
    "maxDrawdownPercent": 3.82,
    "createdAt": "2026-08-23T12:00:00.000Z",
    "updatedAt": "2026-08-23T12:30:00.000Z"
  }
]
```

### 1.2. Lấy chi tiết một phiên
- **Endpoint**: `GET /api/sessions/:id`
- **Response**: `200 OK` (Trả về toàn bộ nến, lệnh mở/đóng, đường cong vốn và hình vẽ trên biểu đồ).

### 1.3. Lưu hoặc Tạo mới phiên
- **Endpoint**: `POST /api/sessions`
- **Body**:
```json
{
  "name": "XAUUSD Scalping Session",
  "symbol": "XAUUSD",
  "timeframe": "M5",
  "initialBalance": 10000,
  "finalBalance": 10500,
  "data": "{ \"openPositions\": [], \"closedPositions\": [], \"equityCurve\": [] }"
}
```

### 1.4. Xóa phiên
- **Endpoint**: `DELETE /api/sessions/:id`
- **Response**: `200 OK` `{ "success": true }`

---

## 2. AI STRATEGIES API (`/api/strategies`)

### 2.1. Lấy danh sách chiến lược đã lưu
- **Endpoint**: `GET /api/strategies`
- **Response**: `200 OK` Danh sách các chiến lược định lượng trong SQLite.

### 2.2. Lưu chiến lược mới
- **Endpoint**: `POST /api/strategies`
- **Body**:
```json
{
  "name": "EMA 9/21 Fast Scalper",
  "description": "Chiến lược lướt sóng nhanh cắt EMA",
  "code": "return { onCandle(candle, indicators, account, api) { ... } };",
  "parameters": { "fastEma": 9, "slowEma": 21, "slPips": 15, "tpPips": 30 },
  "enabled": true
}
```

### 2.3. Xóa chiến lược
- **Endpoint**: `DELETE /api/strategies/:id`
- **Response**: `200 OK` `{ "success": true }`

---

## 3. HEALTH CHECK API

- **Endpoint**: `GET /api/health`
- **Response**: `200 OK` `{ "status": "ok", "timestamp": 1740000000000 }`
