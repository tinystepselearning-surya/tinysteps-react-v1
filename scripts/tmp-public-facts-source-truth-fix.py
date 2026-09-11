from pathlib import Path

public_facts_path = Path('scripts/audit-public-facts.mjs')
public_facts_text = public_facts_path.read_text()
old_public_facts = """for (const required of [
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
new_public_facts = """// Only legacy surfaces that still require a build-time migration belong in this
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
if old_public_facts not in public_facts_text:
    raise SystemExit('Expected legacy Vite normalization block not found')
public_facts_path.write_text(public_facts_text.replace(old_public_facts, new_public_facts, 1))

offer_path = Path('scripts/public-offer-consistency.mjs')
offer_text = offer_path.read_text()
old_offer = """  {
    path: 'src/pages/PricingPage.tsx',
    value: 'STANDARD_PRICING_SUMMARY',
  },
"""
new_offer = """  // C3 pricing owner reads live pricing directly from the canonical pricing
  // registry. Verify actual source usage instead of requiring the older summary
  // compatibility constant from publicOffer.ts.
  {
    path: 'src/pages/PricingPage.tsx',
    value: 'formatINR(PER_CLASS_PRICE)',
  },
  {
    path: 'src/pages/PricingPage.tsx',
    value: 'ONE_TO_ONE_MONTHLY_PACKAGES[0].monthlyFee',
  },
  {
    path: 'src/pages/PricingPage.tsx',
    value: 'GROUP_MONTHLY_FEES.filter',
  },
  {
    path: 'src/pages/PricingPage.tsx',
    value: 'answer: FREE_DEMO_FULL_DESCRIPTION',
  },
"""
if old_offer not in offer_text:
    raise SystemExit('Expected legacy PricingPage STANDARD_PRICING_SUMMARY requirement not found')
offer_path.write_text(offer_text.replace(old_offer, new_offer, 1))
