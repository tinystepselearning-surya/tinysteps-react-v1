import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import { RETIRED_BLOG_PATH_REDIRECTS } from './scripts/blog-consolidation-map.mjs';

function tryMdxPlugin() {
  try {
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
  } catch {
    return null;
  }
}
function safeRequire(name: any) { try { return require(name); } catch { return null; } }
function filterTruthy(x: any) { return x || null; }

function canonicalInternalBlogLinks() {
  return {
    name: 'canonical-internal-blog-links',
    enforce: 'pre' as const,
    transform(code: string, id: string) {
      if (!id.includes('/src/')) return null;
      let transformed = code;
      for (const [source, destination] of Object.entries(RETIRED_BLOG_PATH_REDIRECTS)) {
        transformed = transformed.split(source).join(destination);
      }
      return transformed === code ? null : { code: transformed, map: null };
    },
  };
}

const mdxPlugin = tryMdxPlugin();
const buildTime = new Date().toISOString();
const basePlugins = [canonicalInternalBlogLinks(), react()];
if (mdxPlugin) basePlugins.unshift(mdxPlugin);
if (process.env.ANALYZE === 'true') {
  basePlugins.push(visualizer({ open: false, gzipSize: true, brotliSize: true, filename: 'dist/stats.html' }));
}

export default defineConfig({
  define: { 'import.meta.env.VITE_BUILD_TIME': JSON.stringify(buildTime) },
  plugins: basePlugins,
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
    dedupe: ['react', 'react-dom'],
    alias: {
      '@components': path.resolve(__dirname, './src/components'),
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    },
  },
  build: {
    sourcemap: true,
    modulePreload: true,
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id) return undefined;
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
  server: { host: true, hmr: { protocol: 'ws' } },
});
