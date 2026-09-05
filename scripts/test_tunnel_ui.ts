import puppeteer from 'puppeteer';

async function verifyTunnelUI() {
  console.log('🧪 TESTING TUNNEL MODAL UI & VISUAL EXPERIENCE...');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  await page.goto('http://localhost:5174/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));

  // 1. Open Tunnel Modal via Store
  await page.evaluate(() => {
    const { useTunnelStore } = (window as any);
    if (useTunnelStore) {
      useTunnelStore.getState().setTunnelModalOpen(true);
    }
  });

  // If useTunnelStore is not on window, click the Remote button
  const buttonFound = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const remoteBtn = buttons.find(b => b.textContent?.includes('Remote') || b.getAttribute('title')?.includes('Tunnel') || b.getAttribute('title')?.includes('Từ Xa'));
    if (remoteBtn) {
      remoteBtn.click();
      return true;
    }
    return false;
  });

  await new Promise(r => setTimeout(r, 1000));

  // Capture Inactive Modal state
  await page.screenshot({
    path: 'C:\\Users\\thieu\\.gemini\\antigravity-ide\\brain\\5174d4ba-07e8-4655-b85e-608381078547\\audit_tunnel_modal_inactive.png'
  });
  console.log('📸 Captured Inactive Tunnel Modal');

  // 2. Start Tunnel via UI action or API
  await page.evaluate(async () => {
    const res = await fetch('/api/tunnel/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'LOCALTUNNEL', port: 5174 })
    });
    return res.json();
  });

  // Re-fetch status inside UI store
  await page.evaluate(async () => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const refreshBtn = buttons.find(b => b.textContent?.includes('Bật Tunnel') || b.textContent?.includes('Start Public Tunnel'));
    if (refreshBtn) {
      // already started or click
    }
  });

  await new Promise(r => setTimeout(r, 2500));

  // Close and re-open modal to trigger fetchStatus
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const closeBtn = buttons.find(b => b.textContent === 'Đóng' || b.querySelector('svg.lucide-x'));
    closeBtn?.click();
  });

  await new Promise(r => setTimeout(r, 500));

  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const remoteBtn = buttons.find(b => b.textContent?.includes('Remote') || b.getAttribute('title')?.includes('Tunnel') || b.getAttribute('title')?.includes('Từ Xa'));
    remoteBtn?.click();
  });

  await new Promise(r => setTimeout(r, 1500));

  // Capture Active Modal state with Public URL & QR code
  await page.screenshot({
    path: 'C:\\Users\\thieu\\.gemini\\antigravity-ide\\brain\\5174d4ba-07e8-4655-b85e-608381078547\\audit_tunnel_modal_active.png'
  });
  console.log('📸 Captured Active Tunnel Modal');

  // Close modal to see the glowing header
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const closeBtn = buttons.find(b => b.textContent === 'Đóng');
    closeBtn?.click();
  });

  await new Promise(r => setTimeout(r, 500));

  await page.screenshot({
    path: 'C:\\Users\\thieu\\.gemini\\antigravity-ide\\brain\\5174d4ba-07e8-4655-b85e-608381078547\\audit_tunnel_header_active.png'
  });
  console.log('📸 Captured Active Header Badge');

  // Stop tunnel to leave clean state
  await page.evaluate(async () => {
    await fetch('/api/tunnel/stop', { method: 'POST' });
  });

  await browser.close();
  console.log('✅ Tunnel UI Verification Completed!');
}

verifyTunnelUI().catch(e => {
  console.error(e);
  process.exit(1);
});
