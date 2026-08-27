import * as fs from 'fs';

const data = JSON.parse(fs.readFileSync('scan_summary.json', 'utf-8'));

for (const file of Object.keys(data.details)) {
  if (file.startsWith('src\\components')) {
    console.log(`\n================= ${file} (${data.details[file].length} items) =================`);
    data.details[file].forEach((item: any) => {
      console.log(`L${item.line}: ${item.content}`);
    });
  }
}
