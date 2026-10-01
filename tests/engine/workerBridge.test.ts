import { WorkerBridge } from '../../src/engine/workerBridge';
import { Candle } from '../../src/types/market';
import { ReplayFrameBatch } from '../../src/types/workerSync';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`[FAIL] ${msg}`);
  }
  console.log(`✅ [PASS] ${msg}`);
}

async function runTests() {
  console.log('🧪 Testing WorkerBridge controller...');

  const bridge = new WorkerBridge();

  const candles: Candle[] = [
    { timestamp: 1700000000, open: 1.1, high: 1.2, low: 1.0, close: 1.15, volume: 50 },
    { timestamp: 1700000060, open: 1.15, high: 1.25, low: 1.12, close: 1.2, volume: 75 },
    { timestamp: 1700000120, open: 1.2, high: 1.22, low: 1.18, close: 1.19, volume: 60 },
  ];

  let datasetLoaded = false;
  bridge.onDatasetLoaded((data) => {
    datasetLoaded = true;
    assert(data.totalCandles === 3, 'onDatasetLoaded reported 3 candles');
  });

  const batches: ReplayFrameBatch[] = [];
  bridge.onFrameBatch((batch) => {
    batches.push(batch);
  });

  // 1. loadDataset
  bridge.loadDataset({
    symbol: 'EURUSD',
    candles,
    baseTimeframe: 'M1',
    linkedTimeframes: ['M5'],
  });

  assert(datasetLoaded, 'Dataset loaded callback was triggered');
  assert(bridge.isLoaded, 'bridge.isLoaded is true');
  assert(batches.length >= 1, 'Initial frame batch emitted on dataset load');

  // 2. step forward
  batches.length = 0;
  bridge.step('FORWARD', 1);
  assert(batches.length === 1, 'Step emitted 1 frame batch');
  assert(batches[0].masterTimestamp === 1700000060, 'Master timestamp stepped to 1700000060');

  // 3. seek
  let seekResult: any = null;
  bridge.onSeekComplete((res) => {
    seekResult = res;
  });
  bridge.seek(1700000120);
  assert(seekResult !== null, 'Seek complete callback fired');
  assert(seekResult.currentTimestamp === 1700000120, 'Seek timestamp reached 1700000120');

  // 4. Clean termination
  bridge.terminate();
  assert(!bridge.isPlaying, 'Bridge stopped playing after termination');

  console.log('🎉 WorkerBridge test suite passed!');
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
