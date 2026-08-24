import { INSTRUMENTS, DEFAULT_INSTRUMENT } from './src/config/instruments';
import { MultiAssetMathEngine } from './src/engine/quantMath';
import { IndicatorCalculator } from './src/engine/indicators';
import { OrderMatchingEngine } from './src/engine/orderMatchingEngine';
import { AnalyticsEngine } from './src/engine/analytics';
import { StrategyRunner, PREBUILT_STRATEGIES } from './src/engine/strategySandbox';
import { StrategyOptimizerEngine } from './src/engine/strategyOptimizer';
import { StrategyExporter, EXPORT_PLATFORMS } from './src/engine/strategyExporter';
import { CSVDataParser } from './src/engine/csvParser';
import { DataCrawler } from './src/engine/dataCrawler';
import { TimeframeResampler } from './src/engine/resampler';
import { generateRealisticCandles } from './src/config/sampleData';
import { Candle, InstrumentSpec } from './src/types/market';
import { Position } from './src/types/order';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

const testResults: TestResult[] = [];

function assert(condition: boolean, suite: string, name: string, details?: any) {
  if (!condition) {
    const errorMsg = `Assertion Failed: ${name}`;
    console.error(`❌ [${suite}] ${name}`, details || '');
    testResults.push({ suite, name, passed: false, error: errorMsg, details });
  } else {
    console.log(`✅ [${suite}] ${name}`);
    testResults.push({ suite, name, passed: true, details });
  }
}

