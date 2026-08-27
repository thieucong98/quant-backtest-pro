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

const findings: Finding[] = [];

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
      lines.forEach((line, idx) => {
        if (vietnameseRegex.test(line)) {
          const trimmed = line.trim();
          const isComment = trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*');
          if (!isComment) {
            findings.push({
              file: path.relative(process.cwd(), fullPath),
              line: idx + 1,
              content: trimmed,
              isComment
            });
          }
        }
      });
    }
  }
}

scanDir(srcDir);

// Group by file
const byFile: Record<string, Finding[]> = {};
for (const f of findings) {
  if (!byFile[f.file]) byFile[f.file] = [];
  byFile[f.file].push(f);
}

const summary = Object.entries(byFile).map(([file, items]) => ({ file, count: items.length, sampleLines: items.slice(0, 5).map(i => `${i.line}: ${i.content}`) }));
fs.writeFileSync('scan_summary.json', JSON.stringify({ total: findings.length, files: summary, details: byFile }, null, 2));
console.log('Saved scan_summary.json. Total non-comment Vietnamese occurrences:', findings.length);
console.log('Files involved:', Object.keys(byFile));
