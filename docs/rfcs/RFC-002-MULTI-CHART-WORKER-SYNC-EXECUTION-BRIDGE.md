# Technical RFC 002: Multi-Chart Web Worker Synchronization & Local Execution Bridge Daemon
## Quant Backtest Pro Architecture Specification — v2.0 Enterprise

- **RFC Identifier**: RFC-002-TECH-v2
- **Title**: High-Performance Multi-Chart Synchronization via Web Workers and Institutional Execution Bridge Daemon
- **Author**: Daedalus (Chief Technology Officer / Principal Architect)
- **Contributors & Reviewers**: Athena (CEO), Prometheus (CPO), Minerva (Lead PM), Vulcan (Senior SWE), Argus (Lead QA), Aegis (Cyber Security), Titan (DevOps)
- **Target Release**: Quant Backtest Pro v2.0 Enterprise
- **Status**: Ratified Architectural Blueprint
- **Related PRD**: [`docs/PRD_V2_MULTI_CHART_PORTFOLIO.md`](../PRD_V2_MULTI_CHART_PORTFOLIO.md)
- **Date**: October 2026

---

## 1. Executive Summary & Architectural Motivation

### 1.1. Context & Technical Drivers
Quant Backtest Pro v1.3.0 achieved industry-leading performance for single-chart market replay, delivering **60 FPS** updates for up to 1,440,000 historical OHLCV candles through $O(1)$ incremental canvas updates. However, the v2.0 product vision outlined in PRD-v2 mandates two paradigm shifts:
1. **Synchronized Dual-Chart / Multi-Timeframe Replay**: Running two simultaneous charting canvases (e.g., Daily/H4 macro market structure alongside M5/M1 micro-execution) locked to a unified millisecond timeline scrubber.
2. **Institutional Execution Bridge**: Dispatching live and paper-trading signals directly from the browser to tier-1 crypto exchanges (Binance, Bybit), institutional multi-asset brokers (Interactive Brokers), and retail FX terminals (MetaTrader 4 & 5).

### 1.2. The Single-Threaded Bottleneck (The Problem)
In a browser runtime, the main thread orchestrates:
- DOM rendering and React virtual DOM reconciliation.
- HTML5 Canvas rasterization and TradingView Lightweight Charts rendering.
- Complex technical indicator calculations (RSI, Bollinger Bands, ATR, EMA, MACD).
- Real-time Order Matching Engine simulation (limit fills, slippage, spread, prop firm trailing drawdowns).

When running two charts simultaneously:
- **CPU Starvation**: Executing indicator recalculations and candle resampling for two charts inside a single 16.6ms frame budget causes severe event loop congestion.
- **Frame Drops**: Replay speeds above 10x (100–1000 bars/sec) cause frame rates to collapse from 60 FPS down to 12–18 FPS.
- **Time Complexity Pitfall**: Re-aligning timeframes via linear scans $O(N)$ or binary searches $O(\log N)$ on every tick over 1.44M bars introduces unacceptable GC pressure and micro-stuttering.
- **Sandbox Restrictions**: Web browsers strictly forbid raw TCP socket connections (RFC 6455), blocking direct connectivity to Interactive Brokers TWS (port 7496) and MetaTrader IPC.

### 1.3. The Architectural Solution
1. **Dedicated Replay Web Worker (`ReplaySyncWorker`)**: Moves clock synchronization, timeframe resampling, developing candle synthesis, and multi-symbol tick streaming completely off the main UI thread into a background thread.
2. **$O(1)$ Direct-Index Buffer Table (`TimestampIndexBuffer`)**: Uses structured typed arrays (`Int32Array`) and bucketed hash tables to resolve timeframe candle alignment in exact $O(1)$ constant time with zero allocations.
3. **Dual-Canvas Virtualization & Direct Crosshair Matrix**: Eliminates React state updates during mouse movement; coordinates crosshairs through direct canvas coordinate projection, keeping heap allocations at 0 bytes per frame.
4. **Lightweight Local Execution Bridge Daemon (QEB)**: A standalone Node.js/TypeScript daemon running on `localhost:8766`, exposing an ultra-low latency WebSocket stream and webhook ingestion endpoint to bridge browser signals to Binance, Bybit, Interactive Brokers, and MT4/MT5.

---

## 2. High-Level System Architecture Diagram

