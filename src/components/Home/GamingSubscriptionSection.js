import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Button from '../Button/Button';
import { useAuthStore } from '../../store/useAuthStore';
const plans = [
    {
        name: 'Phonics Play Packs',
        price: '₹199/mo',
        tone: 'from-[#ffe4c7] to-white',
        description: '10-minute daily phonics quests (SATPIN, digraphs, vowel teams).',
        features: ['AI tips to fix common reading mistakes', 'Printable badges + kid-friendly leaderboard'],
    },
    {
        name: 'Grammar Arcade',
        price: '₹199/mo',
        tone: 'from-[#e4f3ff] to-white',
        description: 'Sentence surgery, punctuation hits, tense battles.',
        features: ['Adaptive difficulty for each child', 'Weekly accuracy snapshot for parents'],
        badge: 'Best for grades 3–6',
    },
    {
        name: 'Speak Bold Studio',
        price: '₹299/mo',
        tone: 'from-[#f5e8ff] to-white',
        description: 'Speaking prompts with AI feedback on pace, clarity, and expression.',
        features: ['Safe, child-only audio recordings', 'Confidence streak tracker + exportable clips for parents'],
    },
];
const bundle = {
    name: 'All Access Joyful Learning',
    price: '₹499/mo',
    tone: 'from-[#fef6e7] via-white to-[#def1ff]',
    description: 'Unlock all three game libraries (Phonics + Grammar + Speaking).',
    features: ['Parent dashboard with time well spent, not wasted screentime', 'Extra seasonal quests, badges, and surprise challenges'],
    savingsNote: 'Save over ₹200/month compared to buying all three separately. Cancel anytime.',
};
export default function GamingSubscriptionSection({ heading = 'Joyful Learning Game Subscriptions' }) {
    const { user } = useAuthStore();
    return (_jsx("section", { "data-animate": "fade-up", className: "bg-gradient-to-b from-white to-slate-50/50 py-16", children: _jsxs("div", { className: "mx-auto max-w-6xl px-6", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "gradient-chip mx-auto w-max", children: "Purposeful screen time" }), _jsx("h2", { className: "mt-2 text-3xl font-semibold text-gray-900 md:text-4xl", children: heading }), _jsx("p", { className: "mt-2 text-gray-700", children: "Swap random screentime for ad-free Tiny Steps games. Kids play, you get clear progress summaries." })] }), _jsx("div", { className: "mt-10 grid gap-6 md:grid-cols-3", children: plans.map((plan) => (_jsx("div", { className: `rounded-3xl border border-white/0 bg-gradient-to-br ${plan.tone} p-[1px] shadow-card-hover`, children: _jsxs("div", { className: "rounded-3xl bg-white/95 p-6", children: [plan.badge && (_jsx("div", { className: "mb-2 inline-block rounded-full bg-gradient-to-r from-blue-500 to-green-400 px-3 py-1 text-xs font-semibold text-white", children: plan.badge })), _jsx("div", { className: "text-sm font-semibold uppercase tracking-wide text-gray-500", children: plan.name }), _jsx("div", { className: "mt-2 text-3xl font-bold text-gray-900", children: plan.price }), _jsx("p", { className: "mt-3 text-sm text-gray-600", children: plan.description }), _jsx("ul", { className: "mt-4 space-y-2 text-sm text-gray-700", children: plan.features.map((feature) => (_jsxs("li", { className: "flex items-start gap-2", children: [_jsx("span", { children: "\uD83C\uDFAE" }), _jsx("span", { children: feature })] }, feature))) })] }) }, plan.name))) }), _jsx("p", { className: "mt-8 text-center text-sm text-gray-600", children: "Want all three? Scroll down for the All Access bundle (best value)." }), _jsx("div", { className: `mt-8 rounded-[32px] border border-white/0 bg-gradient-to-r ${bundle.tone} p-[1px] shadow-card-hover`, children: _jsxs("div", { className: "rounded-[28px] bg-white/95 p-6 md:p-8 grid gap-6 md:grid-cols-[1.2fr_0.8fr] items-center", children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm font-semibold uppercase tracking-wide text-gray-500", children: "Bundle & save" }), _jsx("h3", { className: "text-2xl font-semibold text-gray-900", children: bundle.name }), _jsx("div", { className: "text-4xl font-bold text-gray-900", children: bundle.price }), _jsx("p", { className: "mt-2 text-sm text-gray-600", children: bundle.description }), _jsx("p", { className: "mt-2 text-sm font-semibold text-green-600", children: bundle.savingsNote }), _jsx("ul", { className: "mt-3 space-y-2 text-sm text-gray-700", children: bundle.features.map((feature) => (_jsxs("li", { className: "flex items-start gap-2", children: [_jsx("span", { children: "\uD83C\uDF08" }), _jsx("span", { children: feature })] }, feature))) }), _jsx("div", { className: "mt-4 text-xs text-gray-500", children: "Pricing is per child account." })] }), _jsxs("div", { className: "rounded-3xl border border-dashed border-gray-200 bg-white/80 p-6 text-sm text-gray-700 space-y-3", children: [_jsx("p", { className: "font-semibold text-gray-900", children: "How it works" }), _jsxs("ol", { className: "list-decimal pl-4 space-y-1", children: [_jsx("li", { children: "Pick a single track or the All Access bundle." }), _jsx("li", { children: "Kids get weekly missions inside the Tiny Steps Games app." }), _jsx("li", { children: "Parents receive AI insight summaries + gentle habit nudges." })] }), !user && (_jsx(Button, { onClick: () => window.open('https://wa.me/919618398383?text=Hi%20Tiny%20Steps!%20Tell%20me%20about%20the%20game%20subscriptions.%20', '_blank'), className: "w-full", children: "Get the game pass" }))] })] }) })] }) }));
}
