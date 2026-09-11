import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  OFFICIAL_ORGANIZATION_PROFILE_URLS,
  ORGANIZATION_SAME_AS_URLS,
  SEMANTIC_FACTS,
  SEMANTIC_FACTS_VERSION,
} from '../../config/semanticFacts';
import { PUBLIC_SITE_FACTS } from '../../config/publicFacts';
import {
  FREE_DEMO_DURATION_MINUTES,
  FREE_DEMO_PRICE,
  FREE_DEMO_SESSION_COUNT,
  STANDARD_ONE_TO_ONE_PER_CLASS_PRICE,
} from '../../config/publicOffer';
import {
  PUBLIC_CONTACT_EMAIL,
  PUBLIC_CONTACT_TELEPHONE,
  PUBLIC_WHATSAPP_NUMBER,
} from '../../constants/publicContact';
import { catalogs } from '../../content/courses';
import { PHONICS_COURSES } from '../../content/phonicsCurriculum';
import { FOUNDER_PUBLIC_PROFILES } from '../../lib/founderProfiles';
import { OFFICIAL_PUBLIC_PROFILES } from '../../lib/officialProfiles';
import { PUBLIC_FACTS, organizationSchema } from '../../lib/schemas';

const repoRoot = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

const catalogBySlug = new Map(catalogs.map((course) => [course.slug, course]));

