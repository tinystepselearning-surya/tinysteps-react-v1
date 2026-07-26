#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const indexPath = path.join(DIST, 'index.html');

const SPA_ENTRY_PATHS = [
  '/login',
  '/unauthorized',
  '/surya',
  '/admin',
  '/teacher',
  '/parent',
  '/kids',
  '/kid',
  '/messages',
  '/dev',
  '/debug-lessons',
  '/games',
  '/learning-partner/dashboard',
  '/learningpartner/dashboard',
];

function makePrivateShell(html) {
  const robots = 'noindex, nofollow, noarchive';
  let result = html;
  result = result.replace(
    /<meta name="robots"[^>]*>/i,
    `<meta name="robots" content="${robots}">`,
  );
  result = result.replace(
    /<meta name="googlebot"[^>]*>/i,
    `<meta name="googlebot" content="${robots}">`,
  );
  result = result.replace(
    /<meta name="bingbot"[^>]*>/i,
    `<meta name="bingbot" content="${robots}">`,
  );
  return result;
}

const indexHtml = await fs.readFile(indexPath, 'utf8');
const privateShell = makePrivateShell(indexHtml);

for (const routePath of SPA_ENTRY_PATHS) {
  const outputDirectory = path.join(DIST, routePath.slice(1));
  await fs.mkdir(outputDirectory, { recursive: true });
  await fs.writeFile(path.join(outputDirectory, 'index.html'), privateShell, 'utf8');
  console.log(`[spa-entrypoint] ${routePath}`);
}
