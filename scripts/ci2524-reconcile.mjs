import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const BASE = '8bda454ee12bc29933306e79c308bcaa4053c3ac';
const ROOT = process.cwd();
const SEO = 'src/tests/seo/';
const RETIRED = 'how-to-choose-phonics-classes';
const OWNER = '/best-online-phonics-classes-for-kids-in-india';
const workerPaths = ['scripts/ci2524-reconcile.mjs', '.github/workflows/ci2524-repair.yml'];
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
assert.equal(process.env.GITHUB_REF, 'refs/heads/fix/ci2524-seo-recovery-contracts');
for (const name of git('diff', '--name-only', BASE, 'HEAD').split('\n').filter(Boolean)) {
  assert(workerPaths.includes(name), `Unreviewed intervening change: ${name}`);
}
const changed = new Set();
const read = (name) => fs.readFileSync(path.join(ROOT, name), 'utf8');
function put(name, text) {
  fs.mkdirSync(path.dirname(path.join(ROOT, name)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, name), text);
  changed.add(name);
}
function swap(text, before, after) {
  assert(text.includes(before), `Expected literal is missing: ${before}`);
  return text.split(before).join(after);
}
function edit(name, fn) {
  const before = read(name);
  const after = fn(before);
  assert.notEqual(after, before, `No scoped edit made: ${name}`);
  put(name, after);
}

const inventoryFiles = [
  'blogB10TechnicalGeoAuthority', 'blogB11LeadAttribution', 'blogB12MeasurementGovernance',
  'blogB8FirstPartyKnowledge', 'blogB9GrammarSpeakingAuthority', 'blogBaselineAudit',
  'blogEditorialCleanup', 'blogEditorialTrust', 'blogIndexUx', 'blogParentAuthorityPillars',
  'blogTitleOptimization', 'blogWeekUrlCleanup',
];
for (const file of inventoryFiles) {
  edit(`${SEO}${file}.spec.ts`, (text) => {
    const next = text.replace(/\.toHaveLength\(84\)/g, '.toHaveLength(83)')
      .replace(/\.toBe\(84\)/g, '.toBe(83)')
      .replace(/("(?:sourcePostFiles|routedPostSlugs)": )84/g, (_match, prefix) => prefix + '83');
    assert.notEqual(next, text, `No known corpus-count assertion: ${file}`);
    return next.replace(/post-R21/g, 'post-Brick-4').replace(/84-source/g, '83-source')
      .replace(/84-article/g, '83-article').replace(/all 84/g, 'all 83');
  });
}

const ctrTitles = {
  'satpin-phonics-guide': 'SATPIN Phonics Guide: Sounds, Order, Words & Blending',
  'long-vowel-sounds-for-kids': 'Long Vowel Sounds for Kids: Rules, Patterns & Examples',
  'grammar-conjunctions': 'Conjunctions for Kids: And, But, Because & So Examples',
  'grammar-subject-verb': 'Subject-Verb Agreement for Kids: Rules, Examples & Mistakes',
  'digraphs-and-tricky-words': 'Digraphs and Tricky Words for Kids: Examples & Reading Tips',
};
const titleEdits = [
  ['blogParentAuthorityPillars', 'SATPIN Phonics Guide for Parents: How to Start and What to Expect', ctrTitles['satpin-phonics-guide']],
  ['blogQualityAuthoritativeSequenceBlog19', 'SATPIN Phonics Guide for Parents: How to Start and What to Expect', ctrTitles['satpin-phonics-guide']],
  ['blogQualityAuthoritativeSequenceBlog04', 'Digraphs and Tricky Words: What to Decode and What to Remember', ctrTitles['digraphs-and-tricky-words']],
  ['blogQualityAuthoritativeSequenceBlog11', 'Long Vowel Sounds for Kids: Pattern Order, Practice, and Common Mix-Ups', ctrTitles['long-vowel-sounds-for-kids']],
  ['blogQualityGrammar63', 'Conjunctions for Kids: How to Use and, but, because and so', ctrTitles['grammar-conjunctions']],
  ['blogQualityGrammar64', 'Subject-Verb Agreement for Kids: Common Mistakes and Easy Fixes', ctrTitles['grammar-subject-verb']],
  ['blogTitleOptimization', 'Conjunctions for Kids: How to Use and, but, because and so', ctrTitles['grammar-conjunctions']],
  ['blogTitleOptimization', 'Subject-Verb Agreement for Kids: Common Mistakes and Easy Fixes', ctrTitles['grammar-subject-verb']],
];
for (const [file, before, after] of titleEdits) edit(`${SEO}${file}.spec.ts`, (text) => swap(text, before, after));
edit(`${SEO}blogParentAuthorityPillars.spec.ts`, (text) => swap(text,
  'without changing its primary title', 'with its approved Brick 10 title experiment'));
