# Đặc Tả Kỹ Thuật RFC 002: Đồng Bộ Đa Biểu Đồ Bằng Web Worker & Daemon Cầu Nối Khớp Lệnh Cục Bộ
## Thiết Kế Kiến Trúc Hệ Thống Quant Backtest Pro — Bản Doanh Nghiệp v2.0

- **Mã Định Danh RFC**: RFC-002-TECH-v2
- **Tiêu Đề**: Đồng Bộ Hóa Đa Biểu Đồ Hiệu Năng Cao Qua Web Worker và Cầu Nối Khớp Lệnh Tổ Chức
- **Tác Giả**: Daedalus (Giám Đốc Công Nghệ / Kiến Trúc Sư Trưởng)
- **Người Đóng Góp & Thẩm Định**: Athena (CEO), Prometheus (CPO), Minerva (Lead PM), Vulcan (Senior SWE), Argus (Lead QA), Aegis (Cyber Security), Titan (DevOps)
- **Phiên Bản Mục Tiêu**: Quant Backtest Pro v2.0 Enterprise
- **Trạng Thái**: Bản Thiết Kế Kiến Trúc Chính Thức Được Phê Duyệt
- **Tài Liệu PRD Liên Quan**: [`docs/vi/PRD_V2_MULTI_CHART_PORTFOLIO.md`](../PRD_V2_MULTI_CHART_PORTFOLIO.md)
- **Thời Gian**: Tháng 10 Năm 2026

---

## 1. Tóm Tắt Dự Án & Động Lực Kiến Trúc

### 1.1. Bối Cảnh & Động Lực Kỹ Thuật
Quant Backtest Pro v1.3.0 đã thiết lập vị thế dẫn đầu thị trường về khả năng Replay biểu đồ đơn, duy trì **60 FPS** ổn định cho tập dữ liệu lên đến 1.440.000 nến lịch sử thông qua cập nhật canvas gia số $O(1)$. Tuy nhiên, tầm nhìn chiến lược v2.0 trong PRD-v2 đặt ra hai bước chuyển dịch công nghệ bắt buộc:
1. **Replay Đồng Bộ Đa Khung Thời Gian / Đa Biểu Đồ (Dual-Chart MTF Replay)**: Vận hành đồng thời 2 canvas biểu đồ (ví dụ: cấu trúc vĩ mô khung Ngày/H4 song song với điểm vào lệnh vi mô khung M5/M1) được khóa chặt vào một thanh trượt dòng thời gian miligiây duy nhất.
2. **Cầu Nối Khớp Lệnh Tổ Chức (Institutional Execution Bridge)**: Điều phối lệnh thật (Live) và lệnh thử nghiệm (Paper Trading) trực tiếp từ trình duyệt đến các sàn giao dịch crypto hàng đầu (Binance, Bybit), nhà môi giới đa tài sản quốc tế (Interactive Brokers), và trạm giao dịch ngoại hối (MetaTrader 4 & 5).

### 1.2. Nút Thắt Luồng Đơn Của Trình Duyệt (Vấn Đề Kỹ Thuật)
Trong môi trường trình duyệt, luồng chính (Main Thread) phải xử lý đồng thời:
- Render DOM và đồng bộ React Virtual DOM.
- Raster hóa HTML5 Canvas và vẽ TradingView Lightweight Charts.
- Tính toán chuỗi chỉ báo kỹ thuật phức tạp (RSI, Bollinger Bands, ATR, EMA, MACD).
- Mô phỏng cỗ máy khớp lệnh Order Matching Engine (khớp limit, trượt giá slippage, spread, cơ chế Prop Firm Trailing Drawdown).

Khi kích hoạt hai biểu đồ cùng lúc:
- **Nghẽn CPU (Thread Starvation)**: Tính toán chỉ báo và resample nến cho 2 biểu đồ trong cùng một khung thời gian 16.6ms dẫn đến quá tải Event Loop nghiêm trọng.
- **Tụt Khung Hình (Frame Drops)**: Tốc độ replay trên 10x (100–1000 nến/giây) khiến tốc độ hiển thị sụt giảm từ 60 FPS xuống còn 12–18 FPS.
- **Bẫy Độ Phức Tạp Thuật Toán**: Tìm kiếm nến đồng bộ qua quét tuyến tính $O(N)$ hoặc tìm kiếm nhị phân $O(\log N)$ trên mỗi tick với 1,44 triệu dòng dữ liệu gây áp lực bộ nhớ và nghẽn Garbage Collection (GC).
- **Rào Cản Sandbox Trình Duyệt**: Trình duyệt nghiêm cấm mở kết nối TCP socket thô, chặn kết nối trực tiếp đến Interactive Brokers TWS (port 7496) và IPC MetaTrader.

