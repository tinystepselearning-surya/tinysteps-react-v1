// Import from single source of truth
import { STARTER_PLAN, formatINR } from '../lib/pricingPlans';

// Default per-class price based on Starter plan original rate
export const DEFAULT_PER_CLASS_PRICE = STARTER_PLAN.perClassOriginal; // 600

// Re-export formatINR for backwards compatibility
export { formatINR };

export const DEFAULT_PER_CLASS_PRICE_LABEL = formatINR(DEFAULT_PER_CLASS_PRICE);