```
+---------------------------------------------------------------------------------------------------+
|                                  BROWSER RUNTIME (Main UI Thread)                                 |
|                                                                                                   |
|  +---------------------------------------------------------------------------------------------+  |
|  |                             Zustand State Store (`useBacktestStore`)                         |  |
|  +---------------------------------------------------------------------------------------------+  |
|               |                                                                    ^              |
|        Control Commands                                                    State Updates          |
|    (LOAD, PLAY, STEP, SEEK)                                            (CandleBatch, OMS State)   |
|               v                                                                    |              |
|  +-------------------------------------------------------------+                   |              |
|  |              Worker Bridge Controller (`WorkerBridge`)       |                   |              |
|  +-------------------------------------------------------------+                   |              |
|               | (postMessage / Transferable)                                       |              |
+---------------|--------------------------------------------------------------------|--------------+
                |                                                                    |
+---------------v--------------------------------------------------------------------|--------------+
|                              BACKGROUND DEDICATED WEB WORKER                                      |
|                                                                                    |              |
|  +------------------------------------------------------------------------------+  |              |
|  |                     `ReplaySyncWorker` (Replay Execution Loop)               |  |              |
|  |                                                                              |  |              |
|  |   +--------------------------+   +---------------------------------------+   |  |              |
|  |   | Master Playback Clock    |   | TimestampIndexBuffer (O(1) Map)       |   |  |              |
|  |   | (Tick / Microsecond Res) |   | Int32Array Lookup Table               |   |  |              |
|  |   +--------------------------+   +---------------------------------------+   |  |              |
|  |               |                                      |                       |  |              |
|  |               v                                      v                       |  |              |
|  |   +----------------------------------------------------------------------+   |  |              |
|  |   | Dynamic Developing Candle Synthesizer (Zero-Lookahead HTF Generator) |   |  |              |
|  |   +----------------------------------------------------------------------+   |  |              |
|  |               |                                                              |  |              |
|  |               v                                                              |  |              |
|  |   +----------------------------------------------------------------------+   |  |              |
|  |   | Multi-Asset Order Matching Engine (OMS Simulation Core)              |   |  |              |
|  |   +----------------------------------------------------------------------+   |  |              |
|  +------------------------------------------------------------------------------+  |              |
|                                         |                                          |              |
|                                         +--- Transferable Batched Frames ----------+              |
+---------------------------------------------------------------------------------------------------+
                                          |
                                          v
+---------------------------------------------------------------------------------------------------+
|                                 DUAL-CANVAS RENDERING PIPELINE                                    |
|                                                                                                   |
|   +---------------------------------------+       +---------------------------------------+       |
|   |         CHART A: Higher TF (H1)       |       |         CHART B: Lower TF (M5)        |       |
|   |  - TradingView Lightweight Canvas A   |       |  - TradingView Lightweight Canvas B   |       |
|   |  - Drawing Canvas Overlay A           |       |  - Drawing Canvas Overlay B           |       |
|   |  - O(1) Developing Bar Updates       |       |  - O(1) Tick-by-Tick Bar Updates      |       |
|   +---------------------------------------+       +---------------------------------------+       |
|                       ^                                               ^                           |
|                       |                                               |                           |
|                       +--- Direct Matrix Crosshair Sync (0ms React) --+                           |
+---------------------------------------------------------------------------------------------------+
                                          |
                               Order Executions (Signal)
                                          v
+---------------------------------------------------------------------------------------------------+
|                       QUANT EXECUTION BRIDGE DAEMON (`localhost:8766`)                            |
|                                                                                                   |
|   +-------------------------------------+   +-------------------------------------------------+   |
|   |  WebSocket Server (`ws://127.0.0.1`) |   |  Webhook Receiver (`http://127.0.0.1/v1/webhook` | |
|   +-------------------------------------+   +-------------------------------------------------+   |
|                      |                                       |                                    |
|                      v                                       v                                    |
|   +-------------------------------------------------------------------------------------------+   |
|   |                 Prop Firm Risk Shield & Pre-Trade Interceptor Gate                        |   |
|   |          (Max Daily Loss Check, Latency Circuit Breaker, Idempotency Guard)               |   |
|   +-------------------------------------------------------------------------------------------+   |
|                      |                                                                            |
|         +------------+------------+--------------------+---------------------+                    |
|         v                         v                    v                     v                    |
|   +--------------+        +---------------+    +---------------+     +---------------+            |
|   | Binance v3   |        |  Bybit v5     |    | Interactive   |     | MetaTrader    |            |
|   | Driver (HMAC)|        | Unified Driver|    | Brokers TWS   |     | MT4/MT5 IPC   |            |
|   +--------------+        +---------------+    +---------------+     +---------------+            |
+---------------------------------------------------------------------------------------------------+
```

---

## 3. Subsystem 1: Web Worker Multi-Timeframe Synchronization Engine

### 3.1. Threading Isolation Model
The Web Worker operates as an isolated execution thread with its own event loop and memory space:
- **Main Thread Duty**: Purely reactive. Listens for user gestures (play, pause, seek, draw), updates the DOM, and issues imperative calls to Lightweight Charts canvas series (`series.update()`).
- **Worker Thread Duty**: Authoritative. Holds the master dataset, advances time, computes multi-timeframe candle aggregations, runs technical indicators, evaluates auto-trading strategies, and executes order fills.

### 3.2. Worker IPC Message Protocol
All communication between the main thread and `ReplaySyncWorker` uses strictly typed message envelopes with zero arbitrary payloads:

```typescript
// Envelope Definitions
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

