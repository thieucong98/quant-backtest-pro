# Tài Liệu API RESTful (API Reference)
## Nền Tảng Quant Backtest Pro (Tiếng Việt)

Máy chủ backend Express cục bộ (`server/index.ts`) cung cấp các API RESTful hiệu năng cao để quản lý phiên giao dịch, thuật toán AI, tập dữ liệu nến lịch sử (datasets), lịch sử lệnh và nét vẽ biểu đồ lưu trong SQLite (`server/backtest.db`).

- **Base URL mặc định**: `http://localhost:3001/api`

---

## 1. API Quản Lý Phiên Giao Dịch (`/api/sessions`)

### 1.1. Lấy danh sách tất cả phiên
- **Phương thức & Tuyến**: `GET /api/sessions`
- **Phản hồi**: `200 OK`
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

### 1.2. Lấy chi tiết phiên theo ID
- **Phương thức & Tuyến**: `GET /api/sessions/:id`

### 1.3. Tạo phiên mới
- **Phương thức & Tuyến**: `POST /api/sessions`
- **Body yêu cầu**:
```json
{
  "name": "XAUUSD Scalping Session",
  "symbol": "XAUUSD",
  "timeframe": "M5",
  "initialBalance": 10000
}
```

### 1.4. Cập nhật phiên
- **Phương thức & Tuyến**: `PUT /api/sessions/:id`

### 1.5. Xóa phiên
- **Phương thức & Tuyến**: `DELETE /api/sessions/:id`

---

## 2. API Quản Lý Tập Dữ Liệu Lịch Sử (`/api/datasets`)

### 2.1. Lấy danh sách datasets đã lưu
- **Phương thức & Tuyến**: `GET /api/datasets`

### 2.2. Lưu dataset mới
- **Phương thức & Tuyến**: `POST /api/datasets`
- **Body yêu cầu**:
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

### 2.3. Xóa dataset
- **Phương thức & Tuyến**: `DELETE /api/datasets/:id`

---

## 3. API Quản Lý Thuật Toán AI (`/api/strategies`)

### 3.1. Lấy danh sách thuật toán
- **Phương thức & Tuyến**: `GET /api/strategies`

### 3.2. Lưu thuật toán mới
- **Phương thức & Tuyến**: `POST /api/strategies`

### 3.3. Xóa thuật toán
- **Phương thức & Tuyến**: `DELETE /api/strategies/:id`

---

## 4. API Lệnh & Nét Vẽ Biểu Đồ

### 4.1. Đồng bộ lệnh hàng loạt
- **Phương thức & Tuyến**: `POST /api/trades/bulk-sync/:sessionId`

### 4.2. Đồng bộ nét vẽ biểu đồ
- **Phương thức & Tuyến**: `POST /api/drawings/sync`

---

## 5. Kiểm Tra Sức Khỏe Máy Chủ (Health Check)

- **Phương thức & Tuyến**: `GET /api/health`
- **Phản hồi**: `200 OK` `{ "status": "ok", "timestamp": "2026-08-24T07:02:50.592Z" }`
