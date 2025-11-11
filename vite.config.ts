import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

function tryMdxPlugin() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mdx = require('@mdx-js/rollup');
    const remarkFrontmatter = safeRequire('remark-frontmatter');
    const remarkGfm = safeRequire('remark-gfm');
    const rehypeSlug = safeRequire('rehype-slug');
    const rehypeAutolink = safeRequire('rehype-autolink-headings');
    const rehypePrism = safeRequire('rehype-prism-plus');
    return mdx({
      include: /\.mdx?$/,
      remarkPlugins: [filterTruthy(remarkFrontmatter), filterTruthy(remarkGfm)].filter(Boolean),
      rehypePlugins: [
        filterTruthy(rehypeSlug),
        filterTruthy(rehypeAutolink) && [rehypeAutolink, { behavior: 'wrap' }],
        filterTruthy(rehypePrism)
      ].filter(Boolean)
    });
  } catch (e) {
    // MDX not installed; skip
    return null;
  }
}

function safeRequire(name:any) {
  try { return require(name); } catch { return null; }
}

function filterTruthy(x:any) { return x || null; }

const mdxPlugin = tryMdxPlugin();

export default defineConfig({
  plugins: mdxPlugin ? [mdxPlugin, react()] : [react()],
  resolve: {
    alias: {
      '@components': path.resolve(__dirname, './src/components'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) return 'vendor-firebase';
            if (id.includes('@mdx-js') || id.includes('rehype') || id.includes('remark')) return 'vendor-mdx';
            return 'vendor';
          }
          if (id.includes('/src/pages/admin/') || id.includes('/src/pages/teacher/') || id.includes('/src/pages/parent/') || id.includes('/src/pages/lp/') || id.includes('/src/pages/kid/')) {
            return 'dashboards';
          }
          return undefined;
        }
      }
    }
  }
});