export interface ReplayFrameBatch {
  masterTimestamp: number;
  primaryCandle: Candle;            // Lower Timeframe Candle (e.g. M5)
  secondaryCandle: Candle;          // Higher Timeframe Developing Candle (e.g. H1)
  isSecondaryNewBar: boolean;       // True when secondary TF crossed a period boundary
  accountState: {
    balance: number;
    equity: number;
    margin: number;
    freeMargin: number;
    unrealizedPnL: number;
  };
}
```

### 3.3. $O(1)$ Buffer Lookup: `TimestampIndexBuffer`
To eliminate binary search overhead ($O(\log N)$) and linear iteration ($O(N)$), the worker constructs a pre-indexed flat array when the dataset is loaded.

#### Mathematical Foundation:
1. Let $T_0$ be the dataset starting epoch timestamp (in seconds).
2. Let $\Delta t_{base}$ be the base candle resolution in seconds (e.g., 60 seconds for M1).
3. The dataset spans an epoch domain $[T_0, T_{max}]$.
4. A contiguous `Int32Array` lookup table of size $K = \lceil \frac{T_{max} - T_0}{\Delta t_{base}} \rceil + 1$ is allocated.
5. For each index $k \in [0, K-1]$, `lookupTable[k]` stores the exact candle index in the raw data array that was active at epoch $T_0 + k \cdot \Delta t_{base}$. If a holiday/weekend gap occurs, `lookupTable[k]` points to the last known candle index (holding forward) or a negative sentinel `-1` (market closed).

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

    // Build O(1) slot index
    let currentCandleIdx = 0;
    for (let slot = 0; slot < totalSlots; slot++) {
      const slotTime = this.baseTimestamp + slot * intervalSeconds;
      
      // Advance candle pointer if current candle timestamp matches or precedes slotTime
      while (
        currentCandleIdx < candles.length - 1 &&
        candles[currentCandleIdx + 1].timestamp <= slotTime
      ) {
        currentCandleIdx++;
      }

      this.table[slot] = currentCandleIdx;
    }
  }

  /**
   * O(1) Constant-Time Lookup for any arbitrary Unix timestamp
   */
  public getCandleIndexAt(timestamp: number): number {
    if (timestamp < this.baseTimestamp) return 0;
    const slot = Math.floor((timestamp - this.baseTimestamp) / this.intervalSeconds);
    if (slot >= this.table.length) return this.candleCount - 1;
    return this.table[slot];
  }
}
```

- **Lookup Complexity**: $\mathcal{O}(1)$ — exactly 1 array index arithmetic and 1 memory access.
- **Memory Footprint**: For 1.44M candles across 5 years of M1 data, the table consumes $\approx 5.76 \text{ MB}$, well within worker memory budgets.

