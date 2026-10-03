# ADR 0003: Động Cơ Nhận Thức SMC Thuần Thuật Toán & Copilot LLM Streaming Lai Ghép

- **Trạng thái**: Đã phê duyệt / Ban hành chính thức
- **Ngày lập**: 02/10/2026
- **Người quyết định**: Daedalus (CTO), Athena (CEO), Minerva (Lead PM), Vulcan (Senior SWE), Argus (Lead QA), Aegis (Security), Titan (DevOps)
- **Tài liệu RFC Kỹ thuật**: [RFC-003-ALGORITHMIC-SMC-AI-COPILOT.md](../rfcs/RFC-003-ALGORITHMIC-SMC-AI-COPILOT.md)
- **Phụ thuộc**: ADR 0002 / RFC-002 (Đồng Bộ Đa Biểu Đồ Web Worker & Cầu Nối Khớp Lệnh)

---

## Bối Cảnh và Vấn Đề Cần Giải Quyết

Quant Backtest Pro v2.0 đã giới thiệu replay tổ chức tất định thông qua Web Worker đồng bộ, nhưng Động Cơ Chiến Lược AI vẫn vận hành một cách ngây thơ — gọi LLM trên mảng OHLCV thô với rất ít ngữ cảnh tổ chức. Điều này sinh ra ba vấn đề cụ thể:

1. **Chi phí token vượt kiểm soát**: Các cuộc gọi LLM trên mỗi tick (hoặc trên mỗi nến) làm phình chi phí token hàng tháng theo bậc và sinh ra công việc thừa trong các giai đoạn không có tín hiệu (dao động nhỏ, mid-range drift).
2. **Độ trễ chỉ báo chủ quan**: Các chú thích SMC mang tính phán đoán (Order Block, FVG, quét thanh khoản) được vẽ trên luồng UI chính cạnh tranh với vòng lặp dual-canvas 60 FPS và thường xuyên vượt ngân sách khung hình 16.6 ms trên 1,44 triệu nến lịch sử.
3. **LLM ảo giác số**: Các prompt chỉ chứa mảng OHLCV thiếu nền tảng cấu trúc thị trường; LLM thường "bịa" các setup vi phạm quy tắc tổ chức cơ bản (long ở premium, short ở discount).

Một tầng nhận thức chuyển đổi telemetry thành primitive SMC có cấu trúc, cộng với pipeline gọi LLM Event-Driven kích hoạt chặt chẽ, là cần thiết để đạt **giảm ≥ 85% chi phí token** trong khi vẫn nằm dưới ngân sách nhận thức **≤ 5 ms** trên mỗi nến.

## Mục Tiêu Thiết Kế Kiến Trúc

- **Toán học tất định, có thể kiểm thử**: Mọi primitive SMC (đỉnh/đáy, BOS/CHoCH, OB, FVG, quét thanh khoản) phải quy về được điều kiện dạng đóng trên mảng định kiểu liền kề với zero đệ quy.
- **Ngân sách độ trễ nghiêm ngặt**: Tính toán trên mỗi nến trong Worker phải duy trì dưới 5 ms (P95) để cùng tồn tại với vòng lặp dual-canvas 60 FPS hiện có.
- **Kỷ luật chi phí**: Chi tiêu token trên mỗi suy luận phải ≤ 320 token; tỉ lệ triệt tiêu ≥ 98% nến thô.
- **Neo quy tắc tổ chức**: Mọi kế hoạch do AI sinh ra phải được xác thực theo các quy tắc tổ chức chuẩn (HTF alignment, key POI tap, quét thanh khoản, LTF CHoCH, premium/discount).
- **IPC định kiểu an toàn**: Hợp đồng xuyên luồng phải là discriminated union đầy đủ để an toàn tại thời điểm biên dịch.

## Các Phương Án Đã Xem Xét

1. **Phương án 1**: Gọi LLM mỗi nến ngây thơ với ngữ cảnh OHLCV thô. (Bị loại: chi phí token không bền vững, không neo tổ chức.)
2. **Phương án 2**: Tính toán chú thích SMC trên luồng UI chính với cập nhật state React. (Bị loại: vượt ngân sách >16 ms ở 100× replay.)
3. **Phương án 3**: Lõi SMC Wasm (Rust) trong luồng chính. (Bị loại: vẫn chặn event loop trong khi rasterize canvas.)
4. **Phương án 4 (Đã chọn)**: Ngăn xếp Nhận Thức-Lý Luận Lai Ghép 3-Tầng:
   - **Tầng 1**: Động cơ SMC $O(1)$ toán học thuần bên trong `replaySyncWorker` hiện có, không DOM/React, mảng định kiểu liền kề.
   - **Tầng 2**: Bộ lọc Hội Tụ 4-Cổng (HTF Bias, Key POI Tap, Liquidity Sweep, LTF CHoCH) với điểm $\sigma \ge 0.75$; trạng thái MTF được nén thành vector ngữ nghĩa ~220 token.
   - **Tầng 3**: LLM streaming SSE với hiển thị CoT tăng dần, hợp đồng JSON `ActionPlan`, và chiếu overlay canvas trực tiếp các primitive OB/FVG.

