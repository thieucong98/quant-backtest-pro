# 🏆 The Global Quant Backtest Challenge: Community Tournament Playbook

> **Autonomous Technology Corporation (AUT) — Chief Marketing & Growth Office (CMO)**  
> **Program**: Global Quant Backtest Tournament (Quarterly Series)  
> **Format**: Open-Source Algorithmic Simulation & Reproducible Backtesting Championship  
> **Target Audience**: Quant Developers, Algo Traders, Prop Firm Candidates, Math & CS Students  

---

## 1. Executive Concept & Flywheel Mechanics

The **Global Quant Backtest Challenge** is an open-source, developer-first quantitative competition designed to build virality, validate trading models, and generate organic community engagement across Discord, Telegram, GitHub, and Twitter/X.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       COMMUNITY TOURNAMENT FLYWHEEL                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   [ Free Open-Source Replay Engine ] ──► [ Download Official Dataset ]      │
│                 ▲                                   │                       │
│                 │                                   ▼                       │
│   [ Global Leaderboard Recognition ] ◄── [ Cryptographic Seed Verification ]│
│                 │                                   │                       │
│                 ▼                                   ▼                       │
│   [ $25,000 Funded Prop Firm Accounts ] ◄ [ Discord Strategy Teardowns ]    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

By providing contestants with a **standardized historical dataset** and requiring submissions via **cryptographically reproducible session seeds**, the tournament eliminates the rampant cherry-picking and fake screenshot culture pervasive in retail trading.

---

## 2. Tournament Structure & Timeline

The tournament operates on a 4-week cadence:

| Week | Phase | Key Milestone | Deliverable |
| :--- | :--- | :--- | :--- |
| **Week 1** | **Registration & Dataset Drop** | Official encrypted dataset hash released (e.g. 5-year M1 XAU/USD & BTC/USDT). | Contestants clone repo, launch local Docker, and join Discord #quant-challenge. |
| **Week 2** | **Sprint 1: In-Sample Optimization** | Strategy development & SL/TP parameter grid sweeps. | Submit intermediate session checkpoint for leaderboard telemetry. |
| **Week 3** | **Sprint 2: Blind Out-of-Sample Forward Test** | Unlocking the hidden out-of-sample forward test slice. | Automated evaluation runs against blind dataset period. |
| **Week 4** | **Grand Finals & Code Teardowns** | Top 10 finalists present algorithmic logic live on YouTube / Discord Stage. | Community voting + Judge evaluation -> Winners announced! |

---

## 3. The Institutional Scoring Formula

To prevent curve-fitted "all-in" gambling bots from winning, rankings are calculated using a **Multi-Factor Institutional Composite Score**:

$$\text{Composite Score} = 0.35 \times \text{Sharpe} + 0.25 \times \text{Sortino} + 0.20 \times \left( \frac{\text{NetProfitPct}}{\text{MaxDDPct}} \right) + 0.10 \times \ln(N_{\text{trades}}) - \text{Penalties}$$

### Metric Weights & Definitions
1. **Sharpe Ratio ($S$)** (35%): Measures risk-adjusted return against zero risk-free rate. Target $> 1.8$.
2. **Sortino Ratio ($S_d$)** (25%): Penalizes only downside volatility. Target $> 2.5$.
3. **Calmar / Recovery Ratio** (20%): Net Profit divided by Maximum Drawdown. Rewards high profitability achieved with minimal capital stress.
4. **Statistical Significance ($\ln(N_{\text{trades}})$)** (10%): Requires minimum sample size. Strategies with fewer than 50 trades receive a 0.5x dampener.
5. **Anti-Curve Fitting Penalties**:
   - If Maximum Drawdown exceeds **6.0%**: Instant Disqualification (matches prop firm standards).
   - If any single trade accounts for $> 35\%$ of total net profits: 25% score reduction.
   - If Average Trade Holding Time is $< 10$ seconds (latency arbitrage hallucination): Disqualified.

---

## 4. Cryptographic Anti-Cheat & Seed Verification Protocol

To guarantee that participants cannot modify local code, falsify results, or edit JSON outputs, QuantBacktest Pro incorporates a built-in **Session Verification Engine**:

```typescript
// Verification Hash Pipeline in QuantBacktest Pro
export interface VerifiedSessionProof {
  sessionId: string;
  datasetHash: string;      // SHA-256 of candles array
  engineVersion: string;    // e.g. "1.3.0"
  randomSeed: string;       // Reproducible pseudo-random seed
  tradesHash: string;       // Merkle root of all executed orders
  compositeScore: number;
  authorSignature: string;
}
```

### The 3-Step Verification Pipeline:
1. **Deterministic Execution**: The entire order matching loop is seeded with a contest-wide cryptographic seed (`CONTEST_2026_Q4_ALPHA`).
2. **Merkle Order Tree**: Every order fill (timestamp, price, volume, direction) is appended to a Merkle tree.
3. **Automated Server Re-run**: Upon submission to the Discord bot, the headless CI runner executes the strategy's JSON AST against the original raw dataset. If the simulated equity curve differs by even $0.01 from the submission, the entry is flagged and rejected.

---

## 5. Prize Pools & Sponsorship Tiers

Total Seasonal Prize Pool: **$50,000 Equivalent** (Funded Accounts + Cash + Pro Subscriptions)

- 🥇 **1st Place**:
  - **$200,000 Funded Account** (sponsored by Partner Prop Firm).
  - $3,000 Cash Prize.
  - Lifetime Institutional Tier access to QuantBacktest Pro.
  - Featured interview on the AUT Engineering blog & Discord.
- 🥈 **2nd Place**:
  - **$100,000 Funded Account**.
  - $1,500 Cash Prize.
  - 2-Year Pro Tier access.
- 🥉 **3rd Place**:
  - **$50,000 Funded Account**.
  - $500 Cash Prize.
  - 1-Year Pro Tier access.
- 🎖️ **Top 10 Finalists**:
  - Free $10,000 Challenge Evaluation vouchers.
  - Verified Quant Champion Discord role and badge.

---

## 6. Discord & Telegram Bot Integration

Community engagement is automated via the **QuantBot CLI**:
- `/challenge register`: Issues contestant ID and cryptographic seed.
- `/challenge submit <proof_file.json>`: Uploads session proof, validates checksums, and updates the real-time leaderboard in `#tournament-leaderboard`.
- `/challenge leaderboard`: Displays the top 20 contestants with live Sharpe, Max DD, and win rates.
- `#strategy-showcase`: Forum channel where eliminated and winning traders share their AST files and discuss parameter plateaus.

---