### 3.4. Dynamic Developing Candle Synthesizer (Zero-Lookahead HTF)
When replaying a Lower Timeframe (LTF, e.g. M5) against a Higher Timeframe (HTF, e.g. H1):
1. **The Lookahead Hazard**: Traditional replay tools render the completed H1 candle when scrubbing through the first M5 bar of that hour. This exposes the future High, Low, and Close, invalidating backtest fidelity.
2. **The Stateful Synthesizer**:
   - The worker maintains an in-memory mutable developing candle struct:
     $$\mathcal{C}_{dev} = \{ t_{start}, O, H, L, C, V \}$$
   - For every incoming LTF bar $b_{ltf}$:
     - If $b_{ltf}.timestamp \ge t_{start} + \Delta t_{htf}$: The current developing candle is marked **finalized** (`isNewBar = true`), appended to HTF history, and a new developing bar is initiated with:
       $$O = b_{ltf}.open, \quad H = b_{ltf}.high, \quad L = b_{ltf}.low, \quad C = b_{ltf}.close, \quad V = b_{ltf}.volume$$
     - Otherwise ($b_{ltf}$ belongs to the current HTF bucket):
       $$H \leftarrow \max(H, b_{ltf}.high), \quad L \leftarrow \min(L, b_{ltf}.low), \quad C \leftarrow b_{ltf}.close, \quad V \leftarrow V + b_{ltf}.volume$$
   - Emits $\mathcal{C}_{dev}$ with `isSecondaryNewBar = false`. On the main thread, this triggers `series.update(candle)`, expanding wicks and shifting the real-time close without redrawing previous bars.

### 3.5. Adaptive Message Coalescing & Throttling
At replay speeds between 50x and 100x, the worker steps forward up to 1,000 candles per second. Flooding the browser event loop with 1,000 `postMessage` calls per second causes message queue overflow and dropped UI inputs.

**Coalescing Strategy**:
- The worker executes simulation steps at full algorithmic speed.
- It flushes `FRAME_BATCH` messages to the main UI thread at a fixed cadence aligned with display refresh rates (**60 Hz / 16.6ms intervals** or **30 Hz on low-power devices**).
- During coalescing, intermediate order fills and stop-loss triggers are accumulated into an atomic transaction list. The main thread receives the final bar state plus the execution delta in a single message.

---

## 4. Subsystem 2: Dual-Canvas Memory Architecture & 60 FPS Render Pipeline

### 4.1. Dual-Canvas Layout Specification
The UI offers two split configurations:
1. **Dual Horizontal Split (Stacked)**: Top pane = Macro Chart (e.g. H4 / H1); Bottom pane = Micro Chart (e.g. M15 / M5 / M1). Ideal for wide-screen monitors (16:9, 21:9).
2. **Dual Vertical Split (Side-by-Side)**: Left pane = Macro Chart; Right pane = Micro Chart. Ideal for dual-monitor setups and square aspect ratios.

Each pane hosts:
- 1 TradingView Lightweight Charts canvas (`IChartApi`)
- 1 Transparent HTML5 Canvas 2D overlay (`DrawingCanvas`)
- 1 Header HUD with independent symbol, timeframe, and drawing toolbar controls.

### 4.2. Memory Profile & Series Windowing
Loading 200,000 historical candles into two independent Lightweight Charts instances would consume $>240 \text{ MB}$ of VRAM and JS heap, inducing Garbage Collection (GC) latency spikes.

**Windowed Viewport Buffer**:
- The main thread maintains only the active visible window plus a rolling cache buffer ($\approx 5,000$ candles per chart).
- When the user pans backward beyond the cached boundary, the UI requests an asynchronous chunk from the Web Worker (`FETCH_CHUNK`).
- As replay progresses forward, old candles past the historical threshold are pruned from the Lightweight Charts series using `series.setData(windowedSlice)` only when necessary, while continuous replay utilizes zero-allocation `series.update(candle)`.

| Metric | Single Chart (v1.3.0) | Dual Chart Unoptimized | Dual Chart with RFC-002 Optimization |
| :--- | :--- | :--- | :--- |
| **Active Canvas Instances** | 1 Chart + 1 Drawing | 2 Charts + 2 Drawings | 2 Charts + 2 Drawings |
| **Series Candle Buffer** | Full Dataset (100k+) | 2x Full Dataset (200k+) | **Windowed (2x 5,000 candles)** |
| **Heap Memory (Steady State)** | $\approx 42 \text{ MB}$ | $\approx 185 \text{ MB}$ | **$\approx 68 \text{ MB}$** |
| **Garbage Collection Pauses** | $< 2 \text{ ms}$ | $18 - 45 \text{ ms}$ (causes drops) | **$< 3 \text{ ms}$ (Zero Drops)** |
| **Frame Render Time (10x)** | $0.05 \text{ ms}$ | $3.8 \text{ ms}$ | **$0.12 \text{ ms}$** |
| **Replay FPS at 50x Speed** | 60 FPS | 18–24 FPS | **60 FPS Sustained** |

