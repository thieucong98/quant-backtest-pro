import * as fs from 'fs';
import * as path from 'path';

const filePath = path.join(process.cwd(), 'src/components/panels/AIStrategyModal.tsx');
let code = fs.readFileSync(filePath, 'utf-8');

code = code.replace(
  '>\n                                  Áp Dụng\n                                </button>',
  '>\n                                  {t.applyConfigBtn}\n                                </button>'
);

code = code.replace(
  "setErrorMessage(err.message || 'Lỗi khi sinh chiến lược.');",
  "setErrorMessage(err.message || 'Error generating strategy.');"
);

code = code.replace(
  "setErrorMessage(compileRes.error || 'Lỗi cú pháp chiến lược.');",
  "setErrorMessage(compileRes.error || 'Strategy compilation syntax error.');"
);

code = code.replace(
  "setErrorMessage(err.message || 'Lỗi cú pháp chiến lược.');",
  "setErrorMessage(err.message || 'Strategy compilation syntax error.');"
);

code = code.replace(
  "setDbSaveMessage('🔒 Vui lòng đăng nhập để lưu trữ chiến lược vào SQLite');",
  "setDbSaveMessage('🔒 Please sign in to save strategy to database');"
);

code = code.replace(
  "setDbSaveMessage('Lỗi khi lưu vào DB');",
  "setDbSaveMessage('Error saving to DB');"
);

code = code.replace(
  "let importedDesc = 'Chiến lược được import từ file ' + file.name;",
  "let importedDesc = 'Strategy imported from ' + file.name;"
);

code = code.replace(
  "setTestMessage(`🔴 ${err.message || 'Không thể kết nối tới nhà cung cấp.'}`);",
  "setTestMessage(`🔴 ${err.message || 'Cannot connect to provider.'}`);"
);

code = code.replace(
  "alert(`Lỗi khi chạy tối ưu hóa: ${err.message}`);",
  "alert(`Optimizer error: ${err.message}`);"
);

fs.writeFileSync(filePath, code, 'utf-8');
console.log('✅ Finalized AIStrategyModal.tsx');
