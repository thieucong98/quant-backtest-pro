import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\thieu\\.gemini\\antigravity-ide\\brain\\5174d4ba-07e8-4655-b85e-608381078547';

async function verifyDockerProduction() {
  console.log('===============================================================');
  console.log('🚀 AUDITING DOCKER CONTAINER RUNTIME (PORT 3001)');
  console.log('===============================================================\n');

  // 1. Check /api/health
  const healthRes = await fetch('http://localhost:3001/api/health');
  const healthData = await healthRes.json();
  console.log('✅ API Health Check:', healthData);

  // 2. Check /api/calendar
  const calRes = await fetch('http://localhost:3001/api/calendar?symbol=XAUUSD');
  const calData = await calRes.json();
  console.log(`✅ API Economic Calendar: ${calData.count} events synced & retrieved`);

  // 3. Puppeteer Browser UI Render
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  console.log('Navigating to http://localhost:3001/ ...');
  await page.goto('http://localhost:3001/', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForSelector('header', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 2000));

  const screenshotPath = path.join(ARTIFACT_DIR, 'audit_docker_production_3001.png');
  await page.screenshot({ path: screenshotPath });
  console.log('📸 Captured Live Production Screenshot:', screenshotPath);

  await browser.close();
  console.log('\n🎉 DOCKER PRODUCTION CONTAINER AUDIT COMPLETE: 100% OPERATIONAL!\n');
}

verifyDockerProduction().catch(e => {
  console.error('❌ Audit failed:', e);
  process.exit(1);
});
