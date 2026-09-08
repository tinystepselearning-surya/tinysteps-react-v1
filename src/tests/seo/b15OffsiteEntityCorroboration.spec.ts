import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  OFFICIAL_ORGANIZATION_PROFILE_URLS,
  ORGANIZATION_SAME_AS_URLS,
  SEMANTIC_FACTS,
} from '../../config/semanticFacts';
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

const PINTEREST_PROFILE_URL = 'https://www.pinterest.com/tinystepselearning/';
const QUORA_PROFILE_URL = 'https://www.quora.com/profile/Tiny-Steps-Learning';

describe('B15 off-site entity corroboration guardrails', () => {
  it('derives every official organization profile from the semantic registry', () => {
    expect(OFFICIAL_PUBLIC_PROFILE_URLS).toEqual(OFFICIAL_ORGANIZATION_PROFILE_URLS);
    expect(OFFICIAL_PUBLIC_PROFILE_URLS).toEqual(
      SEMANTIC_FACTS.organizationProfiles.map((profile) => profile.url),
    );
    expect(new Set(OFFICIAL_PUBLIC_PROFILE_URLS).size).toBe(OFFICIAL_PUBLIC_PROFILE_URLS.length);

    const profileContract = read('src/lib/officialProfiles.ts');
    expect(profileContract).toContain("SEMANTIC_FACTS.organizationProfiles");
    expect(profileContract).not.toMatch(/url:\s*['"]https:\/\//);

    for (const profile of OFFICIAL_PUBLIC_PROFILES) {
      expect(profile.url).toMatch(/^https:\/\//);
      expect(profile.url).not.toMatch(/[?&](?:utm_|fbclid|gclid)/i);
      expect(profile.platform).toMatch(/^(?:Facebook|Instagram|YouTube|LinkedIn|Pinterest|Quora)$/);
    }
  });

  it('keeps Organization sameAs explicit and distinct from all official profiles', () => {
    expect(organizationSchema.sameAs).toEqual(ORGANIZATION_SAME_AS_URLS);
    expect(organizationSchema.sameAs).toContain(QUORA_PROFILE_URL);
    expect(organizationSchema.sameAs).not.toContain(PINTEREST_PROFILE_URL);
    expect(OFFICIAL_PUBLIC_PROFILE_URLS).toContain(PINTEREST_PROFILE_URL);
    expect(OFFICIAL_PUBLIC_PROFILE_URLS).toContain(QUORA_PROFILE_URL);
  });

  it('keeps the verified Pinterest identity on one clean canonical public URL', () => {
    const pinterest = SEMANTIC_FACTS.organizationProfiles.find(
      (profile) => profile.platform === 'Pinterest',
    );
    const pinterestCompatibilityModule = read('src/lib/pinterestProfile.ts');

    expect(pinterest?.url).toBe(PINTEREST_PROFILE_URL);
    expect(pinterest?.includeInOrganizationSameAs).toBe(false);
    expect(PINTEREST_PROFILE_URL).not.toContain('actingBusinessId');
    expect(PINTEREST_PROFILE_URL).not.toMatch(/[?&](?:utm_|fbclid|gclid)/i);
    expect(PINTEREST_PROFILE_URL).not.toContain('in.pinterest.com');
    expect(pinterestCompatibilityModule).toContain('SEMANTIC_FACTS.organizationProfiles.find');
    expect(pinterestCompatibilityModule).not.toContain(PINTEREST_PROFILE_URL);
  });

  it('uses public organization identities rather than admin or account-management URLs', () => {
    const sameAs = organizationSchema.sameAs.join('\n');
    expect(sameAs).not.toContain('facebook.com/tinystepslearning');
    expect(sameAs).not.toContain('61585755667285');
    expect(sameAs).not.toContain('/admin/');
    expect(sameAs).not.toContain('viewAsMember=true');
  });

  it('keeps the footer on canonical public-profile contracts without direct social URLs', () => {
    const footer = read('src/components/common/Footer.tsx');
    expect(footer).toContain('OFFICIAL_PUBLIC_PROFILES');
    expect(footer).toContain("profile.platform !== 'Quora'");
    expect(footer).not.toContain('PINTEREST_PROFILE');
    expect(footer).not.toContain(PINTEREST_PROFILE_URL);
    expect(footer).not.toMatch(/href:\s*['"]https:\/\/(?:www\.)?(?:facebook|instagram|youtube|linkedin|pinterest|quora)\.com/i);
  });

  it('keeps the off-site fact pack aligned with canonical site facts', () => {
    expect(ORGANIZATION_ID).toBe(`${SITE_ORIGIN}/#educational-organization`);
    expect(OFFSITE_CORROBORATION_PACK.canonicalFacts.brandName).toBe(PUBLIC_FACTS.brandName);
    expect(OFFSITE_CORROBORATION_PACK.canonicalFacts.website).toBe(PUBLIC_FACTS.primaryWebsite);
    expect(OFFSITE_CORROBORATION_PACK.canonicalFacts.corePrograms).toEqual([...PUBLIC_FACTS.corePrograms]);
    expect(OFFSITE_CORROBORATION_PACK.reviewRequestPositioningNote).toMatch(/honest reviews only/i);
    expect(OFFSITE_CORROBORATION_PACK.reviewRequestPositioningNote).toMatch(/never.*incentives/i);
  });

  it('exposes all official organization profiles as crawlable Team authority links', () => {
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
