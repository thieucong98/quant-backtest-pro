# Developer Guide
## Quant Backtest Pro Platform (English)

This guide provides technical developers and contributors with detailed instructions on codebase architecture, core engine lifecycles, extending technical indicators, implementing new trading bot transpilers, and interacting with the local SQLite persistence layer.

---

## 1. Codebase Organization

```
quant-backtest-pro/
├── src/
│   ├── components/                 # React UI Components
│   │   ├── chart/                  # ChartWrapper, CandlestickChart, DrawingCanvas
│   │   ├── header/                 # Header, SymbolSearch, TimeframeDropdown, QuickStats
│   │   ├── panels/                 # AIStrategyModal, ExportStrategyModal, SessionManagerModal,
│   │   │                           # AnalyticsDashboardModal, OrderEntryModal, SymbolSearchModal
│   │   └── common/                 # ReplayControls, PositionsTable, ProQuickDock
│   ├── engine/                     # Core Quantitative Engines
│   │   ├── aiService.ts            # Multi-LLM provider abstraction (OpenAI, Gemini, Proxy Tunnel)
│   │   ├── orderMatchingEngine.ts  # Matching engine, Margin, SL/TP, Prop Firm Shield
│   │   ├── strategySandbox.ts      # Sandboxed JavaScript strategy runner
│   │   ├── strategyExporter.ts     # Bot transpilers (MT5, MT4, Pine, Python, cTrader)
│   │   ├── analytics.ts            # Sharpe, Max Drawdown, Monte Carlo 500x simulation
│   │   ├── indicators.ts           # SMA, EMA, RSI, MACD, Bollinger Bands, ATR, Highest, Lowest
│   │   ├── resampler.ts            # Dynamic multi-timeframe candle aggregator
│   │   └── dataCrawler.ts          # Market data crawler
│   ├── store/                      # Zustand Central Stores
│   │   ├── backtestStore.ts        # Replay loop, candles, orders, drawings, active strategy
│   │   └── authStore.ts            # User profile and authentication state
│   ├── types/                      # TypeScript definitions
│   │   ├── market.ts               # Candle, Instrument, Timeframe
│   │   ├── trade.ts                # Order, Position, AccountState
│   │   └── strategy.ts             # AIStrategyDefinition, IndicatorLibrary
│   ├── i18n/                       # Multi-language translations (en, vi, ja, zh)
│   └── api/                        # REST API client for SQLite backend
├── server/                         # Express REST API Server
│   ├── index.ts                    # REST Endpoints (/api/sessions, /api/strategies, /api/candles)
│   └── db.ts                       # SQLite Driver (better-sqlite3)
└── docs/                           # Complete Technical & User Documentation
```

---

## 2. Development & Build Lifecycle

### 2.1. Installing & Running Locally
```bash
# Install NPM dependencies
npm install

# Start both Vite Frontend and Express Backend concurrently
npm run dev
```

### 2.2. Production Build Verification
```bash
# Type check and build production bundles
npm run build
```

---

## 3. Extending Core Engines

### 3.1. Adding a New Indicator to `indicators.ts`
Open `src/engine/indicators.ts` and add your calculation method to `IndicatorCalculator`:

```typescript
// Example: Adding Stochastic Oscillator
public stochastic(kPeriod: number = 14, dPeriod: number = 3, offset: number = 0): { k: number; d: number } {
  // Compute calculation over this.candles
  return { k: 80, d: 75 };
}
```

Then register the method in `IndicatorLibrary` (`src/types/strategy.ts`) to enable AI Sandbox auto-completion.

### 3.2. Adding a New Bot Target to `strategyExporter.ts`
Open `src/engine/strategyExporter.ts`:
1. Add the platform key to `ExportPlatform` (e.g. `'ninjatrader'`).
2. Add metadata to `EXPORT_PLATFORMS`.
3. Implement `public static toNinjaTrader(strategy: AIStrategyDefinition, symbol: string): string`.

---

## 4. Open-Source Security & Contribution Guidelines

1. **Never commit hardcoded API keys, private tokens, or confidential proxy endpoints**.
2. Keep user credentials strictly in client `localStorage` or environment variables.
3. Run `npm run build` before opening a Pull Request to ensure zero TypeScript compiler errors.
