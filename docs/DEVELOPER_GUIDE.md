# HƯỚNG DẪN PHÁT TRIỂN & ĐẶC TẢ KỸ THUẬT (DEVELOPER & ARCHITECTURE GUIDE)
## NỀN TẢNG QUANT BACKTEST PRO

Tài liệu này dành cho **Software Engineers, Full-Stack Developers và Quantitative Researchers** muốn hiểu sâu về kiến trúc hệ thống, các công thức toán học tài chính định lượng, và cách mở rộng/đóng góp mã nguồn cho dự án **Quant Backtest Pro**.

---

## MỤC LỤC
1. [Tech Stack & Tổng quan Kiến trúc](#1-tech-stack--tổng-quan-kiến-trúc)
2. [Cấu trúc Thư mục Dự án](#2-cấu-trúc-thư-mục-dự-án)
3. [Động cơ Toán học Đa Tài sản (Quant Math Engine)](#3-động-cơ-toán-học-đa-tài-sản-quant-math-engine)
4. [Hệ thống Khớp lệnh (Order Matching Engine - OMS)](#4-hệ-thống-khớp-lệnh-order-matching-engine---oms)
5. [Động cơ Tổng hợp Khung thời gian (Timeframe Resampler)](#5-động-cơ-tổng-hợp-khung-thời-gian-timeframe-resampler)
6. [Thư viện Chỉ báo Kỹ thuật Thời gian thực (Indicators Engine)](#6-thư-viện-chỉ-báo-kỹ-thuật-thời-gian-thực-indicators-engine)
7. [AI Sandbox Execution & Safe Strategy Runner](#7-ai-sandbox-execution--safe-strategy-runner)
8. [Động cơ Thống kê Định lượng & Mô phỏng Monte Carlo](#8-động-cơ-thống-kê-định-lượng--mô-phỏng-monte-carlo)
9. [Cơ sở Dữ liệu Cục bộ IndexedDB (Dexie.js)](#9-cơ-sở-dữ-liệu-cục-bộ-indexeddb-dexiejs)
10. [Hướng dẫn Mở rộng Tính năng (How-To Extensibility)](#10-hướng-dẫn-mở-rộng-tính-năng-how-to-extensibility)
    - Thêm một Tài sản Giao dịch Mới (New Instrument)
    - Thêm một Chỉ báo Kỹ thuật Mới (New Technical Indicator)
    - Tích hợp Nhà cung cấp LLM Mới (New LLM Provider)
11. [Quy chuẩn Kiểm thử & Git Commit Convention](#11-quy-chuẩn-kiểm-thử--git-commit-convention)

---

## 1. TECH STACK & TỔNG QUAN KIẾN TRÚC

Hệ thống được xây dựng hoàn toàn bằng **TypeScript Strict Mode** trên nền React 18+ và Vite với triết lý thiết kế **Decoupled High-Frequency Simulation Architecture**:

| Thành phần | Công nghệ sử dụng | Mục đích & Trách nhiệm |
| :--- | :--- | :--- |
| **Giao diện & UI** | React 18, Tailwind CSS, Lucide Icons | Render giao diện người dùng theo chuẩn Glassmorphism |
| **Quản lý State** | Zustand | Single Source of Truth cho toàn bộ vòng đời Replay & OMS |
| **Đồ thị Biểu đồ** | TradingView Lightweight Charts v4.x | Render nến Canvas 60 FPS, Volume Histogram và Markers |
| **Lớp Vẽ Kỹ thuật** | HTML5 Transparent Canvas 2D | Vẽ Trendline, Fibonacci, Box, Measure đồng bộ tọa độ |
| **Cơ sở dữ liệu** | Dexie.js (IndexedDB) | Lưu trữ hàng triệu nến M1 cục bộ tại trình duyệt |
| **Phân tích CSV** | PapaParse | Đọc và parse dữ liệu CSV siêu tốc từ các nguồn MT4/MT5/TV |
| **Mô phỏng Quant** | TypeScript Custom Math Core | Tính toán PnL, Margin, Monte Carlo 1,000 runs, Heatmap |

---

## 2. CẤU TRÚC THƯ MỤC DỰ ÁN

```
d:/Project/Backtest/
├── docs/                        # Tài liệu hướng dẫn sử dụng & phát triển
│   ├── USER_GUIDE.md
│   ├── DEVELOPER_GUIDE.md
│   └── ARCHITECTURE.md
├── src/
│   ├── components/              # Giao diện người dùng
│   │   ├── auth/                # Modal Đăng nhập/Đăng ký SSO & Hồ sơ cá nhân
│   │   ├── chart/               # Lightweight Charts wrapper & DrawingCanvas
│   │   ├── header/              # Header, Symbol selector, Timeframe, Tools
│   │   ├── panels/              # Modals: OrderEntry, AIStrategy, Analytics, Data
│   │   └── replay/              # ReplayBar điều khiển tua nến
│   ├── config/                  # Cấu hình tài sản, tin tức mẫu, generator
│   │   ├── instruments.ts       # Bảng đặc tả hợp đồng Forex, Gold, Crypto, Indices
│   │   ├── newsEvents.ts        # Cơ sở dữ liệu tin tức kinh tế lịch sử
│   │   └── sampleData.ts        # Trình sinh nến Geometric Brownian Motion
│   ├── engine/                  # Lõi Động cơ Tính toán & Xử lý Dữ liệu
│   │   ├── analytics.ts         # Performance metrics, Monte Carlo & Heatmap
│   │   ├── csvParser.ts         # Trình nhận diện & phân tích CSV đa định dạng
│   │   ├── db.ts                # Khởi tạo schema IndexedDB (Dexie.js)
│   │   ├── indicators.ts        # SMA, EMA, RSI, MACD, Bollinger Bands, ATR
│   │   ├── orderMatchingEngine.ts # Khớp lệnh Market/Limit/Stop, Trailing, Stop Out
│   │   ├── quantMath.ts         # Pip Value, Margin, PnL, Commission, Swap math
│   │   ├── resampler.ts         # Tổng hợp nến M1 -> M5, M15, M30, H1, H4, D1
│   │   └── strategySandbox.ts   # Môi trường thực thi code AI Strategy an toàn
│   ├── i18n/                    # Hệ thống đa ngôn ngữ (VI, EN, JA, ZH)
│   │   └── translations.ts
│   ├── store/                   # Quản lý State tập trung (Zustand)
│   │   ├── authStore.ts         # User session, login, register, SSO
│   │   └── backtestStore.ts     # Replay state, OMS, active drawings, modals
│   ├── types/                   # TypeScript interfaces & types
│   │   ├── auth.ts
│   │   ├── market.ts
│   │   ├── order.ts
│   │   └── strategy.ts
│   ├── App.tsx                  # Root component & Global Keyboard listener
│   ├── index.css                # Glassmorphism utilities & theme tokens
│   └── main.tsx                 # Entrypoint
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 3. ĐỘNG CƠ TOÁN HỌC ĐA TÀI SẢN (QUANT MATH ENGINE)

Tất cả các phép tính tài chính định lượng được đóng gói trong `src/engine/quantMath.ts`:

### 3.1. Tính Giá trị Pip (Pip Value per Lot)
$$\text{Pip Value} = \text{Lot Size} \times \text{Contract Size} \times \text{Pip Size} \times \text{Conversion Rate}$$

- **Cặp có USD đứng sau (`EURUSD`, `GBPUSD`)**:
  $$\text{Pip Value} = 1.0 \times 100,000 \times 0.0001 = \$10.00/\text{pip}$$
- **Vàng (`XAUUSD`)**:
  $$\text{Pip Value} = 1.0 \times 100 \times 0.10 = \$10.00/\text{pip}$$
- **Bạc (`XAGUSD`)**:
  $$\text{Pip Value} = 1.0 \times 5,000 \times 0.01 = \$50.00/\text{pip}$$
- **Crypto (`BTCUSD`)**:
  $$\text{Pip Value} = 1.0 \times 1.0 \times 1.0 = \$1.00/\text{pip}$$
- **Cặp có USD đứng trước (`USDJPY`)**:
  $$\text{Pip Value} = \frac{1.0 \times 100,000 \times 0.01}{\text{Current Price}}$$

### 3.2. Tính Lợi Nhuận Khối lượng (Gross PnL)
$$\text{PnL}_{\text{BUY}} = \text{Lot Size} \times \text{Contract Size} \times (\text{Exit Price} - \text{Entry Price})$$
$$\text{PnL}_{\text{SELL}} = \text{Lot Size} \times \text{Contract Size} \times (\text{Entry Price} - \text{Exit Price})$$

### 3.3. Tính Ký Quỹ Sử Dụng (Required Margin) & Đòn Bẩy (Leverage)
$$\text{Required Margin} = \frac{\text{Lot Size} \times \text{Contract Size} \times \text{Entry Price}}{\text{Leverage}}$$

### 3.4. Tính Mức Ký Quỹ (Margin Level %) & Cơ chế Stop Out
$$\text{Margin Level (\%)} = \left( \frac{\text{Equity}}{\text{Used Margin}} \right) \times 100$$
- Khi $\text{Margin Level} < 50\%$, hệ thống kích hoạt **Stop Out Liquidation Threshold**, tự động đóng vị thế đang chịu khoản lỗ thả nổi (Floating Loss) lớn nhất.

---

## 4. HỆ THỐNG KHỚP LỆNH (ORDER MATCHING ENGINE - OMS)

Được triển khai trong `src/engine/orderMatchingEngine.ts`. Mỗi khi có một cây nến mới xuất hiện (`processCandle(candle)`), Matching Engine thực hiện quy trình 4 bước:

```
[New Candle (O, H, L, C)]
         │
         ▼
 1. Khớp Lệnh Chờ (Match Pending Limit/Stop)
    - Buy Limit / Sell Stop: candle.low <= order.price
    - Sell Limit / Buy Stop: candle.high >= order.price
         │
         ▼
 2. Cập nhật Trailing Stop Động
    - BUY: SL mới = highestPriceSinceOpen - trailingDistance
    - SELL: SL mới = lowestPriceSinceOpen + trailingDistance
         │
         ▼
 3. Kiểm tra Chạm Stop Loss / Take Profit
    - BUY: candle.low <= SL (Close SL) | candle.high >= TP (Close TP)
    - SELL: candle.high >= SL (Close SL) | candle.low <= TP (Close TP)
         │
         ▼
 4. Cập nhật Ký Quỹ & Kiểm Tra Stop Out
    - Tính Floating PnL của tất cả vị thế mở
    - Nếu Margin Level < 50% -> Cưỡng chế thanh lý vị thế lỗ nặng nhất
```

---

## 5. ĐỘNG CƠ TỔNG HỢP KHUNG THỜI GIAN (TIMEFRAME RESAMPLER)

Triển khai trong `src/engine/resampler.ts`:
- Tổng hợp nến gốc M1 thành các khung thời gian lớn hơn (`M5`, `M15`, `M30`, `H1`, `H4`, `D1`).
- Đảm bảo tính toán chính xác:
  $$\text{Open} = \text{Candle}_{0}.\text{open}$$
  $$\text{High} = \max(\text{Candle}_{i}.\text{high})$$
  $$\text{Low} = \min(\text{Candle}_{i}.\text{low})$$
  $$\text{Close} = \text{Candle}_{N-1}.\text{close}$$
  $$\text{Volume} = \sum \text{Candle}_{i}.\text{volume}$$

---

## 6. THƯ VIỆN CHỈ BÁO KỸ THUẬT THỜI GIAN THỰC (INDICATORS ENGINE)

Triển khai trong `src/engine/indicators.ts`:
- **`sma(period, source)`**: Simple Moving Average.
- **`ema(period, source)`**: Exponential Moving Average với hệ số nhân trọng số $k = \frac{2}{\text{period} + 1}$.
- **`rsi(period, source)`**: Relative Strength Index sử dụng công thức mượt mà của Wilder (Wilder's Smoothed Moving Average).
- **`macd(fast, slow, signal, source)`**: MACD Line, Signal Line và MACD Histogram.
- **`bollingerBands(period, stdDev, source)`**: Upper Band, Middle (SMA), Lower Band.
- **`atr(period)`**: Average True Range đo lường độ biến động thực tế.

---

## 7. AI SANDBOX EXECUTION & SAFE STRATEGY RUNNER

Triển khai trong `src/engine/strategySandbox.ts`:
- Chiến lược AI được biên dịch thông qua một Function Constructor được cô lập, ngăn chặn truy cập trực tiếp vào `window`, `document`, hoặc các API độc hại.
- Mỗi nến, hàm `onCandle(candle, indicators, account, api)` được thực thi với các tham số:
  - `candle`: Dữ liệu OHLCV của nến hiện tại.
  - `indicators`: Thư viện tính toán tức thì `sma()`, `ema()`, `rsi()`, `macd()`, `bollingerBands()`, `atr()`.
  - `account`: Trạng thái `balance`, `equity`, `freeMargin`, `openPositions`.
  - `api`: Các phương thức hành động `buy()`, `sell()`, `closePosition()`, `closeAll()`, `modifySLTP()`, `log()`.

---

## 8. ĐỘNG CƠ THỐNG KÊ ĐỊNH LƯỢNG & MÔ PHỎNG MONTE CARLO

Triển khai trong `src/engine/analytics.ts`:
- **Mô phỏng Monte Carlo (1,000 Iterations)**: Sử dụng thuật toán xáo trộn Fisher-Yates trên mảng PnL của các lệnh lịch sử để mô phỏng 1,000 chu kỳ thực tế, tính toán phân phối xác suất Max Drawdown và rủi ro cháy tài khoản (Risk of Ruin %).
- **Trading Heatmap Matrix**: Tổng hợp PnL và Win Rate theo 24 khung giờ và 5 ngày trong tuần.
- **Tỷ số Sharpe & Sortino**: Đo lường lợi nhuận trên đơn vị rủi ro tổng thể và rủi ro giảm giá (downside deviation).

---

## 9. CƠ SỞ DỮ LIỆU CỤC BỘ INDEXEDDB (DEXIE.JS)

Triển khai trong `src/engine/db.ts`:
- Bảng `candles`: Lưu trữ nến theo composite key `[symbol+timeframe+timestamp]`.
- Bảng `sessions`: Lưu trữ các phiên backtest, số dư khởi tạo, danh sách vị thế và bản vẽ.
- Bảng `strategies`: Lưu trữ các chiến lược AI của người dùng.

---

## 10. HƯỚNG DẪN MỞ RỘNG TÍNH NĂNG (HOW-TO EXTENSIBILITY)

### 10.1. Cách Thêm một Loại Tài sản Mới (New Instrument)
Mở file `src/config/instruments.ts` và thêm vào object `INSTRUMENTS`:
```typescript
SOLUSD: {
  symbol: 'SOLUSD',
  name: 'Solana / US Dollar',
  category: 'CRYPTO',
  contractSize: 1,
  pipSize: 0.01,
  digits: 2,
  defaultSpreadPips: 5,
  minLot: 0.1,
  maxLot: 100,
  lotStep: 0.1,
  leverage: 20,
  commissionPerLot: 0,
  commissionType: 'PERCENTAGE',
  commissionValue: 0.0005, // 0.05%
  swapLongPips: -2.0,
  swapShortPips: 0.5
}
```

### 10.2. Cách Thêm một Chỉ báo Kỹ thuật Mới (New Indicator)
Mở file `src/engine/indicators.ts` và thêm phương thức vào class `IndicatorCalculator`:
```typescript
public stochastic(kPeriod: number = 14, dPeriod: number = 3): { k: number; d: number } {
  // Logic tính toán %K và %D
  return { k, d };
}
```

---

## 11. QUY CHUẨN KIỂM THỬ & GIT COMMIT CONVENTION

### Kiểm tra Mã nguồn & Build
```bash
# Chạy TypeScript type-checking và Vite production bundle build
npm run build
```

### Quy chuẩn Đặt tên Commit (Conventional Commits)
- `feat(scope)`: Thêm tính năng mới (ví dụ: `feat(i18n): add japanese language`).
- `fix(scope)`: Sửa lỗi (ví dụ: `fix(chart): fix marker sort order ascending`).
- `perf(scope)`: Tối ưu hiệu năng render (ví dụ: `perf(canvas): optimize 60fps overlay`).
- `docs(scope)`: Cập nhật tài liệu (ví dụ: `docs(guide): add developer manual`).
