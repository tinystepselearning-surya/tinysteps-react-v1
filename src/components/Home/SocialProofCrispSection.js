import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import TestimonialsCarousel from './TestimonialsCarousel';
const items = [
    { value: '3500+', label: 'Learners guided since 2020' },
    { value: '8 countries', label: 'India • US • UK • Canada • Singapore • Malaysia • Vietnam • UAE • Australia' },
    { value: '95%', label: 'Parents see visible improvement in 12 weeks' },
    { value: '4.9/5', label: 'Average parent satisfaction rating' }
];
const SocialProofCrispSection = () => {
    return (_jsx("section", { "data-animate": "fade-up", className: "bg-gradient-to-b from-slate-50 to-white py-20", children: _jsxs("div", { className: "mx-auto max-w-6xl px-6", children: [_jsx("div", { className: "mb-10 text-center", children: _jsx("h2", { className: "font-heading text-3xl font-bold md:text-4xl", children: "Results & Stories" }) }), _jsx("div", { className: "grid gap-6 md:grid-cols-2 lg:grid-cols-4", children: items.map((s) => (_jsxs("div", { className: "rounded-3xl bg-white p-6 text-center shadow-lg ring-1 ring-slate-200 transition-transform will-change-transform hover:-translate-y-1", children: [_jsx("div", { className: "animated-gradient-text text-3xl font-extrabold md:text-4xl", children: s.value }), _jsx("p", { className: "mt-2 text-sm text-gray-700", children: s.label })] }, s.label))) }), _jsx("div", { className: "mt-12", children: _jsx(TestimonialsCarousel, {}) })] }) }));
};
export default SocialProofCrispSection;
