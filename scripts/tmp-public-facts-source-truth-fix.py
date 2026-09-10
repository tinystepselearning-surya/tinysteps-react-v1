from pathlib import Path

path = Path('scripts/audit-public-facts.mjs')
text = path.read_text()
old = """for (const required of [
  'PHONICS_PAGE_PROGRESS_FAQ_COPY',
  'P0 public-fact normalization',
  \"stage: 'Ages 9 to 12'\",
  \"age: 'Ages 8–12'\",
  \"age: 'Ages 7–12'\",
  'For CBSE, ICSE, State Board & International Schools • Ages 3–12',
  '35 minutes per 1:1 class',
  'Fresh-word transfer',
  'Individual pace',
  '3 levels with stage-based progression',
]) {
  if (!viteText.includes(required)) failures.push(`public normalization missing ${JSON.stringify(required)}`);
}
"""
new = """// Only legacy surfaces that still require a build-time migration belong in this
// Vite-normalization check. Commercial owner pages now carry canonical facts in
// their source and must be audited at source instead of requiring obsolete
// Vite replacement markers.
for (const required of [
  'P0 public-fact normalization',
  \"age: 'Ages 8–12'\",
  \"age: 'Ages 7–12'\",
  'For CBSE, ICSE, State Board & International Schools • Ages 3–12',
]) {
  if (!viteText.includes(required)) failures.push(`public normalization missing ${JSON.stringify(required)}`);
}

const SOURCE_LEVEL_PUBLIC_FACTS = [
  ['src/pages/phonics.tsx', [
    'Blending progress depends on the child’s starting point.',
    '35 minutes per live 1:1 class',
    'Fresh-word transfer',
    'Individual pace',
    '3 levels, 101 structured lessons with stage-based progression',
  ]],
  ['src/pages/public/OnlineEnglishClassesForKidsPage.tsx', [
    'Online English Classes for Kids',
    'Ages 3–12',
  ]],
  ['src/pages/public/ReadingClassesForKidsPage.tsx', [
    'Online Reading Classes for Kids',
  ]],
];

for (const [relativePath, requiredSignals] of SOURCE_LEVEL_PUBLIC_FACTS) {
  const filePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(filePath)) {
    failures.push(`${relativePath} is missing from source-level public facts audit`);
    continue;
  }
  const source = fs.readFileSync(filePath, 'utf8');
  for (const required of requiredSignals) {
    if (!source.includes(required)) failures.push(`${relativePath} missing canonical source fact ${JSON.stringify(required)}`);
  }
}
"""
if old not in text:
    raise SystemExit('Expected legacy Vite normalization block not found')
path.write_text(text.replace(old, new, 1))
