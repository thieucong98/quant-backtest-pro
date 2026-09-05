import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\thieu\\.gemini\\antigravity-ide\\brain\\5174d4ba-07e8-4655-b85e-608381078547';

async function testModals() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 812, isMobile: true });

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 20000 });
  await new Promise(r => setTimeout(r, 1500));

  // 1. Test Quick Trade expansion on Mobile
  await page.evaluate(() => {
    const qtBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Quick Trade'));
    if (qtBtn) qtBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'review_mobile_quick_trade_open.png') });
  console.log('📸 Captured review_mobile_quick_trade_open.png');

  // 2. Test Prop Firm Shield collapse/expand
  await page.evaluate(() => {
    const pfBtn = Array.from(document.querySelectorAll('button, div')).find(b => b.textContent?.includes('Giám Sát Rủi Ro') || b.textContent?.includes('Prop Firm'));
    if (pfBtn) (pfBtn as HTMLElement).click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'review_mobile_prop_firm_open.png') });
  console.log('📸 Captured review_mobile_prop_firm_open.png');

  // 3. Test Positions Table Tabs (History, Calendar) on Mobile
  await page.evaluate(() => {
    const calTab = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Lịch Kinh Tế') || b.textContent?.includes('Calendar'));
    if (calTab) calTab.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'review_mobile_calendar_tab.png') });
  console.log('📸 Captured review_mobile_calendar_tab.png');

  await browser.close();
}

testModals().catch(console.error);
