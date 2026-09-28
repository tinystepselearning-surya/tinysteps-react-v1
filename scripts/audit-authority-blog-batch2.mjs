import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const errors = [];
const fail = (code, detail) => errors.push({ code, detail });
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const BATCH_2 = [
  {
    slug: 'grammar-tenses',
    heroValue: 'Past • present • future',
    tocNeedle: 'The Tiny Steps tense pathway:',
  },
  {
    slug: 'grammar-conjunctions',
    heroValue: 'Add • contrast • reason • result',
    tocNeedle: 'The Tiny Steps conjunction ladder:',
  },
  {
    slug: 'long-vowel-sounds-for-kids',
    heroValue: 'Pattern families',
    tocNeedle: 'The Tiny Steps long-vowel learning chain',
  },
  {
    slug: 'why-child-knows-letter-sounds-but-cannot-read-words',
    heroValue: 'Sounds → blending',
    tocNeedle: 'The Tiny Steps six-stage decoding check',
  },
  {
    slug: 'child-gives-one-word-answers',
    heroValue: 'One idea at a time',
    tocNeedle: 'The protected Tiny Steps answer-expansion checkpoint',
  },
];

const page = read('src/pages/BlogPostPage.tsx');
for (const token of [
  'AUTHORITY_BLOG_BATCH_2_SLUGS',
  'AUTHORITY_BATCH_2_HERO_POINTS',
  'AUTHORITY_BATCH_2_TOC_PREFIXES',
  'isAuthorityBatch2 && batch2HeroPoints',
  'AUTHORITY_BATCH_2_TOC_PREFIXES[slug]',
]) {
  if (!page.includes(token)) fail('page-contract', token);
}

for (const item of BATCH_2) {
  if (!page.includes("'" + item.slug + "'")) fail('batch-slug', item.slug);
  if (!page.includes(item.heroValue)) fail('hero-point', item.slug + ':' + item.heroValue);
  if (!page.includes(item.tocNeedle)) fail('toc-prefix', item.slug + ':' + item.tocNeedle);
}

const baseRef = process.env.GITHUB_BASE_REF;
if (baseRef) {
  try {
    const changed = execFileSync('git', ['diff', '--name-only', 'origin/' + baseRef + '...HEAD'], {
      cwd: root,
      encoding: 'utf8',
    })
      .split('\n')
      .map((value) => value.trim())
      .filter(Boolean);

    const forbidden = changed.filter((file) =>
      file.startsWith('src/content/blog/posts/')
      || file === 'src/content/blog/shared/technicalAuthority.ts'
      || file === 'src/content/blog/shared/authorityLinking.ts'
      || file === 'src/content/blog/shared/conversionFamilies.ts'
      || file === 'src/content/blog/shared/heroFamilies.ts'
      || file === 'src/lib/blogIndexingPolicy.js'
      || file === 'src/lib/canonicalTopicOwnershipRegistry.js'
      || file === 'src/config/seoRecoveryBrick10CtrExperiments.ts',
    );
    if (forbidden.length) fail('protected-content-diff', forbidden.join(','));
  } catch (error) {
    fail('git-diff', error instanceof Error ? error.message : String(error));
  }
}

if (process.argv.includes('--dist')) {
  for (const item of BATCH_2) {
    const htmlPath = path.join(root, 'dist', 'blog', item.slug, 'index.html');
    if (!fs.existsSync(htmlPath)) {
      fail('dist-page', item.slug);
      continue;
    }
    const html = fs.readFileSync(htmlPath, 'utf8');
    if (!html.includes(item.heroValue)) fail('dist-hero', item.slug);
    if (!html.includes(item.tocNeedle)) fail('dist-toc', item.slug);
    if (!html.includes('Guide index')) fail('dist-guide-index', item.slug);
  }
}

console.log(JSON.stringify({
  brick: 'Blog Authority Template — Batch 2',
  articles: BATCH_2.map((item) => item.slug),
  contentBodiesChanged: false,
  metadataChanged: false,
  canonicalOwnershipChanged: false,
  errors,
}, null, 2));

if (errors.length) process.exitCode = 1;
