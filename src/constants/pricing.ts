// Import from single source of truth
import { PER_CLASS_PRICE, formatINR } from '../config/pricing';

export const DEFAULT_PER_CLASS_PRICE = PER_CLASS_PRICE;

// Re-export formatINR for backwards compatibility
export { formatINR };

export const DEFAULT_PER_CLASS_PRICE_LABEL = formatINR(DEFAULT_PER_CLASS_PRICE);
