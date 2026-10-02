# Đặc Tả Kỹ Thuật RFC 003: Động Cơ Nhận Thức Thuật Toán SMC & Copilot LLM Streaming Lai Ghép
## Quant Backtest Pro — Đặc Tả Kiến Trúc v2.1 Enterprise

- **Mã định danh RFC**: RFC-003-TECH-v2.1
- **Tiêu đề**: Động cơ nhận thức SMC (Smart Money Concepts) thuần thuật toán, nén trạng thái đa khung thời gian và Copilot LLM Streaming lai ghép theo cơ chế Event-Driven
- **Tác giả**: Daedalus (Giám đốc Công nghệ / Kiến trúc sư Chính)
- **Cộng sự & Người đánh giá**: Athena (CEO), Prometheus (CPO), Minerva (Lead PM), Vulcan (Senior SWE), Argus (Lead QA), Aegis (Cyber Security), Titan (DevOps)
- **Phiên bản phát hành mục tiêu**: Quant Backtest Pro v2.1 "Apex AI Copilot"
- **Trạng thái**: Bản kiến trúc đã được phê duyệt chính thức
- **PRD liên quan**: [`docs/PRD_V2_MULTI_CHART_PORTFOLIO.md`](../PRD_V2_MULTI_CHART_PORTFOLIO.md) và phụ lục PRD v2.1 sắp ban hành
- **Phụ thuộc**: [RFC-002](RFC-002-MULTI-CHART-WORKER-SYNC-EXECUTION-BRIDGE.md), [ADR 0002](../adr/0002-multi-chart-worker-sync-execution-bridge.md)
- **Ngày**: Tháng 10 năm 2026

---

## 1. Tóm Tắt Điều Hành & Động Lực Kiến Trúc

### 1.1. Bối Cảnh & Động Lực Kinh Doanh
Nền tảng v2.0 đã thiết lập chuẩn replay tổ chức với đồng bộ đa biểu đồ thông qua Web Worker cô lập và cầu nối khớp lệnh cục bộ (RFC-002). Lộ trình sản phẩm v2.1 (mã hiệu **"Apex AI Copilot"**) giới thiệu một tầng lý luận tổ chức chuyên biệt theo miền, có khả năng chuyển đổi dữ liệu OHLCV thô thành trí tuệ có cấu trúc Smart Money Concepts (SMC), đồng thời cung cấp trí tuệ đó cho LLM streaming thông qua pipeline Event-Driven kích hoạt chặt chẽ, được kỹ thuật hóa nhằm **giảm ≥ 85% chi phí token** trong khi không bao giờ vượt quá ngân sách nhận thức cứng **5 ms** cho mỗi tick.

### 1.2. Khoảng Trống Kiến Trúc v2.0
- **Gọi LLM mỗi tick là không bền vững**: Gọi LLM từ xa trên mỗi tick (thậm chí mỗi nến) làm phình chi phí token hàng tháng và sinh ra các cuộc gọi thừa trong giai đoạn thị trường không có tín hiệu (ví dụ: dao động trong range).
- **Heuristic chỉ báo chủ quan quá chậm**: Render chú thích SMC mang tính phán đoán (Order Block, FVG, liquidity grab) trên luồng UI chính cạnh tranh với vòng lặp dual-canvas 60 FPS và thường vượt ngân sách khung hình 16.6 ms khi tính trên 1,44 triệu nến lịch sử.
- **LLM thiếu ngữ cảnh số nguyên thủy**: Prompt LLM thuần chứa mảng OHLCV không có nền tảng cấu trúc thị trường, dẫn đến LLM thường "bịa" setup vi phạm quy tắc tổ chức cơ bản (mua ở vùng premium, bán ở vùng discount).

