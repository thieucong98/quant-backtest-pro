# Technical RFC 003: Algorithmic SMC Perception Engine & Hybrid LLM Streaming Copilot
## Quant Backtest Pro Architecture Specification — v2.1 Enterprise

- **RFC Identifier**: RFC-003-TECH-v2.1
- **Title**: Algorithmic SMC (Smart Money Concepts) Perception Engine, Multi-Timeframe State Compression, and Event-Driven Hybrid LLM Streaming Copilot
- **Author**: Daedalus (Chief Technology Officer / Principal Architect)
- **Contributors & Reviewers**: Athena (CEO), Prometheus (CPO), Minerva (Lead PM), Vulcan (Senior SWE), Argus (Lead QA), Aegis (Cyber Security), Titan (DevOps)
- **Target Release**: Quant Backtest Pro v2.1 "Apex AI Copilot"
- **Status**: Ratified Architectural Blueprint
- **Related PRD**: [`docs/PRD_V2_MULTI_CHART_PORTFOLIO.md`](../PRD_V2_MULTI_CHART_PORTFOLIO.md) and forthcoming v2.1 PRD addendum
- **Depends On**: [RFC-002](RFC-002-MULTI-CHART-WORKER-SYNC-EXECUTION-BRIDGE.md), [ADR 0002](../adr/0002-multi-chart-worker-sync-execution-bridge.md)
- **Date**: October 2026

---

## 1. Executive Summary & Architectural Motivation

### 1.1. Context & Business Drivers
The v2.0 platform established institutional-grade deterministic replay with synchronized multi-chart Web Worker isolation and local execution bridge connectivity (RFC-002). The v2.1 product roadmap (codename **"Apex AI Copilot"**) introduces a domain-specialized institutional reasoning layer that converts raw OHLCV telemetry into structured Smart Money Concepts (SMC) intelligence, and exposes that intelligence to a streaming LLM through a tightly-gated, event-driven pipeline engineered for **85%+ reduction in API token cost** while never exceeding a hard **5 ms** perception budget per tick.

### 1.2. The v2.0 Architectural Gap
- **Naive Per-Tick LLM Invocation Is Unsustainable**: Calling a remote LLM on every replay tick (or even every candle) inflates monthly token cost and yields redundant calls during non-actionable market regimes (e.g., mid-range chop).
- **Subjective Indicator Heuristics are Slow**: Rendering discretionary SMC annotations (Order Blocks, FVGs, liquidity grabs) on the main UI thread competes with the 60 FPS dual-canvas loop and frequently exceeds the 16.6 ms frame budget when computing on 1.44 M historical bars.
- **LLMs Lack Native Numerical Context**: A bare LLM prompt containing only OHLCV arrays has no market structure grounding and frequently fabricates setups that violate basic institutional rules (longs in premium, shorts in discount).

### 1.3. The v2.1 Architectural Solution
1. **Tier 1 — Algorithmic SMC Perception Core (`smcEngine.ts`)**: A pure-mathematical, $O(1)$ amortized state machine running inside a dedicated Web Worker, calculating Fractal Pivots, Break-of-Structure (BOS), Change-of-Character (CHoCH), Order Blocks (OB), Fair Value Gaps (FVG), Liquidity Sweeps (BSL/SSL), and Premium/Discount equilibrium with **zero recursive closures**, *zero heap allocations per tick*, and a strict **≤ 1.8 ms** per-bar target latency.
2. **Tier 2 — Event-Driven Confluence Gating & MTF State Compression**: A four-gate institutional setup filter (HTF Bias, Key POI Tap, Liquidity Sweep, LTF CHoCH) that suppresses **≥ 98%** of raw candle emissions and only opens the LLM stage when the Confluence Score ≥ 75%. Multi-Timeframe (MTF) market state is encoded into a dense semantic vector of **≈ 220 tokens** via deterministic token-id mapping.
3. **Tier 3 — Cognitive Reasoning & Streaming HUD (`AICopilotHUD`)**: A Server-Sent Events (SSE) consumer with Chain-of-Thought (CoT) progressive disclosure, primitive-by-primitive chart overlay projection (OB/FVG boxes drawn directly on the TradingView Lightweight Charts canvas), and an institutional rule-anchored response grammar.

### 1.4. Performance & Cost Budgets (Hard Constraints)

