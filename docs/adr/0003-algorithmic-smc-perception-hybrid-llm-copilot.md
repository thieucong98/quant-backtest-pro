# ADR 0003: Algorithmic SMC Perception Engine & Hybrid LLM Streaming Copilot

- **Status**: Accepted / Ratified
- **Date**: 2026-10-02
- **Deciders**: Daedalus (CTO), Athena (CEO), Minerva (Lead PM), Vulcan (Senior SWE), Argus (Lead QA), Aegis (Security), Titan (DevOps)
- **Technical RFC**: [RFC-003-ALGORITHMIC-SMC-AI-COPILOT.md](../rfcs/RFC-003-ALGORITHMIC-SMC-AI-COPILOT.md)
- **Depends On**: ADR 0002 / RFC-002 (Multi-Chart Web Worker Sync & Execution Bridge)

---

## Context and Problem Statement

Quant Backtest Pro v2.0 introduced institutional-grade deterministic replay via synchronized Web Workers, but the AI Strategy Engine still operates naively — invoking LLMs on raw OHLCV arrays with little institutional context. This produces three concrete problems:

1. **Token Cost Runaway**: Per-tick LLM calls (or per-candle calls) inflate monthly token spend by orders of magnitude and yield redundant work during non-actionable regimes (chop, mid-range drift).
2. **Subjective Indicator Latency**: Discretionary SMC annotations (Order Blocks, FVGs, liquidity grabs) drawn on the main UI thread compete with the 60 FPS dual-canvas loop and frequently exceed the 16.6 ms frame budget on 1.44 M historical bars.
3. **LLM Numerical Hallucination**: Prompts containing only OHLCV arrays lack market-structure grounding; the LLM frequently fabricates setups that violate basic institutional rules (longs in premium, shorts in discount).

A perception layer that converts telemetry into structured SMC primitives, plus a tightly-gated event-driven LLM invocation pipeline, is required to deliver **85%+ token cost reduction** while staying under a **≤ 5 ms** per-bar perception budget.

## Decision Drivers

- **Deterministic, Testable Mathematics**: All SMC primitives (pivots, BOS/CHoCH, OB, FVG, sweeps) must be reducible to closed-form conditions on contiguous typed arrays with zero recursion.
- **Strict Latency Budget**: Worker per-bar computation must remain under 5 ms (P95) to coexist with the existing dual-canvas 60 FPS loop.
- **Cost Discipline**: Token spend per inference must stay ≤ 320 tokens; suppression rate ≥ 98% of raw bars.
- **Institutional Rule Anchoring**: Every AI-generated plan must be validated against canonical institutional rules (HTF alignment, key POI tap, liquidity sweep, LTF CHoCH, premium/discount).
- **Type-Safe IPC**: Cross-thread contracts must be exhaustive discriminated unions for compile-time safety.

## Considered Options

1. **Option 1**: Naive per-candle LLM call with raw OHLCV context. (Rejected: unsustainable token cost, no institutional anchoring.)
2. **Option 2**: Compute SMC annotations on the main UI thread with React state updates. (Rejected: >16 ms frame budget at 100× replay.)
3. **Option 3**: Wasm (Rust) SMC core inside main thread. (Rejected: still blocks event loop during canvas rasterization.)
4. **Option 4 (Selected)**: 3-Tier Hybrid Perception-Reasoning stack:
   - **Tier 1**: Pure-mathematical $O(1)$ SMC engine inside the existing `replaySyncWorker`, no DOM/React, contiguous typed arrays.
   - **Tier 2**: 4-Gate Confluence Filter (HTF Bias, Key POI Tap, Liquidity Sweep, LTF CHoCH) with score $\sigma \ge 0.75$; MTF state compressed into a ~220-token semantic vector.
   - **Tier 3**: SSE-streamed LLM with CoT progressive disclosure, ActionPlan JSON contract, and direct canvas-overlay projection of OB/FVG primitives.

---

## Decision Outcome

