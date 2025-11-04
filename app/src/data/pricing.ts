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

export const pricingPlans: PricingPlan[] = [
  {
    id: "phonics",
    title: "Phonics",
    price: "₹4,200",
    blurb: "12 one-to-one sessions (35 mins) delivered across 4 weeks · ₹350 per session.",
    features: [
      "Systematic SATPIN, digraphs, Magic-E pathway",
      "Guided blending labs & fluency sprints",
      "Weekly parent summary",
    ],
    ctaText: "Book Phonics Demo",
    ctaHref: "/main/book-demo/?programme=phonics",
    accent: "orange",
  },
  {
    id: "grammar",
    title: "Grammar",
    price: "₹4,200",
    blurb: "12 one-to-one writing labs (35 mins) each cycle · ₹350 per session.",
    features: [
      "Parts of speech, tenses, punctuation",
      "Sentence craft, editing drills, feedback loops",
      "Weekly writing sprint + feedback",
    ],
    ctaText: "Schedule Grammar Trial",
    ctaHref: "/main/book-demo/?programme=grammar",
    accent: "teal",
  },
  {
    id: "speaking",
    title: "Public Speaking",
    price: "₹4,200",
    blurb: "12 coached sessions (35 mins) with rehearsal recordings · ₹350 per session.",
    features: [
      "Voice & diction practice",
      "Story frameworks & presence",
      "Showcase at end of cycle",
    ],
    ctaText: "Reserve Speaking Session",
    ctaHref: "/main/book-demo/?programme=speaking",
    accent: "violet",
  },
];
