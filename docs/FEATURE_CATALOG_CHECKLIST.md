# 📋 QuantBacktest Pro - System Feature Catalog & QA Checklist

> **Comprehensive Technical Catalog, UI Navigation Map, Source Code Registry, and QA Acceptance Checklist**  
> *Target Audience: End-User Traders, System Developers, and QA/Testing Engineers*  
> *Language: English (Primary Open-Source Edition) | [Bản Tiếng Việt](docs/vi/FEATURE_CATALOG_CHECKLIST.md)*

---

## 🎯 Executive Summary & Navigation Index

This document provides a single source of truth for all **63 features across 10 core architectural modules** in **QuantBacktest Pro**.

| Module Code | Module Name | Features Count | Primary Source Components |
| :--- | :--- | :---: | :--- |
| **`F-HDR`** | [1. Workspace Header & Global Controls](#1-workspace-header--global-controls-f-hdr) | 8 | `src/components/header/Header.tsx`, `src/components/header/SymbolSearchModal.tsx` |
| **`F-CHT`** | [2. Interactive Candlestick Charting & Price Scale Tools](#2-interactive-candlestick-charting--price-scale-tools-f-cht) | 7 | `src/components/chart/TradingViewChart.tsx`, `src/components/chart/VisualChartTradingOverlay.tsx`, `src/components/chart/PriceScaleContextMenu.tsx` |
| **`F-RPL`** | [3. Time-Travel Candlestick Replay Engine](#3-time-travel-candlestick-replay-engine-f-rpl) | 4 | `src/components/replay/ReplayBar.tsx`, `src/engine/resampler.ts` |
| **`F-OMS`** | [4. Order Management System (OMS) & Execution Dock](#4-order-management-system-oms--execution-dock-f-oms) | 9 | `src/components/chart/QuickTradeDock.tsx`, `src/components/panels/OrderEntryModal.tsx`, `src/components/panels/PositionsTable.tsx` |
| **`F-DAT`** | [5. Data Import Manager 2.0 & SQLite Persistence](#5-data-import-manager-20--sqlite-persistence-f-dat) | 5 | `src/components/panels/DataImportModal.tsx`, `src/engine/csvParser.ts`, `src/engine/dataCrawler.ts` |
| **`F-STR`** | [6. AI Strategy Studio, Optimizer & Bot Exporter Hub](#6-ai-strategy-studio-optimizer--bot-exporter-hub-f-str) | 14 | `src/components/panels/AIStrategyModal.tsx`, `src/engine/strategyOptimizer.ts`, `src/engine/strategyExporter.ts` |
| **`F-ANL`** | [7. Institutional Analytics & Monte Carlo Risk Engine](#7-institutional-analytics--monte-carlo-risk-engine-f-anl) | 5 | `src/components/panels/AnalyticsDashboardModal.tsx`, `src/engine/analytics.ts` |
| **`F-SYS`** | [8. Live MT5 Broker, Cloud Tunnel & System Infrastructure](#8-live-mt5-broker-cloud-tunnel--system-infrastructure-f-sys) | 6 | `src/components/panels/BrokerConnectionModal.tsx`, `src/components/panels/TunnelModal.tsx`, `src/components/panels/SessionManagerModal.tsx` |
| **`F-SMC`** | [9. Smart Money Concepts & AI Copilot Engine](#9-smart-money-concepts--ai-copilot-engine-f-smc) | 10 | `src/engine/smc/smcEngine.ts`, `src/components/chart/AICopilotHUD.tsx`, `src/security/aesVault.ts` |
| **`F-BRK`** | [10. 5 Breakthrough Upgrades Suite (v2.2)](#10-5-breakthrough-upgrades-suite-v22-f-brk) | 5 | `src/engine/aiStreamingGenerator.ts`, `src/engine/visualBlockCompiler.ts`, `src/engine/aiTradeAutopsy.ts`, `src/engine/monteCarloEngine.ts`, `src/engine/signalWebhookDispatcher.ts` |

---

## 1. Workspace Header & Global Controls (`F-HDR`)

### Summary Table
| ID | Feature Technical Name | UI Display Name (EN / VI) | UI Navigation Path | Source Code Path |
| :--- | :--- | :--- | :--- | :--- |
| `F-HDR-01` | Symbol Search & Asset Picker | `Symbol Picker` / `Chọn Cặp Tiền` | Topbar Header ➔ Click Symbol Button (e.g. `XAUUSD`) | `src/components/header/SymbolSearchModal.tsx` |
| `F-HDR-02` | Multi-Timeframe Resampler | `Timeframe Pills (M1 - MN)` / `Khung Thời Gian` | Topbar Header ➔ Pill Group `[M1, M5, M15, M30, H1, H4, D1, W1, MN]` | `src/components/header/Header.tsx:L190`, `src/engine/resampler.ts` |
| `F-HDR-03` | Chart Type Switcher | `Candles / Heikin-Ashi` / `Nến Thường / Heikin-Ashi` | Topbar Header ➔ Chart Type Dropdown Icon | `src/components/header/Header.tsx:L240`, `src/components/chart/TradingViewChart.tsx` |
| `F-HDR-04` | Technical Indicators Popover | `Indicators` / `Chỉ Báo` | Topbar Header ➔ Button `Indicators [f(x)]` | `src/components/header/Header.tsx:L280`, `src/engine/indicators.ts` |
| `F-HDR-05` | Spread & Bid/Ask Price Display | `Spread: X.X pips (Ask/Bid)` / `Spread: X.X pips` | Topbar Header ➔ Spread Badge indicator | `src/components/header/Header.tsx:L340`, `src/components/chart/TradingViewChart.tsx` |
| `F-HDR-06` | Account Equity & Balance HUD | `Balance / Equity / Margin` / `Số Dư / Vốn / Ký Quỹ` | Topbar Header ➔ Metric Group & Reset Balance button | `src/components/header/Header.tsx:L370`, `src/store/backtestStore.ts` |
| `F-HDR-07` | Internationalization Switcher | `Language Menu (EN/VI/JA/ZH)` / `Chuyển Đổi Ngôn Ngữ` | Topbar Header ➔ Flag/Language dropdown | `src/components/header/Header.tsx:L450`, `src/i18n/` |
| `F-HDR-08` | User Profile & Auth Modal | `Login / Profile [Pro]` / `Đăng Nhập / Hồ Sơ` | Topbar Header ➔ Far Right Profile Button | `src/components/auth/AuthModal.tsx`, `src/components/auth/UserProfileModal.tsx` |

### Detailed Specification & QA Checklist

#### `F-HDR-01` - Symbol Search & Asset Picker
- **UI Navigation:** Click the active currency pair badge on the top-left of the header (Shortcut: click symbol name).
- **Functionality:** Search and switch between Forex Major/Minor pairs, Spot Metals (`XAUUSD`, `XAGUSD`), and Crypto (`BTCUSDT`, `ETHUSDT`). Instant filter by category.
- **QA Verification:**
  1. Click symbol badge -> Modal opens with instant input focus.
  2. Type `XAU` -> List filters to `XAUUSD (Gold Spot / US Dollar)`.
  3. Select `XAUUSD` -> Chart recalculates pip scale, spread, and redraws candles immediately.

#### `F-HDR-02` - Multi-Timeframe Resampler
- **UI Navigation:** Click any timeframe pill in the header toolbar (`M1`, `M5`, `M15`, `M30`, `H1`, `H4`, `D1`, `W1`, `MN`).
- **Functionality:** Dynamically resamples base tick/M1 candlestick stream into higher timeframes with $O(N)$ efficiency. Computes accurate OHLCV metrics.
- **QA Verification:**
  1. Switch from `M1` to `M15` -> Verify 15 M1 bars condense into 1 bar.
  2. Invariant test: Confirm candle `High` is highest high and `Low` is lowest low.

#### `F-HDR-03` - Chart Type Switcher (Candles vs Heikin-Ashi)
- **UI Navigation:** Click the Candlestick icon dropdown in the header toolbar -> Select `Candles` or `Heikin Ashi`.
- **Functionality:** Computes smoothed Heikin-Ashi formula (`haClose = (O+H+L+C)/4`, `haOpen = (prevO+prevC)/2`).
- **QA Verification:**
  1. Select `Heikin Ashi` -> Candlestick bars transform with smoothed trend colors.
  2. Select `Candles` -> Instant revert to standard price bars.

#### `F-HDR-04` - Technical Indicators Popover Manager
- **UI Navigation:** Click `Indicators` button in the header toolbar.
- **Functionality:** Toggle and customize indicators: SMA (Fast/Slow), EMA (9, 21, 50, 200), RSI (14), MACD (12, 26, 9), Bollinger Bands (20, 2), and ATR (14).
- **QA Verification:**
  1. Open popover -> Check `EMA 9` and `RSI 14`.
  2. Verify EMA line renders on main chart and RSI pane renders below main chart.

#### `F-HDR-05` - Live Spread & Bid/Ask Price Display
- **UI Navigation:** Visible in the header middle-left section. Click to configure spread pips.
- **Functionality:** Real-time calculation of Ask price (`Ask = Bid + Spread * PipSize`) and active spread in pips.
- **QA Verification:**
  1. Change spread from `1.5` to `3.0` pips -> Verify Ask line on chart shifts upward by 1.5 pips.

#### `F-HDR-06` - Account Equity & Capital Balance HUD
- **UI Navigation:** Header center right. Displays Balance, Equity, Used Margin, Free Margin, and Margin Level.
- **Functionality:** Dynamically recalculates floating PnL with leverage (1:1 to 1:500). Includes a 1-click Reset Balance button.
- **QA Verification:**
  1. Open position -> Confirm Equity fluctuates with tick price.
  2. Click `Reset Balance` -> Restores initial $10,000 balance and closes all active trades.

#### `F-HDR-07` - Internationalization Language Switcher
- **UI Navigation:** Header top-right globe dropdown. Select `Tiếng Việt`, `English`, `日本語`, or `中文`.
- **Functionality:** 100% Locale Parity across all 4 languages with zero hardcoded string fallbacks.
- **QA Verification:**
  1. Select `Tiếng Việt` -> All menus, buttons, and tables switch to Vietnamese.
  2. Select `English` -> Instant parity switch without page reload.

#### `F-HDR-08` - User Profile & Institutional Authentication
- **UI Navigation:** Click user avatar or `Login` / `Profile` button on the far right of the header.
- **Functionality:** Supports login/registration with JWT authentication, role verification (`INSTITUTIONAL`), resilient offline/demo fallback mode with zero network error blocking, and profile settings.
- **QA Verification:**
  1. Log in with `admin@quantbacktest.pro` or click 1-Click "Enter Now" (Vào Ngay) default card -> Instant login with `INSTITUTIONAL` session and full profile badge.
  2. Test in offline / standalone mode -> Seamless fallback without blocking network error banners.

---

## 2. Interactive Candlestick Charting & Price Scale Tools (`F-CHT`)

### Summary Table
| ID | Feature Technical Name | UI Display Name (EN / VI) | UI Navigation Path | Source Code Path |
| :--- | :--- | :--- | :--- | :--- |
| `F-CHT-01` | Canvas Charting Engine (60 FPS) | `TradingView Canvas` / `Biểu Đồ Canvas TradingView` | Main Workspace Canvas Area | `src/components/chart/TradingViewChart.tsx` |
| `F-CHT-02` | Visual SL/TP Drag Overlay | `Drag SL/TP Lines` / `Kéo Thả Đường SL/TP` | Click open position line on chart ➔ Drag handles | `src/components/chart/VisualChartTradingOverlay.tsx` |
| `F-CHT-03` | Price Axis Direct (+) Order Button | `(+) Limit/Stop Order Button` / `Nút (+) Đặt Lệnh Trực Tiếp` | Hover mouse over right price axis ➔ Click `(+)` | `src/components/chart/TradingViewChart.tsx:L820` |
| `F-CHT-04` | Price Scale Context Menu | `Price Scale Options` / `Menu Trục Giá Chuột Phải` | Right-click on right price axis | `src/components/chart/PriceScaleContextMenu.tsx` |
| `F-CHT-05` | Vector Drawing Tools Canvas | `Drawing Toolbar` / `Thanh Công Cụ Vẽ Kỹ Thuật` | Left floating toolbar on chart | `src/components/chart/DrawingCanvas.tsx` |
| `F-CHT-06` | Session High/Low & Period Separators | `High/Low Lines & Separators` / `Đường Đỉnh/Đáy & Phân Cách Ngày` | Auto-rendered on chart canvas / Chart settings | `src/components/chart/TradingViewChart.tsx:L450` |
| `F-CHT-07` | Prop Firm Challenge Shield HUD | `Prop Firm Shield HUD` / `Lá Chắn Thi Quỹ Prop Firm` | Top-right floating overlay on chart canvas | `src/components/chart/PropFirmHUD.tsx`, `src/store/slices/createPropFirmSlice.ts` |

### Detailed Specification & QA Checklist

#### `F-CHT-01` - Canvas Charting Engine (60 FPS)
- **UI Navigation:** Main center viewport. Mouse drag to pan, scroll wheel to zoom.
- **Functionality:** Lightweight Charts v4 canvas rendering. $O(1)$ series updates under 0.05ms per tick candle.
- **QA Verification:** Zoom in/out with 50,000 candles loaded -> 60 FPS smooth rendering without canvas redraw stutter.

#### `F-CHT-02` - Visual SL/TP Drag Overlay
- **UI Navigation:** Open any Market or Limit order -> Click and drag the red SL or green TP dashed line directly on the chart canvas.
- **Functionality:** Real-time drag modification of Stop Loss and Take Profit with pip distance and dollar risk preview.
- **QA Verification:** Drag SL line 20 pips away -> Release mouse -> Positions table updates SL price immediately.

#### `F-CHT-03` - Price Axis Direct (+) Order Button
- **UI Navigation:** Hover the mouse cursor over the right-side price scale -> Blue `(+)` button appears following mouse Y coordinate -> Click `(+)`.
- **Functionality:** Directly spawns a Limit or Stop order at the exact clicked price level with pre-filled entry.
- **QA Verification:** Click `(+)` at price 2650.0 -> Order modal pre-fills with Limit/Stop at 2650.0.

#### `F-CHT-04` - Price Scale Context Menu
- **UI Navigation:** Right-click anywhere on the right price scale axis.
- **Functionality:** Context menu offering: `Auto (Fit Data)`, `Percentage Scale`, `Logarithmic Scale`, `Countdown to Bar Close`, and `Reset Price Scale`.
- **QA Verification:** Select `Logarithmic Scale` -> Price axis scale converts to logarithmic progression.

#### `F-CHT-05` - Vector Drawing Tools Canvas
- **UI Navigation:** Left-side floating drawing toolbar.
- **Functionality:** Tools: Cursor/Crosshair, Trendline, Horizontal Line, Ray, Rectangle Box, Fibonacci Retracement, and Clear All Drawings.
- **QA Verification:** Select `Fibonacci Retracement` -> Drag between swing low and swing high -> Levels (0.382, 0.5, 0.618, 1.0) render accurately.

#### `F-CHT-06` - Session High/Low & Period Separators
- **UI Navigation:** Rendered automatically across historical session boundaries.
- **Functionality:** Displays vertical dotted lines at 00:00 UTC day boundaries and horizontal dotted lines marking session Highest High and Lowest Low.
- **QA Verification:** Verify midnight boundaries correctly align with UTC day changes.

#### `F-CHT-07` - Prop Firm Challenge Shield HUD
- **UI Navigation:** Floating card at top-right of chart. Click gear icon to configure limits.
- **Functionality:** Real-time tracking of Max Daily Drawdown (default 5%) and Max Total Drawdown (default 10%). Audio circuit breaker fires on violation.
- **QA Verification:** Trigger a simulated 5.1% loss -> HUD turns red with warning alert and disables execution.

---

## 3. Time-Travel Candlestick Replay Engine (`F-RPL`)

### Summary Table
| ID | Feature Technical Name | UI Display Name (EN / VI) | UI Navigation Path | Source Code Path |
| :--- | :--- | :--- | :--- | :--- |
| `F-RPL-01` | 60 FPS Candlestick Replay Controls | `Play / Pause / Step [F8]` / `Phát / Tạm Dừng / Từng Bước` | Bottom Floating Replay Bar ➔ Play, Pause, Step Buttons | `src/components/replay/ReplayBar.tsx` |
| `F-RPL-02` | Playback Speed Multiplier | `Speed Slider (0.1x - 100x)` / `Tốc Độ Tua` | Bottom Replay Bar ➔ Speed Preset Pills & Slider | `src/components/replay/ReplayBar.tsx:L120` |
| `F-RPL-03` | Milestone Time-Travel Jumps | `Start / Mid / Latest` / `Đầu / Giữa 50% / Mới Nhất` | Bottom Replay Bar ➔ Milestone Buttons `[0%, 50%, 100%]` | `src/components/replay/ReplayBar.tsx:L180` |
| `F-RPL-04` | Exact Date-Time Binary Search Jump | `Jump to Date/Time [Calendar]` / `Tua Đến Ngày Giờ` | Bottom Replay Bar ➔ Click Date-Time button ➔ Pick time ➔ `Jump` | `src/components/replay/ReplayBar.tsx:L220` |

### Detailed Specification & QA Checklist

#### `F-RPL-01` - 60 FPS Candlestick Replay Controls
- **UI Navigation:** Bottom floating bar. Buttons: `Play/Pause` (Space), `Step Forward` (F8 / Right Arrow), `Step Backward` (Left Arrow), `Reset`.
- **Functionality:** Step-by-step single candle stepping or continuous playback with order matching evaluation on each tick.
- **QA Verification:** Press Space -> Candles advance smoothly. Press F8 -> Advances exactly 1 candle.

#### `F-RPL-02` - Playback Speed Multiplier
- **UI Navigation:** Replay Bar speed control pills: `0.5x`, `1x`, `5x`, `10x`, `50x`, `100x`.
- **Functionality:** Adjusts replay tick interval between 1000ms down to 10ms.
- **QA Verification:** Select `100x` -> 100 candles stream per second with zero UI freeze.

#### `F-RPL-03` - Milestone Time-Travel Jumps
- **UI Navigation:** Replay Bar milestone shortcuts.
- **Functionality:** Instant binary search jump to the 1st candle (`Start`), 50% midpoint (`Mid`), or latest imported candle (`Latest`).
- **QA Verification:** Click `50%` -> Replay cursor positions exactly at dataset midpoint index.

#### `F-RPL-04` - Exact Date-Time Binary Search Jump
- **UI Navigation:** Click the Date-Time display badge on the replay bar -> Select Year, Month, Day, Hour, Minute -> Click `Jump`.
- **Functionality:** $O(\log N)$ binary search locates the closest historical candle and repositions chart in under 1ms.
- **QA Verification:** Pick historical date `2024-08-07 12:30` (NFP) -> Replay bar jumps directly to NFP candle.

---

## 4. Order Management System (OMS) & Execution Dock (`F-OMS`)

### Summary Table
| ID | Feature Technical Name | UI Display Name (EN / VI) | UI Navigation Path | Source Code Path |
| :--- | :--- | :--- | :--- | :--- |
| `F-OMS-01` | Quick Trade Floating Dock | `Quick Trade Dock` / `Bảng Lệnh Nhanh Quick Trade` | Floating Dock at Top-Left / Toggle via Header `Quick Trade` | `src/components/chart/QuickTradeDock.tsx` |
| `F-OMS-02` | Advanced Order Entry Modal | `Order Entry` / `Đặt Lệnh Nâng Cao` | Header ➔ Click `Order Entry` Button | `src/components/panels/OrderEntryModal.tsx`, `src/engine/patterns/OrderFactory.ts` |
| `F-OMS-03` | Open Positions Manager | `Open Positions Tab` / `Vị Thế Đang Mở` | Bottom Panel ➔ Tab `Positions` | `src/components/panels/PositionsTable.tsx:L120` |
| `F-OMS-04` | Pending Orders Manager | `Pending Orders Tab` / `Lệnh Chờ (Limit/Stop)` | Bottom Panel ➔ Tab `Pending Orders` | `src/components/panels/PositionsTable.tsx:L320` |
| `F-OMS-05` | Trade History & Audit Ledger | `Trade History Tab` / `Lịch Sử Giao Dịch` | Bottom Panel ➔ Tab `History` | `src/components/panels/PositionsTable.tsx:L450` |
| `F-OMS-06` | Strategy Bot Execution Logs | `Strategy Logs Tab` / `Nhật Ký Chiến Lược Bot` | Bottom Panel ➔ Tab `Strategy Logs` | `src/components/panels/PositionsTable.tsx:L580` |
| `F-OMS-07` | Authentic Economic Calendar | `Economic Calendar Tab` / `Lịch Kinh Tế` | Bottom Panel ➔ Tab `Calendar` | `src/components/panels/EconomicCalendarTab.tsx` |
| `F-OMS-08` | Market Watch Drawer | `Market Watch Drawer` / `Bảng Theo Dõi Giá` | Bottom Panel ➔ Tab `Market Watch` | `src/components/panels/MarketWatchDrawer.tsx` |
| `F-OMS-09` | Emergency "Close All Positions" | `Close All Button` / `Đóng Tất Cả Vị Thế` | Bottom Panel ➔ Red `Close All Positions` Button | `src/components/panels/PositionsTable.tsx:L85` |

### Detailed Specification & QA Checklist

#### `F-OMS-01` - Adaptive Quick Trade Execution Suite
- **UI Navigation:** Top-left floating panel (Desktop/Tablet) & Bottom-anchored execution bar (Mobile).
  - **Desktop/Tablet:** Ultra-compact 28px TradingView-style execution dock: `BUY` (Emerald), `LOT Stepper`, `SELL` (Rose), inline SL/TP toggle chips, and Risk/R:R Popover (`[⚖️]`). When collapsed, minimizes to atomic duo pill `[BUY Price | Lot | SELL Price]` retaining direct 1-click execution for both sides.
  - **Mobile (< 640px):** Dedicated thumb-friendly `MobileQuickTradeBar` anchored above Replay Bar: Large Emerald `BUY [Ask]` (42%), Center Lot Stepper (16%), Large Rose `SELL [Bid]` (42%), with live spread and auto SL/TP chips.
  - **Secondary Assistant Coordination:** `AssistantHubFlyout` consolidates Bot HUD, Copilot, MTF Matrix, and Prop Firm on screens < 2xl into a single `[✨ AI Assistants]` badge, guaranteeing zero overlap with trading execution.
- **Functionality:** 1-click execution with Ask/Bid spread calculation, auto SL/TP placement, on-demand risk parameters popover (lot presets, R:R multipliers 1:1.5 - 1:5, pip adjustments).
- **QA Verification:**
  1. Desktop: Place BUY/SELL with 1-click -> Orders execute immediately with visual SL/TP lines on chart canvas.
  2. Mobile (375px): Bottom execution bar displays large thumb targets for BUY/SELL/LOT with zero overlap from chart controls.
  3. Collapse test: Minimize top dock -> Mini duo pill preserves immediate 1-click BUY and SELL capability.

#### `F-OMS-02` - Advanced Order Entry Modal
- **UI Navigation:** Header `Order Entry` button.
- **Functionality:** Supports Market, Limit, and Stop orders. Calculates required margin, pip value, and leverage limit before placement via `OrderFactory`.
- **QA Verification:** Place Buy Limit below market price -> Position correctly queues in Pending Orders tab.

#### `F-OMS-03` - Open Positions Manager
- **UI Navigation:** Bottom panel -> `Positions` tab.
- **Functionality:** Columns: Symbol, Side, Lot, Entry, Current Price, SL, TP, Floating PnL. Actions:
  - `Set BE`: Sets Stop Loss to Entry + 1 pip.
  - `Close 50%`: Partials half the position lot size and realizes partial PnL.
  - `Edit SL/TP`: Inline price adjustment.
  - `Tag/Notes`: Assign strategy tag and psychological discipline notes.
- **QA Verification:** Click `Set BE` on profitable trade -> SL price updates to Entry + 0.1 pip.

#### `F-OMS-04` - Pending Orders Manager
- **UI Navigation:** Bottom panel -> `Pending Orders` tab.
- **Functionality:** View queued Limit and Stop orders. Cancel orders or modify execution price.
- **QA Verification:** Price reaches limit price during replay -> Order automatically fills and transitions to Open Positions.

#### `F-OMS-05` - Trade History & Audit Ledger
- **UI Navigation:** Bottom panel -> `History` tab.
- **Functionality:** Comprehensive trade log showing Open/Close times, Duration, Gross/Net PnL, Commission, and Exit Reason (`TP`, `SL`, or `Market`).
- **QA Verification:** Verify Net PnL matches Gross PnL minus Commission ($7/lot).

#### `F-OMS-06` - Strategy Bot Execution Logs
- **UI Navigation:** Bottom panel -> `Strategy Logs` tab.
- **Functionality:** Real-time log stream showing strategy execution events, signal conditions, buy/sell triggers, and errors.
- **QA Verification:** Run an automated strategy -> Verify signals stream into the table in real time.

#### `F-OMS-07` - Authentic Economic Calendar & Live Sync
- **UI Navigation:** Bottom panel -> `Calendar` tab.
- **Functionality:** Real-time macroeconomic news feed (NFP, CPI, FOMC, GDP, Interest Rate decisions) with impact filters (High, Medium, Low), currency filters, countdown timers, and newest-to-oldest sorting.
- **QA Verification:** Filter by `High Impact` & `USD` -> Table shows US CPI, NFP, and FOMC meetings with accurate historical timestamps.

#### `F-OMS-08` - Market Watch Drawer
- **UI Navigation:** Bottom panel -> `Market Watch` tab.
- **Functionality:** Watchlist of multi-asset instruments displaying live Bid, Ask, Spread, and daily percentage change.
- **QA Verification:** Click any row in Market Watch -> Chart switches active symbol.

#### `F-OMS-09` - Emergency "Close All Positions"
- **UI Navigation:** Red button in the top-right of the bottom panel table header.
- **Functionality:** Iterates through all open positions and executes market closes simultaneously.
- **QA Verification:** Open 3 active positions -> Click `Close All` -> All 3 positions close and record into History.

---

## 5. Data Import Manager 2.0 & SQLite Persistence (`F-DAT`)

### Summary Table
| ID | Feature Technical Name | UI Display Name (EN / VI) | UI Navigation Path | Source Code Path |
| :--- | :--- | :--- | :--- | :--- |
| `F-DAT-01` | High-Speed Integer CSV Parser | `Upload CSV File` / `Tải Lên File CSV` | Header ➔ `More Tools [•••]` ➔ `Data Manager` ➔ Tab `Upload` | `src/engine/csvParser.ts`, `src/components/panels/DataImportModal.tsx` |
| `F-DAT-02` | SQLite Dataset Library Grid | `Dataset Library` / `Thư Viện Dữ Liệu SQLite` | Header ➔ `More Tools [•••]` ➔ `Data Manager` ➔ Tab `Library` | `src/components/panels/DataImportModal.tsx:L250` |
| `F-DAT-03` | Multi-Batch Online Crawler | `Online Crawler` / `Thu Thập Trực Tuyến` | Header ➔ `More Tools [•••]` ➔ `Data Manager` ➔ Tab `Crawler` | `src/engine/dataCrawler.ts`, `src/components/panels/DataImportModal.tsx:L400` |
| `F-DAT-04` | Date-Range Crawl Mode | `Custom Date Range` / `Khoảng Ngày Tùy Chọn` | In Crawler Tab ➔ Toggle `Date Range Mode` | `src/components/panels/DataImportModal.tsx:L480` |
| `F-DAT-05` | Curated Kaggle Presets | `Kaggle Presets` / `Dữ Liệu Mẫu Kaggle` | In Data Modal ➔ Tab `Presets` | `src/components/panels/DataImportModal.tsx:L600` |

### Detailed Specification & QA Checklist

#### `F-DAT-01` - High-Speed Integer CSV Parser
- **UI Navigation:** Data Import Modal -> `Upload CSV` tab -> Drag and drop `.csv` file.
- **Functionality:** Custom ultra-fast integer parser parses 1.44M candles in <3.8s. Auto-detects delimiters (`,`, `;`, `\t`) and date formats (`YYYY.MM.DD`, `DD/MM/YYYY`).
- **QA Verification:** Upload a 70MB MT5 CSV file -> Progress bar completes in under 4 seconds with candle preview.

#### `F-DAT-02` - SQLite Dataset Library Grid
- **UI Navigation:** Data Import Modal -> `Library` tab.
- **Functionality:** Visual card grid of all datasets stored in SQLite. Cards show Symbol, Timeframe, Bar Count, Date Span, and 1-Click `Load to Chart` button.
- **QA Verification:** Click `Load` on any dataset card -> Chart updates with the dataset without re-uploading.

#### `F-DAT-03` - Multi-Batch Online Crawler
- **UI Navigation:** Data Import Modal -> `Online Crawler` tab -> Select Asset (Crypto, Gold, Forex) -> Choose bar count (1,000 to 50,000).
- **Functionality:** Automatically fetches paginated historical OHLCV candles from Binance REST API and spot market feeds.
- **QA Verification:** Request 5,000 candles of `BTCUSDT` -> Crawler loops through batches and saves dataset into SQLite.

#### `F-DAT-04` - Date-Range Crawl Mode
- **UI Navigation:** Crawler tab -> Select `From Date` and `To Date` -> Click `Fetch Range`.
- **Functionality:** Downloads exact date intervals with live percent progress and automated gap detection.
- **QA Verification:** Select previous month -> Confirms all trading days in month are populated.

#### `F-DAT-05` - Curated Kaggle Presets
- **UI Navigation:** Data Import Modal -> `Kaggle Presets` tab.
- **Functionality:** Instant 1-click loading of benchmark multi-year datasets for major symbols (`EURUSD`, `GBPUSD`, `XAUUSD`, `BTCUSDT`).
- **QA Verification:** Click `Load Gold 2024` -> Dataset loads onto chart in under 500ms.

---

## 6. AI Strategy Studio, Optimizer & Bot Exporter Hub (`F-STR`)

### Summary Table
| ID | Feature Technical Name | UI Display Name (EN / VI) | UI Navigation Path | Source Code Path |
| :--- | :--- | :--- | :--- | :--- |
| `F-STR-01` | Natural Language Strategy Transpiler | `AI Strategy Studio` / `Khởi Tạo Chiến Lược AI` | Header ➔ Click `AI Studio` Button | `src/components/panels/AIStrategyModal.tsx`, `src/engine/aiService.ts` |
| `F-STR-02` | Strategy Rule Breakdown Cards | `Rule Breakdown Cards` / `Thẻ Quy Tắc Vào Lệnh` | In AI Studio Modal ➔ Tab `Strategy` | `src/components/panels/AIStrategyModal.tsx:L320` |
| `F-STR-03` | Sandboxed Strategy Execution Engine | `Run Sandbox Backtest` / `Chạy Thử Chiến Lược` | In AI Studio Modal ➔ Click `Run Backtest` | `src/engine/strategySandbox.ts` |
| `F-STR-04` | Multi-LLM Provider Connectors | `AI Model Settings` / `Cấu Hình Mô Hình AI` | In AI Studio Modal ➔ Model Settings gear icon | `src/engine/aiService.ts:L80` |
| `F-STR-05` | Live AI Bot Floating HUD | `AI Bot HUD Overlay` / `Bảng Điều Khiển Bot Live` | Chart Canvas ➔ Floating AI Bot HUD widget | `src/components/panels/AIBotHUD.tsx` |
| `F-STR-06` | SL/TP Grid Search Optimizer | `Grid Search Optimizer` / `Tối Ưu Hóa Tham Số SL/TP` | In AI Studio Modal ➔ Tab `Optimizer` | `src/engine/strategyOptimizer.ts` |
| `F-STR-07` | 2D Sweet-Spot Profit Heatmap | `2D Profit Heatmap` / `Ma Trận Nhiệt Lợi Nhuận 2D` | In Optimizer Tab ➔ Heatmap Matrix | `src/components/panels/AIStrategyModal.tsx:L750` |
| `F-STR-08` | In-Sample vs Out-of-Sample Test | `Walk-Forward OOS Test` / `Kiểm Thử Ngoài Mẫu OOS` | In Optimizer Tab ➔ Toggle `OOS Validation` | `src/engine/strategyOptimizer.ts:L180` |
| `F-STR-09` | Pine Script v5 Exporter | `Export Pine Script v5` / `Xuất Mã TradingView v5` | In AI Studio ➔ Tab `Export Bot` ➔ `TradingView` | `src/engine/strategyExporter.ts`, `src/components/panels/ExportStrategyModal.tsx` |
| `F-STR-10` | MT5 MQL5 EA Exporter | `Export MetaTrader 5 (MQL5)` / `Xuất Bot MT5 MQL5` | In Export Bot Tab ➔ `MetaTrader 5` | `src/engine/strategyExporter.ts:L120` |
| `F-STR-11` | MT4 MQL4 EA Exporter | `Export MetaTrader 4 (MQL4)` / `Xuất Bot MT4 MQL4` | In Export Bot Tab ➔ `MetaTrader 4` | `src/engine/strategyExporter.ts:L240` |
| `F-STR-12` | Python CCXT Algorithmic Bot | `Export Python Bot (CCXT)` / `Xuất Bot Python 3` | In Export Bot Tab ➔ `Python CCXT` | `src/engine/strategyExporter.ts:L360` |
| `F-STR-13` | cTrader C# cBot Exporter | `Export cTrader (C#)` / `Xuất Robot cTrader` | In Export Bot Tab ➔ `cTrader` | `src/engine/strategyExporter.ts:L480` |
| `F-STR-14` | Universal Strategy JSON Package | `Export Strategy JSON` / `Xuất Gói Cấu Hình JSON` | In Export Bot Tab ➔ `Universal JSON` | `src/engine/strategyExporter.ts:L560` |

### Detailed Specification & QA Checklist

#### `F-STR-01` - Natural Language Strategy Transpiler
- **UI Navigation:** Click `AI Studio` button in header toolbar -> Enter plain text prompt.
- **Functionality:** Translates natural language descriptions (e.g. *"EMA 9 crosses above EMA 21 with RSI < 70, SL 15 pips, TP 30 pips"*) into executable TypeScript strategy logic.
- **QA Verification:** Submit prompt -> Code generates and compiles with 0 syntax errors.

#### `F-STR-02` - Strategy Rule Breakdown Cards
- **UI Navigation:** AI Studio Modal -> Top pane above code editor.
- **Functionality:** Parses code logic into 3 structured cards: `BUY Signal Rules`, `SELL Signal Rules`, and `Risk & Position Sizing`.
- **QA Verification:** Verify cards dynamically update when code is edited.

#### `F-STR-03` - Sandboxed Strategy Execution Engine (OWASP Hardened)
- **UI Navigation:** AI Studio Modal -> Click `Run Backtest`.
- **Functionality:** Isolated Function sandbox. Blocks prototype pollution, malicious global access (`window`, `localStorage`, `fetch`), and infinite loops (`while(true)`).
- **QA Verification:** Inject `while(true)` -> Sandbox rejects execution gracefully with error notification.

#### `F-STR-04` - Multi-LLM Provider Connectors
- **UI Navigation:** AI Studio Modal -> Click Settings gear icon.
- **Functionality:** Connects to OpenAI (GPT-4o), Google Gemini, Anthropic Claude, DeepSeek, Local Ollama, and Custom Proxy with encrypted API keys.
- **QA Verification:** Select Gemini -> Test prompt -> Returns structured strategy response.

#### `F-STR-05` - Live AI Bot Floating HUD
- **UI Navigation:** Floating widget on the main chart when a bot is active.
- **Functionality:** Shows bot status (`ACTIVE` / `HALTED`), live signal state, trade count, net PnL, and Stop Bot emergency toggle.
- **QA Verification:** Start bot -> HUD displays active ticker and updates signal values on each candle.

#### `F-STR-06` - SL/TP Grid Search Optimizer
- **UI Navigation:** AI Studio Modal -> `Optimizer` tab.
- **Functionality:** Scans SL range (10-50 pips) and TP range (20-100 pips) across hundreds of parameter combinations.
- **QA Verification:** Run 4x4 grid -> Results table ranks combinations by Net Profit and Winrate.

#### `F-STR-07` - 2D Sweet-Spot Profit Heatmap Matrix
- **UI Navigation:** Optimizer tab -> Heatmap chart below grid table.
- **Functionality:** Visual color gradient highlighting profitable parameter clusters (*Sweet Spots*) to prevent curve-fitting.
- **QA Verification:** Hover on heatmap cell -> Tooltip displays SL/TP values, Net PnL, and Trade count.

#### `F-STR-08` - In-Sample vs Out-of-Sample Test
- **UI Navigation:** Optimizer tab -> Enable `Out-of-Sample Validation` toggle.
- **Functionality:** Splits data 70% In-Sample for optimization and 30% Out-of-Sample for forward testing. Computes Walk-Forward Efficiency Index.
- **QA Verification:** Verify OOS trades execute strictly on unseen forward candles.

#### `F-STR-09` to `F-STR-14` - Multi-Platform Bot Exporters
- **UI Navigation:** AI Studio Modal -> `Export Bot` tab -> Select platform tabs.
- **Functionality:**
  - **Pine Script v5**: Generates TradingView indicator with Webhook Alert JSON payloads.
  - **MetaTrader 5**: Generates `.mq5` Expert Advisor using `CTrade` and pip calculations.
  - **MetaTrader 4**: Generates standard `.mq4` EA with `OrderSend()` and Magic Numbers.
  - **Python CCXT**: Generates standalone 24/7 Python 3 script with CCXT and Pandas-TA.
  - **cTrader**: Generates clean `.cs` robot for cTrader Automate.
  - **Universal JSON**: Exports portable schema containing rule AST and parameters.
- **QA Verification:** Click `Copy Code` or `Download File` on each tab -> File compiles cleanly in respective IDEs (MetaEditor, TradingView, VS Code).

---

## 7. Institutional Analytics & Monte Carlo Risk Engine (`F-ANL`)

### Summary Table
| ID | Feature Technical Name | UI Display Name (EN / VI) | UI Navigation Path | Source Code Path |
| :--- | :--- | :--- | :--- | :--- |
| `F-ANL-01` | Institutional Performance Metrics | `Analytics Overview` / `Báo Cáo Hiệu Suất Tổng Quan` | Header ➔ Click `Analytics` Button | `src/components/panels/AnalyticsDashboardModal.tsx`, `src/engine/analytics.ts` |
| `F-ANL-02` | Monte Carlo Stress Testing Engine | `Monte Carlo Simulation` / `Mô Phỏng Căng Thẳng Monte Carlo` | In Analytics Modal ➔ Tab `Monte Carlo` | `src/components/panels/AnalyticsDashboardModal.tsx:L350`, `src/engine/analytics.ts:L220` |
| `F-ANL-03` | PnL Calendar & Session Heatmap | `PnL Calendar & Heatmap` / `Lịch Lãi Lỗ & Biểu Đồ Nhiệt Phiên` | In Analytics Modal ➔ Tab `Heatmap` | `src/components/panels/AnalyticsDashboardModal.tsx:L520` |
| `F-ANL-04` | Multi-Session Comparison Matrix | `Compare Sessions` / `Đối Chiếu Đa Phiên Backtest` | In Analytics Modal ➔ Tab `Comparison` | `src/components/panels/AnalyticsDashboardModal.tsx:L680` |
| `F-ANL-05` | CSV Export & Database Snapshot | `Export CSV / Save Snapshot` / `Xuất File CSV / Lưu Ảnh Chụp` | In Analytics Modal ➔ Action Buttons top right | `src/components/panels/AnalyticsDashboardModal.tsx:L120` |

### Detailed Specification & QA Checklist

#### `F-ANL-01` - Institutional Performance Metrics Overview
- **UI Navigation:** Click `Analytics` button in header toolbar.
- **Functionality:** Interactive equity growth chart plus institutional KPI cards: Net Profit, Profit Factor, Win Rate, Expected Payoff, Sharpe Ratio, Sortino Ratio, Calmar Ratio, System Quality Number (SQN), and Max Drawdown %.
- **QA Verification:** Verify Sharpe and Sortino ratios calculate properly and match known formula outputs.

#### `F-ANL-02` - Monte Carlo Stress Testing Engine
- **UI Navigation:** Analytics Modal -> `Monte Carlo` tab -> Click `Run 1000 Iterations`.
- **Functionality:** Randomizes trade order distribution across 1,000 simulations. Calculates Risk-of-Ruin (probability of reaching drawdown limit) and 95% / 99% confidence intervals.
- **QA Verification:** Run 1,000 iterations -> Risk of Ruin is bounded between 0% and 100% and median trajectory displays.

#### `F-ANL-03` - PnL Calendar & Session Heatmap Breakdown
- **UI Navigation:** Analytics Modal -> `Heatmap` tab.
- **Functionality:** Calendar matrix breaking down profit/loss by Trading Session (Asian, London, New York), Day of Week (Mon-Fri), and Month.
- **QA Verification:** Confirm day and hour aggregations sum up exactly to total net profit.

#### `F-ANL-04` - Multi-Session Comparison Matrix
- **UI Navigation:** Analytics Modal -> `Comparison` tab -> Select sessions from dropdown.
- **Functionality:** Side-by-side benchmark of multiple backtest sessions comparing metrics, winrates, and equity curves. Best performer highlighted with badge.
- **QA Verification:** Select 2 sessions -> Comparison table renders side-by-side metrics.

#### `F-ANL-05` - CSV Export & Database Snapshot
- **UI Navigation:** Top-right buttons in Analytics Modal.
- **Functionality:** `Export CSV` downloads trade ledger for Excel/Python audit. `Save Snapshot` stores JSON summary to SQLite.
- **QA Verification:** Click `Export CSV` -> Downloads `.csv` file with all trade records.

---

## 8. Live MT5 Broker, Cloud Tunnel & System Infrastructure (`F-SYS`)

### Summary Table
| ID | Feature Technical Name | UI Display Name (EN / VI) | UI Navigation Path | Source Code Path |
| :--- | :--- | :--- | :--- | :--- |
| `F-SYS-01` | MT5 Micro-Gateway Connector | `MT5 Broker Connection` / `Kết Nối Sàn MT5` | Header ➔ `More Tools [•••]` ➔ `Connect Broker` | `src/components/panels/BrokerConnectionModal.tsx`, `src/store/brokerStore.ts` |
| `F-SYS-02` | Multi-Tenant Broker Isolation | `Multi-Tenant Isolation` / `Cô Lập Đa Người Dùng` | Server backend routing | `server/routes/broker.ts` |
| `F-SYS-03` | Cloudflare Remote Tunnel Gateway | `Remote Tunnel Gateway` / `Đường Truyền Từ Xa Cloudflare` | Header ➔ `More Tools [•••]` ➔ `Remote Tunnel` | `src/components/panels/TunnelModal.tsx`, `src/store/tunnelStore.ts` |
| `F-SYS-04` | Multi-Session Manager | `Session Manager` / `Quản Lý Phiên Làm Việc` | Header ➔ `More Tools [•••]` ➔ `Session Manager` | `src/components/panels/SessionManagerModal.tsx` |
| `F-SYS-05` | Keyboard Shortcuts Helper Modal | `Keyboard Shortcuts [?]` / `Phím Tắt Hệ Thống` | Header ➔ `More Tools [•••]` ➔ `Shortcuts` or press `?` | `src/components/panels/ShortcutsModal.tsx` |
| `F-SYS-06` | Cross-Platform Concurrent Launchers | `CLI & Launch Scripts` / `Bộ Khởi Chạy Đa Nền Tảng` | Terminal: `npm run dev:all` / `./start_all.sh` / `start_all.bat` | `package.json`, `start_all.sh`, `start_all.bat` |

### Detailed Specification & QA Checklist

#### `F-SYS-01` - MT5 Micro-Gateway Connector
- **UI Navigation:** Header `More Tools [•••]` -> `Connect Broker`.
- **Functionality:** Connects to FastAPI micro-gateway (Port 8765). Authenticates with MT5 Server, Account ID, and Password. Displays latency ping in milliseconds.
- **QA Verification:** Click `Connect` -> Status badge turns green (`CONNECTED`) with live latency and account equity.

#### `F-SYS-02` - Multi-Tenant Broker Isolation
- **UI Navigation:** Automatic server-side enforcement.
- **Functionality:** Isolates in-memory mock engine and MT5 sessions per `userId`. Prevents cross-talk or leaking orders between concurrent traders.
- **QA Verification:** Two separate browser sessions connect -> Trades in Session A never appear in Session B.

#### `F-SYS-03` - Cloudflare Remote Tunnel Gateway with PIN
- **UI Navigation:** Header `More Tools [•••]` -> `Remote Tunnel`.
- **Functionality:** Spawns a public HTTPS Cloudflare tunnel URL allowing remote backtesting on mobile devices, protected by a 6-digit Security PIN gate.
- **QA Verification:** Start tunnel -> Access generated URL on mobile -> Enter PIN -> Full trading UI loads securely.

#### `F-SYS-04` - Multi-Session Manager
- **UI Navigation:** Header `More Tools [•••]` -> `Session Manager`.
- **Functionality:** Create new sessions, Rename, Switch, Clone (duplicate trades and settings), or Delete backtest workspaces. Auto-saves to SQLite via throttled persistence.
- **QA Verification:** Create new session `Gold Test 2` -> Workspaces switch cleanly and persist upon reload.

#### `F-SYS-05` - Keyboard Shortcuts Helper Modal
- **UI Navigation:** Press `?` key anywhere or Header `More Tools [•••]` -> `Shortcuts`.
- **Functionality:** Displays cheat sheet for hotkeys: Space (Play/Pause), F8 / Arrow (Step), B (Buy), S (Sell), C (Close All), M (Indicators), Escape (Close Modals).
- **QA Verification:** Press `?` -> Shortcuts modal opens. Press `Escape` -> Modal closes.

#### `F-SYS-06` - Cross-Platform Concurrent Launchers
- **UI Navigation:** CLI / Shell.
- **Functionality:**
  - `npm run dev:all`: Concurrently runs Backend API and Vite Frontend with colored terminal prefix.
  - `start_all.bat`: Windows one-click desktop launcher.
  - `start_all.sh`: POSIX Bash launcher for Linux/macOS/WSL with trap signal cleanup.
- **QA Verification:** Run `npm run dev:all` -> Both `[API]` on port 3001 and `[WEB]` on port 5173 start simultaneously.

---

## 9. Smart Money Concepts & AI Copilot Engine (`F-SMC`)

### Summary Table
| ID | Feature Technical Name | UI Display Name (EN / VI) | UI Navigation Path | Source Code Path |
| :--- | :--- | :--- | :--- | :--- |
| `F-SMC-01` | Fractal Pivot & Monotonic Detection | `Fractal Pivot Detection` / `Nhận Diện Đỉnh/Đáy Fractal` | Chart Canvas ➔ SMC Overlay Layer | `src/engine/smc/smcEngine.ts:L40` |
| `F-SMC-02` | Market Structure Engine (BOS / CHoCH) | `BOS & CHoCH Engine` / `Cấu Trúc Thị Trường BOS/CHoCH` | Chart Canvas ➔ Displacement Structure Labels | `src/engine/smc/smcEngine.ts:L310` |
| `F-SMC-03` | Order Block (OB) Engine | `Order Block Engine` / `Cỗ Máy Khối Lệnh OB` | Chart Canvas ➔ Bullish/Bearish OB Price Zones | `src/engine/smc/smcEngine.ts:L450`, `src/engine/smc/overlayPrimitives.ts` |
| `F-SMC-04` | Fair Value Gap (FVG) Imbalance Engine | `Fair Value Gap (FVG)` / `Khoảng Trống Giá FVG` | Chart Canvas ➔ 3-Bar Imbalance Shaded Box | `src/engine/smc/smcEngine.ts:L560` |
| `F-SMC-05` | Liquidity Sweeps & Premium/Discount Equilibrium | `Liquidity Sweeps & Equilibrium` / `Quét Thanh Khoản & Vùng Giá` | Chart Canvas ➔ BSL/SSL Sweep Badges & 50% EQ Line | `src/engine/smc/smcEngine.ts:L680` |
| `F-SMC-06` | Multi-Timeframe Confluence Gate | `Confluence Score Gate` / `Cổng Đánh Giá Hợp Lưu` | Floating HUD ➔ Weighted Confluence Metric | `src/engine/smc/confluenceGate.ts` |
| `F-SMC-07` | Apex AI Copilot HUD & Streaming CoT | `Apex AI Copilot HUD` / `Trợ Lý AI Copilot Trực Tiếp` | Top-Right Chart Floating Dock ➔ Copilot Panel | `src/components/chart/AICopilotHUD.tsx`, `src/engine/smc/sseCopilotStream.ts` |
| `F-SMC-08` | Multi-Timeframe (MTF) Trend Matrix Widget | `Multi-Timeframe Matrix` / `Ma Trận Đa Khung Thời Gian` | Top-Right Chart Floating Dock ➔ MTF Widget | `src/components/chart/MTFMatrixWidget.tsx` |
| `F-SMC-09` | Institutional Action Plan Validator | `Action Plan Institutional Validator` / `Bộ Kiểm Định Kế Hoạch` | Copilot HUD ➔ Apply Plan Button & Violation Toasts | `src/engine/smc/actionPlanValidator.ts` |
| `F-SMC-10` | AES-256-GCM Secure Key Vault | `Secure Key Vault (AES-GCM)` / `Két Sắt Khóa Bí Mật AES-256` | User Profile Modal ➔ Key Vault & Security Tab | `src/security/aesVault.ts` |

### Detailed Specification & QA Checklist

#### `F-SMC-01` - Fractal Pivot & Monotonic Detection
- **UI Navigation:** Automatically computed on the bar stream and visually rendered as swing high/low anchor points.
- **Functionality:** Double-ended monotonic queue (`MonotonicMinMaxQueue`) over typed arrays (`Int32Array`, `Float64Array`) achieving amortized $O(1)$ per bar and $< 0.005$ ms latency on 10,000 bars.
- **QA Verification:**
  1. Replay 5 bars forming a swing apex -> System correctly marks a Pivot High on the central peak bar.
  2. Replay 5 bars forming a swing trough -> System correctly marks a Pivot Low.
  3. Reset replay -> Monotonic queue resets cleanly without memory leaks or residual indices.

#### `F-SMC-02` - Market Structure Engine (BOS / CHoCH)
- **UI Navigation:** Realtime structure event labels rendered on the chart at the exact breakout candle.
- **Functionality:**
  - Break of Structure (BOS): Trend continuation detection when price breaks the previous fractal swing high/low.
  - Change of Character (CHoCH): Early trend reversal signal when price breaches the structural counter-pivot.
- **QA Verification:**
  1. Candle displaces decisively above recent swing high -> Emits `BOS_BULLISH` label with horizontal extension line.
  2. Candle subsequently violates recent swing low -> Emits `CHoCH_BEARISH` label and switches directional bias.

#### `F-SMC-03` - Order Block (OB) Engine
- **UI Navigation:** Bullish (emerald) and Bearish (rose) rectangular price zones extending into the future horizon.
- **Functionality:** Identifies unmitigated institutional order blocks from high-displacement impulses. Automatically flags status as `MITIGATED` and fades opacity once price enters the zone.
- **QA Verification:**
  1. Down-close candle precedes strong upward expansion -> Bullish OB box forms from candle Low to High.
  2. Future price pulls back and enters the box -> Status changes to `MITIGATED` immediately.

#### `F-SMC-04` - Fair Value Gap (FVG) Imbalance Engine
- **UI Navigation:** Shaded geometric zones marking 3-bar liquidity voids between candle 1 wick and candle 3 wick.
- **Functionality:** Calculates pip magnitude, tracks dynamic fill ratio, and registers Consequent Encroachment (50% midpoint fill).
- **QA Verification:**
  1. Rapid 3-bar surge leaves space between Bar 1 High and Bar 3 Low -> Bullish FVG zone is drawn.
  2. Price retraces into the gap -> Fill ratio updates dynamically; fully filled gaps transition to closed.

#### `F-SMC-05` - Liquidity Sweeps & Premium/Discount Equilibrium
- **UI Navigation:** Sweep flags (`BSL_SWEEP`, `SSL_SWEEP`) and 50% Equilibrium price reference line.
- **Functionality:**
  - Detects liquidity traps where price wicks beyond a swing level but closes back inside.
  - Maps market pricing into Premium (> 50%) and Discount (< 50%) zones based on the active trading range.
- **QA Verification:**
  1. Price spikes above swing high and closes lower -> `SWEEP_BSL` signal fires.
  2. Long trade plans generated at Premium are marked sub-optimal; Discount entries receive favorable location scoring.

#### `F-SMC-06` - Multi-Timeframe Confluence Gate
- **UI Navigation:** Confluence percentage score displayed on the Apex AI Copilot HUD.
- **Functionality:** Aggregates weighted scores from HTF alignment (H4/D1), active unmitigated POIs, sweep confirmations, and active trading session (London/NY). Suppresses LLM inference calls when score $< 65$.
- **QA Verification:**
  1. Isolated low-probability setup -> Score remains below 50; no LLM tokens wasted.
  2. Aligned HTF trend + Sweep + Discount OB -> Score exceeds 65; LLM Chain-of-Thought stream triggers automatically.

#### `F-SMC-07` - Apex AI Copilot HUD & Streaming CoT
- **UI Navigation:** Top-right chart floating dock (expandable, collapsable, multi-tab).
- **Functionality:**
  - Real-time Server-Sent Events (SSE) streaming displaying token-by-token Chain-of-Thought reasoning.
  - Automatic extraction of typed `ActionPlan` (Side, Entry, SL, TP, R:R, Confidence).
  - 1-Click "Apply Plan" action button routing parameters directly into OMS order entry.
- **QA Verification:**
  1. Click collapse button -> Panel collapses smoothly into a compact icon badge.
  2. SSE stream initiates -> Reasoning deltas animate cleanly with monospace terminal typography.
  3. ActionPlan received -> Entry, Stop Loss, and Take Profit targets populate with calculated R:R.

#### `F-SMC-08` - Multi-Timeframe (MTF) Trend Matrix Widget
- **UI Navigation:** Compact widget docked below the Apex Copilot on the chart view.
- **Functionality:** Compact qualitative matrix tracking H4 & D1 directional bias, Premium/Discount zone, active POIs, and current market session (Tokyo / London / New York).
- **QA Verification:**
  1. H4 and D1 agree on bullish direction -> Matrix displays green `BULLISH` tag.
  2. Clock crosses 13:00 UTC -> Session pill switches to `NEW YORK`.

#### `F-SMC-09` - Institutional Action Plan Validator
- **UI Navigation:** Intercepts AI action plans and manual order submissions from Copilot.
- **Functionality:** Enforces strict institutional risk guardrails:
  - Rejects LONG orders in Premium zones.
  - Rejects SHORT orders in Discount zones.
  - Mandates Risk-to-Reward ratio $\ge 2.0$.
  - Requires Stop Loss placement beyond the structural protection level.
- **QA Verification:**
  1. AI proposes LONG in Premium -> Validator blocks plan, displays red toast, disables execution button.
  2. AI proposes LONG in Discount with R:R = 2.6 -> Validator grants instant approval.

#### `F-SMC-10` - AES-256-GCM Secure Key Vault
- **UI Navigation:** Built into user security and credential storage layers.
- **Functionality:**
  - FIPS-grade AES-256-GCM encryption with PBKDF2-SHA-256 (250,000 iterations) and 16-byte random salt.
  - Per-record 12-byte random IV and domain-bound Authenticated Additional Data (AAD).
  - Wipes plaintext and CryptoKey references from RAM immediately on `lockVault()`.
- **QA Verification:**
  1. Unlock with correct passphrase -> Secret decrypted with matching fingerprint prefix.
  2. Lock vault -> All read operations throw `VaultLockedError`.
  3. Tampered IV or wrong passphrase -> Decryption fails with `VaultCorruptedError`.

---

## 10. QA Tester Verification Master Matrix

| ID | Feature | Category | Test Type | Status | Automated Test Suite Reference |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `F-HDR-01` | Symbol Search Modal | Header | UI / Unit | ✅ PASS | `test_comprehensive_suite.ts` |
| `F-HDR-02` | Timeframe Resampler | Header | Unit / Math | ✅ PASS | Suite 4: Resampler Tests (6 tests) |
| `F-HDR-03` | Chart Type Switcher | Header | UI / Visual | ✅ PASS | Suite 10: Heikin-Ashi Tests (13 tests) |
| `F-HDR-04` | Technical Indicators | Header | Math / Realtime | ✅ PASS | Suite 3: Indicators Tests (7 tests) |
| `F-HDR-05` | Spread & Bid/Ask | Header | Math / Order | ✅ PASS | Suite 1: Quant Math Tests (6 tests) |
| `F-HDR-06` | Account Equity HUD | Header | State / Store | ✅ PASS | Suite 2: OMS Tests (22 tests) |
| `F-HDR-07` | Internationalization | Header | Locale Parity | ✅ PASS | `npm run check:i18n` (0 errors) |
| `F-HDR-08` | User Profile & Auth | Header | Security / API | ✅ PASS | Suite 2: Security Sanitization |
| `F-CHT-01` | Canvas 60 FPS Charting | Chart | E2E / Performance | ✅ PASS | Suite 10: Chart Engine |
| `F-CHT-02` | Visual SL/TP Drag | Chart | Interaction / OMS | ✅ PASS | Suite 2: Trailing & SL/TP Tests |
| `F-CHT-03` | Price Axis (+) Button | Chart | Interaction / OMS | ✅ PASS | Suite 12: Order Factory Tests |
| `F-CHT-04` | Price Scale Context Menu | Chart | UI Context | ✅ PASS | UI Context Menu Verification |
| `F-CHT-05` | Vector Drawing Tools | Chart | Canvas State | ✅ PASS | Drawing Coordinates Bounds |
| `F-CHT-06` | High/Low & Separators | Chart | Mathematical | ✅ PASS | Suite 10: Candle Bounds |
| `F-CHT-07` | Prop Firm Shield HUD | Chart | Risk Management | ✅ PASS | Suite 14: Prop Firm Rule Tests |
| `F-RPL-01` | 60 FPS Replay Controls | Replay | Performance | ✅ PASS | Suite 2: OMS Tick Stream |
| `F-RPL-02` | Playback Speed Multiplier | Replay | Timing | ✅ PASS | Replay Interval Bounds |
| `F-RPL-03` | Milestone Jumps (0/50/100%) | Replay | Search / Index | ✅ PASS | Binary Search Indexing |
| `F-RPL-04` | Exact Date-Time Jump | Replay | Search / Math | ✅ PASS | Suite 11: Bar Snapping Tests |
| `F-OMS-01` | Quick Trade Dock | Execution | OMS / Execution | ✅ PASS | Suite 2: Market Orders |
| `F-OMS-02` | Order Entry Modal | Execution | Factory / Validation | ✅ PASS | Suite 12: Order Factory Tests |
| `F-OMS-03` | Open Positions Manager | Execution | Lifecycle / OMS | ✅ PASS | Suite 2: Breakeven & Partial |
| `F-OMS-04` | Pending Orders Manager | Execution | Matching Engine | ✅ PASS | Suite 2: Limit & Stop Fills |
| `F-OMS-05` | Trade History & Audit | Execution | Accounting | ✅ PASS | Suite 5: Analytics Trade Log |
| `F-OMS-06` | Strategy Bot Logs | Execution | Event Stream | ✅ PASS | Suite 6: Strategy Sandbox |
| `F-OMS-07` | Economic Calendar | Execution | Data Integrity | ✅ PASS | Suite 11: Calendar Tests (12 tests) |
| `F-OMS-08` | Market Watch Drawer | Execution | Multi-Symbol | ✅ PASS | Suite 1: Instrument Specs |
| `F-OMS-09` | Close All Emergency | Execution | Batch OMS | ✅ PASS | Suite 2: Position Closure |
| `F-DAT-01` | Integer CSV Parser | Data | Performance | ✅ PASS | Suite 9: CSV Parser Tests |
| `F-DAT-02` | SQLite Dataset Library | Data | Database / API | ✅ PASS | Prisma SQLite Persistence |
| `F-DAT-03` | Online Multi-Batch Crawler | Data | Network / API | ✅ PASS | Crawler Paginated Batching |
| `F-DAT-04` | Date-Range Crawl Mode | Data | Network / API | ✅ PASS | Date Span Gap Detection |
| `F-DAT-05` | Curated Kaggle Presets | Data | Storage | ✅ PASS | Curated Sample Feeds |
| `F-STR-01` | AI Strategy Transpiler | Algorithmic | LLM Transpiler | ✅ PASS | Suite 6: Prebuilt Compilations |
| `F-STR-02` | Rule Breakdown Cards | Algorithmic | AST Parsing | ✅ PASS | AST Rule Extraction |
| `F-STR-03` | Sandboxed Strategy Engine | Algorithmic | OWASP Security | ✅ PASS | Security Suite: Sandbox Isolation |
| `F-STR-04` | Multi-LLM Connectors | Algorithmic | API Connectors | ✅ PASS | Fetch & Header Protocol |
| `F-STR-05` | Live AI Bot HUD | Algorithmic | Live HUD Overlay | ✅ PASS | Bot Execution Signal Dispatch |
| `F-STR-06` | SL/TP Grid Optimizer | Algorithmic | Batch Simulation | ✅ PASS | Suite 7: Optimizer Tests (10 tests) |
| `F-STR-07` | 2D Profit Heatmap | Algorithmic | Data Visualization | ✅ PASS | Suite 7: Heatmap Matrix |
| `F-STR-08` | In-Sample / OOS Forward | Algorithmic | Overfitting Defense | ✅ PASS | Suite 7: Out-of-Sample Split |
| `F-STR-09` | Pine Script v5 Exporter | Exporter | Code Generation | ✅ PASS | Suite 8: Exporter Tests |
| `F-STR-10` | MT5 MQL5 EA Exporter | Exporter | Code Generation | ✅ PASS | Suite 8: CTrade Compilation |
| `F-STR-11` | MT4 MQL4 EA Exporter | Exporter | Code Generation | ✅ PASS | Suite 8: MQL4 Compatibility |
| `F-STR-12` | Python CCXT Bot Exporter | Exporter | Code Generation | ✅ PASS | Suite 8: CCXT Execution |
| `F-STR-13` | cTrader C# Exporter | Exporter | Code Generation | ✅ PASS | Suite 8: cBot Class Schema |
| `F-STR-14` | Universal Strategy JSON | Exporter | Schema Validation | ✅ PASS | Suite 8: JSON Schema |
| `F-ANL-01` | Institutional Metrics | Analytics | Quantitative Math | ✅ PASS | Suite 5: Analytics KPIs |
| `F-ANL-02` | Monte Carlo Simulation | Analytics | Stochastic Modeling | ✅ PASS | Suite 5: 1000-Path Simulation |
| `F-ANL-03` | PnL Calendar & Heatmap | Analytics | Data Aggregation | ✅ PASS | Suite 5: Calendar Matrix |
| `F-ANL-04` | Multi-Session Comparison | Analytics | Side-by-Side Bench | ✅ PASS | Multi-Session Benchmarking |
| `F-ANL-05` | CSV Export & DB Snapshot | Analytics | File I/O & SQLite | ✅ PASS | Snapshot Storage Pipeline |
| `F-SYS-01` | MT5 Micro-Gateway | Infrastructure | Socket / REST API | ✅ PASS | FastAPI Python Bridge |
| `F-SYS-02` | Multi-Tenant Isolation | Infrastructure | Security / Session | ✅ PASS | User Context Route Guard |
| `F-SYS-03` | Cloudflare Remote Tunnel | Infrastructure | Networking / Auth | ✅ PASS | PIN Verification Gateway |
| `F-SYS-04` | Multi-Session Manager | Infrastructure | State Persistence | ✅ PASS | Session CRUD & AutoSave |
| `F-SYS-05` | Keyboard Shortcuts Helper | Infrastructure | UI UX Accessibility | ✅ PASS | Global Hotkey Bindings |
| `F-SYS-06` | Cross-Platform Launchers | Infrastructure | CLI / Shell | ✅ PASS | `dev:all`, `start_all.sh`, `.bat` |
| `F-SMC-01` | Fractal Pivot Detection | SMC Perception | O(1) Queue | ✅ PASS | Suite 17: SMC Engine & `tests/engine/smc.fractal.test.ts` |
| `F-SMC-02` | Structure BOS / CHoCH | SMC Perception | State Machine | ✅ PASS | Suite 17: BOS/CHoCH & `tests/engine/smc.bosChoch.test.ts` |
| `F-SMC-03` | Order Block Engine | SMC Perception | Zone Analysis | ✅ PASS | Suite 20: Overlay Primitives Bridge |
| `F-SMC-04` | Fair Value Gap Engine | SMC Perception | Imbalance / Pips | ✅ PASS | Suite 17 & `tests/engine/smcAccuracy.test.ts` |
| `F-SMC-05` | Liquidity Sweeps BSL/SSL | SMC Perception | Sweep Detection | ✅ PASS | Suite 20: Liquidity Sweep Primitives |
| `F-SMC-06` | Confluence Score Gate | SMC Reasoning | Gating $\ge 65$ | ✅ PASS | Suite 17 & `confluenceGate.ts` |
| `F-SMC-07` | Apex AI Copilot HUD | SMC Interface | SSE Streaming | ✅ PASS | Suite 19: AI Co-Pilot Streaming & CoT |
| `F-SMC-08` | MTF Trend Matrix Widget | SMC Interface | Multi-Timeframe | ✅ PASS | Suite 18: SMC Worker Sync Protocol |
| `F-SMC-09` | Action Plan Validator | SMC Governance | Institutional Rule | ✅ PASS | Suite 19: ActionPlanValidator Tests |
| `F-SMC-10` | Secure Key Vault AES-GCM | Security | Web Crypto FIPS | ✅ PASS | `tests/security/aesVault.test.ts` (22 tests) |
| `F-BRK-01` | Real-Time SSE Streaming Strategy Generator | Algorithmic AI | SSE Token Stream | ✅ PASS | Suite 21: AI Streaming Generator |
| `F-BRK-02` | Visual Block Strategy Builder (No-Code) | Algorithmic AI | AST Compiler | ✅ PASS | Suite 21: Visual Block Compiler |
| `F-BRK-03` | AI Trade Post-Mortem & Autopsy | Analytics / Forensic | Root Cause ML | ✅ PASS | Suite 21: Trade Autopsy Engine |
| `F-BRK-04` | Prop Firm Pass Probability Monte Carlo | Analytics / Risk | 1,000-Path Sim | ✅ PASS | Suite 21: Monte Carlo Simulation |
| `F-BRK-05` | Real-Time Signal Webhook Dispatcher | Infrastructure | Telegram/Discord | ✅ PASS | Suite 21: Webhook Dispatcher |

---

## 10. 5 Breakthrough Upgrades Suite (v2.2) (`F-BRK`)

### Summary Table
| ID | Feature Technical Name | UI Display Name (EN / VI) | UI Navigation Path | Source Code Path |
| :--- | :--- | :--- | :--- | :--- |
| `F-BRK-01` | Real-Time SSE Streaming Strategy Generator | `AI Real-Time Strategy Stream` / `Sinh Chiến Lược AI Streaming Thời Gian Thực` | Header ➔ AI Strategy Studio ➔ Studio Tab | `src/engine/aiStreamingGenerator.ts`, `src/components/panels/AIStrategyModal.tsx` |
| `F-BRK-02` | Visual Block Strategy Builder | `Visual Builder (No-Code)` / `Bộ Lắp Ghép Khối Trực Quan` | Header ➔ AI Strategy Studio ➔ Visual Builder Tab | `src/engine/visualBlockCompiler.ts`, `src/components/panels/VisualStrategyBuilderModal.tsx` |
| `F-BRK-03` | AI Trade Post-Mortem & Autopsy | `AI Trade Autopsy` / `Khám Nghiệm Lệnh Thua` | Bottom Panel ➔ Closed Positions ➔ Losing Trade ➔ Click `AI Autopsy` | `src/engine/aiTradeAutopsy.ts`, `src/components/panels/AITradeAutopsyModal.tsx` |
| `F-BRK-04` | Prop Firm Pass Probability Monte Carlo | `Prop Firm Pass Probability` / `Điểm Xác Suất Vượt Quỹ Prop Firm` | Header ➔ AI Strategy Studio ➔ Optimizer Tab ➔ Best Setup Card | `src/engine/monteCarloEngine.ts`, `src/components/panels/AIStrategyModal.tsx` |
| `F-BRK-05` | Real-Time Signal Webhook Dispatcher | `Signal Webhook Dispatcher` / `Bộ Bắn Tín Hiệu Webhook Đa Kênh` | Header ➔ AI Strategy Studio ➔ Webhooks Tab | `src/engine/signalWebhookDispatcher.ts`, `src/components/panels/SignalWebhookSettingsTab.tsx` |

### Detailed Specification & QA Checklist

#### `F-BRK-01` - Real-Time SSE Streaming Strategy Generator & CoT Terminal
- **UI Navigation:** Click `AI Strategy Studio` on Header ➔ Studio Tab ➔ Enter natural language prompt ➔ Click `Generate Strategy`.
- **Functionality:** Streams tokens with live speed telemetry (tokens/sec), parses `<think>...</think>` into interactive Chain-of-Thought terminal, and includes live Cancel button.
- **QA Verification:**
  1. Trigger generation -> CoT terminal appears displaying real-time reasoning and code deltas.
  2. Verify tokens/sec badge updates dynamically.
  3. Click `Stop Generation` -> Stream aborts cleanly without UI freezes.

#### `F-BRK-02` - Visual Block Strategy Builder (No-Code Quant Composer)
- **UI Navigation:** Click `AI Strategy Studio` ➔ Switch to `Visual Builder` Tab.
- **Functionality:** No-code visual rule block composer with trigger selectors (RSI, EMA, SMC Order Block), comparison operators, and SL/TP inputs. Compiles bidirectionally to/from JavaScript sandbox code.
- **QA Verification:**
  1. Add new condition block -> Set RSI < 30 and Action BUY.
  2. Switch to Code Preview -> Generated `onCandle` JavaScript function reflects block logic.
  3. Click `Load into AI Studio` -> Strategy transfers directly into Sandbox editor.

#### `F-BRK-03` - AI Trade Post-Mortem & Diagnostic Autopsy
- **UI Navigation:** Bottom dock ➔ `Positions` tab ➔ `Closed Positions` subtab ➔ Locate any trade with negative PnL ➔ Click `AI Autopsy` button.
- **Functionality:** Deep forensic diagnosis extracting trade blackbox telemetry, computing 0-100 Discipline score, classifying into 5 root causes (News Collision, Counter HTF Trend, FOMO Chase, SL Management, Probabilistic Variance), and generating quantitative prescriptions.
- **QA Verification:**
  1. Click `AI Autopsy` on losing trade -> Forensic modal opens instantly.
  2. Verify Discipline score gauge, Root Cause badge, and prescription checklist render accurately.

#### `F-BRK-04` - Prop Firm Pass Probability & 1,000-Path Monte Carlo Stress Testing
- **UI Navigation:** Click `AI Strategy Studio` ➔ `Optimizer` Tab ➔ Run SL/TP Grid Optimization ➔ Inspect `Best Overall Setup` card.
- **Functionality:** 1,000-iteration bootstrap Monte Carlo simulation evaluating prop firm challenge constraints (10% profit target, 5% max daily loss, 10% max overall drawdown) and assigning star ratings (`ELITE`, `SOLID`, `MODERATE`, `HIGH_RISK`).
- **QA Verification:**
  1. Run optimizer on at least 10 bars -> Best setup card renders `Prop Firm Pass Probability` badge.
  2. Inspect Pass Target Rate, Daily Loss Breach Risk, and 1,000-Path Median balance.

#### `F-BRK-05` - Real-Time Multi-Channel Signal Webhook Dispatcher
- **UI Navigation:** Click `AI Strategy Studio` ➔ `Webhooks` Tab.
- **Functionality:** Dispatches instant trade execution alerts with formatted Markdown embed to Telegram Bot API and Discord Webhooks, with chart canvas snapshot attachment.
- **QA Verification:**
  1. Enter Telegram Token + Chat ID or Discord Webhook URL.
  2. Click `Test Webhook Ping` -> Verified green success toast.
  3. Toggle `DISPATCHER ON` -> Executing market or algorithmic order fires webhook payload asynchronously.

---

## 11. Conclusion & Maintenance Rules

1. **Drift-Resistance**: When modifying or adding any feature in `src/`, update its respective row in both `docs/FEATURE_CATALOG_CHECKLIST.md` and `docs/vi/FEATURE_CATALOG_CHECKLIST.md`.
2. **Acceptance Verification**: Every newly implemented feature must pass its assigned QA verification steps and automated test suite check before being merged to `main`.

