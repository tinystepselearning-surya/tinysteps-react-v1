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
    sourcemap: true,
    modulePreload: false,
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
            if (id.includes('firebase')) return 'firebase';
            if (id.includes('framer-motion')) return 'motion';
            if (id.includes('react') && id.includes('node_modules')) return 'vendor-react';
            if (id.match(/(chart|d3|recharts|chartjs|vega)/i)) return 'vendor-charts';
            if (id.includes('@mdx-js') || id.includes('rehype') || id.includes('remark')) return 'vendor-mdx';
            return 'vendor';
          }

          if (id.includes('/src/components/common/FloatingAssistant')) return 'marketing-assistant';
          if (id.includes('/src/components/common/Footer')) return 'marketing-footer';
          if (id.includes('/src/components/programs/ParentReassurance')) return 'home-parent-reassurance';
          if (id.includes('/src/components/Home/PricingCrispSection')) return 'home-pricing';
          if (id.includes('/src/components/Home/SocialProofCrispSection')) return 'home-social-proof';
          if (id.includes('/src/components/Home/StepTimeline')) return 'home-timeline';
          if (id.includes('/src/components/Home/FinalCTASection')) return 'home-final-cta';
          if (id.includes('/src/components/Home/GlobalImpactSection')) return 'home-impact';
          if (id.includes('/src/components/Home/StatsProofSection')) return 'home-demo-showcase';
          if (id.includes('/src/components/Home/LearningJourneyRoadmapPPT')) return 'home-journey-roadmap';
          if (id.includes('/src/pages/KidsEnglishExcellence')) return 'kids-english';

          // Public marketing routes -> explicit async chunks to avoid a single heavy public bundle
          if (id.includes('/src/pages/HomePage')) return 'public-home';
          if (id.includes('/src/pages/CoursesPage') || id.includes('/src/pages/CourseDetailPage')) return 'public-courses';
          if (id.includes('/src/pages/CurriculumPage')) return 'public-curriculum';
          if (id.includes('/src/pages/BlogPage') || id.includes('/src/pages/BlogPostPage') || id.includes('/src/pages/blog/')) return 'public-blog';
          if (id.includes('/src/pages/PricingPage')) return 'public-pricing';
          if (id.includes('/src/pages/SummerCampsPage') || id.includes('/src/pages/SummerCampProgramPage')) return 'public-summer-camps';
          if (id.includes('/src/pages/ClassSamplesPage')) return 'public-class-samples';
          if (id.includes('/src/pages/WhyTinyStepsPage')) return 'public-why';
          if (id.includes('/src/pages/public/')) return 'public-marketing-longtail';
          if (id.includes('/src/pages/parents/')) return 'public-parents-hub';

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