### 1.3. Giải Pháp Kiến Trúc v2.1
1. **Tầng 1 — Lõi nhận thức SMC thuần thuật toán (`smcEngine.ts`)**: Máy trạng thái $O(1)$ amortized toán học thuần túy chạy trong Web Worker riêng biệt, tính toán Fractal Pivot, Break-of-Structure (BOS), Change-of-Character (CHoCH), Order Block (OB), Fair Value Gap (FVG), Liquidity Sweep (BSL/SSL) và cân bằng Premium/Discount với **zero recursive closure**, *zero heap allocation trên mỗi tick*, và ngân sách độ trễ mục tiêu chặt **≤ 1.8 ms** trên mỗi nến.
2. **Tầng 2 — Cổng Hội Tụ Kích Hoạt Theo Sự Kiện & Nén Trạng Thái Đa Khung (MTF)**: Bộ lọc setup tổ chức 4 cổng (HTF Bias, Key POI Tap, Liquidity Sweep, LTF CHoCH) có khả năng loại bỏ **≥ 98%** nến thô và chỉ mở LLM khi Điểm Hội Tụ ≥ 75%. Trạng thái đa khung được mã hóa thành vector ngữ nghĩa dày đặc **≈ 220 token** thông qua ánh xạ token-id tất định.
3. **Tầng 3 — Lý Suy Nhận Thức & HUD Streaming (`AICopilotHUD`)**: Bộ tiêu thụ Server-Sent Events (SSE) với Chain-of-Thought (CoT) hiển thị tăng dần, chiếu primitive-theo-primitive lên chart overlay (hộp OB/FVG vẽ trực tiếp trên canvas TradingView Lightweight Charts) và ngữ pháp phản hồi neo theo quy tắc tổ chức.

### 1.4. Ngân Sách Hiệu Năng & Chi Phí (Ràng Buộc Cứng)

| Chỉ số | Mục tiêu | Trần cứng | Đo lường |
| :--- | :--- | :--- | :--- |
| Độ trễ Tier 1 trên mỗi nến | ≤ 1.8 ms | < 5.0 ms | `performance.now()` đặt trong worker |
| Heap allocation mỗi tick | 0 byte | ≤ 32 B | Probe heap `FanoutTelemetry` |
| Tỉ lệ triệt tiêu Tier 2 | ≥ 98% nến | ≥ 95% | Delta bộ đếm nến trên 1M nến replay |
| Token LLM mỗi lần suy luận | ≈ 220 tok | ≤ 320 tok | Bộ đếm `tiktoken` |
| Giảm chi phí token so v2.0 | ≥ 85% | ≥ 75% | (Cost_v2.0 − Cost_v2.1) / Cost_v2.0 |
| First paint HUD đầu cuối | ≤ 150 ms | ≤ 300 ms | LCP / text chunk đầu |

---

## 2. Sơ Đồ Kiến Trúc Hệ Thống Tổng Thể

```
+----------------------------------------------------------------------------------------------------+
|                          BROWSER RUNTIME — Luồng UI Chính (React 19 + Zustand 5)                  |
|                                                                                                    |
|   +--------------------------------+        +-----------------------------------------------+     |
|   |  TradingViewLight Charts v4.x   |           |        AICopilotHUD (Glassmorphic)           |     |
|   |  (Dual Chart A / Chart B)      |           |  - Hiển thị CoT tăng dần                     |     |
|   |  + Lớp Canvas trực tiếp        |  Render   |  - Bộ tiêu thụ token SSE streaming            |     |
|   |    (hộp OB / FVG / Sweep)      | <-------  |  - Khẳng định quy tắc tổ chức                |     |
|   +--------------------------------+  Primitives  +-----------------------+----------------------+     |
|              ^                                       |  Subscribe (CoT, Action)              |
|              | Khung snapshot (60 Hz coalesced)      v                                          |
|   +----------+--------------------------------+----------------------+                          |
|   |              WorkerBridge Controller        |  CopilotStore (Zustand)                   |
|   +-------------------------------------------+----------------------+                          |
|                        | postMessage (Transferable)                       |                      |
+------------------------|-----------------------------------------------|----------------------+
                         |                                               |
+------------------------v-----------------------------------------------v----------------------+
|                              DEDICATED BACKGROUND WEB WORKER                                      |
|                                                                                                |
|   +--------------------------------------------------------------------------------+           |
|   |                            smcEngine.ts (Lõi Toán Học Thuần)                  |           |
|   |                                                                                |           |
|   |   +-------------------------+   +------------------------+   +---------------+    |           |
|   |   | MonotonicMinMaxQueue    |   |  Zigzag Fractal Pivot  |   | BOS / CHoCH   |    |           |
|   |   | (Cửa sổ trượt O(1))    |   |  Detector (K=5, K=2)   |   | State Machine |    |           |
|   |   +-------------------------+   +------------------------+   +---------------+    |           |
|   |   +-------------------------+   +------------------------+   +---------------+    |           |
|   |   | Vòng đời Order Block    |   |  FVG / IFVG Engine      |   | Liquidity     |    |           |
|   |   | (UNMITIGATED→VIOLATED)  |   |  Mất cân 3-nến         |   | Sweep Tracker |    |           |
|   |   +-------------------------+   +------------------------+   +---------------+    |           |
|   |   +-------------------------+   +------------------------+                      |           |
|   |   | Premium/Discount EQ    |   |  Cổng hội tụ            |  -- SMC_CONFLUENCE_TRIGGER -->|
|   |   | Fibonacci DealingRange  |   |  (4-Cổng, ≥75%)        |                      |           |
|   |   +-------------------------+   +------------------------+                      |           |
|   +--------------------------------------------------------------------------------+           |
|                         |                                                                       |
|                         +--- SMC_FRAME_SNAPSHOT (60 Hz, TypedArray, 0 GC) --------------------->|
|                                                                                                |
+------------------------------------------------------------------------------------------------+
                                                        |
                                                        | HTTP POST /v1/copilot/stream
                                                        | (Server-Sent Events)
                                                        v
+------------------------------------------------------------------------------------------------+
|                          AUT AI GATEWAY (Node.js / TypeScript Daemon)                          |
|                                                                                                |
|   +----------------------+    +----------------------+    +----------------------------+       |
|   |  Bộ nén MTF State    |    |  Thống đốc ngân sách |    |  Bộ chuyển đổi Multi-LLM  |       |
|   |  (~220 tok ngữ nghĩa)|-->|  token prompt (≤320)  |-->|  OpenAI / Gemini / Claude   |       |
|   +----------------------+    +----------------------+    |  DeepSeek / Ollama / Proxy  |       |
|                                                            +----------------------------+       |
+------------------------------------------------------------------------------------------------+
+----------------------------- EXTERNAL LLM PROVIDERS (BYOK) -------------------------------------+
```

