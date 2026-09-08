import { formatINR } from './pricing';
import { SEMANTIC_FACTS } from './semanticFacts';

export const FREE_DEMO_SESSION_COUNT =
  SEMANTIC_FACTS.delivery.assessment.sessionCount;
export const FREE_DEMO_DURATION_MINUTES =
  SEMANTIC_FACTS.delivery.assessment.durationMinutes;
export const FREE_DEMO_PRICE =
  SEMANTIC_FACTS.delivery.assessment.priceInr;

export const FREE_DEMO_OFFER_NAME =
  `One Free ${FREE_DEMO_DURATION_MINUTES}-Minute Demo Assessment Class`;

export const FREE_DEMO_CTA_LABEL =
  `Book Free ${FREE_DEMO_DURATION_MINUTES}-Minute Demo`;

export const FREE_DEMO_SHORT_DESCRIPTION =
  SEMANTIC_FACTS.delivery.assessment.claim;

export const FREE_DEMO_FULL_DESCRIPTION =
  `${SEMANTIC_FACTS.delivery.assessment.claim} The teacher checks the child’s current level and recommends the right learning path.`;

export const STANDARD_ONE_TO_ONE_PER_CLASS_PRICE =
  SEMANTIC_FACTS.pricing.standardOneToOnePerClassInr;

export const STANDARD_SMALL_GROUP_MIN_PER_CLASS =
  SEMANTIC_FACTS.pricing.standardSmallGroupMinPerClassInr;

export const STANDARD_SMALL_GROUP_MAX_PER_CLASS =
  SEMANTIC_FACTS.pricing.standardSmallGroupMaxPerClassInr;

export const STANDARD_PRICING_SUMMARY =
  `Standard 1:1: ${formatINR(STANDARD_ONE_TO_ONE_PER_CLASS_PRICE)} per class` +
  ` • Small groups: ${formatINR(STANDARD_SMALL_GROUP_MIN_PER_CLASS)}` +
  `–${formatINR(STANDARD_SMALL_GROUP_MAX_PER_CLASS)} per child per class`;

export const DIGITAL_GAMES_TRIAL_LABEL =
  '3-day digital games trial';

export const DIGITAL_GAMES_TRIAL_CLARIFICATION =
  'This is a digital games subscription trial, not a live teacher-led demo class.';
