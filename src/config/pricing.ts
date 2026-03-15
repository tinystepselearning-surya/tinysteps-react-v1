// Canonical pricing configuration for Tiny Steps (public-facing)
export type TeacherPricingTier = 'indian' | 'native';

export const NATIVE_TEACHER_MULTIPLIER = 4;
export const PER_CLASS_PRICE = 400;
export const NATIVE_TEACHER_PER_CLASS_PRICE =
  PER_CLASS_PRICE * NATIVE_TEACHER_MULTIPLIER;

export const TEACHER_PRICING = {
  indian: {
    key: 'indian',
    label: 'Indian teachers',
    perClass: PER_CLASS_PRICE,
    multiplier: 1,
  },
  native: {
    key: 'native',
    label: 'Native English-speaking teachers',
    perClass: NATIVE_TEACHER_PER_CLASS_PRICE,
    multiplier: NATIVE_TEACHER_MULTIPLIER,
  },
} as const;

export const ONE_TO_ONE_MONTHLY_PACKAGES = [
  { id: 'starter', classes: 12, monthlyFee: 4800, durationMinutes: 35 },
  { id: 'growth', classes: 16, monthlyFee: 6400, durationMinutes: 35 },
  { id: 'intensive', classes: 24, monthlyFee: 9600, durationMinutes: 35 },
] as const;

export const NATIVE_ONE_TO_ONE_MONTHLY_PACKAGES =
  ONE_TO_ONE_MONTHLY_PACKAGES.map((pkg) => ({
    ...pkg,
    monthlyFee: pkg.monthlyFee * NATIVE_TEACHER_MULTIPLIER,
  }));

export const GROUP_MONTHLY_FEES = [
  { ratio: '1:1', classes: 12, monthlyFee: 4800, durationMinutes: 35 },
  { ratio: '1:2', classes: 12, monthlyFee: 3600, durationMinutes: 40 },
  { ratio: '1:3', classes: 12, monthlyFee: 3000, durationMinutes: 45 },
  { ratio: '1:4', classes: 12, monthlyFee: 2640, durationMinutes: 50 },
  { ratio: '1:5', classes: 12, monthlyFee: 2400, durationMinutes: 55 },
  { ratio: '1:6', classes: 12, monthlyFee: 2160, durationMinutes: 60 },
] as const;

// Ultra Premium pricing (source of truth for native English-speaking teachers)
export const ULTRA_PREMIUM_PRICING = [
  {
    ratio: '1:1',
    format: '1:1 Personal Class',
    perClass: 1899,
    package12: 22799,
    unitLabel: 'per class',
    packageLabel: 'for 12 classes',
  },
  {
    ratio: '1:2',
    format: '1:2 Semi-Private',
    perClass: 1099,
    package12: 13199,
    unitLabel: 'per child',
    packageLabel: 'for 12 classes / child',
  },
  {
    ratio: '1:3',
    format: '1:3 Small Group',
    perClass: 849,
    package12: 10199,
    unitLabel: 'per child',
    packageLabel: 'for 12 classes / child',
  },
  {
    ratio: '1:4',
    format: '1:4 Group Class',
    perClass: 699,
    package12: 8399,
    unitLabel: 'per child',
    packageLabel: 'for 12 classes / child',
  },
  {
    ratio: '1:5',
    format: '1:5 Group Class',
    perClass: 649,
    package12: 7799,
    unitLabel: 'per child',
    packageLabel: 'for 12 classes / child',
  },
  {
    ratio: '1:6',
    format: '1:6 Group Class',
    perClass: 599,
    package12: 7199,
    unitLabel: 'per child',
    packageLabel: 'for 12 classes / child',
  },
] as const;

export const NATIVE_GROUP_MONTHLY_FEES = GROUP_MONTHLY_FEES.map((row) => ({
  ...row,
  monthlyFee: row.monthlyFee * NATIVE_TEACHER_MULTIPLIER,
}));

export const COURSE_TOTAL_SESSIONS_DEFAULT = 36;

export const formatINR = (value: number): string => {
  try {
    return `₹${value.toLocaleString('en-IN')}`;
  } catch {
    return `₹${value}`;
  }
};

export const scalePriceByTeacherTier = (
  amount: number,
  tier: TeacherPricingTier = 'indian'
): number => amount * TEACHER_PRICING[tier].multiplier;

export const totalFeeForSessions = (
  sessions: number,
  perClass: number = PER_CLASS_PRICE
): number => Math.round(sessions * perClass);

export const feeRangeForSessions = (
  minSessions: number,
  maxSessions: number,
  perClass: number = PER_CLASS_PRICE
): { min: number; max: number } => ({
  min: totalFeeForSessions(minSessions, perClass),
  max: totalFeeForSessions(maxSessions, perClass),
});

export const COURSE_TOTAL_FEE_ESTIMATE = totalFeeForSessions(
  COURSE_TOTAL_SESSIONS_DEFAULT
);

export const COURSE_FEE_RANGE_24_36 = feeRangeForSessions(24, 36);