---

## 3. Tầng 1: Động Cơ Nhận Thức SMC Thuần Toán Học (Đặc Tả Toán)

Động cơ SMC chạy bên trong `replaySyncWorker.ts` như một module anh em cùng với Timeframe Index Buffer và Order Matching Engine hiện có. Nó nhận luồng OHLCV chính tắc từ `ReplaySyncWorker` và phát ra các gói `SMCFrameSnapshot` có cấu trúc. **Không truy cập DOM. Không React state. Không gọi mạng LLM.** Nó là một máy trạng thái TypeScript thuần túy hoạt động trên các mảng định kiểu liền kề (`Float32Array`, `Int32Array`, `Uint32Array`) được cấp phát một lần khi khởi tạo.

### 3.1. Phát Hiện Pivot Fractal (`MonotonicMinMaxQueue`)

Chúng tôi áp dụng định nghĩa Williams Fractal với bán kính K = 5 cho pivot HTF và K = 2 cho pivot vi mô LTF. Một đỉnh cao $SH_i$ được xác nhận tại bar i nếu:

$$\forall j \in [i-K, i+K] :\; H_i \ge H_j \land i-K \ge 0 \land i+K < N$$

Đối xứng, một đỉnh thấp $SL_i$ được xác nhận nếu:

$$\forall j \in [i-K, i+K] :\; L_i \le L_j \land i-K \ge 0 \land i+K < N$$

Để duy trì chi phí $O(1)$ amortized nghiêm ngặt trên mỗi bar, chúng tôi sử dụng hai **hàng đợi hai đầu đơn điệu** (`MonotonicMinMaxQueue`):

- **Hàng đợi High** (đơn điệu giảm theo `High[i]`): Bar mới pop tất cả entry có High ≤ $H_i$, sau đó nối i. Phía trước deque luôn chứa chỉ số của high lớn nhất trong cửa sổ.
- **Hàng đợi Low** (đơn điệu tăng theo `Low[i]`): Cấu trúc đối xứng cho low nhỏ nhất.

Khi entry ngoài cùng bên trái có chỉ số < i − K, nó bị loại bỏ. Sau khi xử lý bar i, nếu chỉ số phía trước bằng i − K và điều kiện pivot thỏa mãn, một pivot đã xác nhận được phát ra. Chi phí amortized trên mỗi bar là **hai lần đẩy + tối đa K lần pop**, cho ra $O(1)$.

```typescript
type PivotState = { readonly kind: 'SH' | 'SL'; readonly barIndex: number; readonly price: number };
```

### 3.2. Break of Structure (BOS) & Change of Character (CHoCH)

Chúng tôi áp dụng bộ lọc **đóng thân nến (body-close)** nghiêm ngặt để tránh tín hiệu giả do râu nến. Gọi $C_t$ là giá đóng cửa của bar t, $SH_{last}$ / $SL_{last}$ là swing high/swing low khung lớn đã xác nhận gần nhất.

**BOS Tăng** tại bar t khi:

$$C_t > SH_{last} \land \text{trend}_{t-1} \in \{\text{BEARISH}, \text{NEUTRAL}\}$$

