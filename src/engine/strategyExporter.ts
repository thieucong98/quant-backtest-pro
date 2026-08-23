import { AIStrategyDefinition } from '../types/strategy';
import { AIService, LLMConfig } from './aiService';

export type ExportPlatform = 'pine' | 'mql5' | 'mql4' | 'python' | 'ctrader' | 'json';

export interface ExportPlatformMeta {
  id: ExportPlatform;
  name: string;
  extension: string;
  language: string;
  badge: string;
  description: string;
  guideTitle: string;
  guideSteps: string[];
}

export const EXPORT_PLATFORMS: Record<ExportPlatform, ExportPlatformMeta> = {
  pine: {
    id: 'pine',
    name: 'TradingView Pine Script (v5)',
    extension: '.pine',
    language: 'pinescript',
    badge: 'TradingView v5',
    description: 'Chiến lược Pine Script v5 hoàn chỉnh với Alert Webhook cho 3Commas, Bybit, Binance, PineConnector.',
    guideTitle: 'Cách triển khai trên TradingView:',
    guideSteps: [
      'Mở TradingView trên trình duyệt hoặc Desktop App.',
      'Mở tab "Pine Editor" ở thanh công cụ dưới cùng.',
      'Dán toàn bộ mã nguồn bên dưới vào và bấm "Save" (Lưu) -> "Add to chart" (Thêm vào biểu đồ).',
      'Để tạo Bot tự động: Bấm "Create Alert" trên biểu đồ và cấu hình Webhook URL của sàn/bot provider.'
    ]
  },
  mql5: {
    id: 'mql5',
    name: 'MetaTrader 5 Expert Advisor (MQL5)',
    extension: '.mq5',
    language: 'cpp',
    badge: 'MT5 EA',
    description: 'Expert Advisor MT5 chuẩn với CTrade, quản lý lot, Stop Loss, Take Profit bằng Pips và Magic Number.',
    guideTitle: 'Cách cài đặt trên MetaTrader 5:',
    guideSteps: [
      'Mở MetaTrader 5 và nhấn phím F4 để mở trình soạn thảo MetaEditor.',
      'Bấm New (Ctrl+N) -> Chọn "Expert Advisor (template)" -> Đặt tên file.',
      'Dán toàn bộ mã nguồn MQL5 vào và nhấn F7 (Compile) để biên dịch thành file .ex5.',
      'Quay lại MT5, kéo EA từ Navigator vào biểu đồ và bật "Algo Trading" trên thanh Toolbar.'
    ]
  },
  mql4: {
    id: 'mql4',
    name: 'MetaTrader 4 Expert Advisor (MQL4)',
    extension: '.mq4',
    language: 'cpp',
    badge: 'MT4 EA',
    description: 'Expert Advisor MT4 kinh điển với OrderSend(), OrderClose(), quản trị rủi ro và slippage chuẩn.',
    guideTitle: 'Cách cài đặt trên MetaTrader 4:',
    guideSteps: [
      'Mở MetaTrader 4 và nhấn F4 để mở MetaEditor 4.',
      'Bấm New -> Expert Advisor -> Đặt tên.',
      'Dán mã MQL4 vào và bấm F7 để Compile thành file .ex4.',
      'Kéo EA vào biểu đồ MT4 và bật "AutoTrading".'
    ]
  },
  python: {
    id: 'python',
    name: 'Python Algorithmic Bot (CCXT + Pandas-TA)',
    extension: '.py',
    language: 'python',
    badge: 'Python 3.11',
    description: 'Bot giao dịch Python độc lập chạy 24/7 trên VPS/Server, kết nối API sàn Crypto (Binance/Bybit/OKX).',
    guideTitle: 'Cách chạy Bot trên VPS / Linux / Windows:',
    guideSteps: [
      'Cài đặt các thư viện cần thiết: pip install ccxt pandas pandas-ta schedule',
      'Mở file bot.py, điền API Key & Secret của sàn giao dịch vào biến cấu hình.',
      'Chạy bot trên terminal: python bot.py (hoặc dùng nohup / systemd để chạy nền 24/7).'
    ]
  },
  ctrader: {
    id: 'ctrader',
    name: 'cTrader cBot (C# .NET)',
    extension: '.cs',
    language: 'csharp',
    badge: 'cTrader C#',
    description: 'cBot C# hiệu năng cao dành cho nền tảng cTrader với độ trễ siêu thấp.',
    guideTitle: 'Cách cài đặt trên cTrader:',
    guideSteps: [
      'Mở cTrader và chọn mục "Automate" (Tự động hóa) ở thanh menu bên trái.',
      'Bấm "+ New" để tạo cBot mới.',
      'Dán mã nguồn C# vào và bấm nút "Build" (Ctrl+B).',
      'Thêm Instance vào biểu đồ và bấm nút "Play" để khởi chạy.'
    ]
  },
  json: {
    id: 'json',
    name: 'Universal Strategy Package (JSON)',
    extension: '.json',
    language: 'json',
    badge: 'Quant JSON',
    description: 'Gói chiến lược tiêu chuẩn đầy đủ (parameters, code, metadata) dùng để Backup, Chia sẻ hoặc Re-import.',
    guideTitle: 'Cách sử dụng:',
    guideSteps: [
      'Tải file .json này về máy tính để lưu trữ backup.',
      'Bạn có thể gửi file này cho thành viên khác hoặc import lại bất cứ lúc nào trong tab "My Strategies" -> "Import".'
    ]
  }
};