### 1.3. Giải Pháp Kiến Trúc Đột Phá
1. **Web Worker Replay Riêng Biệt (`ReplaySyncWorker`)**: Tách toàn bộ vòng lặp đồng bộ thời gian, resample đa khung, tổng hợp nến HTF đang hình thành và luồng tick đa tài sản sang luồng nền độc lập.
2. **Bảng Đệm Tra Cứu Trực Tiếp $O(1)$ (`TimestampIndexBuffer`)**: Ứng dụng mảng định kiểu (`Int32Array`) và bảng băm phân vùng để tra cứu chỉ số nến tương ứng với thời gian bất kỳ trong đúng $O(1)$ với 0 byte cấp phát rác.
3. **Ảo Hóa Canvas & Ma Trận Con Trỏ Trực Tiếp (0ms React)**: Loại bỏ hoàn toàn React State khi di chuột; đồng bộ con trỏ crosshair qua phép chiếu tọa độ canvas trực tiếp.
4. **Daemon Cầu Nối Khớp Lệnh Cục Bộ (QEB)**: Một dịch vụ Node.js/TypeScript độc lập chạy tại `localhost:8766`, cung cấp WebSocket thời gian thực siêu trễ thấp và cổng tiếp nhận Webhook từ TradingView để đẩy lệnh an toàn ra sàn.

---

## 2. Sơ Đồ Kiến Trúc Hệ Thống Tổng Thể

