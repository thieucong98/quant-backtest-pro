# Quant Backtest Pro 🚀

> **Institutional-Grade Web-based Multi-Asset Replay, AI Strategy Generation & Trading Bot Deployment Platform**

[![Language: English](https://img.shields.io/badge/Language-English-blue.svg)](#)
[![Language: Tiếng Việt](https://img.shields.io/badge/Ngôn%20ngữ-Tiếng%20Việt-red.svg)](README.vi.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-cyan.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.4-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/Storage-SQLite-003B57.svg)](https://www.sqlite.org/)

---

## 🌐 Language Navigation / Chuyển đổi ngôn ngữ
* 🇺🇸 **[English (Current)](README.md)**
* 🇻🇳 **[Tiếng Việt](README.vi.md)**

---

## 📸 Visual Previews & Screenshots

### 1. ⚡ High-Speed Historical Replay & Order Execution
![Quant Backtest Pro Replay Dashboard](docs/assets/dashboard_replay.png)
*Real-time candlestick replay, TradingView Lightweight Charts, Multi-timeframe resampling, and One-Click Trading Dock.*

---

### 2. 🧠 AI Strategy Studio & Multi-LLM Copilot
![AI Strategy Studio](docs/assets/ai_strategy_studio.png)
*Generate executable JavaScript strategy code from natural language with multi-provider LLM support (OpenAI, Gemini, Claude, DeepSeek, Local Ollama, Custom Proxy Tunnels).*

---

### 3. 🛡️ Prop Firm Challenge Shield (Drawdown Guard)
![Prop Firm Challenge Shield](docs/assets/prop_firm_shield.png)
*Set daily maximum loss limits, max total drawdown, and real-time audio/visual circuit breakers for funded trader evaluations.*

---

### 4. 📊 Multi-Session Comparison Matrix (SQLite Persistence)
![Session Comparison Matrix](docs/assets/session_comparison_matrix.png)
*Inspect and compare performance side-by-side across multiple backtested sessions.*

---

### 5. 🎲 Institutional Analytics & Monte Carlo Simulation
![Monte Carlo Simulation](docs/assets/monte_carlo_simulation.png)
*500-run Monte Carlo stress testing to compute risk-of-ruin probability and confidence intervals.*

---

### 6. 📅 PnL Calendar Heatmap
![PnL Calendar Heatmap](docs/assets/pnl_heatmap.png)
*Visual calendar matrix breakdown of daily, weekly, and monthly net profitability.*

---

## 📖 Overview

**Quant Backtest Pro** is a modern, high-performance, open-source trading simulation and backtesting platform built for quantitative traders, manual price-action traders, and algorithmic developers. It brings together ultra-smooth candlestick/tick replay, realistic order execution matching, AI-powered strategy creation, backtest session persistence, and instant multi-platform trading bot exportation.

---

## ✨ Key Features

```
                                  QUANT BACKTEST PRO
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                                                                                        │
 │   ┌───────────────────────┐   ┌───────────────────────┐   ┌────────────────────────┐   │
 │   │  Replay Engine        │   │  AI Strategy Studio   │   │  Bot Exporter Hub      │   │
 │   │  - Tick / Candle Play │   │  - Multi-LLM Support  │   │  - MT5 / MT4 (MQL)     │   │
 │   │  - Realistic Slippage │   │  - Custom Proxies     │   │  - Pine Script v5      │   │
 │   │  - M1 to Monthly      │   │  - Live Latency Ping  │   │  - Python CCXT / cBot  │   │
 │   └───────────────────────┘   └───────────────────────┘   └────────────────────────┘   │
 │                                                                                        │
 │   ┌───────────────────────┐   ┌───────────────────────┐   ┌────────────────────────┐   │
 │   │  SQLite Persistence   │   │  Quant Analytics      │   │  Prop Firm Shield      │   │
 │   │  - Multi-Session Save │   │  - Monte Carlo Test   │   │  - Daily Max Loss      │   │
 │   │  - Strategy DB        │   │  - PnL Heatmap        │   │  - Max Drawdown Guard  │   │
 │   │  - Session Comparison │   │  - Equity Curves      │   │  - Pass / Fail Alerts  │   │
 │   └───────────────────────┘   └───────────────────────┘   └────────────────────────┘   │
 │                                                                                        │
 └────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1. ⚡ High-Speed Historical Replay Engine
- **Bar-by-Bar Playback**: Step forward, step backward, or auto-play at speeds ranging from `0.1x` to `50x`.
- **Multi-Timeframe Resampling**: Real-time resampling from M1 raw data to M5, M15, M30, H1, H4, D1, W1, and MN.
- **Economic Calendar Overlay**: Live indicators for FOMC, CPI, NFP, and central bank interest rate decisions.

### 2. 🛡️ Realistic Order Matching & Risk Management
- **Execution Simulation**: Supports Market Orders, Limit Orders, Stop Orders, with customizable Spreads, Commissions, and Slippage.
- **Dynamic Risk Rules**: Automatic SL/TP calculation in Pips or Price, Trailing Stop, Break-Even, and One-Click Partial Close.
- **Prop Firm Shield**: Set Max Daily Loss (e.g. 5%) and Max Total Drawdown (e.g. 10%) with real-time audio and visual violation alerts.

### 3. 🧠 AI Strategy Studio & Multi-LLM Copilot
- **Natural Language to Code**: Type *"Fast EMA 9 crosses above EMA 21 with RSI < 70 filter, SL 15 pips, TP 30 pips"* and receive executable sandbox code instantly.
- **Multi-Provider Support**: Connects to OpenAI, Google Gemini, Anthropic Claude, DeepSeek, Local Ollama, and **Custom OpenAI-compatible Reverse Proxy Tunnels**.
- **Real-Time Latency Testing**: Live endpoint ping with millisecond response measurement and strict key validation.
- **1-Click Activate & Run**: Compiles code, turns on auto-trading, resumes replay, and executes signals automatically on each incoming candle.

### 4. 🤖 Multi-Platform Strategy Bot Exporter & Deployment Hub
Export any backtested strategy to production-ready bot code in seconds:
- **TradingView (Pine Script v5)**: Ready to paste into Pine Editor with Webhook Alert JSON payloads for 3Commas, Bybit, Binance, and PineConnector.
- **MetaTrader 5 (MQL5 EA)**: Complete `.mq5` Expert Advisor using `CTrade` and pips risk management, ready to compile in MetaEditor (F7).
- **MetaTrader 4 (MQL4 EA)**: Classic `.mq4` Expert Advisor with `OrderSend()` and Magic Number management.
- **Python Bot (CCXT + Pandas-TA)**: Standalone 24/7 Python 3 script for Binance, Bybit, and OKX.
- **cTrader (C# cBot)**: High-speed `.cs` robot for cTrader Automate.
- **Universal JSON Package**: Export/Import strategy files (`.json` / `.js`) to backup and share.

### 5. 📊 Institutional Analytics & Session Management
- **Persistent Sessions**: All backtest history, equity points, open/closed trades, and drawings are automatically stored in local SQLite (`server/backtest.db`).
- **Session Comparison Matrix**: Inspect and compare side-by-side performance (Win Rate, Profit Factor, Max Drawdown, Sharpe Ratio, Expectancy) across multiple sessions.
- **Monte Carlo Simulation**: 500-iteration stress testing to compute risk-of-ruin probability and confidence intervals.
- **PnL Calendar Heatmap**: Visual breakdown of daily, weekly, and monthly performance.

### 6. 🌍 Full Multi-Language Localization (i18n)
- Seamless real-time switching between **English (`en`)**, **Tiếng Việt (`vi`)**, **日本語 (`ja`)**, và **中文 (`zh`)**.

---

## 🚀 Quickstart

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.0.0 or higher)
- [npm](https://www.npmjs.com/) (or `pnpm` / `yarn`)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/quant-backtest-pro.git
cd quant-backtest-pro
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start development server
```bash
npm run dev
```

Open your browser at:
- **Frontend App**: `http://localhost:5173/`
- **Backend API**: `http://localhost:3001/api/health`

---

## 🏗️ Architecture & Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend UI** | React 19, TypeScript 5.8 | High-performance, strictly typed UI components |
| **Styling** | Tailwind CSS 3.4, Lucide Icons | Responsive modern dark-theme interface |
| **Charts** | Lightweight Charts v4 | TradingView's high-speed canvas charting library |
| **State** | Zustand 5 | Low-overhead reactive state management |
| **Backend & Storage**| Node.js Express + SQLite (`better-sqlite3`) | Local file persistence for sessions and custom strategies |
| **Math & Engines** | Custom TypeScript Quant Engines | Order matching, resampler, technical indicators, Monte Carlo |
| **AI Integration** | Fetch API + OpenAI-compatible standard | Multi-LLM strategy generator and code transpilers |

---

## 📚 Documentation Index

| English Documentation | Vietnamese Documentation (Tiếng Việt) |
| :--- | :--- |
| 📘 [User Guide](docs/USER_GUIDE.md) | 📘 [Hướng dẫn sử dụng](docs/vi/USER_GUIDE.md) |
| 🛠️ [Developer Guide](docs/DEVELOPER_GUIDE.md) | 🛠️ [Tài liệu lập trình viên](docs/vi/DEVELOPER_GUIDE.md) |
| 🏛️ [System Architecture](docs/ARCHITECTURE.md) | 🏛️ [Kiến trúc hệ thống](docs/vi/ARCHITECTURE.md) |
| 🤖 [Strategy Bot Exporter Guide](docs/STRATEGY_BOT_EXPORTER.md) | 🤖 [Hướng dẫn xuất Bot giao dịch](docs/vi/STRATEGY_BOT_EXPORTER.md) |
| 🔌 [API Reference](docs/API_REFERENCE.md) | 🔌 [Tài liệu API RESTful](docs/vi/API_REFERENCE.md) |

---

## 🤝 Contributing

We welcome contributions from the community! Please read our [Contributing Guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) before submitting pull requests.

1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'feat: add some amazing feature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 🛡️ Security

For vulnerability disclosure and security reporting, please refer to our [Security Policy](SECURITY.md).

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for more information.

---

<p align="center">
  <b>Quant Backtest Pro</b> • Built with ❤️ for Quantitative Traders Worldwide.
</p>
