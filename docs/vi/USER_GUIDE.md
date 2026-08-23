# HƯỚNG DẪN SỬ DỤNG CHI TIẾT (USER GUIDE)
## QUANT BACKTEST PRO (TIẾNG VIỆT)

Chào mừng bạn đến với **Quant Backtest Pro** - Nền tảng kiểm thử định lượng và mô phỏng giao dịch đa tài sản chuyên nghiệp.

---

## 1. GIAO DIỆN CHÍNH & ĐIỀU KHIỂN REPLAY

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [EURUSD] [M15] | [Replay: Play/Pause/Speed] | Balance: $10,000 | [AI Studio] │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                         TRADINGVIEW CANDLESTICK CHART                        │
│                         (Vẽ: Trendline, Fibo, Box, Measure)                  │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ [Dock: Vị thế mở (0)] [Lịch sử lệnh (12)] [AI Logs] | [Thao tác nhanh: BE]  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 1.1. Thanh Công Cụ Replay
- **Nút Play / Pause (Phím tắt: Space)**: Bắt đầu hoặc tạm dừng quá trình tua nến lịch sử.
- **Nút Step Forward (Phím tắt: Phím mũi tên Phải $\rightarrow$)**: Tiến tới 1 cây nến tiếp theo.
- **Thanh trượt Tốc độ (Speed Slider)**: Điều chỉnh tốc độ tua từ `0.1x` đến `50x`.
- **Chọn Khung Thời Gian (Timeframe)**: Chuyển đổi linh hoạt giữa M1, M5, M15, M30, H1, H4, D1, W1, MN.

---

## 2. VÀO LỆNH & QUẢN TRỊ RỦI RO

### 2.1. Đặt Lệnh Nhanh (One-Click Dock)
- Sử dụng các nút **BUY** / **SELL** trên thanh Dock bên dưới biểu đồ.
- Tự động tính toán khối lượng Lot, Stop Loss và Take Profit theo Pips định sẵn.

### 2.2. Modal Vào Lệnh Nâng Cao (New Order Modal)
- Bấm nút **"Vào Lệnh" (New Order)** trên Header (Phím tắt: `O`).
- Hỗ trợ đầy đủ:
  - **Market Order**: Khớp ngay theo giá thị trường (Ask / Bid).
  - **Limit Order**: Buy Limit (giá thấp hơn thị trường), Sell Limit (giá cao hơn thị trường).
  - **Stop Order**: Buy Stop, Sell Stop.
  - **Quản lý rủi ro**: Cài đặt Trailing Stop, tính toán tự động tỷ lệ R:R (Risk/Reward).

### 2.3. Lá Chắn Quỹ Giao Dịch (Prop Firm Shield)
- Giúp bạn luyện thi tài khoản quỹ (FTMO, MFF, The Funded Trader, v.v.):
  - **Max Daily Loss (Lỗ tối đa trong ngày)**: Ví dụ 5%.
  - **Max Total Drawdown (Sụt giảm vốn tối đa)**: Ví dụ 10%.
- Khi vi phạm ngưỡng an toàn, hệ thống sẽ tự động phát âm thanh cảnh báo và khóa quyền vào lệnh mới trong phiên.

---

## 3. AI STRATEGY STUDIO & TỰ ĐỘNG GIAO DỊCH (AUTO-TRADING)

### 3.1. Cấu Hình Nhà Cung Cấp AI (Multi-LLM Config)
1. Bấm nút **AI Studio** trên Header.
2. Chuyển sang tab **LLM Config**.
3. Chọn nhà cung cấp:
   - **Custom OpenAI-Compatible / Proxy Tunnel**: Hỗ trợ endpoint riêng của bạn (nhập Base URL, API Key, Model ID tùy ý).
   - **OpenAI / OpenRouter / Groq / Gemini / DeepSeek / Claude / Local Ollama**.
4. Bấm **"Kiểm Tra Kết Nối"** để đo độ trễ mạng thực tế và xác nhận API hoạt động.

### 3.2. Sinh Mã Chiến Lược Tự Động
1. Trong tab **Studio & Sandbox**, nhập mô tả bằng ngôn ngữ tự nhiên. Ví dụ:
   > *"Chiến lược lướt sóng: Mua khi EMA 9 cắt lên EMA 21, Bán khi EMA 9 cắt xuống EMA 21 kèm SL 15 pips, TP 30 pips"*
2. Bấm **"Tạo Chiến Lược AI"** $\rightarrow$ Hệ thống sẽ sinh mã JavaScript hoàn chỉnh.
3. Bấm **"Activate & Run"** $\rightarrow$ Hệ thống tự động biên dịch, bật cờ Auto-Trading, đóng modal và bắt đầu tua nến khớp lệnh tự động.

---

## 4. XUẤT BOT GIAO DỊCH ĐA NỀN TẢNG (BOT EXPORTER HUB)

Bấm nút **"Xuất Bot" (Export Bot)** trong AI Studio hoặc danh sách chiến lược đã lưu:
- 🌲 **TradingView (Pine Script v5)**: Dán vào Pine Editor trên TradingView, tích hợp sẵn Webhook Alert JSON.
- 📈 **MetaTrader 5 (MQL5 EA)**: Tải file `.mq5`, mở MetaEditor (F4) và bấm F7 để Compile thành EA chạy trên sàn MT5.
- 📊 **MetaTrader 4 (MQL4 EA)**: Tải file `.mq4` chạy trên sàn MT4.
- 🐍 **Python Bot (CCXT)**: Tải file `.py` chạy trên VPS/Server kết nối Binance/Bybit.
- ⚡ **cTrader cBot**: File `.cs` hiệu năng cao cho cTrader.
- 📦 **Universal JSON Package**: Sao lưu và chia sẻ file `.json` chiến lược.

---

## 5. QUẢN LÝ PHIÊN LÀM VIỆC & BÁO CÁO PHÂN TÍCH

### 5.1. Quản Lý Phiên (Session Manager)
- Mọi thao tác đều được tự động lưu bền vững vào SQLite (`server/backtest.db`).
- Cho phép tạo phiên mới, tải lại phiên cũ hoặc xóa phiên không cần thiết.
- **So sánh Đa Phiên**: Chọn 2 hay nhiều phiên để hiển thị bảng ma trận đối chiếu trực quan (Win Rate, Profit Factor, Max Drawdown).

### 5.2. Báo Cáo Định Lượng (Analytics Modal)
- **Đường cong Vốn (Equity Curve)**: Trực quan hóa tăng trưởng tài khoản theo thời gian.
- **Mô phỏng Monte Carlo (500 chu kỳ)**: Đánh giá rủi ro xác suất cháy tài khoản (Risk of Ruin).
- **Bản đồ nhiệt PnL**: Theo dõi phân bố lợi nhuận theo ngày/tuần/tháng.
