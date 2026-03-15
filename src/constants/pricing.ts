// Import from single source of truth
import {
  ONE_TO_ONE_MONTHLY_PACKAGES,
  PER_CLASS_PRICE,
  ULTRA_PREMIUM_PRICING,
  formatINR,
} from '../config/pricing';

export const DEFAULT_PER_CLASS_PRICE = PER_CLASS_PRICE;
export const DEFAULT_ULTRA_PREMIUM_PER_CLASS_PRICE =
  ULTRA_PREMIUM_PRICING[0].perClass;
export const DEFAULT_PREMIUM_MONTHLY_START_PRICE =
  ONE_TO_ONE_MONTHLY_PACKAGES[0].monthlyFee;
export const DEFAULT_ULTRA_PREMIUM_MONTHLY_MIN_PRICE = Math.min(
  ...ULTRA_PREMIUM_PRICING.map((row) => row.package12)
);
export const DEFAULT_ULTRA_PREMIUM_MONTHLY_MAX_PRICE = Math.max(
  ...ULTRA_PREMIUM_PRICING.map((row) => row.package12)
);

// Re-export formatINR for backwards compatibility
export { formatINR };

export const DEFAULT_PER_CLASS_PRICE_LABEL = formatINR(DEFAULT_PER_CLASS_PRICE);
export const DEFAULT_ULTRA_PREMIUM_PER_CLASS_PRICE_LABEL = formatINR(
  DEFAULT_ULTRA_PREMIUM_PER_CLASS_PRICE
);
