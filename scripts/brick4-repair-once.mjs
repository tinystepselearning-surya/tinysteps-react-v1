#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();

async function replaceRequired(file, from, to, { min = 1, all = true } = {}) {
  const fullPath = path.join(ROOT, file);
  const before = await fs.readFile(fullPath, 'utf8');
  const count = before.split(from).length - 1;
  if (count < min) {
    throw new Error(`${file}: expected at least ${min} occurrence(s) of ${JSON.stringify(from)}, found ${count}`);
  }
  const after = all ? before.split(from).join(to) : before.replace(from, to);
  await fs.writeFile(fullPath, after, 'utf8');
  console.log(`updated ${file}: ${count} replacement(s)`);
}

async function insertJollyRoute() {
  const file = 'src/lib/publicRouteManifest.js';
  const fullPath = path.join(ROOT, file);
  const before = await fs.readFile(fullPath, 'utf8');
  const route = "  route('/blog/what-is-jolly-phonics-and-is-it-the-best-way-to-teach-reading', 'static'),";
  if (before.includes(route)) {
    console.log(`${file}: Jolly route already present`);
    return;
  }
  const marker = "  route('/blog', 'static'),\n";
  if (!before.includes(marker)) throw new Error(`${file}: blog marker not found`);
  const after = before.replace(marker, `${marker}${route}\n`);
  await fs.writeFile(fullPath, after, 'utf8');
  console.log(`${file}: restored Jolly article to public manifest`);
}

async function insertJollySeoRegistry() {
  const file = 'src/lib/routeSeoRegistry.js';
  const fullPath = path.join(ROOT, file);
  const before = await fs.readFile(fullPath, 'utf8');
  const articlePath = '/blog/what-is-jolly-phonics-and-is-it-the-best-way-to-teach-reading';
  if (before.includes(`  '${articlePath}': {`)) {
    console.log(`${file}: Jolly SEO registry entry already present`);
    return;
  }
  const marker = "  '/pricing': {\n";
  if (!before.includes(marker)) throw new Error(`${file}: pricing marker not found`);
  const entry = `  '${articlePath}': {\n    title: 'What is Jolly Phonics and is it the best way to teach reading? | Tiny Steps',\n    description:\n      'Understand what Jolly Phonics is, how it compares with other reading approaches, and how Tiny Steps uses a structured synthetic phonics method for confident reading.',\n    canonicalPath: '${articlePath}',\n    robots: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',\n    ogType: 'article',\n  },\n`;
  const after = before.replace(marker, `${entry}${marker}`);
  await fs.writeFile(fullPath, after, 'utf8');
  console.log(`${file}: added Jolly SEO registry entry`);
}

async function main() {
  const replacements = [
    ['src/lib/publicCoursePages.js', '/blog/week-19-phonics-multisyllabic', '/blog/phonics-multisyllabic'],
    ['src/lib/publicCoursePages.js', '/blog/week-7-grammar-nouns-to-paragraphs', '/blog/grammar-nouns-to-paragraphs'],
    ['src/pages/FAQPage.tsx', '/blog/week-7-grammar-nouns-to-paragraphs', '/blog/grammar-nouns-to-paragraphs'],
    ['src/components/programs/ClusterSeoNav.tsx', '/blog/week-13-speaking-structure', '/blog/speaking-structure'],
    ['src/pages/public/ReadingClassesForKidsPage.tsx', '/blog/week-6-phonics-comprehension', '/blog/phonics-comprehension'],
    ['src/pages/public/PhonicsFeesIndiaPage.tsx', '/blog/week-22-phonics-diagnostics', '/blog/phonics-diagnostics'],
    ['src/content/blog/posts/phonics/phonics-rules-for-beginners.ts', '/blog/phonics-vs-sight-words', '/blog/sight-words-or-phonics-first'],
    ['src/tests/seo/phonicsBrick4CourseStageAuthority.spec.ts', '/blog/week-19-phonics-multisyllabic', '/blog/phonics-multisyllabic'],
    ['src/tests/seo/phonicsBrick3ReadingAuthority.spec.ts', '/blog/week-6-phonics-comprehension', '/blog/phonics-comprehension'],
    ['src/tests/seo/blogQualityAuthoritativeSequenceBlog17.spec.ts', '/blog/phonics-vs-sight-words', '/blog/sight-words-or-phonics-first'],
  ];

  for (const [file, from, to] of replacements) {
    await replaceRequired(file, from, to);
  }

  await insertJollyRoute();
  await insertJollySeoRegistry();

  // Self-remove so this one-time repair mechanism never ships to main.
  await fs.rm(path.join(ROOT, 'scripts/brick4-repair-once.mjs'));
  await fs.rm(path.join(ROOT, '.github/workflows/brick4-repair-once.yml'));
  console.log('Brick 4 canonical-link repair set applied; one-time repair files removed.');
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
