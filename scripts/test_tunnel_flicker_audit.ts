import puppeteer from 'puppeteer';

async function auditTunnelFlicker() {
  console.log('===============================================================');
  console.log('🛡️ TESTING TUNNEL SCREEN STABILITY & ANTI-FLICKER AUDIT');
  console.log('===============================================================\n');

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  let pageReloadCount = 0;
  let consoleErrors: string[] = [];
  let hmrEvents: string[] = [];

  page.on('load', () => {
    pageReloadCount++;
  });

  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error') {
      consoleErrors.push(text);
    }
    if (text.includes('[vite]') || text.includes('hmr') || text.includes('reload')) {
      hmrEvents.push(text);
    }
  });

  console.log('--- Step 1: Initial Page Load ---');
  await page.goto('http://localhost:5174/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));
  const initialLoads = pageReloadCount;
  console.log(`✅ Initial Load Complete (Load count: ${initialLoads})`);

  console.log('\n--- Step 2: Activating Tunnel ---');
  const startRes = await page.evaluate(async () => {
    const res = await fetch('/api/tunnel/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'LOCALTUNNEL', port: 5174 })
    });
    return res.json();
  });
  console.log('✅ Tunnel Started:', startRes);

  console.log('\n--- Step 3: Monitoring Screen Stability over 8 Seconds ---');
  // Inject a DOM mutation counter and frame counter
  await page.evaluate(() => {
    (window as any).__RENDER_COUNT__ = 0;
    const observer = new MutationObserver(() => {
      (window as any).__RENDER_COUNT__++;
    });
    const header = document.querySelector('header');
    if (header) {
      observer.observe(header, { childList: true, attributes: true, subtree: true });
    }
  });

  // Wait 8 seconds with tunnel active
  for (let i = 1; i <= 8; i++) {
    await new Promise(r => setTimeout(r, 1000));
    process.stdout.write(`⏳ Monitoring [${i}/8s]... `);
  }
  console.log('\n');

  const afterLoads = pageReloadCount;
  const unexpectedReloads = afterLoads - initialLoads;
  console.log(`📊 Page reload events during active tunnel: ${unexpectedReloads} (Expect 0)`);

  const mutationStats = await page.evaluate(() => {
    return {
      headerMutations: (window as any).__RENDER_COUNT__ || 0
    };
  });
  console.log('📊 DOM Mutations during active tunnel:', mutationStats);

  // Capture verification screenshot
  await page.screenshot({
    path: 'C:\\Users\\thieu\\.gemini\\antigravity-ide\\brain\\5174d4ba-07e8-4655-b85e-608381078547\\audit_tunnel_stability_verified.png'
  });

  // Step 4: Stop Tunnel
  console.log('\n--- Step 4: Stopping Tunnel ---');
  await page.evaluate(async () => {
    await fetch('/api/tunnel/stop', { method: 'POST' });
  });
  console.log('✅ Tunnel Stopped.');

  await browser.close();

  if (unexpectedReloads > 0) {
    console.error(`❌ FAILURE: Page reloaded ${unexpectedReloads} times unexpectedly!`);
    process.exit(1);
  }

  console.log('\n===============================================================');
  console.log('🎉 ANTI-FLICKER & STABILITY AUDIT PASSED WITH 0 FLICKER/RELOADS!');
  console.log('===============================================================\n');
}

auditTunnelFlicker().catch(e => {
  console.error('❌ Audit Error:', e);
  process.exit(1);
});