---

## Quyết Định Kiến Trúc

### 1. Động Cơ Nhận Thức SMC Thuần Thuật Toán (`src/engine/smc/smcEngine.ts`)
- Chạy như một module thuần anh em bên trong `replaySyncWorker.ts`, chia sẻ pool cấp phát mảng định kiểu hiện có.
- Triển khai `MonotonicMinMaxQueue` cho phát hiện pivot $O(1)$ amortized; bộ lọc BOS/CHoCH body-close nghiêm ngặt; máy trạng thái vòng đời OB 5 trạng thái; động cơ FVG/IFVG mất cân 3 nến; bộ theo dõi quét thanh khoản theo râu và khối lượng; cân bằng dealing range Fibonacci.
- Phát ra các sự kiện `SMC_FRAME_SNAPSHOT` được hỗ trợ bởi Transferable `Float32Array`, coalesced ở 60 Hz.
- Ngân sách độ trễ cứng: P95 ≤ 5 ms / nến, 0 byte heap allocation trên mỗi tick.

### 2. Cổng Hội Tụ Kích Hoạt Theo Sự Kiện & Nén Trạng Thái MTF
- Bốn cổng có trọng số ($\sum w_i \cdot \mathbb{1}[G_i] \ge 0.75$) với cooldown 20 bar trên mỗi symbol và bộ giới hạn tốc độ token-bucket toàn cục.
- Trạng thái MTF được mã hóa thành vector ngữ nghĩa tất định ≤ 220 token thông qua enum `TokenId` cố định.
- Ngân sách token mỗi suy luận: ≤ 320 token (system + MTF + slot người dùng) — mức **giảm ~85%** so với streaming 200 nến OHLCV thô (~2,200 token).

### 3. Copilot SSE Streaming (`AICopilotHUD`)
- Bộ tiêu thụ Server-Sent Events với hiển thị Chain-of-Thought tăng dần (bảng lý luận gấp) và phân tích `<action_plan>` JSON thành discriminated union `ActionPlan`.
- Bộ bảo vệ quy tắc tổ chức từ chối các kế hoạch vi phạm quy tắc premium/discount (không long ở premium, không short ở discount).
- Chiếu trực tiếp lên canvas qua các API `priceCoordinate()` / `timeCoordinate()` của TradingView Lightweight Charts — **0 lần re-render React** trong khi cập nhật overlay streaming.

### 4. Giao Thức Xuyên Luồng Định Kiểu An Toàn (`src/types/smc.ts`)
- Discriminated union `SMCWorkerInboundAction`: `SMC_INIT_CONFIG`, `SMC_UPDATE_BAR`, `SMC_BULK_REPLAY`, `SMC_RESET_STATE`, `SMC_SET_GATE_THRESHOLD`.
- Discriminated union `SMCWorkerOutboundEvent`: `SMC_FRAME_SNAPSHOT`, `SMC_PIVOT_CONFIRMED`, `SMC_CONFLUENCE_TRIGGER`, `SMC_PERFORMANCE_METRICS`.

---

## Hệ Quả & Giảm Thiểu

| Hệ quả | Mức độ | Giảm thiểu |
| :--- | :--- | :--- |
| Bề mặt kỹ thuật tăng (SMC + Worker + LLM + i18n) | Trung bình | Ranh giới module chặt chẽ trong `src/engine/smc/` và `src/workers/`; kế hoạch triển khai theo pha trong RFC-003 §10. |
| Giới hạn tốc độ hoặc downtime của LLM | Trung bình | Thống đốc token-bucket + chuỗi dự phòng (Primary → Secondary → Offline) và bộ đệm kế hoạch offline. |
| Hồi quy thuật toán trong phát hiện SMC | Cao | Test unit dựa trên fixture tất định bao phủ fractal, BOS/CHoCH, vòng đời OB, FVG, quét thanh, và cổng; chặn CI. |
| Worker sập trong phiên dài | Thấp | `WorkerRecoverySupervisor` tái sinh từ snapshot pivot đã lưu cuối cùng. |
| Rò rỉ API key | Nghiêm trọng | AES-GCM Key Vault với khóa dẫn xuất PBKDF2 (zero plaintext); đánh giá bảo mật bởi Aegis. |
| Chi phí vượt kiểm soát do cấu hình sai | Cao | Trần cứng thực thi phía server + kill-switch ở mức 3% lỗ ngày tương đương trong chi tiêu token. |
| Snapshot cũ sau khi đổi symbol | Thấp | `SMC_RESET_STATE` phát ra trên mỗi sự kiện `symbolChanged`. |
| Drift i18n parity qua `vi`/`en`/`ja`/`zh` | Trung bình | Cổng CI `npm run check:i18n` chặn PR có khóa chưa phủ. |

---

*Đã phê duyệt bởi Daedalus (CTO) ngày 02/10/2026. Liên kết chéo: [RFC-003](../rfcs/RFC-003-ALGORITHMIC-SMC-AI-COPILOT.md), [ADR 0002](0002-multi-chart-worker-sync-execution-bridge.md).*
