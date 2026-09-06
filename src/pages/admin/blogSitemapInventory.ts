export const extractBlogSlugsFromSitemapXml = (xml: string): string[] => {
  const slugs = new Set<string>();
  const pattern = /<loc>https?:\/\/[^<]+\/blog\/([^<]+)<\/loc>/gi;
  let match: RegExpExecArray | null = pattern.exec(xml);
  while (match) {
    const raw = String(match[1] || '').split(/[?#]/)[0].replace(/\/+$/, '');
    if (raw && !raw.includes('/')) {
      try {
        slugs.add(decodeURIComponent(raw));
      } catch {
        slugs.add(raw);
      }
    }
    match = pattern.exec(xml);
  }
  return Array.from(slugs);
};

export const loadBlogSitemapInventory = async (): Promise<string[]> => {
  const response = await fetch('/sitemap-blog.xml', { cache: 'no-store' });
  if (!response.ok) throw new Error(`Blog sitemap returned HTTP ${response.status}.`);
  return extractBlogSlugsFromSitemapXml(await response.text());
};
