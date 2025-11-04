import { Link } from "react-router-dom";
import PricingCard from "../components/PricingCard";
import { pricingPlans } from "../data/pricing";

export default function Pricing() {
  return (
    <div className="px-4 py-10 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Program pricing lives with our courses</h1>
      <p className="max-w-3xl text-lg text-gray-600">
        We now keep pricing side by side with program details. Head to the{" "}
        <Link to="/courses#pricing" className="font-semibold text-[#d94b03] hover:underline">
          courses overview page
        </Link>{" "}
        to compare learning pathways, milestones, and one-to-one tuition plans.
      </p>
      <p className="mt-3 text-sm uppercase tracking-[0.26em] text-gray-500">
        35-minute sessions · 3 per week · ₹350 per class
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {pricingPlans.map((plan) => (
          <PricingCard
            key={plan.id}
            title={plan.title}
            price={plan.price}
            blurb={plan.blurb}
            features={plan.features}
            ctaText={plan.ctaText}
            ctaHref={plan.ctaHref}
            accent={plan.accent}
          />
        ))}
      </div>
    </div>
  );
}