for (const file of ['blogTitleOptimization', 'blogWeekUrlCleanup']) {
  edit(`${SEO}${file}.spec.ts`, (text) => {
    let next = swap(text, '.toBe(rename.title)', '.toBe(RECOVERY_CTR_TITLES[rename.slug] ?? rename.title)');
    next = "import { RECOVERY_CTR_TITLES } from './fixtures/seoRecoveryCorpus';\n" + next;
    return next;
  });
}

for (const file of [
  'blogQualityAuthoritativeSequenceBlog06', 'blogQualityAuthoritativeSequenceBlog07',
  'blogQualityAuthoritativeSequenceBlog08', 'blogQualityAuthoritativeSequenceBlog12',
  'blogQualityAuthoritativeSequenceBlog21', 'blogQualityAuthoritativeSequenceBlog34',
  'blogQualityParentCommunication',
]) edit(`${SEO}${file}.spec.ts`, (text) => swap(text, `/blog/${RETIRED}`, OWNER));

// These are static fixture migrations, not runtime normalization of expectations.
function readerFacingLiteral(value) {
  return value
    .replace(/\bThis\s+Blog\s+#?\d+\s+owns\b/gi, 'This guide covers')
    .replace(/\bThis\s+Blog\s+#?\d+\b/gi, 'This guide')
    .replace(/\bHow\s+Blog\s+#?\d+\s+differs\b/gi, 'How this guide differs')
    .replace(/\bUse\s+Blog\s+#?\d+\s*,\s*/gi, 'Use ')
    .replace(/\bBlog\s+#?\d+\s*[:,]\s*/gi, '')
    .replace(/\bBlog\s+#?\d+\s+owns\b/gi, 'This guide covers')
    .replace(/\bBlog\s+#?\d+\s+asks\b/gi, 'This guide asks')
    .replace(/^\s*Blog\s+#?\d+\b/i, 'This guide')
    .replace(/\bBlog\s+#?\d+\b/gi, 'this guide')
    .replace(/\bThis\s+article\s+is\s+the\s+\*\*([^*]+?)\s+owner\*\*/gi, 'This guide focuses on **$1**')
    .replace(/\bchoose\s+the\s+right\s+owner\b/gi, 'choose the right guide');
}
for (const file of [
  'blogQualityAuthoritativeSequenceBlog19', 'blogQualityAuthoritativeSequenceBlog27',
  'blogQualityResearchSchools56', 'blogQualityResearchSchools57', 'blogQualityResearchSchools58',
  'blogQualityResearchSchools59', 'blogQualityResearchSchools60',
]) {
  edit(`${SEO}${file}.spec.ts`, (text) => text.replace(
    /expect\(body\)\.toContain\('((?:\\.|[^'\\])*)'\)/g,
    (whole, literal) => `expect(body).toContain('${readerFacingLiteral(literal)}')`,
  ));
}
for (const file of ['blogQualityAuthoritativeSequenceBlog19', 'blogQualityParentCommunication50']) {
  edit(`${SEO}${file}.spec.ts`, (text) => swap(text,
    "expect(post?.modifiedDate).toBe('2026-08-30')", "expect(post?.modifiedDate).toBe('2026-09-12')"));
}
edit(`${SEO}blogQualityParentCommunication50.spec.ts`, (text) => swap(text,
  'expect(post?.faq).toHaveLength(6)', 'expect(post?.faq).toHaveLength(7)'));
edit(`${SEO}blogHeroFamilies.spec.ts`, (text) => swap(text, `  '${RETIRED}',\n`, ''));

edit(`${SEO}blogSitemapLastmod.spec.ts`, (text) => {
  let next = swap(text, 'keeps the real 2026-08-30 refresh date on all twenty articles',
    'keeps truthful refresh dates on the nineteen surviving articles and excludes retired Blog 10');
  next = swap(next, '      const post = bySlug.get(slug);', `      const post = bySlug.get(slug);\n      if (slug === '${RETIRED}') {\n        expect(post, 'Brick 4 retired this article').toBeUndefined();\n        continue;\n      }`);
  next = swap(next,
    "expect(post?.modifiedDate, `${slug} should expose the batch refresh date`).toBe('2026-08-30');",
    "expect(post?.modifiedDate, `${slug} should expose its actual refresh date`).toBe(\n        slug === 'satpin-phonics-guide' ? '2026-09-12' : '2026-08-30',\n      );");
  return next;
});

const retiredImport = "// @ts-expect-error Consolidation tooling is executable ESM JavaScript.\nimport { RETIRED_BLOG_PATH_REDIRECTS } from '../../../scripts/blog-consolidation-map.mjs';\n";
edit(`${SEO}recoveryBrick3CommercialCannibalisation.spec.ts`, (text) => {
  let next = retiredImport + text;
  next = swap(next, 'hands the one remaining editorial/commercial collision to Brick 4 without creating a new owner',
    'verifies the Brick 4 retirement without creating or restoring a competing owner');
  next = swap(next, "    const howToChoose = read('src/content/blog/posts/phonics/how-to-choose-phonics-classes.ts');",
    "    const retiredPostExists = fs.existsSync(path.join(root, 'src/content/blog/posts/phonics/how-to-choose-phonics-classes.ts'));");
  next = swap(next, "    expect(howToChoose).toContain(\"slug: 'how-to-choose-phonics-classes'\");", '    expect(retiredPostExists).toBe(false);');
  next = swap(next, "    expect(brick1).toContain('**MERGE**');", `    expect(brick1).toContain('${OWNER}');\n    const retirement = SEO_RECOVERY_BRICK3_PENDING_BRICK4_RETIREMENT;\n    for (const source of [retirement.source, ...retirement.historicalSources]) {\n      expect(RETIRED_BLOG_PATH_REDIRECTS[source]).toBe(retirement.destination);\n    }`);
  return next;
});
edit(`${SEO}phonicsBrick2ComparisonAuthority.spec.ts`, (text) => {
  const start = text.indexOf("  it('keeps buyer guidance connected to the authoritative editorial comparison article'");
  const end = text.indexOf("  it('uses centralized public facts", start);
  assert(start >= 0 && end > start);
  return text.slice(0, start) + `  it('keeps the merged buyer framework on the surviving comparison owner', () => {\n    const page = read('src/pages/public/BestOnlinePhonicsClassesIndiaPage.tsx');\n    expect(fs.existsSync(path.join(repoRoot, 'src/content/blog/posts/phonics/${RETIRED}.ts'))).toBe(false);\n    for (const marker of ['const decisionGates = [', '1. Child fit', '2. Teaching quality', '3. Proof of transfer', '4. Practical clarity', 'const providerScorecard = [', 'const demoQuestions = [', 'const redFlags = [']) {\n      expect(page).toContain(marker);\n    }\n    expect(page).not.toContain('/blog/${RETIRED}');\n  });\n\n` + text.slice(end);
});

// Preserve historical numbering; remove the retired page from active recommendations.
edit('src/content/blog/shared/authorityLinking.ts', (text) => {
  let next = swap(text, `export const B7_BEST_PHONICS_DECISION_GUIDES = Object.freeze([\n  '${RETIRED}',`,
    'export const B7_BEST_PHONICS_DECISION_GUIDES = Object.freeze([');
  next = swap(next, 'export const B7_BLOG_AUTHORITY_PLANS:',
    '// Historical founder-approved sequence. Brick 4 retired Blog 10; do not renumber the surviving articles.\nexport const B7_BLOG_AUTHORITY_PLANS:');
  return next;
});
edit(`${SEO}phonicsBrick7IntentLinking.spec.ts`, (text) => {
  let next = swap(text, "const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));",
    `const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));\nconst retiredSlug = '${RETIRED}';\n// Exclude only the explicitly approved retirement, never arbitrary missing records.\nconst activePlans = B7_BLOG_AUTHORITY_PLANS.filter((plan) => plan.slug !== retiredSlug);`);
  next = swap(next, 'maps exactly Blogs 1-51 in the founder-approved sequence',
    'preserves the historical 1-51 sequence and resolves all fifty surviving articles');
  next = swap(next, '    for (const plan of B7_BLOG_AUTHORITY_PLANS) {', '    for (const plan of activePlans) {');
  next = swap(next, '    expect(new Set(B7_BLOG_AUTHORITY_PLANS.map((plan) => plan.slug)).size).toBe(51);',
    `    expect(new Set(B7_BLOG_AUTHORITY_PLANS.map((plan) => plan.slug)).size).toBe(51);\n    expect(activePlans).toHaveLength(50);\n    expect(B7_BLOG_AUTHORITY_PLANS.filter((plan) => !bySlug.has(plan.slug)).map((plan) => ({ number: plan.number, slug: plan.slug, destination: plan.primary.to }))).toEqual([\n      { number: 10, slug: retiredSlug, destination: BEST_PHONICS },\n    ]);\n    expect(bySlug.has(retiredSlug)).toBe(false);`);
  next = swap(next, 'expect(B7_BEST_PHONICS_DECISION_GUIDES).toHaveLength(6);', 'expect(B7_BEST_PHONICS_DECISION_GUIDES).toHaveLength(5);\n    expect(B7_BEST_PHONICS_DECISION_GUIDES).not.toContain(retiredSlug);');
  next = swap(next, '      expect(getBlogAuthorityPlan(slug)).not.toBeNull();', '      expect(getBlogAuthorityPlan(slug)).not.toBeNull();\n      expect(bySlug.has(slug), `${slug} must be a live recommendation`).toBe(true);');
  return next;
});
edit('src/tests/components/programs/ClusterSeoNav.spec.tsx', (text) => {
  let next = swap(text, '/how to choose a phonics class/i', '/compare online phonics classes/i');
  next = swap(next, `      '/blog/${RETIRED}',`, `      '${OWNER}',`);
  next = swap(next, "    expect(screen.getAllByRole('link')).toHaveLength(7);", `    expect(screen.getAllByRole('link')).toHaveLength(7);\n    for (const link of screen.getAllByRole('link')) {\n      expect(link).not.toHaveAttribute('href', '/blog/${RETIRED}');\n    }`);
  return next;
});

put(`${SEO}blogQualityAuthoritativeSequenceBlog10.spec.ts`, `import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
${retiredImport}
const root = process.cwd();
const owner = '${OWNER}';
const comparison = fs.readFileSync(path.join(root, 'src/pages/public/BestOnlinePhonicsClassesIndiaPage.tsx'), 'utf8');
function arraySource(name: string): string {
  const start = comparison.indexOf('const ' + name + ' = [');
  expect(start, name + ' must remain an explicit comparison section').toBeGreaterThanOrEqual(0);
  const end = comparison.indexOf('\\n];', start);
  expect(end).toBeGreaterThan(start);
  return comparison.slice(start, end);
}

describe('authoritative Blog #10 post-Brick-4 consolidation quality lock', () => {
  it('retires the duplicate article and sends all historical aliases directly to the comparison owner', () => {
    expect(blogPosts.some((post) => post.slug === '${RETIRED}')).toBe(false);
    expect(fs.existsSync(path.join(root, 'src/content/blog/posts/phonics/${RETIRED}.ts'))).toBe(false);
    for (const source of ['/blog/${RETIRED}', '/blog/best-online-phonics-classes-for-kids', '/blog/best-phonics-classes-for-kids']) {
      expect(RETIRED_BLOG_PATH_REDIRECTS[source]).toBe(owner);
    }
    const registry = fs.readFileSync(path.join(root, 'src/lib/routeSeoRegistry.js'), 'utf8');
    expect(registry).toContain("canonicalPath: '${OWNER}'");
  });

  it('preserves the approved buyer framework, inspectable evidence and realistic decision FAQs on the survivor', () => {
    expect(arraySource('decisionGates').match(/title:/g)).toHaveLength(4);
    expect(arraySource('comparisonFormats').match(/format:/g)).toHaveLength(3);
    expect(arraySource('providerScorecard').match(/^\\s*'/gm)).toHaveLength(12);
    expect(arraySource('demoQuestions').match(/^\\s*'/gm)).toHaveLength(8);
    expect(arraySource('redFlags').match(/^\\s*'/gm)).toHaveLength(7);
    expect(arraySource('pricingQuestions').match(/^\\s*'/gm)).toHaveLength(6);
    for (const signal of ['1. Child fit', '2. Teaching quality', '3. Proof of transfer', '4. Practical clarity', 'fresh words', 'Blending for reading and segmenting for spelling are both taught.', 'No single provider format is automatically best for every child.', 'There is no reliable fixed timeline for every child.', 'fluency, vocabulary, or comprehension may need more attention.']) {
      expect(comparison).toContain(signal);
    }
    for (const route of ['/phonics', '/book-demo', '/curriculum?tab=phonics', '/class-samples', '/testimonials', '/phonics-fees-india']) {
      expect(comparison).toContain(route);
    }
    const faqs = arraySource('faqItems');
    expect(faqs.match(/question:/g)).toHaveLength(10);
    for (const question of ['What should parents look for', 'Are 1:1 phonics classes better than group classes?', 'How should parents compare phonics class pricing?', 'How do I know whether my child needs phonics or broader reading support?', 'How long does phonics progress take?']) {
      expect(faqs).toContain(question);
    }
    expect(comparison).not.toMatch(/read fluently in \\d+ (?:days|weeks|months)/i);
    expect(comparison).not.toMatch(/guaranteed? to read/i);
    expect(comparison).not.toContain('/blog/${RETIRED}');
  });
});
`);

function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? sourceFiles(full) : entry.name.endsWith('.ts') ? [full] : [];
  });
}
const files = sourceFiles(path.join(ROOT, 'src/content/blog/posts')).map((file) => path.relative(ROOT, file).split(path.sep).join('/')).sort();
assert.equal(files.length, 83, 'Verify the approved source corpus before freezing fixtures');
const { LEGACY_WEEK_BLOG_RENAMES } = await import(pathToFileURL(path.join(ROOT, 'src/lib/blogWeekRenames.js')).href);
const slugs = files.map((file) => {
  const match = read(file).match(/\bslug:\s*['"]([^'"]+)['"]/);
  assert(match, `Missing literal source slug: ${file}`);
  return LEGACY_WEEK_BLOG_RENAMES[match[1]]?.slug ?? match[1];
}).sort();
assert.equal(new Set(slugs).size, 83);
assert(!slugs.includes(RETIRED));
assert(read('src/content/blog/posts/phonics/satpin-phonics-guide.ts').includes("modifiedDate: '2026-09-12'"));
put(`${SEO}fixtures/seoRecoveryCorpus.ts`, `// Independently frozen at ${BASE} after approved Brick 4 retirement.\n// Change deliberately when an approved content migration changes this corpus.\nexport const EXPECTED_RECOVERY_SOURCE_PATHS = ${JSON.stringify(files, null, 2)} as const;\n\nexport const EXPECTED_RECOVERY_BLOG_SLUGS = ${JSON.stringify(slugs, null, 2)} as const;\n\nexport const RECOVERY_CTR_TITLES: Readonly<Record<string, string>> = Object.freeze(${JSON.stringify(ctrTitles, null, 2)});\n`);
put(`${SEO}seoRecoveryCorpus.spec.ts`, `import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { SEO_RECOVERY_BRICK10_EXPERIMENTS } from '../../config/seoRecoveryBrick10CtrExperiments';
import { EXPECTED_RECOVERY_SOURCE_PATHS, EXPECTED_RECOVERY_BLOG_SLUGS, RECOVERY_CTR_TITLES } from './fixtures/seoRecoveryCorpus';

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? sourceFiles(full) : entry.name.endsWith('.ts') ? [full] : [];
  });
}
describe('approved SEO recovery corpus and snippet contract', () => {
  it('locks all 83 sources and canonical slugs, not merely the registry count', () => {
    const root = process.cwd();
    const actualFiles = sourceFiles(path.join(root, 'src/content/blog/posts'))
      .map((file) => path.relative(root, file).split(path.sep).join('/')).sort();
    expect(EXPECTED_RECOVERY_SOURCE_PATHS).toHaveLength(83);
    expect(EXPECTED_RECOVERY_BLOG_SLUGS).toHaveLength(83);
    expect(actualFiles).toEqual([...EXPECTED_RECOVERY_SOURCE_PATHS]);
    expect(blogPosts.map((post) => post.slug).sort()).toEqual([...EXPECTED_RECOVERY_BLOG_SLUGS]);
    expect(new Set(blogPosts.map((post) => post.slug)).size).toBe(83);
  });
  it('keeps the five approved CTR experiments and final public titles aligned', () => {
    expect(Object.fromEntries(SEO_RECOVERY_BRICK10_EXPERIMENTS.map((item) => [item.slug, item.title]))).toEqual(RECOVERY_CTR_TITLES);
    for (const [slug, title] of Object.entries(RECOVERY_CTR_TITLES)) {
      expect(blogPosts.find((post) => post.slug === slug)?.title, slug).toBe(title);
    }
  });
  it('does not reintroduce retired provider-selection links in normalized articles', () => {
    for (const post of blogPosts) {
      const body = post.body.map((block) => block.content).join('\\n');
      for (const retired of ['${RETIRED}', 'best-online-phonics-classes-for-kids', 'best-phonics-classes-for-kids']) {
        expect(body, post.slug).not.toContain('](/blog/' + retired + ')');
      }
    }
  });
});
`);

for (const file of changed) {
  assert(file.startsWith(SEO) || file === 'src/tests/components/programs/ClusterSeoNav.spec.tsx' || file === 'src/content/blog/shared/authorityLinking.ts', `Out-of-scope edit: ${file}`);
}
console.log('CI2524_REPAIR_FILES=' + changed.size);
console.log([...changed].sort().join('\n'));
console.log(git('diff', '--stat'));