| Metric | Target | Hard Ceiling | Measurement |
| :--- | :--- | :--- | :--- |
| Tier 1 per-bar latency | ≤ 1.8 ms | < 5.0 ms | `performance.now()` bracketed inside worker |
| Heap allocation per tick | 0 bytes | ≤ 32 B | `FanoutTelemetry` heap probe |
| Tier 2 suppression rate | ≥ 98% of bars | ≥ 95% | Bar counter delta over 1M-bar replay |
| LLM tokens per inference | ≈ 220 tok | ≤ 320 tok | `tiktoken` counter |
| Token cost reduction vs v2.0 | ≥ 85% | ≥ 75% | (Cost_v2.0 − Cost_v2.1) / Cost_v2.0 |
| End-to-end HUD first paint | ≤ 150 ms | ≤ 300 ms | LCP / first text chunk |

---

## 2. High-Level System Architecture Diagram

```
+----------------------------------------------------------------------------------------------------+
|                              BROWSER RUNTIME — Main UI Thread (React 19 + Zustand 5)               |
|                                                                                                    |
|   +--------------------------------+        +-----------------------------------------------+     |
|   |  TradingViewLight Charts v4.x   |           |        AICopilotHUD (Glassmorphic)           |     |
|   |  (Dual Chart A / Chart B)      |           |  - CoT progressive disclosure                 |     |
|   |  + Direct Canvas Overlay       |  Render   |  - Streaming SSE token consumer               |     |
|   |    (OB / FVG / Sweep boxes)    | <-------  |  - Institutional rule assertions              |     |
|   +--------------------------------+  Primitives  +-----------------------+----------------------+     |
|              ^                                       |  Subscribe (CoT, Action)              |
|              | Snapshot frames (60 Hz coalesced)     v                                          |
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
|   |                            smcEngine.ts (Pure Math Core)                       |           |
|   |                                                                                |           |
|   |   +-------------------------+   +------------------------+   +---------------+    |           |
|   |   | MonotonicMinMaxQueue    |   |  Zigzag Fractal Pivot  |   | BOS / CHoCH   |    |           |
|   |   | (Sliding Window O(1))   |   |  Detector (K=5, K=2)   |   | State Machine |    |           |
|   |   +-------------------------+   +------------------------+   +---------------+    |           |
|   |   +-------------------------+   +------------------------+   +---------------+    |           |
|   |   | Order Block Lifecycle   |   |  FVG / IFVG Engine      |   | Liquidity     |    |           |
|   |   | (UNMITIGATED→VIOLATED)  |   |  3-candle Imbalance    |   | Sweep Tracker |    |           |
|   |   +-------------------------+   +------------------------+   +---------------+    |           |
|   |   +-------------------------+   +------------------------+                      |           |
|   |   | Premium/Discount EQ     |   |  Confluence Gate        |  -- SMC_CONFLUENCE_TRIGGER -->|
|   |   | Fibonacci DealingRange  |   |  (4-Gate, >=75%)        |                      |           |
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
|   |  MTF State Compressor|    |  Prompt Token-Budget |    |  Multi-LLM Provider Adapter |       |
|   |  (~220 tok semantic)  |--->|  Governor (<=320 tok)|--->|  OpenAI / Gemini / Claude   |       |
|   +----------------------+    +----------------------+    |  DeepSeek / Ollama / Proxy  |       |
|                                                            +----------------------------+       |
|                                                            |   |   |   |   |   |                  |
|                                                            v   v   v   v   v                  |
+------------------------------------------------------------------------------------------------+
+----------------------------- EXTERNAL LLM PROVIDERS (BYOK) -------------------------------------+
```

---

## 3. Tier 1: Algorithmic SMC Perception Engine (Pure Mathematical Specification)

The SMC Engine runs inside `replaySyncWorker.ts` as a sibling module to the existing Timeframe Index Buffer and Order Matching simulation cores. It receives the canonical OHLCV bar stream from `ReplaySyncWorker` and emits structured `SMCFrameSnapshot` envelopes. **No DOM access. No React state. No LLM network calls.** It is a pure TypeScript state machine operating on contiguous typed arrays (`Float32Array`, `Int32Array`, `Uint32Array`) allocated once at initialization.

### 3.1. Fractal Pivot Detection (`MonotonicMinMaxQueue`)

We adopt the well-known Williams Fractal definition with radius K = 5 for HTF pivots and K = 2 for LTF micro-pivots. A high pivot $SH_t$ is confirmed at bar i if:

$$\forall j \in [i-K, i+K] :\; H_i \ge H_j \land i-K \ge 0 \land i+K < N$$

