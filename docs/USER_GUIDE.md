# User Guide
## Quant Backtest Pro Platform (English)

Welcome to **Quant Backtest Pro** — the institutional-grade quantitative backtesting, high-performance market replay, AI strategy optimization, and algorithmic bot deployment platform.

---

## 0. Authentication & Default Account
When opening the application for the first time, click the **Sign In** button in the top right header:
- **Pre-Seeded Default Account**:
  - **Email**: `admin@quantbacktest.pro`
  - **Password**: `QuantPro@2026`
  - **Tier**: `INSTITUTIONAL` (All features unlocked)
- **1-Click Login**: Simply click the **1-Click** button on top of the modal to immediately log in without typing credentials.
- **Custom Registration**: Switch to the **Sign Up** tab to register your personal trader account.

---

## 1. Main Workspace & 60 FPS Replay Navigation

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [EURUSD] [M15] | [Replay: Play/Pause/Speed] | Balance: $10,000 | [AI Studio] │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                         TRADINGVIEW CANDLESTICK CHART                        │
│                         (Draw: Trendline, Fibo, Box, Measure)                │
│                                                                              │
│                                                ┌───────────────────────────┐ │
│                                                │ AI BOT FLOATING HUD [ON]  │ │
│                                                │ Trades: 18 | Winrate: 67% │ │
│                                                │ Net PnL: +$1,420.50       │ │
│                                                └───────────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────────┤
│ [Dock: Open Positions (0)] [Trade History (18)] [AI Logs] | [Actions: BE]    │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 1.1. Replay Toolbar & High-Speed Performance
- **Play / Pause (Hotkey: Space)**: Starts or pauses historical bar-by-bar playback.
- **Step Forward (Hotkey: Right Arrow $\rightarrow$ or F)**: Advances historical playback by exactly one candle.
- **Step Backward (Hotkey: Left Arrow $\leftarrow$ or Ctrl+Z)**: Rolls back playback by one candle.
- **Speed Selector**: Choose playback speed from `1x` (1 candle/s) up to `100x` (Max Speed). Thanks to our $O(1)$ incremental rendering engine, chart animations remain silky smooth at **60 FPS** even with 200,000+ historical candles loaded.
- **Timeframe Selector**: Dynamically resamples candles to M1, M5, M15, M30, H1, H4, D1, W1, and MN.

---

## 2. 📥 Data Import Manager 2.0 & Dataset Library

Click the **Data / Dữ liệu** button in the top navigation bar:

### 2.1. Drag & Drop CSV / TXT Upload
1. Drag and drop any `.csv` or `.txt` historical data file into the glowing dropzone.
2. The engine automatically detects delimiters (`;`, `,`, `\t`) and symbol names (e.g. `XAU_5m_data.csv` $\rightarrow$ `XAUUSD`).
3. **Smart Range Slicer**:
   - `Last 200k Bars (Recommended - 60 FPS)`: Loads the freshest 200,000 bars for instant performance.
   - `Last 100k Bars` / `Last 50k Bars` / `Full Dataset`.
4. **Data Health & Diagnostic Card**: Instantly inspect total rows scanned, valid candles, duplicate sanitization, detected base timeframe, and time span.
5. **Data Extraction Preview Table**: View the first 5 rows to confirm correct OHLCV column mapping before loading.

### 2.2. Local-First Dataset Library (DB Tab)
- Every imported dataset is saved to browser storage and local SQLite.
- Switch between different assets and historical datasets with a single click (`Load to Chart`) without re-uploading large files.

### 2.3. Online REST Crawler
- Pull live historical candle data directly from Binance REST API (1m, 5m, 15m, 1h, 4h, 1d) with zero API keys required.

---

## 3. 🧠 AI Strategy Studio & SL/TP Multi-Variant Optimizer

