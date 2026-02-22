/**
 * Backwards-compatible pricing exports (source: src/config/pricing.ts)
 */
import { ONE_TO_ONE_MONTHLY_PACKAGES, PER_CLASS_PRICE, formatINR } from '../config/pricing';

export const DISCOUNT_PERCENT = 0;

export const PRICING_PLANS = ONE_TO_ONE_MONTHLY_PACKAGES.map((plan) => ({
  id: plan.id,
  name: plan.id === 'starter' ? 'Starter' : plan.id === 'growth' ? 'Growth' : 'Intensive',
  classes: plan.classes,
  original: plan.monthlyFee,
  discounted: plan.monthlyFee,
  perClassOriginal: PER_CLASS_PRICE,
  perClassDiscounted: PER_CLASS_PRICE,
}));

export type PricingPlan = typeof PRICING_PLANS[number];

// Helper: minimum discounted price across all plans
export const MIN_PLAN_PRICE = Math.min(...PRICING_PLANS.map(p => p.discounted)); // 3360

// Re-export formatINR from canonical pricing
export { formatINR };

// Helper: get plan by ID
export const getPlanById = (id: string) => PRICING_PLANS.find(p => p.id === id);

// Helper: get starter plan (most commonly referenced)
export const STARTER_PLAN = PRICING_PLANS[0];
export const GROWTH_PLAN = PRICING_PLANS[1];
export const INTENSIVE_PLAN = PRICING_PLANS[2];

// Backwards compatibility exports (alias)
export const PRICING_PACKAGES = PRICING_PLANS.map(p => ({
  name: p.name,
  classes: p.classes,
  original: p.original,
  monthly: p.discounted, // legacy field name
}));