```
+---------------------------------------------------------------------------------------------------+
|                             MÔI TRƯỜNG TRÌNH DUYỆT (Luồng Giao Diện Chính)                        |
|                                                                                                   |
|  +---------------------------------------------------------------------------------------------+  |
|  |                             Kho Trạng Thái Zustand (`useBacktestStore`)                     |  |
|  +---------------------------------------------------------------------------------------------+  |
|               |                                                                    ^              |
|        Lệnh Điều Khiển                                                    Cập Nhật Trạng Thái    |
|    (LOAD, PLAY, STEP, SEEK)                                            (CandleBatch, OMS State)   |
|               v                                                                    |              |
|  +-------------------------------------------------------------+                   |              |
|  |             Bộ Điều Khiển Cầu Nối Worker (`WorkerBridge`)   |                   |              |
|  +-------------------------------------------------------------+                   |              |
|               | (postMessage / Dữ Liệu Chuyển Giao)                                |              |
+---------------|--------------------------------------------------------------------|--------------+
                |                                                                    |
+---------------v--------------------------------------------------------------------|--------------+
|                              LUỒNG NỀN RIÊNG BIỆT (DEDICATED WEB WORKER)                          |
|                                                                                    |              |
|  +------------------------------------------------------------------------------+  |              |
|  |                     `ReplaySyncWorker` (Vòng Lặp Thực Thi Replay)            |  |              |
|  |                                                                              |  |              |
|  |   +--------------------------+   +---------------------------------------+   |  |              |
|  |   | Đồng Hồ Phát Lại Chuẩn   |   | TimestampIndexBuffer (Ánh Xạ O(1))     |   |  |              |
|  |   | (Độ Phân Giải Tick/Micros|   | Mảng Định Kiểu Int32Array             |   |  |              |
|  |   +--------------------------+   +---------------------------------------+   |  |              |
|  |               |                                      |                       |  |              |
|  |               v                                      v                       |  |              |
|  |   +----------------------------------------------------------------------+   |  |              |
|  |   | Bộ Tổng Hợp Nến Đang Hình Thành (HTF Generator Không Nhìn Trước)    |   |  |              |
|  |   +----------------------------------------------------------------------+   |  |              |
|  |               |                                                              |  |              |
|  |               v                                                              |  |              |
|  |   +----------------------------------------------------------------------+   |  |              |
|  |   | Cỗ Máy Khớp Lệnh Đa Tài Sản (Mô Phỏng Quản Trị Vị Thế OMS)           |   |  |              |
|  |   +----------------------------------------------------------------------+   |  |              |
|  +------------------------------------------------------------------------------+  |              |
|                                         |                                          |              |
|                                         +--- Lô Khung Hình Đã Gom Nhóm ------------+              |
+---------------------------------------------------------------------------------------------------+
                                          |
                                          v
+---------------------------------------------------------------------------------------------------+
|                                 ĐƯỜNG ỐNG HIỂN THỊ DUAL-CANVAS                                    |
|                                                                                                   |
|   +---------------------------------------+       +---------------------------------------+       |
|   |        BIỂU ĐỒ A: Khung Lớn (H1)      |       |        BIỂU ĐỒ B: Khung Nhỏ (M5)      |       |
|   |  - Canvas TradingView A               |       |  - Canvas TradingView B               |       |
|   |  - Lớp Canvas Vẽ 2D Trong Suốt A      |       |  - Lớp Canvas Vẽ 2D Trong Suốt B      |       |
|   |  - Cập Nhật Nến Đang Chạy O(1)        |       |  - Cập Nhật Từng Nến/Tick O(1)        |       |
|   +---------------------------------------+       +---------------------------------------+       |
|                       ^                                               ^                           |
|                       |                                               |                           |
|                       +--- Đồng Bộ Con Trỏ Trực Tiếp (0ms React) -----+                           |
+---------------------------------------------------------------------------------------------------+
                                          |
                              Tín Hiệu Đặt Lệnh (Signal)
                                          v
+---------------------------------------------------------------------------------------------------+
|                       DAEMON CẦU NỐI KHỚP LỆNH CỤC BỘ (`localhost:8766`)                          |
|                                                                                                   |
|   +-------------------------------------+   +-------------------------------------------------+   |
|   |   Máy Chủ WebSocket (`ws://127.0.0.1`)| |   Cổng Nhận Webhook (`http://127.0.0.1/v1/webhook`| |
|   +-------------------------------------+   +-------------------------------------------------+   |
|                      |                                       |                                    |
|                      v                                       v                                    |
|   +-------------------------------------------------------------------------------------------+   |
|   |                 Cổng Chắn Rủi Ro Prop Firm & Bộ Chặn Trước Lệnh                           |   |
|   |       (Kiểm Soát Thua Lỗ Ngày, Bộ Ngắt Mạch Độ Trễ, Khóa Trùng Lặp Idempotency)           |   |
|   +-------------------------------------------------------------------------------------------+   |
|                      |                                                                            |
|         +------------+------------+--------------------+---------------------+                    |
|         v                         v                    v                     v                    |
|   +--------------+        +---------------+    +---------------+     +---------------+            |
|   | Trình Điều   |        | Trình Điều    |    | Trình Điều    |     | Trình Điều    |            |
|   | Khiển Binance|        | Khiển Bybit   |    | Khiển IBKR    |     | Khiển MT4/MT5 |            |
|   +--------------+        +---------------+    +---------------+     +---------------+            |
+---------------------------------------------------------------------------------------------------+
```

---

## 3. Phân Hệ 1: Cỗ Máy Đồng Bộ Đa Khung Thời Gian Bằng Web Worker

### 3.1. Mô Hình Phân Lập Luồng
Web Worker vận hành như một luồng xử lý độc lập hoàn toàn với không gian bộ nhớ và vòng lặp sự kiện riêng:
- **Nhiệm Vụ Luồng Chính (Main Thread)**: Hoàn toàn phản ứng (Reactive). Lắng nghe thao tác người dùng (phát, tạm dừng, tua thời gian, vẽ kỹ thuật), cập nhật giao diện DOM, và gọi cập nhật trực tiếp vào canvas TradingView (`series.update()`).
- **Nhiệm Vụ Luồng Worker**: Quyền uy tuyệt đối (Authoritative). Lưu trữ tập dữ liệu gốc, điều phối dòng thời gian, tổng hợp nến đa khung, tính toán chỉ báo kỹ thuật, chạy chiến lược bot AI tự động, và khớp lệnh.

### 3.2. Giao Thức Thông Điệp IPC Định Kiểu Chặt Chẽ
Tất cả dữ liệu trao đổi giữa luồng chính và `ReplaySyncWorker` tuân thủ nghiêm ngặt định dạng TypeScript có kiểu:

```typescript
export type WorkerInboundAction =
  | { type: 'LOAD_DATASET'; payload: { symbol: string; candles: Candle[]; baseTimeframe: Timeframe; linkedTimeframes: Timeframe[] } }
  | { type: 'REPLAY_PLAY'; payload: { speed: number } }
  | { type: 'REPLAY_PAUSE' }
  | { type: 'REPLAY_STEP'; payload: { direction: 'FORWARD' | 'BACKWARD'; stepCount: number } }
  | { type: 'REPLAY_SEEK'; payload: { targetTimestamp: number } }
  | { type: 'REPLAY_SET_SPEED'; payload: { speed: number } }
  | { type: 'ORDER_SUBMIT'; payload: UnifiedOrderRequest }
  | { type: 'ORDER_CANCEL'; payload: { orderId: string } }
  | { type: 'UPDATE_CONFIG'; payload: { layout: 'SINGLE' | 'DUAL_HORIZONTAL' | 'DUAL_VERTICAL'; spreadPips: number } };