export class StrategyExporter {
  /**
   * Chuyển đổi chiến lược sang mã Pine Script v5 cho TradingView
   */
  public static toPineScriptV5(strategy: AIStrategyDefinition, symbol: string = 'XAUUSD'): string {
    const params = strategy.parameters || {};
    const slPips = params.slPips || 20;
    const tpPips = params.tpPips || 40;
    const lot = params.lotSize || 0.1;
    const fastEma = params.fastEmaPeriod || params.emaFast || params.emaPeriod || 9;
    const slowEma = params.slowEmaPeriod || params.emaSlow || 21;
    const rsiPeriod = params.rsiPeriod || 14;

    return `//@version=5
strategy("${strategy.name || 'AI Quant Strategy'}", overlay=true, initial_capital=10000, default_qty_type=strategy.percent_of_equity, default_qty_value=10, commission_type=strategy.commission.percent, commission_value=0.04)

// --- INPUT PARAMETERS ---
fastEmaLen  = input.int(${fastEma}, title="Fast EMA Period", group="Strategy Indicators")
slowEmaLen  = input.int(${slowEma}, title="Slow EMA Period", group="Strategy Indicators")
rsiLen      = input.int(${rsiPeriod}, title="RSI Period", group="Strategy Indicators")
slPips      = input.float(${slPips}, title="Stop Loss (Pips)", group="Risk Management")
tpPips      = input.float(${tpPips}, title="Take Profit (Pips)", group="Risk Management")
lotSize     = input.float(${lot}, title="Fixed Lot Size", group="Risk Management")

// --- INDICATOR CALCULATIONS ---
fastEma = ta.ema(close, fastEmaLen)
slowEma = ta.ema(close, slowEmaLen)
rsiVal  = ta.rsi(close, rsiLen)

plot(fastEma, title="Fast EMA", color=color.new(color.teal, 0), linewidth=2)
plot(slowEma, title="Slow EMA", color=color.new(color.orange, 0), linewidth=2)

// --- ENTRY & EXIT CONDITIONS ---
pipMultiplier = syminfo.mintick * 10
longCondition  = ta.crossover(fastEma, slowEma) and (rsiVal < 70)
shortCondition = ta.crossunder(fastEma, slowEma) and (rsiVal > 30)

// --- EXECUTION LOGIC ---
if (longCondition and strategy.position_size == 0)
    slPrice = close - (slPips * pipMultiplier)
    tpPrice = close + (tpPips * pipMultiplier)
    strategy.entry("AI_BUY", strategy.long, comment="AI BUY @ " + str.tostring(close))
    strategy.exit("Exit_BUY", "AI_BUY", stop=slPrice, limit=tpPrice, alert_message='{"action": "close_buy", "symbol": "${symbol}"}')
    alert('{"action": "buy", "symbol": "${symbol}", "lot": ' + str.tostring(lotSize) + ', "price": ' + str.tostring(close) + ', "sl": ' + str.tostring(slPrice) + ', "tp": ' + str.tostring(tpPrice) + '}', alert.freq_once_per_bar_close)

if (shortCondition and strategy.position_size == 0)
    slPrice = close + (slPips * pipMultiplier)
    tpPrice = close - (tpPips * pipMultiplier)
    strategy.entry("AI_SELL", strategy.short, comment="AI SELL @ " + str.tostring(close))
    strategy.exit("Exit_SELL", "AI_SELL", stop=slPrice, limit=tpPrice, alert_message='{"action": "close_sell", "symbol": "${symbol}"}')
    alert('{"action": "sell", "symbol": "${symbol}", "lot": ' + str.tostring(lotSize) + ', "price": ' + str.tostring(close) + ', "sl": ' + str.tostring(slPrice) + ', "tp": ' + str.tostring(tpPrice) + '}', alert.freq_once_per_bar_close)
`;
  }