Symmetrically, a low pivot $SL_i$ is confirmed if:

$$\forall j \in [i-K, i+K] :\; L_i \le L_j \land i-K \ge 0 \land i+K < N$$

To maintain strict O(1) amortized per-bar cost, we use two **monotonic double-ended queues** (`MonotonicMinMaxQueue`):

- **High Queue** (monotonically decreasing by `High[i]`): A new bar i pops all entries whose High value is strictly less than $H_i$, then appends i. The front of the deque always contains the index of the maximum high within the window.
- **Low Queue** (monotonically increasing by `Low[i]`): Symmetric construction for the minimum low.

When the leftmost deque entry has index < i − K, it is evicted. After processing bar i, if the front index equals i − K and the pivot condition is satisfied, a confirmed pivot is emitted. Amortized cost per bar is **two pushes + at most K pops**, yielding O(1).

```typescript
type PivotState = { readonly kind: 'SH' | 'SL'; readonly barIndex: number; readonly price: number };
```

### 3.2. Break of Structure (BOS) & Change of Character (CHoCH)

We adopt a strict **body-close filter** to avoid intra-wick fakeouts. Let $C_t$ denote the closing price of bar t, and let $SH_{last}$ / $SL_{last}$ denote the most recent confirmed higher-timeframe swing high / swing low.

**Bullish BOS** at bar t when:

$$C_t > SH_{last} \land \text{trend}_{t-1} \in \{\text{BEARISH}, \text{NEUTRAL}\}$$

**Bearish BOS** at bar t when:

$$C_t < SL_{last} \land \text{trend}_{t-1} \in \{\text{BULLISH}, \text{NEUTRAL}\}$$

**Bullish CHoCH** at bar t when:

$$C_t > SH_{last} \land \text{trend}_{t-1} = \text{BEARISH}$$

**Bearish CHoCH** at bar t when:

$$C_t < SL_{last} \land \text{trend}_{t-1} = \text{BULLISH}$$

A CHoCH is therefore a *discontinuity* in trend polarity, while a BOS is a *continuation*. The state machine transitions `trend` between `BULLISH`, `BEARISH`, and `NEUTRAL` based on the polarity of the most recent structural event. The `BOS` and `CHoCH` events are emitted with full context (last pivot index, displacement magnitude Δ = |$C_t$ − $SH_{last}$|) to the Tier 2 gate.

### 3.3. Order Block (OB) Lifecycle State Machine

An Order Block is the last opposing candle prior to a displacement (BOS or CHoCH). We track a full 5-state lifecycle machine:

| State | Description | Transition Trigger |
| :--- | :--- | :--- |
| `UNMITIGATED` | OB detected, price has not revisited it | n/a (entry state) |
| `PARTIALLY_MITIGATED` | Price has entered the OB zone but penetration < 50% | $L_{t+1} \in [OB_{low}, OB_{high}]$ for bullish OB |
| `FULLY_MITIGATED` | Mean Threshold (CE 50%) breached | $C_{t+1} \le OB_{CE}$ for bullish OB |
| `VIOLATED` | OB zone fully crossed (close outside opposite edge) | $C_{t+1} \le OB_{low}$ for bullish OB |
| `BREAKER` (terminal) | VIOLATED OB polarity is inverted, becomes supply for opposite direction | `VIOLATED` + subsequent opposite BOS |

Let $OB_{CE} = \frac{OB_{high} + OB_{low}}{2}$ denote the Mean Threshold (Consequent Encroachment). The fill ratio is tracked as:

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

A Fair Value Gap is a 3-candle imbalance. For bar triplet (t−3, t−2, t−1) — note that the displacement candle is bar t−2:

**Bullish FVG** when:

$$L_{t-1} > H_{t-3}$$

**Bearish FVG** when:

$$H_{t-1} < L_{t-3}$$

Each FVG tracks:

- `upper`, `lower`, `midpoint` (50% Consequent Encroachment).
- `fillRatio` computed deterministically as price revisits: $\text{fill}_{bullish} = \frac{\min(\text{visited low}, FVG_{upper}) - FVG_{lower}}{FVG_{upper} - FVG_{lower}}$ (clamped to [0, 1]).
- When `fillRatio >= 1.0`, the FVG is flagged `FILLED` and **inverted** into an IFVG with opposite polarity, becoming a future target.

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

### 3.5. Liquidity Sweeps (BSL / SSL)