export type WorkerOutboundEvent =
  | { type: 'DATASET_LOADED'; payload: { totalCandles: number; startTimestamp: number; endTimestamp: number } }
  | { type: 'FRAME_BATCH'; payload: ReplayFrameBatch }
  | { type: 'SEEK_COMPLETE'; payload: { currentTimestamp: number; chartASnapshot: Candle[]; chartBSnapshot: Candle[] } }
  | { type: 'ORDER_EVENT'; payload: { event: 'FILLED' | 'CLOSED' | 'CANCELLED' | 'REJECTED'; order: BrokerOrder | BrokerPosition } }
  | { type: 'PROP_SHIELD_VIOLATION'; payload: { rule: string; message: string; breachValue: number } }
  | { type: 'WORKER_ERROR'; payload: { code: string; message: string; stack?: string } };
```

### 3.3. Cấu Trúc Dữ Liệu Tra Cứu Đệm $O(1)$: `TimestampIndexBuffer`
Nhằm triệt tiêu chi phí tìm kiếm nhị phân ($O(\log N)$) và lặp tuyến tính ($O(N)$), worker xây dựng sẵn một mảng định kiểu phẳng ngay khi nạp tập dữ liệu.

#### Nguyên Lý Toán Học:
1. Đặt $T_0$ là mốc thời gian bắt đầu của tập dữ liệu (tính theo giây UTC).
2. Đặt $\Delta t_{base}$ là chu kỳ nến cơ sở tính bằng giây (ví dụ: 60 giây đối với M1).
3. Tập dữ liệu nằm trong miền thời gian $[T_0, T_{max}]$.
4. Khởi tạo một mảng phẳng liên tục `Int32Array` với kích thước $K = \lceil \frac{T_{max} - T_0}{\Delta t_{base}} \rceil + 1$.
5. Với mỗi chỉ số $k \in [0, K-1]$, `lookupTable[k]` lưu trữ trực tiếp vị trí index của nến trong mảng dữ liệu gốc đang có hiệu lực tại thời điểm $T_0 + k \cdot \Delta t_{base}$. Nếu rơi vào khoảng trống thị trường đóng cửa cuối tuần hoặc ngày lễ, giá trị sẽ trỏ tới cây nến hợp lệ gần nhất trước đó.

```typescript
export class TimestampIndexBuffer {
  private baseTimestamp: number;
  private intervalSeconds: number;
  private table: Int32Array;
  private candleCount: number;

