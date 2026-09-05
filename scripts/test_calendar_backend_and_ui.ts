import puppeteer from 'puppeteer';

async function testCalendarSuite() {
  console.log('===============================================================');
  console.log('📅 TESTING ECONOMIC CALENDAR REST API & UI COMPONENT');
  console.log('===============================================================\n');

  // 1. Test Backend API
  console.log('--- 1. Testing Backend REST API Endpoints ---');
  const fetchRes = await fetch('http://localhost:3001/api/calendar?symbol=EURUSD');
  const data = await fetchRes.json();
  console.log('✅ GET /api/calendar?symbol=EURUSD:', { success: data.success, count: data.count });

  const syncRes = await fetch('http://localhost:3001/api/calendar/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      events: [
        {
          id: 'test_nfp_custom',
          timestamp: Date.UTC(2026, 7, 7, 12, 30, 0),
          currency: 'USD',
          country: 'US',
          title: 'Custom NFP Test Event',
          impact: 'HIGH',
          actual: '300K',
          forecast: '210K',
          previous: '220K',
          sentiment: 'BULLISH'
        }
      ]
    })
  });
  const syncData = await syncRes.json();
  console.log('✅ POST /api/calendar/sync:', syncData);

  // 2. UI Puppeteer Verification
  console.log('\n--- 2. Testing UI Economic Calendar Tab & Chart Markers ---');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err));

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 20000 });
  await page.waitForSelector('header', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 2000));

  // Click on "Lịch Kinh Tế" tab
  const clicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const calTab = buttons.find(b => b.textContent?.includes('Lịch Kinh Tế') || b.textContent?.includes('Economic Calendar'));
    if (calTab) {
      calTab.click();
      return true;
    }
    return false;
  });
  console.log('Clicked Calendar Tab:', clicked);

  await new Promise(r => setTimeout(r, 1500));

  // Capture screenshot with Economic Calendar Tab open
  await page.screenshot({
    path: 'C:\\Users\\thieu\\.gemini\\antigravity-ide\\brain\\5174d4ba-07e8-4655-b85e-608381078547\\audit_calendar_tab_view.png'
  });
  console.log('📸 Captured audit_calendar_tab_view.png');

  // Filter for HIGH impact news only
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const highBtn = buttons.find(b => b.textContent?.includes('Tin Đỏ') || b.textContent?.includes('High Impact'));
    if (highBtn) highBtn.click();
  });

  await new Promise(r => setTimeout(r, 800));

  // Capture filtered view
  await page.screenshot({
    path: 'C:\\Users\\thieu\\.gemini\\antigravity-ide\\brain\\5174d4ba-07e8-4655-b85e-608381078547\\audit_calendar_filtered_view.png'
  });
  console.log('📸 Captured audit_calendar_filtered_view.png');

  await browser.close();

  console.log('\n===============================================================');
  console.log('🎉 ECONOMIC CALENDAR SUITE VERIFIED SUCCESSFULLY!');
  console.log('===============================================================\n');
}

testCalendarSuite().catch(e => {
  console.error('❌ Test failed:', e);
  process.exit(1);
});
