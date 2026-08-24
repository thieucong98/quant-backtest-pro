# 🗺️ Quant Backtest Pro Development Roadmap

This document outlines the strategic milestones and technical roadmap for **Quant Backtest Pro**, charting our evolution from an ultra-fast candlestick replay engine into an institutional-grade quantitative research, automated backtesting, and multi-platform bot deployment platform.

---

## 🌟 Releases & Milestones

```
  v1.0 (Core Engine)       v1.1 (AI & Optimization)      v1.2 (Quant Realism)       v2.0 (Institutional Ecosystem)
  ───────────────────     ─────────────────────────     ────────────────────       ──────────────────────────────
  ✓ 60 FPS Replay         ✓ AI Strategy Studio          ✓ Dynamic Slippage Model   • Dual-Chart Multi-Timeframe
  ✓ Order Matching Engine ✓ SL/TP 2D Profit Heatmap     ✓ Overnight Swap Rates     • Multi-Symbol Portfolio
  ✓ Prop Firm Shield      ✓ Multi-Platform Exporters    ✓ Sortino, Calmar & SQN    • Walk-Forward Analysis (WFA)
  ✓ SQLite Persistence    ✓ Multi-Batch REST Crawler    ✓ In-Sample / OOS Split    • Quant Tearsheet PDF Export
  ✓ CSV 1.44M Parser      ✓ SQLite Dataset Library      ✓ Docker 1-Click Package   • Webhook Live Trading Bridge
                          ✓ Time-Travel Replay Picker   ✓ Automated CI Test Gate
```

---

## ✅ v1.0 — Core Replay & Execution Foundation (Completed)
- [x] **High-Speed Replay Engine**: Sub-millisecond $O(1)$ series updates on TradingView Lightweight Charts supporting 200,000+ candles at 60 FPS.
- [x] **Realistic Order Matching System (OMS)**: Market, Limit, Stop orders with real Ask/Bid spread accounting and leverage margin checks.
- [x] **Prop Firm Challenge Shield**: Real-time monitoring of Daily Loss limits (5%) and Max Drawdown (10%) with visual/audio violation circuit breakers.
- [x] **Session Persistence**: Automatic saving of backtest sessions, equity points, open/closed trades, and chart drawings into SQLite.
- [x] **Fast Integer CSV Parser**: Sub-4s parsing of 1.44 Million candles with automatic delimiter and timestamp detection.

---

## ✅ v1.1 — AI Strategy Generation & Optimization (Completed)
- [x] **AI Strategy Studio**: Natural Language to executable TypeScript strategy code with structured **Rule Breakdown Cards** (BUY/SELL/Risk parameters).
- [x] **SL/TP Multi-Variant Grid Optimizer**: Automated parameter sweep with **2D Sweet-Spot Profit Heatmaps** and mini SVG sparklines in leaderboard cells.
- [x] **AI Bot Live Floating HUD**: High-tech workspace widget displaying live bot metrics, active trade count, and instant pause/resume controls.
- [x] **Data Import Manager 2.0**: Integrated **SQLite Dataset Library** with 1-click loading and pre-seeded institutional datasets for Gold, Forex, and Crypto.
- [x] **Multi-Batch Online REST Crawler**: Paginated fetching up to 50,000 candles or custom date ranges for Binance Crypto, XAUUSD, and Forex majors.
- [x] **Time-Travel Replay Bar**: Interactive popup with calendar picker and quick shortcuts (⏪ Start, 📍 50% Midpoint, ⏩ Latest).
- [x] **Multi-Platform Bot Exporter**: 1-click code generation for Pine Script v5, MetaTrader 5 (MQL5), MetaTrader 4 (MQL4), Python CCXT, and cTrader C#.

---

## 🚀 v1.2 — Institutional Realism & DevOps Standardization (Current Target)
- [x] **Dynamic Slippage Model**: Simulation of market execution slippage (fixed, random, and volatility-adaptive during news events).
- [x] **Overnight Swap & Financing Rates**: Accurate holding fee deductions when positions span across `00:00 UTC`.
- [x] **Advanced Quant Performance Metrics**:
  - **Sortino Ratio**: Downside deviation risk-adjusted return.
  - **Calmar Ratio**: Annualized return (CAGR) relative to Max Drawdown.
  - **System Quality Number (SQN - Van Tharp)**: Mathematical system reliability score with qualitative badges.
  - **Consecutive Streak Analytics**: Maximum winning/losing runs and average trade duration.
- [x] **In-Sample / Out-of-Sample (OOS) Validation**: Train/Test split (e.g. 70/30) in the SL/TP optimizer to compute **Efficiency Index** and detect overfitting.
- [x] **Docker 1-Click Containerization**: Multi-stage `Dockerfile` and `docker-compose.yml` for zero-configuration startup.
- [x] **Automated CI Test Gate**: Comprehensive 90+ test suite running on every commit/PR via GitHub Actions.
- [x] **Cleaned Dataset CSV Export**: 1-click download of sanitized historical datasets from the Database Library.

---

## 🔮 v2.0 — Multi-Chart & Institutional Ecosystem (Future Vision)
- [ ] **Synchronized Dual-Chart Multi-Timeframe Replay**: Side-by-side synchronized charts (e.g. H4 macro trend + M5 entry replay) on a unified playback scrubber.
- [ ] **Multi-Symbol Portfolio Backtesting**: Simultaneous execution across a basket of correlated pairs (e.g. EURUSD + GBPUSD + USDJPY) with portfolio equity curves.
- [ ] **Walk-Forward Analysis (WFA) Rolling Windows**: Automated rolling optimization and forward testing across multi-year data.
- [ ] **Quant Tearsheet PDF & HTML Report Generator**: 1-click export of comprehensive tear sheets with embedded charts for investor presentations.
- [ ] **Webhook & Broker Live Execution Bridge**: Direct paper-trading and live order dispatch to Interactive Brokers, Binance, and MetaTrader via local Webhook daemon.

---

## 🤝 Contributing to the Roadmap
We welcome community feature requests and architectural proposals! Please feel free to open a [Feature Request Issue](https://github.com/thieucong98/quant-backtest-pro/issues/new/choose) or start a discussion.
