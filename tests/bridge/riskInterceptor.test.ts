import { PreTradeRiskShieldInterceptor } from '../../bridge/security/riskInterceptor';
import { BrokerAccount, BrokerPosition } from '../../src/types/broker';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`[FAIL] ${msg}`);
  }
  console.log(`✅ [PASS] ${msg}`);
}

async function runTests() {
  console.log('🧪 Testing PreTradeRiskShieldInterceptor...');

  const interceptor = new PreTradeRiskShieldInterceptor({
    maxDailyLossPct: 5.0,
    maxTrailingDrawdownPct: 10.0,
    maxTotalOpenLots: 10.0,
    maxOrderLotSize: 2.0,
    maxAllowedLatencyMs: 200,
    newsRestrictionMinutes: 5,
    weekendHoldingRestriction: true,
  }, 100000, 'SIMULATION');

  const mockAccount: BrokerAccount = {
    login: 12345,
    brokerName: 'TestBroker',
    server: 'Demo',
    currency: 'USD',
    leverage: 100,
    balance: 100000,
    equity: 100000,
    margin: 0,
    freeMargin: 100000,
    marginLevel: 0,
    profit: 0,
    pingMs: 25,
    isLive: false,
  };

  const openPositions: BrokerPosition[] = [];

  // 1. Normal order passes
  const res1 = interceptor.evaluatePreTradeRisk({
    order: { clientOrderId: 'ORD-1', symbol: 'EURUSD', side: 'BUY', type: 'MARKET', lotSize: 1.0 },
    currentAccount: mockAccount,
    openPositions,
    currentTimestamp: 1700040000, // Thursday midday UTC
  });
  assert(res1.allowed, 'Normal 1.0 lot order is allowed');

  // 2. Idempotent duplicate rejected
  const resDuplicate = interceptor.evaluatePreTradeRisk({
    order: { clientOrderId: 'ORD-1', symbol: 'EURUSD', side: 'BUY', type: 'MARKET', lotSize: 1.0 },
    currentAccount: mockAccount,
    openPositions,
    currentTimestamp: 1700040010,
  });
  assert(!resDuplicate.allowed, 'Duplicate order ID rejected');
  assert(resDuplicate.ruleViolated === 'IDEMPOTENT_DUPLICATE_ORDER', 'Violation code is IDEMPOTENT_DUPLICATE_ORDER');

  // 3. Exceeds maxOrderLotSize
  const resOversize = interceptor.evaluatePreTradeRisk({
    order: { clientOrderId: 'ORD-2', symbol: 'EURUSD', side: 'BUY', type: 'MARKET', lotSize: 3.0 },
    currentAccount: mockAccount,
    openPositions,
    currentTimestamp: 1700040020,
  });
  assert(!resOversize.allowed, 'Order exceeding single lot size limit rejected');
  assert(resOversize.ruleViolated === 'MAX_ORDER_LOT_SIZE_EXCEEDED', 'Violation code is MAX_ORDER_LOT_SIZE_EXCEEDED');

  // 4. Exceeds maxTotalOpenLots
  const existingPositions: BrokerPosition[] = [
    { ticket: 1, symbol: 'EURUSD', side: 'BUY', type: 0, lotSize: 9.0, openPrice: 1.08, currentPrice: 1.08, floatingPnL: 0, swap: 0, commission: 0, openTime: 0 }
  ];
  const resLots = interceptor.evaluatePreTradeRisk({
    order: { clientOrderId: 'ORD-3', symbol: 'EURUSD', side: 'BUY', type: 'MARKET', lotSize: 2.0 },
    currentAccount: mockAccount,
    openPositions: existingPositions,
    currentTimestamp: 1700040030,
  });
  assert(!resLots.allowed, 'Total open lots exceeding 10.0 rejected');
  assert(resLots.ruleViolated === 'MAX_OPEN_LOTS_EXCEEDED', 'Violation code is MAX_OPEN_LOTS_EXCEEDED');

  // 5. Daily loss breach
  const breachedAccount: BrokerAccount = {
    ...mockAccount,
    equity: 94000, // 6% daily loss
  };
  const resDailyLoss = interceptor.evaluatePreTradeRisk({
    order: { clientOrderId: 'ORD-4', symbol: 'EURUSD', side: 'BUY', type: 'MARKET', lotSize: 0.5 },
    currentAccount: breachedAccount,
    openPositions: [],
    currentTimestamp: 1700040040,
  });
  assert(!resDailyLoss.allowed, 'Equity 6% loss triggers MAX_DAILY_LOSS_BREACH');
  assert(resDailyLoss.ruleViolated === 'MAX_DAILY_LOSS_BREACH', 'Violation code is MAX_DAILY_LOSS_BREACH');

  // 6. Latency SLA trip
  interceptor.resetCircuitBreaker();
  interceptor.updateLatency(350); // exceeds 200ms
  const cbStatus = interceptor.getCircuitBreakerStatus();
  assert(cbStatus.isActive, 'Circuit breaker tripped on 350ms latency');

  console.log('🎉 PreTradeRiskShieldInterceptor test suite passed!');
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