**BOS Giảm** tại bar t khi:

$$C_t < SL_{last} \land \text{trend}_{t-1} \in \{\text{BULLISH}, \text{NEUTRAL}\}$$

**CHoCH Tăng** tại bar t khi:

$$C_t > SH_{last} \land \text{trend}_{t-1} = \text{BEARISH}$$

**CHoCH Giảm** tại bar t khi:

$$C_t < SL_{last} \land \text{trend}_{t-1} = \text{BULLISH}$$

Do đó CHoCH là *sự gián đoạn* cực tính xu hướng, trong khi BOS là *sự tiếp nối*. Máy trạng thái chuyển `trend` giữa `BULLISH`, `BEARISH` và `NEUTRAL` dựa trên cực tính của sự kiện cấu trúc gần nhất. Các sự kiện `BOS` và `CHoCH` được phát ra với đầy đủ ngữ cảnh (chỉ số pivot cuối, biên độ dịch chuyển Δ = |$C_t$ − $SH_{last}$|) tới cổng Tầng 2.

### 3.3. Vòng Đời Order Block (OB) — Máy Trạng Thái

Order Block là nến đối cực cuối cùng trước một dịch chuyển (BOS hoặc CHoCH). Chúng tôi theo dõi toàn bộ máy trạng thái 5 trạng thái:

| Trạng thái | Mô tả | Kích hoạt chuyển tiếp |
| :--- | :--- | :--- |
| `UNMITIGATED` | OB phát hiện, giá chưa quay lại | n/a (trạng thái đầu) |
| `PARTIALLY_MITIGATED` | Giá đã vào vùng OB nhưng xâm nhập < 50% | $L_{t+1} \in [OB_{low}, OB_{high}]$ cho OB tăng |
| `FULLY_MITIGATED` | Đã vượt Mean Threshold (CE 50%) | $C_{t+1} \le OB_{CE}$ cho OB tăng |
| `VIOLATED` | Vùng OB bị cắt hoàn toàn (đóng ngoài cạnh đối diện) | $C_{t+1} \le OB_{low}$ cho OB tăng |
| `BREAKER` (cuối) | Cực tính OB VIOLATED bị đảo, trở thành cung cho hướng ngược lại | `VIOLATED` + BOS ngược tiếp theo |

Gọi $OB_{CE} = \frac{OB_{high} + OB_{low}}{2}$ là Mean Threshold (Consequent Encroachment). Tỉ lệ lấp đầy được theo dõi như:

$$\text{fill}_{bullish} = \frac{OB_{high} - \min_{i \in \text{visits}} L_i}{OB_{high} - OB_{low}}$$

```typescript
export type OBState = 'UNMITIGATED' | 'PARTIALLY_MITIGATED' | 'FULLY_MITIGATED' | 'VIOLATED' | 'BREAKER';
export type OrderBlock = {
  readonly id: string;
  readonly direction: 'BULLISH' | 'BEARISH';
  readonly top: number; readonly bottom: number;
  readonly ce: number;
  readonly originBarIndex: number;
  readonly mitigatingBars: Uint32Array; // refilled in-place
  state: OBState;
  fillRatio: number;
};
```

### 3.4. Fair Value Gap (FVG) & Inversion FVG (IFVG)

Fair Value Gap là sự mất cân bằng 3 nến. Với bộ ba bar (t−3, t−2, t−1) — lưu ý rằng nến dịch chuyển là bar t−2:

**FVG Tăng** khi:

$$L_{t-1} > H_{t-3}$$

**FVG Giảm** khi:

$$H_{t-1} < L_{t-3}$$

Mỗi FVG theo dõi:

- `upper`, `lower`, `midpoint` (Consequent Encroachment 50%).
- `fillRatio` tính tất định khi giá quay lại: $\text{fill}_{bullish} = \frac{\min(\text{low đã thăm}, FVG_{upper}) - FVG_{lower}}{FVG_{upper} - FVG_{lower}}$ (kẹp [0, 1]).
- Khi `fillRatio >= 1.0`, FVG được gắn cờ `FILLED` và **đảo cực** thành IFVG với cực tính ngược lại, trở thành mục tiêu tương lai.

```typescript
export type FVGState = 'OPEN' | 'PARTIAL' | 'FILLED' | 'INVERTED_IFVG';
export type FairValueGap = {
  readonly id: string;
  readonly direction: 'BULLISH' | 'BEARISH';
  readonly top: number; readonly bottom: number; readonly ce: number;
  readonly originBarIndex: number;
  state: FVGState;
  fillRatio: number;
};
```

