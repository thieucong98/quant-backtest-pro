import puppeteer from 'puppeteer';

async function run() {
  console.log('Connecting to browser or launching Puppeteer...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });

    console.log('Navigating to http://127.0.0.1:3111/...');
    await page.goto('http://127.0.0.1:3111/', { waitUntil: 'networkidle2', timeout: 30000 });

    // Click AI Strategy Studio button or trigger modal
    console.log('Opening AI Strategy Studio modal...');
    await page.evaluate(() => {
      // Find button that contains AI Strategy Studio or trigger directly
      const buttons = Array.from(document.querySelectorAll('button'));
      const aiBtn = buttons.find(b => b.textContent?.includes('AI Strategy') || b.textContent?.includes('AI Studio') || b.textContent?.includes('Copilot'));
      if (aiBtn) aiBtn.click();
      else {
        // Fallback to store if exposed
        const store = (window as any).__backtestStore;
        if (store) store.getState().setAIModalOpen(true, 'optimizer');
      }
    });

    await new Promise(r => setTimeout(r, 1000));

    // Switch to 'Grid Optimizer' tab if not already on it
    console.log('Switching to Grid Optimizer tab...');
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const optTab = tabs.find(b => b.textContent?.includes('Grid Optimizer') || b.textContent?.includes('Ma Trận'));
      if (optTab) optTab.click();
    });

    await new Promise(r => setTimeout(r, 1000));

    // Click 'Execute Parameter Grid Search' button
    console.log('Clicking Execute Parameter Grid Search...');
    const clicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const runBtn = buttons.find(b => 
        b.textContent?.includes('Execute Parameter Grid Search') || 
        b.textContent?.includes('Chạy Ma Trận Tìm Điểm Tối Ưu') ||
        b.textContent?.includes('Grid Search')
      );
      if (runBtn) {
        (runBtn as HTMLButtonElement).click();
        return true;
      }
      return false;
    });

    console.log('Run button clicked:', clicked);
    if (!clicked) {
      throw new Error('Could not find Execute Parameter Grid Search button');
    }

    // Wait for optimization to complete (spinner disappears)
    console.log('Waiting for optimization to complete...');
    await page.waitForFunction(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const runBtn = buttons.find(b => 
        b.textContent?.includes('Execute Parameter Grid Search') || 
        b.textContent?.includes('Chạy Ma Trận Tìm Điểm Tối Ưu')
      );
      return runBtn && !runBtn.disabled && !runBtn.textContent?.includes('%');
    }, { timeout: 20000 });

    await new Promise(r => setTimeout(r, 1000));

    // Scrape the verified results from the DOM
    const results = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      const bestOverall = document.querySelector('.from-emerald-950\\/40')?.textContent || '';
      return {
        bestOverallSnippet: bestOverall.slice(0, 300),
        hasTrades: !bestOverall.includes('0 Trades') && (bestOverall.includes('Trades') || bestOverall.includes('trades')),
        bodyHasTradesSnippet: bodyText.includes('Trades') || bodyText.includes('trades')
      };
    });

    console.log('Optimization Results on Page:', JSON.stringify(results, null, 2));

    const screenshotPath = 'C:/Users/thieu/.gemini/antigravity-ide/brain/6893d19f-1fee-452b-b313-6027b8a13cc7/optimizer_verified_success.png';
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log('Saved screenshot to:', screenshotPath);

  } finally {
    await browser.close();
  }
}

run().catch(console.error);
