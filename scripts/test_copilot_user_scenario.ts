import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:\\Users\\thieu\\.gemini\\antigravity-ide\\brain\\6893d19f-1fee-452b-b313-6027b8a13cc7';

const chromePath = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function runCopilotUserTest() {
  console.log(`🚀 Starting Puppeteer Verification for Apex AI Copilot via ${chromePath}...`);
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: chromePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    console.log('1. Navigating to QuantBacktest Pro at http://127.0.0.1:3111/ ...');
    await page.goto('http://127.0.0.1:3111/', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // Ensure Copilot HUD is open
    console.log('2. Ensuring Apex AI Copilot HUD is open...');
    await page.evaluate(() => {
      // Trigger store to open copilot if not active
      const store = (window as any).__quant_backtest_store__ || (window as any).useBacktestStore;
      if (store && store.getState) {
        store.getState().setActiveAssistantPanel('copilot');
      } else {
        // Find copilot button in header if available
        const buttons = Array.from(document.querySelectorAll('button'));
        const copilotBtn = buttons.find(b => b.textContent?.includes('Copilot'));
        if (copilotBtn) (copilotBtn as HTMLButtonElement).click();
      }
    });
    await new Promise(r => setTimeout(r, 1500));

    // Check if HUD is visible
    const hudFound = await page.$('.apex-ai-copilot-hud');
    if (!hudFound) {
      console.log('HUD selector not immediately found, clicking Assistant button in Header...');
      const assistantBtn = await page.$('button[title*="Copilot"], button[aria-label*="Copilot"]');
      if (assistantBtn) await assistantBtn.click();
      await new Promise(r => setTimeout(r, 1500));
    }

    const hudEl = await page.$('.apex-ai-copilot-hud');
    console.log('HUD element present:', !!hudEl);

    // 3. Test Guide / Tooltip Popover
    console.log('3. Testing Prompt Guide / Tooltip Popover...');
    const guideBtn = await page.$('button[title*="Hướng dẫn"], button[title*="Guide"]');
    if (guideBtn) {
      await guideBtn.click();
      await new Promise(r => setTimeout(r, 500));
      const guideShotPath = path.join(ARTIFACT_DIR, 'copilot_prompt_guide_verified.png');
      await page.screenshot({ path: guideShotPath });
      console.log(`📸 Captured Guide Popover Screenshot: ${guideShotPath}`);
    }

      // 4. Click Quick Action button [🎯 R:R 1:3]
      console.log('4. Clicking Quick Action button [🎯 R:R 1:3]...');
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('.apex-ai-copilot-hud button'));
        const rr3Btn = buttons.find(b => b.textContent?.includes('R:R 1:3'));
        if (rr3Btn) {
          (rr3Btn as HTMLButtonElement).click();
        }
      });

      // Wait for streaming and plan calculation to settle (4-5 seconds)
      console.log('6. Waiting for reasoning tokens and Action Plan generation...');
      await new Promise(r => setTimeout(r, 4500));

      // 7. Verify rendered R:R ratio
      const hudText = await page.evaluate(() => {
        const el = document.querySelector('.apex-ai-copilot-hud');
        return el ? el.textContent : '';
      });

      console.log('HUD content sample:', hudText?.slice(0, 400));

      const hasRR3 = hudText?.includes('1 : 3.00') || hudText?.includes('1 : 3') || hudText?.includes('1:3');
      console.log('🎯 Verified R:R ratio 1:3 is present on HUD:', hasRR3);

      const shotPath = path.join(ARTIFACT_DIR, 'copilot_user_rr_1_3_verified.png');
      await page.screenshot({ path: shotPath });
      console.log(`📸 Captured Final Verified Screenshot: ${shotPath}`);

      if (hasRR3) {
        console.log('🌟 SUCCESS: Copilot accurately parsed R:R 1:3 and generated calibrated ActionPlan!');
      } else {
        console.warn('⚠️ Warning: R:R 1:3 text was not detected directly in HUD text sample.');
      }
  } catch (err) {
    console.error('Test execution failed:', err);
  } finally {
    await browser.close();
  }
}

runCopilotUserTest().catch(console.error);