  /**
   * Chuyển đổi chiến lược sang MetaTrader 5 Expert Advisor (MQL5)
   */
  public static toMQL5(strategy: AIStrategyDefinition, symbol: string = 'XAUUSD'): string {
    const params = strategy.parameters || {};
    const slPips = params.slPips || 20;
    const tpPips = params.tpPips || 40;
    const lot = params.lotSize || 0.1;
    const fastEma = params.fastEmaPeriod || params.emaFast || params.emaPeriod || 9;
    const slowEma = params.slowEmaPeriod || params.emaSlow || 21;

    return `//+------------------------------------------------------------------+
//|                                     QuantBacktestPro_EA.mq5       |
//|                        Generated by Quant Backtest Pro AI Studio  |
//+------------------------------------------------------------------+
#property copyright "Quant Backtest Pro"
#property link      "https://quantbacktest.pro"
#property version   "1.00"
#property strict

#include <Trade\\Trade.mqh>
CTrade trade;

//--- INPUT PARAMETERS
input group "=== Strategy Parameters ==="
input int    InpFastEMA    = ${fastEma};     // Fast EMA Period
input int    InpSlowEMA    = ${slowEma};    // Slow EMA Period
input int    InpRSIPeriod  = 14;     // RSI Period

input group "=== Risk & Position Management ==="
input double InpLotSize    = ${lot};    // Trading Lot Size
input double InpStopLoss   = ${slPips};   // Stop Loss (Pips)
input double InpTakeProfit = ${tpPips};   // Take Profit (Pips)
input ulong  InpMagicNumber= 987654; // EA Magic Number

//--- Indicator Handles
int handleFastEMA;
int handleSlowEMA;
datetime lastBarTime = 0;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   trade.SetExpertMagicNumber(InpMagicNumber);
   trade.SetMarginMode();
   trade.SetTypeFillingBySymbol(_Symbol);

   handleFastEMA = iMA(_Symbol, _Period, InpFastEMA, 0, MODE_EMA, PRICE_CLOSE);
   handleSlowEMA = iMA(_Symbol, _Period, InpSlowEMA, 0, MODE_EMA, PRICE_CLOSE);

   if(handleFastEMA == INVALID_HANDLE || handleSlowEMA == INVALID_HANDLE)
   {
      Print("[Quant EA] Error initializing indicator handles");
      return INIT_FAILED;
   }

   Print("[Quant EA] Initialized successfully for ", _Symbol);
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   IndicatorRelease(handleFastEMA);
   IndicatorRelease(handleSlowEMA);
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
   // Check for new bar to prevent over-trading
   datetime currentBarTime = iTime(_Symbol, _Period, 0);
   if(currentBarTime == lastBarTime) return;
   lastBarTime = currentBarTime;

   // Read indicator buffers
   double fastEMA[2], slowEMA[2];
   if(CopyBuffer(handleFastEMA, 0, 1, 2, fastEMA) < 2) return;
   if(CopyBuffer(handleSlowEMA, 0, 1, 2, slowEMA) < 2) return;

   bool isCrossUp   = (fastEMA[0] <= slowEMA[0] && fastEMA[1] > slowEMA[1]);
   bool isCrossDown = (fastEMA[0] >= slowEMA[0] && fastEMA[1] < slowEMA[1]);

   // Check if we already have positions open with this Magic Number
   if(PositionsTotal() > 0)
   {
      for(int i = PositionsTotal() - 1; i >= 0; i--)
      {
         ulong ticket = PositionGetTicket(i);
         if(PositionGetString(POSITION_SYMBOL) == _Symbol && PositionGetInteger(POSITION_MAGIC) == InpMagicNumber)
         {
            return; // Maintain open position
         }
      }
   }

   double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
   double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double point = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
   double pipMult = (_Digits == 3 || _Digits == 5) ? 10 * point : point;

   // BUY Signal
   if(isCrossUp)
   {
      double sl = ask - (InpStopLoss * pipMult);
      double tp = ask + (InpTakeProfit * pipMult);
      trade.Buy(InpLotSize, _Symbol, ask, sl, tp, "Quant AI BUY");
      Print("[Quant EA] Sent BUY order @ ", ask);
   }
   // SELL Signal
   else if(isCrossDown)
   {
      double sl = bid + (InpStopLoss * pipMult);
      double tp = bid - (InpTakeProfit * pipMult);
      trade.Sell(InpLotSize, _Symbol, bid, sl, tp, "Quant AI SELL");
      Print("[Quant EA] Sent SELL order @ ", bid);
   }
}
`;
  }

