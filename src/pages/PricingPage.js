import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// @ts-nocheck
import { useEffect, useMemo } from 'react';
import Meta from '../components/common/Meta';
import { useAuthStore } from '../store/useAuthStore';
import { catalogs } from '../content/courses';
import GamingSubscriptionSection from '../components/Home/GamingSubscriptionSection';
const PER_SESSION = 550;
const parseWeeks = (duration) => {
    const match = duration.match(/(\d+)(?:[–-](\d+))?/);
    if (!match)
        return { min: 0, max: 0 };
    const min = parseInt(match[1], 10);
    const max = match[2] ? parseInt(match[2], 10) : min;
    return { min, max };
};
const parseClassesPerWeek = (frequency) => {
    const match = frequency.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 2;
};
const formatCurrency = (value) => `₹${value.toLocaleString('en-IN')}`;
const plans = [
    {
        name: 'Starter',
        sessions: 8,
        duration: '4 weeks • 2 live classes/week',
        badge: 'New families',
        highlight: false,
        color: 'from-white via-[#fff7ec] to-[#ffe0b5]',
        features: ['Personalised assessment + roadmap', 'Live 1:1 or pod classes', 'Weekly AI insight recap', 'WhatsApp nudges for practice']
    },
    {
        name: 'Growth',
        sessions: 24,
        duration: '12 weeks • 2 live classes/week',
        badge: 'Most popular',
        highlight: true,
        color: 'from-[#fff1d6] via-white to-[#dff1ff]',
        features: ['Everything in Starter', 'Monthly mastery review with mentor', 'Recorded class access + worksheets', 'Parent Q&A call every month']
    },
    {
        name: 'Intensive',
        sessions: 36,
        duration: '12 weeks • 3 live classes/week',
        badge: 'Fast-track',
        highlight: false,
        color: 'from-white via-[#e8f3ff] to-[#f4e8ff]',
        features: ['Daily AI reading/speaking coach prompts', 'Capstone showcase video production', 'Priority scheduling & reschedules', 'Optional Saturday masterclass']
    }
];
const PricingPage = () => {
    useEffect(() => { document.title = 'Pricing | Tiny Steps'; }, []);
    const coursePricing = useMemo(() => catalogs.map((course) => {
        const weeks = parseWeeks(course.duration);
        const classesPerWeek = parseClassesPerWeek(course.frequency);
        const minSessions = weeks.min * classesPerWeek;
        const maxSessions = weeks.max * classesPerWeek;
        const minFee = minSessions * PER_SESSION;
        const maxFee = maxSessions * PER_SESSION;
        return { course, weeks, classesPerWeek, minSessions, maxSessions, minFee, maxFee };
    }), []);
    const planPricing = useMemo(() => plans.map((plan) => (Object.assign(Object.assign({}, plan), { fee: plan.sessions * PER_SESSION }))), []);
    const offerCatalog = {
        '@context': 'https://schema.org',
        '@type': 'OfferCatalog',
        name: 'Tiny Steps Course Pricing',
        itemListElement: coursePricing.map((entry, index) => ({
            '@type': 'Offer',
            position: index + 1,
            itemOffered: {
                '@type': 'Course',
                name: entry.course.name,
                description: entry.course.overview.join(', ')
            },
            price: `${entry.minFee}`,
            priceCurrency: 'INR'
        }))
    };
    return (_jsxs("div", { className: "page-gradient min-h-screen", children: [_jsx(Meta, { title: "Pricing | Tiny Steps Online School", description: "Transparent \u20B9550 per session pricing. See total investment for every course before you enroll.", canonical: "https://tinystepslearning.com/pricing", jsonLd: offerCatalog }), _jsx("section", { className: "relative px-6 pt-24 pb-10", children: _jsxs("div", { className: "mx-auto max-w-5xl glass-panel px-8 py-10 text-center", children: [_jsx("div", { className: "gradient-chip mx-auto w-max", children: "\u20B9550 per live session" }), _jsx("h1", { className: "mt-3 text-3xl font-bold text-gray-900 md:text-4xl", children: "Pricing that mirrors your child\u2019s curriculum" }), _jsx("p", { className: "mt-3 text-gray-700", children: "Every course lists classes/week \u00D7 weeks = total sessions. Multiply by \u20B9550 and you know the full investment upfront." })] }) }), _jsx("section", { className: "mx-auto max-w-6xl px-6 pb-12", children: _jsx("div", { className: "grid gap-6 md:grid-cols-3", children: planPricing.map((plan) => (_jsxs("div", { className: `relative overflow-hidden rounded-3xl border border-gray-100 bg-gradient-to-br ${plan.color} p-6 shadow-card-hover`, children: [plan.badge && (_jsx("span", { className: `inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${plan.highlight ? 'bg-[#ff8f5c] text-white' : 'bg-white/80 text-gray-700'}`, children: plan.badge.toUpperCase() })), _jsxs("h3", { className: "mt-4 text-2xl font-semibold text-gray-900", children: [plan.name, " Plan"] }), _jsx("p", { className: "text-sm text-gray-600", children: plan.duration }), _jsxs("div", { className: "mt-4 text-4xl font-bold text-gray-900", children: [formatCurrency(plan.fee), _jsxs("span", { className: "text-base font-medium text-gray-600", children: [" / ", plan.sessions, " classes"] })] }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "\u20B9550 per 35\u201340 min live session" }), _jsx("ul", { className: "mt-4 space-y-2 text-sm text-gray-700", children: plan.features.map((feature) => (_jsxs("li", { className: "flex items-start gap-2", children: [_jsx("span", { children: "\u2728" }), _jsx("span", { children: feature })] }, feature))) }), _jsx("button", { className: `mt-6 w-full rounded-2xl px-4 py-3 text-sm font-semibold ${plan.highlight ? 'bg-gray-900 text-white shadow-2xl' : 'bg-white text-gray-900 shadow'}`, onClick: () => { var _a; return (_a = document.getElementById('book-trial')) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: 'smooth' }); }, children: "Enroll now" }), _jsx("p", { className: "mt-2 text-[11px] text-gray-500", children: "Need EMI or split payments? WhatsApp us and we\u2019ll arrange it." })] }, plan.name))) }) }), _jsxs("section", { className: "mx-auto max-w-6xl px-6 pb-16", children: [_jsx("div", { className: "overflow-x-auto rounded-3xl bg-white shadow-card-hover border border-gray-100", children: _jsxs("table", { className: "w-full border-collapse text-sm text-gray-700", children: [_jsx("thead", { children: _jsxs("tr", { className: "bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500", children: [_jsx("th", { className: "px-4 py-3", children: "Course" }), _jsx("th", { className: "px-4 py-3", children: "Duration" }), _jsx("th", { className: "px-4 py-3", children: "Classes / week" }), _jsx("th", { className: "px-4 py-3", children: "Total sessions" }), _jsx("th", { className: "px-4 py-3", children: "Total fee (\u20B9550/session)" })] }) }), _jsx("tbody", { children: coursePricing.map(({ course, weeks, classesPerWeek, minSessions, maxSessions, minFee, maxFee }) => (_jsxs("tr", { className: "border-t border-gray-100", children: [_jsxs("td", { className: "px-4 py-4", children: [_jsx("div", { className: "font-semibold text-gray-900", children: course.name }), _jsxs("div", { className: "text-xs text-gray-500", children: [course.track.toUpperCase(), " \u2022 Level: ", course.level] })] }), _jsx("td", { className: "px-4 py-4", children: weeks.min === weeks.max ? `${weeks.min} weeks` : `${weeks.min}–${weeks.max} weeks` }), _jsxs("td", { className: "px-4 py-4", children: [classesPerWeek, " per week"] }), _jsx("td", { className: "px-4 py-4", children: minSessions === maxSessions ? minSessions : `${minSessions}–${maxSessions}` }), _jsx("td", { className: "px-4 py-4 font-semibold text-gray-900", children: minFee === maxFee ? formatCurrency(minFee) : `${formatCurrency(minFee)} – ${formatCurrency(maxFee)}` })] }, course.slug))) })] }) }), _jsxs("div", { className: "mt-8 grid gap-4 md:grid-cols-3 text-sm text-gray-600", children: [_jsxs("div", { className: "glass-panel p-5", children: [_jsx("div", { className: "font-semibold text-gray-900", children: "What\u2019s included" }), _jsxs("ul", { className: "mt-2 list-disc pl-5", children: [_jsx("li", { children: "Live 1:1 or small-group sessions" }), _jsx("li", { children: "Weekly mastery reports" }), _jsx("li", { children: "Recorded sessions + resources" })] })] }), _jsxs("div", { className: "glass-panel p-5", children: [_jsx("div", { className: "font-semibold text-gray-900", children: "Payment options" }), _jsxs("ul", { className: "mt-2 list-disc pl-5", children: [_jsx("li", { children: "UPI, cards, net-banking" }), _jsx("li", { children: "Monthly or full-course billing" }), _jsx("li", { children: "Pause/resume within 48 hours notice" })] })] }), _jsxs("div", { className: "glass-panel p-5", children: [_jsx("div", { className: "font-semibold text-gray-900", children: "Need installment plans?" }), _jsx("p", { className: "mt-2 text-sm text-gray-600", children: !useAuthStore().user ? (_jsxs(_Fragment, { children: ["Chat with us on ", _jsx("a", { href: "https://wa.me/919618398383", className: "text-tiny-green-600", children: "WhatsApp" }), ". We set up 2-month or 3-month payment splits for most families."] })) : (_jsxs(_Fragment, { children: ["Please use ", _jsx("a", { href: "/contact", className: "text-tiny-blue-600", children: "Contact" }), " to verify payment options; our finance team will assist."] })) })] })] })] }), _jsx(GamingSubscriptionSection, { heading: "Joyful Learning Game Plans (Add-on)" })] }));
};
export default PricingPage;
