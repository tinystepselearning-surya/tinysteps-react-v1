import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  FOUNDER_ID,
  FOUNDER_PROFILE_URL,
  ORGANIZATION_ID,
  PUBLIC_FACTS,
  SITE_ORIGIN,
  organizationSchema,
} from '../../lib/schemas';

const repoRoot = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

const productionTrustFiles = [
  'src/pages/TeamPage.tsx',
  'src/pages/team/TeamPageSections.tsx',
  'src/pages/CurriculumPage.tsx',
  'src/pages/ForSchoolsPage.tsx',
  'src/pages/phonics.tsx',
  'src/pages/grammar.tsx',
  'src/pages/speaking.tsx',
].map(read).join('\n');

describe('B14 trust, entity and schools authority guardrails', () => {
  it('publishes one canonical educational-organization identity', () => {
    expect(PUBLIC_FACTS.organizationName).toBe('Tiny Steps Early Education');
    expect(ORGANIZATION_ID).toBe('https://tinystepslearning.com/#educational-organization');
    expect(organizationSchema).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'EducationalOrganization',
      '@id': ORGANIZATION_ID,
      name: PUBLIC_FACTS.organizationName,
      url: `${SITE_ORIGIN}/`,
    });
    expect(organizationSchema.alternateName).toContain(PUBLIC_FACTS.brandName);

    const sourceFiles = fs
      .readdirSync(path.join(repoRoot, 'src'), { recursive: true, withFileTypes: true })
      .filter(
        (entry) =>
          entry.isFile() &&
          /\.(?:ts|tsx)$/.test(entry.name) &&
          !entry.parentPath.includes(`${path.sep}tests`),
      );
    for (const entry of sourceFiles) {
      const source = fs.readFileSync(path.join(entry.parentPath, entry.name), 'utf8');
      expect(source, path.join(entry.parentPath, entry.name)).not.toContain(
        'https://tinystepslearning.com/#organization',
      );
    }
  });

  it('connects the canonical founder person to the organization and dedicated founder profile', () => {
    expect(FOUNDER_ID).toBe('https://tinystepslearning.com/team/vannala-ravali-priya#person');
    expect(FOUNDER_PROFILE_URL).toBe('https://tinystepslearning.com/team/vannala-ravali-priya');
    expect(organizationSchema.founder).toMatchObject({
      '@type': 'Person',
      '@id': FOUNDER_ID,
      name: PUBLIC_FACTS.founder.fullName,
      url: FOUNDER_PROFILE_URL,
      mainEntityOfPage: { '@id': `${FOUNDER_PROFILE_URL}#webpage` },
      worksFor: { '@id': ORGANIZATION_ID },
    });

    const teamPage = read('src/pages/TeamPage.tsx');
    const founderPage = read('src/pages/FounderPriyaPage.tsx');
    const sections = read('src/pages/team/TeamPageSections.tsx');
    expect(teamPage).toContain('url: FOUNDER_PROFILE_URL');
    expect(teamPage).toContain("mainEntityOfPage: { '@id': `${FOUNDER_PROFILE_URL}#webpage` }");
    expect(founderPage).toContain("'@type': 'ProfilePage'");
    expect(founderPage).toContain("mainEntity: {\n    '@id': FOUNDER_ID");
    expect(sections).toContain('id="founder"');
    expect(sections).toContain('{PUBLIC_FACTS.founder.fullName}');
  });

  it('makes /team the primary academic-design authority page', () => {
    const page = read('src/pages/TeamPage.tsx');
    const sections = read('src/pages/team/TeamPageSections.tsx');
    expect(page).toContain('ResearchToClassroomSection');
    expect(sections).toContain('Built around how children actually learn');
    for (const concept of [
      'Child development',
      'Learning science',
      'Early-literacy pedagogy',
      'recurring learner difficulties',
      'Map the skill and its prerequisites',
      'Observe the child during class',
      'Reduce teacher support gradually',
    ]) {
      expect(sections).toContain(concept);
    }
  });

  it('keeps /curriculum concise and preserves roadmap ownership', () => {
    const curriculum = read('src/pages/CurriculumPage.tsx');
    expect(curriculum).toContain('The complete Tiny Steps learning roadmap');
    expect(curriculum).toContain('built around prerequisites, structured progression, learner observation');
    expect(curriculum).toContain('adapting modelling, prompts, repetition, practice time and pace');
    expect(curriculum.match(/How Tiny Steps designs learning/g) ?? []).toHaveLength(0);
  });

  it('gives the three program owners course-specific responsive-delivery sections', () => {
    const component = read('src/components/programs/ResponsiveTeachingSection.tsx');
    expect(component).toContain('How teachers deliver this course');
    expect(component).toContain('data-program-delivery');

    const expectations = [
      ['src/pages/phonics.tsx', 'program="Phonics"', 'sound–spelling accuracy'],
      ['src/pages/grammar.tsx', 'program="Grammar"', 'self-corrects'],
      ['src/pages/speaking.tsx', 'program="Public Speaking"', 'idea organisation'],
    ] as const;
    for (const [file, program, evidence] of expectations) {
      const page = read(file);
      expect(page).toContain('<ResponsiveTeachingSection');
      expect(page).toContain(program);
      expect(page).toContain(evidence);
    }
  });

  it('defines the school offer as a teaching and implementation system', () => {
    const schools = read('src/pages/ForSchoolsPage.tsx');
    expect(schools).toContain('How academic design becomes classroom practice');
    expect(schools).toContain('Model → guided practice → observe → correct → retry → reduce support');
    expect(schools).toContain('Structured curriculum. Responsive teaching.');
    expect(schools).toContain('Prerequisite practice when required');
    expect(schools).toContain('const schoolImplementationValue = [');
    expect(schools).toContain('citation: [ncfUrl, cbseHpcUrl, dfePhonicsUrl]');
    expect(schools).toContain("'@id': ORGANIZATION_ID");
    expect(schools).toContain('independent education provider');
    expect(schools).toMatch(/does not imply endorsement,[\s\S]*approval,[\s\S]*certification or affiliation/);
  });

  it('blocks unsupported credentials, affiliations and outcome promises', () => {
    expect(productionTrustFiles).not.toMatch(
      /psychology-backed|scientifically proven|clinically proven|learning styles?|guaranteed (?:academic )?results?|CBSE-endorsed Tiny Steps|IB-endorsed Tiny Steps|Cambridge-endorsed Tiny Steps/i,
    );
    expect(read('src/pages/ForSchoolsPage.tsx')).not.toMatch(
      /support continued enrolment|reputation and referrals|positive recommendations within the school community/i,
    );
    expect([
      read('src/pages/TeamPage.tsx'),
      read('src/pages/team/TeamPageSections.tsx'),
      read('src/pages/team/teamPageContent.ts'),
    ].join('\n')).not.toMatch(/\b(?:CELTA|TESOL|TEFL|IB certified|Cambridge certified|certified expert)\b/i);
  });

  it('contains no temporary B14 patch or self-modifying workflow machinery', () => {
    for (const temporaryPath of [
      '.github/workflows/b14-build-validation.yml',
      'scripts/b14-academic-design-patch.py',
      'scripts/b14-trust-entity-schools-patch.py',
    ]) {
      expect(fs.existsSync(path.join(repoRoot, temporaryPath)), temporaryPath).toBe(false);
    }
  });
});