import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\thieu\\.gemini\\antigravity-ide\\brain\\5174d4ba-07e8-4655-b85e-608381078547';

async function testCrawlExact() {
  console.log('🧪 EXACT 5000 CANDLE CRAWL VERIFICATION');
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
  console.log('🔍 Selecting XAUUSD & 5,000 candles...');
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

  // 3. Click Crawl submit button using Puppeteer native click
  console.log('🚀 Finding and Clicking Crawl Submit Button...');
  const crawlButtons = await page.$$('button');
  for (const b of crawlButtons) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text && (text.includes('Bắt đầu Crawl') || text.includes('Start Crawl'))) {
      console.log('🎯 Found submit crawl button:', text.trim());
      await b.click();
      break;
    }
  }

  // 4. Wait for crawl execution & success message
  console.log('⏳ Waiting for crawl progress...');
  await page.waitForFunction(() => {
    return document.body.innerText.includes('5,000') && (document.body.innerText.includes('thành công') || document.body.innerText.includes('Successfully'));
  }, { timeout: 15000 });

  console.log('✅ Crawl success message detected! Waiting for modal auto-close...');
  await new Promise(r => setTimeout(r, 1500));

  // 5. Screenshot the chart and replay bar
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_crawl_5000_verified_final.png') });

  // 6. Check exact state in Replay Bar
  const replayBarText = await page.evaluate(() => {
    const bar = document.querySelector('.bg-\\[\\#111622\\]');
    return document.body.innerText.match(/\d+\/5000/)?.[0] || 'not matched';
  });

  console.log('📊 Replay Bar Candlestick Count:', replayBarText);
  await browser.close();
}

testCrawlExact();
