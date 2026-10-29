import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const historyEntries = [];
const baseDate = new Date('2026-01-01T00:00:00Z').getTime();

for (let i = 1; i <= 520; i++) {
  historyEntries.push({
    id: `job-seed-${String(i).padStart(4, '0')}`,
    url: `https://www.youtube.com/watch?v=video${i}`,
    title: `Test Video #${i}`,
    duration: 60 + (i % 300),
    filesize: 1048576 * (1 + (i % 50)),
    format_id: i % 2 === 0 ? '137+140' : '22',
    preset: i % 3 === 0 ? 'Best Quality' : 'Audio Only MP3',
    outputPath: `C:\\Downloads\\video_${i}.mp4`,
    timestamp: new Date(baseDate + i * 60000).toISOString(),
    status: i % 15 === 0 ? 'error' : 'completed',
    error: i % 15 === 0 ? 'Network timeout' : undefined,
  });
}

const outputPath = path.join(__dirname, 'history_seed.json');
fs.writeFileSync(outputPath, JSON.stringify(historyEntries, null, 2), 'utf-8');
console.log(`Generated ${historyEntries.length} history entries in ${outputPath}`);
