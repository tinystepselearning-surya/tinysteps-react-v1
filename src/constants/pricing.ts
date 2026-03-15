// Import from single source of truth
import {
  PER_CLASS_PRICE,
  ULTRA_PREMIUM_PRICING,
  formatINR,
} from '../config/pricing';

export const DEFAULT_PER_CLASS_PRICE = PER_CLASS_PRICE;
export const DEFAULT_ULTRA_PREMIUM_PER_CLASS_PRICE =
  ULTRA_PREMIUM_PRICING[0].perClass;

// Re-export formatINR for backwards compatibility
export { formatINR };

export const DEFAULT_PER_CLASS_PRICE_LABEL = formatINR(DEFAULT_PER_CLASS_PRICE);
export const DEFAULT_ULTRA_PREMIUM_PER_CLASS_PRICE_LABEL = formatINR(
  DEFAULT_ULTRA_PREMIUM_PER_CLASS_PRICE
);
