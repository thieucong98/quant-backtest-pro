# 🧠 Hướng Dẫn Sử Dụng Apex AI Copilot - Cẩm Nang Tác Chiến

> **Hệ Thống Trợ Lý Giao Dịch Định Lượng Smart Money Concepts (SMC), Truyền Phát CoT Thời Gian Thực & Tự Động Chuẩn Hóa Tỷ Lệ Rủi Ro : Lợi Nhuận (R:R)**  
> *Đối tượng sử dụng: Trader chuyên nghiệp, Chuyên gia định lượng, Lập trình viên thuật toán*  
> *Ngôn ngữ: Tiếng Việt (Bản địa hóa) | [English Edition](docs/APEX_AI_COPILOT_GUIDE.md)*

---

## 1. Tổng Quan & Triết Lý Kiến Trúc

**Apex AI Copilot** là trợ lý giao dịch định lượng cao cấp được tích hợp trực tiếp trên khung biểu đồ của QuantBacktest Pro. Được thiết kế chuyên biệt cho phương pháp giao dịch **Smart Money Concepts (SMC)** theo tiêu chuẩn tổ chức tài chính, hệ thống kết hợp 4 trụ cột công nghệ:
1. **Kiến Trúc Định Tuyến Kép (Dual-Tier Routing)**: Kết nối mượt mà với các mô hình ngôn ngữ lớn (OpenAI GPT-4o, DeepSeek, Google Gemini, Anthropic Claude, Ollama Local LLMs trên máy cá nhân, hoặc Cloudflare Reverse Proxy Tunnel) đồng thời hỗ trợ chuyển đổi dự phòng tức thì về **Bộ vi xử lý thuật toán SMC nội bộ (Local Algorithmic SMC Engine)** hoàn toàn ngoại tuyến và không phụ thuộc API.
2. **Cơ Chế Chuẩn Hóa Tỷ Lệ R:R Động (Dynamic Risk-to-Reward Calibration)**: Sử dụng bộ phân tích cú pháp thực thể tài chính và ý định thông minh (Financial Entity & Intent Parser) hiểu ngôn ngữ tự nhiên tiếng Việt và tiếng Anh (ví dụ: `"Rủi ro / Lợi nhuận? tôi muốn tỉ lệ lợi nhuận là 1:3"`, `"R:R 1:4"`, `"SL 15 pip, TP 60 pip"`), tự động điều chỉnh khoảng cách Chốt lời (Take Profit) để đáp ứng chính xác kỳ vọng quản trị vốn của trader.
3. **Quy Tắc Kiểm Soát Cấu Trúc Tổ Chức (Institutional Guardrails)**: Ngăn chặn các lệnh sai lầm theo cấu trúc thị trường (không mua tại vùng Premium, không bán tại vùng Discount), đồng thời bảo đảm tỷ lệ R:R luôn đạt chuẩn kỳ vọng toán học.
4. **Minh Bạch Hóa Động Cơ Suy Luận (Engine Telemetry)**: Hiển thị nhãn động cơ đang phản hồi trực tiếp ngay trên thanh tiêu đề HUD (`[⚡ Thuật toán SMC]` hoặc `[🧠 Model AI]`), giúp trader luôn biết rõ nguồn gốc của tín hiệu phân tích.

---

## 2. Giao Diện & Tiện Ích Trực Quan

```
+--------------------------------------------------------------+
| [:::] [🧠] Apex AI Copilot (●) [⚡ Thuật toán SMC] [⚙] [◀] [▶] [-] [X] |
+--------------------------------------------------------------+
| [✨ Copilot]   [🥞 MTF Matrix]   [⚡ Chẩn đoán]              |
+--------------------------------------------------------------+
| [CHUỖI SUY LUẬN CHAIN-OF-THOUGHT STREAMING]                  |
| • Cặp tài sản: XAUUSD | Khung thời gian: M5                  |
| • Multi-Timeframe Bias: H4 BULLISH, D1 BULLISH               |
| • Fibonacci Dealing Range: VÙNG CÂN BẰNG EQUILIBRIUM         |
| • Khớp tỷ lệ R:R mục tiêu: 1:3.00 (Trader chỉ định 1:3)      |
| • Thông số vị thế: Giá vào 2654.48 | Cắt lỗ: 2652.48         |
|   | Chốt lời: 2660.48 (60 pips) | Độ tin cậy: 85%            |
+--------------------------------------------------------------+
| [KẾ HOẠCH HÀNH ĐỘNG]                          [LONG / MUA]   |
| Giá vào: 2654.48000   |   Cắt lỗ: 2652.48000 (20 pips)       |
| Chốt lời: 2660.48000 (60 pips)                               |
| R:R: 1 : 3.00 (✨ Đã chuẩn hóa) | Độ tin cậy: 85%            |
| [ ✔ Áp dụng kế hoạch ]                                       |
+--------------------------------------------------------------+
| HỎI COPILOT              (?) Hướng dẫn câu lệnh              |
| [ Rủi ro / Lợi nhuận? tôi muốn tỉ lệ lợi nhuận là 1:3      ] |
|                                                              |
| Gợi ý nhanh & Chip R:R:                                      |
| [🎯 R:R 1:3] [🎯 R:R 1:2] [🎯 R:R 1:4] [✨ Giá vào tốt nhất?]|
| [ Gửi ]  [ Hủy ]                  [ ] Tự động vào lệnh (Tắt) |
+--------------------------------------------------------------+
```