### 3.5. Quét Thanh Khoản (BSL / SSL)

Quét thanh khoản phát hiện breakout *thất bại* qua các pool equal-highs/equal-lows. Sự kiện quét được xác nhận khi giá **xuyên qua** mức pool và sau đó **bật lại** trong cùng bar hoặc bar kế tiếp, thỏa mãn cả:

1. **Bật lại râu nến**: $\frac{|\text{râu vượt pool}|}{|\text{khoảng bar đầy đủ}|} \ge \rho_{rej}$ với mặc định $\rho_{rej} = 0.50$.
2. **Xác nhận khối lượng**: $V_t \ge \rho_{vol} \times \text{SMA}(V, 20)$ với mặc định $\rho_{vol} = 1.5$.
3. **Xây dựng pool**: Pool BSL tại chỉ số i khi ∃ ít nhất 2 đỉnh cao trong dung sai $\epsilon_{eq} \times \text{ATR}_{14}$ trong 50 bar trước. SSL đối xứng.

```typescript
export type LiquiditySweep = {
  readonly id: string;
  readonly kind: 'BSL_SWEEP' | 'SSL_SWEEP';
  readonly poolLevel: number;
  readonly wickRejectionRatio: number;
  readonly volumeMultiplier: number;
  readonly originBarIndex: number;
};
```

### 3.6. Cân Bằng Premium / Discount

Chúng tôi theo dõi dealing range hiện tại sử dụng các swing HTF đã xác nhận gần nhất. Điểm cân bằng (EQ) là mức Fibonacci 50%:

$$EQ = SH_{last} - 0.5 \times (SH_{last} - SL_{last})$$

Động cơ phát ra thuộc tính liên tục `premiumDiscount: 'PREMIUM' | 'DISCOUNT' | 'EQUILIBRIUM'` trên mỗi `SMCFrameSnapshot`. **Neo quy tắc tổ chức** — được dùng bởi cổng Tầng 2 và prompt Tầng 3:

> **Không vào lệnh LONG ở PREMIUM. Không vào lệnh SHORT ở DISCOUNT.**

---

## 4. Tầng 2: Cổng Hội Tụ Kích Hoạt Theo Sự Kiện & Nén Trạng Thái MTF

Cổng Hội Tụ nhận mọi `SMCFrameSnapshot` nhưng chỉ mở suy luận LLM khi điểm 4-cổng có trọng số vượt ngưỡng **$\sigma_{min} = 75\%$**. Đây là cơ chế triệt tiêu chi phí quan trọng nhất.

### 4.1. Bốn Cổng Hội Tụ

| Cổng | Trọng số | Điều kiện |
| :--- | :--- | :--- |
| **G1**: Căn chỉnh HTF Bias | 30% | Hướng setup LTF hiện tại khớp với thuộc tính `trend` HTF (D1/H4) |
| **G2**: Chạm POI Chính | 30% | Giá đã quay lại (trong $0.5 \times \text{ATR}_{14}$) một OB UNMITIGATED hoặc FVG OPEN |
| **G3**: Quét Thanh Khoản | 20% | Quét BSL hoặc SSL đã xác nhận trong 8 bar trước |
| **G4**: LTF CHoCH | 20% | Một CHoCH (không chỉ BOS) được phát hiện trong 12 bar trước |

$$\text{ConfluenceScore} = \sum_{i=1}^{4} w_i \cdot \mathbb{1}[G_i \text{ thỏa mãn}]$$

Cổng chỉ kích hoạt khi:

$$\text{ConfluenceScore} \ge \sigma_{min} = 0.75 \land \text{cooldown}_{LTP} \ge 20\text{ bar}$$

### 4.2. Nén Trạng Thái MTF Thành Vector Ngữ Nghĩa Dày Đặc (~220 token)

Trạng thái đa khung đầy đủ được mã hóa tất định thành một đoạn prompt gọn. Chúng tôi tránh số thô trong prompt (vừa tốn token vừa nhiễu); thay vào đó ánh xạ thuộc tính có cấu trúc sang enum `TokenId` cố định.

