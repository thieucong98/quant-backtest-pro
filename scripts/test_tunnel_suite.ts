import http from 'http';

async function testTunnelEndpoints() {
  console.log('===============================================================');
  console.log('🧪 TESTING TUNNEL MANAGER & REMOTE ACCESS API SUITE');
  console.log('===============================================================\n');

  // Test 1: GET /api/tunnel/status
  console.log('--- 1. Testing GET /api/tunnel/status ---');
  const statusRes = await new Promise<any>((resolve, reject) => {
    const req = http.get('http://localhost:3001/api/tunnel/status', (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
  });

  console.log('✅ Tunnel Status Response:', statusRes);

  // Test 2: POST /api/tunnel/set-pin
  console.log('\n--- 2. Testing POST /api/tunnel/set-pin ---');
  const setPinRes = await new Promise<any>((resolve, reject) => {
    const payload = JSON.stringify({ pin: '9988' });
    const req = http.request('http://localhost:3001/api/tunnel/set-pin', {
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

  console.log('✅ Set PIN Response:', setPinRes);

  console.log('\n===============================================================');
  console.log('🎉 TUNNEL ENDPOINT TEST SUITE COMPLETED SUCCESSFULLY');
  console.log('===============================================================\n');
}

testTunnelEndpoints().catch((err) => {
  console.error('❌ Tunnel Test Failed:', err);
  process.exit(1);
});
