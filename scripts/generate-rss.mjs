import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROUTE_SEO_REGISTRY } from '../src/lib/routeSeoRegistry.js';
import { PUBLIC_ROUTE_MANIFEST } from '../src/lib/publicRouteManifest.js';
import {
  getPublicBlogSlug,
  getPublicBlogTitle,
  rewriteLegacyWeekBlogPaths,
} from '../src/lib/blogWeekRenames.js';
import { getOptimizedBlogTitle } from '../src/lib/blogTitleOptimization.js';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../src/lib/blogIndexingPolicy.js';
import {
  RETIRED_BLOG_PATH_REDIRECTS,
  rewriteRetiredBlogPaths,
} from './blog-consolidation-map.mjs';
import {
  PHONICS_PUBLICATION_GROUPS,
  PHONICS_PUBLISHED_RESOURCE_PAGES,
} from '../src/lib/phonicsPublicationRegistry.js';
import {
  AI_ANSWER_LAYER_DEFINITIONS,
  AI_ANSWER_LAYERS,
  AI_ANSWER_LAYER_MACHINE_JSON_PATH,
  AI_ANSWER_LAYER_MACHINE_TEXT_PATH,
} from '../src/lib/aiAnswerLayerRegistry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const SITE_TITLE = 'Tiny Steps Learning';
const SITE_DESCRIPTION =
  'Premium online English learning for children, with structured phonics, grammar, reading, sentence formation, and public speaking programs.';
const SITE_URL = 'https://tinystepslearning.com';

const REQUIRED_URLS = [
  'https://tinystepslearning.com/',
  'https://tinystepslearning.com/phonics',
  'https://tinystepslearning.com/grammar',
  'https://tinystepslearning.com/speaking',
  'https://tinystepslearning.com/courses',
  'https://tinystepslearning.com/curriculum',
  'https://tinystepslearning.com/pricing',
  'https://tinystepslearning.com/why-tiny-steps',
  'https://tinystepslearning.com/contact',
  'https://tinystepslearning.com/blog',
  'https://tinystepslearning.com/blog/child-knows-abc-but-cannot-read',
  'https://tinystepslearning.com/blog/why-child-knows-letter-sounds-but-cannot-read-words',
  'https://tinystepslearning.com/best-online-phonics-classes-for-kids-in-india',
  'https://tinystepslearning.com/online-english-classes-for-kids',
  'https://tinystepslearning.com/reading-classes-for-kids',
  'https://tinystepslearning.com/writing-classes-for-kids',
];

const EXCLUDED_BLOG_SLUGS = new Set(['spoken-english-classes-for-kids-confidence']);
const BLOG_SLUG_PATH = path.join(ROOT_DIR, 'src/content/blog/posts');
const BLOG_DEFAULTS_PATH = path.join(ROOT_DIR, 'src/content/blog/shared/defaults.ts');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const PUBLIC_BLOG_DIR = path.join(PUBLIC_DIR, 'blog');
const LLM_DISCOVERY_FILES = [
  path.join(PUBLIC_DIR, 'llms.txt'),
  path.join(PUBLIC_DIR, 'llms-full.txt'),
];

const BLOG_CORPUS_LLM_SECTION_HEADING = '## Complete Editorial Blog Corpus';
const PHONICS_LLM_SECTION_HEADING = '## Focused Phonics Resource Library — 31 governed guides';
const AI_ANSWER_LLM_SECTION_HEADING = '## AI Answer Layers — problem, concept, practice';

function buildGovernedPhonicsLlmSection({ detailed = false } = {}) {
  const lines = [
    PHONICS_LLM_SECTION_HEADING,
    '',
    'These are governed informational phonics pattern guides under /resources/phonics. They are distinct from the editorial blog library and from the commercial /phonics programme page. Only explicitly approved publication records appear here.',
    '',
  ];
  for (const group of PHONICS_PUBLICATION_GROUPS) {
    lines.push(`### ${group}`, '');
    for (const page of PHONICS_PUBLISHED_RESOURCE_PAGES.filter((candidate) => candidate.group === group)) {
      const description = detailed ? page.seoDescription : page.concept.quickAnswer;
      lines.push(`- [${page.cardTitle}](${SITE_URL}${page.path}) — ${description}`);
    }
    lines.push('');
  }
  return lines.join('\n').trim();
}

