// Canonical pricing configuration for Tiny Steps (public-facing)
export const PER_CLASS_PRICE = 400;

export const ONE_TO_ONE_MONTHLY_PACKAGES = [
  { id: 'starter', classes: 12, monthlyFee: 4800, durationMinutes: 35 },
  { id: 'growth', classes: 16, monthlyFee: 6400, durationMinutes: 35 },
  { id: 'intensive', classes: 24, monthlyFee: 9600, durationMinutes: 35 },
] as const;

export const GROUP_MONTHLY_FEES = [
  { ratio: '1:1', classes: 12, monthlyFee: 4800, durationMinutes: 35 },
  { ratio: '1:2', classes: 12, monthlyFee: 3600, durationMinutes: 40 },
  { ratio: '1:3', classes: 12, monthlyFee: 3000, durationMinutes: 45 },
  { ratio: '1:4', classes: 12, monthlyFee: 2640, durationMinutes: 50 },
  { ratio: '1:5', classes: 12, monthlyFee: 2400, durationMinutes: 55 },
  { ratio: '1:6', classes: 12, monthlyFee: 2160, durationMinutes: 60 },
] as const;

export const COURSE_TOTAL_SESSIONS_DEFAULT = 36;

export const formatINR = (value: number): string => {
  try {
    return `₹${value.toLocaleString('en-IN')}`;
  } catch {
    return `₹${value}`;
  }
};

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
