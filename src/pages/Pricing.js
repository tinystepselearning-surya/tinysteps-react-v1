import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import PricingCard from "../components/PricingCard";
import { pricingPlans } from "../data/pricing";
export default function Pricing() {
    return (_jsxs("div", { className: "px-4 py-10 max-w-6xl mx-auto", children: [_jsx("h1", { className: "text-3xl font-bold mb-4", children: "Program pricing lives with our courses" }), _jsxs("p", { className: "max-w-3xl text-lg text-gray-600", children: ["We now keep pricing side by side with program details. Head to the", " ", _jsx(Link, { to: "/courses#pricing", className: "font-semibold text-[#d94b03] hover:underline", children: "courses overview page" }), " ", "to compare learning pathways, milestones, and one-to-one tuition plans."] }), _jsx("p", { className: "mt-3 text-sm uppercase tracking-[0.26em] text-gray-500", children: "35-minute sessions \u00B7 3 per week \u00B7 \u20B9350 per class" }), _jsx("div", { className: "mt-10 grid gap-6 md:grid-cols-3", children: pricingPlans.map((plan) => (_jsx(PricingCard, { title: plan.title, price: plan.price, blurb: plan.blurb, features: plan.features, ctaText: plan.ctaText, ctaHref: plan.ctaHref, accent: plan.accent }, plan.id))) })] }));
}
//# sourceMappingURL=Pricing.js.map