#!/usr/bin/env node
/**
 * Whole-repository SOURCE inventory of text-colour utilities (read-only).
 * Purpose: distinguish public palette leftovers from protected/status or
 * learning-interface colours. Not a computed-style/gradient contrast audit.
 *
 * node scripts/audit-public-text-palette.mjs
 * node scripts/audit-public-text-palette.mjs --strict
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dirs = ['src', 'public'];
const sourceExtensions = /\.(?:tsx|jsx|ts|js|css)$/i;
const excludedFiles = /(?:\.test\.|\.spec\.|\.old\.|\.min\.|\.map$)/i;
const legacyText = /(?<![\w-])(?:(?:hover|group-hover|focus|focus-visible|dark|sm|md|lg|xl):)?text-(?:orange|amber|yellow|stone)-(?:50|100|200|300|400|500|600|700|800|900|950)(?:\/\d{1,3})?/g;
const rawText = /(?<![\w-])(?:text|hover:text|group-hover:text)-\[#[a-fA-F0-9]{6}\]/g;
const cssText = /(?:^|[;{\s])color\s*:\s*#[a-fA-F0-9]{6}\b/g;
const protectedPath = /(?:^|\/)(?:admin|teacher|parent|lp|kid|kids|school|schools|payments|messages|founder|auth|login|dev)(?:\/|$)/i;
const specialPath = /(?:^|\/)(?:games|dailypractice|classroom|annotation|effects)(?:\/|$)|(?:^|\/)(?:Kids\w*|Admin|Login\w*|Debug\w*|PublicEnglishGame\w*|FreeEnglishGameLandingPage|FreeLetterTracingGamePage|LetterTracingWithSoundsGamePage)\.(?:tsx|jsx)$/i;
const publicComponent = /^src\/components\/(?:Home|blog|common|marketing|programs|resources|seo|entity)\//;
const publicPage = /^src\/pages\//;
const guarded = [
  'src/pages/HomePage.tsx',
  'src/pages/phonics.tsx',
  'src/pages/grammar.tsx',
  'src/pages/speaking.tsx',
  'src/pages/PricingPage.tsx',
  'src/pages/CoursesPage.tsx',
  'src/pages/ResourcesPage.tsx',
  'src/pages/ContactPage.tsx',
  'src/pages/FAQPage.tsx',
];

function list(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(item => {
    const file = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (['node_modules', 'dist', 'build', 'coverage', '.git'].includes(item.name)) return [];
      return list(file);
    }
    return item.isFile() && sourceExtensions.test(item.name) && !excludedFiles.test(item.name) ? [file] : [];
  });
}
function scope(file) {
  if (protectedPath.test(file)) return 'protected';
  if (specialPath.test(file)) return 'specialised';
  if (publicPage.test(file) || publicComponent.test(file) || file === 'src/index.css') return 'public';
  return 'other';
}

const files = dirs.flatMap(dir => list(path.join(root, dir)));
const findings = [];
const checked = { public: 0, protected: 0, specialised: 0, other: 0 };
for (const absolute of files) {
  const file = path.relative(root, absolute).replaceAll(path.sep, '/');
  const group = scope(file);
  checked[group]++;
  const lines = fs.readFileSync(absolute, 'utf8').split('\n');
  lines.forEach((source, index) => {
    const classMatches = [...source.matchAll(legacyText)].map(m => m[0]);
    const customMatches = [...source.matchAll(rawText)].map(m => m[0]);
    const styleMatches = file.endsWith('.css') ? [...source.matchAll(cssText)].map(m => m[0].trim()) : [];
    if (!(classMatches.length || customMatches.length || styleMatches.length)) return;
    findings.push({
      file,
      line: index + 1,
      scope: group,
      legacy_text: classMatches,
      custom_text: customMatches,
      css_color: styleMatches,
      excerpt: source.trim().slice(0, 180),
    });
  });
}
const byScope = {};
for (const group of Object.keys(checked)) {
  const rows = findings.filter(f => f.scope === group);
  byScope[group] = {
    source_files_scanned: checked[group],
    lines_with_text_colours: rows.length,
    legacy_warm_class_occurrences: rows.reduce((sum, f) => sum + f.legacy_text.length, 0),
    custom_text_colour_occurrences: rows.reduce((sum, f) => sum + f.custom_text.length, 0),
    raw_css_colour_occurrences: rows.reduce((sum, f) => sum + f.css_color.length, 0),
  };
}
const remainingByFile = new Map();
for (const f of findings.filter(f => f.scope === 'public' && f.legacy_text.length)) {
  const item = remainingByFile.get(f.file) || { file: f.file, occurrences: 0, examples: [] };
  item.occurrences += f.legacy_text.length;
  if (item.examples.length < 4) item.examples.push({ line: f.line, classes: f.legacy_text });
  remainingByFile.set(f.file, item);
}
const guardedFailures = findings.filter(f => guarded.includes(f.file) && f.legacy_text.length);
const report = {
  audit: 'Tiny Steps source-wide text palette inventory',
  nature: 'Static source heuristics only; no browser computed styles or gradient contrast assessment',
  source_files_scanned: files.length,
  by_scope: byScope,
  protected_and_specialised_policy: 'Inventory only; do not recolour semantics, severity, classroom or learning cues without a separate review',
  public_legacy_warm_text_files: [...remainingByFile.values()].sort((a,b) => b.occurrences-a.occurrences).slice(0, 60),
  public_legacy_warm_text_file_count: remainingByFile.size,
  guarded_high_traffic_unapproved_warm_classes: guardedFailures.map(f => ({ file: f.file, line: f.line, classes: f.legacy_text })),
  accessibility: 'Use a browser contrast checker on gradients/images; #FF7A00 is 2.61:1 on white and cannot serve as small copy there',
};
console.log(JSON.stringify(report, null, 2));
if (process.argv.includes('--strict') && guardedFailures.length) process.exitCode = 1;