function upsertMarkdownSection(text, section, preferredAnchor) {
  const start = text.indexOf(PHONICS_LLM_SECTION_HEADING);
  if (start >= 0) {
    const nextHeading = text.indexOf('\n## ', start + PHONICS_LLM_SECTION_HEADING.length);
    const before = text.slice(0, start).trimEnd();
    const after = nextHeading >= 0 ? text.slice(nextHeading + 1).trimStart() : '';
    return [before, section.trim(), after].filter(Boolean).join('\n\n');
  }

  const anchorIndex = text.indexOf(preferredAnchor);
  if (anchorIndex < 0) return `${text.trimEnd()}\n\n${section.trim()}\n`;
  const before = text.slice(0, anchorIndex).trimEnd();
  const after = text.slice(anchorIndex).trimStart();
  return `${before}\n\n${section.trim()}\n\n${after}`;
}

function escapeXml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
function normalizeText(value) {
  return rewriteLegacyWeekBlogPaths(rewriteRetiredBlogPaths(String(value || ''))).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/\s+/g, ' ').trim();
}
function extractExternalReferenceUrlsFromSource(source) {
  const urls = String(source || '').match(/https?:\/\/[^\s)\]}>,;'"]+/g) || [];
  return [...new Set(urls.map((url) => url.replace(/[.,:!?]+$/, '')).filter((url) => !url.startsWith(SITE_URL)))];
}
function fromSingleQuotedJs(value) {
  return value.replace(/\\\\/g, '\\').replace(/\\'/g, "'").replace(/\\n/g, ' ').replace(/\\r/g, ' ').replace(/\\t/g, ' ');
}
function toCanonicalAbsoluteUrl(inputPath) {
  const rewritten = rewriteLegacyWeekBlogPaths(rewriteRetiredBlogPaths(inputPath));
  const url = rewritten.startsWith('http://') || rewritten.startsWith('https://') ? new URL(rewritten) : new URL(rewritten === '/' ? '/' : rewritten.replace(/\/+$/, ''), SITE_URL);
  if (url.pathname !== '/' && url.pathname.endsWith('/')) url.pathname = url.pathname.slice(0, -1);
  return `${SITE_URL}${url.pathname === '/' ? '/' : url.pathname}`;
}
function toRoutePath(absoluteUrl) {
  const url = new URL(absoluteUrl);
  return url.pathname === '/' ? '/' : url.pathname.replace(/\/+$/, '');
}
function parsePublicationDateMap(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const map = new Map();
  const matcher = /'([^']+)':\s*'(\d{4}-\d{2}-\d{2})'/g;
  let match = matcher.exec(content);
  while (match) { map.set(match[1], match[2]); match = matcher.exec(content); }
  return map;
}
function walkFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) results.push(...walkFiles(fullPath));
    else if (entry.isFile() && fullPath.endsWith('.ts')) results.push(fullPath);
  }
  return results;
}
function extractSingleQuotedField(content, fieldName) {
  const regex = new RegExp(`${fieldName}:\\s*'((?:\\\\'|\\\\\\\\|[^'])*)'`, 's');
  const match = regex.exec(content);
  return match ? normalizeText(fromSingleQuotedJs(match[1])) : '';
}
function parseBlogItemsFromSource() {
  const publicationDates = parsePublicationDateMap(BLOG_DEFAULTS_PATH);
  const itemsByUrl = new Map();
  const todayIso = new Date().toISOString().slice(0, 10);
  for (const postFile of walkFiles(BLOG_SLUG_PATH)) {
    const content = fs.readFileSync(postFile, 'utf8');
    const sourceSlug = extractSingleQuotedField(content, 'slug');
    const sourceTitle = extractSingleQuotedField(content, 'title');
    if (!sourceSlug || !sourceTitle || EXCLUDED_BLOG_SLUGS.has(sourceSlug)) continue;
    const slug = getPublicBlogSlug(sourceSlug);
    const publicTitle = getPublicBlogTitle(sourceSlug, sourceTitle);
    const title = getOptimizedBlogTitle(slug, publicTitle);
    const dateFromPost = extractSingleQuotedField(content, 'date');
    const modifiedDate = extractSingleQuotedField(content, 'modifiedDate');
    const date = dateFromPost || publicationDates.get(sourceSlug) || '';
    if (date && date > todayIso) continue;
    const excerpt = extractSingleQuotedField(content, 'excerpt');
    const metaDescription = extractSingleQuotedField(content, 'metaDescription');
    const quickAnswer = extractSingleQuotedField(content, 'quickAnswer');
    const category = extractSingleQuotedField(content, 'category') || 'Editorial';
    const description = metaDescription || excerpt || quickAnswer || SITE_DESCRIPTION;
    const url = toCanonicalAbsoluteUrl(`/blog/${slug}`);
    const noindex = shouldNoindexBlogSlug(slug);
    itemsByUrl.set(url, {
      slug,
      title,
      category,
      description,
      link: url,
      publishedDate: date || null,
      modifiedDate: modifiedDate || null,
      pubDate: date ? new Date(`${date}T00:00:00Z`).toUTCString() : undefined,
      updatedDate: modifiedDate ? `${modifiedDate}T00:00:00Z` : undefined,
      sortDate: modifiedDate || date || '1970-01-01',
      indexingState: noindex ? 'noindex' : 'indexable',
      sitemapEligible: shouldIncludeBlogSlugInSitemap(slug),
      retrievalRole: noindex ? 'supporting-only-noindex' : 'canonical-editorial',
      externalReferences: extractExternalReferenceUrlsFromSource(content),
    });
  }
  return [...itemsByUrl.values()].sort((a, b) => b.sortDate.localeCompare(a.sortDate));
}
function isNoIndexRoute(config) { return Boolean(config && /noindex/i.test(config.robots || '')); }
function fallbackTitleFromPath(routePath) {
  if (routePath === '/') return SITE_TITLE;
  const cleaned = routePath.replace(/^\//, '').split('/').pop() || '';
  return cleaned.split('-').map((part) => (part ? `${part[0].toUpperCase()}${part.slice(1)}` : part)).join(' ');
}
function buildItemForUrl(absoluteUrl, blogItemMap) {
  const canonicalUrl = toCanonicalAbsoluteUrl(absoluteUrl);
  const routePath = toRoutePath(canonicalUrl);
  if (routePath.startsWith('/blog/') && blogItemMap.has(canonicalUrl)) return blogItemMap.get(canonicalUrl);
  const routeMeta = ROUTE_SEO_REGISTRY[routePath];
  return { title: normalizeText(routeMeta?.title || fallbackTitleFromPath(routePath)), description: normalizeText(routeMeta?.description || SITE_DESCRIPTION), link: canonicalUrl, pubDate: undefined };
}
function mergeUniqueItems(items) {
  const map = new Map();
  for (const item of items) {
    if (!item?.link) continue;
    const link = toCanonicalAbsoluteUrl(item.link);
    if (map.has(link)) continue;
    map.set(link, {
      title: normalizeText(item.title || SITE_TITLE),
      description: normalizeText(item.description || SITE_DESCRIPTION),
      link,
      pubDate: item.pubDate,
      updatedDate: item.updatedDate,
    });
  }
  return [...map.values()];
}
function buildRssXml({ title, description, feedPath, items }) {
  const feedLink = toCanonicalAbsoluteUrl(feedPath);
  const lastBuildDate = new Date().toUTCString();
  const itemXml = items.map((item) => {
    const parts = ['    <item>', `      <title>${escapeXml(item.title)}</title>`, `      <link>${escapeXml(item.link)}</link>`, `      <guid isPermaLink="true">${escapeXml(item.link)}</guid>`, `      <description>${escapeXml(item.description)}</description>`];
    if (item.pubDate) parts.push(`      <pubDate>${escapeXml(item.pubDate)}</pubDate>`);
    if (item.updatedDate) parts.push(`      <atom:updated>${escapeXml(item.updatedDate)}</atom:updated>`);
    parts.push('    </item>');
    return parts.join('\n');
  }).join('\n');
  return ['<?xml version="1.0" encoding="UTF-8"?>', '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">', '  <channel>', `    <title>${escapeXml(title)}</title>`, `    <description>${escapeXml(description)}</description>`, `    <link>${escapeXml(SITE_URL)}</link>`, `    <atom:link href="${escapeXml(feedLink)}" rel="self" type="application/rss+xml" />`, '    <language>en-us</language>', `    <lastBuildDate>${escapeXml(lastBuildDate)}</lastBuildDate>`, itemXml, '  </channel>', '</rss>', ''].join('\n');
}
function writeFile(targetPath, content) { fs.mkdirSync(path.dirname(targetPath), { recursive: true }); fs.writeFileSync(targetPath, content, 'utf8'); }

function buildEditorialBlogCorpus(blogItems) {
  return blogItems.map((item) => ({
    id: `blog-${item.slug}`,
    content_type: 'editorial-blog',
    slug: item.slug,
    title: item.title,
    summary: item.description,
    category: item.category,
    canonical_url: item.link,
    published_date: item.publishedDate,
    modified_date: item.modifiedDate,
    indexing_state: item.indexingState,
    sitemap_eligible: item.sitemapEligible,
    retrieval_role: item.retrievalRole,
    answer_eligible: item.indexingState === 'indexable',
    external_reference_urls: [...new Set(item.externalReferences || [])],
  }));
}

function buildProgrammaticPhonicsCorpus() {
  return PHONICS_PUBLISHED_RESOURCE_PAGES.map((page) => ({
    id: `phonics-resource-${page.conceptId}`,
    content_type: 'programmatic-phonics-guide',
    title: page.cardTitle,
    summary: page.seoDescription || page.concept.quickAnswer,
    canonical_url: toCanonicalAbsoluteUrl(page.path),
    group: page.group,
    indexing_state: 'indexable',
    retrieval_role: 'canonical-informational',
    answer_eligible: true,
    related_urls: [...new Set((page.concept.supportingPaths || []).map(toCanonicalAbsoluteUrl))],
    practice_urls: [...new Set((page.concept.practicePaths || []).map(toCanonicalAbsoluteUrl))],
  }));
}

function buildPublicRouteCorpus(blogItemMap) {
  const programmaticPaths = new Set(PHONICS_PUBLISHED_RESOURCE_PAGES.map((page) => page.path));
  const manifestByPath = new Map(PUBLIC_ROUTE_MANIFEST.map((entry) => [entry.path, entry]));
  const routePaths = new Set([
    ...PUBLIC_ROUTE_MANIFEST.map((entry) => entry.path),
    ...Object.keys(ROUTE_SEO_REGISTRY),
  ]);
  const map = new Map();

  for (const routePath of routePaths) {
    const config = ROUTE_SEO_REGISTRY[routePath];
    const manifest = manifestByPath.get(routePath);
    const canonicalPath = config?.canonicalPath || manifest?.canonicalPath || routePath;
    const canonicalUrl = toCanonicalAbsoluteUrl(canonicalPath);
    if (blogItemMap.has(canonicalUrl) || programmaticPaths.has(canonicalPath)) continue;
    if (map.has(canonicalUrl)) continue;

    const noindex = manifest ? manifest.indexable === false : isNoIndexRoute(config);
    map.set(canonicalUrl, {
      id: `route-${canonicalPath === '/' ? 'home' : canonicalPath.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-')}`,
      content_type: canonicalPath.startsWith('/resources/') || canonicalPath === '/resources'
        ? 'resource-hub'
        : canonicalPath.startsWith('/parents')
          ? 'parent-help'
          : canonicalPath.startsWith('/free-') || canonicalPath.includes('-game')
            ? 'practice-or-tool'
            : canonicalPath === '/for-schools'
              ? 'school-resource'
              : manifest?.group === 'legal'
                ? 'legal'
                : manifest?.group === 'seasonal'
                  ? 'seasonal'
                  : 'public-route',
      title: normalizeText(config?.title || fallbackTitleFromPath(canonicalPath)),
      summary: normalizeText(config?.description || SITE_DESCRIPTION),
      canonical_url: canonicalUrl,
      route_group: manifest?.group || null,
      indexing_state: noindex ? 'noindex' : 'indexable',
      retrieval_role: noindex ? 'supporting-only-noindex' : 'public-canonical',
      answer_eligible: !noindex,
    });
  }
  return [...map.values()].sort((a, b) => a.canonical_url.localeCompare(b.canonical_url));
}

function buildCompleteBlogLlmSection(blogItems, { detailed = false } = {}) {
  const indexableCount = blogItems.filter((item) => item.indexingState === 'indexable').length;
  const noindexCount = blogItems.length - indexableCount;
  const lines = [
    BLOG_CORPUS_LLM_SECTION_HEADING,
    '',
    `Generated complete corpus: ${blogItems.length} current Tiny Steps editorial articles (${indexableCount} indexable; ${noindexCount} retained as supporting-only/noindex where the existing indexing policy requires it).`,
    '',
    'This generated list is the complete blog coverage source for LLM discovery. Older curated authority sections are subsets and must not be interpreted as the full editorial corpus.',
    '',
  ];
  for (const item of blogItems) {
    const status = item.indexingState === 'noindex' ? ' [supporting-only / noindex]' : '';
    const description = detailed ? ` — ${item.description}` : '';
    lines.push(`- [${item.title}](${item.link})${status}${description}`);
  }
  return lines.join('\n').trim();
}

function resolveAiAnswer(entry, blogItemMap) {
  if (entry.answer) return normalizeText(entry.answer);
  const absolute = toCanonicalAbsoluteUrl(entry.canonicalPath);
  if (blogItemMap.has(absolute)) return normalizeText(blogItemMap.get(absolute)?.description || '');
  const routeMeta = ROUTE_SEO_REGISTRY[entry.canonicalPath];
  return normalizeText(routeMeta?.description || '');
}

function resolveAiExternalReferences(entry, blogItemMap) {
  const absolute = toCanonicalAbsoluteUrl(entry.canonicalPath);
  return [...new Set(blogItemMap.get(absolute)?.externalReferences || [])];
}

function resolveAiAnswerSelector(entry) {
  const pathName = String(entry.canonicalPath || '');
  if (pathName.startsWith('/blog/')) return '.ts-answer-summary';
  if (pathName.startsWith('/resources/phonics/')) return '.ts-answer-summary';
  if (['/resources/phonics', '/resources/grammar', '/resources/speaking'].includes(pathName)) return '.ts-answer-summary';
  return null;
}

function buildAiResourceIndex(blogItems, blogItemMap) {
  const editorialBlogs = buildEditorialBlogCorpus(blogItems);
  const programmaticPhonics = buildProgrammaticPhonicsCorpus();
  const publicRoutes = buildPublicRouteCorpus(blogItemMap);
  const layers = AI_ANSWER_LAYER_DEFINITIONS.map((definition) => ({
    ...definition,
    items: (AI_ANSWER_LAYERS[definition.layer] || []).map((entry) => ({
      id: entry.id,
      subject: entry.subject,
      query: entry.query,
      answer: resolveAiAnswer(entry, blogItemMap),
      canonical_url: toCanonicalAbsoluteUrl(entry.canonicalPath),
      hub_url: toCanonicalAbsoluteUrl(entry.hubPath),
      supporting_urls: [...new Set((entry.supportingPaths || []).map(toCanonicalAbsoluteUrl))],
      reference_urls: [...new Set((entry.supportingPaths || []).map(toCanonicalAbsoluteUrl))],
      external_reference_urls: resolveAiExternalReferences(entry, blogItemMap),
      practice_urls: [...new Set((entry.practicePaths || []).map(toCanonicalAbsoluteUrl))],
      answer_selector: resolveAiAnswerSelector(entry),
      answer_source: entry.answerSource,
      ownership_state: entry.ownershipState,
    })),
  }));
  return {
    name: 'Tiny Steps AI Resource Answer Index',
    revision: '2026-09-26-r24-r27',
    canonical_resource_center: SITE_URL + '/resources',
    purpose: 'Machine-readable routing from parent problems to canonical educational answers and focused practice.',
    retrieval_guidance: 'Use canonical_url as the primary answer source, use reference_urls for connected context, and use practice_urls only after the answer/skill is understood.',
    principles: [
      'One established canonical owner per answer intent.',
      'Use visible page answers and existing evidence; external_reference_urls are extracted only from references already visible in canonical editorial sources.',
      'Layer 1 identifies the problem, Layer 2 explains the concept, Layer 3 links to focused practice.',
      'The content corpus connects all current public Tiny Steps educational content without making noindex or supporting-only pages primary answer owners.',
    ],
    corpus_counts: {
      editorial_blogs: editorialBlogs.length,
      programmatic_phonics_guides: programmaticPhonics.length,
      additional_public_routes: publicRoutes.length,
      connected_public_content: editorialBlogs.length + programmaticPhonics.length + publicRoutes.length,
    },
    corpus: {
      editorial_blogs: editorialBlogs,
      programmatic_phonics_guides: programmaticPhonics,
      additional_public_routes: publicRoutes,
    },
    layers,
  };
}

function buildAiResourceText(index) {
  const lines = [
    '# Tiny Steps AI Resource Answer Index',
    '',
    'Canonical Resource Center: ' + index.canonical_resource_center,
    'JSON: ' + SITE_URL + AI_ANSWER_LAYER_MACHINE_JSON_PATH,
    '',
  ];
  for (const layer of index.layers) {
    lines.push('## Layer ' + layer.layer + ' — ' + layer.label, '', layer.purpose, '');
    for (const entry of layer.items) {
      lines.push('- Q: ' + entry.query);
      if (entry.answer) lines.push('  A: ' + entry.answer);
      lines.push('  Canonical: ' + entry.canonical_url);
      if (entry.reference_urls.length) lines.push('  Related: ' + entry.reference_urls.join(', '));
      if (entry.external_reference_urls.length) lines.push('  Evidence: ' + entry.external_reference_urls.join(', '));
      if (entry.practice_urls.length) lines.push('  Practice: ' + entry.practice_urls.join(', '));
    }
    lines.push('');
  }

  lines.push('## Connected content corpus', '');
  lines.push('Editorial blogs: ' + index.corpus_counts.editorial_blogs);
  lines.push('Programmatic phonics guides: ' + index.corpus_counts.programmatic_phonics_guides);
  lines.push('Additional public routes: ' + index.corpus_counts.additional_public_routes, '');

  lines.push('### Editorial blogs', '');
  for (const item of index.corpus.editorial_blogs) {
    lines.push('- ' + item.title + ' — ' + item.canonical_url + ' [' + item.indexing_state + '; ' + item.retrieval_role + ']');
  }
  lines.push('', '### Programmatic phonics guides', '');
  for (const item of index.corpus.programmatic_phonics_guides) {
    lines.push('- ' + item.title + ' — ' + item.canonical_url);
  }
  lines.push('', '### Additional public routes', '');
  for (const item of index.corpus.additional_public_routes) {
    lines.push('- ' + item.title + ' — ' + item.canonical_url + ' [' + item.indexing_state + ']');
  }
  return lines.join('\n').trim() + '\n';
}

function buildAiAnswerLlmSection(index) {
  const counts = index.layers.map((layer) => 'Layer ' + layer.layer + ' ' + layer.label + ': ' + layer.items.length).join('; ');
  return [
    AI_ANSWER_LLM_SECTION_HEADING,
    '',
    'Tiny Steps exposes a three-layer retrieval index for parent problems, educational concepts and focused practice. Existing canonical URLs remain the answer owners.',
    '',
    '- [Machine-readable JSON answer index](' + SITE_URL + AI_ANSWER_LAYER_MACHINE_JSON_PATH + ')',
    '- [Plain-text answer index](' + SITE_URL + AI_ANSWER_LAYER_MACHINE_TEXT_PATH + ')',
    '- Coverage: ' + counts,
    '- Connected content corpus: ' + index.corpus_counts.editorial_blogs + ' editorial blogs; ' + index.corpus_counts.programmatic_phonics_guides + ' programmatic phonics guides; ' + index.corpus_counts.additional_public_routes + ' additional public routes.',
  ].join('\n');
}

function upsertNamedMarkdownSection(text, heading, section, preferredAnchor) {
  const start = text.indexOf(heading);
  if (start >= 0) {
    const nextHeading = text.indexOf('\n## ', start + heading.length);
    const before = text.slice(0, start).trimEnd();
    const after = nextHeading >= 0 ? text.slice(nextHeading + 1).trimStart() : '';
    return [before, section.trim(), after].filter(Boolean).join('\n\n');
  }
  const anchorIndex = text.indexOf(preferredAnchor);
  if (anchorIndex < 0) return text.trimEnd() + '\n\n' + section.trim() + '\n';
  return text.slice(0, anchorIndex).trimEnd() + '\n\n' + section.trim() + '\n\n' + text.slice(anchorIndex).trimStart();
}

function normalizeLlmDiscoveryFiles(aiIndex) {
  const retiredCommercialBlogUrls = Object.entries(RETIRED_BLOG_PATH_REDIRECTS)
    .filter(([, destination]) => !destination.startsWith('/blog/'))
    .map(([source]) => `${SITE_URL}${source}`);

  for (const filePath of LLM_DISCOVERY_FILES) {
    if (!fs.existsSync(filePath)) continue;
    let text = fs.readFileSync(filePath, 'utf8');
    text = text
      .split('\n')
      .filter((line) => !retiredCommercialBlogUrls.some((url) => line.includes(url)))
      .join('\n');
    text = rewriteLegacyWeekBlogPaths(rewriteRetiredBlogPaths(text))
      .replace('Complete Quality-Reviewed Editorial Library — 51', 'Complete Quality-Reviewed Editorial Library — 50')
      .replace('The 51 links below are the current quality-reviewed Tiny Steps editorial set.', 'The 50 links below are the current quality-reviewed Tiny Steps editorial set.')
      .replace('### Blogs 1-34 — Phonics Authority Programme', '### Phonics Authority Programme — 33 articles')
      .replace(
        'Complete LLM-facing directory for the first 51 quality-reviewed Tiny Steps blog authorities: Blogs 1-34 from the Phonics authority programme and Blogs 35-51 from the Parent Communication / English support programme.',
        'Complete LLM-facing directory for 50 quality-reviewed Tiny Steps blog authorities: 33 from the Phonics authority programme and 17 from the Parent Communication / English support programme.',
      )
      .replace('## Blogs 1-34 — Phonics Authority Programme', '## Phonics Authority Programme — 33 articles')
      .replace('## Blogs 35-51 — Parent Communication / English Support Programme', '## Parent Communication / English Support Programme — 17 articles');

    const isFullDirectory = filePath.endsWith('llms-full.txt');
    text = upsertNamedMarkdownSection(
      text,
      BLOG_CORPUS_LLM_SECTION_HEADING,
      buildCompleteBlogLlmSection(aiIndex.corpus.editorial_blogs.map((entry) => ({
        title: entry.title,
        description: entry.summary,
        link: entry.canonical_url,
        indexingState: entry.indexing_state,
      })), { detailed: isFullDirectory }),
      PHONICS_LLM_SECTION_HEADING,
    );
    text = upsertMarkdownSection(
      text,
      buildGovernedPhonicsLlmSection({ detailed: isFullDirectory }),
      isFullDirectory ? '## Interpretation notes' : '## School and Institutional Partnerships',
    );
    text = upsertNamedMarkdownSection(
      text,
      AI_ANSWER_LLM_SECTION_HEADING,
      buildAiAnswerLlmSection(aiIndex),
      PHONICS_LLM_SECTION_HEADING,
    );

    fs.writeFileSync(filePath, `${text.replace(/\n+$/, '')}\n`, 'utf8');
  }
}

function main() {
  const blogItems = parseBlogItemsFromSource();
  const blogItemMap = new Map(blogItems.map((item) => [item.link, item]));
  const requiredItems = REQUIRED_URLS.map((url) => buildItemForUrl(url, blogItemMap));
  const publicRouteItems = Object.entries(ROUTE_SEO_REGISTRY).filter(([, config]) => !isNoIndexRoute(config)).map(([routePath, config]) => {
    const canonicalPath = config?.canonicalPath || routePath;
    return { title: normalizeText(config?.title || fallbackTitleFromPath(canonicalPath)), description: normalizeText(config?.description || SITE_DESCRIPTION), link: toCanonicalAbsoluteUrl(canonicalPath) };
  });
  const siteFeedItems = mergeUniqueItems([...requiredItems, ...publicRouteItems, ...blogItems]);
  const blogFeedItems = mergeUniqueItems([buildItemForUrl('https://tinystepslearning.com/blog', blogItemMap), ...blogItems, ...requiredItems.filter((item) => item.link.startsWith('https://tinystepslearning.com/blog/'))]);
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  fs.mkdirSync(PUBLIC_BLOG_DIR, { recursive: true });
  writeFile(path.join(PUBLIC_DIR, 'rss.xml'), buildRssXml({ title: SITE_TITLE, description: SITE_DESCRIPTION, feedPath: '/rss.xml', items: siteFeedItems }));
  writeFile(path.join(PUBLIC_DIR, 'feed.xml'), buildRssXml({ title: SITE_TITLE, description: SITE_DESCRIPTION, feedPath: '/feed.xml', items: siteFeedItems }));
  writeFile(path.join(PUBLIC_BLOG_DIR, 'rss.xml'), buildRssXml({ title: `${SITE_TITLE} Blog`, description: 'Latest Tiny Steps Learning blog posts on phonics, grammar, reading, and speaking.', feedPath: '/blog/rss.xml', items: blogFeedItems }));
  writeFile(path.join(PUBLIC_BLOG_DIR, 'feed.xml'), buildRssXml({ title: `${SITE_TITLE} Blog`, description: 'Latest Tiny Steps Learning blog posts on phonics, grammar, reading, and speaking.', feedPath: '/blog/feed.xml', items: blogFeedItems }));
  const aiIndex = buildAiResourceIndex(blogItems, blogItemMap);
  writeFile(path.join(PUBLIC_DIR, AI_ANSWER_LAYER_MACHINE_JSON_PATH.slice(1)), JSON.stringify(aiIndex, null, 2) + '\n');
  writeFile(path.join(PUBLIC_DIR, AI_ANSWER_LAYER_MACHINE_TEXT_PATH.slice(1)), buildAiResourceText(aiIndex));
  normalizeLlmDiscoveryFiles(aiIndex);
  console.log('Generated RSS feeds, AI answer indexes, and canonicalized discovery files.');
}
main();