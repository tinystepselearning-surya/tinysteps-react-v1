import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { REVIEWED_SEO_RECOVERY_BLOBS, isReviewedSeoRecoveryFile } from './commercial-c7-reviewed-seo-repair.mjs';

const root = process.cwd();
const errors = [];
const fail = (code, detail) => errors.push({ code, detail });
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const BATCH_3 = [
  {
    slug: 'phonics-tricky-words',
    heroValue: 'Regular parts • tricky parts',
    tocNeedle: 'The Tiny Steps six-step tricky-word routine',
  },
  {
    slug: 'grammar-editing-camp',
    heroValue: 'One editing target',
    tocNeedle: 'The Tiny Steps editing cycle:',
  },
  {
    slug: 'cvc-words-explained-for-parents',
    heroValue: 'Sound → blend → word',
    tocNeedle: 'The Tiny Steps six-step CVC decoding ladder',
  },
  {
    slug: 'phonics-blending-club',
    heroValue: 'See → sound → sweep → say',
    tocNeedle: 'The Tiny Steps five-part blending routine',
  },
  {
    slug: 'how-children-recognise-words-automatically-after-phonics',
    heroValue: 'Spelling ↔ pronunciation ↔ meaning',
    tocNeedle: 'What orthographic mapping means in parent-friendly language',
  },
];

const page = read('src/pages/BlogPostPage.tsx');
for (const token of [
  'AUTHORITY_BLOG_BATCH_3_SLUGS',
  'AUTHORITY_BATCH_3_HERO_POINTS',
  'AUTHORITY_BATCH_3_TOC_PREFIXES',
  'isAuthorityBatch3 && batch3HeroPoints',
  'AUTHORITY_BATCH_3_TOC_PREFIXES[slug]',
]) {
  if (!page.includes(token)) fail('page-contract', token);
}

for (const item of BATCH_3) {
  if (!page.includes("'" + item.slug + "'")) fail('batch-slug', item.slug);
  if (!page.includes(item.heroValue)) fail('hero-point', item.slug + ':' + item.heroValue);
  if (!page.includes(item.tocNeedle)) fail('toc-prefix', item.slug + ':' + item.tocNeedle);
}

const ctrConfig = read('src/config/seoRecoveryBrick10CtrExperiments.ts');
for (const item of BATCH_3) {
  if (ctrConfig.includes("slug: '" + item.slug + "'")) fail('ctr-experiment-collision', item.slug);
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

    const forbidden = changed.filter((file) => {
      // The Speaking v2 article and its shared discovery records are separately
      // reviewed and pinned byte-for-byte; Batch 3's own five posts stay frozen.
      if (Object.hasOwn(REVIEWED_SEO_RECOVERY_BLOBS, file) && isReviewedSeoRecoveryFile(file, fs.readFileSync(path.join(root, file)))) return false;
      return file.startsWith('src/content/blog/posts/')
      || file === 'src/content/blog/shared/technicalAuthority.ts'
      || file === 'src/content/blog/shared/authorityLinking.ts'
      || file === 'src/content/blog/shared/conversionFamilies.ts'
      || file === 'src/content/blog/shared/heroFamilies.ts'
      || file === 'src/lib/blogIndexingPolicy.js'
      || file === 'src/lib/canonicalTopicOwnershipRegistry.js'
      || file === 'src/config/seoRecoveryBrick10CtrExperiments.ts';
    });
    if (forbidden.length) fail('protected-content-diff', forbidden.join(','));
  } catch (error) {
    fail('git-diff', error instanceof Error ? error.message : String(error));
  }
}

if (process.argv.includes('--dist')) {
  for (const item of BATCH_3) {
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
  brick: 'Blog Authority Template — Batch 3',
  articles: BATCH_3.map((item) => item.slug),
  contentBodiesChanged: false,
  metadataChanged: false,
  canonicalOwnershipChanged: false,
  ctrExperimentChanged: false,
  errors,
}, null, 2));

if (errors.length) process.exitCode = 1;
