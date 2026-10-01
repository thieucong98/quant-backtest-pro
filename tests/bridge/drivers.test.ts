import { BinanceDriver } from '../../bridge/drivers/BinanceDriver';
import { BybitDriver } from '../../bridge/drivers/BybitDriver';
import { IBKRDriver } from '../../bridge/drivers/IBKRDriver';
import { MetaTraderDriver } from '../../bridge/drivers/MetaTraderDriver';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`[FAIL] ${msg}`);
  }
  console.log(`✅ [PASS] ${msg}`);
}

async function runTests() {
  console.log('🧪 Testing Multi-Broker Drivers...');

  // 1. Binance Driver
  const binance = new BinanceDriver();
  await binance.connect({
    brokerType: 'BINANCE',
    gatewayUrl: 'https://fapi.binance.com',
    account: 'test-user',
    apiKey: 'mock-binance-api-key-12345',
    apiSecret: 'mock-binance-secret',
    autoReconnect: true,
    positionMode: 'NETTING',
  });
  assert(binance.isConnected, 'Binance driver connected');
  const binanceAcc = await binance.getAccount();
  assert(binanceAcc.currency === 'USDT', 'Binance currency is USDT');

  const binanceDeal = await binance.submitOrder({
    clientOrderId: 'BIN-001',
    symbol: 'BTCUSDT',
    side: 'BUY',
    type: 'MARKET',
    lotSize: 0.1,
    price: 65000,
  });
  assert(binanceDeal.price === 65000, 'Binance deal filled at 65000');
  const binancePositions = await binance.getPositions();
  assert(binancePositions.length === 1, 'Binance 1 position active');

  const binanceClose = await binance.closePosition({ ticket: binanceDeal.ticket });
  assert(binanceClose.profit !== undefined, 'Binance position closed');

  const binanceSig = binance.generateHmacSignature('symbol=BTCUSDT&timestamp=1700000000', 'secret_key');
  assert(typeof binanceSig === 'string' && binanceSig.length === 64, 'Binance generates valid 64-char HMAC-SHA256 hex');

  // 2. Bybit Driver
  const bybit = new BybitDriver();
  await bybit.connect({
    brokerType: 'BYBIT',
    gatewayUrl: 'https://api.bybit.com',
    account: 'bybit-uta',
    apiKey: 'bybit-mock-key-12345',
    apiSecret: 'bybit-secret',
    autoReconnect: true,
    positionMode: 'NETTING',
  });
  assert(bybit.isConnected, 'Bybit driver connected');
  const bybitDeal = await bybit.submitOrder({
    clientOrderId: 'BYB-001',
    symbol: 'ETHUSDT',
    side: 'BUY',
    type: 'MARKET',
    lotSize: 1.0,
    price: 3500,
  });
  assert(bybitDeal.symbol === 'ETHUSDT', 'Bybit deal symbol is ETHUSDT');
  const bybitSig = bybit.generateBybitSignature(1700000000, 'key', 5000, '{"category":"linear"}', 'sec');
  assert(typeof bybitSig === 'string' && bybitSig.length === 64, 'Bybit generates valid 64-char HMAC-SHA256 hex');

  // 3. IBKR Driver
  const ibkr = new IBKRDriver();
  await ibkr.connect({
    brokerType: 'INTERACTIVE_BROKERS',
    gatewayUrl: '127.0.0.1:7496',
    account: 'U99887766',
    autoReconnect: true,
    positionMode: 'NETTING',
  });
  assert(ibkr.isConnected, 'IBKR driver connected');
  const ibkrDeal = await ibkr.submitOrder({
    clientOrderId: 'IB-001',
    symbol: 'EURUSD',
    side: 'BUY',
    type: 'MARKET',
    lotSize: 1.0,
    price: 1.0850,
  });
  assert(ibkrDeal.ticket > 0, 'IBKR ticket generated');
  const ibkrLatency = await ibkr.checkLatency();
  assert(ibkrLatency > 0, 'IBKR checkLatency returns positive ms');

  // 4. MetaTrader Driver
  const mt5 = new MetaTraderDriver('MT5_EXNESS');
  await mt5.connect({
    brokerType: 'MT5_EXNESS',
    gatewayUrl: 'http://127.0.0.1:8765',
    account: '1234567',
    server: 'Exness-Real10',
    autoReconnect: true,
    positionMode: 'HEDGING',
  });
  assert(mt5.isConnected, 'MetaTrader driver connected');
  const mt5Deal = await mt5.submitOrder({
    clientOrderId: 'MT-001',
    symbol: 'XAUUSD',
    side: 'BUY',
    type: 'MARKET',
    lotSize: 0.5,
    price: 2600.0,
  });
  assert(mt5Deal.price === 2600.0, 'MT5 filled at 2600.0');
  const mt5Close = await mt5.closePosition({ ticket: mt5Deal.ticket });
  assert(mt5Close.ticket > 0, 'MT5 closed position');

  console.log('🎉 Multi-Broker Drivers test suite passed!');
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