### 1. Algorithmic SMC Perception Engine (`src/engine/smc/smcEngine.ts`)
- Runs as a pure sibling module inside `replaySyncWorker.ts`, sharing the existing typed-array allocation pool.
- Implements MonotonicMinMaxQueue for $O(1)$ amortized pivot detection; strict body-close BOS/CHoCH filter; 5-state OB lifecycle machine; 3-candle FVG/IFVG engine; wick-and-volume liquidity sweep tracker; Fibonacci dealing-range equilibrium.
- Emits Transferable `Float32Array`-backed `SMC_FRAME_SNAPSHOT` events coalesced at 60 Hz.
- Hard latency budget: P95 ≤ 5 ms / bar, 0 byte heap allocation per tick.

### 2. Event-Driven Confluence Gate & MTF State Compression
- Four weighted gates ($\sum w_i \cdot \mathbb{1}[G_i] \ge 0.75$) with 20-bar per-symbol cooldown and token-bucket global rate limiter.
- MTF state encoded into a deterministic semantic vector of ≤ 220 tokens via fixed `TokenId` enums.
- Per-inference token budget: ≤ 320 tokens (system + MTF + user slot) — an ~85% reduction vs. streaming 200 raw OHLCV bars (~2,200 tokens).

### 3. SSE Streaming Copilot (`AICopilotHUD`)
- Server-Sent Events consumer with Chain-of-Thought progressive disclosure (folded reasoning panel) and `<action_plan>` JSON parsing into `ActionPlan` discriminated union.
- Institutional rule guard rejects plans violating premium/discount rule (no longs in premium, no shorts in discount).
- Direct canvas projection via TradingView Lightweight Charts `priceCoordinate()` / `timeCoordinate()` APIs — **0 React re-renders** during streaming overlay updates.

### 4. Type-Safe Cross-Thread Protocol (`src/types/smc.ts`)
- `SMCWorkerInboundAction` discriminated union: `SMC_INIT_CONFIG`, `SMC_UPDATE_BAR`, `SMC_BULK_REPLAY`, `SMC_RESET_STATE`, `SMC_SET_GATE_THRESHOLD`.
- `SMCWorkerOutboundEvent` discriminated union: `SMC_FRAME_SNAPSHOT`, `SMC_PIVOT_CONFIRMED`, `SMC_CONFLUENCE_TRIGGER`, `SMC_PERFORMANCE_METRICS`.

---

## Consequences & Mitigations

| Consequence | Severity | Mitigation |
| :--- | :--- | :--- |
| Increased engineering surface (SMC + Worker + LLM + i18n) | Medium | Strict modular boundaries in `src/engine/smc/` and `src/workers/`; phased implementation plan in RFC-003 §10. |
| LLM provider rate-limit or downtime | Medium | Token-bucket governor + fallback chain (Primary → Secondary → Offline) and offline cached plan cache. |
| Algorithmic regression in SMC detection | High | Deterministic fixture-based unit tests covering fractal, BOS/CHoCH, OB lifecycle, FVG, sweep, and gate; CI-blocking. |
| Worker crash during long sessions | Low | `WorkerRecoverySupervisor` re-spawns from last persisted pivot snapshot. |
| API key leakage | Critical | AES-GCM Key Vault with PBKDF2-derived key (zero plaintext); security review by Aegis. |
| Cost overrun from misconfiguration | High | Server-enforced hard ceiling + kill-switch at 3% daily drawdown equivalent in token spend. |
| Stale snapshot after symbol change | Low | `SMC_RESET_STATE` issued on every `symbolChanged` event. |
| i18n parity drift across `vi`/`en`/`ja`/`zh` | Medium | `npm run check:i18n` CI gate blocks PRs with uncovered keys. |

---

*Ratified by Daedalus (CTO) on 2026-10-02. Cross-references: [RFC-003](../rfcs/RFC-003-ALGORITHMIC-SMC-AI-COPILOT.md), [ADR 0002](0002-multi-chart-worker-sync-execution-bridge.md).*
