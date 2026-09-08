import { CANONICAL_TOPIC_OWNERSHIP } from './canonicalTopicOwnershipRegistry.js';

const freeze = (value) => Object.freeze(value);
const freezeTrail = (items) => Object.freeze(items.map((item) => freeze({ ...item })));

export const RESOURCE_SUBJECT_PRESENTATION = freeze({
  'phonics-reading': freeze({ label: 'Phonics & Reading', path: '/resources/phonics', aboutName: 'Phonics and reading for children' }),
  'grammar-writing': freeze({ label: 'Grammar & Writing', path: '/resources/grammar', aboutName: 'Grammar and writing for children' }),
  'speaking-communication': freeze({ label: 'Speaking & Communication', path: '/resources/speaking', aboutName: 'Speaking and communication for children' }),
});

const BLOG_CATEGORY_SUBJECT = freeze({
  Phonics: 'phonics-reading',
  Grammar: 'grammar-writing',
  'Public Speaking': 'speaking-communication',
  'English Communication': 'speaking-communication',
});

const RESOURCE_PATH_LABELS = freeze({
  '/resources': 'Resources',
  '/resources/phonics': 'Phonics & Reading',
  '/resources/grammar': 'Grammar & Writing',
  '/resources/speaking': 'Speaking & Communication',
});

function normalizePath(value) {
  const raw = String(value || '/').split(/[?#]/, 1)[0] || '/';
  if (raw === '/') return '/';
  return raw.replace(/\/+$/, '') || '/';
}

function topicOwnersForPath(pathname) {
  const normalized = normalizePath(pathname);
  return CANONICAL_TOPIC_OWNERSHIP.filter((entry) => normalizePath(entry.ownerPath) === normalized);
}

function subjectForBlogPath(pathname, category) {
  const canonicalSubject = topicOwnersForPath(pathname)
    .map((entry) => entry.subject)
    .find((subject) => RESOURCE_SUBJECT_PRESENTATION[subject]);
  return canonicalSubject || BLOG_CATEGORY_SUBJECT[category] || null;
}

export function getBreadcrumbTrail({ pathname, title, category } = {}) {
  const path = normalizePath(pathname);
  const home = { name: 'Home', path: '/' };

  if (path === '/resources') {
    return freezeTrail([home, { name: 'Resources', path }]);
  }

  if (RESOURCE_PATH_LABELS[path]) {
    return freezeTrail([
      home,
      { name: 'Resources', path: '/resources' },
      { name: RESOURCE_PATH_LABELS[path], path },
    ]);
  }

  if (path.startsWith('/blog/')) {
    const subject = subjectForBlogPath(path, category);
    const currentName = String(title || 'Guide').trim() || 'Guide';
    if (subject) {
      const presentation = RESOURCE_SUBJECT_PRESENTATION[subject];
      return freezeTrail([
        home,
        { name: 'Resources', path: '/resources' },
        { name: presentation.label, path: presentation.path },
        { name: currentName, path },
      ]);
    }

    return freezeTrail([
      home,
      { name: 'Resources', path: '/resources' },
      { name: 'All Guides', path: '/blog' },
      { name: currentName, path },
    ]);
  }

  return freezeTrail([home, { name: String(title || 'Page').trim() || 'Page', path }]);
}

export function buildBreadcrumbListSchema(items, siteOrigin) {
  const trail = Array.isArray(items) ? items : [];
  const origin = String(siteOrigin || '').replace(/\/+$/, '');
  const current = trail[trail.length - 1];
  const currentUrl = current ? `${origin}${current.path === '/' ? '/' : normalizePath(current.path)}` : `${origin}/`;

  return freeze({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${currentUrl}#breadcrumb`,
    itemListElement: trail.map((item, index) => freeze({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${origin}${item.path === '/' ? '/' : normalizePath(item.path)}`,
    })),
  });
}

export function getAeoGeoPresentation({ pathname, category } = {}) {
  const path = normalizePath(pathname);
  const subject = path.startsWith('/blog/') ? subjectForBlogPath(path, category) : null;
  const subjectPresentation = subject ? RESOURCE_SUBJECT_PRESENTATION[subject] : null;

  return freeze({
    subject: subject || null,
    subjectHubPath: subjectPresentation?.path || null,
    aboutName: subjectPresentation?.aboutName || null,
    breadcrumbPath: path,
    answerSelectors: freeze(['.ts-answer-title', '.ts-answer-summary']),
  });
}

export function buildSpeakableSpecification(selectors = ['.ts-answer-title', '.ts-answer-summary']) {
  const safeSelectors = Array.from(new Set((Array.isArray(selectors) ? selectors : []).filter(Boolean)));
  return safeSelectors.length
    ? freeze({ '@type': 'SpeakableSpecification', cssSelector: freeze(safeSelectors) })
    : null;
}

export function normalizeBreadcrumbPath(pathname) {
  return normalizePath(pathname);
}
