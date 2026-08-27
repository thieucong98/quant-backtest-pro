import * as fs from 'fs';
import * as path from 'path';

const filePath = path.join(process.cwd(), 'src/components/panels/AIStrategyModal.tsx');
let code = fs.readFileSync(filePath, 'utf-8');

code = code.replace(
  '<button\n                                  onClick={() => handleApplyOptConfig(res)}\n                                  className="px-2.5 py-1 bg-emerald-600/80 hover:bg-emerald-500 text-white rounded text-[10px] font-bold transition-colors shadow-xs"\n                                >\n                                  Áp Dụng\n                                </button>',
  '<button\n                                  onClick={() => handleApplyOptConfig(res)}\n                                  className="px-2.5 py-1 bg-emerald-600/80 hover:bg-emerald-500 text-white rounded text-[10px] font-bold transition-colors shadow-xs"\n                                >\n                                  {t.applyConfigBtn}\n                                </button>'
);

// In case CRLF
code = code.replace(
  '<button\r\n                                  onClick={() => handleApplyOptConfig(res)}\r\n                                  className="px-2.5 py-1 bg-emerald-600/80 hover:bg-emerald-500 text-white rounded text-[10px] font-bold transition-colors shadow-xs"\r\n                                >\r\n                                  Áp Dụng\r\n                                </button>',
  '<button\r\n                                  onClick={() => handleApplyOptConfig(res)}\r\n                                  className="px-2.5 py-1 bg-emerald-600/80 hover:bg-emerald-500 text-white rounded text-[10px] font-bold transition-colors shadow-xs"\r\n                                >\r\n                                  {t.applyConfigBtn}\r\n                                </button>'
);

fs.writeFileSync(filePath, code, 'utf-8');
console.log('✅ Applied {t.applyConfigBtn}');
