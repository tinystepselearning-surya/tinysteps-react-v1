/* eslint-disable */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
  const mdxDir = path.join(root, 'src', 'content', 'blog');

  const blogSlugs = extractSlugsFromFile(blogTs, 'slug');
  const mdxSlugs = listMdxSlugs(mdxDir);
  const courseSlugs = extractSlugsFromFile(coursesTs, 'slug');

  

  // sitemap-static.xml (top-level static pages)
  const staticXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`+
    toUrl('https://tinystepslearning.com/', fmt(new Date()), '1.0', 'weekly')+
    toUrl('https://tinystepslearning.com/courses', lastmodFrom(coursesTs), '0.9', 'weekly')+
    toUrl('https://tinystepslearning.com/curriculum', lastmodFrom(path.join(publicDir, 'curriculum-v2.1.json')), '0.9', 'weekly')+
    toUrl('https://tinystepslearning.com/phonics', fmt(new Date()), '0.9', 'weekly')+
    toUrl('https://tinystepslearning.com/blog', fmt(new Date()), '0.8', 'daily')+
    toUrl('https://tinystepslearning.com/pricing', fmt(new Date()), '0.8', 'monthly')+
    toUrl('https://tinystepslearning.com/about', fmt(new Date()), '0.7', 'monthly')+
  `\n</urlset>`;
  writeXml(path.join(publicDir, 'sitemap-static.xml'), staticXml);

  // sitemap-parents.xml (separate file for parents hub)
  let parentsXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  parentsXml += toUrl('https://tinystepslearning.com/parents', fmt(new Date()), '0.85', 'weekly');
  parentsXml += toUrl('https://tinystepslearning.com/parents/getting-started', fmt(new Date()), '0.75', 'weekly');
  parentsXml += toUrl('https://tinystepslearning.com/parents/choosing-course', fmt(new Date()), '0.75', 'weekly');
  parentsXml += toUrl('https://tinystepslearning.com/parents/scheduling', fmt(new Date()), '0.7', 'weekly');
  parentsXml += toUrl('https://tinystepslearning.com/parents/payments', fmt(new Date()), '0.7', 'weekly');
  parentsXml += toUrl('https://tinystepslearning.com/parents/tracking-progress', fmt(new Date()), '0.7', 'weekly');
  parentsXml += toUrl('https://tinystepslearning.com/parents/helping-with-homework', fmt(new Date()), '0.7', 'weekly');
  parentsXml += toUrl('https://tinystepslearning.com/parents/phonics-mission', fmt(new Date()), '0.7', 'weekly');
  parentsXml += toUrl('https://tinystepslearning.com/parents/reading-at-home', fmt(new Date()), '0.7', 'weekly');
  parentsXml += toUrl('https://tinystepslearning.com/parents/speech-confidence', fmt(new Date()), '0.7', 'weekly');
  parentsXml += toUrl('https://tinystepslearning.com/parents/common-mistakes', fmt(new Date()), '0.7', 'weekly');
  parentsXml += `\n</urlset>`;
  writeXml(path.join(publicDir, 'sitemap-parents.xml'), parentsXml);

  // sitemap-blog.xml
  let blogXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  for (const slug of [...new Set([...blogSlugs, ...mdxSlugs])]) {
    const mdxPath = path.join(mdxDir, `${slug}.mdx`);
    const last = fs.existsSync(mdxPath) ? lastmodFrom(mdxPath) : fmt(new Date());
    blogXml += toUrl(`https://tinystepslearning.com/blog/${slug}`, last, '0.8', 'weekly');
  }
  blogXml += `\n</urlset>`;
  writeXml(path.join(publicDir, 'sitemap-blog.xml'), blogXml);

  // sitemap-courses.xml
  let courseXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  for (const slug of new Set(courseSlugs)) {
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
