#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();

async function replaceRequired(file, from, to, { min = 1 } = {}) {
  const fullPath = path.join(ROOT, file);
  const before = await fs.readFile(fullPath, 'utf8');
  const count = before.split(from).length - 1;
  if (count < min) {
    throw new Error(`${file}: expected at least ${min} occurrence(s) of ${JSON.stringify(from)}, found ${count}`);
  }
  const after = before.split(from).join(to);
  await fs.writeFile(fullPath, after, 'utf8');
  console.log(`updated ${file}: ${count} replacement(s)`);
}

async function insertManifestRoutes() {
  const file = 'src/lib/publicRouteManifest.js';
  const fullPath = path.join(ROOT, file);
  let content = await fs.readFile(fullPath, 'utf8');

  const blogRoute = "  route('/blog/what-is-jolly-phonics-and-is-it-the-best-way-to-teach-reading', 'static'),";
  if (!content.includes(blogRoute)) {
    const marker = "  route('/blog', 'static'),\n";
    if (!content.includes(marker)) throw new Error(`${file}: blog marker not found`);
    content = content.replace(marker, `${marker}${blogRoute}\n`);
    console.log(`${file}: restored Jolly Phonics article to public manifest`);
  }

  const founderRoute = "  route('/team/vannala-ravali-priya', 'static'),";
  if (!content.includes(founderRoute)) {
    const marker = "  route('/team', 'static'),\n";
    if (!content.includes(marker)) throw new Error(`${file}: team marker not found`);
    content = content.replace(marker, `${marker}${founderRoute}\n`);
    console.log(`${file}: added canonical founder profile to public manifest`);
  }

  await fs.writeFile(fullPath, content, 'utf8');
}

async function insertJollySeoRegistry() {
  const file = 'src/lib/routeSeoRegistry.js';
  const fullPath = path.join(ROOT, file);
  let content = await fs.readFile(fullPath, 'utf8');
  const articlePath = '/blog/what-is-jolly-phonics-and-is-it-the-best-way-to-teach-reading';
  if (content.includes(`  '${articlePath}': {`)) {
    console.log(`${file}: Jolly SEO registry entry already present`);
    return;
  }

  const marker = "  '/pricing': {\n";
  if (!content.includes(marker)) throw new Error(`${file}: pricing marker not found`);
  const entry = `  '${articlePath}': {\n    title: 'What is Jolly Phonics and is it the best way to teach reading? | Tiny Steps',\n    description:\n      'Understand what Jolly Phonics is, how it compares with other reading approaches, and how Tiny Steps uses a structured synthetic phonics method for confident reading.',\n    canonicalPath: '${articlePath}',\n    robots: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',\n    ogType: 'article',\n  },\n`;
  content = content.replace(marker, `${entry}${marker}`);
  await fs.writeFile(fullPath, content, 'utf8');
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
    ['src/content/blog/shared/weeklyShared.ts', 'Start with 3 oral blends: /c/ /a/ /t/, /m/ /a/ /p/, /s/ /i/ /t/ before opening a book.', 'Start with 3 oral blends: c-a-t, m-a-p, s-i-t before opening a book.'],
  ];

  for (const [file, from, to] of replacements) {
    await replaceRequired(file, from, to);
  }

  await insertManifestRoutes();
  await insertJollySeoRegistry();

  await fs.rm(path.join(ROOT, 'scripts/brick4-final-repair-once.mjs'));
  await fs.rm(path.join(ROOT, '.github/workflows/brick4-final-repair-once.yml'));
  console.log('Final Brick 4 repairs applied; one-time repair files removed.');
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
