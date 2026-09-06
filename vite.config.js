import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { RETIRED_BLOG_PATH_REDIRECTS } from './scripts/blog-consolidation-map.mjs';

const LEGACY_PHONICS_PROGRESS_COPY =
  'Progress is child-specific. Look for stronger accuracy, less prompting, better retry behaviour, retention of earlier patterns, and independent transfer to fresh words or text rather than expecting the same week-by-week timeline for every learner.';
const LEGACY_PHONICS_SUPPORT_COPY =
  'If progress is not becoming more independent despite consistent, stage-matched instruction and practice, review placement, teaching sequence, correction quality and text difficulty. Involve the child’s school and an appropriate qualified professional when broader speech, language, hearing or learning concerns are also present.';
const PHONICS_PAGE_PROGRESS_FAQ_COPY =
  'Progress in blending depends on the child’s starting point and should be judged by increasing accuracy, less prompting, retention, and successful blending of fresh appropriately matched words rather than a fixed number of lessons.';

function canonicalInternalBlogLinks() {
  return {
    name: 'canonical-internal-blog-links-and-public-proof',
    enforce: 'pre',
    transform(code, id) {
      if (!id.includes('/src/')) return null;
      let transformed = code;
      for (const [source, destination] of Object.entries(RETIRED_BLOG_PATH_REDIRECTS)) {
        transformed = transformed.split(source).join(destination);
      }

      if (id.includes('/src/lib/testimonials.ts')) {
        transformed = transformed
          .replace(
            'const FALLBACK_TESTIMONIAL_TARGET = 250;',
            'const FALLBACK_TESTIMONIAL_TARGET = BASE_FALLBACK_TESTIMONIALS.length;',
          )
          .replace('const EXTRA_PHONICS_FALLBACK_COUNT = 50;', 'const EXTRA_PHONICS_FALLBACK_COUNT = 0;');
      }

      if (id.includes('/src/content/blog/shared/phonicsShared.ts')) {
        transformed = transformed
          .replace(
            'If your child has regular practice for 6-8 weeks but still cannot match basic sounds or blend simple CVC words, get an assessment from a phonics specialist.',
            'If your child has consistent, stage-matched practice but is not becoming more independent with basic sounds or blending, review the starting level and seek appropriate structured support.',
          )
          .replace(
            'run this simple routine for 2-3 weeks before judging progress.',
            'run this simple routine consistently and judge progress by accuracy, independence and transfer to fresh examples.',
          )
          .replace('Progress timeline parents can expect', 'How parents should interpret progress')
          .replaceAll('content: post.progress', `content: ${JSON.stringify(LEGACY_PHONICS_PROGRESS_COPY)}`)
          .replaceAll('content: post.support', `content: ${JSON.stringify(LEGACY_PHONICS_SUPPORT_COPY)}`);
      }

      if (id.includes('/src/pages/phonics.tsx')) {
        transformed = transformed
          .replace(
            'Many children show early blending progress in about 4–6 guided lessons. Timelines vary by starting level, attendance consistency, and home reinforcement. Progress is usually step-by-step rather than instant.',
            PHONICS_PAGE_PROGRESS_FAQ_COPY,
          )
          .replace(
            'Many children show early blending progress in 4–6 guided lessons, though timing depends on starting level, lesson consistency, and home reinforcement.',
            PHONICS_PAGE_PROGRESS_FAQ_COPY,
          )
          .replace(
            "{ value: '4–6', label: 'Lessons to begin first blending, depending on readiness' },",
            "{ value: 'Fresh-word transfer', label: 'Blending checked on unfamiliar words at the child’s current stage' },",
          )
          .replace(
            "{ value: '30–40', label: 'Lessons to cover core phonics foundations' },",
            "{ value: 'Individual pace', label: 'Foundation coverage depends on starting level, retention, and transfer' },",
          )
          .replace('structure="3 levels, 36+ lessons with stage-based progression"', 'structure="3 levels with stage-based progression"');
      }

      return transformed === code ? null : { code: transformed, map: null };
    },
  };
}

const buildTime = new Date().toISOString();

export default defineConfig({
  define: { 'import.meta.env.VITE_BUILD_TIME': JSON.stringify(buildTime) },
  plugins: [canonicalInternalBlogLinks(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
    },
  },
  css: { postcss: { plugins: [tailwindcss(), autoprefixer()] } },
  server: { host: true, hmr: { protocol: 'ws' } },
});