# 📅 QuantBacktest Pro: Launch Calendar & Brand Asset Specifications

> **Autonomous Technology Corporation (AUT) — Chief Marketing & Growth Office (CMO)**  
> **Author**: Iris (CMO & Growth)  
> **Status**: Approved for Release Execution  
> **Scope**: 60-Day Multi-Channel Growth Execution, Design System & Creative Specifications  

---

## 1. 60-Day Integrated Launch Master Calendar

```
Sprint Timeline:
[ Pre-Launch Seeding ] ──► [ Day 0: Launch Blitz ] ──► [ Launch Week Echo ] ──► [ Community Flywheel ] ──► [ Institutional Scale ]
      (Days -14 to -1)           (Tuesday 07:00 EST)           (Days 1 to 7)             (Weeks 2 to 4)             (Months 2+)
```

### Phase 0: Pre-Launch Seeding & Technical Readiness (Days -14 to -1)
- **Day -14**: Freeze release candidate `v1.3.0`. Complete 143/143 unit and integration test passes (`npm test`).
- **Day -10**: Ingest and verify all 4 locale translations (`en`, `vi`, `ja`, `zh`) with `npm run check:i18n`. Zero missing keys.
- **Day -7**: Setup 1-click cloud launch buttons (Railway, Render, Gitpod, Docker). Test fresh deploy from public URL.
- **Day -5**: Seed closed alpha with 25 elite quant creators and algorithmic trading bloggers under embargo.
- **Day -2**: Prepare visual assets (60 FPS demo GIFs, social OpenGraph banners, feature cards).
- **Day -1**: Schedule Product Hunt post for 00:01 AM PST; prepare Hacker News submission for 07:15 AM EST.

### Phase 1: Launch Day Blitz (Day 0 — "The Triple Threat")
- **00:01 PST / 03:01 EST**: Product Hunt listing goes live. Ping Core Team and early alpha testers for initial comments and feedback.
- **07:15 EST**: Submit **Show HN: QuantBacktest Pro – Institutional 60 FPS Replay & AI Strategy Studio in TypeScript** to Hacker News.
- **07:45 EST**: Publish 10-part Viral Twitter/X Mega-Thread with animated 60 FPS demo clips and GitHub repository link.
- **08:30 EST**: Post technical educational teardown to Reddit `r/algotrading` and `r/quant`: *"Why 90% of backtests lie: Building an O(1) Replay Engine"*.
- **11:00 EST**: Live Discord Community Kickoff on Voice Stage. Product walkthrough by engineering team.
- **15:00 EST**: Mid-day HN comment moderation & feature request issue creation (`community-request` tags).
- **20:00 EST**: Day 0 Recap & Star Milestone celebration tweet (Target: 500+ stars).

### Phase 2: Launch Week Echo & Content Amplification (Days 1 to 7)
- **Day 1 (Wednesday)**: Publish Article 1 (*"Why 90% of Backtests Lie"*) on Medium, Substack, and Dev.to.
- **Day 2 (Thursday)**: Reddit frontend engineering breakdown on `r/typescript` and `r/reactjs` focusing on zero-allocation canvas updates.
- **Day 3 (Friday)**: Publish YouTube Full Video Walkthrough: *"From TradingView to Free Institutional Backtesting: The 15-Minute Complete Guide"*.
- **Day 4 (Saturday)**: Host Weekend Algo Hackathon teaser in Discord; introduce the Strategy Bot Exporter.
- **Day 5 (Sunday)**: Community Q&A newsletter broadcast to initial waitlist and stargazers.
- **Day 6 (Monday)**: Publish Article 2 (*"Inside the AI Strategy Studio: From Natural Language Prompts to Production MQL5 and Pine Script"*).
- **Day 7 (Tuesday)**: Launch Week Retrospective report to Board & Athena (CEO). Target: 1,500+ GitHub Stars.

### Phase 3: The Community Flywheel & Quant Tournament (Weeks 2 to 4)
- **Week 2**: Announce the inaugural **Global Quant Backtest Challenge** ($50,000 equivalent prize pool).
- **Week 3**: Drop the official challenge dataset hash; open verification bot on Discord and Telegram.
- **Week 4**: Publish Article 3 (*"Mastering the Prop Firm Gauntlet: Algorithmic Drawdown Shields & Real-Time Trailing Stop-Loss Architecture"*).
- **Week 4 (End)**: Host Live Grand Finals on Discord Stage with top 10 finalists.

