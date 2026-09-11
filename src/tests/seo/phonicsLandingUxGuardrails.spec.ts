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

  it('keeps India-wide reach while making global online availability visible and schema-aligned', () => {
    const page = read('src/pages/phonics.tsx');
    const facts = read('src/components/programs/ProgramFacts.tsx');
    const schemas = read('src/lib/schemas.ts');
    const semanticFacts = read('src/config/semanticFacts.ts');

    expect(page).toContain('Live online phonics classes for families in India and worldwide');
    expect(page).toContain('India, the UAE, United States, United Kingdom, Australia, Singapore and other locations');
    expect(page).toContain("areaServed: ['India', 'Worldwide']");
    expect(facts).toContain("{PUBLIC_FACTS.geography}");
    expect(facts).toContain('Live online delivery is not limited to one city');
    expect(facts).toContain('across major Indian metros and cities, as well as from other countries');
    expect(schemas).toContain('geography: SEMANTIC_FACTS.serviceArea.onlineReach');
    expect(schemas).toContain('areaServed: [...SEMANTIC_FACTS.serviceArea.schemaAreaServed]');
    expect(semanticFacts).toContain("onlineReach: 'learners in India and globally online'");
    expect(semanticFacts).toContain("schemaAreaServed: ['IN', 'Worldwide']");
  });

  it('keeps the public programme structure aligned to the canonical 101-lesson phonics curriculum', () => {
    const page = read('src/pages/phonics.tsx');

    expect(page).toContain('structure="3 levels, 101 structured lessons with stage-based progression"');
    expect(page).not.toContain('36+ lessons');
  });

  it('keeps Brick 1 authority content and ownership intact while UX work proceeds around it', () => {
    const page = read('src/pages/phonics.tsx');
    const brick1 = read('src/tests/seo/phonicsBrick1Authority.spec.ts');

    expect(page).toContain('How to evaluate an online phonics class for your child');
    expect(page).toContain('Start from the child’s current level');
    expect(page).toContain('Follow a cumulative sequence');
    expect(page).toContain('Correct errors while they happen');
    expect(page).toContain('Check transfer into real reading');
    expect(page).toContain('#phonics-class-quality-criteria');

    for (const href of [
      '/curriculum?tab=phonics',
      '/class-samples',
      '/phonics-fees-india',
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
      'id="choosing-phonics-support"',
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
