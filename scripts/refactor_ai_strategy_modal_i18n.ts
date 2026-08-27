import * as fs from 'fs';
import * as path from 'path';

const filePath = path.join(process.cwd(), 'src/components/panels/AIStrategyModal.tsx');
let code = fs.readFileSync(filePath, 'utf-8');

// 1. Sparkline title
code = code.replace(
  'title={`Vốn: $${data[0]} -> $${data[data.length - 1]}`}',
  'title={`${t.balanceLabel}: $${data[0]} -> $${data[data.length - 1]}`}'
);

// 2. Prompt suggestions
code = code.replace(
  "{ label: 'EMA 9/21 Scalper', text: 'Chiến lược lướt sóng nhanh: Mua khi EMA 9 cắt lên EMA 21, Bán khi EMA 9 cắt xuống EMA 21 kèm SL 15pips, TP 30pips' }",
  "{ label: t.promptSuggestionEmaLabel, text: t.promptSuggestionEmaText }"
);
code = code.replace(
  "{ label: 'RSI 30/70 Pullback', text: 'Mua khi RSI 14 quá bán dưới 30 và nến xanh xuất hiện; Bán khi RSI 14 quá mua trên 70 và nến đỏ xuất hiện' }",
  "{ label: t.promptSuggestionRsiLabel, text: t.promptSuggestionRsiText }"
);
code = code.replace(
  "{ label: 'Bollinger Band Squeeze', text: 'Chiến lược phá vỡ dải Bollinger Bands khi thị trường bung nén với dải mở rộng' }",
  "{ label: t.promptSuggestionBbLabel, text: t.promptSuggestionBbText }"
);
code = code.replace(
  "{ label: 'MACD Zero Crossover', text: 'Giao dịch theo đà xu hướng khi đường MACD cắt qua mức 0 kết hợp bộ lọc EMA 50' }",
  "{ label: t.promptSuggestionMacdLabel, text: t.promptSuggestionMacdText }"
);

// 3. Alerts & Tooltips in AIStrategyModal
code = code.replace(
  "alert('Không đủ dữ liệu nến để chạy tối ưu hóa. Vui lòng tải dữ liệu nến vào biểu đồ trước.');",
  "alert(t.insufficientCandlesForOpt);"
);

code = code.replace(
  'title="Mở trình tối ưu SL/TP"',
  'title={t.openOptimizerTooltip}'
);

code = code.replace(
  '<span>Tối Ưu SL/TP</span>',
  '<span>{t.optimizerTab}</span>'
);

code = code.replace(
  'title="Xuất chiến lược sang Bot MT4/MT5/TradingView/Python/cTrader"',
  'title={t.exportBotModalTooltip}'
);

code = code.replace(
  'title="Xuất Bot MT5/MT4/Pine/Python/cTrader"',
  'title={t.exportBotModalTooltip}'
);

code = code.replace(
  'title="Nhập chiến lược từ file JSON hoặc JS"',
  'title={t.importStrategyModalTooltip}'
);

code = code.replace(
  '<span className="text-[10px] text-slate-500 font-mono">Trục Y: TP (pips) • Trục X: SL (pips)</span>',
  '<span className="text-[10px] text-slate-500 font-mono">{t.optAxisHelp}</span>'
);

code = code.replace(
  '<span className="text-[10px] text-slate-500">Bộ lọc:</span>',
  '<span className="text-[10px] text-slate-500">{t.filterLabel}</span>'
);

code = code.replace(
  '<th className="py-2 px-3">Hạng</th>',
  '<th className="py-2 px-3">{t.rankCol}</th>'
);

code = code.replace(
  '<th className="py-2 px-3">Lệnh</th>',
  '<th className="py-2 px-3">{t.tradesCol}</th>'
);

code = code.replace(
  '<th className="py-2 px-3">Độ Bền (WFA)</th>',
  '<th className="py-2 px-3">{t.wfaCol}</th>'
);

code = code.replace(
  '<th className="py-2 px-3 text-right">Thao tác</th>',
  '<th className="py-2 px-3 text-right">{t.actionsCol}</th>'
);

code = code.replace(
  '>Áp Dụng<',
  '>{t.applyConfigBtn}<'
);

code = code.replace(
  '<span>Nạp Vào Studio</span>',
  '<span>{t.loadIntoStudioBtn}</span>'
);

code = code.replace(
  'Chưa có chiến lược nào được lưu trong Database. Hãy tạo và bấm "{t.saveToDB}" ở tab Studio!',
  '{t.noCustomStrategiesInDb}'
);

code = code.replace(
  "{strat.description || 'Chiến lược tùy chỉnh không có mô tả.'}",
  "{strat.description || t.customStrategyNoDesc}"
);

code = code.replace(
  "if (window.confirm('Bạn có chắc muốn xóa chiến lược này khỏi DB?')) {",
  "if (window.confirm(t.confirmDeleteStrat)) {"
);

fs.writeFileSync(filePath, code, 'utf-8');
console.log('✅ Successfully refactored AIStrategyModal.tsx');