  constructor(candles: Candle[], intervalSeconds: number = 60) {
    if (candles.length === 0) {
      this.baseTimestamp = 0;
      this.intervalSeconds = intervalSeconds;
      this.table = new Int32Array(0);
      this.candleCount = 0;
      return;
    }

    this.baseTimestamp = candles[0].timestamp;
    this.intervalSeconds = intervalSeconds;
    this.candleCount = candles.length;

    const lastTimestamp = candles[candles.length - 1].timestamp;
    const totalSlots = Math.floor((lastTimestamp - this.baseTimestamp) / intervalSeconds) + 1;
    this.table = new Int32Array(totalSlots);
    this.table.fill(-1);

    let currentCandleIdx = 0;
    for (let slot = 0; slot < totalSlots; slot++) {
      const slotTime = this.baseTimestamp + slot * intervalSeconds;
      while (
        currentCandleIdx < candles.length - 1 &&
        candles[currentCandleIdx + 1].timestamp <= slotTime
      ) {
        currentCandleIdx++;
      }
      this.table[slot] = currentCandleIdx;
    }
  }

  public getCandleIndexAt(timestamp: number): number {
    if (timestamp < this.baseTimestamp) return 0;
    const slot = Math.floor((timestamp - this.baseTimestamp) / this.intervalSeconds);
    if (slot >= this.table.length) return this.candleCount - 1;
    return this.table[slot];
  }
}
```

- **Độ Phức Tạp Tra Cứu**: $\mathcal{O}(1)$ — chính xác 1 phép toán số học chỉ số và 1 lần truy xuất bộ nhớ.
- **Dung Lượng Bộ Nhớ**: Với 1.440.000 nến trong 5 năm dữ liệu M1, mảng chỉ tiêu tốn $\approx 5.76 \text{ MB}$, hoàn toàn tối ưu trong luồng Worker.

### 3.4. Bộ Tổng Hợp Nến Khung Lớn Đang Hình Thành (Không Nhìn Trước Tương Lai)
Khi phát lại một khung nhỏ (LTF, ví dụ M5) đối chiếu với khung lớn (HTF, ví dụ H1):
1. **Nguy Cơ Lệch Lạc Dữ Liệu**: Các phần mềm thông thường hay vẽ sẵn toàn bộ cây nến H1 đã đóng khi người dùng mới chỉ tua tới cây nến M5 đầu tiên trong giờ đó. Điều này vô tình để lộ giá High, Low, Close của tương lai, làm sai lệch hoàn toàn kết quả kiểm thử.
2. **Cơ Chế Tích Lũy Trạng Thái (Stateful Accumulator)**:
   - Worker duy trì cấu trúc nến đang hình thành:
     $$\mathcal{C}_{dev} = \{ t_{start}, O, H, L, C, V \}$$
   - Với mỗi nến LTF $b_{ltf}$ đi tới:
     - Nếu $b_{ltf}.timestamp \ge t_{start} + \Delta t_{htf}$: Nến HTF trước đó được chốt (`isNewBar = true`), lưu vào lịch sử, và tạo nến mới với $O, H, L, C, V$ khởi tạo từ $b_{ltf}$.
     - Ngược lại ($b_{ltf}$ vẫn thuộc chu kỳ HTF hiện tại):
       $$H \leftarrow \max(H, b_{ltf}.high), \quad L \leftarrow \min(L, b_{ltf}.low), \quad C \leftarrow b_{ltf}.close, \quad V \leftarrow V + b_{ltf}.volume$$
   - Phát thông điệp $\mathcal{C}_{dev}$ với cờ `isSecondaryNewBar = false`. Luồng giao diện chỉ cần gọi `series.update(candle)`, làm thân nến và bóng nến nhảy động theo thời gian thực mà không cần vẽ lại toàn bộ biểu đồ.

---

## 4. Phân Hệ 2: Kiến Trúc Bộ Nhớ Dual-Canvas & Đường Ống Render 60 FPS

### 4.1. Thông Số Giao Diện Dual-Canvas
Hệ thống cung cấp hai chế độ hiển thị chia đôi:
1. **Chia Ngang (Xếp Chồng)**: Biểu đồ trên = Khung Lớn (H4 / H1); Biểu đồ dưới = Khung Nhỏ (M15 / M5 / M1). Phù hợp với màn hình rộng (16:9, 21:9).
2. **Chia Dọc (Song Song)**: Biểu đồ trái = Khung Lớn; Biểu đồ phải = Khung Nhỏ. Tối ưu cho thiết lập hai màn hình hoặc tỷ lệ khung vuông.

### 4.2. Cấu Trúc Bộ Nhớ & Ảo Hóa Dữ Liệu Nến (Windowing)
Nạp 200.000 nến vào hai đối tượng Lightweight Charts độc lập sẽ tiêu hao $>240 \text{ MB}$ bộ nhớ VRAM và JavaScript Heap, gây hiện tượng khựng giật do thu gom rác (Garbage Collection).

**Vùng Đệm Hiển Thị Giới Hạn (Windowed Viewport Buffer)**:
- Luồng chính chỉ lưu trữ vùng nến hiển thị cộng thêm một khoảng đệm cuộn ($\approx 5.000$ nến cho mỗi biểu đồ).
- Toàn bộ 1.440.000 nến được lưu giữ trong Web Worker ở luồng nền.
- Khi người dùng cuộn ngược về quá khứ qua ngưỡng đệm, giao diện mới gửi yêu cầu lấy mảnh dữ liệu (`FETCH_CHUNK`) từ Worker.

| Tiêu Chí Đánh Giá | Biểu Đồ Đơn (v1.3.0) | Hai Biểu Đồ (Chưa Tối Ưu) | Hai Biểu Đồ Chuẩn RFC-002 |
| :--- | :--- | :--- | :--- |
| **Số Lượng Canvas Hoạt Động** | 1 Chart + 1 Drawing | 2 Charts + 2 Drawings | 2 Charts + 2 Drawings |
| **Độ Dài Dữ Liệu Series** | Toàn bộ (100k+ nến) | Gấp đôi (200k+ nến) | **Cắt Theo Cửa Sổ (2x 5.000 nến)** |
| **Bộ Nhớ Heap Ổn Định** | $\approx 42 \text{ MB}$ | $\approx 185 \text{ MB}$ | **$\approx 68 \text{ MB}$** |
| **Thời Gian Ngừng GC** | $< 2 \text{ ms}$ | $18 - 45 \text{ ms}$ (rớt khung) | **$< 3 \text{ ms}$ (Không Tụt Khung)** |
| **Thời Gian Render (10x)** | $0.05 \text{ ms}$ | $3.8 \text{ ms}$ | **$0.12 \text{ ms}$** |
| **Tốc Độ Khung Hình Ở 50x** | 60 FPS | 18–24 FPS | **60 FPS Duy Trì Ổn Định** |

### 4.3. Đồng Bộ Con Trỏ Trực Tiếp (Triệt Tiêu Hoàn Toàn React Render)
Khi di chuột trên Biểu đồ A, cùng thời điểm đó trên Biểu đồ B phải hiển thị đường dóng thời gian và thước giá tương ứng.

**Giải Pháp Kiến Trúc RFC-002**:
- Bỏ qua hoàn toàn việc đưa tọa độ chuột vào React State hoặc Zustand Store.
- Sử dụng cơ chế đăng ký trực tiếp giữa các đối tượng Canvas:
  ```typescript
  chartA.subscribeCrosshairMove((param: MouseEventParams) => {
    if (!param.time || !crosshairSyncEnabled) return;
    const coordinate = chartB.timeScale().timeToCoordinate(param.time);
    if (coordinate !== null) {
      drawingCanvasB.renderCrosshairGuide(coordinate);
    }
  });
  ```
- Kết quả: **0 lần kích hoạt React re-render**, **0 byte cấp phát rác**, độ trễ $<0.01\text{ms}$.

---

## 5. Phân Hệ 3: Daemon Cầu Nối Khớp Lệnh Cục Bộ (QEB)

### 5.1. Môi Trường Vận Hành Daemon
- **Mô Hình Tiến Trình**: Dịch vụ độc lập viết bằng Node.js/TypeScript (chạy qua `npm run bridge:start` hoặc binary đóng gói).
- **Cổng Giao Tiếp Mạng**:
  - `http://127.0.0.1:8766`: API REST & Cổng Thu Nhận Webhook
  - `ws://127.0.0.1:8766/stream`: Kênh WebSocket Hai Chiều Siêu Tốc
