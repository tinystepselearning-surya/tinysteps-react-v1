import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { FOUNDER_PUBLIC_PROFILE_URLS } from '../../lib/founderProfiles';
import { organizationSchema } from '../../lib/schemas';

const repoRoot = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
const EXPECTED_FOUNDER_LINKEDIN = 'https://www.linkedin.com/in/ravali-priya-vannala/';

describe('P1.2 founder Person sameAs', () => {
  it('publishes only the verified founder profile in Person sameAs on the canonical founder page', () => {
    expect(FOUNDER_PUBLIC_PROFILE_URLS).toEqual([EXPECTED_FOUNDER_LINKEDIN]);

    const founderPage = read('src/pages/FounderPriyaPage.tsx');
    expect(founderPage).toContain("import { FOUNDER_PUBLIC_PROFILES, FOUNDER_PUBLIC_PROFILE_URLS } from '../lib/founderProfiles';");
    expect(founderPage).toContain('sameAs: [...FOUNDER_PUBLIC_PROFILE_URLS]');
  });

  it('keeps the founder personal identity separate from organization sameAs', () => {
    expect(organizationSchema.sameAs).not.toContain(EXPECTED_FOUNDER_LINKEDIN);
    expect(organizationSchema.sameAs).toContain('https://www.linkedin.com/company/tiny-steps-learning/');
  });

  it('exposes the same verified founder profile as a crawlable link on the founder page', () => {
    const founderPage = read('src/pages/FounderPriyaPage.tsx');
    expect(founderPage).toContain('const primaryFounderProfile = FOUNDER_PUBLIC_PROFILES[0];');
    expect(founderPage).toContain('href={primaryFounderProfile.url}');
    expect(founderPage).toContain('Official founder profile on {primaryFounderProfile.platform}');
    expect(founderPage).toContain('target="_blank"');
    expect(founderPage).toContain('rel="noopener noreferrer"');
  });
});
