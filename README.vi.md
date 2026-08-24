# Quant Backtest Pro 🚀

> **Nền tảng Replay Đa Tài Sản, Khởi Tạo Thuật Toán AI & Xuất Bot Giao Dịch Đạt Chuẩn Tổ Chức Tài Chính (Institutional-Grade)**

[![Ngôn ngữ: Tiếng Việt](https://img.shields.io/badge/Ngôn%20ngữ-Tiếng%20Việt-red.svg)](#)
[![Language: English](https://img.shields.io/badge/Language-English-blue.svg)](README.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![CI](https://github.com/thieucong98/quant-backtest-pro/actions/workflows/ci.yml/badge.svg)](https://github.com/thieucong98/quant-backtest-pro/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-cyan.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.4-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/Storage-SQLite-003B57.svg)](https://www.sqlite.org/)

---

## 🌐 Language Navigation / Chuyển đổi ngôn ngữ
* 🇻🇳 **[Tiếng Việt (Hiện tại)](README.vi.md)**
* 🇺🇸 **[English](README.md)**

---

## 📖 Giới Thiệu Tổng Quan

**Quant Backtest Pro** là nền tảng mô phỏng, kiểm thử định lượng và tự động hóa giao dịch mã nguồn mở hiện đại hàng đầu. Hệ thống kết hợp giữa **công nghệ Replay nến 60 FPS siêu mượt (chạy trơn tru kể cả với hơn 200,000 nến)**, bộ máy khớp lệnh thực tế (OMS), **AI Strategy Studio & Bộ tối ưu tham số SL/TP (Grid Search Optimizer)**, **AI Bot Live Floating HUD**, **Data Import Manager 2.0**, lưu trữ phiên SQLite và xuất Bot giao dịch đa nền tảng chỉ với 1 click.

---

## ✨ Tính Năng Nổi Bật

```
                                  QUANT BACKTEST PRO
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                                                                                        │
 │   ┌───────────────────────┐   ┌───────────────────────┐   ┌────────────────────────┐   │
 │   │  60 FPS Replay Engine │   │  AI Strategy Studio   │   │  Tối Ưu Lưới SL/TP     │   │
 │   │  - O(1) Series Update │   │  - Hỗ trợ đa LLM      │   │  - Ma trận nhiệt 2D    │   │
 │   │  - Zero-Alloc Replay  │   │  - Thẻ tóm tắt quy tắc│   │  - Mini Sparklines SVG │   │
 │   │  - Chạy 200k+ nến mượt│   │  - 1-Click Bơm tham số│   │  - Bộ lọc thống kê     │   │
 │   └───────────────────────┘   └───────────────────────┘   └────────────────────────┘   │
 │                                                                                        │
 │   ┌───────────────────────┐   ┌───────────────────────┐   ┌────────────────────────┐   │
 │   │  Data Import Mgr 2.0  │   │  AI Bot Floating HUD  │   │  Trung Tâm Xuất Bot    │   │
 │   │  - Drag & Drop Kéo thả│   │  - PnL & Trạng thái live│ - MT5 / MT4 (MQL)     │   │
 │   │  - Smart Slicer (200k)│   │  - Pulse phát sáng    │   │  - Pine Script v5      │   │
 │   │  - Thẻ sức khỏe data  │   │  - Thu nhỏ thành Pill │   │  - Python CCXT / cBot  │   │
 │   │  - Local-First DB Lib │   │  - Phím tắt mở nhanh  │   │  - Universal JSON/JS   │   │
 │   └───────────────────────┘   └───────────────────────┘   └────────────────────────┘   │
 │                                                                                        │
 └────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1. ⚡ Động Cơ Replay Nến 60 FPS Siêu Tốc (Hỗ Trợ 200,000+ Nến)
- **Cơ chế $O(1)$ Incremental Series Update**: Cập nhật từng nến chỉ mất `0.05ms` trên TradingView Lightweight Charts, loại bỏ hoàn toàn việc vẽ lại Canvas và nghẽn rác bộ nhớ (GC thrashing) ở tốc độ tua cao (`10x` đến `100x`).
- **Tính toán chỉ báo Zero-Allocation Point-In-Time**: Các chỉ báo kỹ thuật (`SMA`, `EMA`, `RSI`, `ATR`, `Bollinger Bands`, `MACD`) tính toán trực tiếp trên độ dài thực thi mà không nhân bản mảng.
- **Tự động tổng hợp Đa Khung Thời Gian (Resampling)**: Chuyển đổi linh hoạt từ dữ liệu gốc M1 sang M5, M15, M30, H1, H4, D1, W1, MN.
- **Lịch Kinh Tế Trực Quan**: Tự động hiển thị các sự kiện tin tức vĩ mô quan trọng (FOMC, CPI, NFP, Lãi suất).

### 2. ⚡ Tối Ưu Hóa Tham Số SL/TP Đa Biến (Grid Search Optimizer)
- **Quét Lưới Tham Số Hàng Loạt**: Tự động chạy mô phỏng hàng chục cấu hình Stop Loss và Take Profit khác nhau trên dữ liệu nến thực tế.
- **Ma Trận Nhiệt Lợi Nhuận 2D Heatmap**: Nhận diện vùng tham số sinh lời ổn định (*Sweet Spot*) để hạn chế tối đa hiện tượng quá khớp (Overfitting).
- **Đường Cong Vốn Thu Nhỏ (SVG Mini Sparkline)**: Trực quan hóa quỹ đạo tăng trưởng vốn ngay trên từng dòng của bảng xếp hạng Leaderboard.
- **Bộ Lọc Chất Lượng Thống Kê**: Tùy chọn lọc nhanh `Chỉ hiện cấu hình có ý nghĩa (>= 5 lệnh)` và `Chỉ hiện cấu hình có lãi`.
- **1-Click Bơm Cấu Hình Tối Ưu**: Tự động cập nhật tham số SL/TP tốt nhất vào mã nguồn Sandbox và thẻ tóm tắt quy tắc.

### 3. 🧠 AI Strategy Studio & Thẻ Tóm Tắt Quy Tắc Vào Lệnh
- **Chuyển Đổi Ngôn Ngữ Tự Nhiên Thành Code**: Gõ *"EMA 9 cắt lên EMA 21, RSI < 70, SL 15 pips, TP 30 pips"* để nhận mã JavaScript sandbox hoàn chỉnh.
- **Thẻ Tóm Tắt Quy Tắc (Strategy Rule Cards)**: Tự động phân tích regex để hiển thị thẻ **Điều kiện BUY**, **Điều kiện SELL**, và **Quản trị Rủi ro** bằng tiếng Việt dễ hiểu.
- **Hỗ Trợ Đa Nhà Cung Cấp LLM**: OpenAI, Google Gemini, Anthropic Claude, DeepSeek, Local Ollama, và **Reverse Proxy Tunnels tùy chỉnh**.
- **Đo Độ Trễ Trực Tiếp (Live Ping)**: Kiểm tra tốc độ phản hồi và xác thực API key theo thời gian thực.

### 4. 🤖 AI Bot Live Floating HUD Widget
- **Widget Nổi Glassmorphism Đẳng Cấp**: Nằm ở góc trên bên phải biểu đồ chính với vòng xung nhịp hoạt động (Pulse Ring).
- **Theo Dõi Chỉ Số Bot Thời Gian Thực**: Hiển thị số lệnh bot đã đóng, Tỷ lệ thắng (Winrate %), Lợi nhuận ròng (Net PnL $), và Lợi nhuận thả nổi (Floating PnL).
- **Bật/Tắt Nhanh & Thu Nhỏ Gọn Gàng**: Bật/tắt Auto-Trading, thu nhỏ thành thanh Pill siêu nhỏ hoặc mở nhanh tab Studio / Tối Ưu.

### 5. 📥 Quản Lý Dữ Liệu Data Import Manager 2.0
- **Vùng Kéo - Thả (Drag & Drop Zone)**: Kéo thả file `.csv`, `.txt` với khả năng tự động nhận diện dấu phân cách (`;`, `,`, `\t`) và khớp mã symbol.
- **Thuật Toán Parse Số Nguyên Siêu Tốc**: Xử lý **1.44 triệu nến (74.4 MB) chỉ trong 3.87 giây** qua hàm `Date.UTC`.
- **Bộ Cắt Nến Thông Minh (Smart Slicer)**: Cho phép chọn `200,000 nến gần nhất (Khuyên dùng - 60 FPS)`, `100,000 nến`, `50,000 nến`, hoặc `Toàn bộ file`.
- **Thẻ Kiểm Tra Sức Khỏe Dữ Liệu (Data Health Card)**: Báo cáo tổng dòng quét, số nến hợp lệ, số nến trùng đã khử, timeframe tự động nhận diện và khoảng ngày.
- **Thư Viện Dataset Cục Bộ (Local-First DB Library)**: Lưu trữ tập dữ liệu vào Local Storage & SQLite để đổi qua lại chỉ với 1 click.
- **Tự Động Crawl Dữ Liệu Trực Tuyến**: Kéo nến lịch sử thực tế từ Binance REST API không cần API key.

### 6. 🤖 Trung Tâm Xuất Bot Giao Dịch Đa Nền Tảng
Xuất thuật toán thành mã nguồn Bot sẵn sàng triển khai thực chiến:
- **TradingView (Pine Script v5)**: Tích hợp sẵn Webhook Alert JSON cho 3Commas, Bybit, Binance, PineConnector.
- **MetaTrader 5 (MQL5 EA)**: Expert Advisor `.mq5` hoàn chỉnh với `CTrade` và quản lý rủi ro Pips.
- **MetaTrader 4 (MQL4 EA)**: Expert Advisor `.mq4` kinh điển với `OrderSend()` và Magic Number.
- **Python Bot (CCXT + Pandas-TA)**: Script Python 3 chạy 24/7 cho Binance, Bybit, OKX.
- **cTrader (C# cBot)**: Bot giao dịch `.cs` cho cTrader Automate.
- **Universal JSON Package**: Sao lưu và chia sẻ file chiến lược (`.json` / `.js`).

### 7. 🛡️ Prop Firm Risk Shield & Phân Tích Định Lượng
- **Prop Firm Shield**: Thiết lập Giới hạn Lỗ ngày (ví dụ 5%) và Mức Sụt giảm Tối đa (ví dụ 10%) kèm âm thanh và cảnh báo vi phạm.
- **Lưu Trữ Phiên Bền Vững**: Lưu tự động toàn bộ lịch sử, đường cong vốn, lệnh và nét vẽ vào SQLite (`server/backtest.db`).
- **Ma Trận So Sánh Đa Phiên**: So sánh chỉ số Win Rate, Profit Factor, Max Drawdown, Sharpe Ratio giữa các phiên.
- **Kiểm Thử Stress Test Monte Carlo**: Chạy 500 mô phỏng ngẫu nhiên tính toán xác suất cháy tài khoản và biên độ tin cậy.
- **Lịch Nhiệt Lợi Nhuận (PnL Heatmap)**: Trực quan hóa lợi nhuận theo ngày, tuần, tháng.

---

## 🚀 Hướng Dẫn Khởi Chạy Nhanh

### Yêu Cầu Hệ Thống
- [Node.js](https://nodejs.org/) (phiên bản 18.0.0 trở lên)
- [npm](https://www.npmjs.com/) (hoặc `pnpm` / `yarn`)

### 1. Clone repository
```bash
git clone https://github.com/your-username/quant-backtest-pro.git
cd quant-backtest-pro
```

### 2. Cài đặt các gói phụ thuộc
```bash
npm install
```

### 3. Khởi chạy môi trường phát triển
```bash
# Terminal 1: Khởi động Frontend Client (Vite)
npm run dev

# Terminal 2: Khởi động Backend SQLite API (Node.js + Prisma)
npm run server:start
```

Mở trình duyệt tại:
- **Ứng dụng Web**: `http://localhost:5173/`
- **Backend API Health**: `http://localhost:3001/api/health`

### 🔑 Tài Khoản Mặc Định (Developer / Institutional Account)
- **Email**: `admin@quantbacktest.pro`
- **Mật khẩu**: `QuantPro@2026`
- **Cấp độ**: `INSTITUTIONAL` (Mở khóa toàn bộ tính năng và không giới hạn)

---

## 📚 Mục Lục Tài Liệu

| Tài liệu Tiếng Việt | English Documentation |
| :--- | :--- |
| 📘 [Hướng dẫn sử dụng](docs/vi/USER_GUIDE.md) | 📘 [User Guide](docs/USER_GUIDE.md) |
| 🛠️ [Tài liệu lập trình viên](docs/vi/DEVELOPER_GUIDE.md) | 🛠️ [Developer Guide](docs/DEVELOPER_GUIDE.md) |
| 🏛️ [Kiến trúc hệ thống](docs/vi/ARCHITECTURE.md) | 🏛️ [System Architecture](docs/ARCHITECTURE.md) |
| 🤖 [Hướng dẫn xuất Bot giao dịch](docs/vi/STRATEGY_BOT_EXPORTER.md) | 🤖 [Strategy Bot Exporter Guide](docs/STRATEGY_BOT_EXPORTER.md) |
| 🔌 [Tài liệu API RESTful](docs/vi/API_REFERENCE.md) | 🔌 [API Reference](docs/API_REFERENCE.md) |

---

## 📄 Bản Quyền & Giấy Phép

Phát hành dưới giấy phép mã nguồn mở **MIT License**. Xem chi tiết tại [LICENSE](LICENSE).
