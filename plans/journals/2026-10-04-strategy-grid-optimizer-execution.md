# 📓 Technical Journal: Strategy Grid Optimizer Execution & Dataset Robustness Fix

- **Date**: 2026-10-04
- **Branch**: `fix/grid-optimizer-execution-and-dataset`
- **Component**: AI Strategy Copilot & Quantitative Sandbox (`src/engine/strategyOptimizer.ts`, `src/engine/indicators.ts`, `src/components/panels/AIStrategyModal.tsx`)
- **Author**: Antigravity AI Pair Programmer

---

## 1. Problem Statement & Root Cause Diagnosis

### Symptoms
When clicking **"Execute Parameter Grid Search"** in the **Grid Optimizer** tab of the AI Strategy Copilot Modal:
- Every cell in the 2D Parameter Landscape (SL vs TP) produced `+$0, 0%`.
- The "Best Overall" card displayed `Net PnL: +$0.00`, `Win Rate: 0.0%`, and `0 Trades`.
- Monte Carlo pass rate was `0%` due to zero trades executed across all tested parameter combinations.

### Root Causes Diagnosed
1. **Default Strategy Parameter Erasure**:
   - In `StrategyOptimizerEngine.runBatchOptimization()`, each simulated strategy instance received `stratInstance.parameters = mergedParams;`.
   - When the user had not changed parameters or `activeStrategy.parameters` was `{}` in UI state, `mergedParams` contained ONLY `slPips` and `tpPips`.
   - Crucial indicator configuration parameters declared in the strategy code (e.g. `emaFast: 9`, `emaSlow: 21`, `rsiPeriod: 14`, `macdFast: 12`) were completely overwritten with `undefined`.
   - As a result, `api.indicators.ema(params.emaFast)` evaluated with `undefined`, causing indicator lookups to produce `NaN` or fail silently, so trading signals were never triggered (0 trades).
2. **Indicator Parameter Fragility & MACD Property Discrepancy**:
   - In `src/engine/indicators.ts`, passing non-numeric or undefined parameters caused calculations to fail or return 0.
   - For MACD, `IndicatorCalculator.macd()` returned `{ macd, signal, hist }`. Many generated strategies and prebuilt strategies check `macd.histogram` instead of `macd.hist`. When accessing `macd.histogram`, it was `undefined`, resulting in no trades.
3. **Markdown Code-Block Fences**:
   - If AI-generated strategy code contained markdown fences (e.g., ````javascript ... ````), execution would fail to instantiate the strategy function in the sandbox.
4. **Dataset Starvation on High Timeframes**:
   - On charts switched to higher timeframes with few loaded bars (< 50 bars), splitting the dataset 70% In-Sample / 30% Out-of-Sample left insufficient history for indicators to initialize.

---

## 2. Solutions Implemented

1. **Preserve Embedded Strategy Parameters (`src/engine/strategyOptimizer.ts`)**:
   - Preserves `defaultStratParams` extracted directly from the strategy definition:
     ```typescript
     const defaultStratParams = (stratInstance.parameters && typeof stratInstance.parameters === 'object')
       ? stratInstance.parameters
       : {};

     stratInstance.parameters = {
       ...defaultStratParams,
       ...baseParameters,
       slPips,
       tpPips,
       stopLossPips: slPips,
       takeProfitPips: tpPips,
       sl: slPips,
       tp: tpPips,
       lotSize
     };
     ```
   - Automatically synchronizes Visual Strategy Builder block keys (e.g., `rule1_sl`, `rule1_tp`).
2. **Indicator Robustness & MACD Property Parity (`src/engine/indicators.ts`)**:
   - Added `sanitizePeriod(period, defaultPeriod)` across all indicator functions (`sma`, `ema`, `rsi`, `atr`, `bollingerBands`, `macd`, `highest`, `lowest`).
   - Extended `macd()` return structure to provide both `hist` and `histogram` simultaneously:
     ```typescript
     return { macd: macdLine, signal: signalLine, hist: histValue, histogram: histValue };
     ```
3. **Automated Code Cleaning (`src/engine/strategyOptimizer.ts`)**:
   - Added `StrategyOptimizerEngine.cleanCode()` to strip markdown fences (` ```javascript `, ` ``` `) and extraneous code wrappers before evaluation.
4. **Adaptive Dataset Resolution & UI Dataset Indicator (`src/components/panels/AIStrategyModal.tsx`)**:
   - If active timeframe candles are fewer than 50 bars, falls back to `rawM1Candles` to provide rich sample history.
   - Guarded Train/Test split: only enables splitting when bars $\ge 50$.
   - Added real-time dataset info pill next to Asset Presets: `{instrument.symbol} • {candles.length} bars ({timeframe})`.
   - Added `activePreset` state tracking to highlight selected asset preset buttons.
5. **Comprehensive Test Suite Expansion (`test_comprehensive_suite.ts`)**:
   - Added Section 25: Strategy Grid Optimizer & Robustness Engine Tests covering:
     - 25.1: `cleanCode` strips markdown code block fences.
     - 25.2: `replaceSLTPInCode` updates `slPips` and `tpPips`.
     - 25.3: `replaceSLTPInCode` updates visual block `rule1_sl` and `rule1_tp`.
     - 25.4: `macd` property parity (`hist === histogram`).
     - 25.5: Batch optimizer executes with preserved default parameters (> 0 trades).
     - 25.6: MACD Zero Line strategy executes non-zero trades in grid search.
     - 25.7: Visual block strategy executes non-zero trades in grid search.

---

## 3. Verification & Quality Gates

- `npm run check:i18n`: 0 hardcoded strings, 100% parity across `vi`, `en`, `ja`, `zh`.
- `npx tsc --noEmit`: 0 TypeScript compilation errors.
- `npx tsx test_comprehensive_suite.ts`: 246 / 246 tests passing (0 failures).
- `npm run build`: Production bundle built cleanly with zero errors.
- **Browser Live Verification**:
  - Ran parameter search (SL 20-100, TP 40-200, 25 combinations) in 831ms.
  - Successfully produced non-zero trades, positive PnL (+$1028.00), win rate 66.7%, and full 2D heatmap matrix.
  - Screenshot verified at `grid_optimizer_tab_1791104093124.png`.
