import * as fs from 'fs';
import * as path from 'path';

// 1. Header.tsx
const headerPath = path.join(process.cwd(), 'src/components/header/Header.tsx');
let headerCode = fs.readFileSync(headerPath, 'utf-8');
headerCode = headerCode.replace(
  'title="Bấm để đổi mã tài sản (Symbol Search)"',
  'title={t.searchSymbol}'
);
fs.writeFileSync(headerPath, headerCode, 'utf-8');

// 2. AnalyticsDashboardModal.tsx
const analyticsPath = path.join(process.cwd(), 'src/components/panels/AnalyticsDashboardModal.tsx');
let analyticsCode = fs.readFileSync(analyticsPath, 'utf-8');

analyticsCode = analyticsCode.replace(
  '<div className="text-[10px] text-slate-500 mt-0.5">Lợi nhuận trung vị 50th</div>',
  '<div className="text-[10px] text-slate-500 mt-0.5">{t.medianProfitSub}</div>'
);
analyticsCode = analyticsCode.replace(
  '<div className="text-[10px] text-slate-500 mt-0.5">Sụt giảm xấu nhất 1,000 runs</div>',
  '<div className="text-[10px] text-slate-500 mt-0.5">{t.worstCaseDDSub}</div>'
);
analyticsCode = analyticsCode.replace(
  '<div className="text-[10px] text-slate-500 mt-0.5">Khoảng tin cậy 95% DD</div>',
  '<div className="text-[10px] text-slate-500 mt-0.5">{t.percentile95DDSub}</div>'
);
analyticsCode = analyticsCode.replace(
  '<div className="text-[10px] text-slate-500 mt-0.5">Nguy cơ sụt giảm &gt; 50%</div>',
  '<div className="text-[10px] text-slate-500 mt-0.5">{t.riskOfRuinSub}</div>'
);
analyticsCode = analyticsCode.replace(
  '<span className="text-slate-400 text-[11px] font-sans font-medium">Chế độ phân tích:</span>',
  '<span className="text-slate-400 text-[11px] font-sans font-medium">{t.analysisModeLabel}</span>'
);
analyticsCode = analyticsCode.replace(
  "{currentMonth?.monthLabel || 'Tháng'}",
  "{currentMonth?.monthLabel || 'Month'}"
);
analyticsCode = analyticsCode.replace(
  '<span className="text-teal-400">{currentMonth.profitableDaysCount} Thắng</span> / <span className="text-rose-400">{currentMonth.lossDaysCount} Thua</span>',
  '<span className="text-teal-400">{currentMonth.profitableDaysCount} {t.winTradesCount}</span> / <span className="text-rose-400">{currentMonth.lossDaysCount} {t.lossTradesCount}</span>'
);
analyticsCode = analyticsCode.replace(
  'Tỷ lệ ngày thắng:',
  '{t.profitableDaysRatioLabel}:'
);
analyticsCode = analyticsCode.replace(
  ": 'Không có lãi'",
  ": t.noProfitLabel"
);
analyticsCode = analyticsCode.replace(
  'Winrate tháng:',
  '{t.monthlyWinrateLabel}:'
);
analyticsCode = analyticsCode.replace(
  /title=\{hasTrades \? `\$\{dateStr\}: \$\{cellData\.tradesCount\} lệnh \(PnL: \$\$\{cellData\.pnl\.toFixed\(2\)\}\)` : dateStr\}/,
  'title={hasTrades ? `${dateStr}: ${cellData.tradesCount} ${t.tradesCountLabel} (PnL: $${cellData.pnl.toFixed(2)})` : dateStr}'
);
analyticsCode = analyticsCode.replace(
  '<span className="text-[9px] opacity-75 font-sans mt-0.5">{weekTradesCount} lệnh</span>',
  '<span className="text-[9px] opacity-75 font-sans mt-0.5">{weekTradesCount} {t.tradesCountLabel}</span>'
);
analyticsCode = analyticsCode.replace(
  '{bestCell ? `+$${bestCell.pnl.toFixed(2)} (${bestCell.tradesCount} lệnh)` : \'-\'}',
  '{bestCell ? `+$${bestCell.pnl.toFixed(2)} (${bestCell.tradesCount} ${t.tradesCountLabel})` : \'-\'}'
);
analyticsCode = analyticsCode.replace(
  '{worstCell && worstCell.pnl < 0 ? `-$${Math.abs(worstCell.pnl).toFixed(2)} (${worstCell.tradesCount} lệnh)` : \'-\'}',
  '{worstCell && worstCell.pnl < 0 ? `-$${Math.abs(worstCell.pnl).toFixed(2)} (${worstCell.tradesCount} ${t.tradesCountLabel})` : \'-\'}'
);
analyticsCode = analyticsCode.replace(
  "{dayPnL[bestDayIdx]?.pnl >= 0 ? '+' : ''}${dayPnL[bestDayIdx]?.pnl.toFixed(2)} ({dayPnL[bestDayIdx]?.count} lệnh)",
  "{dayPnL[bestDayIdx]?.pnl >= 0 ? '+' : ''}${dayPnL[bestDayIdx]?.pnl.toFixed(2)} ({dayPnL[bestDayIdx]?.count} {t.tradesCountLabel})"
);
analyticsCode = analyticsCode.replace(
  'title={`Khung giờ ${h}:00 - ${h + 1}:59 UTC`}',
  'title={`${h}:00 - ${h + 1}:59 UTC`}'
);
analyticsCode = analyticsCode.replace(
  'title={`${dayName} lúc ${h}:00 UTC — ${count} lệnh | PnL: $${pnl.toFixed(2)} | Thắng: ${winRate}%`}',
  'title={`${dayName} @ ${h}:00 UTC — ${count} ${t.tradesCountLabel} | PnL: $${pnl.toFixed(2)} | WR: ${winRate}%`}'
);

