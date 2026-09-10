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

      // P0 public-fact normalization for remaining source-level migrations.
      // Commercial owner pages are now canonical in source and must not rely on
      // page-specific build-time text replacement.
      if (id.includes('/src/pages/HomePage.tsx')) {
        transformed = transformed.replace(
          'Classes are conducted through ${PUBLIC_FACTS.deliveryModel} in one-on-one and small-group formats. Each session is ${PUBLIC_FACTS.sessionDuration}.',
          'Classes are conducted through ${PUBLIC_FACTS.deliveryModel} in one-on-one and small-group formats. Standard 1:1 classes are ${PUBLIC_FACTS.sessionDuration}; small-group sessions are longer depending on group size.',
        );
      }

      if (id.includes('/src/pages/CurriculumPage.tsx')) {
        transformed = transformed.replace(
          'Each live online class runs for ${PUBLIC_FACTS.sessionDuration}, with guided teaching, practice, and teacher feedback.',
          'Standard 1:1 live online classes run for ${PUBLIC_FACTS.sessionDuration}, with guided teaching, practice, and teacher feedback. Small-group sessions are longer depending on group size.',
        );
      }

      if (id.includes('/src/content/courses.ts')) {
        transformed = transformed
          .replace("age: 'Ages 8–15'", "age: 'Ages 8–12'")
          .replace("age: 'Ages 7–15'", "age: 'Ages 7–12'");
      }

      if (id.includes('/src/pages/ForSchoolsPage.tsx')) {
        transformed = transformed.replace(
          'For CBSE, ICSE, State Board & International Schools • Ages 3–10',
          'For CBSE, ICSE, State Board & International Schools • Ages 3–12',
        );
      }

      if (id.includes('/src/pages/WhyTinyStepsPage.tsx')) {
        transformed = transformed.replace(
          '35–40 minute live classes (1:1 or small group) with trained mentors using multisensory practice, gentle correction, and age-appropriate pacing.',
          'Standard 1:1 live classes are 35 minutes. Small-group sessions are longer based on group size, with trained mentors using multisensory practice, gentle correction, and age-appropriate pacing.',
        );
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
