/**
 * Single source of truth for Tiny Steps pricing
 * All public pages must import from here to ensure consistency
 */

export const DISCOUNT_PERCENT = 30;

export const PRICING_PLANS = [
  { 
    id: 'starter',
    name: 'Starter', 
    classes: 8, 
    original: 4800, 
    discounted: 3360,
    perClassOriginal: 600,
    perClassDiscounted: 420,
  },
  { 
    id: 'growth',
    name: 'Growth', 
    classes: 16, 
    original: 9200, 
    discounted: 6440,
    perClassOriginal: 575,
    perClassDiscounted: 402.5,
  },
  { 
    id: 'intensive',
    name: 'Intensive', 
    classes: 24, 
    original: 13200, 
    discounted: 9240,
    perClassOriginal: 550,
    perClassDiscounted: 385,
  },
] as const;

export type PricingPlan = typeof PRICING_PLANS[number];

// Helper: minimum discounted price across all plans
export const MIN_PLAN_PRICE = Math.min(...PRICING_PLANS.map(p => p.discounted)); // 3360

// Helper: format INR currency
export const formatINR = (value: number): string => {
  try {
    return `₹${value.toLocaleString('en-IN')}`;
  } catch {
    return `₹${value}`;
  }
};

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
