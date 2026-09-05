import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

const publicCourseConfigPath = 'src/lib/publicCoursePages.js';
const courseDetailPath = 'src/pages/CourseDetailPage.tsx';

describe('Phonics Brick 4 course-stage authority guardrails', () => {
  it('keeps the existing three canonical phonics course-stage URLs', () => {
    const config = read(publicCourseConfigPath);

    for (const route of [
      '/courses/phonics-foundation',
      '/courses/phonics-brush-up',
      '/courses/phonics-advanced',
    ]) {
      expect(config).toContain(`routePath: '${route}'`);
    }

    expect(config).toContain("legacySlugs: ['phonics-foundations']");
    expect(config).toContain('return PUBLIC_COURSE_PAGE_CONFIGS.map((config) => config.routePath)');
  });

  it('gives Foundation the beginner-course search intent without competing with the broad /phonics owner', () => {
    const config = read(publicCourseConfigPath).toLowerCase();

    for (const term of [
      'phonics foundation course',
      'beginner phonics course',
      'phonics course for beginners',
      'beginner phonics classes for kids',
      'online phonics course for beginners',
      'synthetic phonics course for kids',
      'letter sounds and blending course',
      'cvc reading course for kids',
    ]) {
      expect(config).toContain(term);
    }

    expect(config).toContain("{ label: 'see the complete tiny steps phonics program', to: '/phonics' }");
  });

  it('gives Early and Advanced distinct stage-level intent', () => {
    const config = read(publicCourseConfigPath).toLowerCase();

    for (const term of [
      'early phonics course',
      'digraph phonics course',
      'long vowel phonics course',
      'vowel team phonics classes',
      'magic e phonics classes',
      'advanced phonics course',
      'multisyllabic decoding course',
      'longer word reading classes',
      'advanced spelling patterns for kids',
      'phonics fluency course for kids',
    ]) {
      expect(config).toContain(term);
    }

    expect(config).toContain("name: 'early phonics'");
    expect(config).toContain("name: 'advanced phonics'");
  });

  it('makes Foundation → Early → Advanced an explicit readiness-based progression', () => {
    const config = read(publicCourseConfigPath);
    const page = read(courseDetailPath);

    expect(config).toContain('const PHONICS_STAGE_SEQUENCE = [');
    expect(config).toContain("name: 'Phonics Foundations'");
    expect(config).toContain("name: 'Early Phonics'");
    expect(config).toContain("name: 'Advanced Phonics'");
    expect(config).toContain('Placement is based on what the child can do during assessment, not age alone.');
    expect(config).toContain('Age is only a guide.');
    expect(config).toContain('The published age range is a guide.');
    expect(page).toContain('Foundation, Early, and Advanced are readiness-based stages.');
    expect(page).toContain('children move forward when the underlying skills are secure rather than simply because of age');
  });

  it('exposes entry signals, skills built, and exit readiness on every phonics stage', () => {
    const config = read(publicCourseConfigPath);
    const page = read(courseDetailPath);

    expect(config.match(/stageAuthority: \{/g)).toHaveLength(3);
    expect(config.match(/entrySignals: \[/g)).toHaveLength(3);
    expect(config.match(/skillsBuilt: \[/g)).toHaveLength(3);
    expect(config.match(/exitSignals: \[/g)).toHaveLength(3);
    expect(config.match(/sequence: PHONICS_STAGE_SEQUENCE/g)).toHaveLength(3);

    expect(page).toContain('Signs this may be the right starting stage');
    expect(page).toContain('Skills this stage builds');
    expect(page).toContain('Readiness to move forward');
    expect(page).toContain('Tiny Steps phonics progression');
  });

  it('adds answer-engine questions for placement, progression, duration, spelling, longer words, and fluency', () => {
    const config = read(publicCourseConfigPath);

    for (const question of [
      'What is a phonics foundation course?',
      'Does my child need Foundation Phonics if they already know the alphabet?',
      'How long does the Tiny Steps Phonics Foundations course take?',
      'What comes after the phonics foundation stage?',
      'How is Early Phonics different from Phonics Foundations?',
      'Will Early Phonics help with spelling as well as reading?',
      'How is Advanced Phonics different from Early Phonics?',
      'Does Advanced Phonics teach children how to read longer words?',
      'Does Advanced Phonics include reading fluency?',
      'What comes after Advanced Phonics?',
    ]) {
      expect(config).toContain(question);
    }

    expect(config).toContain('The published Foundation curriculum contains 31 lessons, but completion time is not fixed.');
  });

  it('aligns GEO Course entities with the visible stage names and skills', () => {
    const page = read(courseDetailPath);

    expect(page).toContain("name: 'Phonics Foundations Program'");
    expect(page).toContain("name: 'Early Phonics Program'");
    expect(page).toContain("name: 'Advanced Phonics Program'");
    expect(page).not.toContain("name: 'Phonics Brush-Up Program'");
    expect(page).toContain('teaches: Array.isArray(coursePageConfig?.teaches)');
    expect(page).toContain("'@id': `${canonicalUrl}#phonics-program-stages`");
    expect(page).toContain("name: 'Tiny Steps phonics programme stages'");
    expect(page).toContain("'@type': 'ItemList'");
  });

  it('keeps evidence, curriculum, programme, demo, and sibling-stage routes connected', () => {
    const config = read(publicCourseConfigPath);
    const page = read(courseDetailPath);

    for (const route of [
      '/phonics',
      '/curriculum',
      '/book-demo',
      '/courses/phonics-foundation',
      '/courses/phonics-brush-up',
      '/courses/phonics-advanced',
      '/reading-fluency-program',
      '/blog/what-is-phonics-for-kids',
      '/blog/why-letter-sounds-are-not-enough-to-read',
      '/blog/how-kids-learn-blending',
      '/blog/digraphs-and-tricky-words',
      '/blog/phonics-multisyllabic',
    ]) {
      expect(config.includes(`to: '${route}'`) || page.includes(`to="${route}"`)).toBe(true);
    }
  });

  it('keeps prerender metadata derived from the same public course registry', () => {
    const registry = read('src/lib/routeSeoRegistry.js');
    const config = read(publicCourseConfigPath);

    expect(registry).toContain("import { PUBLIC_COURSE_PAGE_CONFIGS } from './publicCoursePages.js'");
    expect(registry).toContain('for (const coursePage of PUBLIC_COURSE_PAGE_CONFIGS)');
    expect(registry).toContain('title: coursePage.title');
    expect(registry).toContain('description: coursePage.description');

    expect(config).toContain("title: 'Phonics Foundation Course for Kids | Beginner Phonics | Tiny Steps'");
    expect(config).toContain("title: 'Early Phonics Course for Kids | Digraphs & Long Vowels | Tiny Steps'");
    expect(config).toContain("title: 'Advanced Phonics Course for Kids | Spelling & Fluency | Tiny Steps'");
  });

  it('keeps parent-facing copy free of internal SEO ownership language', () => {
    const page = read(courseDetailPath);

    expect(page).not.toContain('This page owns the detailed lesson sequence');
    expect(page).not.toContain('FAQ content stays course-specific and continues to support valid structured data');
    expect(page).not.toContain('broad owner');
    expect(page).not.toContain('keyword cannibalisation');
  });
});
