import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
const ROLE_CONFIG = {
    kids: {
        title: "Tiny Steps Kids Login",
        subtitle: "Log in to unlock personalised games, saved worksheets, and progress stars.",
        cta: "Sign in to play",
        helper: "Use the credentials shared by your parent or coach",
        benefits: [
            "Access premium Story Studio and pronunciation labs",
            "Save your favourite practice games",
            "See the stars you earned in class this week",
        ],
        guestLink: { label: "Continue as guest", to: "/kids" },
    },
    parents: {
        title: "Tiny Steps Parent Login",
        subtitle: "Sign in to track class reports, download homework packs, and message your Learning Manager.",
        cta: "Sign in to view dashboard",
        helper: "Use the email address you registered with Tiny Steps Learning",
        benefits: [
            "View daily session summaries and feedback stars",
            "Download premium worksheets and voice-note recaps",
            "Manage payments and upcoming schedule",
        ],
        guestLink: { label: "Browse as guest", to: "/guest/parents" },
    },
    teachers: {
        title: "Tiny Steps Teacher Login",
        subtitle: "Access your class schedule, progress logs, and curated lesson resources.",
        cta: "Sign in to teaching suite",
        helper: "Only authorised Tiny Steps teachers can sign in here",
        benefits: [
            "Mark attendance and rate sessions in one place",
            "Upload voice notes and worksheet assignments",
            "Track payouts and follow-up actions for the day",
        ],
    },
    "learning-managers": {
        title: "Learning Manager Login",
        subtitle: "Coordinate families, teachers, and payments from your control room.",
        cta: "Sign in to control room",
        helper: "Learning Managers receive their credentials from Tiny Steps admin",
        benefits: [
            "Manage family pipelines and parent touchpoints",
            "Approve payouts and lesson changes",
            "Send branded reports and reminders in minutes",
        ],
    },
};
const TARGET_ROUTES = {
    kids: "/roles/kids",
    parents: "/parents",
    teachers: "/roles/teacher",
    "learning-managers": "/roles/rm",
};
export default function RoleLoginPage() {
    const params = useParams();
    const role = params.role;
    const config = role ? ROLE_CONFIG[role] : undefined;
    const [status, setStatus] = useState("idle");
    const navigate = useNavigate();
    const headline = useMemo(() => {
        if (!config)
            return "";
        return config.title;
    }, [config]);
    if (!config) {
        return _jsx(Navigate, { to: "/login/parents", replace: true });
    }
    const onSubmit = (event) => {
        event.preventDefault();
        if (status === "submitting")
            return;
        setStatus("submitting");
        setTimeout(() => {
            if (typeof window !== "undefined" && role) {
                window.sessionStorage.setItem("tinysteps-role", role);
            }
            setStatus("success");
            const redirectTo = role ? TARGET_ROUTES[role] : TARGET_ROUTES.parents;
            setTimeout(() => {
                setStatus("idle");
                navigate(redirectTo, { replace: true });
            }, 1200);
        }, 900);
    };
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-[#f6f8ff] via-[#fff7fa] to-[#f2f4ff]", children: _jsxs("div", { className: "mx-auto flex min-h-screen max-w-6xl flex-col items-center gap-12 px-4 py-12 sm:px-6 lg:px-8", children: [_jsx(Link, { to: "/", className: "inline-flex items-center gap-3 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-[#1d4ed8] shadow-md shadow-[#1d4ed8]/10 backdrop-blur transition hover:-translate-y-0.5", children: "\u2190 Back to Tiny Steps Home" }), _jsxs("div", { className: "grid w-full gap-10 rounded-3xl border border-white/60 bg-white/90 p-8 shadow-xl shadow-slate-900/5 md:grid-cols-[1.1fr,0.9fr] md:gap-12 lg:p-12", children: [_jsxs("section", { children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.28em] text-[#1d4ed8]/70", children: "Role sign-in" }), _jsx("div", { className: "mt-3 flex flex-wrap gap-2", children: ROLE_OPTIONS.map((option) => (_jsx(Link, { to: `/login/${option.value}`, className: `rounded-full border px-3 py-1 text-xs font-semibold transition ${option.value === role
                                            ? "border-[#1d4ed8] bg-[#1d4ed8]/10 text-[#1d4ed8]"
                                            : "border-slate-200 text-slate-500 hover:border-[#1d4ed8]/40 hover:text-[#1d4ed8]"}`, children: option.label }, option.value))) }), _jsx("h1", { className: "mt-3 text-3xl font-bold text-slate-900 sm:text-4xl", children: headline }), _jsx("p", { className: "mt-3 text-sm text-slate-600 sm:text-base", children: config.subtitle }), _jsx("ul", { className: "mt-6 space-y-3 rounded-3xl border border-slate-100 bg-slate-50/60 p-6 text-sm text-slate-700", children: config.benefits.map((item) => (_jsxs("li", { className: "flex items-start gap-3", children: [_jsx("span", { className: "mt-1 inline-flex h-2 w-2 rounded-full bg-[#1d4ed8]" }), _jsx("span", { children: item })] }, item))) }), config.guestLink && (_jsxs("div", { className: "mt-6 rounded-2xl border border-dashed border-[#1d4ed8]/40 bg-[#eff6ff] px-5 py-4 text-sm text-[#1d4ed8]", children: ["Prefer to explore the free guest module first?", " ", _jsx(Link, { to: config.guestLink.to, className: "font-semibold underline underline-offset-4", children: config.guestLink.label })] }))] }), _jsxs("section", { className: "rounded-3xl border border-slate-100 bg-white/80 p-6 shadow-inner shadow-slate-900/5 sm:p-8", children: [_jsxs("form", { onSubmit: onSubmit, className: "space-y-5", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-semibold text-slate-700", children: "Email" }), _jsx("input", { type: "email", required: true, placeholder: "you@example.com", className: "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-[#1d4ed8]/20 transition focus:ring-2" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-semibold text-slate-700", children: "Password" }), _jsx("input", { type: "password", required: true, placeholder: "Enter your password", className: "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-[#1d4ed8]/20 transition focus:ring-2" })] }), _jsx("p", { className: "text-xs text-slate-500", children: config.helper }), _jsx("button", { type: "submit", className: "w-full rounded-full bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#2563eb]/20 transition hover:-translate-y-0.5", children: status === "submitting" ? "Signing in…" : config.cta }), status === "success" && (_jsx("p", { className: "rounded-2xl bg-[#dcfce7] px-4 py-3 text-sm font-semibold text-[#047857]", children: "Sign-in verified! Redirecting you to your workspace\u2026" }))] }), _jsxs("p", { className: "mt-6 text-xs text-slate-500", children: ["Forgotten your password? Reach out to", " ", _jsx("a", { href: "mailto:hello@tinystepslearning.com", className: "font-semibold text-[#1d4ed8] underline underline-offset-4", children: "hello@tinystepslearning.com" }), " ", "and the Tiny Steps team will help you reset it right away."] })] })] })] }) }));
}
const ROLE_OPTIONS = [
    { value: "kids", label: "Kids" },
    { value: "parents", label: "Parents" },
    { value: "teachers", label: "Teachers" },
    { value: "learning-managers", label: "Learning Managers" },
];
//# sourceMappingURL=RoleLogin.js.map