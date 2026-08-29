import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { OFFICIAL_PUBLIC_PROFILES, OFFICIAL_PUBLIC_PROFILE_URLS } from '../../lib/officialProfiles';
import {
  OFFSITE_CORROBORATION_PACK,
  ORGANIZATION_ID,
  PUBLIC_FACTS,
  SITE_ORIGIN,
  organizationSchema,
} from '../../lib/schemas';

const repoRoot = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

describe('B15 off-site entity corroboration guardrails', () => {
  it('keeps declared official profiles identical to organization sameAs', () => {
    expect(organizationSchema.sameAs).toEqual(OFFICIAL_PUBLIC_PROFILE_URLS);
    expect(new Set(OFFICIAL_PUBLIC_PROFILE_URLS).size).toBe(OFFICIAL_PUBLIC_PROFILE_URLS.length);

    for (const profile of OFFICIAL_PUBLIC_PROFILES) {
      expect(profile.url).toMatch(/^https:\/\//);
      expect(profile.url).not.toMatch(/[?&](?:utm_|fbclid|gclid)/i);
      expect(profile.platform).toMatch(/^(?:Facebook|Instagram|YouTube|LinkedIn)$/);
    }
  });

  it('keeps the off-site fact pack aligned with canonical site facts', () => {
    expect(ORGANIZATION_ID).toBe(`${SITE_ORIGIN}/#educational-organization`);
    expect(OFFSITE_CORROBORATION_PACK.canonicalFacts.brandName).toBe(PUBLIC_FACTS.brandName);
    expect(OFFSITE_CORROBORATION_PACK.canonicalFacts.website).toBe(PUBLIC_FACTS.primaryWebsite);
    expect(OFFSITE_CORROBORATION_PACK.canonicalFacts.corePrograms).toEqual([...PUBLIC_FACTS.corePrograms]);
    expect(OFFSITE_CORROBORATION_PACK.reviewRequestPositioningNote).toMatch(/honest reviews only/i);
    expect(OFFSITE_CORROBORATION_PACK.reviewRequestPositioningNote).toMatch(/never.*incentives/i);
  });

  it('exposes the declared profiles as crawlable links on the Team authority page', () => {
    const teamPage = read('src/pages/TeamPage.tsx');
    const profileSection = read('src/components/entity/OfficialProfilesSection.tsx');

    expect(teamPage).toContain("import { OfficialProfilesSection } from '../components/entity/OfficialProfilesSection';");
    expect(teamPage).toContain('<OfficialProfilesSection />');
    expect(profileSection).toContain('OFFICIAL_PUBLIC_PROFILES.map');
    expect(profileSection).toContain('href={profile.url}');
    expect(profileSection).toContain('target="_blank"');
    expect(profileSection).toContain('rel="noopener noreferrer"');
    expect(profileSection).toContain('Official Tiny Steps public profiles');
  });

  it('does not invent review, directory or accreditation profiles as sameAs identities', () => {
    const sameAs = organizationSchema.sameAs.join('\n').toLowerCase();
    for (const unsupportedIdentity of ['trustpilot', 'justdial', 'sulekha', 'cbse', 'cambridge', 'ibo.org']) {
      expect(sameAs).not.toContain(unsupportedIdentity);
    }
  });

  it('documents code-controlled versus manual off-site work', () => {
    const playbook = read('docs/seo/blog-bricks/B15_OFFSITE_ENTITY_CORROBORATION.md');
    expect(playbook).toContain('Code-controlled');
    expect(playbook).toContain('Manual external-profile work');
    expect(playbook).toContain('Do not create or claim a profile URL until the profile exists');
    expect(playbook).toContain('Tiny Steps Early Education');
    expect(playbook).toContain('https://tinystepslearning.com/#educational-organization');
  });
});
