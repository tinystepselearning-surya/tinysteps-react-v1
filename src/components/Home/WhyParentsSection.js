import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
const items = [
    {
        icon: '🎯',
        title: 'Customized to YOUR Child. Not One-Size-Fits-All.',
        points: [
            'Other online schools teach 20 kids at once. We teach YOUR child.',
            "Every lesson is designed for your child's level:",
            '- Struggling with pronunciation? We focus there.',
            '- Already reads well? We skip basics, focus on fluency.',
            '- Shy about speaking? We build confidence gradually.',
            'Your child gets a learning path, not a predetermined curriculum.'
        ]
    },
    {
        icon: '👩‍🏫',
        title: 'Expert Teachers Who Specialize in Young Learners',
        points: [
            '✓ Certified in early childhood education (not just English speakers)',
            '✓ Trained in phonics & speech development (not random background)',
            '✓ Experienced with shy, anxious, or resistant children',
            '✓ Native English speakers with Indian parent experience',
            "Your child is taught by professionals who understand how children learn."
        ]
    },
    {
        icon: '📊',
        title: 'You See Progress. Every Week.',
        points: [
            'Weekly Progress Reports:',
            '→ What your child learned this week',
            '→ Improvements in pronunciation, grammar, confidence',
            '→ Practice at home (5 mins/day)',
            '→ Next week\'s goals',
            'No more wondering “Is my child actually learning?” – You\'ll see it.'
        ]
    },
    {
        icon: '⏰',
        title: 'Classes When Your Family Works. Not the Other Way Around.',
        points: [
            'Flexible Scheduling:',
            '→ Choose days & times that fit YOU',
            '→ Reschedule anytime (up to 24 hours before)',
            '→ No rigid batch timings',
            '→ Classes: 5 AM to 10 PM IST',
            'Working parent? Multiple kids? No problem.'
        ]
    }
];
const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};
const item = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0 }
};
const WhyParentsSection = () => {
    return (_jsx("section", { className: "bg-gradient-to-b from-white to-slate-50/50 py-20", children: _jsxs("div", { className: "mx-auto max-w-6xl px-6", children: [_jsxs("div", { className: "mb-10 text-center", children: [_jsx("h2", { className: "font-heading text-3xl font-bold md:text-4xl", children: "Why 3500+ Families Worldwide Trust Tiny Steps" }), _jsx("p", { className: "mt-2 text-base text-gray-700 md:text-lg", children: "From Mumble to Confident Speaker in 3-4 Months" })] }), _jsx(motion.div, { className: "grid gap-8 md:grid-cols-2 lg:grid-cols-4", variants: container, initial: "hidden", whileInView: "show", viewport: { once: true, amount: 0.2 }, children: items.map((card) => (_jsxs(motion.div, { variants: item, className: "group rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200 transition-all hover:-translate-y-1 hover:shadow-2xl", children: [_jsx("div", { className: "text-3xl", children: card.icon }), _jsx("h3", { className: "mt-3 text-lg font-semibold text-gray-900", children: card.title }), _jsx("ul", { className: "mt-4 space-y-1 text-sm text-gray-700", children: card.points.map((p, i) => (_jsx("li", { children: p }, i))) })] }, card.title))) })] }) }));
};
export default WhyParentsSection;
