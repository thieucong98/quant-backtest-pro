import * as fs from 'fs';
import * as path from 'path';

function appendKeys(localeFile: string, entries: Record<string, string>) {
  const filePath = path.join(process.cwd(), `src/i18n/locales/${localeFile}`);
  let code = fs.readFileSync(filePath, 'utf-8');
  
  // Strip trailing "};"
  code = code.trim();
  if (code.endsWith('};')) {
    code = code.slice(0, -2).trimEnd();
  }
  if (code.endsWith('}')) {
    code = code.slice(0, -1).trimEnd();
  }
  if (!code.endsWith(',')) {
    code += ',';
  }

  const lines = Object.entries(entries).map(([k, v]) => {
    return `  "${k}": ${JSON.stringify(v)}`;
  }).join(',\n');

  code = `${code}\n${lines}\n};\n`;
  fs.writeFileSync(filePath, code, 'utf-8');
}

const enEntries = {
  searchSymbol: 'Search Symbol',
  aiSandboxTip1: 'Supports multi-variant SL/TP optimization scan in the Optimizer tab.',
  aiSandboxTip2: 'Use api.buy() and api.sell() to open positions.',
  aiSandboxTip3: 'Sandbox executes securely in an isolated Web Worker.',
  strategyCompiledActive: 'Strategy compiled and activated successfully!',
  myStrategiesSub: 'List of quantitative strategies saved in SQLite database:',
  deleteStrategyTitle: 'Delete Strategy',
  templatesSub: 'Select a classic algorithmic strategy template to load into Sandbox Runner:'
};

const viEntries = {
  searchSymbol: 'Tìm kiếm mã tài sản',
  aiSandboxTip1: 'Hỗ trợ quét tối ưu hóa SL/TP đa biến thể tại tab Tối Ưu SL/TP.',
  aiSandboxTip2: 'Sử dụng api.buy() và api.sell() để mở vị thế.',
  aiSandboxTip3: 'Sandbox chạy an toàn trong môi trường Web Worker cô lập.',
  strategyCompiledActive: 'Chiến lược đã được biên dịch và kích hoạt thành công!',
  myStrategiesSub: 'Danh sách các chiến lược định lượng đã lưu trong cơ sở dữ liệu SQLite:',
  deleteStrategyTitle: 'Xóa chiến lược',
  templatesSub: 'Chọn một mẫu chiến lược thuật toán kinh điển để nạp vào Sandbox Runner:'
};

const jaEntries = {
  searchSymbol: 'シンボル検索',
  aiSandboxTip1: 'オプティマイザータブでマルチバリアントSL/TP最適化スキャンをサポート。',
  aiSandboxTip2: 'ポジションを建てるにはapi.buy()およびapi.sell()を使用します。',
  aiSandboxTip3: 'サンドボックスは分離されたWeb Workerで安全に実行されます。',
  strategyCompiledActive: '戦略が正常にコンパイルされ、アクティブ化されました！',
  myStrategiesSub: 'SQLiteデータベースに保存されたクオンツ戦略リスト：',
  deleteStrategyTitle: '戦略を削除',
  templatesSub: 'サンドボックスランナーにロードする古典的なアルゴリズム戦略テンプレートを選択：'
};

const zhEntries = {
  searchSymbol: '搜索交易品种',
  aiSandboxTip1: '支持在优化器标签页中进行多变量SL/TP优化扫描。',
  aiSandboxTip2: '使用 api.buy() 和 api.sell() 开立头寸。',
  aiSandboxTip3: '沙箱在隔离的 Web Worker 中安全执行。',
  strategyCompiledActive: '策略编译并激活成功！',
  myStrategiesSub: '保存在 SQLite 数据库中的量化策略列表：',
  deleteStrategyTitle: '删除策略',
  templatesSub: '选择经典算法策略模板以加载到沙箱运行器：'
};

appendKeys('en.ts', enEntries);
appendKeys('vi.ts', viEntries);
appendKeys('ja.ts', jaEntries);
appendKeys('zh.ts', zhEntries);

console.log('✅ Correctly appended keys to all 4 locale files');
