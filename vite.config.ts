import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

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
        filterTruthy(rehypePrism),
      ].filter(Boolean),
    });
  } catch (e) {
    // MDX not installed; skip
    return null;
  }
}

function safeRequire(name: any) {
  try {
    return require(name);
  } catch {
    return null;
  }
}

function filterTruthy(x: any) {
  return x || null;
}

const mdxPlugin = tryMdxPlugin();

export default defineConfig({
  plugins: mdxPlugin
    ? [
        mdxPlugin,
        react(),
        ...(process.env.ANALYZE === 'true'
          ? [
              visualizer({
                open: false,
                gzipSize: true,
                brotliSize: true,
                filename: 'dist/stats.html',
              }),
            ]
          : []),
      ]
    : [
        react(),
        ...(process.env.ANALYZE === 'true'
          ? [
              visualizer({
                open: false,
                gzipSize: true,
                brotliSize: true,
                filename: 'dist/stats.html',
              }),
            ]
          : []),
      ],

  resolve: {
    // Prefer TypeScript extensions over JavaScript to prevent shadowing issues
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
    // Ensure only one copy of React/ReactDOM is resolved to avoid hook errors
    dedupe: ['react', 'react-dom'],
    alias: {
      '@components': path.resolve(__dirname, './src/components'),
      // Explicitly alias React to the root node_modules to prevent duplicate instances
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    },
  },

  build: {
    // Improve build chunking to keep large bundles split and easier to cache.
    // We add specific vendor groups for React, animation, charting libraries and Firebase.
    // Adjust `chunkSizeWarningLimit` if you prefer fewer noisy warnings (measured in KB).
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id) return undefined;

          // node_modules -> vendor buckets
          if (id.includes('node_modules')) {
            if (id.includes('react-router')) return 'vendor-router';
            if (id.includes('@tanstack/react-query')) return 'vendor-query';
            if (id.includes('@sentry')) return 'vendor-sentry';
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('firebase')) return 'vendor-firebase';
            if (id.includes('framer-motion')) return 'vendor-framer-motion';
            if (id.includes('react') && id.includes('node_modules')) return 'vendor-react';
            if (id.match(/(chart|d3|recharts|chartjs|vega)/i)) return 'vendor-charts';
            if (id.includes('@mdx-js') || id.includes('rehype') || id.includes('remark')) return 'vendor-mdx';
            return 'vendor';
          }

          // Large app areas -> separate per-portal bundles
          if (id.includes('/src/pages/admin/')) return 'admin';
          if (id.includes('/src/pages/teacher/')) return 'teacher';
          if (id.includes('/src/pages/parent/')) return 'parent';
          if (id.includes('/src/pages/lp/')) return 'lp';
          if (id.includes('/src/pages/kid/')) return 'kid';

          return undefined;
        },
      },
    },
  },

  // Ensure HMR works reliably on localhost and across environments where the dev server
  // may be bound to the loopback address. This resolves common "failed to connect to websocket" issues.
  server: {
    host: true,
    // Do not hardcode the dev server port or HMR port here. When the
    // configured port is in use Vite will pick a free port; forcing an
    // HMR port (5173) causes the client to try to connect to the wrong
    // port and log "failed to connect to websocket" errors. Let Vite
    // auto-configure HMR so it uses the actual server port.
    //
    // If you need to explicitly set HMR host in special environments,
    // set `server.hmr.host` only and avoid hardcoding `port`.
    hmr: {
      protocol: 'ws',
    },
  },
});
