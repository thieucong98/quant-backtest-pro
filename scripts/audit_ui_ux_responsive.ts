import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\thieu\\.gemini\\antigravity-ide\\brain\\5174d4ba-07e8-4655-b85e-608381078547';

interface AuditFinding {
  viewport: string;
  component: string;
  category: 'OVERFLOW' | 'TOUCH_TARGET' | 'LAYOUT_COLLISION' | 'TEXT_TRUNCATION' | 'USABILITY';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  details?: any;
}

const findings: AuditFinding[] = [];

async function runResponsiveAudit() {
  console.log('===============================================================');
  console.log('🎨 COMPREHENSIVE UI/UX & RESPONSIVE AUDIT');
  console.log('===============================================================\n');

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const viewports = [
    { name: 'desktop_1920', width: 1920, height: 1080, isMobile: false },
    { name: 'laptop_1366', width: 1366, height: 768, isMobile: false },
    { name: 'tablet_768', width: 768, height: 1024, isMobile: true },
    { name: 'mobile_375', width: 375, height: 812, isMobile: true }
  ];

  for (const vp of viewports) {
    console.log(`\n--- Auditing Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.isMobile });

    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 20000 });
    await new Promise(r => setTimeout(r, 1500));

    // 1. Capture base screenshot
    const baseScreenshotPath = path.join(ARTIFACT_DIR, `review_${vp.name}_base.png`);
    await page.screenshot({ path: baseScreenshotPath });
    console.log(`📸 Captured: review_${vp.name}_base.png`);

    // 2. DOM Analysis for Overflow & Overlaps
    const domAudit = await page.evaluate((vpWidth, vpHeight) => {
      const issues: any[] = [];
      const allEls = Array.from(document.querySelectorAll('*'));

      // Check horizontal overflow
      const docWidth = document.documentElement.scrollWidth;
      const bodyWidth = document.body.scrollWidth;
      if (docWidth > vpWidth + 2) {
        issues.push({
          type: 'OVERFLOW',
          message: `Document scrollWidth (${docWidth}px) exceeds viewport width (${vpWidth}px)`
        });
      }

      // Check elements overflowing viewport horizontally
      allEls.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.right > vpWidth + 5 && rect.width > 0 && rect.height > 0) {
          const className = typeof el.className === 'string' ? el.className.slice(0, 50) : '';
          const tag = el.tagName.toLowerCase();
          issues.push({
            type: 'ELEMENT_OVERFLOW',
            tag,
            className,
            right: rect.right,
            width: rect.width
          });
        }
      });

      // Check floating overlays layout collisions (e.g. Quick Order vs HUD vs Replay bar)
      const quickOrder = document.querySelector('[data-testid="quick-order-dock"]') || document.querySelector('.absolute.top-2.left-2') || document.querySelector('button[class*="bg-emerald-600"]')?.closest('div.absolute');
      const aiHUD = document.querySelector('.absolute.top-2.right-2') || document.querySelector('[class*="AI"]')?.closest('div.absolute');

      let overlapDetected = false;
      if (quickOrder && aiHUD) {
        const r1 = quickOrder.getBoundingClientRect();
        const r2 = aiHUD.getBoundingClientRect();
        if (r1.right > r2.left && r1.left < r2.right && r1.bottom > r2.top && r1.top < r2.bottom) {
          overlapDetected = true;
          issues.push({
            type: 'LAYOUT_COLLISION',
            message: 'Quick Order dock collides/overlaps with Top-Right HUD / AI Bot Panel'
          });
        }
      }

      // Check small touch targets on mobile/tablet (buttons < 32px height/width)
      const smallButtons: any[] = [];
      const buttons = Array.from(document.querySelectorAll('button, a, input[type="button"]'));
      buttons.forEach(btn => {
        const r = btn.getBoundingClientRect();
        if (r.width > 0 && r.height > 0 && (r.width < 28 || r.height < 28)) {
          smallButtons.push({
            text: (btn.textContent || '').trim().slice(0, 20),
            width: Math.round(r.width),
            height: Math.round(r.height)
          });
        }
      });

      return {
        issues,
        overlapDetected,
        smallButtonsCount: smallButtons.length,
        smallButtonsSample: smallButtons.slice(0, 5)
      };
    }, vp.width, vp.height);

    console.log(`   DOM Analysis for ${vp.name}:`, {
      issuesCount: domAudit.issues.length,
      overlapDetected: domAudit.overlapDetected,
      smallTouchTargets: domAudit.smallButtonsCount
    });

    if (domAudit.issues.length > 0) {
      domAudit.issues.forEach(iss => {
        findings.push({
          viewport: vp.name,
          component: 'Layout/Container',
          category: iss.type === 'LAYOUT_COLLISION' ? 'LAYOUT_COLLISION' : 'OVERFLOW',
          severity: vp.isMobile ? 'CRITICAL' : 'HIGH',
          description: iss.message || `Element <${iss.tag}> overflows right edge (${iss.right}px > ${vp.width}px)`,
          details: iss
        });
      });
    }

    // 3. Test Modals on each viewport (e.g. Data Import, AI Studio, Analytics)
    if (vp.name === 'desktop_1920' || vp.name === 'mobile_375') {
      // Test Data Import Modal
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(b => b.textContent?.includes('Dữ liệu') || b.textContent?.includes('Data'));
        if (btn) btn.click();
      });
      await new Promise(r => setTimeout(r, 600));
      await page.screenshot({ path: path.join(ARTIFACT_DIR, `review_${vp.name}_modal_data.png`) });

      // Close modal
      await page.evaluate(() => {
        const closeBtn = document.querySelector('button[aria-label="Close"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Đóng') || b.textContent?.includes('Close') || b.innerHTML.includes('lucide-x') || b.innerHTML.includes('svg'));
        if (closeBtn) (closeBtn as HTMLElement).click();
      });
      await new Promise(r => setTimeout(r, 400));
    }

    await page.close();
  }

  await browser.close();

  // Save audit findings JSON
  fs.writeFileSync(
    path.join(ARTIFACT_DIR, 'ui_ux_audit_findings.json'),
    JSON.stringify(findings, null, 2)
  );

  console.log('\n===============================================================');
  console.log(`🎯 AUDIT COMPLETED. Total Findings Logged: ${findings.length}`);
  console.log('===============================================================\n');
}

runResponsiveAudit().catch(console.error);
