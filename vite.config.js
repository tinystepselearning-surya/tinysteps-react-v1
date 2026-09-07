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

      // P0 public-fact normalization: one authoritative audience and 1:1 duration
      // across rendered SEO/AEO/GEO surfaces while source-level migrations complete.
      if (id.includes('/src/lib/schemas.ts')) {
        transformed = transformed
          .replace("sessionDuration: '35–40 minutes per session'", "sessionDuration: '35 minutes'")
          .replace(
            'through ${PUBLIC_FACTS.deliveryModel} in ${PUBLIC_FACTS.sessionDuration}, serving',
            'through ${PUBLIC_FACTS.deliveryModel}. Standard 1:1 classes are ${PUBLIC_FACTS.sessionDuration}, serving',
          )
          .replace(
            'Classes are delivered online in ${PUBLIC_FACTS.sessionDuration}, with',
            'Standard 1:1 classes are ${PUBLIC_FACTS.sessionDuration}, with',
          )
          .replace(
            'with ${PUBLIC_FACTS.sessionDuration} that balance',
            'with standard 1:1 sessions of ${PUBLIC_FACTS.sessionDuration} that balance',
          )
          .replace(
            'Classes run for ${PUBLIC_FACTS.sessionDuration} and serve',
            'Standard 1:1 classes run for ${PUBLIC_FACTS.sessionDuration} and serve',
          );
      }

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

      if (id.includes('/src/pages/public/OnlineEnglishClassesForKidsPage.tsx')) {
        transformed = transformed.replace("stage: 'Ages 9 to 13'", "stage: 'Ages 9 to 12'");
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

      if (id.includes('/src/pages/public/PhonicsFeesIndiaPage.tsx')) {
        transformed = transformed.replace(
          'Tiny Steps charges ₹400 per live 1:1 class, or ₹4,800 for 12 classes. Classes are typically 35–40 minutes and placement begins with an assessment-first approach.',
          'Tiny Steps charges ₹400 per live 1:1 class, or ₹4,800 for 12 classes. Standard 1:1 classes are 35 minutes, and placement begins with an assessment-first approach.',
        );
      }

      if (id.includes('/src/pages/public/ReadingClassesForKidsPage.tsx')) {
        transformed = transformed
          .replace(
            'Live classes are typically ${PUBLIC_SESSION_DURATION_LABEL}.',
            'Standard 1:1 live classes are ${PUBLIC_SESSION_DURATION_LABEL}.',
          )
          .replace(
            'Tiny Steps live classes are typically {PUBLIC_SESSION_DURATION_LABEL}. Current standard 1:1 pricing is',
            'Tiny Steps standard 1:1 live classes are {PUBLIC_SESSION_DURATION_LABEL}. Current standard 1:1 pricing is',
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
          .replace('duration="35–40 minutes, 2–3x per week"', 'duration="35 minutes per 1:1 class"')
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