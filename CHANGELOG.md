# 📋 Changelog

All notable changes to **Quant Backtest Pro** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [v2.0.0] - 2026-10-04

### 🚀 Major Breakthrough: Apex AI Copilot 2.0 & Smart Money Concepts (SMC) Engine
- **In-HUD AI Gateway & Model Settings (`⚙️`)**:
  - Embedded configuration card directly in the HUD header without leaving the chart canvas.
  - Multi-provider support: `Custom Gateway / Reverse Proxy`, `OpenAI`, `Google Gemini`, `DeepSeek`, `Ollama` local LLMs.
  - Live **Test Ping** button sends a lightweight probe to `/api/copilot/ping` returning real-time round-trip latency (ms) or clear error diagnostics.
  - Direct configuration saving with dynamic `quant_llm_config_changed` broadcast, updating engine badges instantly without page reload.
- **Smart Endpoint Auto-Normalization**:
  - Automatically detects and normalizes user-entered URLs (plain hosts, `/v1`, or `/chat/completions`) avoiding path duplication 404 errors.
- **Dual Delivery Resilience Engine**:
  - Seamlessly attempts SSE streaming (`stream: true`) first.
  - Automatically retries via standard Non-Streaming request (`stream: false`) if the gateway rejects streaming or lacks SSE support.
  - Streams clear diagnostic notices to the HUD if upstream gateways encounter authorization or network failures before gracefully falling back to local SMC.
- **Dynamic Risk-to-Reward (R:R) NLP Parser**:
  - Mathematical entity extraction supporting natural language prompts in Vietnamese and English (e.g. `"Rủi ro / Lợi nhuận? tôi muốn tỉ lệ lợi nhuận là 1:3"`, `"R:R 1:4"`, `"SL 15 pip, TP 60 pip"`).
  - Automatically calibrates Stop Loss and Take Profit levels mathematically to satisfy the requested ratio.
- **One-Click R:R Preset Chips & Prompt Engineering Guide**:
  - Quick chips (`[🎯 R:R 1:3]`, `[🎯 R:R 1:2]`, `[🎯 R:R 1:4]`) for instant analysis.
  - Interactive prompt guide `(?)` popover detailing syntax tips for R:R, SL/TP, and SMC bias.
- **Active Inference Engine Telemetry Badge**:
  - Visual status indicator in the HUD header displaying active engine (`[⚡ SMC Algorithm]` or `[🧠 Model]`) with explanatory tooltip.

### 🌐 Port 3111 Standardization & Security Infrastructure
- Standardized frontend development and preview port to **3111** across Vite, Express backend CORS policies, Cloudflare Tunnel configuration, MT5 gateway CORS, and shell launchers (`start_all.bat`, `start_all.sh`).
- Enhanced CORS isolation and origin security.

### 💎 5 Breakthrough Upgrades Suite (v2.2)
- **Real-Time SSE Streaming Strategy Generator**: Token-by-token code generation with speed telemetry and interactive `<think>` Chain-of-Thought terminal.
- **Visual Block Strategy Builder**: No-code visual rule block composer compiling bidirectionally to/from sandbox JavaScript code.
- **AI Trade Post-Mortem & Autopsy**: Forensic trade diagnosis with 0-100 Discipline score and 5 root cause classifications.
- **1,000-Path Monte Carlo Prop Firm Pass Probability**: Bootstrap simulation stress-testing funded challenge rules (10% profit, 5% daily loss).
- **Multi-Channel Webhook Dispatcher**: Instant execution notifications to Telegram Bot API and Discord Webhooks with chart canvas attachments.

### 🧪 Verification & Quality Gates
- **249 / 249 Automated Tests Passing (100%)**
- 100% Internationalization parity across 4 locales (`vi`, `en`, `ja`, `zh`) with zero hardcoded strings.
- Full bilingual tactical guides published: `docs/APEX_AI_COPILOT_GUIDE.md` & `docs/vi/APEX_AI_COPILOT_GUIDE.md`.

