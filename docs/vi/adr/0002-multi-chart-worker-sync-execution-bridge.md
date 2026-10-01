# ADR 0002: Đồng bộ Đa Biểu Đồ Web Worker & Cầu Nối Khớp Lệnh Thực Thi Cục Bộ

- **Trạng thái**: Đã phê duyệt / Ban hành chính thức
- **Ngày lập**: 01/10/2026
- **Người quyết định**: Daedalus (CTO), Athena (CEO), Minerva (Lead PM), Vulcan (Senior SWE), Argus (Lead QA), Aegis (Security), Titan (DevOps)
- **Tài liệu RFC Kỹ thuật**: [RFC-002-MULTI-CHART-WORKER-SYNC-EXECUTION-BRIDGE.md](../rfcs/RFC-002-MULTI-CHART-WORKER-SYNC-EXECUTION-BRIDGE.md)
- **Tài liệu PRD Liên quan**: [PRD_V2_MULTI_CHART_PORTFOLIO.md](../PRD_V2_MULTI_CHART_PORTFOLIO.md)

---

## Bối cảnh và Vấn đề Cần Giải Quyết

Phiên bản Quant Backtest Pro v1.3.0 đã đạt chuẩn hiệu năng $60\text{ FPS}$ cho việc phát lại thị trường đơn biểu đồ trên 1.440.000 nến. Để hiện thực hóa tầm nhìn v2.0 về kiểm thử đa khung thời gian hai biểu đồ song song (ví dụ: cấu trúc H4/Daily đồng bộ với lệnh M5/M1) và kết nối giao dịch thực, hai rào cản kiến trúc xuất hiện:

1. **Nghẽn Luồng Chính UI (Main Thread Congestion)**: Việc chạy 2 canvas biểu đồ đồng thời, tính toán chỉ báo kỹ thuật và mô phỏng khớp lệnh OMS trên luồng duy nhất khiến FPS sụt giảm xuống còn $12\text{--}18\text{ FPS}$ khi tua nhanh trên $10\times$.
2. **Độ Phức Tạp Thời Gian Căn Chỉnh Nến**: Căn chỉnh nến đa khung thời gian bằng quét tuyến tính ($\mathcal{O}(N)$) hoặc tìm kiếm nhị phân ($\mathcal{O}(\log N)$) gây áp lực lớn lên bộ dọn rác (GC) và giật khung hình.
3. **Giới Hạn Sandbox Trình Duyệt**: Trình duyệt nghiêm cấm socket TCP thô (RFC 6455), ngăn kết nối trực tiếp tới Interactive Brokers TWS (cổng 7496) và MetaTrader IPC.

## Mục Tiêu Thiết Kế Kiến Trúc

- **Không Rơi Khung Hình**: Đạt tốc độ ổn định $\ge 60\text{ FPS}$ với ngân sách vẽ khung dưới $16.6\text{ ms}$.
- **Độ Phức Tạp $\mathcal{O}(1)$ Tuyệt Đối**: Căn chỉnh nến thời gian thực dạng mảng chỉ mục phẳng, không cấp phát heap trong vòng lặp.
- **Tách Biệt Triệt Để**: Tách hoàn toàn logic tính toán khỏi quá trình render React/DOM.
- **Cầu Nối Khớp Lệnh Đa Sàn**: Hỗ trợ chuẩn hóa Binance, Bybit, Interactive Brokers, và MT4/MT5 kèm bộ lá chắn rủi ro quỹ Prop Firm.

---

## Quyết Định Kiến Trúc

### 1. Web Worker Phát Lại Độc Lập (`ReplaySyncWorker`)
- Chuyển toàn bộ xung nhịp đồng hồ, ghép nến khung lớn và khớp lệnh OMS sang luồng Web Worker nền.
- Giao thức thông điệp giữa Worker và giao diện được định kiểu chặt chẽ (`WorkerInboundAction`, `WorkerOutboundEvent`).
- Gom cụm thông điệp khung hình theo tần số quét màn hình ($60\text{ Hz}$).

### 2. Bộ Đệm Chỉ Mục Thời Gian $\mathcal{O}(1)$ (`TimestampIndexBuffer`)
- Cấp phát mảng định kiểu liền kề `Int32Array` với kích thước $K = \lceil \frac{T_{max} - T_0}{\Delta t_{base}} \rceil + 1$.
- Truy xuất vị trí nến qua số học ô trực tiếp trong $\le 5\mu s$:
  $$\text{slot} = \left\lfloor \frac{t - T_0}{\Delta t_{base}} \right\rfloor$$
- Loại bỏ hoàn toàn tìm kiếm nhị phân và cấp phát bộ nhớ rác.

### 3. Đồng Bộ Tâm Ngắm Trực Tiếp (Imperative Crosshair)
- Chiếu tọa độ tâm ngắm trực tiếp giữa 2 canvas qua API `timeToCoordinate` của Lightweight Charts, bỏ qua chu kỳ render React ($0\text{ ms}$ overhead React).

### 4. Daemon Cầu Nối Khớp Lệnh Cục Bộ (QEB)
- Dịch vụ Node.js chạy ngầm tại `127.0.0.1:8766`.
- Cung cấp WebSocket hai chiều (`/stream`) và Webhook tiếp nhận tín hiệu (`/v1/webhook`).
- Triển khai giao diện thống nhất `IBrokerDriver` cho Binance, Bybit, Interactive Brokers, MT4/MT5.
- Thực thi lá chắn rủi ro quỹ Prop Firm (Max Daily Loss, Trailing Drawdown, Cắt cầu dao trễ mạng).

---

## Hệ Quả & Giải Pháp Giảm Thiểu

| Hệ quả | Mức độ | Biện pháp xử lý |
| :--- | :--- | :--- |
| Chi phí tuần tự hóa thông điệp IPC | Thấp | Gom khung hình ở tần số $60\text{ Hz}$ và dùng Transferable Buffer cho lát cắt lớn. |
| Yêu cầu chạy daemon khi giao dịch tài khoản thật | Thấp | Hiển thị trạng thái kết nối rõ ràng trên HUD; chế độ mô phỏng thuần vẫn chạy offline 100% trên trình duyệt. |
| Dung lượng RAM của `Int32Array` | Thấp | Chỉ chiếm khoảng $\approx 5.76\text{ MB}$ cho 5 năm dữ liệu M1 ($1.44\text{M}$ nến), hoàn toàn tối ưu. |