  /**
   * Chuyển đổi chiến lược sang MetaTrader 4 Expert Advisor (MQL4)
   */
  public static toMQL4(strategy: AIStrategyDefinition, symbol: string = 'XAUUSD'): string {
    const params = strategy.parameters || {};
    const slPips = params.slPips || 20;
    const tpPips = params.tpPips || 40;
    const lot = params.lotSize || 0.1;
    const fastEma = params.fastEmaPeriod || params.emaFast || 9;
    const slowEma = params.slowEmaPeriod || params.emaSlow || 21;

    return `//+------------------------------------------------------------------+
//|                                     QuantBacktestPro_EA.mq4       |
//|                        Generated by Quant Backtest Pro AI Studio  |
//+------------------------------------------------------------------+
#property copyright "Quant Backtest Pro"
#property link      "https://quantbacktest.pro"
#property version   "1.00"
#property strict

//--- INPUT PARAMETERS
extern int    FastEMA     = ${fastEma};
extern int    SlowEMA     = ${slowEma};
extern double LotSize     = ${lot};
extern double StopLoss    = ${slPips};
extern double TakeProfit  = ${tpPips};
extern int    MagicNumber = 987654;
extern int    Slippage    = 3;

datetime lastBarTime = 0;

int OnInit()
{
   Print("[Quant MT4 EA] Started successfully on ", Symbol());
   return(INIT_SUCCEEDED);
}

void OnTick()
{
   if(Time[0] == lastBarTime) return;
   lastBarTime = Time[0];

   double fastPrev = iMA(Symbol(), 0, FastEMA, 0, MODE_EMA, PRICE_CLOSE, 2);
   double fastCurr = iMA(Symbol(), 0, FastEMA, 0, MODE_EMA, PRICE_CLOSE, 1);
   double slowPrev = iMA(Symbol(), 0, SlowEMA, 0, MODE_EMA, PRICE_CLOSE, 2);
   double slowCurr = iMA(Symbol(), 0, SlowEMA, 0, MODE_EMA, PRICE_CLOSE, 1);

   bool buySignal  = (fastPrev <= slowPrev && fastCurr > slowCurr);
   bool sellSignal = (fastPrev >= slowPrev && fastCurr < slowCurr);

   // Count open orders for this EA
   int count = 0;
   for(int i = 0; i < OrdersTotal(); i++)
   {
      if(OrderSelect(i, SELECT_BY_POS, MODE_TRADES))
      {
         if(OrderSymbol() == Symbol() && OrderMagicNumber() == MagicNumber)
            count++;
      }
   }
   if(count > 0) return;

   double pip = (Digits == 3 || Digits == 5) ? Point * 10 : Point;

   if(buySignal)
   {
      double sl = Ask - (StopLoss * pip);
      double tp = Ask + (TakeProfit * pip);
      int ticket = OrderSend(Symbol(), OP_BUY, LotSize, Ask, Slippage, sl, tp, "Quant AI BUY", MagicNumber, 0, clrGreen);
      if(ticket > 0) Print("BUY order opened: ", ticket);
   }
   else if(sellSignal)
   {
      double sl = Bid + (StopLoss * pip);
      double tp = Bid - (TakeProfit * pip);
      int ticket = OrderSend(Symbol(), OP_SELL, LotSize, Bid, Slippage, sl, tp, "Quant AI SELL", MagicNumber, 0, clrRed);
      if(ticket > 0) Print("SELL order opened: ", ticket);
   }
}
`;
  }