describe('Resources R1 semantic facts registry', () => {
  it('freezes the canonical brand, founder, audience, delivery, pricing and contact facts', () => {
    expect(SEMANTIC_FACTS_VERSION).toBe('2026-09-12-r1');
    expect(SEMANTIC_FACTS.brand.name).toBe('Tiny Steps Learning');
    expect(SEMANTIC_FACTS.founder.fullName).toBe('Vannala Ravali Priya');
    expect(SEMANTIC_FACTS.audience.coreAgeMin).toBe(3);
    expect(SEMANTIC_FACTS.audience.coreAgeMax).toBe(12);
    expect(SEMANTIC_FACTS.delivery.standardOneToOne.durationMinutes).toBe(35);
    expect(SEMANTIC_FACTS.delivery.assessment.durationMinutes).toBe(35);
    expect(SEMANTIC_FACTS.delivery.assessment.sessionCount).toBe(1);
    expect(SEMANTIC_FACTS.delivery.assessment.priceInr).toBe(0);
    expect(SEMANTIC_FACTS.pricing.standardOneToOnePerClassInr).toBe(400);
    expect(SEMANTIC_FACTS.contact.email).toBe('RavaliPriyaVannala@tinystepslearning.com');
    expect(SEMANTIC_FACTS.contact.whatsappNumber).toBe('919618398383');
    expect(SEMANTIC_FACTS.serviceArea.primaryCountry).toBe('India');
    expect(SEMANTIC_FACTS.delivery.mode).toBe('live online classes');
  });

  it('keeps public compatibility facades derived from the registry', () => {
    expect(PUBLIC_SITE_FACTS.brandName).toBe(SEMANTIC_FACTS.brand.name);
    expect(PUBLIC_SITE_FACTS.audience.ageMin).toBe(SEMANTIC_FACTS.audience.coreAgeMin);
    expect(PUBLIC_SITE_FACTS.audience.ageMax).toBe(SEMANTIC_FACTS.audience.coreAgeMax);
    expect(PUBLIC_SITE_FACTS.liveSessions.label).toBe(
      SEMANTIC_FACTS.delivery.standardOneToOne.durationLabel,
    );

    expect(PUBLIC_FACTS.brandName).toBe(SEMANTIC_FACTS.brand.name);
    expect(PUBLIC_FACTS.founder.fullName).toBe(SEMANTIC_FACTS.founder.fullName);
    expect(PUBLIC_FACTS.sessionDuration).toBe(
      SEMANTIC_FACTS.delivery.standardOneToOne.durationLabel,
    );

    expect(FREE_DEMO_DURATION_MINUTES).toBe(SEMANTIC_FACTS.delivery.assessment.durationMinutes);
    expect(FREE_DEMO_SESSION_COUNT).toBe(SEMANTIC_FACTS.delivery.assessment.sessionCount);
    expect(FREE_DEMO_PRICE).toBe(SEMANTIC_FACTS.delivery.assessment.priceInr);
    expect(STANDARD_ONE_TO_ONE_PER_CLASS_PRICE).toBe(
      SEMANTIC_FACTS.pricing.standardOneToOnePerClassInr,
    );
    expect(PUBLIC_CONTACT_EMAIL).toBe(SEMANTIC_FACTS.contact.email);
    expect(PUBLIC_CONTACT_TELEPHONE).toBe(SEMANTIC_FACTS.contact.telephoneDisplay);
    expect(PUBLIC_WHATSAPP_NUMBER).toBe(SEMANTIC_FACTS.contact.whatsappNumber);
  });

  it('keeps phonics lesson counts equal to the operational canonical curriculum', () => {
    const levels = SEMANTIC_FACTS.programmes.phonics.levels;
    expect(levels.foundations.lessonCount).toBe(PHONICS_COURSES['phonics-foundations'].lessonCount);
    expect(levels.early.lessonCount).toBe(PHONICS_COURSES['early-phonics'].lessonCount);
    expect(levels.advanced.lessonCount).toBe(PHONICS_COURSES['advanced-phonics'].lessonCount);
    expect(SEMANTIC_FACTS.programmes.phonics.totalLessonCount).toBe(
      Object.values(PHONICS_COURSES).reduce((sum, course) => sum + course.lessonCount, 0),
    );
    expect(SEMANTIC_FACTS.programmes.phonics.totalLessonCount).toBe(101);
  });

  it('publishes programme counts and public age ranges from semantic facts through the course catalog', () => {
    const expectedLevels = [
      SEMANTIC_FACTS.programmes.phonics.levels.foundations,
      SEMANTIC_FACTS.programmes.phonics.levels.early,
      SEMANTIC_FACTS.programmes.phonics.levels.advanced,
      SEMANTIC_FACTS.programmes.grammar.levels.beginner,
      SEMANTIC_FACTS.programmes.grammar.levels.advanced,
      SEMANTIC_FACTS.programmes.speaking.levels.beginner,
      SEMANTIC_FACTS.programmes.speaking.levels.advanced,
    ];

    for (const level of expectedLevels) {
      const course = catalogBySlug.get(level.publicSlug);
      expect(course, `Missing public catalog course ${level.publicSlug}`).toBeDefined();
      expect(course?.name).toBe(level.label);
      expect(course?.age).toBe(level.ageRange.label);
      expect(course?.duration).toBe(`${level.lessonCount} lessons`);
      expect(level.ageRange.max).toBeLessThanOrEqual(SEMANTIC_FACTS.audience.coreAgeMax);
    }

    expect(SEMANTIC_FACTS.programmes.grammar.totalLessonCount).toBe(72);
    expect(SEMANTIC_FACTS.programmes.speaking.totalLessonCount).toBe(72);
  });

  it('keeps official organization profiles and founder profiles on one URL source', () => {
    expect(OFFICIAL_PUBLIC_PROFILES.map((profile) => profile.url)).toEqual(
      OFFICIAL_ORGANIZATION_PROFILE_URLS,
    );
    expect(FOUNDER_PUBLIC_PROFILES.map((profile) => profile.url)).toEqual(
      SEMANTIC_FACTS.founder.publicProfiles.map((profile) => profile.url),
    );
    expect(organizationSchema.sameAs).toEqual(ORGANIZATION_SAME_AS_URLS);
    expect(new Set(OFFICIAL_ORGANIZATION_PROFILE_URLS).size).toBe(
      OFFICIAL_ORGANIZATION_PROFILE_URLS.length,
    );
  });

  it('prevents compatibility modules and schema from becoming new literal sources of truth', () => {
    const filesThatMustConsumeSemanticFacts = [
      'src/config/publicFacts.ts',
      'src/config/publicOffer.ts',
      'src/constants/publicContact.ts',
      'src/content/courses.ts',
      'src/lib/schemas.ts',
      'src/lib/officialProfiles.ts',
      'src/lib/founderProfiles.ts',
      'src/lib/pinterestProfile.ts',
      'src/lib/quoraProfile.ts',
      'src/components/common/Meta.tsx',
    ];

    for (const relativePath of filesThatMustConsumeSemanticFacts) {
      expect(read(relativePath), `${relativePath} must consume semanticFacts.ts`).toContain(
        relativePath === 'src/components/common/Meta.tsx'
          ? 'ORGANIZATION_SAME_AS_URLS'
          : 'SEMANTIC_FACTS',
      );
    }

    const schemas = read('src/lib/schemas.ts');
    expect(schemas).not.toContain("'https://www.youtube.com/@TinyStepsLearning_Priya'");
    expect(schemas).not.toContain("'https://www.linkedin.com/company/tiny-steps-learning/'");
    expect(schemas).not.toContain("telephone: '+91-9618398383'");

    const contact = read('src/constants/publicContact.ts');
    expect(contact).not.toContain("'RavaliPriyaVannala@tinystepslearning.com'");
    expect(contact).not.toContain("'919618398383'");
  });

  it('keeps programme claims explicit and non-guaranteed', () => {
    expect(SEMANTIC_FACTS.programmes.phonics.claim).toMatch(/structured/i);
    expect(SEMANTIC_FACTS.programmes.grammar.claim).toMatch(/structured/i);
    expect(SEMANTIC_FACTS.programmes.speaking.claim).toMatch(/structured/i);
    expect(SEMANTIC_FACTS.outcomePolicy.universalGuaranteedTimelineAllowed).toBe(false);
  });
});