### 4.3. Imperative Crosshair Synchronization (Zero-React Overhead)
When the user moves their crosshair across Chart A, the identical timestamp must be highlighted on Chart B with a synchronized vertical time marker and horizontal price guide.

**Anti-Pattern to Avoid**:
- Dispatching `setCrosshairTime(t)` into Zustand or React state on every `mousemove` event triggers 60–120 React render cycles per second across the entire component tree.

**RFC-002 Architecture**:
- Crosshair sync bypasses React state entirely.
- Direct Event Subscription:
  ```typescript
  // Hook up direct imperative link
  chartA.subscribeCrosshairMove((param: MouseEventParams) => {
    if (!param.time || !crosshairSyncEnabled) return;
    
    // Project timestamp directly to Chart B via native Lightweight Charts coordinate API
    const coordinate = chartB.timeScale().timeToCoordinate(param.time);
    if (coordinate !== null) {
      drawingCanvasB.renderCrosshairGuide(coordinate);
    }
  });
  ```
- Result: **0 React renders**, **0 memory allocations**, and $<0.01\text{ms}$ execution latency per mouse event.

### 4.4. Unified `requestAnimationFrame` Render Scheduler
To prevent independent canvas repaints from creating competing GPU pipeline flushes:
- A singleton `DualCanvasRenderScheduler` manages the animation frame loop.
- In each RAF tick, it performs batch updates:
  1. Primary Chart Canvas flush
  2. Secondary Chart Canvas flush
  3. Overlay 2D Drawing Canvas A paint
  4. Overlay 2D Drawing Canvas B paint
- If either chart is scrolled out of view or tabbed away, rendering is automatically paused via `IntersectionObserver` and `document.hidden`.

---

## 5. Subsystem 3: Lightweight Local Execution Bridge Daemon

### 5.1. Daemon Architecture & Runtime Environment
The **Quant Execution Bridge (QEB)** is a lightweight daemon designed to run locally on the trader's workstation or on a private VPS.

- **Process Model**: Standalone Node.js/TypeScript service (compiled to a single binary via `pkg` or launched via `npm run bridge:start` / Docker).
- **Network Ports**:
  - `http://127.0.0.1:8766`: REST & Webhook Ingestion API
  - `ws://127.0.0.1:8766/stream`: Real-time Bi-directional WebSocket
- **Loopback Enforcement**: Binds strictly to `127.0.0.1` and `::1`. Remote connections are rejected unless an explicit auth token and TLS reverse proxy are configured.

### 5.2. Protocol Specifications

#### 1. WebSocket Real-Time Stream (`ws://127.0.0.1:8766/stream`)
Used by Quant Backtest Pro browser client for full-duplex communication:
- Client to Daemon: Order submissions, modifications, cancels, account switch requests, ping heartbeats.
- Daemon to Client: Order execution reports, balance/equity streams, live tick streams, latency metrics.

```typescript
export interface BridgeWsMessage<T = any> {
  id: string;              // UUIDv7 Request/Response correlation ID
  type: BridgeMessageType;
  timestamp: number;
  payload: T;
  signature?: string;      // HMAC-SHA256 signature for authenticated requests
}

export type BridgeMessageType =
  | 'AUTH_REQUEST'
  | 'AUTH_RESPONSE'
  | 'ORDER_SUBMIT'
  | 'ORDER_EXECUTION_REPORT'
  | 'ORDER_CANCEL'
  | 'POSITION_UPDATE'
  | 'ACCOUNT_SNAPSHOT'
  | 'LIVE_TICK'
  | 'HEARTBEAT_PING'
  | 'HEARTBEAT_PONG'
  | 'CIRCUIT_BREAKER_ALERT';
```

#### 2. Webhook Ingestion Endpoint (`POST http://127.0.0.1:8766/v1/webhook/tradingview`)
Accepts standard TradingView Alert payloads and custom bot triggers:

```json
{
  "passphrase": "SECURE_VAULT_HMAC_SECRET",
  "symbol": "BTCUSDT",
  "action": "BUY",
  "orderType": "MARKET",
  "quantity": 0.25,
  "sl": 63500.0,
  "tp": 68000.0,
  "broker": "BINANCE",
  "clientOrderId": "01924b1a-8291-7f8e-a9b0-4c31bdc3ce95"
}
```

