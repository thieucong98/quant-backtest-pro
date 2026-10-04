# Quant Backtest Pro 🚀

<div align="center">

> **Institutional-Grade Web-based Multi-Asset Replay, AI Strategy Generation & Trading Bot Deployment Platform**

[![Release: v1.3.0](https://img.shields.io/badge/Release-v1.3.0-indigo.svg?style=for-the-badge)](https://github.com/thieucong98/quant-backtest-pro/releases/tag/v1.3.0)
[![Language: English](https://img.shields.io/badge/Language-English-blue.svg?style=for-the-badge)](#)
[![Language: Tiếng Việt](https://img.shields.io/badge/Ngôn%20ngữ-Tiếng%20Việt-red.svg?style=for-the-badge)](README.vi.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg?style=for-the-badge)](LICENSE)
[![Tests: 100% Passed](https://img.shields.io/badge/Tests-208%2F208%20Passed-success.svg?style=for-the-badge)](#)
[![Docker Ready](https://img.shields.io/badge/Docker-Ready-2496ED.svg?style=for-the-badge&logo=docker&logoColor=white)](Dockerfile)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/Storage-SQLite-003B57.svg?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)

<br />

<!-- Hero Showcase Image -->
<img src="docs/assets/en/01_dashboard_hero.png" alt="Quant Backtest Pro Main Workspace" width="100%" style="border-radius: 12px; box-shadow: 0 20px 50px rgba(0,0,0,0.5);" />

<br />

<p align="center">
  <a href="https://railway.com/new" target="_blank"><img src="docs/assets/marketing/deploy_railway.svg" height="34" alt="Deploy on Railway" /></a>
  &nbsp;
  <a href="https://render.com/deploy?repo=https://github.com/thieucong98/quant-backtest-pro" target="_blank"><img src="docs/assets/marketing/deploy_render.svg" height="34" alt="Deploy to Render" /></a>
  &nbsp;
  <a href="https://gitpod.io/#https://github.com/thieucong98/quant-backtest-pro" target="_blank"><img src="docs/assets/marketing/open_in_gitpod.svg" height="34" alt="Open in Gitpod" /></a>
  &nbsp;
  <a href="https://codespaces.new/thieucong98/quant-backtest-pro" target="_blank"><img src="docs/assets/marketing/open_in_codespaces.svg" height="34" alt="Open in GitHub Codespaces" /></a>
</p>

</div>

---

## 🌐 Language Navigation / Chuyển đổi ngôn ngữ
* 🇺🇸 **[English (Current)](README.md)**
* 🇻🇳 **[Tiếng Việt](README.vi.md)**

---

## 📖 Overview

**Quant Backtest Pro** is a modern, high-performance, open-source trading simulation and quantitative backtesting platform built for price-action traders, quantitative analysts, and algorithmic developers. 

It unifies **60 FPS ultra-smooth candlestick replay (even with 200,000+ candles)**, millisecond order matching, **AI-powered natural language strategy creation**, **SL/TP Multi-Variant Grid Optimization**, live **AI Bot Floating HUD**, **Data Import Manager 2.0 (with SQLite dataset persistence and multi-batch online crawler)**, and **instant multi-platform bot exportation** into a sleek, dark-themed institutional workspace.

<div align=center>
  <img src="docs/assets/marketing/quant_challenge_banner.svg" alt="Global Quant Challenge Tournament" width="100%" style="border-radius: 10px; margin: 15px 0;" />
</div>

### ⚔️ Quant Backtest Pro vs. Traditional Alternatives

| Feature / Capability | Quant Backtest Pro | TradingView Replay | MetaTrader 5 Strategy Tester | Python Backtesters (Backtrader / VectorBT) |
| :--- | :---: | :---: | :---: | :---: |
| **License & Cost** | **100% Free & Open-Source (MIT)** | $15–$60 / mo subscription | Closed-source desktop app | Free open-source Python |
| **Max Candlestick Depth** | **200,000+ M1 Candles (Local SQLite)** | 10k–20k bars capped | Disk storage limit (slow UI) | RAM limited, zero visual UI |
| **Replay Frame Rate & Latency** | **60 FPS ($O(1)$ Lightweight Charts)** | Capped at 5–10 FPS, cloud lag | Single-thread CPU freeze | No visual replay / static plots |
| **Natural Language AI Strategy Studio** | **Multi-LLM Prompt-to-Strategy Engine** | ❌ None | ❌ None | ❌ None |
| **Multi-Platform Bot Export** | **1-Click (MQL5, MQL4, Pine v5, CCXT, cBot)** | ❌ None (Pine Script only) | MQL5 only | Manual Python rewriting |
| **SL/TP Grid Heatmap Optimizer** | **Interactive 2D Matrix + Sparklines** | ❌ None | 2D/3D Optimization (Slow) | Matplotlib / Seaborn scripts |
| **Prop Firm Challenge Shield** | **FTMO / FundingPips Rules + Live HUD** | ❌ Manual alert scripts | ❌ Manual EAs required | ❌ Custom coding required |
| **Monte Carlo Risk-of-Ruin Engine** | **500+ Path Stochastic Simulation** | ❌ None | Basic report metrics | Manual NumPy scripts |
| **Live Broker Bridge** | **ZeroMQ / WebSocket to MT5 & CCXT** | Webhook alerts to 3rd-party | Native MT5 terminal | Custom API coding |

---

## 📸 Visual Showcase & Feature Highlights

### 1. ⚡ High-Performance 60 FPS Replay & Time-Travel Backtesting
Replay price action with sub-millisecond precision. Jump to any exact historical date and time or jump between dataset milestones (*Start / 50% Midpoint / Latest*) instantly using an optimized binary-search indexer.

<div align="center">
  <img src="docs/assets/en/04_time_travel_replay.png" alt="Time Travel Replay Bar" width="95%" style="border-radius: 10px; margin: 10px 0;" />
</div>

- **$O(1)$ Incremental Chart Rendering**: Sub-millisecond (`0.05ms`) candle updates on TradingView Lightweight Charts, eliminating canvas rebuilds and GC thrashing at high playback speeds (`10x` to `100x`).
- **Time-Travel Date-Time Picker**: Jump directly to specific historical market events (e.g. FOMC, CPI, NFP releases).
- **Multi-Timeframe Resampling**: Live resampling from raw M1 candles to M5, M15, M30, H1, H4, D1, W1, and MN.
- **Zero-Allocation Technical Indicators**: SMA, EMA, RSI, ATR, Bollinger Bands, and MACD compute dynamically over effective lengths without memory overhead.

---

### 2. 📥 Data Import Manager 2.0 & SQLite Dataset Library
Never search or re-upload your historical data again. Automatically persist every imported CSV or crawled feed into an integrated local SQLite database.

<div align="center">
  <img src="docs/assets/en/02_data_import_library.png" alt="SQLite Dataset Library Grid" width="48%" style="border-radius: 10px; margin-right: 2%;" />
  <img src="docs/assets/en/03_online_crawler.png" alt="Multi-Batch Online Crawler" width="48%" style="border-radius: 10px;" />
</div>

- **1-Click Load Dataset Cards**: Instant 1-click loading from the Database card grid with asset badges, timeframe tags, candle counts, and date spans.
- **Multi-Batch Online Crawler (Up to 50,000 Candles)**: Paginated historical crawler supporting Crypto (Binance REST API), Spot Gold (XAUUSD), and Forex Major pairs (EURUSD, GBPUSD, USDJPY).
- **Date-Range Mode**: Fetch exact ranges (`From Date ➔ To Date`) with live progress tracking.
- **High-Speed Integer CSV Parser**: Parses **1.44 Million candles in < 3.8 seconds** with automatic delimiter detection (`;`, `,`, `\t`).

---

### 3. 🧠 AI Strategy Studio & Rule Breakdown Cards
Transform trading ideas described in plain natural language into fully backtestable, executable TypeScript strategy code.

<div align="center">
  <img src="docs/assets/en/05_ai_strategy_studio.png" alt="AI Strategy Studio" width="95%" style="border-radius: 10px; margin: 10px 0;" />
</div>

- **Natural Language to Code**: Type *"Fast EMA 9 crosses above EMA 21 with RSI < 70 filter, SL 15 pips, TP 30 pips"* and receive verified execution logic.
- **Strategy Rule Breakdown**: Automatically parses code logic into structured cards for **BUY Signals**, **SELL Signals**, and **Risk Parameters**.
- **Multi-LLM Connectors**: Connects to OpenAI (GPT-4o), Google Gemini, Anthropic Claude, DeepSeek, Local Ollama, and Custom Reverse Proxies.

---

### 4. 🔥 SL/TP Grid Search & 2D Sweet-Spot Profit Heatmap
Prevent curve-fitting and uncover truly robust parameter combinations with automated multi-variant batch simulations.

<div align="center">
  <img src="docs/assets/en/06_sltp_grid_optimizer.png" alt="SL/TP Grid Optimizer" width="95%" style="border-radius: 10px; margin: 10px 0;" />
</div>

- **2D Profit Heatmap Matrix**: Visually highlights profitable clusters (*Sweet Spots*) across Stop Loss and Take Profit parameter pairs.
- **SVG Mini Sparklines**: Real-time equity trajectory curves rendered inside leaderboard table cells.
- **Statistical Quality Filters**: 1-click filters for `Minimum Trades >= 5` and `Profitable Net PnL > 0`.
- **1-Click Parameter Injection**: Injects top-performing SL/TP values directly back into your live sandbox strategy.

---

### 5. 🤖 Multi-Platform Bot Exporter & Deployment Hub
Deploy backtested strategies directly to live brokerage and algorithmic trading platforms in seconds.

<div align="center">
  <img src="docs/assets/en/07_bot_exporter_hub.png" alt="Bot Exporter Hub" width="95%" style="border-radius: 10px; margin: 10px 0;" />
</div>

- **TradingView (Pine Script v5)**: Complete indicator script with automated webhook alert JSON payloads for 3Commas, Bybit, Binance, and PineConnector.
- **MetaTrader 5 (MQL5 EA)**: Production-ready `.mq5` Expert Advisor utilizing `CTrade` and automated lot sizing.
- **MetaTrader 4 (MQL4 EA)**: Standard `.mq4` Expert Advisor with `OrderSend()` and Magic Number tracking.
- **Python Algorithmic Bot (CCXT + Pandas-TA)**: Standalone 24/7 Python 3 script for automated crypto execution.
- **cTrader (C# cBot)**: Clean `.cs` robot for cTrader Automate.

---

### 6. 🛡️ Prop Firm Challenge Shield & Quantitative Analytics
Monitor compliance with prop firm challenge rules (FTMO, FundedNext, MFF) in real time, and audit performance using institutional Monte Carlo stress testing.

<div align="center">
  <img src="docs/assets/en/08_analytics_monte_carlo.png" alt="Analytics and Monte Carlo Simulation" width="95%" style="border-radius: 10px; margin: 10px 0;" />
</div>

- **Prop Firm Shield**: Set Max Daily Loss (e.g. 5%) and Max Total Drawdown (e.g. 10%) with real-time audio and visual circuit breakers.
- **Monte Carlo Stress Testing**: 500+ iterations randomized path simulation to calculate Risk-of-Ruin probabilities and confidence intervals.
- **PnL Calendar & Heatmap**: Visual breakdown of performance across trading sessions, weekdays, and months.
- **Session Comparison Matrix**: Compare multiple backtesting runs side-by-side (Sharpe Ratio, Profit Factor, Expectancy, Winrate).

<div align="center">
  <img src="docs/assets/marketing/prop_firm_shield_badge.svg" alt="Institutional Prop Firm Shield" width="60%" style="margin: 12px 0;" />
</div>

---

### 7. 🏆 Global Quant Backtest Challenge & Community Tournament
An open-source, reproducible algorithmic trading tournament with a seasonal **$50,000 USD prize pool**, sponsored funded accounts, and transparent on-chain/cryptographic seed verification.

<div align="center">
  <img src="docs/assets/marketing/quant_challenge_banner.svg" alt="Global Quant Backtest Challenge" width="100%" style="border-radius: 12px; margin: 15px 0;" />
</div>

- **Cryptographic Seed Verification**: Eliminates fake screenshots and curve-fitted claims. Every participant runs strategies against standardized SHA-256 dataset hashes with verified deterministic execution proofs.
- **Institutional Scoring Formula**: Balances Sharpe Ratio (35%), Sortino Ratio (25%), Calmar/Recovery Ratio (20%), and trade count statistical significance (10%) with anti-overfitting penalties.
- **Automated Discord & Telegram Bot**: Instant leaderboard synchronization via `/challenge submit` and headless CI re-verification.

---

## 🚀 Quickstart & Installation

You can run Quant Backtest Pro either with **Docker (Recommended for 1-click zero-config deployment)** or locally with **Node.js**.

---

### Option 1: 🐳 1-Click Startup with Docker Compose (Recommended)

#### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) or Docker Engine + Docker Compose

```bash
# 1. Clone the repository
git clone https://github.com/thieucong98/quant-backtest-pro.git
cd quant-backtest-pro

# 2. Build and start the application in background
docker compose up -d

# 3. View live logs
docker compose logs -f

# 4. Stop containers
docker compose down
```

Access the application in your browser:
- **Web Application & API**: `http://localhost:3001`
- **API Health Endpoint**: `http://localhost:3001/api/health`

> [!TIP]
> **Data Persistence**: All sessions, custom datasets, and closed trades are automatically persisted inside the Docker named volume `sqlite_data` (`/app/server/prisma`).

---

### Option 2: 🐳 Standalone Docker CLI

```bash
# Build the production Docker image
docker build -t quant-backtest-pro .

# Run the container with persistent SQLite volume mount
docker run -d -p 3001:3001 --name quant-backtest-pro -v quant_sqlite:/app/server/prisma quant-backtest-pro
```

---

### Option 3: 💻 Local Node.js Development Setup

#### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- [npm](https://www.npmjs.com/) (or `pnpm` / `yarn`)

```bash
# 1. Clone repository & install dependencies
git clone https://github.com/thieucong98/quant-backtest-pro.git
cd quant-backtest-pro
npm install

# 2. Start Full-Stack Environment (Frontend + Backend API)
# Option A: Single Unified Command (Concurrent terminal runner)
npm run dev:all

# Option B: Native Platform Launchers (Launches MT5 Gateway + API + Frontend)
# On Windows:
.\start_all.bat

# On Linux / macOS / WSL:
chmod +x start_all.sh && ./start_all.sh

# Or start services in separate terminals:
# Terminal 1: npm run dev
# Terminal 2: npm run server:start
```

Open your browser at:
- **Frontend UI**: `http://localhost:3111/`
- **Backend API Health**: `http://localhost:3001/api/health`

---

### 🔑 Default Institutional Account
- **Email**: `admin@quantbacktest.pro`
- **Password**: `QuantPro@2026`
- **Tier**: `INSTITUTIONAL` (All features, unlimited trades & multi-pair datasets unlocked)

---

## 🏗️ Architecture & Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend UI** | React 19, TypeScript 5.8 | Strictly typed UI components with zero runtime overhead |
| **Styling** | Tailwind CSS 3.4, Lucide Icons | Modern dark-mode interface with sleek Glassmorphism |
| **Charting Engine** | Lightweight Charts v4 | TradingView's high-speed canvas charting ($O(1)$ update pipeline) |
| **State Management**| Zustand 5 | Low-overhead reactive state with throttled persistence |
| **Backend & Storage**| Node.js Express + Prisma + SQLite | Local database for sessions, trades, strategies, and datasets |
| **Quant Engines** | Custom TypeScript Quant Engines | Order matching engine (OMS), resampler, technical indicators, Monte Carlo |
| **Data Parser** | Fast Integer CSV Parser | Sub-4s parsing for 1.44M OHLCV bars with auto-delimiter detection |
| **AI Integration** | Fetch API + OpenAI standard | Multi-LLM strategy generator, SL/TP optimizer, and code transpilers |

---

## 🔬 Quantitative Research & Engineering Deep Dives

Read our high-impact engineering teardowns and mathematical publications:

1. 📄 **[Why 90% of Backtests Lie: Building an O(1) Replay Engine with Millisecond Precision](docs/marketing/articles/01_why_90_percent_of_backtests_lie.md)**  
   *Deconstructing the intrabar tick ambiguity fallacy, zero-slippage illusions, and the 460x performance leap of O(1) canvas series updates.*
2. 📄 **[Inside the AI Strategy Studio: From Natural Language Prompts to Production MQL5 and Pine Script](docs/marketing/articles/02_inside_the_ai_strategy_studio.md)**  
   *Eliminating LLM hallucinations with structured JSON AST validation, client-side simulation sandboxes, and multi-target transpilation.*
3. 📄 **[Mastering the Prop Firm Gauntlet: Algorithmic Drawdown Shields & Real-Time Trailing Stop-Loss Architecture](docs/marketing/articles/03_mastering_the_prop_firm_gauntlet.md)**  
   *The mathematics of the trailing high-water mark drawdown trap and how 1,000-run Monte Carlo simulations compute exact probability of ruin.*

---

## 📈 Institutional Growth Engine & Open-Core Ecosystem

QuantBacktest Pro is engineered for developer-led growth (PLG) and enterprise institutional adoption:

<div align=center>
  <img src="docs/assets/marketing/gtm_growth_flywheel.svg" alt="Institutional GTM Growth Flywheel" width="85%" style="border-radius: 10px; margin: 15px 0;" />
</div>

- 🚀 **[Open-Source Growth Engine & Developer-Led GTM Playbook](docs/marketing/GTM_GROWTH_ENGINE_PLAYBOOK.md)**: 60-day roadmap, Hacker News Show HN playbook, and viral community mechanics.
- 📅 **[Launch Calendar & Asset Specifications](docs/marketing/LAUNCH_CALENDAR_AND_ASSET_SPECS.md)**: Master timeline, Cyber-Quant visual identity tokens, and media dimensions.
- 🏆 **[Global Quant Backtest Challenge Playbook](docs/marketing/QUANT_CHALLENGE_PLAYBOOK.md)**: Tournament rules, institutional composite scoring, and cryptographic verification bot.
- 🏢 **[Prop Firm Institutional Guide & White-Label Overview](docs/marketing/PROP_FIRM_INSTITUTIONAL_GUIDE.md)**: Turnkey evaluation portals, MT5 broker bridges, and enterprise compliance SLAs.

---

## 📚 Documentation Index

| English Documentation | Vietnamese Documentation (Tiếng Việt) |
| :--- | :--- |
| 📘 [User Guide](docs/USER_GUIDE.md) | 📘 [Hướng dẫn sử dụng](docs/vi/USER_GUIDE.md) |
| 📋 [Feature Catalog & QA Checklist](docs/FEATURE_CATALOG_CHECKLIST.md) | 📋 [Danh mục tính năng & QA Checklist](docs/vi/FEATURE_CATALOG_CHECKLIST.md) |
| 🛠️ [Developer Guide](docs/DEVELOPER_GUIDE.md) | 🛠️ [Tài liệu lập trình viên](docs/vi/DEVELOPER_GUIDE.md) |
| 🏛️ [System Architecture](docs/ARCHITECTURE.md) | 🏛️ [Kiến trúc hệ thống](docs/vi/ARCHITECTURE.md) |
| 🤖 [Strategy Bot Exporter Guide](docs/STRATEGY_BOT_EXPORTER.md) | 🤖 [Hướng dẫn xuất Bot giao dịch](docs/vi/STRATEGY_BOT_EXPORTER.md) |
| 🔌 [API Reference](docs/API_REFERENCE.md) | 🔌 [Tài liệu API RESTful](docs/vi/API_REFERENCE.md) |
| 🔐 [OAuth & Auth Setup Guide](docs/OAUTH_SETUP_GUIDE.md) | 🔐 [Hướng dẫn cấu hình OAuth & Đăng nhập](docs/vi/OAUTH_SETUP_GUIDE.md) |
| 🚀 [GTM Growth Playbook](docs/marketing/GTM_GROWTH_ENGINE_PLAYBOOK.md) | 🚀 [Cẩm nang Tăng trưởng GTM](docs/marketing/vi/GTM_GROWTH_ENGINE_PLAYBOOK.md) |
| 📅 [Launch Calendar & Asset Specs](docs/marketing/LAUNCH_CALENDAR_AND_ASSET_SPECS.md) | 📅 [Lịch trình Ra mắt & Thiết kế](docs/marketing/vi/LAUNCH_CALENDAR_AND_ASSET_SPECS.md) |
| 🏆 [Quant Challenge Playbook](docs/marketing/QUANT_CHALLENGE_PLAYBOOK.md) | 🏆 [Thể lệ Giải đấu Quant](docs/marketing/vi/QUANT_CHALLENGE_PLAYBOOK.md) |
| 🏢 [Prop Firm Institutional Guide](docs/marketing/PROP_FIRM_INSTITUTIONAL_GUIDE.md) | 🏢 [Hướng dẫn Thể chế Quỹ Thi](docs/marketing/vi/PROP_FIRM_INSTITUTIONAL_GUIDE.md) |

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for more information.
