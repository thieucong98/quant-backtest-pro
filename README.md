# ⚡ QUANT BACKTEST PRO
### Nền Tảng Web Replay, Kiểm Thử Giao Dịch Đa Tài Sản & Phát Triển Chiến Lược AI Định Lượng

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB.svg?style=flat-square&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF.svg?style=flat-square&logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.x-38B2AC.svg?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![TradingView Charts](https://img.shields.io/badge/Lightweight%20Charts-v4.x-131722.svg?style=flat-square)](https://tradingview.github.io/lightweight-charts/)
[![Build Status](https://img.shields.io/badge/Build-Passing-22c55e.svg?style=flat-square)]()
[![License](https://img.shields.io/badge/License-MIT-purple.svg?style=flat-square)]()

---

## 🌟 GIỚI THIỆU TỔNG QUAN

**Quant Backtest Pro** là một nền tảng Backtesting & Trading Simulation thế hệ mới chạy hoàn toàn trên trình duyệt Web. Nền tảng kết hợp sự mượt mà của **TradingView**, sức mạnh mô phỏng lệnh chuyên nghiệp của **Soft4FX / Forex Tester**, hệ thống nhật ký giao dịch của **TradeZella**, cùng với năng lực sinh mã thuật toán tự động của **Trí tuệ nhân tạo (AI Copilot & Sandbox)**.

Ứng dụng hỗ trợ giao dịch kiểm thử đa tài sản bao gồm: **Forex** (`EURUSD`, `GBPUSD`, `USDJPY`, `GBPJPY`, `AUDUSD`), **Kim loại quý** (`XAUUSD`, `XAGUSD`), **Crypto** (`BTCUSD`, `ETHUSD`) và **Chỉ số** (`DXY`, `US30`).

---

## 🚀 TÍNH NĂNG NỔI BẬT

### 1. 📊 Charting Engine & Drawing Canvas Siêu Mượt (60 FPS)
- Tích hợp **TradingView Lightweight Charts v4.x** với nến Nhật và Volume Histogram.
- Lớp Canvas trong suốt hỗ trợ đầy đủ công cụ vẽ kỹ thuật: **Trendline**, **Horizontal Ray**, **Fibonacci Retracement (7 mức)**, **Supply/Demand Box**, **Measure khoảng cách Pips/Bars**.
- Tự động vẽ đường giá **Entry**, **Stop Loss (Nét đứt đỏ)**, **Take Profit (Nét đứt xanh)** cho từng vị thế.

### 2. ⚡ One-Click Quick Trading Dock & Pro Actions
- Ghim thanh đặt lệnh nhanh ngay trên biểu đồ: Nút **BUY**, **SELL**, ô nhập Lot, tùy chọn `Auto SL` và `Auto TP` tính theo pips.
- Nút **"Set BE" (Hòa vốn)**: 1 click dời Stop Loss về đúng giá Entry + spread để khóa an toàn.
- Nút **"Cắt 50%" (Partial Close)**: Đóng 1/2 khối lượng lệnh để chốt lời vào Balance và thả trôi phần còn lại.
- Quản lý **Trailing Stop** tự động bám theo đỉnh/đáy nến mới.

### 3. ⏪ Điều Khiển Replay & Đa Khung Thời Gian (Multi-Timeframe)
- Tua nến từ tốc độ `1x` đến `100x (Max Speed)`.
- Nút **Step +1 (Tới nến)** và **Step -1 (Lùi nến)**.
- Động cơ **Timeframe Resampler** chuyển đổi tức thời giữa các khung thời gian `M1`, `M5`, `M15`, `M30`, `H1`, `H4`, `D1`.

### 4. 🔴 Lịch Tin Tức Kinh Tế Lịch Sử (Historical Economic News Markers)
- Tự động quét và đánh dấu các mốc tin tức mạnh (**Non-Farm Payrolls, CPI, Lãi suất FED/FOMC, ECB**) bằng icon **🔴 Chấm Đỏ** ngay trên nến.

### 5. 🤖 AI Strategy Studio & Copilot Runner
- **Tạo chiến lược bằng Prompt tự nhiên**: Nhập mô tả chiến lược (ví dụ: *"EMA 20 cắt EMA 50 kết hợp RSI < 35"*), AI sẽ tự động sinh mã JavaScript Sandbox.
- **Tự động giao dịch (Auto-Trading)**: Bot tự động quét nến, tính chỉ báo và thực thi lệnh kèm mũi tên tín hiệu BUY/SELL trên chart.

### 6. 📈 Báo Cáo Định Lượng & Mô Phỏng Monte Carlo (1,000 Chu kỳ)
- Đồ thị SVG tăng trưởng vốn **Equity & Balance Curve**.
- Thống kê toàn diện: **Win Rate %, Profit Factor, Max Drawdown %, Sharpe Ratio, Sortino Ratio, Risk:Reward, Consecutive Wins/Losses**.
- **Mô phỏng Monte Carlo 1,000 chu kỳ**: Dự báo xác suất sụt giảm vốn kịch bản xấu nhất và tỷ lệ Cháy tài khoản (**Risk of Ruin %**).
- **Trading Heatmap Matrix**: Phân tích hiệu suất theo 24 khung giờ và 5 ngày trong tuần.
- Xuất toàn bộ lịch sử lệnh ra file **CSV** chuẩn.

### 7. 🌐 Đa Ngôn Ngữ & Xác Thực SSO Toàn Diện
- Hỗ trợ 4 ngôn ngữ: 🇻🇳 **Tiếng Việt**, 🇺🇸 **English**, 🇯🇵 **日本語**, 🇨🇳 **中文**.
- Đăng nhập 1 click qua **Google SSO**, **GitHub SSO**, **Apple ID** hoặc Email/Password.
- Quản lý hồ sơ cá nhân, gói hạng thành viên (`FREE`, `PRO VIP`, `INSTITUTIONAL`).

---

## 🏆 MA TRẬN SO SÁNH VỚI CÁC CÔNG CỤ TRÊN THỊ TRƯỜNG

| Tính năng | TradingView Replay | Soft4FX / FXReplay | Forex Tester 6 | TradeZella | ⭐ **Quant Backtest Pro** |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Nền tảng** | Web Cloud | MT4 / Web | Windows Desktop | Web Cloud | 🟢 **Web Hiện đại (React + TS)** |
| **Giao diện & Độ mượt** | ⭐⭐⭐⭐⭐ | ⭐⭐ / ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 🟢 **⭐⭐⭐⭐⭐ (Glassmorphism Dark)** |
| **OMS Quản lý lệnh** | ❌ Sơ sài | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ❌ | 🟢 **⭐⭐⭐⭐⭐ (One-Click, BE, Partial Close)** |
| **Replay Điều tốc & Step -1** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ❌ | 🟢 **⭐⭐⭐⭐⭐ (1x-100x, Step +1 & -1)** |
| **Tích hợp AI Strategy** | ❌ | ❌ | ❌ | ❌ | 🟢 **⭐⭐⭐⭐⭐ (Prompt-to-Code & Auto-trade)** |
| **Mô phỏng Monte Carlo** | ❌ | ❌ | ⭐⭐⭐ | ❌ | 🟢 **⭐⭐⭐⭐⭐ (1,000 runs SVG)** |
| **Tin tức Kinh tế Lịch sử** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ❌ | 🟢 **⭐⭐⭐⭐⭐ (News Markers trên nến)** |
| **Đa ngôn ngữ & SSO** | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | 🟢 **⭐⭐⭐⭐⭐ (VI, EN, JA, ZH + SSO)** |

---

## ⌨️ BẢNG PHÍM TẮT THỰC CHIẾN

| Phím | Tác vụ |
| :--- | :--- |
| **`Space`** | **Play / Pause** vòng lặp phát nến |
| **`F`** | **Step Forward +1** nến tiếp theo |
| **`Ctrl + Z`** / **`Cmd + Z`** | **Step Backward -1** lùi nến trong quá khứ |
| **`B`** | Mở nhanh bảng **Đặt lệnh (Order Ticket)** |
| **`Escape`** | Đóng tất cả các bảng Modal / Popup |
| **`1, 2, 3, 4`** | Chuyển nhanh Khung thời gian (`M1`, `M5`, `H1`, `D1`) |

---

## 🛠️ HƯỚNG DẪN CÀI ĐẶT & CHẠY DỰ ÁN

### Yêu cầu hệ thống
- **Node.js**: Phiên bản `>= 18.x`
- **NPM** hoặc **Yarn / PNPM**

### 1. Cài đặt Dependencies
```bash
git clone https://github.com/your-username/quant-backtest-pro.git
cd quant-backtest-pro
npm install
```

### 2. Chạy Môi trường Phát triển (Development Server)
```bash
npm run dev
```
Mở trình duyệt truy cập: `http://localhost:5173/`

### 3. Đóng gói Bản Production
```bash
npm run build
```

---

## 📚 TÀI LIỆU CHI TIẾT
- 📖 [Hướng dẫn Sử dụng A-Z (User Guide)](file:///d:/Project/Backtest/docs/USER_GUIDE.md)
- 🛠️ [Đặc tả Kỹ thuật & Phát triển (Developer Guide)](file:///d:/Project/Backtest/docs/DEVELOPER_GUIDE.md)
- 🏛️ [Tài liệu Kiến trúc Hệ thống (Architecture Specification)](file:///d:/Project/Backtest/docs/ARCHITECTURE.md)

---

## 📄 GIẤY PHÉP (LICENSE)
Dự án được phân phối dưới giấy phép **MIT License**.
