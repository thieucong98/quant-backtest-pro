import * as fs from 'fs';
import * as path from 'path';

// 1. types.ts
const typesPath = path.join(process.cwd(), 'src/i18n/types.ts');
let typesCode = fs.readFileSync(typesPath, 'utf-8');

const typeEntries = `  searchSymbol: string;
  aiSandboxTip1: string;
  aiSandboxTip2: string;
  aiSandboxTip3: string;
  strategyCompiledActive: string;
  myStrategiesSub: string;
  deleteStrategyTitle: string;
  templatesSub: string;
`;

typesCode = typesCode.replace(
  '  monthlyLossLabel: string;\n}',
  `  monthlyLossLabel: string;\n${typeEntries}}`
);
fs.writeFileSync(typesPath, typesCode, 'utf-8');

// 2. en.ts
const enPath = path.join(process.cwd(), 'src/i18n/locales/en.ts');
let enCode = fs.readFileSync(enPath, 'utf-8');
const enEntries = `  searchSymbol: 'Search Symbol',
  aiSandboxTip1: 'Supports multi-variant SL/TP optimization scan in the Optimizer tab.',
  aiSandboxTip2: 'Use api.buy() and api.sell() to open positions.',
  aiSandboxTip3: 'Sandbox executes securely in an isolated Web Worker.',
  strategyCompiledActive: 'Strategy compiled and activated successfully!',
  myStrategiesSub: 'List of quantitative strategies saved in SQLite database:',
  deleteStrategyTitle: 'Delete Strategy',
  templatesSub: 'Select a classic algorithmic strategy template to load into Sandbox Runner:',
`;
enCode = enCode.replace(
  "  monthlyLossLabel: 'Monthly Net Loss',\n};",
  `  monthlyLossLabel: 'Monthly Net Loss',\n${enEntries}};`
);
fs.writeFileSync(enPath, enCode, 'utf-8');

// 3. vi.ts
const viPath = path.join(process.cwd(), 'src/i18n/locales/vi.ts');
let viCode = fs.readFileSync(viPath, 'utf-8');
const viEntries = `  searchSymbol: 'Tìm kiếm mã tài sản',
  aiSandboxTip1: 'Hỗ trợ quét tối ưu hóa SL/TP đa biến thể tại tab Tối Ưu SL/TP.',
  aiSandboxTip2: 'Sử dụng api.buy() và api.sell() để mở vị thế.',
  aiSandboxTip3: 'Sandbox chạy an toàn trong môi trường Web Worker cô lập.',
  strategyCompiledActive: 'Chiến lược đã được biên dịch và kích hoạt thành công!',
  myStrategiesSub: 'Danh sách các chiến lược định lượng đã lưu trong cơ sở dữ liệu SQLite:',
  deleteStrategyTitle: 'Xóa chiến lược',
  templatesSub: 'Chọn một mẫu chiến lược thuật toán kinh điển để nạp vào Sandbox Runner:',
`;
viCode = viCode.replace(
  "  monthlyLossLabel: '🔴 Lỗ trong tháng',\n};",
  `  monthlyLossLabel: '🔴 Lỗ trong tháng',\n${viEntries}};`
);
fs.writeFileSync(viPath, viCode, 'utf-8');

// 4. ja.ts
const jaPath = path.join(process.cwd(), 'src/i18n/locales/ja.ts');
let jaCode = fs.readFileSync(jaPath, 'utf-8');
const jaEntries = `  searchSymbol: 'シンボル検索',
  aiSandboxTip1: 'オプティマイザータブでマルチバリアントSL/TP最適化スキャンをサポート。',
  aiSandboxTip2: 'ポジションを建てるにはapi.buy()およびapi.sell()を使用します。',
  aiSandboxTip3: 'サンドボックスは分離されたWeb Workerで安全に実行されます。',
  strategyCompiledActive: '戦略が正常にコンパイルされ、アクティブ化されました！',
  myStrategiesSub: 'SQLiteデータベースに保存されたクオンツ戦略リスト：',
  deleteStrategyTitle: '戦略を削除',
  templatesSub: 'サンドボックスランナーにロードする古典的なアルゴリズム戦略テンプレートを選択：',
`;
jaCode = jaCode.replace(
  "  monthlyLossLabel: '当月の純損失',\n};",
  `  monthlyLossLabel: '当月の純損失',\n${jaEntries}};`
);
fs.writeFileSync(jaPath, jaCode, 'utf-8');

// 5. zh.ts
const zhPath = path.join(process.cwd(), 'src/i18n/locales/zh.ts');
let zhCode = fs.readFileSync(zhPath, 'utf-8');
const zhEntries = `  searchSymbol: '搜索交易品种',
  aiSandboxTip1: '支持在优化器标签页中进行多变量SL/TP优化扫描。',
  aiSandboxTip2: '使用 api.buy() 和 api.sell() 开立头寸。',
  aiSandboxTip3: '沙箱在隔离的 Web Worker 中安全执行。',
  strategyCompiledActive: '策略编译并激活成功！',
  myStrategiesSub: '保存在 SQLite 数据库中的量化策略列表：',
  deleteStrategyTitle: '删除策略',
  templatesSub: '选择经典算法策略模板以加载到沙箱运行器：',
`;
zhCode = zhCode.replace(
  "  monthlyLossLabel: '当月净亏损',\n};",
  `  monthlyLossLabel: '当月净亏损',\n${zhEntries}};`
);
fs.writeFileSync(zhPath, zhCode, 'utf-8');

console.log('✅ Final i18n keys added successfully!');
