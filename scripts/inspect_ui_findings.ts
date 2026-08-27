import * as fs from 'fs';

const data = JSON.parse(fs.readFileSync('scan_summary.json', 'utf-8'));

const uiFiles = [
  'src\\components\\header\\Header.tsx',
  'src\\components\\chart\\TradingViewChart.tsx',
  'src\\components\\chart\\DrawingCanvas.tsx',
  'src\\components\\panels\\AIBotHUD.tsx',
  'src\\components\\panels\\AIStrategyModal.tsx',
  'src\\components\\panels\\AnalyticsDashboardModal.tsx',
  'src\\components\\panels\\ExportStrategyModal.tsx'
];

for (const file of uiFiles) {
  if (data.details[file]) {
    console.log(`\n================= ${file} (${data.details[file].length} items) =================`);
    data.details[file].forEach((item: any) => {
      console.log(`L${item.line}: ${item.content}`);
    });
  }
}
