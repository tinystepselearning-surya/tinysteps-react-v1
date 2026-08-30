import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

const canonicalCoursePaths = [
  '/courses/phonics-foundation',
  '/courses/phonics-brush-up',
  '/courses/phonics-advanced',
  '/courses/grammar',
  '/courses/grammar-mastery',
  '/courses/public-speaking-foundations',
  '/courses/public-speaking-excellence',
];

describe('B13 curriculum, program and course authority guardrails', () => {
  it('keeps the existing canonical course URL set unchanged', () => {
    const registry = read('src/lib/publicCoursePages.js');
    const routePaths = [...registry.matchAll(/publicSlug:\s*'[^']+',\s*\n\s*routePath:\s*'([^']+)'/g)].map(
      (match) => match[1],
    );

    // Only the routePath paired with each exported public course config is canonical.
    // Nested navigation helpers may also reference course URLs and must not be mistaken
    // for additional canonical course owners.
    expect(routePaths).toEqual(canonicalCoursePaths);
    expect(new Set(routePaths).size).toBe(canonicalCoursePaths.length);
  });

  it('makes /curriculum the roadmap owner without duplicating lesson-by-lesson course content', () => {
    const page = read('src/pages/CurriculumPage.tsx');

    expect(page).toContain('The complete Tiny Steps learning roadmap');
    expect(page).toContain('Hear → identify → connect sound to grapheme → blend → decode → apply in connected reading');
    expect(page).toContain('Notice the pattern → build a complete sentence → apply in context → correct errors → expand');
    expect(page).toContain('Listen and form an idea → answer in a complete sentence → add detail → organise → deliver and reflect');

    expect(page).not.toContain('WeekAccordion');
    expect(page).not.toContain('loadCurriculumOverrides');
    expect(page).not.toContain('getCourseWeeksOverride');
    expect(page).not.toContain('Cambridge-aligned');
    expect(page).not.toContain('IB Primary Years Programme lens');
    expect(page).not.toContain('How Tiny Steps aligns with IB English scopes');

    for (const coursePath of canonicalCoursePaths) {
      expect(page, coursePath).toContain(`path: '${coursePath}'`);
    }

    for (const programPath of ['/phonics', '/grammar', '/speaking']) {
      expect(page, programPath).toContain(`programPath: '${programPath}'`);
    }
  });

  it('uses neutral school-framework language instead of unverified alignment claims', () => {
    const registry = read('src/lib/routeSeoRegistry.js');
    const alignment = read('src/components/curriculum/IBAlignmentSection.tsx');
    const curriculum = read('src/pages/CurriculumPage.tsx');

    expect(registry).toContain("title: 'English Curriculum for Kids Ages 3–12 | Tiny Steps Learning'");
    expect(registry).not.toContain("title: 'IB-Aligned English Curriculum | Tiny Steps Learning'");

    for (const source of [alignment, curriculum]) {
      expect(source).not.toContain('Cambridge-aligned');
      expect(source).not.toContain('IB-Aligned');
      expect(source).not.toContain('aligns with IB');
    }

    expect(alignment).toContain('independent learning provider');
    expect(alignment).toContain('CBSE, ICSE, IB, Cambridge');
  });

  it('routes program and detailed course pages back to the full curriculum roadmap', () => {
    for (const pagePath of ['src/pages/phonics.tsx', 'src/pages/grammar.tsx', 'src/pages/speaking.tsx']) {
      expect(read(pagePath), pagePath).toContain('/curriculum');
    }

    const courseDetail = read('src/pages/CourseDetailPage.tsx');
    expect(courseDetail).toContain("const programPath = courseTrack === 'phonics' ? '/phonics' : courseTrack === 'grammar' ? '/grammar' : '/speaking';");
    expect(courseDetail).toContain("name: 'Curriculum'");
    expect(courseDetail).toContain("item: `${PUBLIC_FACTS.primaryWebsite}/curriculum`");
    expect(courseDetail).toContain("label: 'View Full Curriculum Roadmap'");
    expect(courseDetail).toContain('See the detailed lesson sequence for this level below.');
    expect(courseDetail).toContain('complete Tiny Steps curriculum roadmap');
    expect(courseDetail).not.toContain('This page owns the detailed lesson sequence for this level.');
  });

  it('keeps /courses as the comparison hub while softening guaranteed-outcome wording', () => {
    const courses = read('src/pages/CoursesPage.tsx');

    expect(courses).toContain('View Curriculum Roadmap');
    expect(courses).toContain("url: 'https://tinystepslearning.com/curriculum'");
    expect(courses).not.toContain("outcome: 'Your child");
  });

  it('documents zero-new-URL and authority ownership rules', () => {
    const audit = read('docs/seo/blog-bricks/B13_CURRICULUM_PROGRAM_AUTHORITY_AUDIT.md');
    const map = read('docs/seo/blog-bricks/B13_CURRICULUM_AUTHORITY_MAP.md');

    expect(audit).toContain('B13 does not create new URLs');
    expect(audit).toContain('`/curriculum` = the full Tiny Steps learning roadmap owner');
    expect(audit).toContain('canonical course pages = detailed lesson-sequence owners');
    expect(map).toContain('**Zero new indexable URLs.**');
    expect(map).toContain('/courses/public-speaking-excellence');
  });
});
