export type PricingPlan = {
    id: "phonics" | "grammar" | "speaking";
    title: string;
    price: string;
    blurb: string;
    features: string[];
    ctaText: string;
    ctaHref: string;
    accent: "orange" | "teal" | "violet";
};
export declare const pricingPlans: PricingPlan[];
//# sourceMappingURL=pricing.d.ts.map