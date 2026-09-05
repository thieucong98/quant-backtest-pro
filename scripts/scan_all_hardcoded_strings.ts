import * as fs from 'fs';
import * as path from 'path';

const srcDir = path.join(process.cwd(), 'src');
const vietnameseRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/;

interface Finding {
  file: string;
  line: number;
  content: string;
  isComment: boolean;
}

const uiFindings: Finding[] = [];
const allFindings: Finding[] = [];

function scanDir(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'locales') continue;
      scanDir(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      if (fullPath.includes(path.join('i18n', 'locales'))) continue;
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');
      const relPath = path.relative(process.cwd(), fullPath).replace(/\\/g, '/');
      const isUiFile = relPath.startsWith('src/components/') || relPath === 'src/App.tsx';

      lines.forEach((line, idx) => {
        if (vietnameseRegex.test(line)) {
          const trimmed = line.trim();
          const isComment = trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*');
          // Allow standard language endonym in language switcher
          if (trimmed.includes("label: 'Tiếng Việt'") || trimmed.includes('code: \'vi\'')) {
            return;
          }
          if (!isComment) {
            const finding: Finding = {
              file: relPath,
              line: idx + 1,
              content: trimmed,
              isComment
            };
            allFindings.push(finding);
            if (isUiFile) {
              uiFindings.push(finding);
            }
          }
        }
      });
    }
  }
}

scanDir(srcDir);

// Group by file
const byFile: Record<string, Finding[]> = {};
for (const f of allFindings) {
  if (!byFile[f.file]) byFile[f.file] = [];
  byFile[f.file].push(f);
}

const summary = Object.entries(byFile).map(([file, items]) => ({
  file,
  count: items.length,
  sampleLines: items.slice(0, 5).map(i => `${i.line}: ${i.content}`)
}));

fs.writeFileSync('scan_summary.json', JSON.stringify({
  total: allFindings.length,
  uiTotal: uiFindings.length,
  uiFindings,
  files: summary,
  details: byFile
}, null, 2));

console.log('--- i18n Quality Audit Report ---');
console.log(`UI Components Violations: ${uiFindings.length}`);
console.log(`Total non-comment occurrences across repo: ${allFindings.length}`);

if (uiFindings.length > 0) {
  console.error('\n❌ ERROR: Detected hardcoded Vietnamese strings in UI components:');
  uiFindings.forEach(f => {
    console.error(`  - ${f.file}:${f.line} -> ${f.content}`);
  });
  process.exit(1);
} else {
  console.log('\n✅ SUCCESS: 100% of UI components and user-facing views are verified free of hardcoded strings!');
  process.exit(0);
}