```typescript
export const MTF_TOKEN_BUDGET = 220;
export interface MTFSemanticVector {
  readonly bias: { h4: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; d1: 'BULLISH' | 'BEARISH' | 'NEUTRAL' };
  readonly location: 'PREMIUM' | 'DISCOUNT' | 'EQUILIBRIUM';
  readonly activeOB: { direction: 'BULLISH' | 'BEARISH'; state: OBState; fillRatioBucket: 0 | 25 | 50 | 75 | 100 };
  readonly activeFVG: { direction: 'BULLISH' | 'BEARISH'; state: FVGState; fillRatioBucket: 0 | 25 | 50 | 75 | 100 };
  readonly recentSweep: { kind: 'BSL' | 'SSL' | 'NONE'; barsAgo: number };
  readonly recentCHoCH: { direction: 'BULLISH' | 'BEARISH' | 'NONE'; barsAgo: number };
  readonly volatility: { atrBucket: 'LOW' | 'NORMAL' | 'HIGH' | 'EXTREME'; session: 'ASIA' | 'LONDON' | 'NY' | 'OVERLAP' };
}
```

Một renderer template chuẩn (`MtfPromptRenderer`) phát ra chính xác **MTF_TOKEN_BUDGET = 220 token** cho phần mở đầu có cấu trúc. Cộng với system prompt LLM (≈ 60 token) và slot người dùng (≈ 50 token), mỗi suy luận tiêu thụ ≤ 320 token — mức **giảm ~85%** so với cách tiếp cận v2.0 là streaming 200 nến OHLCV gần nhất (≈ 2,200 token).

### 4.3. Cooldown & Bộ Giới Hạn Tốc Độ

- **Cooldown mỗi Symbol**: Khoảng cách tối thiểu 20 bar giữa các suy luận trên cùng symbol để tránh bắn liên tục tương quan.
- **Bộ Giới Hạn Tốc Độ Toàn Cục**: Thuật toán token-bucket, tối đa 6 suy luận / phút, tối đa 90 suy luận / giờ mỗi `sessionId`.
- **Bộ Đệm Backpressure**: Nếu LLM chậm, các frame được *coalesce* (chỉ trạng thái mới nhất là quan trọng). Kích thước bộ đệm ≤ 3 frame.

---

## 5. Tầng 3: LLM Streaming, Hiển Thị CoT & Copilot HUD

### 5.1. Pipeline Streaming SSE

Khi Tầng 2 mở cổng, AI Gateway (daemon Node.js) mở một kênh SSE:

```
POST /v1/copilot/stream
Content-Type: application/json
X-Session-Id: <uuid>

{ "symbol": "BTCUSDT", "timeframe": "M5", "mtf": <MTFSemanticVector>, "userQuestion": "..." }

→ HTTP/1.1 200 OK
→ Content-Type: text/event-stream
→
→ data: {"delta":"<thinking>","type":"reasoning"}
→ data: {"delta":"Chúng tôi quan sát ","type":"reasoning"}
→ ...
→ data: {"delta":"</thinking>","type":"reasoning"}
→ data: {"delta":"<action_plan>","type":"action"}
→ data: {"delta":"{\"side\":\"LONG\"","type":"action"}
→ ...
→ data: {"delta":"</action_plan>","type":"action"}
→ data: {"type":"done","usage":{"prompt":218,"completion":156,"cost_usd":0.00041}}
```

Bộ phân tích SSE phía trình duyệt (`sseCopilotStream.ts`) phân biệt giữa thẻ `<thinking>` (render tăng dần trong *bảng lý luận gấp*) và thẻ `<action_plan>` (phân tích thành JSON `ActionPlan` và render trong HUD có cấu trúc).

### 5.2. Hợp Đồng JSON ActionPlan

```typescript
export interface ActionPlan {
  readonly side: 'LONG' | 'SHORT' | 'NO_TRADE';
  readonly entry: number; readonly stopLoss: number; readonly takeProfit: readonly number[];
  readonly rrRatio: number;
  readonly rationale: string;
  readonly institutionalChecks: readonly (
    | 'HTF_BIAS_ALIGNED'
    | 'KEY_POI_TAP'      // Không long ở premium, không short ở discount
    | 'LIQUIDITY_SWEEP_CONFIRMED'
    | 'LTF_CHOCH_CONFIRMED'
  )[];
  readonly confidence: number; // 0..1
}
```

Bộ xác thực phía trình duyệt từ chối bất kỳ kế hoạch nào mà `institutionalChecks` thiếu `KEY_POI_TAP` khi vị trí vi phạm quy tắc premium-discount, và hiển thị lỗi cứng cho người dùng.

### 5.3. Render Overlay Canvas Trực Tiếp

`AICopilotHUD` đăng ký vào `ActionPlan` streaming và chiếu các primitive OB / FVG / Sweep **trực tiếp lên canvas TradingView Lightweight Charts** sử dụng các API `priceCoordinate()` và `timeCoordinate()` — bỏ qua React hoàn toàn. Điều này đảm bảo tương tác 60 FPS ngay cả trong khi phản hồi LLM đang streaming.