fs.writeFileSync(analyticsPath, analyticsCode, 'utf-8');

// 3. AIStrategyModal.tsx
const aiStratPath = path.join(process.cwd(), 'src/components/panels/AIStrategyModal.tsx');
let aiStratCode = fs.readFileSync(aiStratPath, 'utf-8');

aiStratCode = aiStratCode.replace(
  '<li>Hỗ trợ quét tối ưu hóa SL/TP đa biến thể tại tab <strong className="text-emerald-400">⚡ Tối Ưu SL/TP</strong>.</li>',
  '<li>{t.aiSandboxTip1}</li>'
);
aiStratCode = aiStratCode.replace(
  '<li>Sử dụng <code className="text-purple-300 bg-slate-950 px-1 rounded">api.buy()</code> và <code className="text-purple-300 bg-slate-950 px-1 rounded">api.sell()</code> để mở vị thế.</li>',
  '<li>{t.aiSandboxTip2}</li>'
);
aiStratCode = aiStratCode.replace(
  '<li>Sandbox chạy an toàn trong môi trường Web Worker cô lập.</li>',
  '<li>{t.aiSandboxTip3}</li>'
);
aiStratCode = aiStratCode.replace(
  "<span>{t.exportBotBtn || 'Xuất Bot'}</span>",
  '<span>{t.exportBotBtn}</span>'
);
aiStratCode = aiStratCode.replace(
  "<span>{t.savedToDBSuccess || 'Chiến lược đã được biên dịch và kích hoạt thành công!'}</span>",
  '<span>{t.strategyCompiledActive}</span>'
);
aiStratCode = aiStratCode.replace(
  '<span>{optSummary.bestItem.report.totalTrades} Lệnh</span>',
  '<span>{optSummary.bestItem.report.totalTrades} {t.tradesCol}</span>'
);
aiStratCode = aiStratCode.replace(
  '>Áp Dụng<',
  '>{t.applyConfigBtn}<'
);
aiStratCode = aiStratCode.replace(
  'Danh sách các chiến lược định lượng đã lưu trong cơ sở dữ liệu SQLite:',
  '{t.myStrategiesSub}'
);
aiStratCode = aiStratCode.replace(
  "<span>{t.importStrategyBtn || 'Nhập Chiến Lược'}</span>",
  '<span>{t.importStrategyBtn}</span>'
);
aiStratCode = aiStratCode.replace(
  'title="Xóa chiến lược"',
  'title={t.deleteStrategyTitle}'
);
aiStratCode = aiStratCode.replace(
  'Chọn một mẫu chiến lược thuật toán kinh điển để nạp vào Sandbox Runner:',
  '{t.templatesSub}'
);

fs.writeFileSync(aiStratPath, aiStratCode, 'utf-8');
console.log('✅ Successfully deep cleaned Header, AnalyticsDashboardModal and AIStrategyModal!');
