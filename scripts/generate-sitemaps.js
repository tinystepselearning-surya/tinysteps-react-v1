/* eslint-disable */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  SITEMAP_PARENT_ROUTES,
  SITEMAP_STATIC_ROUTES,
  uniqueRoutes,
} from './seo-route-inventory.mjs';
import { extractBlogEntriesFromPostFiles, listMdxEntries } from './blog-route-utils.mjs';
import { ROUTE_SEO_REGISTRY } from '../src/lib/routeSeoRegistry.js';
import { shouldIncludeBlogSlugInSitemap } from '../src/lib/blogIndexingPolicy.js';
import { getPublicCourseSitemapPaths } from '../src/lib/publicCoursePages.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function writeXml(file, xml) {
  fs.writeFileSync(file, xml.trim() + '\n', 'utf-8');
}

function fmt(date){ return date.toISOString().slice(0,10); }
function lastmodFrom(p,fallback){ try { return fmt(fs.statSync(p).mtime); } catch { return fallback || fmt(new Date()); } }
function toUrl(loc, lastmod, priority='0.8', changefreq='weekly') {
  return `\n  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod || fmt(new Date())}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

function isNoindexRobots(robots) {
  return typeof robots === 'string' && /(^|[,\\s])noindex([,\\s]|$)/i.test(robots);
}

function isCanonicalSelfRoute(route) {
  const cfg = ROUTE_SEO_REGISTRY[route];
  if (!cfg) return true;
  if (isNoindexRobots(cfg.robots)) return false;
  return (cfg.canonicalPath || route) === route;
}

const MONEY_PAGES = new Set(['/phonics', '/grammar', '/speaking', '/summer-camps']);
const SUPPORTING_LONG_TAIL = new Set([
  '/best-online-phonics-classes-for-kids-in-india',
  '/phonics-apps-for-preschoolers-india',
  '/phonics-games-for-preschoolers',
  '/phonics-learning-games',
  '/free-english-games-for-kids',
  '/free-phonics-games-for-kids',
  '/free-letter-sound-games-for-kids',
  '/free-word-building-games-for-kids',
  '/free-sentence-building-games-for-kids',
  '/free-reading-games-for-kids',
  '/free-grammar-games-for-kids',
  '/free-speaking-games-for-kids',
  '/free-letter-sounds-game-for-kids',
  '/free-sound-listening-game-for-kids',
  '/free-word-building-game-for-kids',
  '/free-spelling-game-for-kids',
  '/free-sentence-making-game-for-kids',
  '/free-reading-fluency-game-for-kids',
  '/free-grammar-practice-game-for-kids',
  '/free-speaking-practice-game-for-kids',
  '/free-letter-tracing-game-for-kids',
  '/letter-tracing-with-sounds-game',
]);

const EXCLUDED_BLOG_SLUGS = new Set([
  'spoken-english-classes-for-kids-confidence',
  'week-26-screen-smart-summer-routine',
  'week-22-phonics-diagnostics',
  'week-16-phonics-summer-plan',
  'week-3-phonics-tricky-words',
  'week-19-phonics-multisyllabic',
  'week-9-grammar-conjunctions',
  'week-15-speaking-debate-starters',
  'week-14-speaking-visual-aids',
  'week-11-grammar-creative-writing',
  'week-23-grammar-speaking-bridge',
  'week-17-grammar-assessment',
]);

(function main(){
  const root = path.resolve(__dirname, '..');
  const publicDir = path.join(root, 'public');
  const coursesTs = path.join(root, 'src', 'content', 'courses.ts');
  const parentsMetaTs = path.join(root, 'src', 'content', 'parentsMeta.ts');
  const appRoutesTs = path.join(root, 'src', 'app', 'routes.tsx');
  const mdxDir = path.join(root, 'src', 'content', 'blog');
  const blogPostsDir = path.join(root, 'src', 'content', 'blog', 'posts');

  const blogPostEntries = extractBlogEntriesFromPostFiles(blogPostsDir);
  const mdxEntries = listMdxEntries(mdxDir);
  const blogPostSlugDateMap = new Map(blogPostEntries.filter((entry) => entry.date).map((entry) => [entry.slug, entry.date]));
  const blogPostSlugPathMap = new Map(blogPostEntries.map((entry) => [entry.slug, entry.sourcePath]));
  const mdxSlugPathMap = new Map(mdxEntries.map((entry) => [entry.slug, entry.sourcePath]));
  const staticRoutesForSitemap = uniqueRoutes(SITEMAP_STATIC_ROUTES)
    .filter((route) => isCanonicalSelfRoute(route));
  const parentRoutes = uniqueRoutes(SITEMAP_PARENT_ROUTES);
  const today = fmt(new Date());

  // sitemap-static.xml (top-level canonical marketing pages)
  const staticLastmod = lastmodFrom(appRoutesTs);
  const staticXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`+
    staticRoutesForSitemap.map((route) => {
      const loc = route === '/' ? 'https://tinystepslearning.com/' : `https://tinystepslearning.com${route}`;
      const priority = route === '/'
        ? '1.0'
        : route === '/courses'
          ? '0.9'
          : MONEY_PAGES.has(route)
            ? '0.95'
            : SUPPORTING_LONG_TAIL.has(route)
              ? '0.85'
              : route === '/blog'
                ? '0.8'
                : '0.8';
      const changefreq = route === '/blog'
        ? 'daily'
        : route === '/' || route === '/courses' || MONEY_PAGES.has(route) || SUPPORTING_LONG_TAIL.has(route)
          ? 'weekly'
          : 'monthly';
      return toUrl(loc, staticLastmod, priority, changefreq);
    }).join('')+
  `\n</urlset>`;
  writeXml(path.join(publicDir, 'sitemap-static.xml'), staticXml);

  // sitemap-parents.xml (canonical parents hub pages only)
  let parentsXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  parentsXml += parentRoutes.map((route) => toUrl(`https://tinystepslearning.com${route}`, lastmodFrom(parentsMetaTs), route === '/parents' ? '0.85' : '0.7', 'weekly')).join('');
  parentsXml += `\n</urlset>`;
  writeXml(path.join(publicDir, 'sitemap-parents.xml'), parentsXml);

  // sitemap-blog.xml
  let blogXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  const blogRoutes = uniqueRoutes([
    ...blogPostEntries.map((entry) => entry.slug),
    ...mdxEntries.map((entry) => entry.slug),
  ])
    .filter((slug) => Boolean(slug) && !EXCLUDED_BLOG_SLUGS.has(slug) && shouldIncludeBlogSlugInSitemap(slug))
    .sort();
  if (blogRoutes.length === 0) {
    // Guardrail: never ship an empty blog sitemap (Google flags it as a missing <url> tag issue).
    blogXml += toUrl('https://tinystepslearning.com/blog', lastmodFrom(blogPostsDir), '0.8', 'daily');
    console.warn('[sitemap] No blog slugs detected; wrote /blog fallback URL.');
  } else {
    for (const slug of blogRoutes) {
      const mappedDate = blogPostSlugDateMap.get(slug);
      if (mappedDate && mappedDate > today) continue;
      const mdxPath = mdxSlugPathMap.get(slug);
      const postTsPath = blogPostSlugPathMap.get(slug);
      const last = mappedDate
        || (mdxPath
          ? lastmodFrom(mdxPath)
          : postTsPath
            ? lastmodFrom(postTsPath)
            : lastmodFrom(blogPostsDir));
      blogXml += toUrl(`https://tinystepslearning.com/blog/${slug}`, last, '0.8', 'weekly');
    }
  }
  blogXml += `\n</urlset>`;
  writeXml(path.join(publicDir, 'sitemap-blog.xml'), blogXml);

  // sitemap-courses.xml
  let courseXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  for (const routePath of getPublicCourseSitemapPaths()) {
    const last = lastmodFrom(coursesTs);
    courseXml += toUrl(`https://tinystepslearning.com${routePath}`, last, '0.8', 'weekly');
  }
  courseXml += `\n</urlset>`;
  writeXml(path.join(publicDir, 'sitemap-courses.xml'), courseXml);
  // sitemap index (sitemap.xml) referencing section sitemaps
  const idx = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`+
    `\n  <sitemap>\n    <loc>https://tinystepslearning.com/sitemap-static.xml</loc>\n    <lastmod>${fmt(new Date())}</lastmod>\n  </sitemap>`+
    `\n  <sitemap>\n    <loc>https://tinystepslearning.com/sitemap-blog.xml</loc>\n    <lastmod>${lastmodFrom(path.join(publicDir, 'sitemap-blog.xml'))}</lastmod>\n  </sitemap>`+
    `\n  <sitemap>\n    <loc>https://tinystepslearning.com/sitemap-courses.xml</loc>\n    <lastmod>${lastmodFrom(path.join(publicDir, 'sitemap-courses.xml'))}</lastmod>\n  </sitemap>`+
    `\n  <sitemap>\n    <loc>https://tinystepslearning.com/sitemap-parents.xml</loc>\n    <lastmod>${lastmodFrom(path.join(publicDir, 'sitemap-parents.xml'))}</lastmod>\n  </sitemap>`+
  `\n</sitemapindex>`;
  writeXml(path.join(publicDir, 'sitemap.xml'), idx);

  console.log('Sitemaps generated.');
})();