```typescript
// 0 lần re-render React trong khi cập nhật overlay streaming
function drawPrimitiveOverlay(ctx: CanvasRenderingContext2D, prim: OverlayPrimitive) {
  const x1 = chart.timeCoordinate(prim.timeStart);
  const x2 = chart.timeCoordinate(prim.timeEnd);
  const y1 = chart.priceCoordinate(prim.priceHigh);
  const y2 = chart.priceCoordinate(prim.priceLow);
  ctx.fillStyle = prim.color; ctx.globalAlpha = prim.alpha;
  ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
  // ... OB / FVG / Sweep box + label rendering
}
```

---

## 6. Đặc Tả Giao Thức IPC (Hợp Đồng Thông Điệp Định Kiểu)

### 6.1. Hành Động Đầu Vào (Luồng Chính → Worker)

```typescript
export type SMCWorkerInboundAction =
  | { kind: 'SMC_INIT_CONFIG'; payload: { symbol: string; higherTF: 'D1' | 'H4'; lowerTF: 'M5' | 'M1'; fractalRadiusHTF: 5; fractalRadiusLTF: 2 } }
  | { kind: 'SMC_UPDATE_BAR'; payload: { bar: OHLCVBar; higherTFBar?: OHLCVBar } }
  | { kind: 'SMC_BULK_REPLAY'; payload: { bars: readonly OHLCVBar[] } }
  | { kind: 'SMC_RESET_STATE'; payload: { preservePivots: boolean } }
  | { kind: 'SMC_SET_GATE_THRESHOLD'; payload: { sigmaMin: number } };
```

### 6.2. Sự Kiện Đầu Ra (Worker → Luồng Chính)

```typescript
export type SMCWorkerOutboundEvent =
  | { kind: 'SMC_FRAME_SNAPSHOT'; payload: SMCFrameSnapshot } // 60 Hz coalesced, Transferable typed array
  | { kind: 'SMC_PIVOT_CONFIRMED'; payload: { pivot: PivotState; affectedOBs: readonly string[] } }
  | { kind: 'SMC_CONFLUENCE_TRIGGER'; payload: { score: number; mtfVector: MTFSemanticVector; triggerBar: number } }
  | { kind: 'SMC_PERFORMANCE_METRICS'; payload: { lastBarLatencyMs: number; avgLatencyMs: number; heapAllocBytes: number } };
```

`SMC_FRAME_SNAPSHOT` được phát ra dưới dạng `Float32Array` Transferable chứa 64 pivot / 32 OB / 16 FVG / 8 sweep gần nhất để giảm thiểu chi phí structured-clone.

---

## 7. Phân Tích Chế Độ Lỗi & Bảo Đảm An Toàn

| Chế độ lỗi | Mức nghiêm trọng | Giảm thiểu |
| :--- | :--- | :--- |
| Tràn postMessage của Worker ở 100× replay | Trung bình | Coalesce frame ở 60 Hz; loại bỏ snapshot trung gian |
| Giới hạn tốc độ 429 của LLM | Trung bình | Thống đốc token-bucket + chuỗi dự phòng (Primary → Secondary → Offline) |
| LLM ảo giác ActionPlan không hợp lệ | Cao | Bộ bảo vệ quy tắc tổ chức phía trình duyệt từ chối kế hoạch vi phạm quy tắc Premium/Discount |
| Worker sập (hết bộ nhớ) | Cao | `WorkerRecoverySupervisor` tái sinh worker, replay từ snapshot pivot đã lưu cuối cùng |
| Rò rỉ API key trong IndexedDB | Nghiêm trọng | AES-GCM Key Vault với khóa dẫn xuất PBKDF2 (xem ADR-0003 phụ lục v2.1) |
| Chi phí vượt kiểm soát do cấu hình cổng sai | Cao | Trần cứng thực thi phía server; ngân sách $5/ngày với kill-switch |
| `SMCFrameSnapshot` cũ sau khi đổi symbol | Trung bình | `SMC_RESET_STATE` phát ra trên mỗi sự kiện `symbolChanged` |

---

## 8. Telemetry, Quan Sát & Cổng Chất Lượng

