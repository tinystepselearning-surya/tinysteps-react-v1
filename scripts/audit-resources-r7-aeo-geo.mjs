import fs from 'node:fs';
import path from 'node:path';
import {
  RESOURCE_SUBJECT_PRESENTATION,
  buildBreadcrumbListSchema,
  buildSpeakableSpecification,
  getAeoGeoPresentation,
  getBreadcrumbTrail,
} from '../src/lib/breadcrumbAeoGeoRegistry.js';
import { CANONICAL_TOPIC_OWNERSHIP } from '../src/lib/canonicalTopicOwnershipRegistry.js';

const SITE_ORIGIN = 'https://tinystepslearning.com';
const repoRoot = process.cwd();
const errors = [];
const warnings = [];
const check = (condition, message) => { if (!condition) errors.push(message); };
const read = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

const examples = [
  ['/resources', undefined, undefined, ['/', '/resources']],
  ['/resources/phonics', undefined, undefined, ['/', '/resources', '/resources/phonics']],
  ['/blog/how-kids-learn-blending', 'How Kids Learn Blending', 'Phonics', ['/', '/resources', '/resources/phonics', '/blog/how-kids-learn-blending']],
  ['/blog/grammar-nouns-to-paragraphs', 'Grammar: Nouns to Paragraphs', 'Grammar', ['/', '/resources', '/resources/grammar', '/blog/grammar-nouns-to-paragraphs']],
  ['/blog/child-gives-one-word-answers', 'Child Gives One-Word Answers', 'Public Speaking', ['/', '/resources', '/resources/speaking', '/blog/child-gives-one-word-answers']],
  ['/blog/unregistered-parent-guide', 'Parent Guide', 'Parent Tips', ['/', '/resources', '/blog', '/blog/unregistered-parent-guide']],
];

for (const [pathname, title, category, expectedPaths] of examples) {
  const trail = getBreadcrumbTrail({ pathname, title, category });
  check(JSON.stringify(trail.map((item) => item.path)) === JSON.stringify(expectedPaths), `Unexpected breadcrumb trail for ${pathname}`);
  check(new Set(trail.map((item) => item.path)).size === trail.length, `Duplicate breadcrumb path for ${pathname}`);
  const schema = buildBreadcrumbListSchema(trail, SITE_ORIGIN);
  check(schema['@type'] === 'BreadcrumbList', `Missing BreadcrumbList schema for ${pathname}`);
  check(schema['@id'] === `${SITE_ORIGIN}${pathname}#breadcrumb`, `Unexpected breadcrumb @id for ${pathname}`);
  check(schema.itemListElement.every((item, index) => item.position === index + 1), `Non-sequential breadcrumb positions for ${pathname}`);
}

for (const entry of CANONICAL_TOPIC_OWNERSHIP.filter((item) => item.ownerPath.startsWith('/blog/') && RESOURCE_SUBJECT_PRESENTATION[item.subject])) {
  const trail = getBreadcrumbTrail({ pathname: entry.ownerPath, title: entry.queryIntent });
  const subject = RESOURCE_SUBJECT_PRESENTATION[item.subject];
  check(trail.some((item) => item.path === subject.path), `${entry.id} does not route breadcrumb hierarchy through ${subject.path}`);
}

const speakable = buildSpeakableSpecification();
check(speakable?.['@type'] === 'SpeakableSpecification', 'SpeakableSpecification missing');
check(speakable?.cssSelector?.includes('.ts-answer-title'), 'Speakable title selector missing');
check(speakable?.cssSelector?.includes('.ts-answer-summary'), 'Speakable summary selector missing');

const phonicsPresentation = getAeoGeoPresentation({ pathname: '/blog/how-kids-learn-blending', category: 'Phonics' });
check(phonicsPresentation.subjectHubPath === '/resources/phonics', 'Phonics AEO/GEO subject hub mismatch');
check(phonicsPresentation.aboutName === 'Phonics and reading for children', 'Phonics about entity label mismatch');

const resourcesSource = read('src/pages/ResourcesPage.tsx');
const subjectSource = read('src/pages/SubjectResourcesPage.tsx');
const blogSource = read('src/pages/BlogPostPage.tsx');
const breadcrumbComponentSource = read('src/components/common/KnowledgeBreadcrumbs.tsx');

for (const [name, source] of [['ResourcesPage', resourcesSource], ['SubjectResourcesPage', subjectSource], ['BlogPostPage', blogSource]]) {
  check(source.includes('getBreadcrumbTrail'), `${name} must resolve the visible hierarchy from the R7 registry`);
  check(source.includes('buildBreadcrumbListSchema'), `${name} must build JSON-LD from the same R7 breadcrumb trail`);
  check(source.includes('KnowledgeBreadcrumbs'), `${name} must render the shared visible breadcrumb component`);
}

check(!resourcesSource.includes("'@type': 'FAQPage'"), 'Resources gateway must not fabricate FAQPage schema');
check(!subjectSource.includes("'@type': 'FAQPage'"), 'Subject hubs must not fabricate FAQPage schema');
check(blogSource.includes('if (!post?.faq?.length) return null;'), 'Blog FAQ schema must stay gated to visible authored FAQ content');
check(blogSource.includes("'@type': 'WebPage'"), 'Blog pages must emit an explicit WebPage entity');
check(blogSource.includes('mainEntity: { \'@id\': getBlogArticleId(articleSlug) }'), 'Blog WebPage must point to its BlogPosting main entity');
check(blogSource.includes("breadcrumb: { '@id': breadcrumbSchema['@id'] }"), 'Blog WebPage must reference the shared breadcrumb entity');
check(blogSource.includes('abstract: quickAnswer || undefined'), 'BlogPosting must reuse the visible quick answer as its abstract');
check(blogSource.includes("buildSpeakableSpecification(['.ts-answer-title', '.ts-answer-summary'])"), 'Blog answer selectors must power speakable metadata');
check(resourcesSource.includes('className="ts-answer-title'), 'Resources gateway visible answer title selector missing');
check(resourcesSource.includes('className="ts-answer-summary'), 'Resources gateway visible answer summary selector missing');
check(subjectSource.includes('ts-answer-title'), 'Subject hub visible answer title selector missing');
check(subjectSource.includes('ts-answer-summary'), 'Subject hub visible answer summary selector missing');
check(breadcrumbComponentSource.includes('aria-current="page"'), 'Visible breadcrumb must expose the current page accessibly');
check(breadcrumbComponentSource.includes('data-knowledge-breadcrumb="true"'), 'Visible breadcrumb audit marker missing');

if (warnings.length) {
  console.warn(`Resources R7 warnings: ${warnings.length}`);
  for (const warning of warnings) console.warn(`- ${warning}`);
}

if (errors.length) {
  console.error(`Resources R7 AEO/GEO audit failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Resources R7 AEO/GEO audit passed: ${examples.length} representative trails, ${CANONICAL_TOPIC_OWNERSHIP.length} ownership entries checked.`);
