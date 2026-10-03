import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');

const speaking = read('src/pages/speaking.tsx');
const curriculum = read('src/pages/CurriculumPage.tsx');
const testimonials = read('src/pages/TestimonialsPage.tsx');
const progress = read('src/pages/public/SpeakingProgressFrameworkPage.tsx');
const confidence = read('src/pages/public/ConfidenceBuildingProgramKidsPage.tsx');
const spoken = read('src/pages/public/SpokenEnglishClassesForKidsPage.tsx');
const courseDetail = read('src/pages/CourseDetailPage.tsx');
const coursePages = read('src/lib/publicCoursePages.js');
const vite = read('vite.config.js');

describe('Speaking ecosystem navigation', () => {
  it('keeps programme-specific curriculum views working in production', () => {
    expect(vite).not.toContain('LEGACY_CURRICULUM_PROGRAM_LINKS');
    expect(curriculum).toContain("type Tab = 'phonics' | 'reading' | 'grammar' | 'speaking'");
    expect(curriculum).toContain("const requestedTab = searchParams.get('tab');");
    expect(curriculum).toContain(
      "const tab = requestedCourse ? inferTabFromCourse(requestedCourse) : safeTab(requestedTab);",
    );
    expect(curriculum).toContain('id="course-levels"');
    expect(curriculum).toContain('id="speaking-curriculum-v2"');
    expect(speaking).toContain('/curriculum?tab=speaking#course-levels');
    expect(courseDetail).toContain("'/curriculum?tab=speaking#course-levels'");
  });

  it('opens bounded Speaking parent evidence without creating another testimonial canonical', () => {
    expect(speaking).toContain('/testimonials?program=speaking#speaking-feedback');
    expect(testimonials).toContain("searchParams.get('program') === 'speaking'");
    expect(testimonials).toContain("'Basic Public Speaking'");
    expect(testimonials).toContain("'Advanced Public Speaking'");
    expect(testimonials).toContain('canonical={CANONICAL_URL}');
    expect(testimonials).toContain("id={speakingFocused ? 'speaking-feedback' : undefined}");
  });

  it('connects the progress method to the programme and both published levels', () => {
    expect(progress).toContain('/speaking');
    expect(progress).toContain('/courses/public-speaking-foundations');
    expect(progress).toContain('/courses/public-speaking-excellence');
    expect(progress).toContain('/curriculum?tab=speaking#course-levels');
  });

  it('keeps Confidence Building and Spoken English separate while linking back to Public Speaking', () => {
    expect(confidence).toContain('Confidence Building Classes for Kids');
    expect(confidence).toContain('Compare Public Speaking');
    expect(spoken).toContain('Spoken English Classes for Kids Online');
    expect(spoken).toContain('Compare Public Speaking Support');
    expect(spoken).toContain('/speaking');
  });

  it('keeps both named Speaking course pages and strengthens their evidence exits', () => {
    expect(coursePages).toContain("routePath: '/courses/public-speaking-foundations'");
    expect(coursePages).toContain("routePath: '/courses/public-speaking-excellence'");
    expect(coursePages.match(/View the Speaking curriculum roadmap/g)?.length).toBe(2);
    expect(coursePages.match(/See how speaking progress is measured/g)?.length).toBe(2);
    expect(coursePages.match(/Read Public Speaking parent feedback/g)?.length).toBe(2);
  });
});
