#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

const DIST_DIR = path.resolve(process.cwd(), 'dist');
const key = (process.env.INDEXNOW_KEY || '').trim();

if (!key) {
  console.log('INDEXNOW_KEY not set; skipping IndexNow key file generation.');
  process.exit(0);
}

if (!/^[A-Za-z0-9-]{8,}$/.test(key)) {
  console.error('INDEXNOW_KEY format is invalid.');
  process.exit(1);
}

await fs.mkdir(DIST_DIR, { recursive: true });
const keyFilePath = path.join(DIST_DIR, `${key}.txt`);
await fs.writeFile(keyFilePath, `${key}\n`, 'utf8');
console.log(`Wrote IndexNow key file: ${path.basename(keyFilePath)}`);
