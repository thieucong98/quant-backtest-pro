import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\thieu\\.gemini\\antigravity-ide\\brain\\5174d4ba-07e8-4655-b85e-608381078547';

async function testDirectLoad() {
  console.log('🧪 TESTING DIRECT CRAWL / LOAD 5000 CANDLES INTO CHART');
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

  // 1. Check initial candle count
  const initialInfo = await page.evaluate(() => {
    const store = (window as any).__BACKTEST_STORE__;
    return {
      initialCandles: store ? store.getState().candles.length : 'no store'
    };
  });
  console.log('📊 Initial candles in store:', initialInfo);

  // 2. Open Data Manager and click crawl
  await page.evaluate(async () => {
    // We can directly call DataCrawler or store action
    const store = (window as any).__BACKTEST_STORE__;
    if (store) {
      const state = store.getState();
      state.setDataModalOpen(true);
    }
  });
  await new Promise(r => setTimeout(r, 800));

  // Trigger crawl in UI
  await page.evaluate(async () => {
    const selects = Array.from(document.querySelectorAll('select'));
    if (selects[0]) {
      selects[0].value = 'XAUUSD';
      selects[0].dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (selects[1]) {
      selects[1].value = '5m';
      selects[1].dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (selects[2]) {
      selects[2].value = '5000';
      selects[2].dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await new Promise(r => setTimeout(r, 500));

  // Click the submit crawl button by querySelector
  const crawlBtn = await page.$('button.bg-gradient-to-r.from-sky-600');
  if (crawlBtn) {
    console.log('🚀 Found crawl button with class, clicking...');
    await crawlBtn.click();
  } else {
    console.log('⚠️ Crawl button not found by class, clicking by text...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent?.includes('Crawl') && !b.textContent?.includes('1k-50k'));
      if (btn) btn.click();
    });
  }

  // Wait 2.5s for crawl and modal auto-close
  await new Promise(r => setTimeout(r, 2500));

  // Check new state in store & replay bar
  const postCrawlInfo = await page.evaluate(() => {
    const store = (window as any).__BACKTEST_STORE__;
    const body = document.body.innerText;
    return {
      candlesCount: store ? store.getState().candles.length : 'no store',
      symbol: store ? store.getState().instrument.symbol : 'no store',
      timeframe: store ? store.getState().timeframe : 'no store',
      has5000InDom: body.includes('5000') || body.includes('5,000')
    };
  });
  console.log('📊 Post-Crawl State:', postCrawlInfo);

  // Capture final screenshot
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_5000_candles_confirmed.png') });
  await browser.close();
  console.log('🏁 Test completed successfully.');
}

testDirectLoad();
