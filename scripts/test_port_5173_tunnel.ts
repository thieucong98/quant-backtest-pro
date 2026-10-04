import puppeteer from 'puppeteer';

async function testPort3111() {
  console.log('🧪 VERIFYING PORT 3111 FRESH SERVER & TUNNEL...');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  await page.goto('http://localhost:3111/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));

  // 1. Open Tunnel Modal
  await page.evaluate(() => {
    const { useTunnelStore } = (window as any);
    if (useTunnelStore) useTunnelStore.getState().setTunnelModalOpen(true);
  });

  await new Promise(r => setTimeout(r, 800));

  // 2. Start Localtunnel on 3111
  const startResult = await page.evaluate(async () => {
    const res = await fetch('/api/tunnel/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'LOCALTUNNEL', port: 3111 })
    });
    return res.json();
  });
  console.log('🌐 Tunnel Start Result on 3111:', startResult);

  await new Promise(r => setTimeout(r, 2000));

  // Capture modal screenshot on 3111
  await page.screenshot({
    path: 'C:\\Users\\thieu\\.gemini\\antigravity-ide\\brain\\5174d4ba-07e8-4655-b85e-608381078547\\audit_port_3111_tunnel_modal.png'
  });

  // Close modal and observe chart
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const closeBtn = buttons.find(b => b.textContent === 'Đóng' || b.querySelector('svg.lucide-x'));
    closeBtn?.click();
  });

  await new Promise(r => setTimeout(r, 2000));

  // Capture full chart with running tunnel on 3111
  await page.screenshot({
    path: 'C:\\Users\\thieu\\.gemini\\antigravity-ide\\brain\\5174d4ba-07e8-4655-b85e-608381078547\\audit_port_3111_chart_stable.png'
  });

  console.log('📸 Captured 3111 screenshots successfully');
  await browser.close();
}

testPort3111().catch(e => {
  console.error(e);
  process.exit(1);
});
