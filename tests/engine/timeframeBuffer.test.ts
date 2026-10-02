import { TimestampIndexBuffer, createTimestampIndexBuffer, floorTimestampToTimeframe } from '../../src/engine/timeframeBuffer';
import { Candle } from '../../src/types/market';
import { TIMEFRAME_SECONDS } from '../../src/types/timeframeBuffer';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`[FAIL] ${msg}`);
  }
  console.log(`✅ [PASS] ${msg}`);
}

async function runTests() {
  console.log('🧪 Testing TimestampIndexBuffer O(1) properties...');

  // 1. Empty buffer
  const emptyBuf = new TimestampIndexBuffer([], 60);
  assert(emptyBuf.candleCount === 0, 'Empty buffer candleCount is 0');
  assert(emptyBuf.getCandleIndexAt(1700000020) === -1, 'Empty buffer returns -1');
  assert(emptyBuf.table.length === 0, 'Empty buffer table length is 0');

  // 2. Uniform candles
  const start = 1700000020;
  const count = 500;
  const candles: Candle[] = [];
  for (let i = 0; i < count; i++) {
    candles.push({
      timestamp: start + i * 60,
      open: 100 + i,
      high: 100 + i + 1,
      low: 100 + i - 1,
      close: 100 + i + 0.5,
      volume: 1000,
    });
  }

  const buf = new TimestampIndexBuffer(candles, 60);
  assert(buf.candleCount === count, `Candle count is ${count}`);
  assert(buf.baseTimestamp === start, 'baseTimestamp matches first candle');
  assert(buf.endTimestamp === start + (count - 1) * 60, 'endTimestamp matches last candle');
  assert(buf.table.length === count, 'Total slots matches candle count for uniform 60s bars');

  // Exact lookups
  assert(buf.getCandleIndexAt(start) === 0, 'Lookup at start returns 0');
  assert(buf.getCandleIndexAt(start + 120 * 60) === 120, 'Lookup at bar 120 returns 120');
  assert(buf.getCandleIndexAt(start + 499 * 60) === 499, 'Lookup at bar 499 returns 499');

  // Clamping
  assert(buf.getCandleIndexAt(start - 1000) === 0, 'Lookup before start clamps to 0');
  assert(buf.getCandleIndexAt(start + 1000000) === 499, 'Lookup after end clamps to 499');

  // Intrabar lookup
  assert(buf.getCandleIndexAt(start + 30) === 0, 'Lookup mid-candle returns current candle index');
  const detailed = buf.getDetailedLookup(start + 30);
  assert(detailed.candleIndex === 0, 'Detailed lookup candleIndex is 0');
  assert(Math.abs(detailed.interpolatedProgress! - 0.5) < 0.01, 'Interpolated progress is ~0.5 at +30s');

  // 3. Weekend/Gap Handling
  const gapCandles: Candle[] = [
    { timestamp: 1000, open: 1, high: 2, low: 0.5, close: 1.5, volume: 10 },
    // Gap of 300s (5 intervals)
    { timestamp: 1300, open: 1.5, high: 2.5, low: 1.2, close: 2, volume: 15 },
  ];

  const gapHoldingBuf = new TimestampIndexBuffer(gapCandles, 60, { allowMarketGapHolding: true });
  assert(gapHoldingBuf.getCandleIndexAt(1000) === 0, 'At 1000 -> candle 0');
  assert(gapHoldingBuf.getCandleIndexAt(1120) === 0, 'At 1120 (in gap) -> holds candle 0');
  assert(gapHoldingBuf.getCandleIndexAt(1240) === 0, 'At 1240 (in gap) -> holds candle 0');
  assert(gapHoldingBuf.getCandleIndexAt(1300) === 1, 'At 1300 -> candle 1');

  // 4. Timeframe helper
  const h1Buffer = createTimestampIndexBuffer(candles, 'H1');
  assert(h1Buffer.intervalSeconds === TIMEFRAME_SECONDS.H1, 'createTimestampIndexBuffer configures H1 interval');

  // 5. Floor helper
  assert(floorTimestampToTimeframe(1700000045, 60) === 1700000040, 'floorTimestampToTimeframe floors 45s to 00s');

  // 6. Metrics profile
  const metrics = buf.getMetrics();
  assert(metrics.totalCandles === count, 'Metrics reports totalCandles');
  assert(metrics.allocatedSlots === count, 'Metrics reports allocatedSlots');
  assert(metrics.tableByteLength === count * 4, 'Table byte length is 4 bytes per Int32 slot');

  console.log('🎉 TimestampIndexBuffer test suite passed!');
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
