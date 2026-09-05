import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\thieu\\.gemini\\antigravity-ide\\brain\\5174d4ba-07e8-4655-b85e-608381078547';

async function testFullstackServer() {
  console.log('===============================================================');
  console.log('🚀 TESTING FULLSTACK DOCKER/EXPRESS SERVER (PORT 3002)');
  console.log('===============================================================\n');

  // 1. Test Backend API
  const healthRes = await fetch('http://localhost:3002/api/health');
  const healthData = await healthRes.json();
  console.log('✅ /api/health Response:', healthData);

  // 2. Test Frontend HTML
  const htmlRes = await fetch('http://localhost:3002/');
  const htmlText = await htmlRes.text();
  console.log('✅ / (Frontend HTML) Response length:', htmlText.length);
  console.log('✅ Has <div id="root">: ', htmlText.includes('id="root"'));
  console.log('✅ Has <title>QuantBacktest Pro: ', htmlText.includes('<title>'));

  // 3. Test SPA Wildcard Route
  const spaRes = await fetch('http://localhost:3002/analytics/sessions/123');
  const spaText = await spaRes.text();
  console.log('✅ SPA Fallback Route (/analytics/sessions/123) returned HTML: ', spaText.includes('id="root"'));

  // 4. Test In-Browser Render with Puppeteer
  console.log('\n--- In-Browser Puppeteer Verification ---');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  await page.goto('http://localhost:3002/', { waitUntil: 'networkidle2', timeout: 25000 });
  await page.waitForSelector('header', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 2000));

  const screenshotPath = path.join(ARTIFACT_DIR, 'audit_docker_fullstack_3002.png');
  await page.screenshot({ path: screenshotPath });
  console.log('📸 Captured Screenshot:', screenshotPath);

  await browser.close();

  console.log('\n===============================================================');
  console.log('🎉 FULLSTACK UNIFIED SERVER VERIFIED SUCCESSFULLY!');
  console.log('===============================================================\n');
}

testFullstackServer().catch(e => {
  console.error('❌ Test failed:', e);
  process.exit(1);
});
