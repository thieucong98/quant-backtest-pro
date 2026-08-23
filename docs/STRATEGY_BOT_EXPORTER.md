# Strategy Bot Exporter & Deployment Guide
## Quant Backtest Pro Platform (English)

This document provides step-by-step instructions on converting backtested trading strategies into production-ready bots for **MetaTrader 5**, **MetaTrader 4**, **TradingView**, **Python CCXT**, and **cTrader**.

---

## 1. Supported Platform Formats

| Platform | Extension | Framework / Tech | Production Deployment |
| :--- | :--- | :--- | :--- |
| **TradingView (Pine v5)** | `.pine` / `.txt` | Pine Script v5 `strategy()` | Paste in Pine Editor $\rightarrow$ Create Webhook Alert for 3Commas/Bybit |
| **MetaTrader 5 (MQL5)** | `.mq5` | `#include <Trade\Trade.mqh>` | Open MetaEditor (F4) $\rightarrow$ Compile (F7) $\rightarrow$ Attach EA to MT5 chart |
| **MetaTrader 4 (MQL4)** | `.mq4` | MQL4 `OrderSend()` | Open MetaEditor 4 $\rightarrow$ Compile (F7) $\rightarrow$ Attach EA to MT4 chart |
| **Python Algo Bot** | `.py` | `ccxt`, `pandas-ta`, `schedule` | Run `pip install ccxt pandas-ta` $\rightarrow$ Run `python bot.py` on VPS |
| **cTrader cBot** | `.cs` | C# .NET `cAlgo.API` | Open cTrader Automate $\rightarrow$ Create New cBot $\rightarrow$ Build (Ctrl+B) |
| **Universal JSON** | `.json` | Schema JSON v2 | Backup, share, or re-import strategies into Quant Backtest Pro |

---

## 2. Step-by-Step Deployment Guides

### 2.1. MetaTrader 5 Expert Advisor (MQL5 EA)
1. Open **AI Studio** $\rightarrow$ Click **"Export Bot"** $\rightarrow$ Select **MetaTrader 5 Expert Advisor (MQL5)**.
2. Click **"Download (.mq5)"** or click **"Copy Code"**.
3. Launch MetaTrader 5, press **F4** to open **MetaEditor**.
4. Press **Ctrl + N** $\rightarrow$ Choose **Expert Advisor (template)** $\rightarrow$ Name your EA (e.g. `QuantAI_EA`).
5. Replace default template code with the copied MQL5 code and press **F7 (Compile)**. Verify status reads `0 errors, 0 warnings`.
6. Return to MetaTrader 5, open the Navigator panel (Ctrl + N), and drag your new EA onto the target chart.
7. Click **"Algo Trading"** in the top toolbar to enable autonomous trading.

### 2.2. TradingView Pine Script v5 & Webhook Alerts
1. Open **AI Studio** $\rightarrow$ Click **"Export Bot"** $\rightarrow$ Select **TradingView Pine Script (v5)**.
2. Click **"Copy Code"**.
3. Navigate to [TradingView.com](https://www.tradingview.com/) and open the corresponding asset chart.
4. Click the **"Pine Editor"** tab at the bottom toolbar.
5. Paste the Pine Script v5 code, click **"Save"**, and click **"Add to chart"**.
6. Click the **Clock icon (Create Alert)** on the chart:
   - **Webhook URL**: Enter the webhook endpoint provided by your broker or bridge (e.g. PineConnector, 3Commas).
   - **Message**: The system automatically includes the pre-formatted JSON execution payload (`{{strategy.order.alert_message}}`).

### 2.3. Python Bot (CCXT) on Linux/Windows VPS
1. Download the generated `.py` file to your server or VPS.
2. Install required Python packages via Terminal:
   ```bash
   pip install ccxt pandas pandas-ta schedule
   ```
3. Open `bot.py` in your text editor and insert your Exchange API Key & Secret (Binance / Bybit / OKX).
4. Run the script:
   ```bash
   python bot.py
   # Or run 24/7 in the background on Linux:
   nohup python3 bot.py > bot.log 2>&1 &
   ```

---

## 3. Importing & Exporting JSON Packages

- **Exporting**: Select the **Universal Strategy Package (JSON)** tab to download a `.json` file containing strategy parameters, metadata, and execution code.
- **Importing**: In the **My Strategies (DB)** tab, click **"Import Strategy (.json/.js)"** to upload strategy files directly into your local SQLite database.
