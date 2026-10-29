import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { FOUNDER_PUBLIC_PROFILES, FOUNDER_PUBLIC_PROFILE_URLS } from '../../lib/founderProfiles';
import { PUBLIC_FACTS } from '../../lib/schemas';

const repoRoot = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

const EXPECTED_FOUNDER_LINKEDIN = 'https://www.linkedin.com/in/ravali-priya-vannala/';
const EXPECTED_FOUNDER_INSTAGRAM = 'https://www.instagram.com/vannala_ravalipriya/';

describe('P1.1 founder entity corroboration', () => {
  it('keeps distinct owner-confirmed founder social URLs', () => {
    expect(FOUNDER_PUBLIC_PROFILE_URLS).toEqual([EXPECTED_FOUNDER_LINKEDIN, EXPECTED_FOUNDER_INSTAGRAM]);
    expect(new Set(FOUNDER_PUBLIC_PROFILE_URLS).size).toBe(FOUNDER_PUBLIC_PROFILE_URLS.length);

    for (const profile of FOUNDER_PUBLIC_PROFILES) {
      expect(['LinkedIn', 'Instagram']).toContain(profile.platform);
      if (profile.platform === 'LinkedIn') {
        expect(profile.url).toMatch(/^https:\/\/www\.linkedin\.com\/in\//);
      } else {
        expect(profile.url).toMatch(/^https:\/\/www\.instagram\.com\//);
      }
      expect(profile.url).not.toMatch(/[?&](?:utm_|trk|viewAsMember|fbclid|gclid)/i);
      expect(profile.purpose).toContain(PUBLIC_FACTS.founder.fullName);
      expect(profile.purpose).toContain(PUBLIC_FACTS.brandName);
    }
  });

  it('keeps person-level founder profiles separate from organization sameAs', () => {
    const organizationSameAs = read('src/lib/schemas.ts');
    expect(organizationSameAs).not.toContain(EXPECTED_FOUNDER_LINKEDIN);
    expect(organizationSameAs).not.toContain(EXPECTED_FOUNDER_INSTAGRAM);
  });

  it('publishes the founder profile as a crawlable link on the Team authority surface', () => {
    const section = read('src/components/entity/OfficialProfilesSection.tsx');

    expect(section).toContain("import { FOUNDER_PUBLIC_PROFILES } from '../../lib/founderProfiles';");
    expect(section).toContain('FOUNDER_PUBLIC_PROFILES.map');
    expect(section).toContain('href={profile.url}');
    expect(section).toContain('target="_blank"');
    expect(section).toContain('rel="noopener noreferrer"');
    expect(section).toContain('Founder identity');
    expect(section).toContain('PUBLIC_FACTS.founder.fullName');
  });

  it('uses the public brand on the human-visible official identity heading', () => {
    const section = read('src/components/entity/OfficialProfilesSection.tsx');
    expect(section).toContain('Find {PUBLIC_FACTS.brandName} online');
    expect(section).not.toContain('Find {PUBLIC_FACTS.organizationName} online');
  });
});
