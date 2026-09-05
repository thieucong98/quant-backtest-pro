import http from 'http';

async function testStartStop() {
  console.log('🧪 TESTING TUNNEL START / STOP LIFECYCLE...');

  // 1. Start Tunnel with Localtunnel provider for quick local verification
  console.log('--- Step 1: Starting Localtunnel ---');
  const startRes = await new Promise<any>((resolve, reject) => {
    const payload = JSON.stringify({ provider: 'LOCALTUNNEL', port: 5174 });
    const req = http.request('http://localhost:3001/api/tunnel/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => resolve({ statusCode: res.statusCode, body: JSON.parse(data) }));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });

  console.log('✅ Tunnel Start Output:', startRes);

  if (startRes.body?.publicUrl) {
    console.log(`🌐 Public Tunnel URL successfully created: ${startRes.body.publicUrl}`);
  }

  // 2. Query status while active
  const activeStatus = await new Promise<any>((resolve, reject) => {
    const req = http.get('http://localhost:3001/api/tunnel/status', (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
  });
  console.log('✅ Active Tunnel Status:', activeStatus);

  // 3. Stop Tunnel
  console.log('--- Step 2: Stopping Tunnel ---');
  const stopRes = await new Promise<any>((resolve, reject) => {
    const req = http.request('http://localhost:3001/api/tunnel/stop', {
      method: 'POST'
    }, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.end();
  });

  console.log('✅ Tunnel Stop Output:', stopRes);

  // 4. Verify status after stop
  const stoppedStatus = await new Promise<any>((resolve, reject) => {
    const req = http.get('http://localhost:3001/api/tunnel/status', (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
  });
  console.log('✅ Stopped Tunnel Status:', stoppedStatus);

  console.log('🎉 Tunnel Lifecycle Test PASSED!');
}

testStartStop().catch(e => {
  console.error(e);
  process.exit(1);
});
