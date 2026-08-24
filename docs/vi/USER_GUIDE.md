# Hướng Dẫn Sử Dụng (User Guide)
## Nền Tảng Quant Backtest Pro (Tiếng Việt)

Chào mừng bạn đến với **Quant Backtest Pro** — nền tảng kiểm thử định lượng, mô phỏng thị trường 60 FPS, tối ưu hóa thuật toán AI và xuất Bot giao dịch đa nền tảng đạt chuẩn tổ chức tài chính.

---

## 0. Đăng Nhập & Tài Khoản Mặc Định
Khi mở ứng dụng lần đầu, bấm nút **Đăng Nhập** ở góc trên bên phải màn hình:
- **Tài khoản nhà phát triển / Tổ chức có sẵn**:
  - **Email**: `admin@quantbacktest.pro`
  - **Mật khẩu**: `QuantPro@2026`
  - **Cấp độ**: `INSTITUTIONAL` (Mở khóa toàn bộ tính năng và không giới hạn)
- **Đăng nhập 1-Click**: Bấm nút **1-Click** ngay trên đầu modal để đăng nhập tức thì mà không cần gõ mật khẩu.
- **Tạo tài khoản cá nhân**: Chuyển sang tab **Đăng Ký** để tạo tài khoản giao dịch của riêng bạn.

---

## 1. Không Gian Làm Việc & Điều Khiển Replay 60 FPS

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [XAUUSD] [M5] | [Replay: Phát/Tạm dừng/Tốc độ] | Vốn: $10,000 | [AI Studio] │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                         BIỂU ĐỒ NẾN LIGHTWEIGHT CHARTS                       │
│                         (Công cụ vẽ: Trendline, Fibo, Hộp, Thước)            │
│                                                                              │
│                                                ┌───────────────────────────┐ │
│                                                │ AI BOT FLOATING HUD [ON]  │ │
│                                                │ Lệnh: 18 | Winrate: 67%   │ │
│                                                │ PnL Bot: +$1,420.50       │ │
│                                                └───────────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────────┤
│ [Bảng: Vị thế mở (0)] [Lịch sử lệnh (18)] [Logs AI] | [Thao tác nhanh: BE]  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 1.1. Thanh Công Cụ Replay Hiệu Năng Cao
- **Phát / Tạm dừng (Phím tắt: Phím Cách / Space)**: Bắt đầu hoặc dừng tua nến từng bước.
- **Bước tới 1 nến (Phím tắt: Mũi tên Phải $\rightarrow$ hoặc phím F)**: Tua tới đúng 1 nến tiếp theo.
- **Lùi lại 1 nến (Phím tắt: Mũi tên Trái $\leftarrow$ hoặc Ctrl+Z)**: Quay lại 1 nến trước đó.
- **Bộ chọn Tốc độ Tua**: Tùy chỉnh tốc độ từ `1x` (1 nến/giây) đến `100x` (Tốc độ tối đa). Nhờ công nghệ render $O(1)$ Incremental, biểu đồ chuyển động mượt mà ở **60 FPS** tuyệt đối ngay cả khi nạp hơn 200,000 nến.
- **Bộ chọn Khung Thời Gian (Timeframe)**: Tự động tổng hợp nến tức thời sang M1, M5, M15, M30, H1, H4, D1, W1, MN.

---

## 2. 📥 Quản Lý Dữ Liệu Data Import Manager 2.0

Bấm nút **Dữ liệu (Data)** trên thanh điều hướng đầu trang:

### 2.1. Kéo - Thả Nạp File CSV / TXT
1. Kéo thả file dữ liệu lịch sử `.csv` hoặc `.txt` vào vùng Dropzone phát sáng.
2. Hệ thống tự động nhận diện dấu phân cách (`;`, `,`, `\t`) và tên symbol (ví dụ `XAU_5m_data.csv` $\rightarrow$ `XAUUSD`).
3. **Bộ Cắt Nến Thông Minh (Smart Range Slicer)**:
   - `200,000 nến gần nhất (Khuyên dùng - 60 FPS)`: Nạp 200k nến mới nhất để đạt tốc độ tối đa.
   - `100,000 nến` / `50,000 nến` / `Toàn bộ file (Full Dataset)`.
4. **Thẻ Báo Cáo Chất Lượng Dữ Liệu (Data Health Card)**: Xem tổng dòng quét, số nến hợp lệ, số nến trùng đã khử, timeframe nhận diện và dải ngày.
5. **Bảng Xem Trước Dữ Liệu**: Kiểm tra 5 dòng đầu tiên để xác nhận đúng cột OHLCV trước khi bấm "Nạp Vào Biểu Đồ".

### 2.2. Thư Viện Dataset Cục Bộ (Tab Thư Viện Dataset)
- Mọi tập dữ liệu đã import được lưu trữ trong bộ nhớ Local và SQLite Database.
- Chuyển đổi giữa các mã tài sản và dữ liệu lịch sử chỉ với 1 click (`Nạp Vào Biểu Đồ`) mà không cần upload lại file dung lượng lớn.

### 2.3. Tự Động Crawl Dữ Liệu Trực Tuyến
- Kéo nến lịch sử thực tế từ Binance REST API (1m, 5m, 15m, 1h, 4h, 1d) hoàn toàn miễn phí không cần API key.

---

## 3. 🧠 AI Strategy Studio & Tối Ưu Lưới SL/TP Đa Biến

