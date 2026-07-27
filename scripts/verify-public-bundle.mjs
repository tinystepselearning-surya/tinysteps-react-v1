#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { brotliCompressSync, gzipSync } from 'node:zlib';

const BANNED_SOURCE_PATTERNS = [
  /firebase\/auth/i,
  /firebase\/functions/i,
  /firebase\/firestore/i,
  /src\/lib\/firebaseConfig/i,
  /@capacitor\/app/i,
  /@capacitor\/preferences/i,
  /pushNotifications/i,
  /nativeAuthDiagnostics/i,
];

function parseArgs(argv) {
  const values = { maxGzip: 300 * 1024, report: 'artifacts/public-bundle-report.json' };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--max-gzip') values.maxGzip = Number(argv[++index]) * 1024;
    else if (argv[index] === '--report') values.report = argv[++index];
    else throw new Error(`Unknown argument: ${argv[index]}`);
  }
  return values;
}

export function inspectPublicEntry({ cwd = process.cwd(), maxGzip = 300 * 1024 } = {}) {
  const dist = path.join(cwd, 'dist');
  const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
  const assetUrls = new Set([
    ...[...html.matchAll(/<script[^>]+type=["']module["'][^>]+src=["']([^"']+\.js)["']/gi)].map((match) => match[1]),
    ...[...html.matchAll(/<link[^>]+rel=["']modulepreload["'][^>]+href=["']([^"']+\.js)["']/gi)].map((match) => match[1]),
  ]);
  const assets = [...assetUrls].map((url) => {
    const filename = url.replace(/^\/+/, '');
    const absolutePath = path.join(dist, filename);
    const bytes = fs.readFileSync(absolutePath);
    const mapPath = `${absolutePath}.map`;
    const sources = fs.existsSync(mapPath)
      ? JSON.parse(fs.readFileSync(mapPath, 'utf8')).sources || []
      : [];
    const bannedSources = sources.filter((source) => BANNED_SOURCE_PATTERNS.some((pattern) => pattern.test(source)));
    return {
      url,
      rawBytes: bytes.length,
      gzipBytes: gzipSync(bytes, { level: 9 }).length,
      brotliBytes: brotliCompressSync(bytes).length,
      bannedSources,
    };
  });
  const totals = assets.reduce(
    (sum, asset) => ({
      rawBytes: sum.rawBytes + asset.rawBytes,
      gzipBytes: sum.gzipBytes + asset.gzipBytes,
      brotliBytes: sum.brotliBytes + asset.brotliBytes,
    }),
    { rawBytes: 0, gzipBytes: 0, brotliBytes: 0 },
  );
  const bannedSources = assets.flatMap((asset) => asset.bannedSources.map((source) => ({ asset: asset.url, source })));
  return {
    generatedAt: new Date().toISOString(),
    maxGzipBytes: maxGzip,
    assets,
    totals,
    bannedSources,
    passed: totals.gzipBytes <= maxGzip && bannedSources.length === 0,
  };
}

const options = parseArgs(process.argv.slice(2));
const report = inspectPublicEntry(options);
fs.mkdirSync(path.dirname(path.resolve(options.report)), { recursive: true });
fs.writeFileSync(options.report, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`Public initial JS: ${(report.totals.rawBytes / 1024).toFixed(2)} KiB raw, ${(report.totals.gzipBytes / 1024).toFixed(2)} KiB gzip, ${(report.totals.brotliBytes / 1024).toFixed(2)} KiB Brotli`);
console.log(`Initial dependency exclusions: ${report.bannedSources.length === 0 ? 'PASS' : 'FAIL'}`);
if (!report.passed) process.exitCode = 1;
