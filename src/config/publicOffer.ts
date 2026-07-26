import {
  formatINR,
  GROUP_MONTHLY_FEES,
  PER_CLASS_PRICE,
} from './pricing';

export const FREE_DEMO_SESSION_COUNT = 1;
export const FREE_DEMO_DURATION_MINUTES = 35;
export const FREE_DEMO_PRICE = 0;

export const FREE_DEMO_OFFER_NAME =
  'One Free 35-Minute Demo Assessment Class';

export const FREE_DEMO_CTA_LABEL =
  'Book Free 35-Minute Demo';

export const FREE_DEMO_SHORT_DESCRIPTION =
  'One free 35-minute 1:1 online demo assessment class per child before enrolment.';

export const FREE_DEMO_FULL_DESCRIPTION =
  'One free 35-minute 1:1 online demo assessment class is provided per child before enrolment. The teacher checks the child’s current level and recommends the right learning path.';

export const STANDARD_ONE_TO_ONE_PER_CLASS_PRICE =
  PER_CLASS_PRICE;

const STANDARD_SMALL_GROUP_ROWS =
  GROUP_MONTHLY_FEES.filter((row) => row.ratio !== '1:1');

const STANDARD_SMALL_GROUP_PER_CLASS_VALUES =
  STANDARD_SMALL_GROUP_ROWS.map((row) =>
    Math.round(row.monthlyFee / row.classes)
  );

export const STANDARD_SMALL_GROUP_MIN_PER_CLASS =
  Math.min(...STANDARD_SMALL_GROUP_PER_CLASS_VALUES);

export const STANDARD_SMALL_GROUP_MAX_PER_CLASS =
  Math.max(...STANDARD_SMALL_GROUP_PER_CLASS_VALUES);

export const STANDARD_PRICING_SUMMARY =
  `Standard 1:1: ${formatINR(STANDARD_ONE_TO_ONE_PER_CLASS_PRICE)} per class` +
  ` • Small groups: ${formatINR(STANDARD_SMALL_GROUP_MIN_PER_CLASS)}` +
  `–${formatINR(STANDARD_SMALL_GROUP_MAX_PER_CLASS)} per child per class`;

export const DIGITAL_GAMES_TRIAL_LABEL =
  '3-day digital games trial';

export const DIGITAL_GAMES_TRIAL_CLARIFICATION =
  'This is a digital games subscription trial, not a live teacher-led demo class.';