### Các Chi Tiết Điểm Nhấn Trên Giao Diện:
- **Huy hiệu Động cơ Phản hồi (`[⚡ Thuật toán SMC]` / `[🧠 Model AI]`)**: Nằm ngay cạnh tên Copilot. Khi rê chuột sẽ hiển thị tooltip giải thích công cụ đang chạy và hướng dẫn đổi nhà cung cấp.
- **Nút Cài Đặt Nhanh Gateway & Provider (`[⚙]`)**: Nằm trên thanh tiêu đề HUD, bấm vào để mở/đóng thẻ cấu hình nhà cung cấp LLM, Base URL, Model và API Key trực tiếp mà không cần rời khỏi màn hình biểu đồ.
- **Biểu tượng Hướng dẫn tương tác (`(?)`)**: Nằm cạnh dòng chữ "HỎI COPILOT". Bấm vào để mở bảng hướng dẫn câu lệnh và cú pháp chuẩn.
- **Nút chọn nhanh Tỷ lệ R:R (`[🎯 R:R 1:3]`, `[🎯 R:R 1:2]`, `[🎯 R:R 1:4]`)**: Bấm 1 chạm là câu lệnh yêu cầu tỷ lệ R:R tương ứng sẽ tự động được điền và gửi ngay đến AI mà không cần phải gõ thủ công.
- **Thẻ Kế hoạch Hành động (Action Plan)**: Hiển thị chi tiết Giá vào, Cắt lỗ, Chốt lời, Tỷ lệ R:R làm nổi bật màu xanh ngọc khi đạt $\ge 1:3$, cùng 4 tiêu chí kiểm tra tổ chức:
  - `HTF Bias trùng` (Xu hướng đa khung đồng thuận).
  - `Chạm POI chính` (Đã chạm vùng Order Block hoặc FVG mục tiêu).
  - `Quét thanh khoản` (Đã diễn ra Liquidity Sweep xác nhận bẫy giá).
  - `LTF CHoCH` (Xác nhận đảo chiều cấu trúc khung thời gian nhỏ).

---

## 3. Cú Pháp Câu Lệnh Được Hỗ Trợ

Bộ bóc tách ý định tài chính của Copilot hỗ trợ cả tiếng Việt, tiếng Anh và thuật ngữ giao dịch viết tắt:

### A. Tùy Biến Tỷ Lệ Rủi Ro : Lợi Nhuận (R:R)
| Câu Lệnh Mẫu Từ Người Dùng | Tỷ Lệ R:R Nhận Diện | Tác Động Tính Toán Thực Tế |
| :--- | :---: | :--- |
| `"Rủi ro / Lợi nhuận? tôi muốn tỉ lệ lợi nhuận là 1:3"` | **1:3.0** | SL giữ 20 pips, TP tự động co giãn lên 60 pips ($60 / 20 = 3.0$) |
| `"R:R 1:4"` hoặc `"tỉ lệ 1:4"` | **1:4.0** | SL giữ 20 pips, TP tự động co giãn lên 80 pips ($80 / 20 = 4.0$) |
| `"tỉ lệ lợi nhuận 1:2.5"` | **1:2.5** | SL giữ 20 pips, TP điều chỉnh thành 50 pips ($50 / 20 = 2.5$) |
| `"1:3"` hoặc `"1/3"` | **1:3.0** | Tự động tính Take Profit gấp 3 lần khoảng cách rủi ro Cắt lỗ |