### Phase 4: Institutional B2B Sales & Prop Firm Onboarding (Weeks 5 to 8)
- Reach out to top 25 global proprietary trading firms with the Institutional White-Label pitch deck.
- Deliver custom proof-of-concept deployments for first 3 pilot partners.
- Convert 5 prop firms to annual enterprise contracts ($36K+ ACV).

---

## 2. Brand Identity & Visual Design Specifications

QuantBacktest Pro's visual posture is **Institutional Cyber-Quant**: dark, technical, highly legible, precise, and authoritative.

### Color Palette

| Color Token | Hex Code | RGB | Usage |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `#0b0e14` | `rgb(11, 14, 20)` | Deep workspace root canvas |
| **Card / Panel Surface**| `#10141e` | `rgb(16, 20, 30)` | Elevated floating modals & toolbars |
| **Border / Stroke** | `#1e293b` | `rgb(30, 41, 59)` | Hairline panel borders & dividers |
| **Brand Primary Cyan** | `#38bdf8` | `rgb(56, 189, 248)`| Active tabs, action highlights, primary icons |
| **Accent Emerald (Buy)**| `#10b981` | `rgb(16, 185, 129)`| Long orders, profit markers, pass badges |
| **Accent Crimson (Sell)**| `#ef4444` | `rgb(239, 68, 68)` | Short orders, stop losses, risk circuit alerts |
| **Neon Amber (Warning)**| `#f59e0b` | `rgb(245, 158, 11)`| Drawdown warning, Monte Carlo confidence band |
| **Quant Violet (AI)** | `#6366f1` | `rgb(99, 102, 241)`| AI Strategy Studio, AST badges, neural icons |

### Typography Standards
- **Primary Interface Font**: `Inter`, `-apple-system`, `BlinkMacSystemFont`, `sans-serif`
- **Monospace Financial Font**: `JetBrains Mono`, `Fira Code`, `ui-monospace` (all numbers, prices, pips, and code snippets must use tabular monospace numbers: `font-variant-numeric: tabular-nums`).

---

## 3. Creative Asset Specifications

### 1. Social Share & OpenGraph Banners
- **Dimensions**: `1200 x 630 px` (Standard 1.91:1 aspect ratio)
- **Format**: PNG with 8-bit alpha or WebP (under 350 KB for instant CDN caching)
- **Safe Zone**: Keep all core text, logos, and UI callouts within the central `1000 x 500 px` bounding box.
- **Copy Structure**:
  - Top: Autonomous Technology Corporation (AUT) Badge
  - Center: QuantBacktest Pro Hero Logo & Subtitle
  - Bottom: Key feature pills (*"60 FPS Replay • AI Strategy Studio • MQL5 / Pine Script Export • Prop Firm Shield"*)

### 2. High-Framerate Replay Demo GIFs / WebPs
- **Dimensions**: `1280 x 720 px` (16:9 720p HD)
- **Framerate**: 30 to 60 FPS
- **Duration**: 6 to 12 seconds per clip, perfectly looped.
- **Maximum File Size**: $< 8$ MB (lossless color quantizing via `ffmpeg` / `gifsicle`).
- **Core Scenes**:
  - Clip A: Scrubbing the Replay Bar smoothly at 50x speed across 100,000 candles.
  - Clip B: Typing an AI strategy prompt and seeing instant trades appear on chart.
  - Clip C: Clicking 1-click export to MT5 MQL5 and Pine Script v5.
  - Clip D: Prop Firm Shield triggering trailing SL protection during a flash drop.

### 3. Product Hunt Showcase Gallery
- **Thumbnail**: `240 x 240 px` animated GIF featuring the pulsing glowing cyan Quant logo.
- **Gallery Images (5 slides)**: `1270 x 760 px`:
  - Slide 1: Workspace Overview (Dark mode with multi-indicators and quick trade dock).
  - Slide 2: 60 FPS Time-Travel Replay & Timeline scrubber.
  - Slide 3: AI Strategy Studio & JSON AST Compiler.
  - Slide 4: Multi-Platform Bot Exporter (MT5, Pine Script, Python, cTrader).
  - Slide 5: Prop Firm Shield & Monte Carlo Risk Analytics.

---
