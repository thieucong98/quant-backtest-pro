import * as fs from 'fs';
import * as path from 'path';

const filePath = path.join(process.cwd(), 'src/components/panels/AIStrategyModal.tsx');
let code = fs.readFileSync(filePath, 'utf-8');

code = code.replace(
  "addStrategyLog('INFO', `[AI Auto-Tune] Đang tự động quét & tối ưu SL/TP cho ${instrument.symbol}...`);",
  "addStrategyLog('INFO', `[AI Auto-Tune] Auto-scanning & optimizing SL/TP for ${instrument.symbol}...`);"
);

code = code.replace(
  "`[AI Auto-Tune] Đã tối ưu cho ${instrument.symbol}: SL=${autoOptSummary.bestItem.slPips}p, TP=${autoOptSummary.bestItem.tpPips}p (Winrate: ${autoOptSummary.bestItem.report.winRate}%, Net: +$${autoOptSummary.bestItem.report.netProfit.toFixed(1)})`",
  "`[AI Auto-Tune] Optimized for ${instrument.symbol}: SL=${autoOptSummary.bestItem.slPips}p, TP=${autoOptSummary.bestItem.tpPips}p (Winrate: ${autoOptSummary.bestItem.report.winRate}%, Net: +$${autoOptSummary.bestItem.report.netProfit.toFixed(1)})`"
);

code = code.replace(
  "addStrategyLog('SIGNAL', `[AI Copilot] Đã tạo và nạp chiến lược: \"${result.name}\"`);",
  "addStrategyLog('SIGNAL', `[AI Copilot] Generated and loaded strategy: \"${result.name}\"`);"
);

code = code.replace(
  "addStrategyLog('SIGNAL', `[AI Copilot] Kích hoạt & chạy chiến lược: \"${strategyName}\" (Auto-Trading: BẬT)`);",
  "addStrategyLog('SIGNAL', `[AI Copilot] Activated & running strategy: \"${strategyName}\" (Auto-Trading: ON)`);"
);

code = code.replace(
  "addStrategyLog('INFO', `Đã lưu chiến lược \"${strategyName}\" vào cơ sở dữ liệu`);",
  "addStrategyLog('INFO', `Saved strategy \"${strategyName}\" to database`);"
);

code = code.replace(
  "addStrategyLog('INFO', `Đã nạp mẫu chiến lược: \"${tpl.name}\"`);",
  "addStrategyLog('INFO', `Loaded template strategy: \"${tpl.name}\"`);"
);

code = code.replace(
  "addStrategyLog('SIGNAL', `[AI Copilot] Đã nạp & chạy chiến lược từ DB: \"${loaded.name}\" (Auto-Trading: BẬT)`);",
  "addStrategyLog('SIGNAL', `[AI Copilot] Loaded & activated strategy from DB: \"${loaded.name}\" (Auto-Trading: ON)`);"
);

code = code.replace(
  "addStrategyLog('INFO', `[Strategy Import] Đã import thành công chiến lược \"${importedName}\"`);",
  "addStrategyLog('INFO', `[Strategy Import] Successfully imported strategy \"${importedName}\"`);"
);

code = code.replace(
  "`[Optimizer] Áp dụng cấu hình SL=${item.slPips}p, TP=${item.tpPips}p (WR: ${item.report.winRate}%, Net: +$${item.report.netProfit.toFixed(1)})`",
  "`[Optimizer] Applied config SL=${item.slPips}p, TP=${item.tpPips}p (WR: ${item.report.winRate}%, Net: +$${item.report.netProfit.toFixed(1)})`"
);

fs.writeFileSync(filePath, code, 'utf-8');
console.log('✅ Cleaned AIStrategyModal logs');
