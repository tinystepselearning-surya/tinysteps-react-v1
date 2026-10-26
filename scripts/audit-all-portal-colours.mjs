#!/usr/bin/env node
/**
 * Read-only whole-source design-system inventory.
 *
 * Usage:
 *   node scripts/audit-all-portal-colours.mjs
 *
 * This reports potential legacy palette remnants; it does not automatically
 * treat orange/amber/yellow as errors. Status, payment, attendance, classroom
 * and child-learning semantics require contextual accessibility review.
 */
import fs from 'node:fs';
import path from 'node:path';

const sourceRoot = 'src';
const extensions = /\.(?:css|ts|tsx|js|jsx)$/i;
const excluded = /(?:\.test\.|\.spec\.|\.old\.|\.map$)/i;
const legacyUtility = /\b(?:(?:dark|hover|focus|focus-visible|group-hover|sm|md|lg|xl):)?(?:text|bg|border|ring|from|via|to)-(?:orange|amber|yellow|stone)-(?:50|100|200|300|400|500|600|700|800|900|950)(?:\/\d+)?\b/g;
const hardcodedText = /\b(?:text|hover:text|focus:text)-\[#[0-9a-fA-F]{6}\]/g;
const rawTextColor = /\bcolor\s*:\s*#[0-9a-fA-F]{6}\b/g;
const portalPrefixes = [
  ['admin', 'src/pages/admin/'],
  ['founder', 'src/pages/founder/'],
  ['teacher', 'src/pages/teacher/'],
  ['parent', 'src/pages/parent/'],
  ['learningPartner', 'src/pages/lp/'],
  ['school', 'src/pages/school/'],
  ['schoolsOperations', 'src/pages/schools/'],
  ['public', 'src/pages/parents/'],
  ['public', 'src/pages/public/'],
];
const coreShells = {
  admin: 'src/pages/admin/AdminDashboard.tsx',
  teacher: 'src/pages/teacher/TeacherDashboard.tsx',
  parent: 'src/pages/parent/ParentDashboard.tsx',
  learningPartner: 'src/pages/lp/LPDashboard.tsx',
  school: 'src/pages/school/SchoolPortalFoundationPage.tsx',
};

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap(entry => {
    const candidate = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(candidate);
    if (!entry.isFile() || !extensions.test(entry.name) || excluded.test(entry.name)) return [];
    return [candidate];
  });
}

function scope(file) {
  const matched = portalPrefixes.find(([, prefix]) => file.startsWith(prefix));
  if (matched) return matched[0];
  if (file.startsWith('src/pages/') || file.startsWith('src/components/marketing/') || file.startsWith('src/components/Home/')) return 'public';
  if (file.startsWith('src/components/')) return 'shared';
  return 'other';
}
const tally = {};
const samples = {};
let totalFiles = 0;
for (const filePath of walk(sourceRoot)) {
  totalFiles++;
  const file = filePath.replaceAll(path.sep, '/');
  const group = scope(file);
  tally[group] ??= { files: 0, legacyUtilities: 0, hardcodedText: 0, rawCssText: 0 };
  tally[group].files++;
  const source = fs.readFileSync(filePath, 'utf8');
  const legacy = [...source.matchAll(legacyUtility)];
  const hardcoded = [...source.matchAll(hardcodedText)];
  const raw = file.endsWith('.css') ? [...source.matchAll(rawTextColor)] : [];
  tally[group].legacyUtilities += legacy.length;
  tally[group].hardcodedText += hardcoded.length;
  tally[group].rawCssText += raw.length;
  if (legacy.length) {
    samples[group] ??= [];
    if (samples[group].length < 30) {
      samples[group].push({ file, count: legacy.length, examples: [...new Set(legacy.slice(0, 5).map(x => x[0]))] });
    }
  }
}

const missingShellTheme = Object.entries(coreShells)
  .filter(([, file]) => !fs.existsSync(file) || !fs.readFileSync(file, 'utf8').includes('ts-auth-surface'))
  .map(([portal, file]) => ({ portal, file }));
const report = {
  name: 'Tiny Steps public and authenticated palette inventory',
  methodology: 'Static source utility counts, not computed-style or accessibility results',
  sourceFilesScanned: totalFiles,
  byPortal: tally,
  exampleLegacyUtilities: samples,
  requiredShellThemeMissing: missingShellTheme,
  semanticExclusions: ['attendance status', 'billing/payment status', 'errors and warnings', 'classroom annotations', 'child game feedback'],
  followUp: 'Review residual colour usage per portal and with screenshots in light/dark, desktop/mobile, including WCAG contrast and live-state cues',
};
console.log(JSON.stringify(report, null, 2));
if (process.argv.includes('--strict') && missingShellTheme.length) process.exitCode = 1;
