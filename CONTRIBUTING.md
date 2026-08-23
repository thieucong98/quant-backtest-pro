# Contributing to Quant Backtest Pro

Thank you for your interest in contributing to **Quant Backtest Pro**! We are thrilled to welcome community contributions to build the world's most powerful, open-source, web-based algorithmic backtesting and trading simulation platform.

---

## 🌟 Code of Conduct

All contributors and maintainers are expected to uphold our [Code of Conduct](CODE_OF_CONDUCT.md). Please report any unacceptable behavior to the project maintainers.

---

## 🛠️ Getting Started with Local Development

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** / **yarn** / **pnpm**
- **Git**

### 2. Fork & Clone
```bash
git clone https://github.com/your-username/quant-backtest-pro.git
cd quant-backtest-pro
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Start Development Server
```bash
# Start backend SQLite server & Vite frontend concurrently
npm run dev
```

The application will be accessible at: `http://localhost:5173/` (Frontend) and `http://localhost:3001/` (REST API).

---

## 📐 Project Structure

```
quant-backtest-pro/
├── src/
│   ├── components/       # React UI components (Panels, Header, Dialogs)
│   ├── engine/           # Quantitative trading & simulation engines
│   │   ├── aiService.ts          # Multi-LLM provider abstraction
│   │   ├── orderMatchingEngine.ts # Market/Pending order execution engine
│   │   ├── strategySandbox.ts    # JavaScript sandbox runner
│   │   ├── strategyExporter.ts   # Bot transpilers (MT5, Pine, Python, cTrader)
│   │   ├── analytics.ts          # Monte Carlo, Drawdown, Profit Factor math
│   │   ├── indicators.ts         # SMA, EMA, RSI, MACD, Bollinger, ATR math
│   │   └── dataCrawler.ts        # Binance, Yahoo Finance & FX data feeds
│   ├── store/            # Zustand global state management
│   ├── types/            # TypeScript interfaces & types
│   └── i18n/             # Multi-language translations (en, vi, ja, zh)
├── server/               # Express + SQLite persistent storage server
├── docs/                 # Complete architectural & technical documentation
└── public/               # Static assets & market tick sample files
```

---

## 🔄 Pull Request (PR) Workflow

1. **Create a Branch**:
   ```bash
   git checkout -b feature/your-awesome-feature
   # or
   git checkout -b fix/issue-description
   ```
2. **Commit Conventions**:
   Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat(...)`: A new feature or UI capability
   - `fix(...)`: A bug fix or correction
   - `docs(...)`: Documentation changes
   - `refactor(...)`: Code refactoring without changing functionality
   - `perf(...)`: Performance optimization
   - `test(...)`: Adding or updating tests

3. **Verify Build & Types**:
   Ensure there are zero TypeScript compiler errors and the production build passes:
   ```bash
   npm run build
   ```

4. **Submit PR**:
   - Push your branch to GitHub.
   - Open a Pull Request against the `master` / `main` branch.
   - Provide a clear description of the changes, screenshots, and testing steps.

---

## 🔒 Security Best Practices
- **Never commit API Keys, secrets, or personal endpoint URLs**.
- Use `.env` or in-app `localStorage` configuration for user credentials.

Thank you for contributing! 🚀
