import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Button from '../Button/Button';
import { useAuthStore } from '../../store/useAuthStore';
const plans = [
    {
        name: 'Phonics Play Packs',
        price: '₹199/mo',
        tone: 'from-[#ffe4c7] to-white',
        description: 'Replace random apps with curated phonics mini-games (SATPIN, digraphs, vowel teams).',
        features: ['Daily 10-minute quests', 'AI tips for parents', 'Printable badges + leaderboard'],
    },
    {
        name: 'Grammar Arcade',
        price: '₹199/mo',
        tone: 'from-[#e4f3ff] to-white',
        description: 'Sentence surgery, punctuation hits, tense battles—grammar practice that feels like play.',
        features: ['Adaptive difficulty', 'Weekly accuracy report', 'Rewards kids for editing correctly'],
    },
    {
        name: 'Speak Bold Studio',
        price: '₹299/mo',
        tone: 'from-[#f5e8ff] to-white',
        description: 'Public speaking prompts with AI-generated speech insights on pace, clarity, and expression.',
        features: ['Record + auto-feedback', 'Confidence streak tracker', 'Exportable clips for parents'],
    },
];
const bundle = {
    name: 'All Access Joyful Learning',
    price: '₹499/mo',
    tone: 'from-[#fef6e7] via-white to-[#def1ff]',
    description: 'Unlock all three game libraries. Deeper engagement + 10% off on annual billing for each track.',
    features: ['Phonics + Grammar + Speaking', 'Parent dashboard with time well spent', 'Extra seasonal quests & badges'],
};
export default function GamingSubscriptionSection({ heading = 'Joyful Learning Game Subscriptions' }) {
    const { user } = useAuthStore();
    return (_jsx("section", { "data-animate": "fade-up", className: "bg-gradient-to-b from-white to-slate-50/50 py-16", children: _jsxs("div", { className: "mx-auto max-w-6xl px-6", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "gradient-chip mx-auto w-max", children: "Purposeful screen time" }), _jsx("h2", { className: "mt-2 text-3xl font-semibold text-gray-900 md:text-4xl", children: heading }), _jsx("p", { className: "mt-2 text-gray-700", children: "Swap aimless screentime for curated Tiny Steps games. Kids play, parents get insight summaries." })] }), _jsx("div", { className: "mt-10 grid gap-6 md:grid-cols-3", children: plans.map((plan) => (_jsx("div", { className: `rounded-3xl border border-white/0 bg-gradient-to-br ${plan.tone} p-[1px] shadow-card-hover`, children: _jsxs("div", { className: "rounded-3xl bg-white/95 p-6", children: [_jsx("div", { className: "text-sm font-semibold uppercase tracking-wide text-gray-500", children: plan.name }), _jsx("div", { className: "mt-2 text-3xl font-bold text-gray-900", children: plan.price }), _jsx("p", { className: "mt-3 text-sm text-gray-600", children: plan.description }), _jsx("ul", { className: "mt-4 space-y-2 text-sm text-gray-700", children: plan.features.map((feature) => (_jsxs("li", { className: "flex items-start gap-2", children: [_jsx("span", { children: "\uD83C\uDFAE" }), _jsx("span", { children: feature })] }, feature))) })] }) }, plan.name))) }), _jsx("div", { className: `mt-8 rounded-[32px] border border-white/0 bg-gradient-to-r ${bundle.tone} p-[1px] shadow-card-hover`, children: _jsxs("div", { className: "rounded-[28px] bg-white/95 p-6 md:p-8 grid gap-6 md:grid-cols-[1.2fr_0.8fr] items-center", children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm font-semibold uppercase tracking-wide text-gray-500", children: "Bundle & save" }), _jsx("h3", { className: "text-2xl font-semibold text-gray-900", children: bundle.name }), _jsx("div", { className: "text-4xl font-bold text-gray-900", children: bundle.price }), _jsx("p", { className: "mt-2 text-sm text-gray-600", children: bundle.description }), _jsx("ul", { className: "mt-3 space-y-2 text-sm text-gray-700", children: bundle.features.map((feature) => (_jsxs("li", { className: "flex items-start gap-2", children: [_jsx("span", { children: "\uD83C\uDF08" }), _jsx("span", { children: feature })] }, feature))) }), _jsx("p", { className: "mt-2 text-xs text-gray-500", children: "Annual billing? Take an extra 10% off on each game plan." })] }), _jsxs("div", { className: "rounded-3xl border border-dashed border-gray-200 bg-white/80 p-6 text-sm text-gray-700 space-y-3", children: [_jsx("p", { className: "font-semibold text-gray-900", children: "How it works" }), _jsxs("ol", { className: "list-decimal pl-4 space-y-1", children: [_jsx("li", { children: "Pick single track or the all-access bundle." }), _jsx("li", { children: "Kids get weekly missions inside the Tiny Steps Games app." }), _jsx("li", { children: "Parents receive AI insight summaries + habit nudges." })] }), !user && (_jsx(Button, { onClick: () => window.open('https://wa.me/919618398383?text=Hi%20Tiny%20Steps!%20Tell%20me%20about%20the%20game%20subscriptions.%20', '_blank'), className: "w-full", children: "Get the game pass" }))] })] }) })] }) }));
}