  /**
   * Chuyển đổi chiến lược sang Python CCXT Bot (Binance, Bybit, OKX)
   */
  public static toPythonCCXT(strategy: AIStrategyDefinition, symbol: string = 'BTC/USDT'): string {
    const params = strategy.parameters || {};
    const slPips = params.slPips || 20;
    const tpPips = params.tpPips || 40;
    const lot = params.lotSize || 0.01;
    const fastEma = params.fastEmaPeriod || params.emaFast || 9;
    const slowEma = params.slowEmaPeriod || params.emaSlow || 21;

    return `#!/usr/bin/env python3
"""
Quant Backtest Pro - Automated Trading Bot (CCXT + Pandas-TA)
Generated for strategy: ${strategy.name || 'AI Quant Strategy'}
"""
import ccxt
import time
import pandas as pd
import pandas_ta as ta
import schedule
from datetime import datetime

# --- CONFIGURATION ---
EXCHANGE_ID = 'binance'  # 'binance', 'bybit', 'okx'
API_KEY     = 'YOUR_API_KEY_HERE'
API_SECRET  = 'YOUR_API_SECRET_HERE'
SYMBOL      = '${symbol.includes('/') ? symbol : symbol + '/USDT'}'
TIMEFRAME   = '1h'
LOT_SIZE    = ${lot}
FAST_EMA    = ${fastEma}
SLOW_EMA    = ${slowEma}

# Initialize exchange client
exchange = getattr(ccxt, EXCHANGE_ID)({
    'apiKey': API_KEY,
    'secret': API_SECRET,
    'enableRateLimit': True,
    'options': {'defaultType': 'future'}  # or 'spot'
})

def fetch_candles():
    """Fetch OHLCV candles and calculate technical indicators"""
    ohlcv = exchange.fetch_ohlcv(SYMBOL, timeframe=TIMEFRAME, limit=100)
    df = pd.DataFrame(ohlcv, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
    df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')

    # Indicators via pandas-ta
    df['fast_ema'] = ta.ema(df['close'], length=FAST_EMA)
    df['slow_ema'] = ta.ema(df['close'], length=SLOW_EMA)
    df['rsi']      = ta.rsi(df['close'], length=14)
    return df

def run_strategy():
    try:
        df = fetch_candles()
        curr = df.iloc[-1]
        prev = df.iloc[-2]

        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {SYMBOL} Close: {curr['close']} | Fast EMA: {curr['fast_ema']:.2f} | Slow EMA: {curr['slow_ema']:.2f}")

        is_cross_up   = (prev['fast_ema'] <= prev['slow_ema']) and (curr['fast_ema'] > curr['slow_ema'])
        is_cross_down = (prev['fast_ema'] >= prev['slow_ema']) and (curr['fast_ema'] < curr['slow_ema'])

        if is_cross_up:
            print(f"🚀 [BUY SIGNAL] Crossover detected @ {curr['close']}")
            # order = exchange.create_market_buy_order(SYMBOL, LOT_SIZE)
            # print("Order placed:", order)
        elif is_cross_down:
            print(f"🔻 [SELL SIGNAL] Crossunder detected @ {curr['close']}")
            # order = exchange.create_market_sell_order(SYMBOL, LOT_SIZE)
            # print("Order placed:", order)

    except Exception as e:
        print(f"❌ Strategy Execution Error: {e}")

if __name__ == '__main__':
    print(f"=== Quant Backtest Pro Bot Started for {SYMBOL} ({TIMEFRAME}) ===")
    run_strategy()
    schedule.every(1).minutes.do(run_strategy)

    while True:
        schedule.run_pending()
        time.sleep(1)
`;
  }

