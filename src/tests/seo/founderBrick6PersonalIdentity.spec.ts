import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  FOUNDER_ID,
  FOUNDER_LINKEDIN_URL,
  FOUNDER_SAME_AS,
  organizationSchema,
} from '../../lib/schemas';

const repoRoot = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

const companyLinkedIn = 'https://www.linkedin.com/company/tiny-steps-learning/';

describe('Founder Brick 6 personal identity corroboration', () => {
  it('centralizes the founder personal LinkedIn identity', () => {
    expect(FOUNDER_ID).toBe('https://tinystepslearning.com/team/vannala-ravali-priya#person');
    expect(FOUNDER_LINKEDIN_URL).toBe('https://www.linkedin.com/in/ravali-priya-vannala-2b4b67249/');
    expect([...FOUNDER_SAME_AS]).toEqual([FOUNDER_LINKEDIN_URL]);
  });

  it('publishes personal sameAs on the canonical founder Person node', () => {
    const founderPage = read('src/pages/FounderPriyaPage.tsx');
    expect(founderPage).toContain('sameAs: [...FOUNDER_SAME_AS]');
    expect(founderPage).toContain('FOUNDER_LINKEDIN_URL');
  });

  it('keeps Team Person references aligned to the same personal identity', () => {
    const teamPage = read('src/pages/TeamPage.tsx');
    expect(teamPage).toContain('sameAs: [...FOUNDER_SAME_AS]');
  });

  it('keeps personal and organization LinkedIn identities separate', () => {
    expect(organizationSchema.sameAs).toContain(companyLinkedIn);
    expect(organizationSchema.sameAs).not.toContain(FOUNDER_LINKEDIN_URL);
    expect(organizationSchema.founder['@id']).toBe(FOUNDER_ID);
    expect(organizationSchema.founder.sameAs).toEqual([FOUNDER_LINKEDIN_URL]);
  });

  it('publishes a visible rel=me identity link on the founder page', () => {
    const founderPage = read('src/pages/FounderPriyaPage.tsx');
    expect(founderPage).toContain('href={FOUNDER_LINKEDIN_URL}');
    expect(founderPage).toContain('rel="me noopener noreferrer"');
    expect(founderPage).toContain('Vannala Ravali Priya on LinkedIn');
    expect(founderPage).toContain('separate from the Tiny Steps Learning company');
  });
});