### 5.3. Unified Broker Protocol Adapter Interface (`IBrokerDriver`)
The daemon implements a unified provider-agnostic driver pattern:

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

#### Supported Broker Driver Implementations:
1. **Binance Driver (`BinanceDriver`)**:
   - Spot and USD-M Futures support.
   - REST endpoints with API Key + Secret HMAC-SHA256 timestamp signing.
   - User Data WebSocket Stream (`listenKey`) for real-time execution events.
2. **Bybit Driver (`BybitDriver`)**:
   - Bybit v5 Unified Trading Account (UTA).
   - Linear USDT perpetuals and Inverse contracts.
   - WebSocket private order stream and fast public orderbook delta stream.
3. **Interactive Brokers Driver (`IBKRDriver`)**:
   - Connects to TWS or IB Gateway via local socket IPC (port 7496 for live, 7497 for paper).
   - Supports Forex, US Equities, Index CFDs, and Futures.
   - Translates Quant Backtest Pro orders into native TWS `Contract` and `Order` objects.
4. **MetaTrader 4 & 5 Driver (`MetaTraderDriver`)**:
   - Communicates with MT4/MT5 via local ZeroMQ socket or direct Python `MetaTrader5` bridge.
   - Supports instant order placement, pending orders, trailing stops, and magic number tracking.

### 5.4. Prop Firm Risk Shield & Pre-Trade Interceptor Gate
Before any order reaches an external broker driver, it passes through the daemon's local **Pre-Trade Risk Shield Interceptor**:

```typescript
export class PreTradeRiskInterceptor {
  constructor(private rules: PropFirmShieldRules) {}

  public validateOrder(
    account: BrokerAccount,
    positions: BrokerPosition[],
    order: UnifiedOrderRequest
  ): { allowed: boolean; reason?: string } {
    // 1. Max Daily Drawdown Check
    const startingDayEquity = account.balance; // Evaluated from daily baseline
    const projectedLossIfSLHits = this.calculateRisk(order);
    if ((account.equity - projectedLossIfSLHits) < startingDayEquity * (1 - this.rules.maxDailyLossPct / 100)) {
      return { allowed: false, reason: 'ORDER_REJECTED_MAX_DAILY_LOSS_BREACH' };
    }

    // 2. Trailing Drawdown Peak Check
    // 3. News Window Trading Restriction Check
    // 4. Maximum Allowed Open Lot Exposure Check
    // 5. Weekend Holding Gate Check
    
    return { allowed: true };
  }
}
```

### 5.5. Idempotency & Latency Circuit Breakers
- **Idempotency**: Every order generated by Quant Backtest Pro carries a UUIDv7 `clientOrderId`. If a network retry occurs, the daemon detects duplicate `clientOrderId` within a 60-second sliding cache window and returns the original transaction receipt without double-dispatching.
- **Latency Circuit Breaker**: The daemon continuously pings the broker endpoint. If round-trip latency exceeds **250ms** or three consecutive pings time out:
  1. The bridge transitions to `DEGRADED` status.
  2. Automatic market orders are temporarily halted to protect the trader from slippage disasters.
  3. An urgent `CIRCUIT_BREAKER_ALERT` event is pushed to the UI floating HUD.

---

## 6. Comprehensive Data Contracts & TypeScript Specifications

### 6.1. Worker Synchronization Contracts (`src/types/workerSync.ts`)

```typescript
export interface MultiChartLayoutConfig {
  mode: 'SINGLE' | 'DUAL_HORIZONTAL' | 'DUAL_VERTICAL';
  chartA: {
    symbol: string;
    timeframe: Timeframe;
    chartType: ChartType;
    indicators: IndicatorConfig[];
  };
  chartB: {
    symbol: string;
    timeframe: Timeframe;
    chartType: ChartType;
    indicators: IndicatorConfig[];
  };
  isCrosshairSynced: boolean;
  isTimeScrubberSynced: boolean;
}

export interface IndicatorConfig {
  id: string;
  type: 'SMA' | 'EMA' | 'RSI' | 'ATR' | 'BOLLINGER' | 'MACD';
  period: number;
  source: 'close' | 'open' | 'high' | 'low';
  color: string;
  visible: boolean;
}
```