  /**
   * Chuyển đổi chiến lược sang cTrader C# cBot
   */
  public static toCTrader(strategy: AIStrategyDefinition, symbol: string = 'XAUUSD'): string {
    const params = strategy.parameters || {};
    const slPips = params.slPips || 20;
    const tpPips = params.tpPips || 40;
    const lot = params.lotSize || 0.1;
    const fastEma = params.fastEmaPeriod || params.emaFast || 9;
    const slowEma = params.slowEmaPeriod || params.emaSlow || 21;

    return `// -------------------------------------------------------------------------------------------------
//
//    Quant Backtest Pro - cBot Strategy Template (cTrader)
//    Generated for: ${strategy.name || 'AI Quant Strategy'}
//
// -------------------------------------------------------------------------------------------------
using System;
using cAlgo.API;
using cAlgo.API.Indicators;
using cAlgo.API.Internals;

namespace cAlgo.Robots
{
    [Robot(TimeZone = TimeZones.UTC, AccessRights = AccessRights.None)]
    public class QuantAIBot : Robot
    {
        [Parameter("Fast EMA Period", DefaultValue = ${fastEma})]
        public int FastEmaPeriod { get; set; }

        [Parameter("Slow EMA Period", DefaultValue = ${slowEma})]
        public int SlowEmaPeriod { get; set; }

        [Parameter("Volume (Lots)", DefaultValue = ${lot})]
        public double VolumeInLots { get; set; }

        [Parameter("Stop Loss (Pips)", DefaultValue = ${slPips})]
        public double StopLossInPips { get; set; }

        [Parameter("Take Profit (Pips)", DefaultValue = ${tpPips})]
        public double TakeProfitInPips { get; set; }

        private ExponentialMovingAverage _fastEma;
        private ExponentialMovingAverage _slowEma;

        protected override void OnStart()
        {
            _fastEma = Indicators.ExponentialMovingAverage(Bars.ClosePrices, FastEmaPeriod);
            _slowEma = Indicators.ExponentialMovingAverage(Bars.ClosePrices, SlowEmaPeriod);
            Print("Quant AI cBot started successfully.");
        }

        protected override void OnBar()
        {
            if (Positions.Count > 0) return;

            int prevIndex = Bars.ClosePrices.Count - 2;
            int currIndex = Bars.ClosePrices.Count - 1;

            bool isCrossUp   = (_fastEma.Result[prevIndex] <= _slowEma.Result[prevIndex]) && (_fastEma.Result[currIndex] > _slowEma.Result[currIndex]);
            bool isCrossDown = (_fastEma.Result[prevIndex] >= _slowEma.Result[prevIndex]) && (_fastEma.Result[currIndex] < _slowEma.Result[currIndex]);

            long volumeInUnits = Symbol.QuantityToVolumeInUnits(VolumeInLots);

            if (isCrossUp)
            {
                ExecuteMarketOrder(TradeType.Buy, SymbolName, volumeInUnits, "Quant BUY", StopLossInPips, TakeProfitInPips);
                Print("Executed BUY order @ " + Symbol.Ask);
            }
            else if (isCrossDown)
            {
                ExecuteMarketOrder(TradeType.Sell, SymbolName, volumeInUnits, "Quant SELL", StopLossInPips, TakeProfitInPips);
                Print("Executed SELL order @ " + Symbol.Bid);
            }
        }
    }
}
`;
  }

