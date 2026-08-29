import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { FOUNDER_ID, ORGANIZATION_ID, PUBLIC_FACTS } from '../../lib/schemas';

const repoRoot = process.cwd();
const readRepoFile = (relativePath: string) =>
  fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

describe('B14 trust, entity authority and schools guardrails', () => {
  it('keeps the canonical founder identity aligned with the visible Team founder section', () => {
    expect(PUBLIC_FACTS.founder.fullName).toBe('Vannala Ravali Priya');
    expect(PUBLIC_FACTS.founder.displayName).toBe('Priya');
    expect(FOUNDER_ID).toBe('https://tinystepslearning.com/#founder');

    const teamPage = readRepoFile('src/pages/TeamPage.tsx');
    const teamSections = readRepoFile('src/pages/team/TeamPageSections.tsx');

    expect(teamPage).toContain("url: `${SITE_ORIGIN}/team#founder`");
    expect(teamPage).toContain("mainEntityOfPage: { '@id': `${SITE_ORIGIN}/team#webpage` }");
    expect(teamSections).toContain('id="founder"');
    expect(teamSections).toContain('{PUBLIC_FACTS.founder.fullName}');
    expect(teamSections).toContain('known to families as {PUBLIC_FACTS.founder.displayName}');
  });

  it('does not manufacture founder or teacher credentials', () => {
    const files = [
      readRepoFile('src/pages/TeamPage.tsx'),
      readRepoFile('src/pages/team/TeamPageSections.tsx'),
      readRepoFile('src/pages/team/teamPageContent.ts'),
    ].join('\n');

    expect(files).not.toMatch(/\b(?:CELTA|TESOL|TEFL|IB certified|Cambridge certified|certified expert|licensed specialist)\b/i);
  });

  it('keeps the school service tied to the canonical organisation and a distinct school audience', () => {
    expect(ORGANIZATION_ID).toBe('https://tinystepslearning.com/#organization');

    const schools = readRepoFile('src/pages/ForSchoolsPage.tsx');
    expect(schools).toContain("import { ORGANIZATION_ID } from '../lib/schemas';");
    expect(schools).toContain("'@id': ORGANIZATION_ID");
    expect(schools).toContain("educationalRole: 'school and early-years education provider'");
    expect(schools).toContain("{ '@type': 'Country', name: 'India' }");
    expect(schools).toContain("{ '@type': 'Place', name: 'Worldwide' }");
  });

  it('keeps framework evidence explicit while preserving the independent-provider boundary', () => {
    const schools = readRepoFile('src/pages/ForSchoolsPage.tsx');

    expect(schools).toContain('citation: [ncfUrl, cbseHpcUrl, dfePhonicsUrl]');
    expect(schools).toContain('Tiny Steps Learning is an independent education provider.');
    expect(schools).toMatch(/does not imply endorsement,[\s\S]*approval,[\s\S]*certification or affiliation/);
    expect(schools).toContain("question: 'Is Tiny Steps an officially CBSE-endorsed or government-approved phonics programme?'");
  });

  it('replaces enrolment and referral promises with operational school value', () => {
    const schools = readRepoFile('src/pages/ForSchoolsPage.tsx');

    expect(schools).toContain('const schoolImplementationValue = [');
    expect(schools).toContain("title: 'Parent communication'");
    expect(schools).toContain("title: 'Implementation consistency'");
    expect(schools).toContain("title: 'Teacher readiness'");
    expect(schools).toContain("title: 'Leadership visibility'");
    expect(schools).not.toContain("title: 'Continued enrolment'");
    expect(schools).not.toContain("title: 'Reputation and referrals'");
    expect(schools).not.toContain('enrollmentBusinessOutcomes');
    expect(schools).toContain("question: 'How can schools communicate reading progress clearly to families?'");
  });

  it('preserves B13 canonical authority routes and creates no B14 public route', () => {
    const routeSeo = readRepoFile('src/lib/routeSeoRegistry.js');
    const schools = readRepoFile('src/pages/ForSchoolsPage.tsx');
    const team = readRepoFile('src/pages/TeamPage.tsx');

    expect(routeSeo).toContain("'/curriculum'");
    expect(routeSeo).toContain("canonicalPath: '/curriculum'");
    expect(schools).toContain("const canonicalUrl = 'https://tinystepslearning.com/for-schools';");
    expect(team).toContain("const teamCanonicalPath = teamSeo?.canonicalPath ?? '/team';");

    const audit = readRepoFile('docs/seo/blog-bricks/B14_TRUST_ENTITY_SCHOOLS_AUDIT.md');
    expect(audit).toContain('must not:\n\n- create a new public URL');
    expect(audit).toContain('does **not** hard-code a Trustpilot score');
  });
});
