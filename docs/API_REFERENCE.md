# RESTful API Reference
## Quant Backtest Pro Platform (English)

The local Express backend server (`server/index.ts`) exposes RESTful API endpoints for managing backtesting sessions, AI strategy definitions, and candle history stored in the local SQLite database (`server/backtest.db`).

- **Default Base URL**: `http://localhost:3001/api`

---

## 1. Backtest Sessions API (`/api/sessions`)

### 1.1. List All Sessions
- **Method & Route**: `GET /api/sessions`
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

### 1.2. Get Session by ID
- **Method & Route**: `GET /api/sessions/:id`
- **Response**: `200 OK` (Returns full session data including candles, open/closed positions, equity curve points, and drawings).

### 1.3. Create or Update Session
- **Method & Route**: `POST /api/sessions`
- **Request Body**:
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

### 1.4. Delete Session
- **Method & Route**: `DELETE /api/sessions/:id`
- **Response**: `200 OK` `{ "success": true }`

---

## 2. AI Strategies API (`/api/strategies`)

### 2.1. List All Saved Strategies
- **Method & Route**: `GET /api/strategies`
- **Response**: `200 OK` Array of strategy objects from SQLite.

### 2.2. Save New Strategy
- **Method & Route**: `POST /api/strategies`
- **Request Body**:
```json
{
  "name": "EMA 9/21 Fast Scalper",
  "description": "Fast crossover scalper with stop loss",
  "code": "return { onCandle(candle, indicators, account, api) { ... } };",
  "parameters": { "fastEma": 9, "slowEma": 21, "slPips": 15, "tpPips": 30 },
  "enabled": true
}
```

### 2.3. Delete Strategy
- **Method & Route**: `DELETE /api/strategies/:id`
- **Response**: `200 OK` `{ "success": true }`

---

## 3. Server Health Check

- **Method & Route**: `GET /api/health`
- **Response**: `200 OK` `{ "status": "ok", "timestamp": 1740000000000 }`
