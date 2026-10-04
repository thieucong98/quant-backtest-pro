import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:\\Users\\thieu\\.gemini\\antigravity-ide\\brain\\6893d19f-1fee-452b-b313-6027b8a13cc7';

const chromePath = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function runGatewaySettingsTest() {
  console.log(`🚀 Starting Puppeteer Verification for Copilot Gateway Settings via ${chromePath}...`);
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
      // Find button to open copilot if not already open
      const copilotBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Copilot'));
      if (copilotBtn) (copilotBtn as HTMLElement).click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Find and click the settings button in Copilot HUD
    console.log('3. Clicking the ⚙️ Settings button in Copilot HUD...');
    const clickedSettings = await page.evaluate(() => {
      const hud = document.querySelector('.apex-ai-copilot-hud');
      if (!hud) return false;
      const settingsBtn = hud.querySelector('button[title*="Gateway"], button[title*="Cài đặt"]') as HTMLElement;
      if (settingsBtn) {
        settingsBtn.click();
        return true;
      }
      return false;
    });

    console.log(`Clicked settings button: ${clickedSettings}`);
    await new Promise(r => setTimeout(r, 1000));

    // Capture screenshot of the Gateway Settings Card open on Copilot HUD
    const settingsScreenshot = path.join(ARTIFACT_DIR, 'copilot_gateway_settings_card.png');
    await page.screenshot({ path: settingsScreenshot });
    console.log(`📸 Saved screenshot: ${settingsScreenshot}`);

    // Fill in custom gateway URL and save
    console.log('4. Entering custom gateway URL and testing save...');
    await page.evaluate(() => {
      const hud = document.querySelector('.apex-ai-copilot-hud');
      if (!hud) return;
      const inputs = hud.querySelectorAll('input[type="text"]');
      if (inputs.length >= 1) {
        const urlInput = inputs[0] as HTMLInputElement;
        urlInput.value = 'http://127.0.0.1:9000/v1';
        urlInput.dispatchEvent(new Event('input', { bubbles: true }));
        urlInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
      // Click save button
      const saveBtn = Array.from(hud.querySelectorAll('button')).find(b => b.textContent?.includes('Lưu') || b.textContent?.includes('Save'));
      if (saveBtn) (saveBtn as HTMLElement).click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Verify localStorage has the new configuration
    const savedConfig = await page.evaluate(() => {
      return localStorage.getItem('quant_llm_config');
    });
    console.log('Verified localStorage quant_llm_config:', savedConfig);

    const savedScreenshot = path.join(ARTIFACT_DIR, 'copilot_gateway_config_saved.png');
    await page.screenshot({ path: savedScreenshot });
    console.log(`📸 Saved screenshot: ${savedScreenshot}`);

    console.log('✅ Puppeteer verification completed successfully!');
  } catch (err) {
    console.error('Puppeteer test error:', err);
  } finally {
    await browser.close();
  }
}

runGatewaySettingsTest();
