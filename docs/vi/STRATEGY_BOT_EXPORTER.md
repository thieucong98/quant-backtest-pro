# HƯỚNG DẪN XUẤT BOT GIAO DỊCH ĐA NỀN TẢNG (STRATEGY BOT EXPORTER GUIDE)
## QUANT BACKTEST PRO (TIẾNG VIỆT)

Tài liệu này hướng dẫn chi tiết cách sử dụng trung tâm **Bot Exporter & Transpiler** để chuyển đổi chiến lược định lượng thành bot giao dịch tự động trên **MetaTrader 5**, **MetaTrader 4**, **TradingView**, **Python CCXT**, và **cTrader**.

---

## 1. TỔNG QUAN CÁC NỀN TẢNG HỖ TRỢ

| Nền tảng | Đuôi File | Thư viện / Công nghệ | Cách chạy thực tế |
| :--- | :--- | :--- | :--- |
| **TradingView (Pine v5)** | `.pine` / `.txt` | Pine Script v5 `strategy()` | Dán vào Pine Editor, tạo Alert gửi Webhook sang 3Commas/Bybit |
| **MetaTrader 5 (MQL5)** | `.mq5` | `#include <Trade\Trade.mqh>` | Mở MetaEditor (F4) $\rightarrow$ Compile (F7) $\rightarrow$ Kéo EA vào chart MT5 |
| **MetaTrader 4 (MQL4)** | `.mq4` | MQL4 `OrderSend()` | Mở MetaEditor 4 $\rightarrow$ Compile (F7) $\rightarrow$ Gắn vào chart MT4 |
| **Python Algo Bot** | `.py` | `ccxt`, `pandas-ta`, `schedule` | Cài `pip install ccxt pandas-ta` $\rightarrow$ Chạy `python bot.py` trên VPS |
| **cTrader cBot** | `.cs` | C# .NET `cAlgo.API` | Mở cTrader Automate $\rightarrow$ Tạo cBot mới $\rightarrow$ Build (Ctrl+B) |
| **Universal JSON** | `.json` | Schema JSON v2 | Dùng để backup, chia sẻ và Import lại vào AI Studio |

---

## 2. HƯỚNG DẪN CÀI ĐẶT TỪNG BƯỚC

### 2.1. Triển khai trên MetaTrader 5 (MT5 EA)
1. Trong AI Studio, bấm nút **"Xuất Bot"** và chọn tab **MetaTrader 5 Expert Advisor (MQL5)**.
2. Bấm **"Tải file (.mq5)"** hoặc bấm **"Sao chép"**.
3. Mở ứng dụng MetaTrader 5 trên máy tính, nhấn phím **F4** để mở trình biên dịch **MetaEditor**.
4. Nhấn **Ctrl + N** (Tạo mới) $\rightarrow$ Chọn **Expert Advisor (template)** $\rightarrow$ Đặt tên file (ví dụ: `QuantAI_EA`).
5. Dán toàn bộ mã nguồn MQL5 đã copy vào và nhấn **F7 (Compile)**. Đảm bảo thanh trạng thái báo `0 errors, 0 warnings`.
6. Quay lại màn hình MT5, mở cửa sổ Navigator (Ctrl + N), kéo EA vừa tạo thả vào biểu đồ cặp tiền muốn giao dịch.
7. Bật nút **"Algo Trading"** trên thanh công cụ của MT5 để kích hoạt giao dịch tự động.

### 2.2. Triển khai trên TradingView (Pine Script v5 & Webhook Alert)
1. Trong AI Studio, chọn tab **TradingView Pine Script (v5)** và bấm **"Sao chép"**.
2. Mở [TradingView.com](https://www.tradingview.com/) trên trình duyệt, mở biểu đồ cặp tiền tương ứng.
3. Mở tab **"Pine Editor"** ở thanh công cụ đáy màn hình.
4. Xóa code cũ, dán mã Pine Script v5 vào và bấm **"Save"** $\rightarrow$ **"Add to chart"**.
5. Bấm vào biểu tượng **Đồng hồ (Create Alert)** trên biểu đồ để tạo cảnh báo tự động:
   - Mục **Webhook URL**: Điền link Webhook từ sàn hoặc bot trung gian (ví dụ: PineConnector, 3Commas).
   - Mục **Message**: Hệ thống đã tự động gán payload JSON chuẩn (`{{strategy.order.alert_message}}`).

### 2.3. Triển khai Bot Python (CCXT) trên VPS Linux / Windows
1. Tải file `.py` về máy tính hoặc server.
2. Cài đặt các thư viện cần thiết qua Terminal:
   ```bash
   pip install ccxt pandas pandas-ta schedule
   ```
3. Mở file `bot.py` bằng trình soạn thảo và điền API Key & Secret của sàn (Binance / Bybit / OKX).
4. Chạy bot bằng lệnh:
   ```bash
   python bot.py
   # Hoặc chạy nền 24/7 trên Linux bằng nohup:
   nohup python3 bot.py > bot.log 2>&1 &
   ```

---

## 3. TÍNH NĂNG IMPORT & EXPORT FILE JSON

- **Xuất file JSON**: Chọn tab **Universal Strategy Package (JSON)** để tải file `.json` chứa toàn bộ thông số, metadata và code chiến lược.
- **Nhập file JSON**: Trong tab **My Strategies (DB)**, bấm nút **"Nhập Chiến Lược (.json/.js)"** để nạp file chiến lược từ máy tính trực tiếp vào cơ sở dữ liệu SQLite.