### 🎯 Universal Dialog & Modal Dismissal (Universal `X` Close Buttons)
- Comprehensive audit and enhancement across all application modals, drawers, and context popups (`PriceScaleContextMenu`, `AICopilotHUD`, `SessionManagerModal`, `ShortcutsModal`, `VisualStrategyBuilderModal`, `SignalWebhookSettingsTab`, etc.).
- Enforced accessible top-right close buttons (`X`) with standard aria-labels and keyboard Escape listeners.

### ⚡ Strategy Grid Optimizer & Robustness Engine
- **Strategy Parameter Preservation**: Preserves user-defined custom parameters (e.g. `riskPercent`, `period`, `lookback`) during parameter sweep, replacing only targeted SL/TP values.
- **Dual MACD Indicator Parity**: Seamlessly supports both `macd.hist` and `macd.histogram` property representations across visual blocks and programmatic scripts.
- **Dataset Resiliency Fallback**: Automatic multi-symbol fallback dataset selection preventing empty candle zero-trade states during grid search.

### 🛡️ AppSec Hardening & Architectural Consolidation
- **SSRF Protection in Copilot Gateway**: Strict URL validation blocking link-local/cloud metadata addresses (`169.254.169.254`, `metadata.google.internal`) and requiring valid HTTP/HTTPS schemes.
- **Strict Authentication Guard**: Enforced `401 Unauthorized` responses in `requireAuth` when credentials are absent or invalid across all environments.
- **Cryptographic JWT Secret Fallback**: Ephemeral key generation with `crypto.randomBytes(32)` when `JWT_SECRET` is unset.
- **Sandbox Security Consolidation (DRY)**: Reused `SANDBOX_SECURITY_PREAMBLE` across sandbox execution and strategy optimizer, eliminating redundant security preamble declarations.
- **Mandatory Git Flow Fetch & Rebase Discipline**: Documented strict fetch-first rule in `AGENTS.md`.

---

## [v1.3.0] - 2026-09-10

### 📱 Comprehensive Mobile UI/UX Overhaul
- **Mobile Header & Slide-Over Drawer**: Responsive navigation, quick timeframe dropdown, and account stats.
- **Quick Trade Dock Touch Cards**: Responsive touch controls, lot stepper, and direct SL/TP inputs.
- **Time-Travel Replay Bar**: Two-tier mobile layout with scrubber slider and date jump dialog.
- **OMS Responsive Table / Card View**: Automatic cards transformation on mobile screens.

### 🛡️ Institutional Authentication & Security
- Zero-friction guest sandbox mode with unauthenticated session handling.
- Auth-gated cloud services: Session Manager, Advanced Heatmap, Tunnel, and Live MT5 Bridge.

---

## [v1.2.0] - 2026-08-24

### 🐳 1-Click Docker Containerization & Out-of-Sample Testing
- Production multi-stage Dockerfile and `docker-compose.yml` with SQLite volume persistence.
- Institutional quantitative metrics: Sortino Ratio, Calmar Ratio, and Van Tharp System Quality Number (SQN).
- Dynamic slippage simulation and overnight swap rate deductions.
- Train/Test Split (70% In-Sample / 30% Out-of-Sample) walk-forward validation in SL/TP Grid Optimizer.
- Multi-batch online crawler with paginated fetching up to 50,000 candles.

---

## [v1.1.0] - 2026-08-23

### ⚡ AI Strategy Optimizer & Replay Engine 2.0
- SL/TP Multi-Variant Grid Optimizer with 2D profit heatmap.
- 60 FPS Canvas replay engine with $O(1)$ series updates.
- Data Import Manager 2.0 with fast CSV parsing and SQLite dataset library.

---

## [v1.0.0] - 2026-08-23

### 🎉 Quant Backtest Pro Official Launch
- High-speed historical candlestick replay (`0.1x` to `50x`).
- Multi-timeframe resampling (M1 to Monthly).
- Realistic order matching engine (Market, Limit, Stop, Slippage, Spread).
- AI Strategy Studio & Multi-LLM Copilot.
- Multi-platform bot exporter (Pine Script v5, MQL5 EA, MQL4 EA, Python CCXT, cTrader C#).
- Prop Firm challenge drawdown shields.