### B. Chỉ Định Khoảng Cách SL & TP Theo Pip
| Câu Lệnh Mẫu Từ Người Dùng | Thông Số Trích Xuất | Tác Động Tính Toán Thực Tế |
| :--- | :--- | :--- |
| `"SL 15 pip, TP 60 pip"` | SL = 15 pips, TP = 60 pips | Tự động tính ra tỷ lệ R:R là $1:4.00$ ($60 / 15$) |
| `"cắt lỗ 25 pip, tỉ lệ 1:3"` | SL = 25 pips, R:R = 1:3 | TP tự động được đặt tại $75$ pips ($25 \times 3$) |
| `"chốt lời 45 pip"` | TP = 45 pips | Dùng SL mặc định 20 pips, R:R là $1:2.25$ |

### C. Định Hướng Bias & Phân Tích Đa Khung
| Câu Lệnh Mẫu Từ Người Dùng | Hướng Giao Dịch | Kiểm Tra Hợp Lưu SMC |
| :--- | :---: | :--- |
| `"Tìm điểm Long"` hoặc `"Tìm cơ hội Mua"` | **LONG** | Kiểm tra điều kiện vùng Discount hoặc Equilibrium |
| `"Đánh giá setup Short"` hoặc `"Bán"` | **SHORT** | Kiểm tra điều kiện vùng Premium hoặc Equilibrium |
| `"Phân tích cấu trúc H4 và D1"` | **MTF** | Kiểm tra xu hướng cấu trúc sóng và độ hấp thụ Order Block |

---

## 4. Hướng Dẫn Cấu Hình Mô Hình AI Đám Mây & AI Cục Bộ

Người dùng có thể chuyển đổi bộ não phân tích từ **Thuật toán SMC cục bộ** sang các mô hình AI hoặc LLM Gateway tùy chỉnh qua 2 cách thuận tiện:

### Cách A: Cấu hình nhanh trực tiếp ngay trên thanh tiêu đề HUD (Khuyên dùng)
1. Trên thanh tiêu đề của Copilot HUD, bấm vào biểu tượng **Cài đặt (`⚙`)**.
2. Thẻ **Cấu hình LLM Gateway & Nhà cung cấp** sẽ thả xuống trực tiếp bên trong HUD:
   - **Nhà cung cấp**: Chọn engine mong muốn (ví dụ: `Custom Gateway / Reverse Proxy`, `OpenAI`, `Google Gemini`, `DeepSeek`, `Ollama`).
   - **Base URL**: Điền đường dẫn gateway (ví dụ: `https://my-llm-gateway.example.com`, `http://localhost:8000/v1`).
   - **Model**: Điền hoặc chọn tên mô hình (ví dụ: `gpt-4o`, `deepseek-chat`, `claude-3-5-sonnet`).
   - **API Key**: Điền mã khóa bí mật (bấm icon mắt để ẩn/hiện).
3. Bấm nút **Kiểm tra kết nối (Test Ping)**:
   - Hệ thống gửi gói tin kiểm tra kết nối qua `/api/copilot/ping` với thông số cấu hình.
   - Hiển thị độ trễ mạng thực tế theo mili-giây (ví dụ: `Kết nối thành công (142ms)`) hoặc thông báo lỗi chẩn đoán chi tiết nếu gateway không phản hồi.
4. Bấm **Lưu cấu hình**:
   - Cấu hình được lưu vào bộ nhớ cục bộ và tự động kích hoạt thông qua cơ chế broadcast sự kiện.
   - Huy hiệu động cơ trên thanh HUD lập tức cập nhật sang mô hình tùy chỉnh (ví dụ: `[🧠 gpt-4o]`) mà không cần tải lại trang.

### Cách B: Qua cửa sổ Chiến Lược AI Studio
1. Bấm vào nút **Trợ lý AI** trên thanh tiêu đề hoặc mở mục **Chiến lược AI**.
2. Chọn tab **Cài đặt** và nhập thông số cấu hình.
3. Bấm **Lưu cấu hình**.

### Kiến Trúc: Tự Động Chuẩn Hóa URL & Cơ Chế Phân Phát Kép (Dual Delivery)
- **Tự động chuẩn hóa Endpoint URL**: Bộ chuẩn hóa URL tại backend xử lý mọi định dạng người dùng nhập vào:
  - `https://api.openai.com` $\rightarrow$ `https://api.openai.com/v1/chat/completions`
  - `https://custom-gateway.io/v1` $\rightarrow$ `https://custom-gateway.io/v1/chat/completions`
  - `https://custom-gateway.io/v1/chat/completions` $\rightarrow$ giữ nguyên chuẩn xác, không bị nhân đôi đường dẫn gây lỗi 404.
