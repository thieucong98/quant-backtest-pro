import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const outDir = path.resolve('docs/assets');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const chromePath = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function captureShowcase() {
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
  await new Promise(r => setTimeout(r, 2500));

  // 1. Dashboard Hero
  console.log('📸 1. Capturing 01_dashboard_hero.png...');
  await page.screenshot({ path: path.join(outDir, '01_dashboard_hero.png') });

  // 2. Data Import Library
  console.log('📸 2. Capturing 02_data_import_library.png...');
  await page.evaluate(() => {
    const dataBtn = Array.from(document.querySelectorAll('header button')).find(b => b.title === 'Dữ liệu');
    if (dataBtn) dataBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Switch to Library tab
  await page.evaluate(() => {
    const libTab = Array.from(document.querySelectorAll('.fixed button')).find(b => b.innerText.includes('Thư Viện') || b.innerText.includes('DB'));
    if (libTab) libTab.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, '02_data_import_library.png') });

  // 3. Online Multi-Batch Crawler
  console.log('📸 3. Capturing 03_online_crawler.png...');
  await page.evaluate(() => {
    const crawlTab = Array.from(document.querySelectorAll('.fixed button')).find(b => b.innerText.includes('Crawl Online'));
    if (crawlTab) crawlTab.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, '03_online_crawler.png') });

  // Close modal
  await page.evaluate(() => {
    const closeBtn = document.querySelector('.fixed .max-w-3xl button');
    if (closeBtn) closeBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // 4. Time-Travel Replay Bar
  console.log('📸 4. Capturing 04_time_travel_replay.png...');
  await page.evaluate(() => {
    const timeBtn = Array.from(document.querySelectorAll('.h-12 button')).find(b => b.title?.includes('Ngày/Giờ') || b.innerText.includes('UTC'));
    if (timeBtn) timeBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, '04_time_travel_replay.png') });

  // Close time-travel popover
  await page.evaluate(() => {
    const timeBtn = Array.from(document.querySelectorAll('.h-12 button')).find(b => b.title?.includes('Ngày/Giờ') || b.innerText.includes('UTC'));
    if (timeBtn) timeBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // 5. AI Strategy Studio
  console.log('📸 5. Capturing 05_ai_strategy_studio.png...');
  await page.evaluate(() => {
    const aiBtn = Array.from(document.querySelectorAll('header button')).find(b => b.innerText.includes('AI Studio'));
    if (aiBtn) aiBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, '05_ai_strategy_studio.png') });

  // 6. SL/TP Grid Optimizer
  console.log('📸 6. Capturing 06_sltp_grid_optimizer.png...');
  await page.evaluate(() => {
    const optTab = Array.from(document.querySelectorAll('.fixed button')).find(b => b.innerText.includes('Tối ưu hóa') || b.innerText.includes('Optimizer'));
    if (optTab) optTab.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, '06_sltp_grid_optimizer.png') });

  // 7. Bot Exporter Hub
  console.log('📸 7. Capturing 07_bot_exporter_hub.png...');
  await page.evaluate(() => {
    const exportTab = Array.from(document.querySelectorAll('.fixed button')).find(b => b.innerText.includes('Xuất Bot') || b.innerText.includes('Export'));
    if (exportTab) exportTab.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, '07_bot_exporter_hub.png') });

  // Close AI Studio
  await page.evaluate(() => {
    const closeBtn = Array.from(document.querySelectorAll('button')).find(b => b.title === 'Đóng' || b.innerText === 'Đóng');
    if (closeBtn) closeBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // 8. Analytics & Monte Carlo
  console.log('📸 8. Capturing 08_analytics_monte_carlo.png...');
  await page.evaluate(() => {
    const analyticsBtn = Array.from(document.querySelectorAll('header button')).find(b => b.title === 'Báo cáo & Phân tích');
    if (analyticsBtn) analyticsBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, '08_analytics_monte_carlo.png') });

  await browser.close();
  console.log('✅ ALL 8 SHOWCASE SCREENSHOTS CAPTURED SUCCESSFULLY IN docs/assets/!');
}

captureShowcase().catch(err => {
  console.error('Error capturing showcase:', err);
  process.exit(1);
});
