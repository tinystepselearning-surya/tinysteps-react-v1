import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
import Button from '../Button/Button';
const plans = [
    {
        name: 'Starter',
        price: '₹4,400/month',
        bullets: ['8 live classes per month (2x/week)', 'Weekly AI insight summary', 'Great for ages 3–6'],
        highlight: false
    },
    {
        name: 'Growth',
        price: '₹6,600/month',
        bullets: ['12 live classes per month (3x/week)', 'Monthly mentor consult call', 'Most popular for ages 5–10'],
        highlight: true
    },
    {
        name: 'Intensive',
        price: '₹8,800/month',
        bullets: ['16 live classes per month (4x/week)', 'Daily nudges + capstone prep', 'Ideal for advanced or fast catch-up'],
        highlight: false
    }
];
const PricingSection = () => {
    return (_jsx("section", { className: "bg-gradient-to-b from-slate-50 to-white py-20", children: _jsxs("div", { className: "mx-auto max-w-6xl px-6", children: [_jsx("div", { className: "mb-10 text-center", children: _jsx("h3", { className: "font-heading text-2xl font-bold md:text-3xl", children: "Flexible Plans for Indian Families" }) }), _jsx("div", { className: "grid gap-8 md:grid-cols-2 lg:grid-cols-3", children: plans.map((p) => (_jsxs(motion.div, { className: `rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200 ${p.highlight ? 'border-2 border-primary-500' : ''}`, initial: { opacity: 0, y: 12 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.2 }, children: [_jsx("h4", { className: "font-heading text-xl font-bold text-gray-900", children: p.name }), _jsx("div", { className: "mt-2 text-2xl font-extrabold text-gray-900", children: p.price }), _jsx("ul", { className: "mt-4 space-y-2 text-gray-700", children: p.bullets.map((b) => (_jsxs("li", { children: ["\u2022 ", b] }, b))) }), _jsx("div", { className: "mt-6", children: _jsx(Button, { className: "w-full", children: "Choose Plan" }) })] }, p.name))) }), _jsx("p", { className: "mx-auto mt-6 max-w-3xl text-center text-sm text-gray-600", children: "Transparent \u2022 Flexible \u2022 Affordable \u2022 Worth it. If you don\u2019t see progress in 30 days, we extend free classes until you do." })] }) }));
};
export default PricingSection;
