import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { scheduleStats } from '../src/features/archive/calendar-model.js';

const data = JSON.parse(await readFile(new URL('../src/data/archive-schedule.json', import.meta.url), 'utf8'));
const report = scheduleStats(data.events);
await mkdir(new URL('../output/', import.meta.url), { recursive: true });
await writeFile(new URL('../output/schedule-status-report.json', import.meta.url), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ generatedAt: report.generatedAt, ...report.totals }, null, 2));