  /**
   * Xuất gói JSON tiêu chuẩn (Universal Strategy Package)
   */
  public static toJSONPackage(strategy: AIStrategyDefinition, stats?: any): string {
    const packageData = {
      schemaVersion: 'quant.strategy.v2',
      exportedAt: new Date().toISOString(),
      platform: 'Quant Backtest Pro',
      strategy: {
        id: strategy.id,
        name: strategy.name,
        description: strategy.description,
        parameters: strategy.parameters,
        code: strategy.code,
        createdAt: strategy.createdAt
      },
      backtestSummary: stats ? {
        netProfit: stats.netProfit,
        winRate: stats.winRate,
        profitFactor: stats.profitFactor,
        maxDrawdown: stats.maxDrawdownPercent,
        totalTrades: stats.totalTrades
      } : null
    };

    return JSON.stringify(packageData, null, 2);
  }

  /**
   * Gọi AI Transpiler để dịch toàn diện mã nguồn nếu người dùng muốn tùy biến sâu
   */
  public static async aiTranspile(
    platform: ExportPlatform,
    strategy: AIStrategyDefinition,
    config: LLMConfig,
    symbol: string = 'XAUUSD'
  ): Promise<string> {
    const targetMap: Record<ExportPlatform, string> = {
      pine: 'TradingView Pine Script version 5 (//@version=5 strategy())',
      mql5: 'MetaTrader 5 Expert Advisor (.mq5) using #include <Trade/Trade.mqh> and CTrade',
      mql4: 'MetaTrader 4 Expert Advisor (.mq4) using OrderSend and standard MQL4 functions',
      python: 'Python 3 script using ccxt, pandas, and pandas_ta',
      ctrader: 'cTrader cBot in C# .NET using cAlgo.API',
      json: 'Universal JSON strategy format'
    };

    if (platform === 'json') {
      return this.toJSONPackage(strategy);
    }

    const prompt = `Hãy chuyển đổi chính xác đoạn mã thuật toán JavaScript của Quant Backtest Pro sau đây sang mã nguồn ${targetMap[platform]}:

\`\`\`javascript
${strategy.code}
\`\`\`

YÊU CẦU BẮT BUỘC:
- Tên chiến lược: "${strategy.name}"
- Mã tài sản mặc định: "${symbol}"
- CHỈ TRẢ VỀ DUY NHẤT MÃ NGUỒN CODE ĐƯỢC BỌC TRONG CODE BLOCK. KHÔNG GIẢI THÍCH DÀI DÒNG BÊN NGOÀI.
- Đầy đủ tham số đầu vào (Inputs/Parameters), StopLoss, TakeProfit, Lot size và logic vào/ra lệnh hoàn chỉnh, biên dịch được 100%.`;

    const res = await AIService.generateStrategy(prompt, config, symbol);
    return res.code;
  }
}