Liquidity Sweeps detect *failed* breakouts through equal-highs / equal-lows pools. A sweep event is confirmed when price **pierces** the pool level and then **rejects** within the same bar or the next bar, satisfying both:

1. **Wick Rejection**: $\frac{|\text{wick beyond pool}|}{|\text{full bar range}|} \ge \rho_{rej}$ where default $\rho_{rej} = 0.50$.
2. **Volume Confirmation**: $V_t \ge \rho_{vol} \times \text{SMA}(V, 20)$ where default $\rho_{vol} = 1.5$.
3. **Pool Construction**: BSL pool at index i when ∃ at least 2 highs within $\epsilon_{eq} \times \text{ATR}_{14}$ tolerance in the prior 50 bars. SSL symmetric.

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

### 3.6. Premium / Discount Equilibrium

We track the current dealing range using the most recent confirmed HTF swings. Equilibrium (EQ) is the 50% Fibonacci level:

$$EQ = SH_{last} - 0.5 \times (SH_{last} - SL_{last})$$

The engine emits a continuous `premiumDiscount: 'PREMIUM' | 'DISCOUNT' | 'EQUILIBRIUM'` attribute on every `SMCFrameSnapshot`. **Institutional rule anchor** — used by Tier 2 gate and Tier 3 prompt:

> **No long entries in PREMIUM. No short entries in DISCOUNT.**

---

## 4. Tier 2: Event-Driven Confluence Gating & MTF State Compression

The Confluence Gate receives every `SMCFrameSnapshot` but only opens an LLM inference when a weighted 4-gate score exceeds the **$\sigma_{min} = 75\%$** threshold. This is the single most important cost-suppression mechanism.

### 4.1. The Four Confluence Gates

| Gate | Weight | Condition |
| :--- | :--- | :--- |
| **G1**: HTF Bias Alignment | 30% | Current LTF setup direction matches the HTF (D1/H4) `trend` attribute |
| **G2**: Key POI Tap | 30% | Price has revisited (within $0.5 \times \text{ATR}_{14}$) an UNMITIGATED OB or OPEN FVG |
| **G3**: Liquidity Sweep | 20% | BSL or SSL sweep was confirmed within the prior 8 bars |
| **G4**: LTF CHoCH | 20% | A CHoCH (not just BOS) was detected within the prior 12 bars |

$$\text{ConfluenceScore} = \sum_{i=1}^{4} w_i \cdot \mathbb{1}[G_i \text{ satisfied}]$$

The gate fires only when:

$$\text{ConfluenceScore} \ge \sigma_{min} = 0.75 \land \text{cooldown}_{LTP} \ge 20\text{ bars}$$

### 4.2. MTF State Compression to a Dense Semantic Vector (~220 tokens)

The full multi-timeframe market state is encoded deterministically into a compact prompt fragment. We avoid raw numbers in the prompt (which is token-expensive and noisy); instead we map structured attributes to fixed `TokenId` enums.

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

A canonical template renderer (`MtfPromptRenderer`) emits exactly **MTF_TOKEN_BUDGET = 220 tokens** for the structured preamble. Combined with the LLM's system prompt (≈ 60 tokens) and the user slot (≈ 50 tokens), each inference consumes ≤ 320 tokens — an **~85% reduction** versus the v2.0 approach of streaming the last 200 OHLCV bars (≈ 2,200 tokens).

### 4.3. Cooldown & Rate Limiter

- **Per-Symbol Cooldown**: 20-bar minimum gap between inferences on the same symbol to avoid correlated over-firing.
- **Global Rate Limiter**: Token-bucket algorithm, max 6 inferences / minute, max 90 inferences / hour per `sessionId`.
- **Backpressure Buffer**: If the LLM is slow, frames are *coalesced* (only the latest state matters). Buffer size ≤ 3 frames.

---

## 5. Tier 3: Streaming LLM, CoT Disclosure & Copilot HUD

### 5.1. SSE Streaming Pipeline

When Tier 2 opens the gate, the AI Gateway (Node.js daemon) opens an SSE channel:

