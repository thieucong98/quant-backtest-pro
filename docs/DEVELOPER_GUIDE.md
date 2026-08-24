# Developer Guide
## Quant Backtest Pro Platform (English)

This guide provides technical developers and contributors with detailed instructions on codebase architecture, the 60 FPS replay lifecycle, zero-allocation indicator pipeline, extending SL/TP optimizer routines, implementing new trading bot transpilers, and interacting with the local SQLite persistence layer.

---

## 1. Codebase Organization

```
quant-backtest-pro/
├── src/
│   ├── components/                 # React UI Components
│   │   ├── chart/                  # TradingViewChart (O(1) updates), DrawingCanvas
│   │   ├── header/                 # Header, SymbolSearchModal, TimeframeDropdown, QuickStats
│   │   ├── panels/                 # AIStrategyModal, AIBotHUD, DataImportModal, ExportStrategyModal,
│   │   │                           # SessionManagerModal, AnalyticsDashboardModal, OrderEntryModal
│   │   └── replay/                 # ReplayBar, PositionsTable, ProQuickDock
│   ├── engine/                     # Core Quantitative Engines
│   │   ├── aiService.ts            # Multi-LLM provider abstraction (OpenAI, Gemini, Claude, Proxy Tunnel)
│   │   ├── strategyOptimizer.ts    # SL/TP Multi-Variant Grid Search, 2D Heatmap & Mini Sparklines
│   │   ├── csvParser.ts            # Fast Integer Date.UTC Parser with Smart Slicing (200k/100k/Full)
│   │   ├── orderMatchingEngine.ts  # Matching engine, Margin, SL/TP, Trailing Stop, Prop Firm Shield
│   │   ├── strategySandbox.ts      # Sandboxed JavaScript strategy runner
│   │   ├── strategyExporter.ts     # Bot transpilers (MT5, MT4, Pine, Python CCXT, cTrader, JSON)
│   │   ├── analytics.ts            # Sharpe, Max Drawdown, Monte Carlo 500x simulation
│   │   ├── indicators.ts           # Zero-allocation point-in-time indicators (SMA, EMA, RSI, MACD, BB, ATR)
│   │   ├── resampler.ts            # Dynamic multi-timeframe candle aggregator
│   │   └── dataCrawler.ts          # Market data crawler (Binance REST API)
│   ├── store/                      # Zustand Central Stores
│   │   ├── backtestStore.ts        # Replay loop, candles, orders, drawings, active strategy, throttled sync
│   │   └── authStore.ts            # User profile and authentication state
│   ├── types/                      # TypeScript definitions
│   │   ├── market.ts               # Candle, Instrument, Timeframe, DrawingObject
│   │   ├── trade.ts                # Order, Position, AccountState
│   │   └── strategy.ts             # AIStrategyDefinition, OptimizationResultItem, IndicatorLibrary
│   ├── i18n/                       # Multi-language translations (en, vi, ja, zh)
│   └── api/                        # REST API client for SQLite backend (sessions, trades, datasets)
├── server/                         # Express REST API Server
│   ├── index.ts                    # REST Server entry point (Port 3001)
│   ├── routes/                     # Modular express routes (sessions, trades, datasets, strategies)
│   └── prisma/                     # SQLite Schema & Migrations (server/backtest.db)
└── docs/                           # Complete Technical & User Documentation
```

---

## 2. Development & Build Lifecycle

### 2.1. Installing & Running Locally
```bash
# Install NPM dependencies
npm install

# Terminal 1: Start Vite Frontend Client
npm run dev

# Terminal 2: Start Express + Prisma SQLite Backend
npm run server:start
```

### 2.2. Type Checking & Production Build Verification
```bash
# Type check and build production bundles
npm run build
```

---

## 3. High-Performance Design Patterns

### 3.1. $O(1)$ Incremental Chart Rendering Pattern
When implementing chart interactions in `TradingViewChart.tsx`:
- Avoid calling `series.setData()` inside high-frequency replay ticks.
- Use `series.update(candle)` and `volumeSeries.update(volume)` when `currentIndex === lastRenderedIndex + 1`.
- Reserve `series.setData()` strictly for dataset loading, timeframe switches, or timeline scrubbing jumps.

### 3.2. Zero-Allocation Point-In-Time Indicator Pattern
When adding or extending indicators in `src/engine/indicators.ts`:
- Compute calculations over `this.effectiveLength` instead of `this.candles.length`.
- Never call `this.candles.slice()` inside indicator methods to ensure zero garbage collection overhead.

```typescript
// Example: Zero-Allocation Indicator
public sma(period: number, offset: number = 0): number {
  const effLen = this.effectiveLength ?? this.candles.length;
  const endIndex = effLen - 1 - offset;
  if (endIndex < period - 1 || period <= 0) return 0;

  let sum = 0;
  for (let i = endIndex - period + 1; i <= endIndex; i++) {
    sum += this.candles[i].close;
  }
  return sum / period;
}
```

---

## 4. Extending the SL/TP Grid Search Optimizer

Open `src/engine/strategyOptimizer.ts`:
- `simulateSingleRun`: Simulates a single variant run against historical candles.
- `runGridSearch`: Runs a parameter matrix scan across user-defined SL and TP ranges.
- `replaceSLTPInCode`: AST regex injector that dynamically updates `slPips` and `tpPips` in JavaScript strategy source strings.

---

## 5. Security & Open-Source Guidelines

1. **Never commit hardcoded API keys, private tokens, or confidential proxy endpoints**.
2. Keep user credentials strictly in client `localStorage` or environment variables.
3. Run `npm run build` before opening a Pull Request to ensure zero TypeScript compiler errors.
