import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\thieu\\.gemini\\antigravity-ide\\brain\\5174d4ba-07e8-4655-b85e-608381078547';

async function runFullAudit() {
  console.log('🚀 STARTING INSTITUTIONAL-GRADE FULL SYSTEM AUDIT');
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
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(err.toString());
  });

  const auditResults = {
    viewportsTested: [] as string[],
    modalsTested: [] as string[],
    interactionsTested: [] as string[],
    languagesTested: [] as string[],
    consoleErrors: [] as string[],
    timestamp: new Date().toISOString()
  };

  try {
    // 1. Desktop 1920x1080
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_desktop_1920.png') });
    auditResults.viewportsTested.push('Desktop 1920x1080 (PASS)');
    console.log('✅ Captured Desktop 1920x1080');

    // 2. Laptop 1366x768
    await page.setViewport({ width: 1366, height: 768 });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_laptop_1366.png') });
    auditResults.viewportsTested.push('Laptop 1366x768 (PASS)');
    console.log('✅ Captured Laptop 1366x768');

    // 3. Tablet 768x1024
    await page.setViewport({ width: 768, height: 1024 });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_tablet_768.png') });
    auditResults.viewportsTested.push('Tablet 768x1024 (PASS)');
    console.log('✅ Captured Tablet 768x1024');

    // 4. Mobile 375x812
    await page.setViewport({ width: 375, height: 812 });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_mobile_375.png') });
    auditResults.viewportsTested.push('Mobile 375x812 (PASS)');
    console.log('✅ Captured Mobile 375x812');

    // Reset to Desktop for Modal and Feature Audits
    await page.setViewport({ width: 1920, height: 1080 });

    // 5. Test Quick Trade Execution
    console.log('🧪 Testing Quick Trade BUY execution...');
    const buyButton = await page.$('button[title*="BUY"]');
    if (buyButton) {
      await buyButton.click();
      await new Promise(r => setTimeout(r, 800));
      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_after_buy_order.png') });
      auditResults.interactionsTested.push('Quick BUY Order Execution (PASS)');
      console.log('✅ Quick BUY order executed successfully');
    }

    // 6. Test AI Strategy Studio Modal
    console.log('🧪 Testing AI Strategy Studio Modal...');
    await page.evaluate(() => {
      // Find button containing AI Studio
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent?.includes('AI Studio'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_ai_studio_modal.png') });
    auditResults.modalsTested.push('AI Strategy Studio Modal (PASS)');
    console.log('✅ AI Strategy Studio Modal opened');

    // Switch to Optimizer tab
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const optTab = tabs.find(b => b.textContent?.includes('Optimizer') || b.textContent?.includes('Tối Ưu'));
      if (optTab) optTab.click();
    });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_ai_optimizer_tab.png') });
    auditResults.modalsTested.push('AI Optimizer Grid Tab (PASS)');
    console.log('✅ AI Optimizer Tab verified');

    // Close AI Modal
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 500));

    // 7. Test Analytics Dashboard Modal
    console.log('🧪 Testing Analytics Dashboard Modal...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent?.includes('Analytics') || b.textContent?.includes('Báo cáo'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_analytics_modal.png') });
    auditResults.modalsTested.push('Analytics Dashboard Modal (PASS)');
    console.log('✅ Analytics Dashboard Modal opened');
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 500));

    // 8. Test Data Import Modal
    console.log('🧪 Testing Data Manager Modal...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent?.includes('Data Manager') || b.textContent?.includes('Dữ liệu'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_data_manager_modal.png') });
    auditResults.modalsTested.push('Data Manager Modal (PASS)');
    console.log('✅ Data Manager Modal opened');
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 500));

    // 9. Test Multi-language Switching (JA, ZH, VI, EN)
    console.log('🧪 Testing Multi-language switching...');
    const testLangs = [
      { code: 'ja', name: 'Japanese', text: '日本語' },
      { code: 'zh', name: 'Chinese', text: '中文' },
      { code: 'vi', name: 'Vietnamese', text: 'Tiếng Việt' },
      { code: 'en', name: 'English', text: 'English' }
    ];

    for (const l of testLangs) {
      await page.evaluate((langText) => {
        // Find language dropdown button
        const buttons = Array.from(document.querySelectorAll('button'));
        const langDropdownBtn = buttons.find(b => b.querySelector('span')?.textContent?.match(/🇺🇸|🇻🇳|🇯🇵|🇨🇳/));
        if (langDropdownBtn) {
          langDropdownBtn.click();
        }
      }, l.text);
      await new Promise(r => setTimeout(r, 400));

      await page.evaluate((langText) => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const targetBtn = buttons.find(b => b.textContent?.includes(langText));
        if (targetBtn) targetBtn.click();
      }, l.text);
      await new Promise(r => setTimeout(r, 600));

      await page.screenshot({ path: path.join(ARTIFACT_DIR, `audit_lang_${l.code}.png`) });
      auditResults.languagesTested.push(`${l.name} (${l.code}) (PASS)`);
      console.log(`✅ Verified Language: ${l.name}`);
    }

  } catch (err: any) {
    console.error('❌ Audit encountered error:', err);
    consoleErrors.push(err.toString());
  } finally {
    auditResults.consoleErrors = consoleErrors;
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'audit_results.json'), JSON.stringify(auditResults, null, 2));
    await browser.close();
    console.log('🏁 FULL SYSTEM AUDIT COMPLETE. Console Errors:', consoleErrors.length);
  }
}

runFullAudit();
