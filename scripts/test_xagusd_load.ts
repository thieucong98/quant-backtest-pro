import puppeteer from 'puppeteer';

async function verifyXagusd() {
  console.log('🧪 TESTING XAGUSD CRAWL & LOAD ACCURACY...');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  await page.goto('http://localhost:5174/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2500));

  // 1. Switch to XAGUSD via Symbol Search or Store
  const switchResult = await page.evaluate(async () => {
    const store = (window as any).__BACKTEST_STORE__?.getState?.();
    if (!store) return { error: 'No store found' };

    await store.setInstrument('XAGUSD');
    const state = (window as any).__BACKTEST_STORE__.getState();
    return {
      symbol: state.instrument.symbol,
      digits: state.instrument.digits,
      contractSize: state.instrument.contractSize,
      currentCandleClose: state.candles[state.currentIndex]?.close,
      totalCandles: state.candles.length
    };
  });

  console.log('📊 Switch to XAGUSD Result:', switchResult);

  // 2. Test Crawling 5000 candles for XAGUSD
  const crawlResult = await page.evaluate(async () => {
    const store = (window as any).__BACKTEST_STORE__?.getState?.();
    if (!store) return { error: 'No store' };

    const { DataCrawler } = await import('/src/engine/dataCrawler.ts');
    const crawled = await DataCrawler.crawlHistoricalCandles('XAGUSD', '5m', 5000);
    store.loadCandles(crawled.candles, 0, 'XAGUSD', 'M5');

    const state = (window as any).__BACKTEST_STORE__.getState();
    return {
      symbol: state.instrument.symbol,
      candlesCount: state.candles.length,
      firstCandle: state.candles[0],
      lastCandle: state.candles[state.candles.length - 1]
    };
  });

  console.log('📊 Crawl & Load 5000 XAGUSD Result:', crawlResult);

  await page.screenshot({
    path: 'C:\\Users\\thieu\\.gemini\\antigravity-ide\\brain\\5174d4ba-07e8-4655-b85e-608381078547\\audit_xagusd_5000_verified.png'
  });

  await browser.close();
  console.log('✅ XAGUSD Verification Complete!');
}

verifyXagusd().catch(e => {
  console.error(e);
  process.exit(1);
});