### 3.1. Natural Language Strategy Synthesis
1. Click **AI Studio** in the header.
2. In the **Studio & Sandbox** tab, describe your strategy (e.g. *"EMA 9 crosses EMA 21, RSI < 65 filter, SL 20 pips, TP 40 pips"*).
3. Click **"Generate AI Strategy"** to synthesize executable JavaScript sandbox code.
4. **Strategy Rule Breakdown Cards**: Inspect auto-generated natural language cards summarizing **BUY Conditions**, **SELL Conditions**, and **Risk Parameters**.

### 3.2. SL/TP Grid Search & Multi-Variant Optimizer
1. Switch to the **⚡ SL/TP Optimizer** tab.
2. Set parameter bounds:
   - **Stop Loss Range**: Min, Max, Step (in Pips).
   - **Take Profit Range**: Min, Max, Step (in Pips).
   - Or click **Symbol Preset** to auto-fill asset-appropriate ranges.
3. Click **"🚀 Run Multi-Variant Optimizer"**:
   - Replays parallel simulations across all parameter variants.
   - **2D Profit Heatmap**: Pinpoints sweet-spot parameter clusters to avoid overfitting.
   - **SVG Mini Sparkline Equity Curves**: Displays the exact equity trajectory for every single configuration in the Leaderboard table.
   - **Statistical Quality Filters**: Toggle `Min 5 Trades` and `Profitable Net PnL > 0` to filter out outlier luck.
4. Click **"Apply This Configuration"** on the top-ranked variant to automatically inject optimal SL/TP pips into your strategy.

---

## 4. 🤖 AI Bot Live Floating HUD

When Auto-Trading is enabled, a high-tech Glassmorphic HUD docks on the upper-right corner of your chart:
- **Active Pulse Indicator**: Green pulse indicates the bot is monitoring live ticks; amber pulse indicates an active open position.
- **Real-Time Metrics**: Bot-specific trade count, Winrate %, Realized Net PnL ($), and Floating PnL.
- **One-Click Controls**: Toggle Auto-Trading ON/OFF, collapse into a sleek minimal status pill, or jump directly into the Studio or Optimizer tabs.

---

## 5. 🛡️ Order Execution & Risk Management

### 5.1. Quick Trade Dock & Visual Chart Lines
- Click **BUY** or **SELL** in the top-left Quick Dock.
- Entry lines, Stop Loss lines (with dollar risk and % capital), and Take Profit lines (with dollar reward) render directly on the candlestick chart.

### 5.2. Prop Firm Challenge Shield
- Configure **Max Daily Loss Limit** (e.g. 5%) and **Max Total Drawdown** (e.g. 10%).
- Real-time audio and visual circuit breakers freeze trading if rule boundaries are breached.

---

## 6. 🤖 Multi-Platform Strategy Bot Exporter

Click **"Export Bot"** in AI Studio or from your saved strategies list:
- 🌲 **TradingView (Pine Script v5)**: Copy & paste into Pine Editor with Webhook Alert JSON payloads for 3Commas, Bybit, Binance, PineConnector.
- 📈 **MetaTrader 5 (MQL5 EA)**: Download `.mq5` Expert Advisor file with `CTrade` and pips-based SL/TP; press F7 in MetaEditor to compile.
- 📊 **MetaTrader 4 (MQL4 EA)**: Download `.mq4` Expert Advisor file with `OrderSend()` and Magic Number management.
- 🐍 **Python Bot (CCXT)**: Standalone Python 3 script for 24/7 autonomous trading on Binance, Bybit, OKX.
- ⚡ **cTrader (C# cBot)**: Complete `.cs` robot file for cTrader Automate.
- 📦 **Universal JSON Package**: Export/Import strategy files (`.json` / `.js`) to backup and share.

---

## 7. 📊 Institutional Analytics & Session Management

- **SQLite Database Persistence**: All trades, equity curves, and chart drawings are saved in `server/backtest.db`.
- **Session Comparison Matrix**: Compare side-by-side performance (Win Rate, Profit Factor, Max Drawdown, Sharpe Ratio, Expectancy).
- **Monte Carlo Simulation (500 iterations)**: Assess risk-of-ruin probability and confidence intervals.
- **PnL Calendar Heatmap**: Visual breakdown of daily, weekly, and monthly performance.