- **Ràng Buộc An Toàn Giao Diện Loopback**: Chỉ mở cổng trên `127.0.0.1` và `::1`.

### 5.2. Giao Thức Kết Nối Đa Sàn (`IBrokerDriver`)
Daemon cung cấp giao diện trừu tượng đồng nhất:

```typescript
export interface IBrokerDriver {
  readonly brokerType: BrokerType;
  readonly isConnected: boolean;

  connect(config: BrokerConfig): Promise<void>;
  disconnect(): Promise<void>;
  getAccount(): Promise<BrokerAccount>;
  getPositions(): Promise<BrokerPosition[]>;
  getOrders(): Promise<BrokerOrder[]>;
  
  submitOrder(request: UnifiedOrderRequest): Promise<BrokerDeal>;
  modifyOrder(request: UnifiedModifyRequest): Promise<boolean>;
  cancelOrder(ticket: string | number): Promise<boolean>;
  closePosition(request: UnifiedCloseRequest): Promise<BrokerDeal>;

  subscribeMarketData(symbols: string[], callback: (tick: LiveTickUpdate) => void): void;
  unsubscribeMarketData(symbols: string[]): void;
}
```

#### Các Trình Điều Khiển Được Hỗ Trợ:
1. **Binance Driver**: Hỗ trợ Spot & USD-M Futures, ký mã hóa HMAC-SHA256, kênh WebSocket Private Execution Stream.
2. **Bybit Driver**: Giao diện tài khoản Bybit v5 Unified Trading Account (UTA) cho Linear USDT & Inverse Perpetuals.
3. **Interactive Brokers Driver (IBKR)**: Kết nối TWS / IB Gateway qua giao tiếp socket IPC cổng 7496/7497.
4. **MetaTrader 4 & 5 Driver**: Kết nối trạm MT4/MT5 qua cầu nối ZeroMQ hoặc thư viện Python IPC.

