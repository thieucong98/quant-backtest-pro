import { QuantExecutionBridgeDaemon } from '../../bridge/daemon';
import { WebSocket } from 'ws';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`[FAIL] ${msg}`);
  }
  console.log(`✅ [PASS] ${msg}`);
}

async function runTests() {
  console.log('🧪 Testing QuantExecutionBridgeDaemon HTTP & WS Server...');

  const testPort = 8799;
  const daemon = new QuantExecutionBridgeDaemon({
    port: testPort,
    host: '127.0.0.1',
    passphrase: 'test_secret_pass',
    authToken: 'test_token_123',
    defaultBroker: 'MT5_EXNESS',
  });

  await daemon.start();
  assert(daemon.getStatus().isRunning, 'Daemon is running');

  const baseUrl = `http://127.0.0.1:${testPort}`;

  // 1. GET /health
  const healthRes = await fetch(`${baseUrl}/health`);
  assert(healthRes.status === 200, 'GET /health status is 200');
  const healthData = await healthRes.json();
  assert(healthData.version === '2.0.0-enterprise', 'Daemon version matches');

  // 2. POST /v1/webhook Unauthorized
  const badAuthRes = await fetch(`${baseUrl}/v1/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passphrase: 'wrong_secret', symbol: 'EURUSD', action: 'BUY', orderType: 'MARKET' }),
  });
  assert(badAuthRes.status === 401, 'Unauthorized webhook rejected with 401');

  // 3. POST /v1/webhook Authorized BUY order
  const goodWebhookRes = await fetch(`${baseUrl}/v1/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      passphrase: 'test_secret_pass',
      symbol: 'EURUSD',
      action: 'BUY',
      orderType: 'MARKET',
      quantity: 0.5,
      price: 1.0850,
      clientOrderId: 'TV-WH-101',
    }),
  });
  assert(goodWebhookRes.status === 200, 'Authorized webhook accepted with 200');
  const webhookResult = await goodWebhookRes.json();
  assert(webhookResult.success === true, 'Webhook order executed successfully');
  assert(webhookResult.ticket !== undefined, 'Webhook returned broker ticket');

  // 4. GET /v1/positions
  const posRes = await fetch(`${baseUrl}/v1/positions`);
  assert(posRes.status === 200, 'GET /v1/positions returns 200');
  const positions = await posRes.json();
  assert(positions.length >= 1, 'Active position recorded');

  // 5. WebSocket Connection & Wire Protocol
  const ws = new WebSocket(`ws://127.0.0.1:${testPort}/stream`);

  await new Promise<void>((resolve, reject) => {
    ws.on('open', resolve);
    ws.on('error', reject);
  });
  assert(ws.readyState === WebSocket.OPEN, 'WebSocket connected to /stream');

  // 5.1 Send AUTH_REQUEST
  const authMsg = {
    id: 'req-auth-1',
    type: 'AUTH_REQUEST',
    timestamp: Math.floor(Date.now() / 1000),
    payload: { token: 'test_token_123', clientVersion: '2.0.0' },
  };

  const authPromise = new Promise<any>((resolve) => {
    const handler = (data: any) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'AUTH_RESPONSE') {
        ws.off('message', handler);
        resolve(msg);
      }
    };
    ws.on('message', handler);
  });

  ws.send(JSON.stringify(authMsg));
  const authResponse = await authPromise;
  assert(authResponse.payload.authenticated === true, 'WebSocket client authenticated');

  // 5.2 Send HEARTBEAT_PING
  const pingPromise = new Promise<any>((resolve) => {
    const handler = (data: any) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'HEARTBEAT_PONG') {
        ws.off('message', handler);
        resolve(msg);
      }
    };
    ws.on('message', handler);
  });

  ws.send(JSON.stringify({
    id: 'req-ping-1',
    type: 'HEARTBEAT_PING',
    timestamp: Math.floor(Date.now() / 1000),
    payload: {},
  }));
  const pongResponse = await pingPromise;
  assert(pongResponse.type === 'HEARTBEAT_PONG', 'Received HEARTBEAT_PONG');

  // 5.3 Send ORDER_SUBMIT via WebSocket
  const orderPromise = new Promise<any>((resolve) => {
    const handler = (data: any) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'ORDER_EXECUTION_REPORT') {
        ws.off('message', handler);
        resolve(msg);
      }
    };
    ws.on('message', handler);
  });

  ws.send(JSON.stringify({
    id: 'req-order-1',
    type: 'ORDER_SUBMIT',
    timestamp: Math.floor(Date.now() / 1000),
    payload: {
      clientOrderId: 'WS-ORD-001',
      order: {
        symbol: 'GBPUSD',
        side: 'BUY',
        type: 'MARKET',
        lotSize: 0.2,
      },
      broker: 'MT5_EXNESS',
    },
  }));

  const orderReport = await orderPromise;
  assert(orderReport.payload.status === 'FILLED', 'Order filled via WebSocket');
  assert(orderReport.payload.clientOrderId === 'WS-ORD-001', 'Order report clientOrderId matches');

  ws.close();
  await daemon.stop();
  assert(!daemon.getStatus().isRunning, 'Daemon stopped cleanly');

  console.log('🎉 QuantExecutionBridgeDaemon test suite passed!');
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
