import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GSC_INDEX_TARGETS } from './gsc-crawled-not-indexed-manifest.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const artifactsDir = path.join(root, 'artifacts');
const outputPath = path.join(artifactsDir, 'gsc-index-submission-targets.txt');

if (GSC_INDEX_TARGETS.length !== 23) {
  throw new Error(`Expected exactly 23 remediation index targets; found ${GSC_INDEX_TARGETS.length}.`);
}

fs.mkdirSync(artifactsDir, { recursive: true });
const urls = GSC_INDEX_TARGETS.map((pathname) => `https://tinystepslearning.com${pathname}`);
const header = [
  '# Tiny Steps — GSC Crawled/Currently Not Indexed remediation targets',
  '# Generated from scripts/gsc-crawled-not-indexed-manifest.mjs',
  '# Submit/request indexing only for these 23 URLs from the 52-URL remediation set.',
  '# Redirects, noindex archives, sitemap XML and RSS resources are intentionally excluded.',
  '',
];

fs.writeFileSync(outputPath, `${header.join('\n')}${urls.join('\n')}\n`, 'utf8');
console.log(`[gsc-submission-targets] wrote ${urls.length} URLs to ${path.relative(root, outputPath)}`);
