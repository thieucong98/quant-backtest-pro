# HƯỚNG DẪN SỬ DỤNG CHI TIẾT (USER GUIDE)
## NỀN TẢNG QUANT BACKTEST PRO

Chào mừng bạn đến với **Quant Backtest Pro** — Nền tảng Replay, Kiểm thử Giao dịch Thủ công & Phát triển Thuật toán AI Đa Tài sản (Forex, Vàng XAUUSD, Bạc XAGUSD, Crypto BTC/ETH và Chỉ số DXY/US30) chạy trực tiếp trên nền tảng Web với hiệu năng 60 FPS mượt mà.

---

## MỤC LỤC
1. [Khởi động & Giao diện Tổng quan](#1-khởi-động--giao-diện-tổng-quan)
2. [Quản lý Dữ liệu Lịch sử & Chọn Tài sản](#2-quản-lý-dữ-liệu-lịch-sử--chọn-tài-sản)
3. [Điều khiển Replay Nến & Đa Khung Thời Gian](#3-điều-khiển-replay-nến--đa-khung-thời-gian)
4. [Thao tác Vào lệnh & Quản lý Vị thế Nâng cao](#4-thao-tác-vào-lệnh--quản-lý-vị-thế-nâng-cao)
   - One-Click Quick Trade Dock
   - Cửa sổ Lệnh Chuyên sâu (Order Ticket Modal)
   - Tính năng Set Breakeven (Hòa vốn)
   - Tính năng Cắt 50% Lot (Partial Close)
   - Quản trị Trailing Stop động
5. [Công cụ Vẽ Kỹ thuật & Phân tích Đồ thị](#5-công-cụ-vẽ-kỹ-thuật--phân-tích-đồ-thị)
6. [Theo dõi Sự kiện Tin tức Kinh tế Lịch sử](#6-theo-dõi-sự-kiện-tin-tức-kinh-tế-lịch-sử)
7. [AI Strategy Studio & Tự Động Giao Dịch](#7-ai-strategy-studio--tự-động-giao-dịch)
8. [Đọc Báo cáo Định lượng, Monte Carlo & Heatmap](#8-đọc-báo-cáo-định-lượng-monte-carlo--heatmap)
9. [Đăng ký, Đăng nhập SSO & Hồ sơ Cá nhân](#9-đăng-ký-đăng-nhập-sso--hồ-sơ-cá-nhân)
10. [Bảng Phím tắt Toàn cục (Keyboard Shortcuts)](#10-bảng-phím-tắt-toàn-cục-keyboard-shortcuts)

---

## 1. KHỞI ĐỘNG & GIAO DIỆN TỔNG QUAN

Giao diện của Quant Backtest Pro được thiết kế theo phong cách Dark Mode hiện đại, chia thành 4 khu vực chính:
1. **Thanh Header (Phía trên cùng)**:
   - Logo & Tên nền tảng.
   - Bộ chọn Tài sản (Symbol Selector).
   - Bộ chọn Khung thời gian (`M1`, `M5`, `M15`, `M30`, `H1`, `H4`, `D1`).
   - Thanh công cụ vẽ nhanh (Trendline, Horizontal Ray, Fibonacci, Supply/Demand Box, Measure).
   - Thông số tài khoản thời gian thực (`Balance`, `Equity`, `Floating PnL`).
   - Các nút chức năng chính: **Vào lệnh**, **AI Studio**, **Báo cáo**, **Data**, **Phím tắt**, **Đổi ngôn ngữ (VI/EN/JA/ZH)** và **Hồ sơ/Đăng nhập SSO**.
2. **Khu vực Biểu đồ Chính (Trung tâm)**:
   - Đồ thị nến Nhật (Candlestick) & Khối lượng (Volume) của TradingView Lightweight Charts.
   - Thanh đặt lệnh nhanh **One-Click Quick Trading Dock** (góc trên bên trái biểu đồ).
   - Các đường giá động: Giá Vào Lệnh (Xanh/Đỏ nét liền), Stop Loss (Đỏ nét đứt), Take Profit (Xanh nét đứt).
3. **Thanh Điều khiển Tua Nến Replay (Phía dưới biểu đồ)**:
   - Các nút: `Step -1` (Lùi nến), `Play / Pause`, `Step +1` (Tới nến), `Reset` (Làm mới).
   - Bộ điều tốc Replay từ `1x` (1 nến/giây) đến `100x (Max Speed)`.
   - Thanh trượt tiến trình (Timeline Scrubber) và Đồng hồ thời gian UTC.
4. **Bảng Quản lý Lệnh & Nhật ký Giao dịch (Dưới cùng)**:
   - Tab **Vị thế mở (Open Positions)**: Quản lý lệnh đang chạy, nút `Set BE`, nút `Cắt 50%`, sửa SL/TP và đóng lệnh.
   - Tab **Lệnh chờ (Pending Orders)**: Quản lý các lệnh Limit / Stop.
   - Tab **Lịch sử (Trade History)**: Xem toàn bộ các lệnh đã đóng kèm lý do thoát lệnh (SL, TP, Manual).
   - Tab **AI Strategy Logs**: Nhật ký tín hiệu vào/ra lệnh của bot AI.

---

## 2. QUẢN LÝ DỮ LIỆU LỊCH SỬ & CHỌN TÀI SẢN

### 2.1. Đổi Tài sản Giao dịch
- Bấm vào tên tài sản trên Header (Mặc định: `XAUUSD`).
- Modal danh mục tài sản sẽ mở ra với 4 phân khúc:
  - 🪙 **GOLD / METALS**: `XAUUSD` (Vàng 100oz), `XAGUSD` (Bạc 5,000oz).
  - 💱 **FOREX**: `EURUSD`, `GBPUSD`, `USDJPY`, `GBPJPY`, `AUDUSD`.
  - ⚡ **CRYPTO**: `BTCUSD`, `ETHUSD`.
  - 📈 **INDICES**: `DXY` (Chỉ số Dollar Index), `US30` (Dow Jones).
- Hệ thống tự động thiết lập Contract Size, Pip Size, Leverage và Spread tương ứng chính xác với từng loại tài sản.

### 2.2. Nạp Dữ liệu Lịch sử (CSV Import)
1. Bấm nút **"Data"** trên Header.
2. Chọn tập tin CSV được xuất từ **MetaTrader 4**, **MetaTrader 5**, **TradingView**, **Dukascopy** hoặc **Binance**.
3. Hệ thống tự động nhận diện định dạng nến (`Timestamp, Open, High, Low, Close, Volume`) và lưu cục bộ vào cơ sở dữ liệu **IndexedDB** trên trình duyệt của bạn (không tốn băng thông tải lại).

---

## 3. ĐIỀU KHIỂN REPLAY NẾN & ĐA KHUNG THỜI GIAN

### 3.1. Thao tác Tua Nến
- **Phát / Dừng (Play / Pause)**: Bấm nút `Play` hoặc nhấn phím **`Space`** trên bàn phím.
- **Tới 1 nến (Step Forward +1)**: Bấm nút `Step +1` hoặc nhấn phím **`F`**.
- **Lùi 1 nến (Step Backward -1)**: Bấm nút `Step -1` hoặc nhấn tổ hợp phím **`Ctrl + Z`** (hoặc `Cmd + Z` trên Mac).
- **Tua nhanh đến một thời điểm**: Kéo thanh trượt tiến trình (Scrubber Slider) đến vị trí bạn muốn.

### 3.2. Chuyển Đổi Khung Thời Gian (Multi-Timeframe)
- Bấm chọn các nút `M1`, `M5`, `M15`, `M30`, `H1`, `H4`, `D1` trên thanh Header.
- Động cơ **Timeframe Resampler** sẽ tức thời tổng hợp lại các cây nến từ dữ liệu gốc M1 mà vẫn giữ nguyên chính xác vị trí mốc thời gian bạn đang kiểm thử.

---

## 4. THAO TÁC VÀO LỆNH & QUẢN LÝ VỊ THẾ NÂNG CAO

### 4.1. One-Click Quick Trading Dock (Đặt lệnh Nhanh trên Chart)
- Nằm ở góc trên bên trái biểu đồ.
- **Vào lệnh BUY thị trường**: Bấm nút **BUY** (Xanh ngọc).
- **Vào lệnh SELL thị trường**: Bấm nút **SELL** (Đỏ hồng).
- **Chỉnh khối lượng Lot**: Nhập số lot vào ô giữa (ví dụ: `0.10`, `0.50`, `1.00`).
- **Tự động gắn SL / TP**:
  - Tích chọn checkbox `SL` và nhập khoảng cách pips (ví dụ: `20p`).
  - Tích chọn checkbox `TP` và nhập khoảng cách pips (ví dụ: `40p`).
  - Lệnh được mở sẽ tự động có sẵn đường Stop Loss và Take Profit trên chart.

### 4.2. Tính Năng "Set BE" (Dời Stop Loss về Hòa Vốn)
- Khi giá đã đi đúng hướng và có lợi nhuận, vào bảng **"Vị thế mở"** ở dưới cùng.
- Bấm nút **"Set BE"** trong cột *Pro Actions*.
- Hệ thống sẽ tự động điều chỉnh giá Stop Loss về đúng `Entry Price + 1 pip spread` để loại bỏ hoàn toàn rủi ro thua lỗ cho lệnh.

### 4.3. Tính Năng "Cắt 50%" (Partial Close)
- Khi giá đạt 1R hoặc 2R, bấm nút **"Cắt 50%"** trên hàng của vị thế tương ứng.
- Hệ thống sẽ:
  1. Đóng 50% khối lượng lot của lệnh và chốt lợi nhuận trực tiếp vào số dư **Balance**.
  2. Giữ nguyên 50% khối lượng lot còn lại để tiếp tục gồng lãi.

---

## 5. CÔNG CỤ VẼ KỸ THUẬT & PHÂN TÍCH ĐỒ THỊ

Quant Backtest Pro tích hợp Canvas Overlay trong suốt hỗ trợ đầy đủ các công cụ vẽ:
- ↖ **Cursor**: Chế độ con trỏ chuột bình thường.
- ╱ **Trendline (Đường xu hướng)**: Click 2 điểm để vẽ đường xu hướng kèm 2 chấm neo (anchor dots).
- ➖ **Horizontal Ray (Đường ngang)**: Click 1 điểm để bắn đường hỗ trợ/kháng cự sang phải kèm nhãn mức giá.
- **Fib** **Fibonacci Retracement**: Kéo từ Đáy lên Đỉnh (hoặc ngược lại), hiển thị đầy đủ 7 mức thoái lui (`0.0`, `0.236`, `0.382`, `0.5`, `0.618 Golden Pocket`, `0.786`, `1.0`) kèm dải màu trực quan.
- ⛶ **Supply / Demand Box**: Kéo thả để tạo vùng cản Khối Cung (Màu đỏ) hoặc Khối Cầu (Màu xanh).
- 📏 **Measure (Thước đo)**: Kéo để đo chính xác số lượng Pips và số lượng Nến (Bars) giữa 2 mốc giá.
- 🗑️ **Trash**: Xóa toàn bộ các bản vẽ trên màn hình.

---

## 6. THEO DÕI SỰ KIỆN TIN TỨC KINH TẾ LỊCH SỬ

- Trên đồ thị, các cây nến rơi vào thời điểm phát hành tin tức kinh tế quan trọng (như **Non-Farm Payrolls - NFP**, **US Core CPI**, **Lãi suất FED/FOMC**, **Lãi suất ECB**) sẽ có **🔴 Icon Chấm Đỏ** nổi bật.
- Giúp bạn rèn luyện phản xạ né tin hoặc luyện chiến thuật giao dịch breakout theo tin tức.

---

## 7. AI STRATEGY STUDIO & TỰ ĐỘNG GIAO DỊCH

1. Bấm nút **"AI Studio"** trên Header.
2. **Nhập mô tả chiến lược bằng ngôn ngữ tự nhiên** vào ô Prompt (Ví dụ: *"Chiến lược EMA 20 cắt EMA 50 kết hợp RSI dưới 30 và thoát lệnh khi RSI vượt 70"*).
3. Bấm **"Tạo Chiến Lược AI"** -> AI Copilot sẽ tự động viết mã JavaScript Sandbox với hàm `onCandle(candle, indicators, account, api)`.
4. Bật công tắc **"Tự động giao dịch AI"**:
   - Khi tua nến, bot AI sẽ tự động tính toán chỉ báo, bắn lệnh BUY/SELL, dời SL/TP theo đúng thuật toán.
   - Các điểm vào lệnh của AI sẽ được vẽ mũi tên **BUY (Xanh)** và **SELL (Đỏ)** trực tiếp lên biểu đồ.

---

## 8. ĐỌC BÁO CÁO ĐỊNH LƯỢNG, MONTE CARLO & HEATMAP

Bấm nút **"Báo cáo"** trên thanh Header để mở Dashboard phân tích chuyên sâu gồm 3 Tab:

### 8.1. Tab 1: Tổng quan & Chỉ số Hiệu suất
- **Biểu đồ Tăng trưởng Vốn (Equity vs Balance Curve)** bằng đồ thị SVG trực quan.
- **Lợi nhuận ròng (Net Profit)**, **Tỷ lệ Thắng (Win Rate %)**, **Profit Factor**, **Sụt giảm tối đa (Max Drawdown % & $)**.
- **Tỷ lệ R:R trung bình**, **Expected Payoff**, **Sharpe Ratio**, **Sortino Ratio**, **Chuỗi thắng/thua dài nhất**.
- Nút **"Xuất CSV Lịch sử"**: Tải toàn bộ bảng kê lệnh về máy để lưu trữ hoặc nhập vào Excel.

### 8.2. Tab 2: Mô phỏng Monte Carlo (1,000 Chu kỳ)
- Xáo trộn ngẫu nhiên thứ tự các lệnh đã giao dịch **1,000 lần**.
- Cho biết:
  - **Lợi nhuận Trung vị (Median Profit)** bạn có thể kỳ vọng trong tương lai.
  - **Mức sụt giảm Max Drawdown trong kịch bản xấu nhất (Worst-Case DD)**.
  - **Xác suất Cháy vốn (Risk of Ruin %)**: Tỷ lệ tài khoản bị sụt giảm > 50%.

### 8.3. Tab 3: Heatmap Lợi nhuận theo Thứ & Khung Giờ
- Ma trận nhiệt phân tích hiệu suất theo 24 giờ trong ngày (00h - 23h UTC) và các thứ trong tuần (Thứ 2 đến Thứ 6).
- Giúp bạn nhận diện khung giờ "vàng" kiếm được nhiều tiền nhất và khung giờ thường xuyên bị thua lỗ để né tránh.

---

## 9. ĐĂNG KÝ, ĐĂNG NHẬP SSO & HỒ SƠ CÁ NHÂN

- Bấm nút **"Đăng nhập"** trên Header:
  - Đăng nhập 1 click qua **Google SSO**, **GitHub SSO**, hoặc **Apple ID**.
  - Hoặc đăng ký bằng **Email & Mật khẩu**.
- Sau khi đăng nhập, bấm vào Avatar góc trên cùng bên phải để mở **User Profile Modal**:
  - Xem số dư vốn Demo, số phiên Backtest đã hoàn thành, số lượng Chiến lược AI đã lưu.
  - Xem các đặc quyền của gói tài khoản (`PRO VIP` / `INSTITUTIONAL`).
  - Nút **Đăng xuất (Log Out)**.

---

## 10. BẢNG PHÍM TẮT TOÀN CỤC (KEYBOARD SHORTCUTS)

| Phím tắt | Chức năng |
| :--- | :--- |
| **`Space`** | Phát hoặc Tạm dừng Replay tua nến (**Play / Pause**) |
| **`F`** | Tới 1 cây nến tiếp theo (**Step Forward +1**) |
| **`Ctrl + Z`** / **`Cmd + Z`** | Lùi lại 1 cây nến trong quá khứ (**Step Backward -1**) |
| **`B`** | Mở nhanh cửa sổ Đặt lệnh chuyên sâu (**Order Ticket**) |
| **`Escape`** | Đóng tất cả các cửa sổ Modal / Popup đang mở |
| **`1, 2, 3, 4`** | Chuyển nhanh Khung thời gian (`M1`, `M5`, `H1`, `D1`) |
