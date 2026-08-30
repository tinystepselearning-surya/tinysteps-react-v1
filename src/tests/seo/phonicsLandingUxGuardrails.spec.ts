import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

describe('Phonics landing narrative and UX guardrails', () => {
  it('keeps the public phonics age range consistently at ages 3–12', () => {
    const page = read('src/pages/phonics.tsx');

    expect(page).toContain("label: 'Ages 3–12'");
    expect(page).toContain('children aged 3–12');
    expect(page).toContain('ageRange="Ages 3–12"');
    expect(page).not.toContain('Ages 3–10');
    expect(page).not.toContain('ages 3–10');
  });

  it('keeps Brick 1 authority content and ownership intact while UX work proceeds around it', () => {
    const page = read('src/pages/phonics.tsx');
    const brick1 = read('src/tests/seo/phonicsBrick1Authority.spec.ts');

    expect(page).toContain('What should parents look for in the best online phonics classes?');
    expect(page).toContain('Assessment-first placement');
    expect(page).toContain('Explicit, systematic progression');
    expect(page).toContain('Blending and segmenting');
    expect(page).toContain('Decoding instead of guessing');
    expect(page).toContain('Live observation and correction');
    expect(page).toContain('Reading and spelling transfer');
    expect(page).toContain('Pacing matched to readiness');
    expect(page).toContain('Parent-visible progress');
    expect(page).toContain('#phonics-class-quality-criteria');
    expect(page).toContain('rather than depending on a broad “best” claim');

    for (const href of [
      '/curriculum?tab=phonics',
      '/class-samples',
      '/testimonials',
      '/pricing',
      '/best-online-phonics-classes-for-kids-in-india',
    ]) {
      expect(page, href).toContain(href);
    }

    expect(brick1).toContain("canonicalPath: '/phonics'");
    expect(brick1).toContain("canonicalPath: '/best-online-phonics-classes-for-kids-in-india'");
  });

  it('gives repeated parent ideas one primary visible owner instead of stacking duplicate sections', () => {
    const page = read('src/pages/phonics.tsx');

    expect(page.match(/title="Who this page is for"/g) ?? []).toHaveLength(1);
    expect(page).not.toContain('Who should join Tiny Steps phonics classes?');
    expect(page).not.toContain('Common phonics questions parents ask');
    expect(page).not.toContain('Not sure if your child needs phonics?');
    expect(page).not.toContain('The Tiny Steps Phonics Method');
    expect(page).not.toContain('Why Tiny Steps phonics is different');
    expect(page).not.toContain('What your child learns');

    expect(page.match(/id="resources"/g) ?? []).toHaveLength(1);
    expect(page).toContain('Phonics parent resource hub');
    expect(page.match(/id="faq"/g) ?? []).toHaveLength(1);
    expect(page).toContain('Phonics questions parents ask before enrolling');
  });

  it('keeps one chronological parent journey from orientation through a safe next step', () => {
    const page = read('src/pages/phonics.tsx');
    const markers = [
      'id="overview"',
      'id="problems"',
      'id="best-phonics-classes"',
      'id="teacher-delivery"',
      'id="program"',
      'id="learning-path"',
      'id="progress"',
      'id="resources"',
      'id="faq"',
      'id="assessment"',
    ];

    let lastIndex = -1;
    for (const marker of markers) {
      const nextIndex = page.indexOf(marker);
      expect(nextIndex, marker).toBeGreaterThan(lastIndex);
      lastIndex = nextIndex;
    }
  });

  it('keeps the final assessment journey explicit and non-pressuring', () => {
    const page = read('src/pages/phonics.tsx');

    expect(page).toContain('What happens next?');
    expect(page).toContain('1. Free 35-Minute Demo Assessment');
    expect(page).toContain('2. Level-Based Plan');
    expect(page).toContain('3. Informed Decision');
    expect(page).toContain('Booking takes about 2 minutes • no commitment required');
    expect(page).toContain('No commitment required.');
  });
});
