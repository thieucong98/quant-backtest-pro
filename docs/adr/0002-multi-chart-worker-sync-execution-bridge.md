# ADR 0002: Multi-Chart Web Worker Synchronization & Local Execution Bridge Daemon

- **Status**: Accepted / Ratified
- **Date**: 2026-10-01
- **Deciders**: Daedalus (CTO), Athena (CEO), Minerva (Lead PM), Vulcan (Senior SWE), Argus (Lead QA), Aegis (Security), Titan (DevOps)
- **Technical RFC**: [RFC-002-MULTI-CHART-WORKER-SYNC-EXECUTION-BRIDGE.md](../rfcs/RFC-002-MULTI-CHART-WORKER-SYNC-EXECUTION-BRIDGE.md)
- **PRD Reference**: [PRD_V2_MULTI_CHART_PORTFOLIO.md](../PRD_V2_MULTI_CHART_PORTFOLIO.md)

---

## Context and Problem Statement

Quant Backtest Pro v1.3.0 demonstrated $60\text{ FPS}$ performance for single-chart replay over 1,440,000 candles. To achieve the v2.0 vision of dual-chart multi-timeframe backtesting (e.g., Daily/H4 macro view synchronized with M5 micro execution) alongside live execution bridging, two architectural hurdles emerged:

1. **Main UI Thread Saturation**: Running dual charting canvases, indicator pipelines, and Order Matching Engine (OMS) state updates on a single thread caused frame rate collapse down to $12\text{--}18\text{ FPS}$ at replay speeds above $10\times$.
2. **Candle Alignment Time Complexity**: Re-aligning timeframes via linear scans ($\mathcal{O}(N)$) or binary searches ($\mathcal{O}(\log N)$) during rapid replay cycles caused severe micro-stutter and Garbage Collection spikes.
3. **Browser Sandbox Restrictions**: Web browsers strictly forbid raw TCP sockets (RFC 6455), blocking direct connectivity to Interactive Brokers TWS (port 7496) and MetaTrader IPC.

## Decision Drivers

- **Zero Frame Drops**: Maintain sustained $\ge 60\text{ FPS}$ with a frame render budget under $16.6\text{ ms}$.
- **$\mathcal{O}(1)$ Lookup Complexity**: Constant-time multi-timeframe candle indexing without heap allocations per tick.
- **Strict Decoupling**: Separate simulation/calculation mechanics from React/DOM rendering.
- **Enterprise Execution Connectivity**: Unified gateway for Binance, Bybit, Interactive Brokers, and MT4/MT5 with pre-trade prop firm risk protection.

## Considered Options

1. **Option 1**: Keep all simulation and dual-canvas logic on the main React thread with `useMemo` optimizations. (Rejected: UI stutter at $>10\times$ replay).
2. **Option 2**: WebAssembly (Wasm) Rust core in main thread. (Rejected: Still blocks main thread event loop during canvas rendering).
3. **Option 3 (Selected)**: Dedicated background Web Worker for replay clock, OMS simulation, and $\mathcal{O}(1)$ direct-index buffer (`TimestampIndexBuffer`), paired with a lightweight standalone Node.js Execution Bridge Daemon.

---

## Decision Outcome

### 1. Dedicated Replay Web Worker (`ReplaySyncWorker`)
- Moves clock progression, timeframe aggregation, developing candle synthesis, and OMS fills to a dedicated Web Worker thread.
- Messages between worker and UI are typed envelopes (`WorkerInboundAction`, `WorkerOutboundEvent`).
- Frame updates are throttled and coalesced to display refresh rates ($60\text{ Hz}$).

### 2. $\mathcal{O}(1)$ Timestamp Index Buffer (`TimestampIndexBuffer`)
- Allocates a contiguous typed array (`Int32Array`) of size $K = \lceil \frac{T_{max} - T_0}{\Delta t_{base}} \rceil + 1$.
- Resolves candle indices via direct slot arithmetic in $\le 5\mu s$:
  $$\text{slot} = \left\lfloor \frac{t - T_0}{\Delta t_{base}} \right\rfloor$$
- Eliminates heap allocations and binary search overhead during replay.

### 3. Imperative Crosshair Synchronization
- Crosshairs on dual charts are synchronized via direct imperative canvas coordinate projection (`timeToCoordinate`), bypassing React component re-renders ($0\text{ React overhead}$, $<0.01\text{ ms}$ latency).

### 4. Quant Execution Bridge Daemon (QEB)
- Standalone local Node.js daemon running on `127.0.0.1:8766`.
- Exposes full-duplex WebSocket stream (`/stream`) and Webhook endpoint (`/v1/webhook`).
- Implements `IBrokerDriver` interface across Binance, Bybit, Interactive Brokers, and MT4/MT5.
- Enforces pre-trade prop firm rules (Max Daily Loss, Trailing Drawdown, Latency Circuit Breaker).

---

## Consequences & Mitigations

| Consequence | Severity | Mitigation |
| :--- | :--- | :--- |
| Asynchronous IPC message serialization overhead | Low | Coalesce frames at $60\text{ Hz}$ and leverage Transferable objects for large slices. |
| Daemon prerequisite for live broker trading | Low | Clear visual status indicator in UI HUD; simulation mode remains fully functional offline in browser. |
| Memory overhead of flat `Int32Array` | Low | Consumes $\approx 5.76\text{ MB}$ for 5 years of M1 data ($1.44\text{M}$ bars), well within memory thresholds. |