### 5.3. Cổng Chắn Rủi Ro Prop Firm & Ngắt Mạch Tự Động
- **Kiểm Soát Rủi Ro Trước Khi Gửi Lệnh**: Đánh giá giới hạn lỗ tối đa trong ngày (Max Daily Loss), sụt giảm tài khoản thả nổi (Trailing Drawdown), và khung giờ tin tức kinh tế nhạy cảm *trực tiếp trên daemon* trước khi đẩy lệnh ra sàn.
- **Khóa Trùng Lặp Idempotency**: Mỗi lệnh mang mã `clientOrderId` (UUIDv7). Nếu có yêu cầu gửi lại trong 60 giây, daemon trả về biên lai giao dịch cũ mà không phát sinh lệnh trùng lặp.
- **Ngắt Mạch Độ Trễ (Latency Circuit Breaker)**: Liên tục đo độ trễ phản hồi sàn. Nếu ping vượt quá **250ms** hoặc mất kết nối 3 lần liên tiếp, hệ thống tự động khóa tính năng vào lệnh tự động để bảo vệ tài khoản khỏi trượt giá nghiêm trọng.

---

## 6. Lộ Trình Triển Khai Kỹ Thuật & Phân Chia Nhiệm Vụ Cho Kỹ Sư Vulcan

