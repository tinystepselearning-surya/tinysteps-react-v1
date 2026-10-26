#!/usr/bin/env node
/**
 * Read-only inventory of public-facing Tiny Steps colour usage and likely contrast issues.
 *
 * Usage: node scripts/audit-public-theme.mjs
 *        node scripts/audit-public-theme.mjs --strict
 *
 * Does not modify files. Does not scan protected classroom/admin/dashboard assets,
 * where status and educational colours require independent review.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PUBLIC_DIRS = [
  'src/pages',
  'src/components/Home',
  'src/components/marketing',
  'src/components/programs',
  'src/components/common',
  'src/components/blog',
];
const EXCLUDE_PARTS = new Set([
  'admin', 'teacher', 'lp', 'parent', 'kid', 'kids', 'founder',
  'messages', 'dev', 'components', 'login', 'games', 'auth',
]);
const legacyTailwind = /(?:bg|text|border|ring|from|via|to|decoration|fill|stroke)-(?:orange|amber|yellow)-\d{2,3}(?:\/\d{1,3})?/g;
const legacyHex = /#(?:fff8ef|fff7ed|fff1e6|fff9f3|fbfaf7|fbfaf8|ff7b66|ff9b72)\b/gi;
const sameElementContrast = /className=["'\x60][^"'\x60>]*(?:bg-(?:sky|blue|rose|pink|amber|yellow|orange)-(?:50|100|200|300)|bg-\[#(?:E7F3FF|F1EDFC|FFE5EB|FFF5DF|6E95D2)\])[^"'\x60>]*text-white[^"'\x60>]*["'\x60]/g;

function list(dir) {
  const folder = path.join(ROOT, dir);
  if (!fs.existsSync(folder)) return [];
  return fs.readdirSync(folder, { withFileTypes: true }).flatMap(entry => {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const parts = rel.split(path.sep);
      if (parts.some(p => EXCLUDE_PARTS.has(p))) return [];
      return list(rel);
    }
    if (!entry.isFile() || !/\.(?:tsx|jsx|css)$/.test(entry.name)) return [];
    if (/\.(?:test|spec|old)\./i.test(entry.name)) return [];
    return [rel];
  });
}

const uniqueFiles = [...new Set(PUBLIC_DIRS.flatMap(list))].sort();
const details = [];
const risks = [];
let warmClassCount = 0;
let warmHexCount = 0;
for (const file of uniqueFiles) {
  const content = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const classes = [...content.matchAll(legacyTailwind)].map(x => x[0]);
  const hexes = [...content.matchAll(legacyHex)].map(x => x[0]);
  const sameTagWarnings = [...content.matchAll(sameElementContrast)].map(x => x[0].slice(0, 150));
  warmClassCount += classes.length;
  warmHexCount += hexes.length;
  if (classes.length || hexes.length || sameTagWarnings.length) {
    details.push({
      file,
      legacy_classes: classes.length,
      legacy_hexes: hexes.length,
      potential_light_background_white_text: sameTagWarnings.length,
      examples: [...new Set([...classes, ...hexes])].slice(0, 8),
    });
  }
  if (sameTagWarnings.length) risks.push({ file, issue: 'Possible white text on pastel fill', count: sameTagWarnings.length });

  // Scoped audit: a dark LeadCard can have a nested LeadSectionHeading whose
  // own default text-slate-900 overrides inherited text-white.
  for (const match of content.matchAll(/<LeadCard\b([^>]*)>([\s\S]*?)<\/LeadCard>/g)) {
    const [block, attrs] = match;
    if (!/text-white|bg-slate-9|from-slate-9|#0f172a|#17284C|#212B5C/.test(attrs)) continue;
    if (!/<LeadSectionHeading\b/.test(block)) continue;
    if (!/<LeadSectionHeading\b[^>]*tone="dark"/.test(block)) {
      risks.push({ file, issue: 'Dark LeadCard with heading missing tone="dark"', count: 1 });
    }
  }
}
details.sort((a, b) => (b.legacy_classes + b.legacy_hexes) - (a.legacy_classes + a.legacy_hexes));
const report = {
  audit: 'Tiny Steps Sunrise/Ocean public source colour audit',
  source_files_checked: uniqueFiles.length,
  legacy_warm_utility_instances: warmClassCount,
  legacy_warm_hex_instances: warmHexCount,
  potential_contrast_issues: risks,
  top_remaining_candidates: details.slice(0, 40),
  note: 'Source heuristics, not a browser-verified WCAG audit. Warm colour uses can be intentional; review every candidate before changing status/learning semantics.',
};
console.log(JSON.stringify(report, null, 2));
if (process.argv.includes('--strict') && risks.length) process.exitCode = 1;
