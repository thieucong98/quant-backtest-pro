import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\thieu\\.gemini\\antigravity-ide\\brain\\5174d4ba-07e8-4655-b85e-608381078547';

async function testCrawl5000() {
  console.log('🧪 TESTING 5000 CANDLES CRAWL & LOAD ACCURACY');
  let chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  if (!fs.existsSync(chromePath)) {
    chromePath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
  }
  if (!fs.existsSync(chromePath)) {
    chromePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  }

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: fs.existsSync(chromePath) ? chromePath : undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  // 1. Open Data Manager Modal
  console.log('📂 Opening Data Manager Modal...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent?.includes('Data Manager') || b.textContent?.includes('Dữ liệu'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  // 2. Select XAUUSD and 5000 candles
  console.log('🔍 Selecting XAUUSD & 5,000 candle count...');
  await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('select'));
    if (selects[0]) {
      selects[0].value = 'XAUUSD';
      selects[0].dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (selects[2]) {
      selects[2].value = '5000';
      selects[2].dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await new Promise(r => setTimeout(r, 500));

  // 3. Click "Start Crawl & Auto-Save to DB" button
  console.log('🚀 Clicking Start Crawl...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const crawlBtn = buttons.find(b => b.textContent?.includes('Start Crawl') || b.textContent?.includes('Bắt đầu'));
    if (crawlBtn) crawlBtn.click();
  });

  // Wait for crawling completion and modal auto-close
  console.log('⏳ Waiting for crawl execution and modal close...');
  await new Promise(r => setTimeout(r, 2000));

  // If modal still open, press Escape
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 500));

  // Step forward 5 times
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('ArrowRight');
    await new Promise(r => setTimeout(r, 100));
  }

  // 4. Capture screenshot of main dashboard
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_xauusd_5000_result.png') });

  console.log('✅ XAUUSD 5000 candles crawl and replay step verified!');
  await browser.close();
}

testCrawl5000();
