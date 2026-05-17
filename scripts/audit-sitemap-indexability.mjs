import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ROUTE_SEO_REGISTRY } from '../src/lib/routeSeoRegistry.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const SITEMAP_FILES = [
  'public/sitemap.xml',
  'public/sitemap-blog.xml',
  'public/sitemap-static.xml',
  'public/sitemap-courses.xml',
  'public/sitemap-parents.xml',
];

const DYNAMIC_PATTERNS_OK = new Set(['/blog/:slug', '/courses/:slug']);
const isSitemapResourcePath = (pathname) => /^\/sitemap(?:-[a-z0-9-]+)?\.xml$/i.test(String(pathname || ''));

const noindexRobots = (robots) =>
  typeof robots === 'string' && /(^|[,\s])noindex([,\s]|$)/i.test(robots);

const normalizePath = (value) => {
  if (!value) return '';
  let pathname = '';
  try {
    const parsed = new URL(value);
    pathname = parsed.pathname || '/';
  } catch {
    pathname = String(value || '').trim();
  }
  if (!pathname.startsWith('/')) pathname = `/${pathname}`;
  if (pathname.length > 1 && pathname.endsWith('/')) pathname = pathname.slice(0, -1);
  return pathname || '/';
};

const extractLocs = (xml) => {
  const locs = [];
  const regex = /<loc>\s*([^<]+?)\s*<\/loc>/gi;
  let m;
  while ((m = regex.exec(xml))) {
    locs.push(String(m[1] || '').trim());
  }
  return locs;
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const globToRegex = (pattern) => {
  const chars = Array.from(pattern || '');
  let out = '^';
  for (let i = 0; i < chars.length; i += 1) {
    const ch = chars[i];
    const next = chars[i + 1];
    if (ch === '*' && next === '*') {
      out += '.*';
      i += 1;
      continue;
    }
    if (ch === '*') {
      out += '[^/]*';
      continue;
    }
    out += escapeRegex(ch);
  }
  out += '$';
  return new RegExp(out);
};

const routePatternToRegex = (routePattern) => {
  const parts = String(routePattern || '').split('/').filter((p) => p.length > 0);
  if (parts.length === 0) return /^\/$/;
  const mapped = parts
    .map((part) => {
      if (part === '*') return '.*';
      if (part.startsWith(':')) return '[^/]+';
      return escapeRegex(part);
    })
    .join('/');
  return new RegExp(`^/${mapped}$`);
};

const hasLiteralSegment = (routePattern) => {
  const parts = String(routePattern || '')
    .split('/')
    .filter((p) => p.length > 0);
  if (parts.length === 0) return false;
  return parts.some((part) => !part.startsWith(':') && part !== '*');
};

const loadRoutePatterns = () => {
  const routesPath = path.join(repoRoot, 'src/app/routes.tsx');
  const src = fs.readFileSync(routesPath, 'utf8');
  const patternRegex = /path\s*:\s*['\"`]([^'\"`]+)['\"`]/g;
  const patterns = new Set();
  let m;
  while ((m = patternRegex.exec(src))) {
    const routePatternRaw = String(m[1] || '').trim();
    if (!routePatternRaw || routePatternRaw === '*' || routePatternRaw === '/*') continue;
    const routePattern = routePatternRaw.startsWith('/')
      ? routePatternRaw
      : `/${routePatternRaw}`;
    if (!hasLiteralSegment(routePattern)) continue;
    patterns.add(routePattern);
  }
  return Array.from(patterns).sort();
};

const loadNoindexHeaderRegexes = () => {
  const firebasePath = path.join(repoRoot, 'firebase.json');
  const json = JSON.parse(fs.readFileSync(firebasePath, 'utf8'));
  const headers = json?.hosting?.headers || [];
  return headers
    .filter((rule) =>
      Array.isArray(rule?.headers) &&
      rule.headers.some(
        (h) =>
          String(h?.key || '').toLowerCase() === 'x-robots-tag' &&
          /noindex/i.test(String(h?.value || '')),
      ),
    )
    .map((rule) => globToRegex(String(rule.source || '').trim()))
    .filter(Boolean);
};

const routePatterns = loadRoutePatterns();
const routePatternMatchers = routePatterns.map((pattern) => ({
  pattern,
  regex: routePatternToRegex(pattern),
}));
const noindexHeaderMatchers = loadNoindexHeaderRegexes();

const rowsByPath = new Map();

for (const relativeFile of SITEMAP_FILES) {
  const fullPath = path.join(repoRoot, relativeFile);
  const xml = fs.readFileSync(fullPath, 'utf8');
  const locs = extractLocs(xml);
  for (const loc of locs) {
    const pathname = normalizePath(loc);
    const current = rowsByPath.get(pathname) || {
      path: pathname,
      url: loc,
      sources: new Set(),
    };
    current.sources.add(relativeFile);
    rowsByPath.set(pathname, current);
  }
}

const routeSeoKeys = new Set(Object.keys(ROUTE_SEO_REGISTRY));

const rows = Array.from(rowsByPath.values())
  .map((raw) => {
    const routeSeo = ROUTE_SEO_REGISTRY[raw.path];
    const exactRegistryMatch = routeSeoKeys.has(raw.path);

    const matchedPattern = routePatternMatchers.find(({ regex }) => regex.test(raw.path))?.pattern || '';
    const routeExistsDetectable = exactRegistryMatch || Boolean(matchedPattern);

    const canonicalPath = routeSeo?.canonicalPath ? normalizePath(routeSeo.canonicalPath) : '';
    const canonicalConflict = Boolean(exactRegistryMatch && canonicalPath && canonicalPath !== raw.path);

    const noindexByRegistry = noindexRobots(routeSeo?.robots);
    const noindexByHeader = noindexHeaderMatchers.some((re) => re.test(raw.path));
    const privateOrNoindex = noindexByRegistry || noindexByHeader;

    const duplicateInSitemaps = raw.sources.size > 1;

    let issueCategory = 'OK';
    if (isSitemapResourcePath(raw.path)) {
      issueCategory = 'SITEMAP_RESOURCE';
    } else if (privateOrNoindex) {
      issueCategory = 'PRIVATE_OR_NOINDEX';
    } else if (duplicateInSitemaps) {
      issueCategory = 'DUPLICATE_SITEMAP';
    } else if (canonicalConflict) {
      issueCategory = 'CANONICAL_CONFLICT';
    } else if (!routeExistsDetectable) {
      issueCategory = 'MISSING_ROUTE';
    } else if (!exactRegistryMatch && !DYNAMIC_PATTERNS_OK.has(matchedPattern)) {
      issueCategory = 'LOW_VALUE_REVIEW_NEEDED';
    }

    const canonicalMapping = canonicalConflict
      ? `${raw.path} -> ${canonicalPath}`
      : canonicalPath
        ? `self:${canonicalPath}`
        : 'not_detected';

    return {
      path: raw.path,
      url: raw.url,
      sitemapSource: Array.from(raw.sources).sort().join(', '),
      duplicatePresence: duplicateInSitemaps ? 'yes' : 'no',
      routeExists: routeExistsDetectable ? 'yes' : 'no',
      matchedRoutePattern: matchedPattern || '-',
      canonicalMapping,
      privateNoindex: privateOrNoindex ? 'yes' : 'no',
      issueCategory,
      notes: [
        noindexByRegistry ? 'routeSeo:noindex' : '',
        noindexByHeader ? 'firebaseHeader:noindex' : '',
      ].filter(Boolean).join('; ') || '-',
    };
  })
  .sort((a, b) => a.path.localeCompare(b.path));

const sitemapResourceRows = rows.filter((row) => row.issueCategory === 'SITEMAP_RESOURCE');
const pageRows = rows.filter((row) => row.issueCategory !== 'SITEMAP_RESOURCE');
const okPageRows = pageRows.filter((row) => row.issueCategory === 'OK');
const nonOkPageRows = pageRows.filter((row) => row.issueCategory !== 'OK');

const pageCategorySummary = pageRows.reduce((acc, row) => {
  acc[row.issueCategory] = (acc[row.issueCategory] || 0) + 1;
  return acc;
}, {});

const now = new Date().toISOString();
const inspected = [
  ...SITEMAP_FILES,
  'src/app/routes.tsx',
  'src/lib/routeSeoRegistry.js',
  'firebase.json',
];

const lines = [];
lines.push('# Sitemap Indexability Audit');
lines.push('');
lines.push(`Generated: ${now}`);
lines.push('');
lines.push('## Files Inspected');
for (const item of inspected) lines.push(`- ${item}`);
lines.push('');
lines.push('## Summary');
lines.push(`- Total sitemap resources: ${sitemapResourceRows.length}`);
lines.push(`- Total page URLs audited: ${pageRows.length}`);
lines.push(`- OK page URLs: ${okPageRows.length}`);
lines.push(`- Non-OK page URLs: ${nonOkPageRows.length}`);
for (const [category, count] of Object.entries(pageCategorySummary).sort(([a], [b]) => a.localeCompare(b))) {
  if (category === 'OK') continue;
  lines.push(`- ${category}: ${count}`);
}
lines.push('');
lines.push('## Findings (Page URLs)');
lines.push('');
lines.push('| path | url | sitemap source | duplicate presence | route exists | matched route pattern | canonical mapping | private/noindex | suspected issue category | notes |');
lines.push('|---|---|---|---|---|---|---|---|---|---|');
for (const row of pageRows) {
  const cells = [
    row.path,
    row.url,
    row.sitemapSource,
    row.duplicatePresence,
    row.routeExists,
    row.matchedRoutePattern,
    row.canonicalMapping,
    row.privateNoindex,
    row.issueCategory,
    row.notes,
  ].map((value) => String(value).replace(/\|/g, '\\|'));
  lines.push(`| ${cells.join(' | ')} |`);
}
lines.push('');
lines.push('## Sitemap Resources');
lines.push('');
lines.push('| path | url | sitemap source | duplicate presence | route exists | matched route pattern | canonical mapping | private/noindex | suspected issue category | notes |');
lines.push('|---|---|---|---|---|---|---|---|---|---|');
for (const row of sitemapResourceRows) {
  const cells = [
    row.path,
    row.url,
    row.sitemapSource,
    row.duplicatePresence,
    row.routeExists,
    row.matchedRoutePattern,
    row.canonicalMapping,
    row.privateNoindex,
    row.issueCategory,
    row.notes,
  ].map((value) => String(value).replace(/\|/g, '\\|'));
  lines.push(`| ${cells.join(' | ')} |`);
}

const reportPath = path.join(repoRoot, 'docs/sitemap-indexability-audit.md');
fs.writeFileSync(reportPath, `${lines.join('\n')}\n`, 'utf8');

console.log(`Wrote report: ${path.relative(repoRoot, reportPath)}`);
console.log(`Audited rows: ${rows.length}`);
