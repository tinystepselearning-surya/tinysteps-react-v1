import { SEMANTIC_FACTS } from '../config/semanticFacts';
import {
  FOUNDER_ID,
  FOUNDER_PROFILE_PATH,
  ORGANIZATION_ID,
  SITE_ORIGIN,
  organizationSchema,
} from './schemas';
import {
  OFFICIAL_PUBLIC_PROFILES,
  ORGANIZATION_SAME_AS_PROFILE_URLS,
} from './officialProfiles';
import {
  FOUNDER_PUBLIC_PROFILES,
  FOUNDER_PUBLIC_PROFILE_URLS,
} from './founderProfiles';

export const SPEAKING_ENTITY_AUTHORITY_REVISION = '2026-09-19-b11-v2';

const freeze = <T extends object>(value: T): Readonly<T> => Object.freeze(value);
const freezeList = <T>(values: readonly T[]): readonly T[] => Object.freeze([...values]);

export const SPEAKING_ENTITY_AUTHORITY = freeze({
  commercialOwnerPath: SEMANTIC_FACTS.programmes.speaking.commercialPath,
  programmeLabel: SEMANTIC_FACTS.programmes.speaking.label,
  programmeClaim: SEMANTIC_FACTS.programmes.speaking.claim,
  organization: freeze({
    id: ORGANIZATION_ID,
    publicBrand: SEMANTIC_FACTS.brand.name,
    organizationName: SEMANTIC_FACTS.brand.organizationName,
    website: SITE_ORIGIN,
    sameAs: freezeList(ORGANIZATION_SAME_AS_PROFILE_URLS),
  }),
  founder: freeze({
    id: FOUNDER_ID,
    profilePath: FOUNDER_PROFILE_PATH,
    fullName: SEMANTIC_FACTS.founder.fullName,
    title: SEMANTIC_FACTS.founder.title,
    sameAs: freezeList(FOUNDER_PUBLIC_PROFILE_URLS),
  }),
  serviceContext: freeze({
    audience: SEMANTIC_FACTS.audience.coreLabel,
    deliveryMode: SEMANTIC_FACTS.delivery.mode,
    primaryCountry: SEMANTIC_FACTS.serviceArea.primaryCountry,
    onlineReach: SEMANTIC_FACTS.serviceArea.onlineReach,
    coreProgrammes: freezeList(SEMANTIC_FACTS.programmes.coreLabels),
  }),
});

export const SPEAKING_ENTITY_DISAMBIGUATION_KEYS = freezeList([
  SEMANTIC_FACTS.brand.websiteOrigin,
  SEMANTIC_FACTS.founder.fullName,
  SEMANTIC_FACTS.founder.profilePath,
  `${SEMANTIC_FACTS.serviceArea.city}, ${SEMANTIC_FACTS.serviceArea.region}, ${SEMANTIC_FACTS.serviceArea.primaryCountry}`,
  SEMANTIC_FACTS.delivery.mode,
  SEMANTIC_FACTS.programmes.speaking.label,
]);

export const SPEAKING_EXTERNAL_AUTHORITY_RULES = freeze({
  externalNameMatchAloneIsSufficient: false,
  createNewSocialProfileForSeoOnly: false,
  addUnverifiedDirectoryToSameAs: false,
  addReviewPlatformToSameAsWithoutVerifiedIdentity: false,
  addAccreditationOrBoardToSameAsWithoutVerifiedRelationship: false,
  mergeFounderAndOrganizationSameAs: false,
  publishAdminOrAccountManagementUrls: false,
  externalProfileFactsMustMatchCanonicalRegistry: true,
  externalClaimsMayExceedFirstPartyEvidence: false,
});

export const SPEAKING_EXTERNAL_PROFILE_ALIGNMENT = freezeList([
  'Tiny Steps Learning as the public-facing brand',
  'https://tinystepslearning.com/ as the primary website',
  'live online English learning for children aged 3–12 as the service context',
  'Phonics, Grammar and Public Speaking as the core programme set',
  'Vannala Ravali Priya as Founder where founder information is supported',
]);

export const SPEAKING_OFFICIAL_PROFILE_URLS = freezeList(
  OFFICIAL_PUBLIC_PROFILES.map((profile) => profile.url),
);

if (SPEAKING_ENTITY_AUTHORITY.commercialOwnerPath !== '/speaking') {
  throw new Error('Brick 11 requires /speaking to remain the canonical Public Speaking commercial owner.');
}

if (!SPEAKING_ENTITY_AUTHORITY.serviceContext.coreProgrammes.includes('Public Speaking')) {
  throw new Error('Brick 11 requires Public Speaking to remain in the canonical Tiny Steps core programme set.');
}

if (organizationSchema['@id'] !== ORGANIZATION_ID) {
  throw new Error('Brick 11 organization identity must reuse the canonical EducationalOrganization ID.');
}

if (
  JSON.stringify(organizationSchema.sameAs)
  !== JSON.stringify(ORGANIZATION_SAME_AS_PROFILE_URLS)
) {
  throw new Error('Brick 11 organization sameAs must remain aligned with the verified organization profile contract.');
}

for (const founderProfileUrl of FOUNDER_PUBLIC_PROFILE_URLS) {
  if (SPEAKING_ENTITY_AUTHORITY.organization.sameAs.includes(founderProfileUrl)) {
    throw new Error('Brick 11 must keep founder Person identities separate from EducationalOrganization sameAs.');
  }
}

if (
  new Set(SPEAKING_ENTITY_AUTHORITY.organization.sameAs).size
  !== SPEAKING_ENTITY_AUTHORITY.organization.sameAs.length
) {
  throw new Error('Brick 11 organization sameAs URLs must remain unique.');
}

if (
  new Set(SPEAKING_OFFICIAL_PROFILE_URLS).size
  !== SPEAKING_OFFICIAL_PROFILE_URLS.length
) {
  throw new Error('Brick 11 official public profile URLs must remain unique.');
}

if (!FOUNDER_PUBLIC_PROFILES.length || !FOUNDER_PUBLIC_PROFILE_URLS.length) {
  throw new Error('Brick 11 requires at least one verified founder public profile.');
}

if (new Set(FOUNDER_PUBLIC_PROFILE_URLS).size !== FOUNDER_PUBLIC_PROFILE_URLS.length) {
  throw new Error('Brick 11 founder public profile URLs must remain unique.');
}

if (SPEAKING_ENTITY_DISAMBIGUATION_KEYS.length < 6) {
  throw new Error('Brick 11 requires multiple independent entity-disambiguation signals.');
}

const unsupportedSameAsMarkers = [
  'trustpilot',
  'justdial',
  'sulekha',
  'cbse',
  'cambridge',
  'ibo.org',
  '/admin/',
  'viewAsMember=true',
];

for (const url of SPEAKING_ENTITY_AUTHORITY.organization.sameAs) {
  if (unsupportedSameAsMarkers.some((marker) => url.toLowerCase().includes(marker.toLowerCase()))) {
    throw new Error(`Brick 11 organization sameAs contains an unsupported authority identity: ${url}`);
  }
}
