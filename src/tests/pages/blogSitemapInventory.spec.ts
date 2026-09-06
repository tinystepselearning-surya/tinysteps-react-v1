import { describe, expect, it } from 'vitest';
import { extractBlogSlugsFromSitemapXml } from '../../pages/admin/blogSitemapInventory';

describe('Brick 7 blog sitemap inventory', () => {
  it('extracts unique article slugs and ignores nested/non-article blog URLs', () => {
    const xml = `<?xml version="1.0"?><urlset>
      <url><loc>https://tinystepslearning.com/blog/article-a</loc></url>
      <url><loc>https://tinystepslearning.com/blog/article-a</loc></url>
      <url><loc>https://tinystepslearning.com/blog/article-b?x=1</loc></url>
      <url><loc>https://tinystepslearning.com/blog/category/article-c</loc></url>
      <url><loc>https://tinystepslearning.com/phonics</loc></url>
    </urlset>`;

    expect(extractBlogSlugsFromSitemapXml(xml)).toEqual(['article-a', 'article-b']);
  });
});
