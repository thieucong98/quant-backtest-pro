# TÀI LIỆU HƯỚNG DẪN DÀNH CHO LẬP TRÌNH VIÊN (DEVELOPER GUIDE)
## QUANT BACKTEST PRO (TIẾNG VIỆT)

Tài liệu này hướng dẫn chi tiết về cấu trúc mã nguồn, các Engine cốt lõi, cách mở rộng thêm chỉ báo kỹ thuật, viết thêm mẫu Bot chuyển đổi và tương tác với REST API SQLite.

---

## 1. CẤU TRÚC THƯ MỤC DỰ ÁN

```
quant-backtest-pro/
├── src/
│   ├── components/                 # Các Component React
│   │   ├── chart/                  # ChartWrapper, CandlestickChart, DrawingCanvas
│   │   ├── header/                 # Header, SymbolSearch, TimeframeDropdown, QuickStats
│   │   ├── panels/                 # AIStrategyModal, ExportStrategyModal, SessionManagerModal,
│   │   │                           # AnalyticsDashboardModal, OrderEntryModal, SymbolSearchModal
│   │   └── common/                 # ReplayControls, PositionsTable, ProQuickDock
│   ├── engine/                     # Động cơ định lượng cốt lõi
│   │   ├── aiService.ts            # Tầng giao tiếp Multi-LLM (OpenAI, Gemini, Tunnel, etc.)
│   │   ├── orderMatchingEngine.ts  # Động cơ khớp lệnh, tính Margin, SL/TP, Prop Shield
│   │   ├── strategySandbox.ts      # Sandbox thực thi thuật toán JavaScript
│   │   ├── strategyExporter.ts     # Bộ chuyển đổi mã Bot (MT5, MT4, Pine, Python, cTrader)
│   │   ├── analytics.ts            # Tính toán Sharpe, Max Drawdown, Monte Carlo 500x
│   │   ├── indicators.ts           # SMA, EMA, RSI, MACD, Bollinger Bands, ATR, High, Low
│   │   ├── resampler.ts            # Tự động gom nến M1 sang M5, M15, H1, H4, D1
│   │   └── dataCrawler.ts          # Bộ cào dữ liệu lịch sử nến
│   ├── store/                      # Zustand Global Store
│   │   ├── backtestStore.ts        # Quản lý nến, phiên, matching engine, playback loop
│   │   └── authStore.ts            # Quản lý tài khoản người dùng
│   ├── types/                      # Định nghĩa kiểu TypeScript
│   │   ├── market.ts               # Candle, Instrument, Timeframe
│   │   ├── trade.ts                # Order, Position, AccountState
│   │   └── strategy.ts             # AIStrategyDefinition, IndicatorLibrary
│   ├── i18n/                       # Đa ngôn ngữ (translations.ts: vi, en, ja, zh)
│   └── api/                        # REST API Client kết nối SQLite backend
├── server/                         # Express REST API Server
│   ├── index.ts                    # REST Endpoints (/api/sessions, /api/strategies, /api/candles)
│   └── db.ts                       # SQLite Driver (better-sqlite3)
└── docs/                           # Tài liệu kỹ thuật hoàn chỉnh
```

---

## 2. QUY TRÌNH PHÁT TRIỂN & BUILD

### 2.1. Cài đặt và Chạy môi trường Dev
```bash
# Cài đặt thư viện
npm install

# Chạy đồng thời cả Frontend (Vite) và Backend (Express SQLite)
npm run dev
```

### 2.2. Kiểm tra lỗi Kiểu & Build Production
```bash
# Biên dịch TypeScript và đóng gói Vite
npm run build
```

---

## 3. CÁCH VIẾT VÀ MỞ RỘNG MÃ NGUỒN

### 3.1. Thêm một chỉ báo kỹ thuật mới vào `indicators.ts`
Mở file `src/engine/indicators.ts` và thêm phương thức tính toán vào class `IndicatorCalculator`:

```typescript
// Ví dụ: Thêm chỉ báo Stochastic Oscillator
public stochastic(kPeriod: number = 14, dPeriod: number = 3, offset: number = 0): { k: number; d: number } {
  // Logic tính toán trên this.candles
  return { k: 80, d: 75 };
}
```

Đồng thời thêm hàm vào `IndicatorLibrary` trong `src/types/strategy.ts` để AI Sandbox có thể tự động gọi `indicators.stochastic()`.

### 3.2. Mở rộng thêm nền tảng Bot vào `strategyExporter.ts`
Mở file `src/engine/strategyExporter.ts`:
1. Thêm id nền tảng vào type `ExportPlatform` (ví dụ `'ninjatrader'`).
2. Thêm thông tin mô tả vào `EXPORT_PLATFORMS`.
3. Viết phương thức sinh mã `public static toNinjaTrader(strategy, symbol): string`.

---

## 4. QUY TẮC AN TOÀN BẢO MẬT KHI ĐÓNG GÓP (SECURITY RULES)

1. **Tuyệt đối không lưu API Key, Token bí mật, hoặc Endpoint riêng tư vào mã nguồn hay tài liệu**.
2. Luôn dùng biến môi trường hoặc lưu trữ trong `localStorage` phía client.
3. Chạy `npm run build` trước khi tạo Pull Request để đảm bảo 0 lỗi TypeScript.
