import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GSC_INDEX_TARGETS } from './gsc-crawled-not-indexed-manifest.mjs';
import { rewriteLegacyWeekBlogPaths } from '../src/lib/blogWeekRenames.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const artifactsDir = path.join(root, 'artifacts');
const outputPath = path.join(artifactsDir, 'gsc-index-submission-targets.txt');

if (GSC_INDEX_TARGETS.length !== 23) {
  throw new Error(`Expected exactly 23 remediation index targets; found ${GSC_INDEX_TARGETS.length}.`);
}

const canonicalTargets = GSC_INDEX_TARGETS.map((pathname) => rewriteLegacyWeekBlogPaths(pathname));
if (new Set(canonicalTargets).size !== canonicalTargets.length) {
  throw new Error('Canonicalized GSC remediation targets contain a duplicate URL.');
}

fs.mkdirSync(artifactsDir, { recursive: true });
const urls = canonicalTargets.map((pathname) => `https://tinystepslearning.com${pathname}`);
const header = [
  '# Tiny Steps — GSC Crawled/Currently Not Indexed remediation targets',
  '# Generated from the historical scripts/gsc-crawled-not-indexed-manifest.mjs snapshot',
  '# Renamed legacy blog URLs are normalized to their current canonical URL before submission.',
  '# Submit/request indexing only for these 23 canonical URLs from the 52-URL remediation set.',
  '# Redirects, noindex archives, sitemap XML and RSS resources are intentionally excluded.',
  '',
];

fs.writeFileSync(outputPath, `${header.join('\n')}${urls.join('\n')}\n`, 'utf8');
console.log(`[gsc-submission-targets] wrote ${urls.length} canonical URLs to ${path.relative(root, outputPath)}`);