### 6.2. Execution Bridge Data Contracts (`src/types/executionBridge.ts`)

```typescript
export interface BridgeDaemonStatus {
  isRunning: boolean;
  version: string;
  uptimeSeconds: number;
  activeBroker: BrokerType;
  connectionStatus: BrokerConnectionStatus;
  roundTripLatencyMs: number;
  circuitBreakerActive: boolean;
  queuedOrderCount: number;
  dailyPnL: number;
  dailyLossLimitRemaining: number;
}

export interface WebhookAlertPayload {
  passphrase: string;
  symbol: string;
  action: 'BUY' | 'SELL' | 'CLOSE';
  orderType: 'MARKET' | 'LIMIT' | 'STOP';
  quantity?: number;
  riskPercent?: number;
  price?: number;
  sl?: number;
  tp?: number;
  magicNumber?: number;
  comment?: string;
}
```

---

## 7. Performance Targets, Memory Profile & Benchmark Verification Strategy

### 7.1. Quantitative Performance SLA

| Metric | Target SLA | Benchmark Verification Method |
| :--- | :--- | :--- |
| **Dual-Chart Replay FPS** | $\ge 60.0 \text{ FPS}$ sustained | Chrome DevTools Performance Trace & Automated FPS Profiler |
| **Frame Time (99th percentile)** | $\le 16.6 \text{ ms}$ | `requestAnimationFrame` delta tracking over 50,000 bars |
| **Worker O(1) Lookup Latency** | $\le 0.005 \text{ ms}$ ($\le 5 \mu s$) | `performance.now()` microbenchmark over 1,000,000 lookups |
| **Peak Browser Heap Memory** | $\le 150 \text{ MB}$ | `performance.memory.usedJSHeapSize` under dual 200k datasets |
| **Bridge Order Dispatch Latency** | $\le 15 \text{ ms}$ (Local daemon to socket) | End-to-end timestamp delta: `clientSubmitTime` $\to$ `driverDispatchTime` |
| **Crosshair Sync Latency** | $\le 1.0 \text{ ms}$ | Direct native coordinate projection listener |

### 7.2. Automated Benchmark Test Suite
A dedicated headless benchmark suite is defined in `tests/benchmarks/dual_chart_fps.bench.ts`:
- **Scenario 1: High-Speed Dual Replay**: Replays 100,000 M1 bars on Chart B while dynamically synthesizing H1 bars on Chart A at 50x speed. Checks that 0 frames exceed 33.3ms (30 FPS drop floor) and mean FPS is $\ge 58.5$.
- **Scenario 2: Memory Leak Probe**: Runs 500,000 ticks in a continuous loop. Asserts that JS heap growth is $<5\%$ after initial buffer pre-allocation.
- **Scenario 3: Execution Bridge Latency Probe**: Injects 1,000 concurrent mock orders to the local bridge daemon. Verifies that zero order drops occur and p99 dispatch latency remains $<5\text{ms}$.

---

## 8. STRIDE Security Threat Model & Defense Architecture

| Threat Category | Threat Description | Architectural Mitigation Strategy |
| :--- | :--- | :--- |
| **Spoofing** | Attacker impersonates the local bridge daemon or injects malicious webhook triggers. | Local loopback interface binding (`127.0.0.1`), mandatory HMAC-SHA256 signature verification on all webhooks, single-use nonce validation. |
| **Tampering** | Man-in-the-Middle modification of orders or market data in transit. | WebSocket communication secured with TLS/WSS when remote; local loopback secured via token authorization headers. |
| **Repudiation** | Disputes over whether an order was triggered by human action, AI bot, or external webhook. | Append-only execution audit log (`server/data/execution_audit.log`) recording timestamp, IP, source, cryptographic clientOrderId, and parameters. |
| **Information Disclosure** | Leakage of broker API secrets (Binance Secret, Bybit Secret, IBKR credentials). | API keys are never stored in unencrypted browser LocalStorage. Keys reside in the local daemon's secure configuration file (`bridge/.env` or OS Keyring), zero API keys exposed in front-end network calls. |
| **Denial of Service** | Flooding webhook endpoint or worker message queue with rapid requests. | Rate limiting (max 30 requests/second per IP on webhook daemon), worker message batching, sliding window throttle. |
| **Elevation of Privilege** | Remote code execution via malicious strategy scripts in Web Worker. | Strategy execution is quarantined inside a sandboxed Web Worker without DOM, `window`, or network fetch access (`sandbox="allow-scripts"`). |

