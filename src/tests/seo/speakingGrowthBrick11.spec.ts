import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ORGANIZATION_SAME_AS_URLS,
  SEMANTIC_FACTS,
} from '../../config/semanticFacts';
import {
  FOUNDER_ID,
  FOUNDER_PROFILE_PATH,
  ORGANIZATION_ID,
  createWebPageSchema,
  organizationSchema,
} from '../../lib/schemas';
import {
  FOUNDER_PUBLIC_PROFILE_URLS,
} from '../../lib/founderProfiles';
import {
  OFFICIAL_PUBLIC_PROFILE_URLS,
  ORGANIZATION_SAME_AS_PROFILE_URLS,
} from '../../lib/officialProfiles';
import {
  SPEAKING_ENTITY_AUTHORITY,
  SPEAKING_ENTITY_AUTHORITY_REVISION,
  SPEAKING_EXTERNAL_AUTHORITY_RULES,
  SPEAKING_EXTERNAL_PROFILE_ALIGNMENT,
  SPEAKING_OFFICIAL_PROFILE_URLS,
} from '../../lib/speakingEntityAuthority';

const root = process.cwd();
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');

const speakingSource = read('src/pages/speaking.tsx');
const teamSource = read('src/pages/TeamPage.tsx');
const officialProfilesSection = read('src/components/entity/OfficialProfilesSection.tsx');
const founderPageSource = read('src/pages/FounderPriyaPage.tsx');
const routeManifestSource = read('src/lib/publicRouteManifest.js');
const routesSource = read('src/app/routes.tsx');

describe('Speaking growth Brick 11 entity and external authority', () => {
  it('binds Speaking to the existing canonical organization and founder identities', () => {
    expect(SPEAKING_ENTITY_AUTHORITY_REVISION).toBe('2026-09-19-b11-v1');
    expect(SPEAKING_ENTITY_AUTHORITY.commercialOwnerPath).toBe('/speaking');
    expect(SPEAKING_ENTITY_AUTHORITY.programmeLabel).toBe(
      SEMANTIC_FACTS.programmes.speaking.label,
    );
    expect(SPEAKING_ENTITY_AUTHORITY.organization.id).toBe(ORGANIZATION_ID);
    expect(SPEAKING_ENTITY_AUTHORITY.founder.id).toBe(FOUNDER_ID);
    expect(SPEAKING_ENTITY_AUTHORITY.founder.profilePath).toBe(FOUNDER_PROFILE_PATH);
    expect(SPEAKING_ENTITY_AUTHORITY.serviceContext.coreProgrammes).toContain('Public Speaking');
  });

  it('keeps organization sameAs aligned with verified organization profiles', () => {
    expect(SPEAKING_ENTITY_AUTHORITY.organization.sameAs).toEqual(
      ORGANIZATION_SAME_AS_PROFILE_URLS,
    );
    expect(organizationSchema.sameAs).toEqual(ORGANIZATION_SAME_AS_URLS);
    expect(organizationSchema.sameAs).toEqual(ORGANIZATION_SAME_AS_PROFILE_URLS);
    expect(new Set(organizationSchema.sameAs).size).toBe(organizationSchema.sameAs.length);
  });

  it('keeps founder Person identities separate from organization sameAs', () => {
    expect(SPEAKING_ENTITY_AUTHORITY.founder.sameAs).toEqual(FOUNDER_PUBLIC_PROFILE_URLS);
    expect(FOUNDER_PUBLIC_PROFILE_URLS).toHaveLength(1);
    for (const founderUrl of FOUNDER_PUBLIC_PROFILE_URLS) {
      expect(organizationSchema.sameAs).not.toContain(founderUrl);
    }
    expect(founderPageSource).toContain('sameAs: [...FOUNDER_PUBLIC_PROFILE_URLS]');
    expect(founderPageSource).toContain('worksFor: {');
    expect(founderPageSource).toContain("'@id': ORGANIZATION_ID");
  });

  it('derives the Speaking external-authority inventory from existing official profile contracts', () => {
    expect(SPEAKING_OFFICIAL_PROFILE_URLS).toEqual(OFFICIAL_PUBLIC_PROFILE_URLS);
    expect(new Set(SPEAKING_OFFICIAL_PROFILE_URLS).size).toBe(
      SPEAKING_OFFICIAL_PROFILE_URLS.length,
    );
    expect(SPEAKING_EXTERNAL_PROFILE_ALIGNMENT).toContain(
      'Phonics, Grammar and Public Speaking as the core programme set',
    );
  });

  it('keeps external-authority expansion conservative', () => {
    expect(SPEAKING_EXTERNAL_AUTHORITY_RULES).toEqual({
      createNewSocialProfileForSeoOnly: false,
      addUnverifiedDirectoryToSameAs: false,
      addReviewPlatformToSameAsWithoutVerifiedIdentity: false,
      addAccreditationOrBoardToSameAsWithoutVerifiedRelationship: false,
      mergeFounderAndOrganizationSameAs: false,
      publishAdminOrAccountManagementUrls: false,
      externalProfileFactsMustMatchCanonicalRegistry: true,
      externalClaimsMayExceedFirstPartyEvidence: false,
    });

    const sameAs = organizationSchema.sameAs.join('\n').toLowerCase();
    for (const unsupported of ['trustpilot', 'justdial', 'sulekha', 'cbse', 'cambridge', 'ibo.org']) {
      expect(sameAs).not.toContain(unsupported);
    }
  });

  it('keeps official organization and founder profiles crawlable on the existing authority surface', () => {
    expect(teamSource).toContain(
      "import { OfficialProfilesSection } from '../components/entity/OfficialProfilesSection';",
    );
    expect(teamSource).toContain('<OfficialProfilesSection />');
    expect(officialProfilesSection).toContain('OFFICIAL_PUBLIC_PROFILES.map');
    expect(officialProfilesSection).toContain('FOUNDER_PUBLIC_PROFILES.map');
    expect(officialProfilesSection).toContain('href={profile.url}');
    expect(officialProfilesSection).toContain('rel="noopener noreferrer"');
  });

  it('keeps /speaking connected to the canonical organization through shared WebPage schema', () => {
    expect(speakingSource).toContain('createWebPageSchema');
    const schema = createWebPageSchema({
      name: 'Public Speaking & Communication',
      url: 'https://tinystepslearning.com/speaking',
    });
    expect(schema.publisher).toEqual({ '@id': ORGANIZATION_ID });
    expect(schema.about).toEqual({ '@id': ORGANIZATION_ID });
  });

  it('does not create another entity, founder, social-profile, or Speaking authority route', () => {
    for (const forbidden of [
      'speaking-authority',
      'speaking-entity',
      'public-speaking-experts',
      'speaking-founder',
      'speaking-social-profiles',
    ]) {
      expect(routesSource).not.toContain(forbidden);
      expect(routeManifestSource).not.toContain(forbidden);
    }
  });

  it('keeps the public-brand, delivery and audience facts aligned with the central registry', () => {
    expect(SPEAKING_ENTITY_AUTHORITY.organization.publicBrand).toBe('Tiny Steps Learning');
    expect(SPEAKING_ENTITY_AUTHORITY.serviceContext.audience).toBe('children aged 3–12');
    expect(SPEAKING_ENTITY_AUTHORITY.serviceContext.deliveryMode).toBe('live online classes');
    expect(SPEAKING_ENTITY_AUTHORITY.serviceContext.primaryCountry).toBe('India');
  });
});