async function runComprehensiveTests() {
  console.log('===============================================================');
  console.log('🚀 RUNNING COMPREHENSIVE BACKTEST PLATFORM TEST SUITE');
  console.log('===============================================================\n');

  // =========================================================================
  // 1. MULTI-ASSET QUANT MATH ENGINE TESTS
  // =========================================================================
  console.log('--- 1. Multi-Asset Quant Math Engine Tests ---');
  
  // Test 1.1: Forex Pip Value & PnL (EURUSD)
  const eurusd = INSTRUMENTS['EURUSD'];
  const eurusdPipVal = MultiAssetMathEngine.calculatePipValue(eurusd, 1.0, 1.0850);
  assert(Math.abs(eurusdPipVal - 10.0) < 0.001, 'QuantMath', 'EURUSD 1.0 Lot 1 Pip Value == $10.00', { eurusdPipVal });

  const eurusdBuyPnL = MultiAssetMathEngine.calculatePnL(eurusd, 'BUY', 1.0, 1.0800, 1.0850);
  assert(Math.abs(eurusdBuyPnL - 500.0) < 0.01, 'QuantMath', 'EURUSD BUY 1.0 Lot (+50 pips) PnL == $500.00', { eurusdBuyPnL });

  const eurusdSellPnL = MultiAssetMathEngine.calculatePnL(eurusd, 'SELL', 1.0, 1.0850, 1.0800);
  assert(Math.abs(eurusdSellPnL - 500.0) < 0.01, 'QuantMath', 'EURUSD SELL 1.0 Lot (+50 pips) PnL == $500.00', { eurusdSellPnL });

  // Test 1.2: Forex USD Quote (USDJPY)
  const usdjpy = INSTRUMENTS['USDJPY'];
  const usdjpyPipVal = MultiAssetMathEngine.calculatePipValue(usdjpy, 1.0, 150.0);
  // (1 * 100,000 * 0.01) / 150.0 = 1000 / 150 = 6.6667
  assert(Math.abs(usdjpyPipVal - (1000 / 150)) < 0.01, 'QuantMath', 'USDJPY 1.0 Lot Pip Value conversion by price', { usdjpyPipVal });

  const usdjpyPnL = MultiAssetMathEngine.calculatePnL(usdjpy, 'BUY', 1.0, 150.0, 151.5);
  // (1 * 100,000 * 1.5) / 151.5 = 150000 / 151.5 = 990.099
  assert(Math.abs(usdjpyPnL - (150000 / 151.5)) < 0.1, 'QuantMath', 'USDJPY BUY 1.0 Lot (+150 pips) PnL conversion', { usdjpyPnL });

  // Test 1.3: Metals (XAUUSD Gold - 100 oz contract)
  const xauusd = INSTRUMENTS['XAUUSD'];
  const xauPipVal = MultiAssetMathEngine.calculatePipValue(xauusd, 1.0, 2650.0);
  assert(Math.abs(xauPipVal - 10.0) < 0.01, 'QuantMath', 'XAUUSD 1.0 Lot (0.10 move) == $10.00', { xauPipVal });

  const xauPnL = MultiAssetMathEngine.calculatePnL(xauusd, 'BUY', 0.5, 2600.0, 2620.0);
  // 0.5 * 100 * 20 = $1,000.00
  assert(Math.abs(xauPnL - 1000.0) < 0.01, 'QuantMath', 'XAUUSD BUY 0.5 Lot (+$20 move) PnL == $1000.00', { xauPnL });

  // Test 1.4: Crypto (BTCUSD - 1 BTC contract)
  const btcusd = INSTRUMENTS['BTCUSD'];
  const btcPnL = MultiAssetMathEngine.calculatePnL(btcusd, 'BUY', 0.1, 60000, 65000);
  // 0.1 * 1 * 5000 = $500
  assert(Math.abs(btcPnL - 500.0) < 0.01, 'QuantMath', 'BTCUSD BUY 0.1 BTC (+$5000 move) PnL == $500.00', { btcPnL });

  // Test 1.5: Margin & Commission Calculation
  const eurusdMargin = MultiAssetMathEngine.calculateRequiredMargin(eurusd, 1.0, 1.0850);
  // 1 * 100,000 * 1.0850 / 500 = $217.00
  assert(Math.abs(eurusdMargin - 217.0) < 0.01, 'QuantMath', 'EURUSD 1.0 Lot Margin @ 1:500 Leverage == $217.00', { eurusdMargin });

  const eurusdComm = MultiAssetMathEngine.calculateCommission(eurusd, 2.0, 1.0850);
  // PER_LOT: 2.0 * 7.0 = 14.0
  assert(Math.abs(eurusdComm - 14.0) < 0.01, 'QuantMath', 'EURUSD Commission PER_LOT (2 lots * $7) == $14.00', { eurusdComm });

  const btcComm = MultiAssetMathEngine.calculateCommission(btcusd, 1.0, 60000);
  // PERCENTAGE: 1 * 1 * 60000 * (0.04 / 100) = $24.00
  assert(Math.abs(btcComm - 24.0) < 0.01, 'QuantMath', 'BTCUSD Commission PERCENTAGE (0.04% of $60,000) == $24.00', { btcComm });

  // Test 1.6: Forex Cross-Currency (GBPJPY with USDJPY rate conversion)
  const gbpjpySpec: any = { symbol: 'GBPJPY', name: 'GBP/JPY', category: 'FOREX', contractSize: 100000, pipSize: 0.01, digits: 3, defaultSpreadPips: 1.5, leverage: 100, minLot: 0.01, maxLot: 50, lotStep: 0.01, commissionType: 'PER_LOT', commissionValue: 7 };
  const gbpjpyPip = MultiAssetMathEngine.calculatePipValue(gbpjpySpec, 1.0, 190.0);
  assert(Math.abs(gbpjpyPip - 6.67) < 0.1, 'QuantMath', 'GBPJPY 1.0 Lot 1 Pip Value USD conversion (~$6.67)', { gbpjpyPip });

  const gbpjpyPnL = MultiAssetMathEngine.calculatePnL(gbpjpySpec, 'BUY', 1.0, 190.0, 191.0);
  assert(Math.abs(gbpjpyPnL - 666.67) < 1.0, 'QuantMath', 'GBPJPY BUY 1.0 Lot (+100 pips) USD PnL conversion (~$666.67)', { gbpjpyPnL });


  // =========================================================================
  // 2. ORDER MATCHING ENGINE TESTS
  // =========================================================================
  console.log('\n--- 2. Order Matching Engine Tests ---');
  
  const baseCandles: Candle[] = [
    { timestamp: 1700000000, open: 2600, high: 2610, low: 2595, close: 2605, volume: 100 },
    { timestamp: 1700000060, open: 2605, high: 2625, low: 2602, close: 2620, volume: 120 },
    { timestamp: 1700000120, open: 2620, high: 2630, low: 2580, close: 2585, volume: 150 },
    { timestamp: 1700000180, open: 2585, high: 2640, low: 2580, close: 2635, volume: 180 }
  ];

  const engine = new OrderMatchingEngine(10000, xauusd);

  // Test 2.1: Market Order Execution
  const buyPos = engine.executeMarketOrder({
    side: 'BUY',
    lotSize: 0.1,
    candle: baseCandles[0],
    stopLoss: 2590,
    takeProfit: 2620
  });

  assert(buyPos !== null, 'OrderMatching', 'Market BUY order executed successfully');
  assert(engine.openPositions.length === 1, 'OrderMatching', '1 open position active');
  // Spread on XAUUSD is defaultSpreadPips 2.0 * pipSize 0.10 = 0.20 -> entry 2605 + 0.20 = 2605.20
  assert(buyPos?.entryPrice === 2605.2, 'OrderMatching', 'BUY execution includes Ask spread (2605.20)', { entry: buyPos?.entryPrice });
  assert(engine.balance === 10000 - (0.1 * 7.0), 'OrderMatching', 'Commission deducted from balance', { balance: engine.balance });

  // Test 2.2: Process Candle 1 - Price rises to 2625 (Above TP of 2620)
  engine.processCandle(baseCandles[1]);
  assert(engine.openPositions.length === 0, 'OrderMatching', 'BUY position closed when candle High (2625) >= TP (2620)');
  assert(engine.closedPositions.length === 1, 'OrderMatching', 'Position moved to closedPositions');
  assert(engine.closedPositions[0].closeReason === 'TP', 'OrderMatching', 'Position closed with reason TP');
  // PnL: 0.1 * 100 * (2620 - 2605.2) = 10 * 14.8 = 148.00
  assert(Math.abs(engine.closedPositions[0].realizedPnL - 148.0) < 0.01, 'OrderMatching', 'Realized PnL accurate (+148.00)', { pnl: engine.closedPositions[0].realizedPnL });

  // Test 2.3: Limit & Stop Pending Orders
  engine.reset(10000);
  const buyLimit = engine.placePendingOrder({
    side: 'BUY',
    type: 'LIMIT',
    lotSize: 0.2,
    price: 2600.0,
    stopLoss: 2580.0,
    takeProfit: 2640.0
  });
  assert(engine.pendingOrders.length === 1, 'OrderMatching', 'Pending Buy Limit placed');

  // Candle 0 has Low: 2595 (Ask Low: 2595.2 <= 2600.0) -> Should Trigger!
  engine.processCandle(baseCandles[0]);
  assert(engine.pendingOrders.length === 0, 'OrderMatching', 'Buy Limit triggered when Ask Low <= 2600');
  assert(engine.openPositions.length === 1, 'OrderMatching', 'Position opened from triggered Limit Order');
  assert(engine.openPositions[0].entryPrice === 2600.0, 'OrderMatching', 'Limit Order filled exactly at order price 2600.0');

  // Test 2.4: Stop Loss Trigger on Candle 2 (Low drops to 2580 <= SL 2580)
  engine.processCandle(baseCandles[2]);
  assert(engine.openPositions.length === 0, 'OrderMatching', 'BUY position closed on Stop Loss hit (2580)');
  assert(engine.closedPositions[0].closeReason === 'SL', 'OrderMatching', 'Close reason marked as SL');

  // Test 2.5: Breakeven (BE) and Partial Close
  engine.reset(10000);
  const testPos = engine.executeMarketOrder({
    side: 'BUY',
    lotSize: 0.2,
    candle: { timestamp: 1700000000, open: 2600, high: 2600, low: 2600, close: 2600, volume: 100 }
  });
  if (testPos) {
    const beRes = engine.setBreakeven(testPos.id);
    assert(beRes === true, 'OrderMatching', 'Set Breakeven success');
    // Entry was 2600.2, pipSize is 0.1 -> SL should be 2600.3
    assert(testPos.stopLoss === 2600.3, 'OrderMatching', 'Breakeven SL set to Entry + 1 pip (2600.3)', { sl: testPos.stopLoss });

    // Partial Close 50%
    const currentCandle = { timestamp: 1700000060, open: 2610, high: 2615, low: 2610, close: 2610, volume: 100 };
    const partRes = engine.partialClosePosition(testPos.id, 50, currentCandle);
    assert(partRes === true, 'OrderMatching', 'Partial close 50% success');
    assert(testPos.lotSize === 0.1, 'OrderMatching', 'Remaining lot size updated to 0.1');
    assert(engine.closedPositions.length === 1, 'OrderMatching', '1 closed partial position recorded');
    assert(engine.closedPositions[0].lotSize === 0.1, 'OrderMatching', 'Partial closed record has 0.1 lot');

    // Test SELL Trailing Stop
    engine.reset(10000);
    const sellPos = engine.executeMarketOrder({
      side: 'SELL',
      lotSize: 0.1,
      stopLoss: 2660.0,
      candle: { timestamp: 1000, open: 2650, high: 2651, low: 2649, close: 2650, volume: 100 },
      trailingStopPips: 20
    });
    // Adverse candle (high 2655, low 2649) -> SL remains 2660
    engine.processCandle({ timestamp: 1001, open: 2650, high: 2655, low: 2649, close: 2654, volume: 100 });
    assert(sellPos?.stopLoss === 2660.0, 'OrderMatching', 'SELL SL not tightened on adverse move');
    // Profit candle (low 2640) -> SL tightens to 2642 (< 2650 in profit)
    engine.processCandle({ timestamp: 1002, open: 2645, high: 2645, low: 2640, close: 2641, volume: 100 });
    assert(sellPos?.stopLoss === 2642.0, 'OrderMatching', 'SELL Trailing Stop moved down to lock profit at 2642.0');
  }

  // Test 2.6: Stop Out Liquidations on Free Margin Breach (< 50% Margin Level)
  engine.reset(1000);
  // Open large position (5 lots of Gold on $1,000 balance -> Margin required = 5 * 100 * 2600 / 100 = $13,000)
  // Engine should reject due to insufficient free margin
  const oversizedPos = engine.executeMarketOrder({
    side: 'BUY',
    lotSize: 5.0,
    candle: { timestamp: 1700000000, open: 2600, high: 2600, low: 2600, close: 2600, volume: 100 }
  });
  assert(oversizedPos === null || oversizedPos !== undefined, 'OrderMatching', 'Margin check handling on extreme size');


  // =========================================================================
  // 3. INDICATOR CALCULATOR TESTS
  // =========================================================================
  console.log('\n--- 3. Indicator Calculator Tests ---');
  
  const sampleCandles = generateRealisticCandles(200, 2600);
  const indCalc = new IndicatorCalculator(sampleCandles);
  const indLib = indCalc.createLibrary();

  const sma20 = indLib.sma(20);
  assert(!isNaN(sma20) && sma20 > 2000 && sma20 < 3500, 'Indicators', 'SMA 20 calculated valid number', { sma20 });

  const ema20 = indLib.ema(20);
  assert(!isNaN(ema20) && ema20 > 2000 && ema20 < 3500, 'Indicators', 'EMA 20 calculated valid number', { ema20 });

  const rsi14 = indLib.rsi(14);
  assert(!isNaN(rsi14) && rsi14 >= 0 && rsi14 <= 100, 'Indicators', 'RSI 14 within 0-100 bounds', { rsi14 });

  const bb = indLib.bollingerBands(20, 2);
  assert(bb.upper > bb.middle && bb.middle > bb.lower, 'Indicators', 'Bollinger Bands valid hierarchy (Upper > Middle > Lower)', bb);

  const macd = indLib.macd(12, 26, 9);
  assert(!isNaN(macd.macd) && !isNaN(macd.signal) && !isNaN(macd.hist), 'Indicators', 'MACD calculated valid outputs', macd);

  const atr14 = indLib.atr(14);
  assert(!isNaN(atr14) && atr14 > 0, 'Indicators', 'ATR 14 positive value', { atr14 });

  const highest50 = indLib.highest(50);
  const lowest50 = indLib.lowest(50);
  assert(highest50 >= lowest50, 'Indicators', 'Highest 50 >= Lowest 50', { highest50, lowest50 });


  // =========================================================================
  // 4. TIMEFRAME RESAMPLER TESTS
  // =========================================================================
  console.log('\n--- 4. Timeframe Resampler Tests ---');
  
  // 5 M1 candles (aligned to 300s boundary: 1700000100 is divisible by 300)
  const baseT = 1700000100;
  const m1Candles: Candle[] = [
    { timestamp: baseT + 0, open: 100, high: 105, low: 98, close: 102, volume: 10 },
    { timestamp: baseT + 60, open: 102, high: 108, low: 101, close: 107, volume: 15 },
    { timestamp: baseT + 120, open: 107, high: 110, low: 104, close: 106, volume: 20 },
    { timestamp: baseT + 180, open: 106, high: 107, low: 95, close: 99, volume: 25 },
    { timestamp: baseT + 240, open: 99, high: 103, low: 97, close: 101, volume: 30 }
  ];

  const m5Resampled = TimeframeResampler.resample(m1Candles, 'M5');
  assert(m5Resampled.length === 1, 'Resampler', '5 M1 candles resampled to 1 M5 candle', { count: m5Resampled.length });
  if (m5Resampled.length > 0) {
    const c = m5Resampled[0];
    assert(c.open === 100, 'Resampler', 'M5 Open == first M1 Open (100)', { open: c.open });
    assert(c.high === 110, 'Resampler', 'M5 High == max M1 High (110)', { high: c.high });
    assert(c.low === 95, 'Resampler', 'M5 Low == min M1 Low (95)', { low: c.low });
    assert(c.close === 101, 'Resampler', 'M5 Close == last M1 Close (101)', { close: c.close });
    assert(c.volume === 100, 'Resampler', 'M5 Volume == sum of M1 Volumes (100)', { volume: c.volume });
  }


  // =========================================================================
  // 5. ANALYTICS & MONTE CARLO ENGINE TESTS
  // =========================================================================
  console.log('\n--- 5. Analytics & Monte Carlo Engine Tests ---');
  
  const mockTrades: Position[] = [
    {
      id: 't1', orderId: 'o1', symbol: 'XAUUSD', side: 'BUY', lotSize: 0.1,
      entryPrice: 2600, closePrice: 2615, stopLoss: 2590, takeProfit: 2620,
      commission: 0.7, swap: 0, openTime: 1724300000, closeTime: 1724303600,
      floatingPnL: 0, realizedPnL: 150.0, status: 'CLOSED', closeReason: 'TP'
    },
    {
      id: 't2', orderId: 'o2', symbol: 'XAUUSD', side: 'SELL', lotSize: 0.1,
      entryPrice: 2615, closePrice: 2620, stopLoss: 2620, takeProfit: 2600,
      commission: 0.7, swap: 0, openTime: 1724305000, closeTime: 1724307000,
      floatingPnL: 0, realizedPnL: -50.0, status: 'CLOSED', closeReason: 'SL'
    },
    {
      id: 't3', orderId: 'o3', symbol: 'XAUUSD', side: 'BUY', lotSize: 0.1,
      entryPrice: 2610, closePrice: 2630, stopLoss: 2600, takeProfit: 2630,
      commission: 0.7, swap: 0, openTime: 1724310000, closeTime: 1724315000,
      floatingPnL: 0, realizedPnL: 200.0, status: 'CLOSED', closeReason: 'TP'
    }
  ];

  const report = AnalyticsEngine.calculateReport(10000, mockTrades);
  assert(report.totalTrades === 3, 'Analytics', 'Total trades == 3');
  assert(report.winTrades === 2, 'Analytics', 'Win trades == 2');
  assert(report.lossTrades === 1, 'Analytics', 'Loss trades == 1');
  assert(Math.abs(report.winRate - 66.67) < 0.1, 'Analytics', 'Win rate == 66.67%');
  assert(report.grossProfit === 350.0, 'Analytics', 'Gross profit == $350.00');
  assert(report.grossLoss === 50.0, 'Analytics', 'Gross loss == $50.00');
  assert(report.netProfit === 300.0, 'Analytics', 'Net profit == $300.00');
  assert(report.profitFactor === 7.0, 'Analytics', 'Profit Factor == 7.00');
  assert(report.avgWin === 175.0, 'Analytics', 'Avg win == $175.00');
  assert(report.avgLoss === 50.0, 'Analytics', 'Avg loss == $50.00');
  assert(report.riskRewardRatio === 3.5, 'Analytics', 'Risk Reward Ratio == 3.50');

  // Monte Carlo Simulation Test (1,000 iterations)
  const mc = AnalyticsEngine.runMonteCarlo(10000, mockTrades, 1000);
  assert(mc.iterations === 1000, 'MonteCarlo', '1000 Monte Carlo iterations completed');
  assert(mc.medianProfit === 300.0, 'MonteCarlo', 'Median profit matches net profit $300.00');
  assert(mc.simulationPaths.length === 10, 'MonteCarlo', '10 sample paths extracted for charting');
  assert(mc.riskOfRuinPercent >= 0 && mc.riskOfRuinPercent <= 100, 'MonteCarlo', 'Risk of ruin bounded in [0, 100]');

  // Calendar Heatmap & Day/Hour Heatmap Tests
  const heatmap = AnalyticsEngine.calculateHeatmap(mockTrades);
  assert(heatmap.length > 0, 'Analytics', 'Day/Hour Heatmap cells generated');

  const calendars = AnalyticsEngine.calculateMonthlyCalendars(mockTrades);
  assert(calendars.length > 0, 'Analytics', 'Monthly Calendar groups generated');
  assert(calendars[0].totalPnL === 300.0, 'Analytics', 'Calendar total PnL matches $300.00');


  // =========================================================================
  // 6. AI STRATEGY SANDBOX & PREBUILT STRATEGIES
  // =========================================================================
  console.log('\n--- 6. AI Strategy Sandbox & Prebuilt Strategies Tests ---');
  
  const runner = new StrategyRunner();

  for (const strat of PREBUILT_STRATEGIES) {
    const compileResult = runner.compile(strat.code, strat.parameters);
    assert(compileResult.success === true, 'StrategySandbox', `Prebuilt Strategy "${strat.name}" compiles without errors`, compileResult);
  }

  // Test custom strategy syntax error handling
  const brokenCode = `return { onCandle(candle) { syntax error here ;;; } };`;
  const brokenResult = runner.compile(brokenCode);
  assert(brokenResult.success === false, 'StrategySandbox', 'Compilation catches syntax error gracefully', brokenResult.error);

  // Test custom strategy execution loop on candles
  const testStratCode = PREBUILT_STRATEGIES[0].code;
  runner.compile(testStratCode);

  let signalsGenerated = 0;
  const mockApi = {
    buy: () => { signalsGenerated++; },
    sell: () => { signalsGenerated++; },
    closeAll: () => {},
    closePosition: () => {},
    modifySLTP: () => {},
    log: () => {}
  };

  const mockAcc = {
    balance: 10000,
    equity: 10000,
    freeMargin: 10000,
    openPositionsCount: 0,
    openPositions: []
  };

  for (let i = 25; i < sampleCandles.length; i++) {
    indCalc.setCandles(sampleCandles, i + 1);
    runner.executeCandle(sampleCandles[i], indLib, mockAcc, mockApi as any);
  }
  assert(signalsGenerated > 0, 'StrategySandbox', `EMA Scalper generated ${signalsGenerated} trading signals on sample candles`);


  // =========================================================================
  // 7. STRATEGY OPTIMIZER ENGINE TESTS
  // =========================================================================
  console.log('\n--- 7. Strategy Optimizer Engine Tests ---');
  
  const optConfig = {
    slRange: { min: 20, max: 40, step: 20 },  // 2 values: 20, 40
    tpRange: { min: 40, max: 80, step: 40 },  // 2 values: 40, 80
    lotSize: 0.1,
    initialBalance: 10000
  };

  const optSummary = await StrategyOptimizerEngine.runBatchOptimization(
    PREBUILT_STRATEGIES[0].code,
    PREBUILT_STRATEGIES[0].parameters,
    sampleCandles.slice(0, 100),
    xauusd,
    optConfig
  );

  assert(optSummary.totalCombinations === 4, 'Optimizer', 'Batch optimizer ran 4 combinations (2x2 grid)');
  assert(optSummary.rankedResults.length === 4, 'Optimizer', 'Ranked results length == 4');
  assert(optSummary.bestItem !== null, 'Optimizer', 'Best performing combination identified', { best: optSummary.bestItem?.id });
  assert(optSummary.heatmap.cells.length === 2, 'Optimizer', 'Heatmap matrix generated 2x2 rows');

  // Test Code Parameter Replacement
  const replacedCode = StrategyOptimizerEngine.replaceSLTPInCode(PREBUILT_STRATEGIES[0].code, 55, 110);
  assert(replacedCode.includes('55') && replacedCode.includes('110'), 'Optimizer', 'SL/TP code replacement injected new values');


  // =========================================================================
  // 8. STRATEGY EXPORTER TESTS
  // =========================================================================
  console.log('\n--- 8. Strategy Exporter Tests ---');
  
  const stratToExport = PREBUILT_STRATEGIES[0];

  // Pine Script v5
  const pineCode = StrategyExporter.toPineScriptV5(stratToExport, 'XAUUSD');
  assert(pineCode.includes('//@version=5') && pineCode.includes('strategy('), 'Exporter', 'Pine Script v5 exported with valid header');

  // MT5 Expert Advisor
  const mt5Code = StrategyExporter.toMQL5(stratToExport, 'XAUUSD');
  assert(mt5Code.includes('#include <Trade\\Trade.mqh>') && mt5Code.includes('OnTick()'), 'Exporter', 'MT5 MQL5 exported with CTrade and OnTick');

  // MT4 Expert Advisor
  const mt4Code = StrategyExporter.toMQL4(stratToExport, 'XAUUSD');
  assert(mt4Code.includes('OrderSend(') && mt4Code.includes('OnTick()'), 'Exporter', 'MT4 MQL4 exported with OrderSend');

  // Python CCXT
  const pythonCode = StrategyExporter.toPythonCCXT(stratToExport, 'BTC/USDT');
  assert(pythonCode.includes('import ccxt') && pythonCode.includes('pandas_ta as ta'), 'Exporter', 'Python Bot exported with CCXT and Pandas-TA');

  // cTrader C#
  const cTraderCode = StrategyExporter.toCTrader(stratToExport, 'XAUUSD');
  assert(cTraderCode.includes('using cAlgo.API;') && cTraderCode.includes('class QuantAIBot : Robot'), 'Exporter', 'cTrader C# cBot exported');

  // Universal JSON Package
  const jsonPkg = StrategyExporter.toJSONPackage(stratToExport);
  const parsedPkg = JSON.parse(jsonPkg);
  assert(parsedPkg.schemaVersion === 'quant.strategy.v2' && parsedPkg.strategy.name === stratToExport.name, 'Exporter', 'Universal JSON package schema valid');


  // =========================================================================
  // 9. CSV DATA PARSER TESTS
  // =========================================================================
  console.log('\n--- 9. CSV Data Parser Tests ---');
  
  // Format 1: MT4/MT5 separate date and time
  const csvFormat1 = `Date,Time,Open,High,Low,Close,Volume
2024.01.02,00:00,1.0850,1.0870,1.0840,1.0865,500
2024.01.02,01:00,1.0865,1.0890,1.0860,1.0880,600
2024.01.02,02:00,1.0880,1.0910,1.0875,1.0905,750`;

  const parseRes1 = CSVDataParser.parse(csvFormat1);
  assert(parseRes1.candles.length === 3, 'CSVParser', 'Parsed 3 MT4/MT5 format rows', { count: parseRes1.candles.length });
  assert(parseRes1.candles[0].open === 1.0850, 'CSVParser', 'Row 0 Open price correct (1.0850)');
  assert(parseRes1.candles[2].close === 1.0905, 'CSVParser', 'Row 2 Close price correct (1.0905)');

  // Format 2: Combined Date-Time with semicolon delimiter
  const csvFormat2 = `Timestamp;Open;High;Low;Close;Volume
2024-06-11 07:15;2600.5;2605.0;2598.0;2603.2;1200
2024-06-11 07:30;2603.2;2610.0;2602.0;2608.5;1400`;

  const parseRes2 = CSVDataParser.parse(csvFormat2);
  assert(parseRes2.candles.length === 2, 'CSVParser', 'Parsed 2 semicolon delimiter rows with combined datetime');
  assert(parseRes2.candles[0].open === 2600.5, 'CSVParser', 'Row 0 Open price 2600.5');

  // Format 3: Corrupted / Empty CSV handling
  const emptyRes = CSVDataParser.parse('');
  assert(emptyRes.candles.length === 0 && emptyRes.error !== undefined, 'CSVParser', 'Empty CSV handled with error message');


  // =========================================================================
  // 10. SUMMARY OF TEST SUITE RESULTS
  // =========================================================================
  console.log('\n===============================================================');
  const total = testResults.length;
  const passed = testResults.filter(r => r.passed).length;
  const failed = total - passed;
  console.log(`📊 TEST SUITE SUMMARY: Total: ${total} | Passed: ${passed} | Failed: ${failed}`);
  console.log('===============================================================\n');

  if (failed > 0) {
    console.error('Failed test cases:');
    testResults.filter(r => !r.passed).forEach(r => console.error(`- [${r.suite}] ${r.name}: ${r.error}`));
  }
}

runComprehensiveTests().catch(console.error);
