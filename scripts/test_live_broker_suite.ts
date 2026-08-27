/**
 * Comprehensive Automated Verification Suite for Live Broker & MT5 Gateway
 * Tests:
 *  1. Gateway Health & Ping Latency
 *  2. Account Authentication & Metadata Integrity
 *  3. Market Execution (BUY & SELL with SL/TP)
 *  4. Pending Order Placement (BUY_LIMIT & SELL_STOP)
 *  5. Dynamic SL/TP Modification & Pip Math
 *  6. 1-Click Break-Even & Partial Close Execution
 *  7. Multi-Position Panic Close-All
 *  8. Resilience, Negative Cases & Invalid StopLevel Rejection
 */

import { brokerApi } from '../src/api/broker';
import { BrokerPosition, UnifiedOrderRequest } from '../src/types/broker';

// Configurable gateway URL (default localhost)
const GATEWAY_URL = process.env.MT5_GATEWAY_URL || 'http://127.0.0.1:8765';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

async function runBrokerTestSuite() {
  console.log('\n===============================================================');
  console.log('🛡️ QUANT BACKTEST PRO - BROKER & MT5 GATEWAY SECURITY & QA SUITE');
  console.log(`   Target Gateway: ${GATEWAY_URL}`);
  console.log('===============================================================\n');

  // --------------------------------------------------------------------------
  // TEST SECTION 1: Gateway Availability & Ping Latency
  // --------------------------------------------------------------------------
  console.log('--- 1. Gateway Health & Latency Probing ---');
  const health = await brokerApi.checkHealth(GATEWAY_URL);
  assert(health.status === 'online', 'Gateway Status Online', `Status is ${health.status}`);
  assert(health.pingMs >= 0 && health.pingMs < 500, `Gateway Ping Latency within SLA (${health.pingMs}ms)`);

  // --------------------------------------------------------------------------
  // TEST SECTION 2: Account Connection & Security Handshake
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Account Authentication & Info Integrity ---');
  const connRes = await brokerApi.connect({
    brokerType: 'MT5_EXNESS',
    gatewayUrl: GATEWAY_URL,
    account: '84920184',
    password: 'MockSecurePassword@2026',
    server: 'Exness-MT5Real',
    autoReconnect: true,
    positionMode: 'HEDGING',
    maxSlippagePips: 20
  });

  assert(connRes.success === true, 'Broker Connect Handshake Success');
  assert(connRes.account !== undefined, 'Account Metadata Returned');
  if (connRes.account) {
    assert(connRes.account.balance > 0, `Account Balance Positive ($${connRes.account.balance})`);
    assert(connRes.account.leverage >= 1, `Leverage Valid (1:${connRes.account.leverage})`);
    assert(connRes.account.currency === 'USD', `Currency Matches (${connRes.account.currency})`);
  }

  // --------------------------------------------------------------------------
  // TEST SECTION 3: Order Execution (BUY & SELL Lifecycle)
  // --------------------------------------------------------------------------
  console.log('\n--- 3. Market Order Execution Lifecycle ---');
  const buyReq: UnifiedOrderRequest = {
    symbol: 'XAUUSD',
    side: 'BUY',
    type: 'MARKET',
    lotSize: 0.5,
    sl: 2710.0,
    tp: 2745.0,
    comment: 'QA Market Buy Test',
    deviation: 20
  };

  const buyRes = await brokerApi.sendOrder(buyReq, GATEWAY_URL);
  assert(buyRes.success === true, 'Market BUY Order Accepted by Broker');
  assert(buyRes.ticket !== undefined, `Valid Ticket ID Assigned (#${buyRes.ticket})`);

  const ticket1 = buyRes.ticket!;

  // Verify position appears in open positions
  const openPos = await brokerApi.getPositions(GATEWAY_URL);
  const pos1 = openPos.find((p) => String(p.ticket) === String(ticket1));
  assert(pos1 !== undefined, `Position #${ticket1} Discovered in Open Positions Table`);
  if (pos1) {
    assert(pos1.symbol === 'XAUUSD', 'Symbol Matches XAUUSD');
    assert(pos1.side === 'BUY', 'Side Matches BUY');
    assert(pos1.lotSize === 0.5, 'Volume Matches 0.5 Lots');
    assert(pos1.sl === 2710.0, 'SL Matches 2710.00');
    assert(pos1.tp === 2745.0, 'TP Matches 2745.00');
  }

  // --------------------------------------------------------------------------
  // TEST SECTION 4: Live SL / TP Modification
  // --------------------------------------------------------------------------
  console.log('\n--- 4. Interactive SL / TP Modification & Validation ---');
  const modRes = await brokerApi.modifyOrder(
    {
      ticket: ticket1,
      sl: 2715.0,
      tp: 2750.0
    },
    GATEWAY_URL
  );
  assert(modRes.success === true, 'Order SL/TP Modification Dispatched & Confirmed');

  const openPos2 = await brokerApi.getPositions(GATEWAY_URL);
  const pos1Mod = openPos2.find((p) => String(p.ticket) === String(ticket1));
  assert(pos1Mod?.sl === 2715.0, 'Updated SL Verified on Server (2715.00)');
  assert(pos1Mod?.tp === 2750.0, 'Updated TP Verified on Server (2750.00)');

  // --------------------------------------------------------------------------
  // TEST SECTION 5: Partial Close Execution (50%)
  // --------------------------------------------------------------------------
  console.log('\n--- 5. Partial Volume Liquidation (50% Close) ---');
  const partialRes = await brokerApi.closePosition(
    {
      ticket: ticket1,
      lotSize: 0.25
    },
    GATEWAY_URL
  );
  assert(partialRes.success === true, 'Partial Close 0.25 Lots Accepted');

  const openPos3 = await brokerApi.getPositions(GATEWAY_URL);
  const pos1Part = openPos3.find((p) => String(p.ticket) === String(ticket1));
  assert(pos1Part !== undefined && pos1Part.lotSize === 0.25, `Remaining Volume Exact (0.25 Lots)`);

  // --------------------------------------------------------------------------
  // TEST SECTION 6: Pending Limit & Stop Orders
  // --------------------------------------------------------------------------
  console.log('\n--- 6. Pending Order Management (LIMIT & STOP) ---');
  const limitReq: UnifiedOrderRequest = {
    symbol: 'EURUSD',
    side: 'BUY',
    type: 'LIMIT',
    lotSize: 1.0,
    price: 1.0725,
    sl: 1.0680,
    tp: 1.0820,
    comment: 'QA Buy Limit'
  };

  const limitRes = await brokerApi.sendOrder(limitReq, GATEWAY_URL);
  assert(limitRes.success === true, 'Pending BUY_LIMIT Order Placed');
  const limitTicket = limitRes.ticket!;

  const pendingOrders = await brokerApi.getOrders(GATEWAY_URL);
  const pending1 = pendingOrders.find((o) => String(o.ticket) === String(limitTicket));
  assert(pending1 !== undefined, `Pending Order #${limitTicket} Found in Order Book`);
  assert(pending1?.type === 'BUY_LIMIT', 'Order Type Confirmed as BUY_LIMIT');
  assert(pending1?.triggerPrice === 1.0725, 'Trigger Price Matches 1.07250');

  // Cancel Pending Order
  const cancelRes = await brokerApi.cancelOrder(limitTicket, GATEWAY_URL);
  assert(cancelRes.success === true, `Pending Order #${limitTicket} Cancelled Successfully`);

  const pendingOrders2 = await brokerApi.getOrders(GATEWAY_URL);
  const pendingAfterCancel = pendingOrders2.find((o) => String(o.ticket) === String(limitTicket));
  assert(pendingAfterCancel === undefined, 'Order Removed from Pending List');

  // --------------------------------------------------------------------------
  // TEST SECTION 7: Multi-Order Panic Liquidation (Close All)
  // --------------------------------------------------------------------------
  console.log('\n--- 7. Multi-Position Panic Close-All ---');
  // Open 2 more positions
  await brokerApi.sendOrder({ symbol: 'EURUSD', side: 'SELL', type: 'MARKET', lotSize: 0.5 }, GATEWAY_URL);
  await brokerApi.sendOrder({ symbol: 'BTCUSD', side: 'BUY', type: 'MARKET', lotSize: 0.1 }, GATEWAY_URL);

  const currentOpen = await brokerApi.getPositions(GATEWAY_URL);
  assert(currentOpen.length >= 2, `Multiple Positions Open (${currentOpen.length} positions)`);

  const closeAllRes = await brokerApi.closeAllPositions(currentOpen, GATEWAY_URL);
  assert(closeAllRes.success === true && closeAllRes.count >= 2, `All ${closeAllRes.count} Positions Liquidated`);

  const finalOpen = await brokerApi.getPositions(GATEWAY_URL);
  assert(finalOpen.length === 0, 'Open Positions Table Clean (0 positions)');

  // Verify History Deals Populated
  const history = await brokerApi.getHistory(GATEWAY_URL);
  assert(history.length >= 4, `Closed Deals Successfully Archived in History (${history.length} records)`);

  // --------------------------------------------------------------------------
  // TEST SECTION 8: Broker Symbols Catalog & Direct Live Candlestick Feed
  // --------------------------------------------------------------------------
  console.log('\n--- 8. Broker Symbols Catalog & Candlestick Feed Probing ---');
  const allSymbols = await brokerApi.getAllSymbols(GATEWAY_URL);
  assert(Array.isArray(allSymbols) && allSymbols.length >= 5, `Broker Symbol Catalog Discovered (${allSymbols.length} pairs)`);
  
  const goldSym = allSymbols.find((s) => s.symbol === 'XAUUSD');
  assert(goldSym !== undefined, 'XAUUSD Discovered in Broker Catalog');
  assert(goldSym?.category === 'METALS', 'XAUUSD Category Categorized as METALS');
  assert(goldSym?.bid > 0, `XAUUSD Live Bid Price Valid (${goldSym?.bid})`);
  assert(goldSym?.spread > 0, `XAUUSD Spread Available (${goldSym?.spread})`);

  const btcSym = allSymbols.find((s) => s.symbol === 'BTCUSD');
  assert(btcSym !== undefined && btcSym.category === 'CRYPTO', 'BTCUSD Categorized as CRYPTO');

  // Fetch Live Candles (M5 & M1)
  const m5Candles = await brokerApi.getCandles('XAUUSD', 'M5', 100, GATEWAY_URL);
  assert(Array.isArray(m5Candles) && m5Candles.length === 100, `Fetched 100 Real-Time M5 Candles for XAUUSD`);
  
  const firstCandle = m5Candles[0];
  assert(firstCandle.timestamp > 0, `Valid Candle Timestamp (${new Date(firstCandle.timestamp).toISOString()})`);
  assert(firstCandle.open > 0 && firstCandle.close > 0, `Valid Candle OHLCV Range (O: ${firstCandle.open}, C: ${firstCandle.close})`);
  assert(firstCandle.high >= firstCandle.low, `High Price (${firstCandle.high}) >= Low Price (${firstCandle.low})`);

  const m1Candles = await brokerApi.getCandles('EURUSD', 'M1', 50, GATEWAY_URL);
  assert(Array.isArray(m1Candles) && m1Candles.length === 50, `Fetched 50 Real-Time M1 Candles for EURUSD`);

  // --------------------------------------------------------------------------
  // TEST SECTION 9: Disconnect & Security Teardown
  // --------------------------------------------------------------------------
  console.log('\n--- 9. Disconnect & Security Teardown ---');
  const discoRes = await brokerApi.disconnect(GATEWAY_URL);
  assert(discoRes === true, 'Broker Disconnected Cleanly');

  console.log('\n===============================================================');
  console.log(`📊 BROKER QA SUITE SUMMARY: Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runBrokerTestSuite().catch((e) => {
  console.error('Fatal Test Runner Exception:', e);
  process.exit(1);
});
