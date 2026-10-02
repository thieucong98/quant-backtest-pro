import { ReplaySyncEngine } from '../../src/workers/replaySyncWorker';
import { WorkerOutboundEvent } from '../../src/types/workerSync';
import { Candle } from '../../src/types/market';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`[FAIL] ${msg}`);
  }
  console.log(`✅ [PASS] ${msg}`);
}

async function runTests() {
  console.log('🧪 Testing ReplaySyncEngine in-process...');

  const events: WorkerOutboundEvent[] = [];
  const engine = new ReplaySyncEngine((event) => {
    events.push(event);
  });

  // Generate 60 M1 candles (exactly 1 hour, from 1700000000 to 1700003540)
  const start = 1700000000;
  const candles: Candle[] = [];
  for (let i = 0; i < 60; i++) {
    candles.push({
      timestamp: start + i * 60,
      open: 1.0800 + i * 0.0001,
      high: 1.0805 + i * 0.0001,
      low: 1.0795 + i * 0.0001,
      close: 1.0802 + i * 0.0001,
      volume: 100,
    });
  }

  // 1. LOAD_DATASET
  engine.handleAction({
    type: 'LOAD_DATASET',
    payload: {
      symbol: 'EURUSD',
      candles,
      baseTimeframe: 'M1',
      linkedTimeframes: ['M5', 'H1'],
    },
  });

  assert(events.length >= 2, 'Received DATASET_LOADED and initial FRAME_BATCH');
  assert(events[0].type === 'DATASET_LOADED', 'First event is DATASET_LOADED');
  assert(events[1].type === 'FRAME_BATCH', 'Second event is FRAME_BATCH');

  if (events[1].type === 'FRAME_BATCH') {
    const batch = events[1].payload;
    assert(batch.primaryCandle.timestamp === start, 'Primary candle starts at start epoch');
    assert(batch.secondaryCandle !== undefined, 'Developing secondary candle exists');
    assert(batch.secondaryCandle?.open === candles[0].open, 'Developing secondary open matches first bar');
  }

  // 2. REPLAY_STEP forward 1 bar
  events.length = 0;
  engine.handleAction({
    type: 'REPLAY_STEP',
    payload: {
      direction: 'FORWARD',
      stepCount: 1,
    },
  });

  assert(events.length === 1, 'Step forward emitted 1 FRAME_BATCH event');
  if (events[0].type === 'FRAME_BATCH') {
    const batch = events[0].payload;
    assert(batch.primaryCandle.timestamp === start + 60, 'Primary candle stepped to bar 1');
    assert(batch.secondaryCandle?.close === candles[1].close, 'Developing secondary close updated to bar 1 close');
    assert(batch.secondaryCandle?.volume === 200, 'Developing secondary volume accumulated to 200');
    assert(!batch.isSecondaryNewBar, 'isSecondaryNewBar is false within the same M5 bar');
  }

  // 3. REPLAY_STEP forward 4 more bars (to cross M5 boundary)
  events.length = 0;
  engine.handleAction({
    type: 'REPLAY_STEP',
    payload: {
      direction: 'FORWARD',
      stepCount: 4, // moves to index 5 (time = start + 300)
    },
  });

  assert(events.length === 1, 'Step forward emitted FRAME_BATCH');
  if (events[0].type === 'FRAME_BATCH') {
    const batch = events[0].payload;
    assert(batch.primaryCandle.timestamp === start + 300, 'Primary timestamp is at 300s');
    // Notice linkedTimeframes[0] is M5, so at index 5 (300s) it crosses into next M5 period
    assert(batch.isSecondaryNewBar === true, 'Crossing into next M5 bar flagged isSecondaryNewBar = true');
  }

  // 4. ORDER_SUBMIT
  events.length = 0;
  engine.handleAction({
    type: 'ORDER_SUBMIT',
    payload: {
      clientOrderId: 'TEST-ORD-01',
      symbol: 'EURUSD',
      side: 'BUY',
      type: 'MARKET',
      lotSize: 0.1,
      sl: 1.0750,
      tp: 1.0900,
    },
  });

  assert(events.some((e) => e.type === 'ORDER_EVENT'), 'Order submit produced ORDER_EVENT');
  const orderEvent = events.find((e) => e.type === 'ORDER_EVENT') as any;
  assert(orderEvent.payload.event === 'FILLED', 'Simulated order was FILLED');
  assert(orderEvent.payload.order.side === 'BUY', 'Position side is BUY');

  // 5. REPLAY_SEEK
  events.length = 0;
  engine.handleAction({
    type: 'REPLAY_SEEK',
    payload: {
      targetTimestamp: start + 1800, // half an hour in
    },
  });

  assert(events.some((e) => e.type === 'SEEK_COMPLETE'), 'Seek produced SEEK_COMPLETE');
  const seekEvent = events.find((e) => e.type === 'SEEK_COMPLETE') as any;
  assert(seekEvent.payload.currentTimestamp === start + 1800, 'Seek arrived at target timestamp');
  assert(seekEvent.payload.primarySlice.length === 31, 'Primary slice contains 31 candles (0 to 30)');

  console.log('🎉 ReplaySyncWorker test suite passed!');
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
