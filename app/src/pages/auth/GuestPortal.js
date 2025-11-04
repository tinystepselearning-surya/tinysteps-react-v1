import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useParams } from "react-router-dom";
const GUEST_CONFIG = {
    kids: {
        title: "Kids Guest Hub",
        blurb: "Play a rotating set of free Tiny Steps games and story starters. Log in later to save your favourites and unlock premium adventures.",
        highlights: [
            "Daily trio of phonics and vocabulary mini-games",
            "Read-along story excerpts and colouring downloads",
            "Pronunciation warm-up videos picked by Tiny Steps coaches",
        ],
        upgrade: "/login/kids",
    },
    parents: {
        title: "Parent Guest Preview",
        blurb: "Explore an open dashboard sample before enrolling. You’ll see how we share progress snapshots, homework nudges, and schedule reminders.",
        highlights: [
            "Sample class report with feedback stars and next steps",
            "Printable worksheet pack (Level 1 Phonics)",
            "Weekly learning goals checklist to try at home",
        ],
        upgrade: "/login/parents",
    },
};
export default function GuestPortalPage() {
    const params = useParams();
    const role = params.role ?? "parents";
    const config = GUEST_CONFIG[role] ?? GUEST_CONFIG.parents;
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#fff7ed] to-[#f1f5f9]", children: _jsxs("div", { className: "mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-4", children: [_jsx(Link, { to: "/", className: "inline-flex items-center rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-[#2563eb] shadow-sm shadow-[#2563eb]/10 hover:-translate-y-0.5", children: "\u2190 Back to Tiny Steps" }), _jsx(Link, { to: config.upgrade, className: "inline-flex items-center rounded-full bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] px-5 py-2 text-sm font-semibold text-white shadow-md shadow-[#2563eb]/20 hover:-translate-y-0.5", children: "Sign in for premium access" })] }), _jsxs("header", { className: "mt-10 rounded-3xl border border-white/70 bg-white/90 p-8 shadow-lg shadow-slate-900/5", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.28em] text-[#2563eb]/70", children: "Guest access" }), _jsx("h1", { className: "mt-3 text-3xl font-bold text-slate-900 sm:text-4xl", children: config.title }), _jsx("p", { className: "mt-3 text-sm text-slate-600 sm:text-base", children: config.blurb })] }), _jsx("section", { className: "mt-10 grid gap-6 sm:grid-cols-2", children: config.highlights.map((item) => (_jsxs("article", { className: "rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm shadow-slate-900/5", children: [_jsx("h2", { className: "text-base font-semibold text-[#1f2937]", children: "Free preview" }), _jsx("p", { className: "mt-2 text-sm text-slate-600", children: item })] }, item))) }), _jsxs("section", { className: "mt-10 rounded-3xl border border-dashed border-[#2563eb]/40 bg-[#eff6ff] p-6 text-sm text-[#1d4ed8]", children: [_jsx("h3", { className: "text-base font-semibold", children: "Upgrade when you\u2019re ready" }), _jsx("p", { className: "mt-2", children: "Enjoy these resources as often as you like. When you\u2019re ready for the full Tiny Steps experience\u2014live classes, progress dashboards, and coach feedback\u2014sign in or create an account from the button above." })] })] }) }));
}
//# sourceMappingURL=GuestPortal.js.map