- **Phân phát kép (Dual Delivery - SSE Stream kết hợp Non-Streaming Fallback)**:
  1. Copilot gửi yêu cầu dạng streaming (`stream: true`) để hiển thị token theo thời gian thực.
  2. Nếu Gateway tùy chỉnh không hỗ trợ Server-Sent Events (SSE) hoặc trả về mã lỗi streaming (400, 422, 500), Copilot **tự động thử lại ngay lập tức với yêu cầu thông thường (`stream: false`)**.
  3. Nếu cả 2 lần gọi đều gặp lỗi (ví dụ: sai API key 401 hoặc endpoint không tồn tại 404), Copilot sẽ stream một thông báo cảnh báo lỗi chẩn đoán trực tiếp cho trader trước khi chuyển sang chạy thuật toán SMC cục bộ.

---

## 5. Công Thức Toán Học Quản Trị Rủi Ro & Kỳ Vọng Lợi Nhuận

Trong giao dịch tài chính chuyên nghiệp, tỷ lệ R:R quyết định trực tiếp kỳ vọng toán học danh mục (Mathematical Expectancy):

$$\mathbb{E} = (P_{\text{thắng}} \times \text{R:R}) - (P_{\text{thua}} \times 1)$$

### Công thức chuẩn hóa giá trên biểu đồ:
Với tài sản có giá hiện tại $P_{\text{vào}}$, kích thước pip $\text{pip}$, khoảng cách cắt lỗ $\text{SL}_{\text{pips}}$, và tỷ lệ mong muốn $R_{\text{target}}$:

- **Lệnh MUA (LONG)**:
  $$\text{Giá}_{\text{SL}} = P_{\text{vào}} - (\text{SL}_{\text{pips}} \times \text{pip})$$
  $$\text{Giá}_{\text{TP}} = P_{\text{vào}} + (\text{SL}_{\text{pips}} \times R_{\text{target}} \times \text{pip})$$

- **Lệnh BÁN (SHORT)**:
  $$\text{Giá}_{\text{SL}} = P_{\text{vào}} + (\text{SL}_{\text{pips}} \times \text{pip})$$
  $$\text{Giá}_{\text{TP}} = P_{\text{vào}} - (\text{SL}_{\text{pips}} \times R_{\text{target}} \times \text{pip})$$

Bằng cách áp dụng công thức này, mỗi khi trader đưa ra yêu cầu $1:3$, biểu thức thương số:
$$\frac{|\text{Giá}_{\text{TP}} - P_{\text{vào}}|}{|\text{Giá}_{\text{SL}} - P_{\text{vào}}|}$$
được đảm bảo toán học luôn luôn bằng chính xác **3.00**.

---

## 6. Bảng Ma Trận Kiểm Thử Nghiệm Thu (QA Matrix)

| Mã Kiểm Thử | Kịch Bản Thử Nghiệm | Hành Vi Mong Đợi | Trạng Thái |
| :--- | :--- | :--- | :---: |
| `COPILOT-01` | Người dùng hỏi `"Rủi ro / Lợi nhuận? tôi muốn tỉ lệ lợi nhuận là 1:3"` | ActionPlan hiển thị `R:R: 1 : 3.00`, TP = Entry $\pm$ (Risk $\times$ 3) | ✅ ĐẠT |
| `COPILOT-02` | Người dùng bấm Chip chọn nhanh `[🎯 R:R 1:3]` | Tự động điền câu lệnh, truyền phát streaming, trả về R:R 1:3 | ✅ ĐẠT |
| `COPILOT-03` | Người dùng bấm nút Hướng dẫn `(?)` | Mở bảng popover hướng dẫn câu lệnh R:R, SL/TP chi tiết | ✅ ĐẠT |
| `COPILOT-04` | Huy hiệu động cơ hiển thị trên tiêu đề HUD | Hiện `[⚡ Thuật toán SMC]` hoặc `[🧠 gpt-4o]` kèm tooltip | ✅ ĐẠT |
| `COPILOT-05` | Không hardcode chuỗi UI trên cả 4 ngôn ngữ | Kiểm tra `npm run check:i18n` đạt 0 lỗi vi phạm | ✅ ĐẠT |
| `COPILOT-06` | LLM bên ngoài mất mạng hoặc không kết nối được | Tự động fallback sang thuật toán SMC với R:R đã chuẩn hóa | ✅ ĐẠT |
| `COPILOT-07` | Bấm nút Cài đặt `[⚙]` trên HUD -> Kiểm tra Ping & Lưu | Trả về độ trễ ms; cấu hình đã lưu đổi huy hiệu HUD ngay lập tức | ✅ ĐẠT |
| `COPILOT-08` | Tự động chuẩn hóa Gateway URL & Phân phát kép | Tự động bổ sung `/v1` và tự fallback non-streaming nếu gateway không hỗ trợ SSE | ✅ ĐẠT |
