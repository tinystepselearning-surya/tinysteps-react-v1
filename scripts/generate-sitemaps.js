/* eslint-disable */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PARENT_HELP_ROUTES, STATIC_MARKETING_ROUTES, uniqueRoutes } from './seo-route-inventory.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function extractSlugsFromFile(filePath, key) {
  try {
    const src = fs.readFileSync(filePath, 'utf-8');
    // match slug: 'value' or slug: "value" (simple robust literal)
    const regex = /slug\s*:\s*['"`"]([^'"`]+)['"`]/g;
    const slugs = [];
    let match;
    while ((match = regex.exec(src))) slugs.push(match[1]);
    return slugs;
  } catch (e) { return []; }
}

function listMdxSlugs(dir) {
  try {
    return fs.readdirSync(dir).filter(f => f.endsWith('.mdx')).map(f => f.replace(/\.mdx$/, ''));
  } catch (e) { return []; }
}

function writeXml(file, xml) {
  fs.writeFileSync(file, xml.trim() + '\n', 'utf-8');
}

function fmt(date){ return date.toISOString().slice(0,10); }
function lastmodFrom(p,fallback){ try { return fmt(fs.statSync(p).mtime); } catch { return fallback || fmt(new Date()); } }
function toUrl(loc, lastmod, priority='0.8', changefreq='weekly') {
  return `\n  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod || fmt(new Date())}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

(function main(){
  const root = path.resolve(__dirname, '..');
  const publicDir = path.join(root, 'public');
  const blogTs = path.join(root, 'src', 'content', 'blog.ts');
  const coursesTs = path.join(root, 'src', 'content', 'courses.ts');
  const parentsMetaTs = path.join(root, 'src', 'content', 'parentsMeta.ts');
  const mdxDir = path.join(root, 'src', 'content', 'blog');

  const blogSlugs = extractSlugsFromFile(blogTs, 'slug');
  const mdxSlugs = listMdxSlugs(mdxDir);
  const courseSlugs = extractSlugsFromFile(coursesTs, 'slug');

  

  const staticRoutes = uniqueRoutes(STATIC_MARKETING_ROUTES);
  const parentRoutes = uniqueRoutes(PARENT_HELP_ROUTES);

  // sitemap-static.xml (top-level canonical marketing pages)
  const staticXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`+
    staticRoutes.map((route) => {
      const loc = route === '/' ? 'https://tinystepslearning.com/' : `https://tinystepslearning.com${route}`;
      const priority = route === '/' ? '1.0' : route === '/blog' ? '0.8' : route === '/courses' ? '0.9' : '0.8';
      const changefreq = route === '/blog' ? 'daily' : route === '/' || route === '/courses' ? 'weekly' : 'monthly';
      return toUrl(loc, fmt(new Date()), priority, changefreq);
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
  for (const slug of uniqueRoutes([...blogSlugs, ...mdxSlugs])) {
    const mdxPath = path.join(mdxDir, `${slug}.mdx`);
    const last = fs.existsSync(mdxPath) ? lastmodFrom(mdxPath) : lastmodFrom(blogTs);
    blogXml += toUrl(`https://tinystepslearning.com/blog/${slug}`, last, '0.8', 'weekly');
  }
  blogXml += `\n</urlset>`;
  writeXml(path.join(publicDir, 'sitemap-blog.xml'), blogXml);

  // sitemap-courses.xml
  let courseXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  for (const slug of uniqueRoutes(courseSlugs)) {
    const last = lastmodFrom(coursesTs);
    courseXml += toUrl(`https://tinystepslearning.com/courses/${slug}`, last, '0.8', 'weekly');
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