```
POST /v1/copilot/stream
Content-Type: application/json
X-Session-Id: <uuid>

{ "symbol": "BTCUSDT", "timeframe": "M5", "mtf": <MTFSemanticVector>, "userQuestion": "..." }

→ HTTP/1.1 200 OK
→ Content-Type: text/event-stream
→
→ data: {"delta":"<thinking>","type":"reasoning"}
→ data: {"delta":"We observe a ","type":"reasoning"}
→ ...
→ data: {"delta":"</thinking>","type":"reasoning"}
→ data: {"delta":"<action_plan>","type":"action"}
→ data: {"delta":"{\"side\":\"LONG\"","type":"action"}
→ ...
→ data: {"delta":"</action_plan>","type":"action"}
→ data: {"type":"done","usage":{"prompt":218,"completion":156,"cost_usd":0.00041}}
```

The browser-side SSE parser (`sseCopilotStream.ts`) discriminates between `<thinking>` tags (rendered progressively in a *folded* reasoning panel) and `<action_plan>` tags (parsed as `ActionPlan` JSON and rendered in the structured HUD).

### 5.2. ActionPlan JSON Contract

```typescript
export interface ActionPlan {
  readonly side: 'LONG' | 'SHORT' | 'NO_TRADE';
  readonly entry: number; readonly stopLoss: number; readonly takeProfit: readonly number[];
  readonly rrRatio: number;
  readonly rationale: string;
  readonly institutionalChecks: readonly (
    | 'HTF_BIAS_ALIGNED'
    | 'KEY_POI_TAP'      // No longs in premium, no shorts in discount
    | 'LIQUIDITY_SWEEP_CONFIRMED'
    | 'LTF_CHOCH_CONFIRMED'
  )[];
  readonly confidence: number; // 0..1
}
```

The browser-side validator rejects any plan where `institutionalChecks` omits `KEY_POI_TAP` when the location is premium-discount rule violating, and surfaces a hard error to the user.

### 5.3.2. Direct Canvas Overlay Rendering

`AICopilotHUD` subscribes to the streaming `ActionPlan` and projects the OB / FVG / Sweep primitives **directly onto the TradingView Lightweight Charts canvas** using the `priceCoordinate()` and `timeCoordinate()` APIs — bypassing React entirely. This guarantees 60 FPS interaction even while the LLM response is streaming.

```typescript
// 0 React re-renders during streaming overlay updates
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

## 6. IPC Protocol Specification (Typed Message Contracts)

### 6.1. Inbound Actions (Main Thread → Worker)

```typescript
export type SMCWorkerInboundAction =
  | { kind: 'SMC_INIT_CONFIG'; payload: { symbol: string; higherTF: 'D1' | 'H4'; lowerTF: 'M5' | 'M1'; fractalRadiusHTF: 5; fractalRadiusLTF: 2 } }
  | { kind: 'SMC_UPDATE_BAR'; payload: { bar: OHLCVBar; higherTFBar?: OHLCVBar } }
  | { kind: 'SMC_BULK_REPLAY'; payload: { bars: readonly OHLCVBar[] } }
  | { kind: 'SMC_RESET_STATE'; payload: { preservePivots: boolean } }
  | { kind: 'SMC_SET_GATE_THRESHOLD'; payload: { sigmaMin: number } };
```

### 6.2. Outbound Events (Worker → Main Thread)

```typescript
export type SMCWorkerOutboundEvent =
  | { kind: 'SMC_FRAME_SNAPSHOT'; payload: SMCFrameSnapshot } // 60 Hz coalesced, Transferable typed array
  | { kind: 'SMC_PIVOT_CONFIRMED'; payload: { pivot: PivotState; affectedOBs: readonly string[] } }
  | { kind: 'SMC_CONFLUENCE_TRIGGER'; payload: { score: number; mtfVector: MTFSemanticVector; triggerBar: number } }
  | { kind: 'SMC_PERFORMANCE_METRICS'; payload: { lastBarLatencyMs: number; avgLatencyMs: number; heapAllocBytes: number } };
