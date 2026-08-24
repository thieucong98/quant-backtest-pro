# RESTful API Reference
## Quant Backtest Pro Platform (English)

The local Express backend server (`server/index.ts`) exposes high-performance RESTful API endpoints for managing backtesting sessions, AI strategy definitions, historical datasets, trades, and chart drawings stored in the local SQLite database (`server/backtest.db`).

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

### 1.3. Create Session
- **Method & Route**: `POST /api/sessions`
- **Request Body**:
```json
{
  "name": "XAUUSD Scalping Session",
  "symbol": "XAUUSD",
  "timeframe": "M5",
  "initialBalance": 10000
}
```

### 1.4. Update Session
- **Method & Route**: `PUT /api/sessions/:id`

### 1.5. Delete Session
- **Method & Route**: `DELETE /api/sessions/:id`
- **Response**: `200 OK` `{ "success": true }`

---

## 2. Historical Datasets API (`/api/datasets`)

### 2.1. List Saved Datasets
- **Method & Route**: `GET /api/datasets`
- **Response**: `200 OK`

### 2.2. Save Dataset
- **Method & Route**: `POST /api/datasets`
- **Request Body**:
```json
{
  "symbol": "XAUUSD",
  "timeframe": "M5",
  "candles": [
    { "timestamp": 1740000000, "open": 2650.0, "high": 2655.0, "low": 2648.5, "close": 2654.0, "volume": 120 }
  ],
  "source": "import"
}
```

### 2.3. Delete Dataset
- **Method & Route**: `DELETE /api/datasets/:id`

---

## 3. AI Strategies API (`/api/strategies`)

### 3.1. List All Saved Strategies
- **Method & Route**: `GET /api/strategies`
- **Response**: `200 OK` Array of strategy objects from SQLite.

### 3.2. Save New Strategy
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

### 3.3. Delete Strategy
- **Method & Route**: `DELETE /api/strategies/:id`
- **Response**: `200 OK` `{ "success": true }`

---

## 4. Trades & Drawings APIs

### 4.1. Bulk Sync Trades
- **Method & Route**: `POST /api/trades/bulk-sync/:sessionId`

### 4.2. Sync Drawings
- **Method & Route**: `POST /api/drawings/sync`

---

## 5. Server Health Check

- **Method & Route**: `GET /api/health`
- **Response**: `200 OK` `{ "status": "ok", "timestamp": "2026-08-24T07:02:50.592Z" }`