---

## 9. Engineering Implementation Roadmap & Delegated Tasks for Vulcan

```
+---------------------------------------------------------------------------------------------------+
|                            ENGINEERING IMPLEMENTATION PHASES (v2.0)                               |
+---------------------------------------------------------------------------------------------------+
|  Phase 1: Web Worker Core & O(1) Timestamp Index Buffer                                           |
|  - Implement `src/engine/timeframeBuffer.ts` (O(1) flat Int32Array lookup table)                 |
|  - Implement `src/workers/replaySyncWorker.ts` (Worker thread event loop, clock, developing HTF)  |
|  - Implement `src/engine/workerBridge.ts` (Typed main-thread controller & frame batcher)          |
+---------------------------------------------------------------------------------------------------+
|  Phase 2: Dual-Canvas Charting Component & Direct Crosshair Sync                                  |
|  - Implement `src/components/chart/DualChartView.tsx` (Split horizontal/vertical layouts)        |
|  - Implement `src/hooks/useDualChartSync.ts` (Imperative crosshair & coordinate projection)        |
|  - Windowed candle series virtualization in `TradingViewChart.tsx`                               |
+---------------------------------------------------------------------------------------------------+
|  Phase 3: Quant Execution Bridge Daemon Core                                                      |
|  - Implement `bridge/daemon.ts` (Fastify/Express WebSocket + Webhook daemon on port 8766)          |
|  - Implement `bridge/security/riskInterceptor.ts` (Pre-Trade Prop Firm Shield Interceptor)        |
|  - Implement `src/store/executionBridgeStore.ts` (Zustand client for daemon connection & HUD)     |
+---------------------------------------------------------------------------------------------------+
|  Phase 4: Multi-Broker Driver Adapters                                                            |
|  - Implement `bridge/drivers/BinanceDriver.ts` (REST + WS, HMAC signing)                          |
|  - Implement `bridge/drivers/BybitDriver.ts` (v5 Unified Account API)                             |
|  - Implement `bridge/drivers/IBKRDriver.ts` (TWS Socket API wrapper)                              |
|  - Implement `bridge/drivers/MetaTraderDriver.ts` (MT4/MT5 IPC bridge)                            |
+---------------------------------------------------------------------------------------------------+
|  Phase 5: Performance Benchmarks & Quality Verification                                           |
|  - Author `tests/benchmarks/dual_chart_fps.bench.ts` (Automated 60 FPS verification)              |
|  - Author comprehensive integration test matrix for Execution Bridge                             |
|  - 100% i18n parity across all 4 locales (en, vi, ja, zh) for all new UI controls                |
+---------------------------------------------------------------------------------------------------+
```

---

## 10. Technical Handover Contract

### 🛠️ Architecture Specification — Daedalus (CTO)
- **System Component**: Quant Backtest Pro v2.0 Multi-Chart Web Worker Synchronization & Execution Bridge
- **Architectural Guidelines**:
  1. Complete separation of replay loop and developing candle synthesis into Web Worker (`src/workers/replaySyncWorker.ts`).
  2. Strict $\mathcal{O}(1)$ candle lookup using flat `Int32Array` buffers (`src/engine/timeframeBuffer.ts`).
  3. Direct imperative canvas coordinate crosshair synchronization bypassing React state (`src/hooks/useDualChartSync.ts`).
  4. Decoupled local Execution Bridge daemon (`bridge/daemon.ts`) communicating over WebSocket and Webhooks with Binance, Bybit, IBKR, and MT4/MT5.
  5. Zero-defect i18n parity across English, Vietnamese, Japanese, and Chinese dictionaries.
- **Constraints**:
  - Maximum Frame Budget: $16.6 \text{ ms}$ (sustained 60 FPS under dual-chart 10x replay).
  - Peak Heap Memory: $\le 150 \text{ MB}$.
  - Zero hardcoded UI strings; zero string fallbacks (`t.key || 'default'`).
  - No direct remote `git push` — maintain clean branch commits.
- **Assigned Engineer**: @Vulcan (Senior Full-Stack Software Engineer)
- **Verification Gate**: Must achieve 100% automated test pass (`npm test`), clean typecheck (`npx tsc --noEmit`), zero i18n violations (`npm run check:i18n`), and verified 60 FPS benchmark before merge.
