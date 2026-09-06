import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const outEnDir = path.resolve('docs/assets/en');
const outRootDir = path.resolve('docs/assets');

if (!fs.existsSync(outEnDir)) {
  fs.mkdirSync(outEnDir, { recursive: true });
}

const chromePath = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function saveScreenshot(page, filename) {
  const enPath = path.join(outEnDir, filename);
  const rootPath = path.join(outRootDir, filename);
  await page.screenshot({ path: enPath });
  fs.copyFileSync(enPath, rootPath);
  console.log(`  ✅ Saved English screenshot: docs/assets/en/${filename}`);
}

async function captureEnglishShowcase() {
  console.log(`🚀 Launching browser via ${chromePath} at 1920x1080...`);
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: chromePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  console.log('🌐 Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));

  // Switch to English
  console.log('🇺🇸 Setting application language to English (en)...');
  await page.evaluate(() => {
    localStorage.setItem('quant_lang', 'en');
  });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2500));

  // 1. Dashboard Hero
  console.log('📸 1. Capturing 01_dashboard_hero.png (English)...');
  await saveScreenshot(page, '01_dashboard_hero.png');

  // 2. Data Import Library
  console.log('📸 2. Capturing 02_data_import_library.png (English)...');
  await page.evaluate(() => {
    // Open More Tools menu or Data button
    const buttons = Array.from(document.querySelectorAll('header button'));
    const moreBtn = buttons.find(b => b.innerText.includes('More') || b.title?.includes('Tools'));
    if (moreBtn) moreBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  await page.evaluate(() => {
    const dataItem = Array.from(document.querySelectorAll('button')).find(b => 
      b.innerText.includes('Data') || b.innerText.includes('Import')
    );
    if (dataItem) dataItem.click();
  });
  await new Promise(r => setTimeout(r, 800));

  // Switch to Library tab
  await page.evaluate(() => {
    const libTab = Array.from(document.querySelectorAll('.fixed button')).find(b => 
      b.innerText.includes('Library') || b.innerText.includes('Database') || b.innerText.includes('DB')
    );
    if (libTab) libTab.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await saveScreenshot(page, '02_data_import_library.png');

  // 3. Online Multi-Batch Crawler
  console.log('📸 3. Capturing 03_online_crawler.png (English)...');
  await page.evaluate(() => {
    const crawlTab = Array.from(document.querySelectorAll('.fixed button')).find(b => 
      b.innerText.includes('Online Crawler') || b.innerText.includes('Crawler') || b.innerText.includes('Online')
    );
    if (crawlTab) crawlTab.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await saveScreenshot(page, '03_online_crawler.png');

  // Close data modal
  await page.evaluate(() => {
    const closeBtn = document.querySelector('.fixed .max-w-3xl button') || 
                     Array.from(document.querySelectorAll('.fixed button')).find(b => b.innerText === '✕' || b.title === 'Close');
    if (closeBtn) closeBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // 4. Time-Travel Replay Bar
  console.log('📸 4. Capturing 04_time_travel_replay.png (English)...');
  await page.evaluate(() => {
    const timeBtn = Array.from(document.querySelectorAll('.h-12 button')).find(b => 
      b.title?.includes('Date') || b.title?.includes('Time') || b.innerText.includes('UTC')
    );
    if (timeBtn) timeBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await saveScreenshot(page, '04_time_travel_replay.png');

  // Close time-travel popover
  await page.evaluate(() => {
    const timeBtn = Array.from(document.querySelectorAll('.h-12 button')).find(b => 
      b.title?.includes('Date') || b.title?.includes('Time') || b.innerText.includes('UTC')
    );
    if (timeBtn) timeBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // 5. AI Strategy Studio
  console.log('📸 5. Capturing 05_ai_strategy_studio.png (English)...');
  await page.evaluate(() => {
    const aiBtn = Array.from(document.querySelectorAll('header button')).find(b => 
      b.innerText.includes('AI Studio') || b.title?.includes('AI')
    );
    if (aiBtn) aiBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await saveScreenshot(page, '05_ai_strategy_studio.png');

  // 6. SL/TP Grid Optimizer
  console.log('📸 6. Capturing 06_sltp_grid_optimizer.png (English)...');
  await page.evaluate(() => {
    const optTab = Array.from(document.querySelectorAll('.fixed button')).find(b => 
      b.innerText.includes('Optimizer') || b.innerText.includes('Grid')
    );
    if (optTab) optTab.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await saveScreenshot(page, '06_sltp_grid_optimizer.png');

  // 7. Bot Exporter Hub
  console.log('📸 7. Capturing 07_bot_exporter_hub.png (English)...');
  await page.evaluate(() => {
    const exportTab = Array.from(document.querySelectorAll('.fixed button')).find(b => 
      b.innerText.includes('Export Bot') || b.innerText.includes('Export')
    );
    if (exportTab) exportTab.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await saveScreenshot(page, '07_bot_exporter_hub.png');

  // Close AI Studio
  await page.evaluate(() => {
    const closeBtn = Array.from(document.querySelectorAll('button')).find(b => 
      b.title === 'Close' || b.innerText === '✕' || b.title === 'Đóng' || b.innerText === 'Close'
    );
    if (closeBtn) closeBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // 8. Analytics & Monte Carlo
  console.log('📸 8. Capturing 08_analytics_monte_carlo.png (English)...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('header button'));
    const moreBtn = buttons.find(b => b.innerText.includes('More') || b.title?.includes('Tools'));
    if (moreBtn) moreBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  await page.evaluate(() => {
    const analyticsItem = Array.from(document.querySelectorAll('button')).find(b => 
      b.innerText.includes('Analytics') || b.innerText.includes('Report')
    );
    if (analyticsItem) analyticsItem.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await saveScreenshot(page, '08_analytics_monte_carlo.png');

  await browser.close();
  console.log('\n🎉 ALL 8 ENGLISH SHOWCASE SCREENSHOTS SUCCESSFULLY CAPTURED IN docs/assets/en/!');
}

captureEnglishShowcase().catch(err => {
  console.error('Error capturing English showcase:', err);
  process.exit(1);
});
