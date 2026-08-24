# Quant Backtest Pro 🚀

> **Institutional-Grade Web-based Multi-Asset Replay, AI Strategy Generation & Trading Bot Deployment Platform**

[![Language: English](https://img.shields.io/badge/Language-English-blue.svg)](#)
[![Language: Tiếng Việt](https://img.shields.io/badge/Ngôn%20ngữ-Tiếng%20Việt-red.svg)](README.vi.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![CI](https://github.com/thieucong98/quant-backtest-pro/actions/workflows/ci.yml/badge.svg)](https://github.com/thieucong98/quant-backtest-pro/actions/workflows/ci.yml)
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

## 📖 Overview

**Quant Backtest Pro** is a modern, high-performance, open-source trading simulation and backtesting platform built for quantitative traders, manual price-action traders, and algorithmic developers. It brings together **60 FPS ultra-smooth candlestick replay (even with 200,000+ candles)**, realistic order execution matching, **AI-powered strategy creation & SL/TP Multi-Variant Grid Optimization**, live **AI Bot Floating HUD**, **Data Import Manager 2.0**, backtest session persistence, and instant multi-platform trading bot exportation.

---

## ✨ Key Features

```
                                  QUANT BACKTEST PRO
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                                                                                        │
 │   ┌───────────────────────┐   ┌───────────────────────┐   ┌────────────────────────┐   │
 │   │  60 FPS Replay Engine │   │  AI Strategy Studio   │   │  SL/TP Grid Optimizer  │   │
 │   │  - O(1) Series Update │   │  - Multi-LLM Support  │   │  - 2D Profit Heatmap   │   │
 │   │  - Zero-Alloc Replay  │   │  - Rule Breakdown Card│   │  - Mini Sparklines     │   │
 │   │  - 200k+ Candle Flow  │   │  - 1-Click Injection  │   │  - Statistical Filters │   │
 │   └───────────────────────┘   └───────────────────────┘   └────────────────────────┘   │
 │                                                                                        │
 │   ┌───────────────────────┐   ┌───────────────────────┐   ┌────────────────────────┐   │
 │   │  Data Import Mgr 2.0  │   │  AI Bot Floating HUD  │   │  Bot Exporter Hub      │   │
 │   │  - Drag & Drop Zone   │   │  - Live PnL & Status  │   │  - MT5 / MT4 (MQL)     │   │
 │   │  - Smart Slicer (200k)│   │  - Pulse Indicator    │   │  - Pine Script v5      │   │
 │   │  - Data Health Card   │   │  - Minimize to Pill   │   │  - Python CCXT / cBot  │   │
 │   │  - Local-First DB Lib │   │  - Quick Navigation   │   │  - Universal JSON/JS   │   │
 │   └───────────────────────┘   └───────────────────────┘   └────────────────────────┘   │
 │                                                                                        │
 └────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1. ⚡ High-Performance 60 FPS Replay Engine (Handles 200,000+ Candles)
- **$O(1)$ Incremental Chart Rendering**: Sub-millisecond (`0.05ms`) candle updates on TradingView Lightweight Charts, eliminating canvas rebuilds and GC thrashing at high playback speeds (`10x` to `100x`).
- **Zero-Allocation Point-In-Time Indicators**: Technical indicators (`SMA`, `EMA`, `RSI`, `ATR`, `Bollinger Bands`, `MACD`) compute over dynamic effective length without array cloning.
- **Multi-Timeframe Resampling**: Real-time resampling from M1 raw data to M5, M15, M30, H1, H4, D1, W1, and MN.
- **Economic Calendar Overlay**: Automated marker positioning for high-impact macroeconomic events.

### 2. ⚡ SL/TP Grid Search & Multi-Variant Parameter Optimizer
- **Automated Parameter Sweeping**: Run multi-variant batch simulations across custom Stop Loss and Take Profit ranges with asset-aware presets (Forex, Gold, Crypto, Indices).
- **2D Profit Heatmap Matrix**: Identifies robust profitable zones (*Sweet Spots*) to prevent curve-fitting and overfitting.
- **SVG Mini Sparkline Equity Curves**: Visualizes trajectory and stability of capital growth directly in Leaderboard table cells.
- **Statistical Quality Filters**: 1-click toggles for `Minimum Trade Count (>= 5)` and `Profitable Net PnL > 0`.
- **1-Click Strategy Parameter Injection**: Injects optimal SL/TP parameters directly into the live sandbox code and Strategy Rule cards.

### 3. 🧠 AI Strategy Studio & Rule Breakdown Cards
- **Natural Language to Code**: Type *"Fast EMA 9 crosses above EMA 21 with RSI < 70 filter, SL 15 pips, TP 30 pips"* and receive executable sandbox code instantly.
- **Strategy Rule Breakdown Cards**: Auto-parses code regex into natural language summaries for **BUY Conditions**, **SELL Conditions**, and **Risk Management Parameters**.
- **Multi-Provider Support**: Connects to OpenAI, Google Gemini, Anthropic Claude, DeepSeek, Local Ollama, and **Custom OpenAI-compatible Reverse Proxy Tunnels**.
- **Latency Ping & Key Validation**: Real-time measurement of endpoint responsiveness.

### 4. 🤖 AI Bot Live Floating HUD Widget
- **Glassmorphic Floating HUD**: High-tech widget docked on the main chart workspace with animated activity pulse.
- **Real-Time Bot Metrics**: Displays bot-specific closed trades, Winrate %, Realized Net PnL ($), and Floating PnL for active positions.
- **Instant Controls & Minimize**: Toggle Auto-Trading ON/OFF, collapse into a compact status pill, or jump directly into the Studio / Optimizer tabs.

### 5. 📥 Data Import Manager 2.0 & Local-First Dataset Library
- **Interactive Drag & Drop Zone**: Supports `.csv` and `.txt` files with auto-delimiter detection (`;`, `,`, `\t`) and symbol auto-matching.
- **Ultra-Fast Integer Date Parser**: Parses **1.44 Million candles (74.4 MB) in under 3.8 seconds** using `Date.UTC` integer timestamp conversion.
- **Smart Range Slicer**: Choose between `Last 200k Bars (Recommended - 60 FPS)`, `Last 100k Bars`, `Last 50k Bars`, or `Full Dataset`.
- **Data Health & Diagnostic Card**: Scans total rows, valid bars, duplicate sanitization count, detected base timeframe (e.g. `M5`), and exact start/end dates.
- **Local-First Dataset Library**: Saves datasets to Local Storage & SQLite DB for instant 1-click switching without re-uploading large files.
- **Online REST Crawler**: Live historical data pull from Binance REST API (1m, 5m, 15m, 1h, 4h, 1d) with zero API keys required.

### 6. 🤖 Multi-Platform Strategy Bot Exporter & Deployment Hub
Export any backtested strategy to production-ready bot code in seconds:
- **TradingView (Pine Script v5)**: Ready to paste into Pine Editor with Webhook Alert JSON payloads for 3Commas, Bybit, Binance, and PineConnector.
- **MetaTrader 5 (MQL5 EA)**: Complete `.mq5` Expert Advisor using `CTrade` and pips risk management, ready to compile in MetaEditor (F7).
- **MetaTrader 4 (MQL4 EA)**: Classic `.mq4` Expert Advisor with `OrderSend()` and Magic Number management.
- **Python Bot (CCXT + Pandas-TA)**: Standalone 24/7 Python 3 script for Binance, Bybit, and OKX.
- **cTrader (C# cBot)**: High-speed `.cs` robot for cTrader Automate.
- **Universal JSON Package**: Export/Import strategy files (`.json` / `.js`) to backup and share.

### 7. 🛡️ Prop Firm Challenge Shield & Quantitative Analytics
- **Prop Firm Shield**: Set Max Daily Loss (e.g. 5%) and Max Total Drawdown (e.g. 10%) with real-time audio and visual violation circuit breakers.
- **Persistent Sessions**: All backtest history, equity points, open/closed trades, and drawings are automatically stored in local SQLite (`server/backtest.db`).
- **Session Comparison Matrix**: Inspect and compare side-by-side performance (Win Rate, Profit Factor, Max Drawdown, Sharpe Ratio, Expectancy).
- **Monte Carlo Simulation**: 500-iteration stress testing to compute risk-of-ruin probability and confidence intervals.
- **PnL Calendar Heatmap**: Visual breakdown of daily, weekly, and monthly performance.

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

### 3. Start development servers
```bash
# Terminal 1: Start Frontend Client (Vite)
npm run dev

# Terminal 2: Start Backend SQLite API (Node.js + Prisma)
npm run server:start
```

Open your browser at:
- **Frontend App**: `http://localhost:5173/`
- **Backend API Health**: `http://localhost:3001/api/health`

### 🔑 Default Developer / Trader Account
- **Email**: `admin@quantbacktest.pro`
- **Password**: `QuantPro@2026`
- **Tier**: `INSTITUTIONAL` (All features & unlimited backtests unlocked)

---

## 🏗️ Architecture & Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend UI** | React 19, TypeScript 5.8 | High-performance, strictly typed UI components |
| **Styling** | Tailwind CSS 3.4, Lucide Icons | Responsive modern dark-theme interface with Glassmorphism |
| **Charts** | Lightweight Charts v4 | TradingView's high-speed canvas charting library ($O(1)$ update pipeline) |
| **State** | Zustand 5 | Low-overhead reactive state management with throttled persistence |
| **Backend & Storage**| Node.js Express + Prisma + SQLite | Local database persistence for sessions, trades, strategies, and datasets |
| **Quant Engines** | Custom TypeScript Quant Engines | Order matching engine (OMS), resampler, technical indicators, Monte Carlo |
| **Data Parser** | Custom Fast Integer CSV Parser | Sub-4s parsing for 1.44M OHLCV bars with auto-delimiter detection |
| **AI Integration** | Fetch API + OpenAI standard | Multi-LLM strategy generator, SL/TP optimizer, and code transpilers |

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

## 📄 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for more information.