- **Telemetry Hiệu Năng**: `lastBarLatencyMs`, `avgLatencyMs`, `p99_latencyMs` được phát ra tới `SMC_PERFORMANCE_METRICS` và hiển thị trong HUD *Engineering Diagnostics* (chỉ mở ở chế độ dev).
- **Telemetry Chi Phí**: Tổng chi token hàng ngày, chi phí mỗi suy luận, tỉ lệ triệt tiêu, tỉ lệ token CoT được stream tới bảng điều khiển AI Gateway.
- **Hồi Quy Thuật Toán**: Mỗi PR phải vượt `tests/smc.fractal.test.ts`, `tests/smc.bosChoch.test.ts`, `tests/smc.obLifecycle.test.ts`, `tests/smc.fvg.test.ts`, `tests/smc.sweep.test.ts`, và `tests/smc.gate.test.ts` với **100% phủ fixture tất định** (zero tính ngẫu nhiên trong test thuật toán).
- **Cổng Chất Lượng (chặn CI)**:
  1. `npx tsc --noEmit` → 0 lỗi
  2. `npm run check:i18n` → 100% parity qua `vi`, `en`, `ja`, `zh`
  3. `npm test` → 100% pass, 0 hồi quy thuật toán
  4. `npm run build` → thành công, 0 cảnh báo
  5. **Test Ngân Sách Độ Trễ SMC**: P95 độ trễ bar ≤ 5 ms trên fixture 100k bar (chạy CI, kích hoạt bởi `RUN_PERF=1`)

---

## 9. Tuân Thủ Quốc Tế Hóa (i18n)

- **Zero Chuỗi UI Cứng**: Tất cả nhãn HUD, trạng thái nút, thông báo lỗi phải đến từ các tệp i18n tập trung (`src/i18n/locales/{vi,en,ja,zh}.ts`). Không có fallback `BẬT`/`TẮT`, `ON`/`OFF`.
- **Bản Địa Hóa CoT**: Văn bản lý luận do LLM sinh ra được xử lý qua shim dịch nội bộ nếu ngôn ngữ người dùng chọn không phải tiếng Anh. System prompt luôn yêu cầu đầu ra tiếng Anh gốc để di động, sau đó dịch phía client.
- **Cổng CI**: `npm run check:i18n` chặn bất kỳ PR nào đưa vào khóa chưa được phủ.

---

## 10. Kế Hoạch Triển Khai & Trình Tự

| Pha | Chủ sở | Sản phẩm bàn giao | Cổng thoát |
| :--- | :--- | :--- | :--- |
| P0 (1n) | Daedalus | Phê duyệt RFC-003 | hoàn tất |
| P1 (3n) | Vulcan | `src/engine/smc/smcEngine.ts` + `src/types/smc.ts` + unit test | Tất cả test SMC xanh |
| P2 (2n) | Vulcan | Tích hợp Web Worker trong `replaySyncWorker.ts` | Worker P95 ≤ 5 ms |
| P3 (2n) | Vulcan | Cổng Tier 2 + Bộ nén MTF + bộ bảo vệ chi phí | Triệt tiêu ≥ 98%, token ≤ 320 |
| P4 (3n) | Vulcan | Bộ phân tích SSE Tier 3 + `AICopilotHUD` + overlay canvas | First paint ≤ 150 ms |
| P5 (2n) | Argus | Bộ benchmark độ trễ + fixture hồi quy | Test ngân sách CI xanh |
| P6 (2n) | Aegis | AES-GCM Key Vault + kill-switch 3% lỗ ngày | Họp bảo mật thông qua |
| P7 (1n) | Titan | Route daemon AI Gateway `/v1/copilot/stream` | Test tích hợp daemon xanh |
| P8 (1n) | Tất cả | Tài liệu, cập nhật README, i18n parity | Tất cả cổng chất lượng xanh |

---

## 11. Tham Khảo & Liên Kết Chéo

- RFC-002: [Đồng Bộ Đa Biểu Đồ Web Worker & Cầu Nối Khớp Lệnh Cục Bộ](RFC-002-MULTI-CHART-WORKER-SYNC-EXECUTION-BRIDGE.md)
- ADR 0002: [Đồng Bộ Đa Biểu Đồ Web Worker & Cầu Nối Khớp Lệnh](../adr/0002-multi-chart-worker-sync-execution-bridge.md)
- ADR 0003: Động Cơ Nhận Thức SMC Thuần Thuật Toán & Copilot LLM Lai Ghép (RFC này)
- PRD_V2: [`docs/PRD_V2_MULTI_CHART_PORTFOLIO.md`](../PRD_V2_MULTI_CHART_PORTFOLIO.md)

---

*Phiên bản tài liệu: 1.0.0 — Đã phê duyệt bởi Daedalus (CTO) ngày 02/10/2026.*
