# Hướng Dẫn Dành Cho Lập Trình Viên (Developer Guide)
## Nền Tảng Quant Backtest Pro (Tiếng Việt)

Tài liệu này cung cấp cho các nhà phát triển và người đóng góp mã nguồn mở thông tin chi tiết về cấu trúc thư mục, vòng đời động cơ Replay 60 FPS, mô hình chỉ báo Zero-Allocation, cách mở rộng thuật toán tối ưu lưới SL/TP, trình chuyển đổi Bot giao dịch và tầng lưu trữ SQLite cục bộ.

---

## 1. Cấu Trúc Mã Nguồn (Codebase Organization)

```
quant-backtest-pro/
├── src/
│   ├── components/                 # Các Component Giao diện React
│   │   ├── chart/                  # TradingViewChart (Cập nhật O(1)), DrawingCanvas
│   │   ├── header/                 # Header, SymbolSearchModal, TimeframeDropdown, QuickStats
│   │   ├── panels/                 # AIStrategyModal, AIBotHUD, DataImportModal, ExportStrategyModal,
│   │   │                           # SessionManagerModal, AnalyticsDashboardModal, OrderEntryModal
│   │   └── replay/                 # ReplayBar, PositionsTable, ProQuickDock
│   ├── engine/                     # Các Động Cơ Định Lượng Cốt Lõi
│   │   ├── aiService.ts            # Trừu tượng hóa nhà cung cấp LLM (OpenAI, Gemini, Claude, Proxy Tunnel)
│   │   ├── strategyOptimizer.ts    # Tối ưu lưới SL/TP đa biến, 2D Heatmap & SVG Mini Sparklines
│   │   ├── csvParser.ts            # Parse số nguyên Date.UTC siêu tốc với Smart Slicer (200k/100k/Full)
│   │   ├── orderMatchingEngine.ts  # Khớp lệnh, Margin, SL/TP, Trailing Stop, Prop Firm Shield
│   │   ├── strategySandbox.ts      # Sandbox thực thi JavaScript thuật toán an toàn
│   │   ├── strategyExporter.ts     # Bộ xuất Bot (MT5, MT4, Pine Script v5, Python CCXT, cTrader, JSON)
│   │   ├── analytics.ts            # Tính Sharpe, Max Drawdown, Mô phỏng Monte Carlo 500 vòng
│   │   ├── indicators.ts           # Chỉ báo Zero-Allocation Point-In-Time (SMA, EMA, RSI, MACD, BB, ATR)
│   │   ├── resampler.ts            # Động cơ tự động tổng hợp đa khung thời gian
│   │   └── dataCrawler.ts          # Bộ cào dữ liệu nến trực tuyến (Binance REST API)
│   ├── store/                      # Quản Lý Trạng Thái Tập Trung Zustand
│   │   ├── backtestStore.ts        # Vòng lặp replay, nến, lệnh, nét vẽ, đồng bộ throttled
│   │   └── authStore.ts            # Thông tin người dùng và trạng thái xác thực
│   ├── types/                      # Định nghĩa kiểu dữ liệu TypeScript
│   │   ├── market.ts               # Candle, Instrument, Timeframe, DrawingObject
│   │   ├── trade.ts                # Order, Position, AccountState
│   │   └── strategy.ts             # AIStrategyDefinition, OptimizationResultItem, IndicatorLibrary
│   ├── i18n/                       # Bản dịch đa ngôn ngữ (en, vi, ja, zh)
│   └── api/                        # Client API RESTful kết nối backend SQLite (sessions, trades, datasets)
├── server/                         # Máy Chủ Backend Express API
│   ├── index.ts                    # Điểm khởi chạy server (Cổng 3001)
│   ├── routes/                     # Các tuyến Express (sessions, trades, datasets, strategies)
│   └── prisma/                     # Lược đồ SQLite & Migrations (server/backtest.db)
└── docs/                           # Toàn Bộ Tài Liệu Kỹ Thuật & Hướng Dẫn Sử Dụng
```

---

## 2. Quy Trình Phát Triển & Đóng Gói (Development Lifecycle)

### 2.1. Cài Đặt & Khởi Chạy Cục Bộ
```bash
# Cài đặt các gói phụ thuộc
npm install

# Terminal 1: Khởi động Frontend Client (Vite)
npm run dev

# Terminal 2: Khởi động Backend API SQLite (Express + Prisma)
npm run server:start
```

### 2.2. Kiểm Tra Kiểu Dữ Liệu & Đóng Gói Production
```bash
# Kiểm tra TypeScript và đóng gói bản build
npm run build
```

---

## 3. Các Mô Hình Thiết Kế Hiệu Năng Cao (High-Performance Design Patterns)

### 3.1. Mô Hình Cập Nhật Biểu Đồ $O(1)$ Incremental
Khi phát triển các tính năng liên quan đến biểu đồ trong `TradingViewChart.tsx`:
- Tránh gọi `series.setData()` trong vòng lặp tua nến tốc độ cao.
- Sử dụng `series.update(candle)` và `volumeSeries.update(volume)` khi `currentIndex === lastRenderedIndex + 1`.
- Chỉ sử dụng `series.setData()` khi nạp dataset mới, đổi Timeframe, hoặc kéo thanh trượt Scrubber.

### 3.2. Mô Hình Chỉ Báo Zero-Allocation Point-In-Time
Khi bổ sung chỉ báo mới trong `src/engine/indicators.ts`:
- Tính toán dựa trên `this.effectiveLength` thay vì `this.candles.length`.
- Tuyệt đối không gọi `this.candles.slice()` trong các hàm chỉ báo để tránh nghẽn rác bộ nhớ (GC thrashing).

```typescript
// Ví dụ: Chỉ báo SMA Zero-Allocation
public sma(period: number, offset: number = 0): number {
  const effLen = this.effectiveLength ?? this.candles.length;
  const endIndex = effLen - 1 - offset;
  if (endIndex < period - 1 || period <= 0) return 0;

  let sum = 0;
  for (let i = endIndex - period + 1; i <= endIndex; i++) {
    sum += this.candles[i].close;
  }
  return sum / period;
}
```

---

## 4. Mở Rộng Bộ Tối Ưu Lưới SL/TP (Optimizer)

Mở tệp `src/engine/strategyOptimizer.ts`:
- `simulateSingleRun`: Chạy mô phỏng kiểm thử một cấu hình duy nhất trên chuỗi nến lịch sử.
- `runGridSearch`: Quét lưới toàn bộ các tổ hợp tham số SL và TP do người dùng cấu hình.
- `replaceSLTPInCode`: Bơm tham số `slPips` và `tpPips` tối ưu trực tiếp vào chuỗi mã nguồn thuật toán.

---

## 5. Nguyên Tắc Bảo Mật & Đóng Góp Mã Nguồn Mở

1. **Tuyệt đối không commit API keys, private tokens hoặc endpoints bảo mật vào git**.
2. Lưu trữ thông tin đăng nhập của người dùng an toàn trong `localStorage` hoặc biến môi trường `.env`.
3. Luôn chạy `npm run build` trước khi tạo Pull Request để đảm bảo 0 lỗi biên dịch TypeScript.
