import * as fs from 'fs';
import * as path from 'path';

const filePath = path.join(process.cwd(), 'src/components/panels/AnalyticsDashboardModal.tsx');
let code = fs.readFileSync(filePath, 'utf-8');

code = code.replace(
  "currentMonth.totalPnL >= 0 ? '🟢 Lợi nhuận ròng' : '🔴 Lỗ trong tháng'",
  "currentMonth.totalPnL >= 0 ? t.netProfitStatus : t.monthlyLossLabel"
);

code = code.replace(
  "<span>Khung Giờ Tốt Nhất</span>",
  "<span>{t.bestTradingHourCard}</span>"
);

code = code.replace(
  "<span>Khung Giờ Kém Nhất</span>",
  "<span>{t.worstTradingHourCard}</span>"
);

code = code.replace(
  "<span>Ngày Hiệu Quả Nhất</span>",
  "<span>{t.bestDayCard}</span>"
);

code = code.replace(
  "<span>Tổng Số Lệnh Khớp</span>",
  "<span>{t.totalClosedTradesCard}</span>"
);

code = code.replace(
  "{report.totalTrades} Lệnh đã đóng",
  "{report.totalTrades} {t.closedTradesSuffix}"
);

code = code.replace(
  "<span className=\"text-slate-400 font-sans font-medium\">Phiên giao dịch thế giới:</span>",
  "<span className=\"text-slate-400 font-sans font-medium\">{t.worldTradingSessionsLabel}</span>"
);

code = code.replace(
  '<span className="text-slate-300">🌏 Á (00-08h)</span>',
  '<span className="text-slate-300">{t.asianSessionLabel}</span>'
);

code = code.replace(
  '<span className="text-slate-300">🇬🇧 Âu (08-16h)</span>',
  '<span className="text-slate-300">{t.europeanSessionLabel}</span>'
);

code = code.replace(
  '<span className="text-slate-300">🇺🇸 Mỹ (13-21h)</span>',
  '<span className="text-slate-300">{t.americanSessionLabel}</span>'
);

code = code.replace(
  '🔥 Trùng Âu/Mỹ (13-16h)',
  '{t.overlapEuroUsLabel}'
);

code = code.replace(
  "<span className=\"text-[10px] font-sans text-slate-400 font-medium uppercase\">Tuần {wIdx + 1}</span>",
  "<span className=\"text-[10px] font-sans text-slate-400 font-medium uppercase\">{t.weekNumberLabel.replace('{num}', (wIdx + 1).toString())}</span>"
);

code = code.replace(
  ": 'Chưa đủ dữ liệu'",
  ": t.notEnoughDataLabel"
);

code = code.replace(
  ": 'Không có lỗ lớn'",
  ": t.noMajorLossLabel"
);

fs.writeFileSync(filePath, code, 'utf-8');
console.log('✅ Successfully refactored AnalyticsDashboardModal.tsx');