### 3.1. Khởi Tạo Chiến Lược Bằng Ngôn Ngữ Tự Nhiên
1. Bấm nút **AI Strategy** trên Header.
2. Trong tab **Studio & Sandbox**, mô tả ý tưởng giao dịch (VD: *"EMA 9 cắt EMA 21, RSI < 65, SL 20 pips, TP 40 pips"*).
3. Bấm **"Tạo Chiến Lược AI"** để nhận mã nguồn JavaScript sandbox hoàn chỉnh.
4. **Thẻ Tóm Tắt Quy Tắc (Strategy Rule Cards)**: Đọc tóm tắt tự động về **Điều kiện BUY**, **Điều kiện SELL**, và **Quản trị Rủi ro**.

### 3.2. Bộ Tối Ưu Lưới Tham Số SL/TP (Grid Search Optimizer)
1. Chuyển sang tab **⚡ Tối Ưu SL/TP**.
2. Thiết lập dải quét:
   - **Dải Stop Loss**: Min, Max, Bước nhảy (Pips).
   - **Dải Take Profit**: Min, Max, Bước nhảy (Pips).
   - Hoặc bấm **Preset theo Symbol** để tự điền dải tham số chuẩn theo loại tài sản.
3. Bấm **"🚀 Bắt đầu Quét & Tối Ưu Hóa"**:
   - Chạy mô phỏng hàng loạt trên dữ liệu nến thực tế.
   - **Ma trận nhiệt 2D Heatmap**: Nhận diện vùng tham số ổn định (*Sweet Spot*) tránh over-fitting.
   - **Đường cong vốn SVG Mini Sparkline**: Hiển thị quỹ đạo vốn trực quan trên từng dòng xếp hạng.
   - **Bộ Lọc Chất Lượng Thống Kê**: Tích chọn `Số lệnh >= 5` và `Net PnL > 0` để loại bỏ các kết quả ăn may.
4. Bấm **"Áp Dụng Cấu Hình Này"** trên cấu hình top 1 để tự động bơm tham số tối ưu vào thuật toán.

---

## 4. 🤖 AI Bot Live Floating HUD Widget

Khi bật Auto-Trading, một Widget nổi Glassmorphism xuất hiện ở góc trên bên phải biểu đồ:
- **Pulse Phát Sáng Trạng Thái**: Vòng xanh nhấp nháy báo hiệu Bot đang trực chiến; vòng vàng báo hiệu Bot đang giữ lệnh.
- **Thống Kê Trực Tiếp**: Số lệnh bot đã đóng, Tỷ lệ thắng (Winrate %), Lợi nhuận ròng (Net PnL $), và Lợi nhuận thả nổi (Floating PnL).
- **Thao Tác Nhanh**: Bật/Tắt Auto-Trading, thu nhỏ thành thanh Pill siêu nhỏ hoặc mở nhanh tab Studio / Tối Ưu.

---

## 5. 🛡️ Khớp Lệnh Thực Tế & Quản Trị Rủi Ro

### 5.1. Bảng Khớp Lệnh Nhanh & Đường Giá Trực Quan
- Bấm **BUY** hoặc **SELL** trên thanh Dock góc trái trên biểu đồ.
- Các đường Entry, Stop Loss (kèm số tiền rủi ro $ và % vốn), Take Profit (kèm số tiền lợi nhuận) hiển thị trực quan trên biểu đồ nến.

### 5.2. Lá Chắn Quỹ Giao Dịch (Prop Firm Shield)
- Cài đặt **Giới Hạn Lỗ Ngày** (VD: 5%) và **Mức Sụt Giảm Tối Đa** (VD: 10%).
- Cảnh báo âm thanh và hình ảnh tự động ngắt giao dịch nếu vượt ngưỡng rủi ro.

---

## 6. 🤖 Trung Tâm Xuất Bot Giao Dịch Đa Nền Tảng

Bấm **"Xuất Bot"** trong AI Studio để tải mã nguồn Bot:
- 🌲 **TradingView (Pine Script v5)**: Dán vào Pine Editor với Webhook Alert JSON cho 3Commas, Bybit, Binance, PineConnector.
- 📈 **MetaTrader 5 (MQL5 EA)**: File `.mq5` Expert Advisor hoàn chỉnh; bấm F7 trong MetaEditor để biên dịch.
- 📊 **MetaTrader 4 (MQL4 EA)**: File `.mq4` Expert Advisor kinh điển với `OrderSend()` và Magic Number.
- 🐍 **Python Bot (CCXT)**: Script Python 3 chạy 24/7 tự động trên Binance, Bybit, OKX.
- ⚡ **cTrader (C# cBot)**: Robot `.cs` cho cTrader Automate.
- 📦 **Universal JSON Package**: Sao lưu và chia sẻ file chiến lược (`.json` / `.js`).

---

## 7. 📊 Phân Tích Định Lượng & Quản Lý Phiên

- **Lưu Trữ Bền Vững SQLite**: Toàn bộ lịch sử lệnh, đường cong vốn, nét vẽ được lưu vĩnh viễn trong `server/backtest.db`.
- **Ma Trận So Sánh Đa Phiên**: So sánh chỉ số Win Rate, Profit Factor, Max Drawdown, Sharpe Ratio giữa nhiều phiên khác nhau.
- **Mô Phỏng Stress Test Monte Carlo (500 vòng)**: Đo lường xác suất rủi ro cháy tài khoản và khoảng tin cậy.
- **Lịch Nhiệt Lợi Nhuận (PnL Heatmap)**: Trực quan hóa lợi nhuận theo ngày, tuần, tháng.