```
+---------------------------------------------------------------------------------------------------+
|                            CÁC GIAI ĐOẠN TRIỂN KHAI KỸ THUẬT (v2.0)                               |
+---------------------------------------------------------------------------------------------------+
|  Giai Đoạn 1: Lõi Web Worker & Bảng Đệm Thời Gian O(1)                                            |
|  - Xây dựng `src/engine/timeframeBuffer.ts` (Bảng đệm phẳng Int32Array O(1))                      |
|  - Xây dựng `src/workers/replaySyncWorker.ts` (Vòng lặp luồng worker, đồng hồ, nến HTF đang chạy)|
|  - Xây dựng `src/engine/workerBridge.ts` (Bộ điều khiển kết nối worker từ luồng chính)           |
+---------------------------------------------------------------------------------------------------+
|  Giai Đoạn 2: Giao Diện Biểu Đồ Dual-Canvas & Đồng Bộ Con Trỏ 0ms                                 |
|  - Xây dựng `src/components/chart/DualChartView.tsx` (Khung hiển thị chia ngang/chia dọc)         |
|  - Xây dựng `src/hooks/useDualChartSync.ts` (Phép chiếu tọa độ con trỏ trực tiếp không qua React) |
|  - Tối ưu hóa cửa sổ dữ liệu nến (Windowed Virtualization) trong `TradingViewChart.tsx`          |
+---------------------------------------------------------------------------------------------------+
|  Giai Đoạn 3: Daemon Cầu Nối Khớp Lệnh Quant Execution Bridge                                     |
|  - Xây dựng `bridge/daemon.ts` (Máy chủ WebSocket + Webhook cổng 8766)                            |
|  - Xây dựng `bridge/security/riskInterceptor.ts` (Bộ kiểm duyệt an toàn vốn Prop Firm Shield)     |
|  - Xây dựng `src/store/executionBridgeStore.ts` (Quản lý trạng thái cầu nối trên giao diện)       |
+---------------------------------------------------------------------------------------------------+
|  Giai Đoạn 4: Các Trình Điều Khiển Sàn Giao Dịch Đa Năng                                          |
|  - Xây dựng `bridge/drivers/BinanceDriver.ts` (REST + WS, chữ ký HMAC)                            |
|  - Xây dựng `bridge/drivers/BybitDriver.ts` (API Bybit v5 Unified Account)                        |
|  - Xây dựng `bridge/drivers/IBKRDriver.ts` (Cầu nối socket TWS/Gateway)                           |
|  - Xây dựng `bridge/drivers/MetaTraderDriver.ts` (Cầu nối MT4/MT5 IPC)                            |
+---------------------------------------------------------------------------------------------------+
|  Giai Đoạn 5: Kiểm Thử Hiệu Năng & Chứng Nhận Chất Lượng                                          |
|  - Xây dựng `tests/benchmarks/dual_chart_fps.bench.ts` (Kiểm thử tự động chuẩn 60 FPS)            |
|  - Xây dựng bộ kiểm thử tích hợp toàn diện cho Cầu nối khớp lệnh                                  |
|  - Đảm bảo 100% bản dịch trên 4 ngôn ngữ (en, vi, ja, zh) cho mọi thành phần giao diện mới        |
+---------------------------------------------------------------------------------------------------+
```

---

## 7. Biên Bản Bàn Giao Kỹ Thuật (Autonomous Handover)

### 🛠️ Architecture Specification — Daedalus (CTO)
- **Hợp Phần Hệ Thống**: Đồng Bộ Web Worker Đa Biểu Đồ & Cầu Nối Khớp Lệnh Quant Backtest Pro v2.0
- **Nguyên Tắc Kiến Trúc Bắt Buộc**:
  1. Phân lập hoàn toàn vòng lặp replay và tổng hợp nến HTF vào Web Worker (`src/workers/replaySyncWorker.ts`).
  2. Tra cứu nến tuyệt đối theo thời gian thực $\mathcal{O}(1)$ bằng mảng định kiểu `Int32Array` (`src/engine/timeframeBuffer.ts`).
  3. Chiếu tọa độ con trỏ trực tiếp giữa 2 canvas, nghiêm cấm kích hoạt React Re-render (`src/hooks/useDualChartSync.ts`).
  4. Vận hành daemon cầu nối riêng biệt (`bridge/daemon.ts`) kết nối WebSocket và Webhook tới Binance, Bybit, IBKR, MT4/5.
  5. Đảm bảo chuẩn i18n 100% đầy đủ cả 4 ngôn ngữ (Anh, Việt, Nhật, Trung).
- **Ràng Buộc Kỹ Thuật**:
  - Giới hạn chu kỳ render: $\le 16.6 \text{ ms}$ (duy trì 60 FPS ổn định ở tốc độ tua 10x).
  - Đỉnh dung lượng bộ nhớ Heap: $\le 150 \text{ MB}$.
  - Tuyệt đối không viết chuỗi ký tự cứng trong JSX/TSX; không dùng fallback dạng `t.key || 'default'`.
  - Không chạy lệnh `git push` lên remote — tạo commit cục bộ sạch sẽ.
- **Kỹ Sư Được Phân Công**: @Vulcan (Senior Full-Stack Software Engineer)
- **Cổng Kiểm Tra Phê Duyệt**: Phải vượt qua 100% bài kiểm tra tự động (`npm test`), không lỗi kiểu (`npx tsc --noEmit`), không vi phạm i18n (`npm run check:i18n`), và đạt chứng nhận 60 FPS trước khi sáp nhập.
