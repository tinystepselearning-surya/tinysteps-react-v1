// @ts-nocheck
// MDX helper: lists posts from src/content/blog/*.mdx when MDX plugin is installed
export type MdxMeta = {
  slug: string;
  title: string;
  category?: string;
  author?: string;
  date?: string;
  readTime?: string;
  hero?: string;
  excerpt?: string;
};

export async function fetchMdxPosts(): Promise<MdxMeta[]> {
  try {
    const modules = import.meta.glob('./blog/*.mdx');
    const entries = Object.entries(modules);
    const result: MdxMeta[] = [];
    for (const [path, loader] of entries) {
      try {
        const mod: any = await (loader as any)();
        const meta = mod.meta || {};
        const slug = path.replace('./blog/', '').replace(/\.mdx?$/, '');
        result.push({ slug, ...meta });
      } catch (e) {
        // ignore broken mdx import
      }
    }
    return result;
  } catch (e) {
    return [];
  }
}