```

`SMC_FRAME_SNAPSHOT` is emitted as a Transferable `Float32Array` containing the latest 64 pivots / 32 OBs / 16 FVGs / 8 sweeps to minimize structured-clone cost.

---

## 7. Failure Mode Analysis & Safety Guarantees

| Failure Mode | Severity | Mitigation |
| :--- | :--- | :--- |
| Worker postMessage overflow at 100× replay | Medium | Coalesce frames at 60 Hz; drop intermediate snapshots |
| LLM provider 429 rate limit | Medium | Token-bucket governor + fallback chain (Primary → Secondary → Offline) |
| LLM hallucinates invalid ActionPlan | High | Browser-side institutional-rule guard rejects plans violating Premium/Discount rule |
| Worker crashes (out-of-memory) | High | `WorkerRecoverySupervisor` re-spawns worker, replays from last persisted pivot snapshot |
| API key leakage in IndexedDB | Critical | AES-GCM Key Vault with PBKDF2-derived key (see ADR-0003 in v2.1 addendum) |
| Cost runaway from accidental gate misconfiguration | High | Hard ceiling enforced server-side; daily $5 budget cap with kill-switch |
| Stale `SMCFrameSnapshot` after symbol change | Medium | `SMC_RESET_STATE` issued on every `symbolChanged` event |

---

## 8. Telemetry, Observability & Quality Gates

- **Performance Telemetry**: `lastBarLatencyMs`, `avgLatencyMs`, `p99_latencyMs` are emitted to `SMC_PERFORMANCE_METRICS` and visualized in the *Engineering Diagnostics* HUD (gated to dev mode only).
- **Cost Telemetry**: Daily cumulative token spend, cost-per-inference, suppression rate, and CoT token ratio are streamed to the AI Gateway dashboard.
- **Algorithmic Regression**: Every PR must pass `tests/smc.fractal.test.ts`, `tests/smc.bosChoch.test.ts`, `tests/smc.obLifecycle.test.ts`, `tests/smc.fvg.test.ts`, `tests/smc.sweep.test.ts`, and `tests/smc.gate.test.ts` with **100% deterministic fixture coverage** (zero randomness in algorithmic tests).
- **Quality Gates (CI-blocking)**:
  1. `npx tsc --noEmit` → 0 errors
  2. `npm run check:i18n` → 100% parity across `vi`, `en`, `ja`, `zh`
  3. `npm test` → 100% pass, 0 algorithmic regressions
  4. `npm run build` → success, 0 warnings
  5. **SMC Latency Budget Test**: P95 bar latency ≤ 5 ms on 100k-bar fixture (run on CI, gated by `RUN_PERF=1`)

---

## 9. Internationalization (i18n) Compliance

- **Zero Hardcoded UI Strings**: All HUD labels, button states, error toasts must come from the centralized i18n files (`src/i18n/locales/{vi,en,ja,zh}.ts`). No `BẬT`/`TẮT`, no `ON`/`OFF` fallbacks.
- **CoT Localization**: Reasoning text generated by the LLM is rendered through the in-house translator shim if the user-selected locale is non-English. System prompts always request English-native output for portability, then translate on the client.
- **CI Gate**: `npm run check:i18n` blocks any PR that introduces an uncovered key.

---

## 10. Implementation Plan & Sequencing

| Phase | Owner | Deliverable | Exit Gate |
| :--- | :--- | :--- | :--- |
| P0 (1d) | Daedalus | RFC-003 ratification | f |
| P1 (3d) | Vulcan | `src/engine/smc/smcEngine.ts` + `src/types/smc.ts` + unit tests | All SMC algorithm tests green |
| P2 (2d) | Vulcan | Web Worker integration in `replaySyncWorker.ts` | Worker latencies P95 ≤ 5 ms |
| P3 (2d) | Vulcan | Tier 2 Gate + MTF compressor + cost guard | Suppression ≥ 98%, tokens ≤ 320 |
| P4 (3d) | Vulcan | Tier 3 SSE parser + `AICopilotHUD` + canvas overlay | First paint ≤ 150 ms |
| P5 (2d) | Argus | Latency benchmark suite + regression fixtures | CI budget test green |
| P6 (2d) | Aegis | AES-GCM Key Vault + 3% daily kill-switch | Security review passed |
| P7 (1d) | Titan | AI Gateway daemon `/v1/copilot/stream` route | Daemon integration test green |
| P8 (1d) | All | Documentation, README updates, i18n parity | All quality gates green |

---

## 11. References & Cross-Links

- RFC-002: [Multi-Chart Web Worker Synchronization & Local Execution Bridge](RFC-002-MULTI-CHART-WORKER-SYNC-EXECUTION-BRIDGE.md)
- ADR 0002: [Multi-Chart Web Worker Sync & Execution Bridge](../adr/0002-multi-chart-worker-sync-execution-bridge.md)
- ADR 0003: Algorithmic SMC Perception Engine & Hybrid LLM Copilot (this RFC)
- PRD_V2: [`docs/PRD_V2_MULTI_CHART_PORTFOLIO.md`](../PRD_V2_MULTI_CHART_PORTFOLIO.md)

---

*Document version: 1.0.0 — Ratified by Daedalus (CTO) on 2026-10-02.*
