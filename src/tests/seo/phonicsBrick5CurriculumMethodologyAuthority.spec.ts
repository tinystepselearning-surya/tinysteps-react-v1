import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

const curriculumPath = 'src/pages/CurriculumPage.tsx';
const teamSectionsPath = 'src/pages/team/TeamPageSections.tsx';

describe('Phonics Brick 5 curriculum and methodology authority guardrails', () => {
  it('keeps /curriculum as the roadmap owner rather than duplicating lesson-by-lesson course content', () => {
    const curriculum = read(curriculumPath);

    expect(curriculum).toContain('The complete Tiny Steps learning roadmap');
    expect(curriculum).toContain('Open the detailed course page for the exact lesson sequence');
    expect(curriculum).not.toContain('WeekAccordion');
    expect(curriculum).not.toContain('loadCurriculumOverrides');
    expect(curriculum).not.toContain('getCourseWeeksOverride');

    for (const coursePath of [
      '/courses/phonics-foundation',
      '/courses/phonics-brush-up',
      '/courses/phonics-advanced',
    ]) {
      expect(curriculum, coursePath).toContain(`path: '${coursePath}'`);
    }
  });

  it('makes the curriculum-versus-methodology distinction explicit for parents', () => {
    const curriculum = read(curriculumPath);

    expect(curriculum).toContain('How the roadmap becomes classroom teaching');
    expect(curriculum).toContain('Curriculum explains <strong>what</strong> children learn');
    expect(curriculum).toContain('Teaching methodology explains <strong>how</strong> a teacher models the skill');
    expect(curriculum).toContain('The sequence stays structured, but the pace is responsive.');
  });

  it('publishes a concrete five-step curriculum-to-classroom teaching method', () => {
    const curriculum = read(curriculumPath);

    for (const step of [
      'Assess the starting point',
      'Secure prerequisites',
      'Model the target skill',
      'Practise, correct, and retry',
      'Apply and reduce support',
    ]) {
      expect(curriculum).toContain(step);
    }

    expect(curriculum).toContain('specific feedback');
    expect(curriculum).toContain('gradually reduce prompts');
  });

  it('connects curriculum evidence to academic design, class samples, and the phonics program', () => {
    const curriculum = read(curriculumPath);

    for (const route of ['/team', '/class-samples', '/phonics']) {
      expect(curriculum, route).toContain(`to="${route}"`);
    }

    expect(curriculum).toContain('See the academic design and teacher-support system');
    expect(curriculum).toContain('Watch real class samples');
    expect(curriculum).toContain('Explore the Phonics & Reading program');
  });

  it('adds AEO answers about methodology without turning /curriculum into the detailed academic-design page', () => {
    const curriculum = read(curriculumPath);
    const teamSections = read(teamSectionsPath);

    expect(curriculum).toContain('What is the difference between curriculum and teaching methodology?');
    expect(curriculum).toContain('How does Tiny Steps turn the curriculum into a live lesson?');
    expect(curriculum).toContain('How is the roadmap taught in a live class?');

    expect(teamSections).toContain('How Tiny Steps designs learning');
    expect(teamSections).toContain('Built around how children actually learn');
    expect(teamSections).toContain('Review child-development and subject-pedagogy evidence');
    expect(teamSections).toContain('Observe the child during class');
    expect(curriculum).not.toContain('How Tiny Steps designs learning');
  });

  it('adds machine-readable teaching-method semantics while preserving the organization entity graph', () => {
    const curriculum = read(curriculumPath);

    expect(curriculum).toContain("'@id': `${curriculumCanonicalUrl}#teaching-method`");
    expect(curriculum).toContain("name: 'Tiny Steps curriculum-to-classroom teaching method'");
    expect(curriculum).toContain("'@type': 'ItemList'");
    expect(curriculum).toContain('itemListElement: teachingMethodSteps.map');
    expect(curriculum).toContain('createWebPageSchema({');
    expect(curriculum).toContain('assessment-led progression and child-responsive live teaching');
    expect(curriculum).not.toContain("'@type': 'HowTo'");
  });

  it('keeps evidence-informed language bounded and blocks unsupported authority claims', () => {
    const sources = [read(curriculumPath), read(teamSectionsPath)].join('\n');

    expect(sources).not.toMatch(
      /scientifically proven|clinically proven|psychology-backed|guaranteed results|guaranteed progress|CBSE-endorsed|IB-endorsed|Cambridge-endorsed/i,
    );
    expect(sources).not.toMatch(/learning styles?/i);
    expect(read(curriculumPath)).toContain('they are not accreditation claims');
  });
});
