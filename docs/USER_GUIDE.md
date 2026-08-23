# User Guide
## Quant Backtest Pro Platform (English)

Welcome to **Quant Backtest Pro** — the institutional-grade quantitative backtesting, market replay, and algorithmic bot deployment platform.

---

## 1. Main Workspace & Replay Navigation

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [EURUSD] [M15] | [Replay: Play/Pause/Speed] | Balance: $10,000 | [AI Studio] │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                         TRADINGVIEW CANDLESTICK CHART                        │
│                         (Draw: Trendline, Fibo, Box, Measure)                │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ [Dock: Open Positions (0)] [Trade History (12)] [AI Logs] | [Actions: BE]    │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 1.1. Replay Toolbar
- **Play / Pause (Hotkey: Space)**: Starts or pauses historical bar-by-bar playback.
- **Step Forward (Hotkey: Right Arrow $\rightarrow$)**: Advances historical playback by exactly one candle.
- **Speed Slider**: Fine-tune playback speed from `0.1x` (slow motion) up to `50x` (rapid backtest).
- **Timeframe Selector**: Dynamically resamples candles to M1, M5, M15, M30, H1, H4, D1, W1, and MN.

---

## 2. Order Execution & Risk Management

### 2.1. One-Click Trading Dock
- Click **BUY** or **SELL** buttons on the quick trading dock at the bottom of the screen.
- Configurable preset Lot size, Stop Loss pips, and Take Profit pips.

### 2.2. Advanced Order Entry Modal
- Press **"New Order"** in the top navigation bar (Hotkey: `O`).
- Supported order types:
  - **Market Order**: Immediate execution at current Ask/Bid price with slippage simulation.
  - **Limit Order**: Buy Limit (below current price), Sell Limit (above current price).
  - **Stop Order**: Buy Stop, Sell Stop.
  - **Risk Configuration**: Dynamic R:R ratio calculation, Trailing Stop in pips, and order comments.

### 2.3. Prop Firm Challenge Shield
- Ideal for funded trader evaluations (FTMO, MFF, The Funded Trader, Funding Pips):
  - **Max Daily Loss Limit**: e.g., 5% of daily starting equity.
  - **Max Total Drawdown**: e.g., 10% of high-water mark equity.
- Automatically triggers visual and audio circuit breakers, freezing order entry if risk thresholds are breached.

---

## 3. AI Strategy Studio & Auto-Trading

### 3.1. Multi-LLM Provider Configuration
1. Click the **AI Studio** button in the header.
2. Select the **LLM Config** tab.
3. Choose your preferred AI provider:
   - **Custom OpenAI-Compatible API / Proxy Tunnel**: Enter your custom Base URL, Model ID, and API Key.
   - **OpenAI / OpenRouter / Groq / Google Gemini / Anthropic Claude / DeepSeek / Local Ollama**.
4. Click **"Test Connection"** to measure live endpoint latency (in milliseconds) and verify key validity.

### 3.2. Natural Language Strategy Synthesis
1. In the **Studio & Sandbox** tab, type your strategy requirements. For example:
   > *"Fast EMA 9 crosses above Slow EMA 21, Buy with SL 15 pips, TP 30 pips. Sell when EMA 9 crosses below EMA 21."*
2. Click **"Generate AI Strategy"** $\rightarrow$ Sandbox JavaScript code is generated.
3. Click **"Activate & Run"** $\rightarrow$ The engine compiles the algorithm, turns Auto-Trading ON, closes the modal, and resumes replay automatically.

---

## 4. Multi-Platform Strategy Bot Exporter

Click **"Export Bot"** in AI Studio or from your saved strategies list:
- 🌲 **TradingView (Pine Script v5)**: Copy and paste into TradingView Pine Editor; includes ready-to-use Webhook Alert JSON payloads.
- 📈 **MetaTrader 5 (MQL5 EA)**: Download `.mq5` Expert Advisor file with `CTrade` and pips-based SL/TP; press F7 in MetaEditor to compile.
- 📊 **MetaTrader 4 (MQL4 EA)**: Download `.mq4` Expert Advisor file with `OrderSend()` and Magic Number management.
- 🐍 **Python Bot (CCXT)**: Download `.py` script for 24/7 autonomous trading on Binance, Bybit, or OKX.
- ⚡ **cTrader (C# cBot)**: Download `.cs` robot file for cTrader Automate.
- 📦 **Universal JSON Package**: Export/Import strategy files (`.json` / `.js`) to backup and share.

---

## 5. Session Management & Institutional Analytics

### 5.1. SQLite Session Persistence
- Every trade, equity curve data point, and drawing is stored automatically in local SQLite (`server/backtest.db`).
- **Session Comparison Matrix**: Select multiple saved sessions to view a side-by-side performance matrix (Win Rate, Profit Factor, Max Drawdown, Sharpe Ratio, Expectancy).

### 5.2. Analytics Dashboard
- **Equity & Balance Curve**: Track growth and peak-to-trough drawdowns.
- **Monte Carlo Simulation (500 iterations)**: Assess risk-of-ruin probability and confidence intervals.
- **PnL Calendar Heatmap**: Inspect daily, weekly, and monthly profitability distributions.
