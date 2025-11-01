import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardShell from "../../components/dashboard/DashboardShell";
import { buildNavItems } from "../../components/dashboard/navItems";
const SNAPSHOTS = [
    { label: "Active 1:1 families", value: "86", helper: "+4 this week" },
    { label: "Teacher sessions today", value: "48", helper: "Across phonics, grammar, speaking" },
    { label: "Parent touchpoints", value: "12", helper: "Updates queued for the day" },
];
const PIPELINE = [
    { stage: "Discovery booked", families: 12, notes: "Share call brief with assigned teacher" },
    { stage: "Trial completed", families: 7, notes: "Confirm fit & prepare fee proposal" },
    { stage: "Ready to enrol", families: 5, notes: "Issue contract + payment link" },
];
const COMMUNICATION = [
    {
        slot: "9:30 AM",
        parent: "Sneha Sharma",
        topic: "Grammar lab reschedule request",
        action: "Check teacher availability, confirm slot, update dashboard note",
    },
    {
        slot: "11:00 AM",
        parent: "Rahul Joshi",
        topic: "Speaking showcase prep call",
        action: "Share teacher feedback summary and upload video link",
    },
    {
        slot: "4:30 PM",
        parent: "Kavya’s dad",
        topic: "Phonics worksheet follow-up",
        action: "Send PDF pack + share class stars with parent",
    },
];
const TEACHER_SUMMARY = [
    { teacher: "Ananya", classes: 6, pay: "₹1,050", status: "Scheduled payout Fri" },
    { teacher: "Ravi", classes: 5, pay: "₹875", status: "Approved" },
    { teacher: "Fatima", classes: 4, pay: "₹700", status: "Awaiting attendance lock" },
];
const PARENT_FEES = [
    { family: "Rao", programme: "Phonics", balance: "₹1,050 due · 3 classes remain", type: "Installment" },
    { family: "Sharma", programme: "Grammar", balance: "₹2,100 credit · top-up", type: "Advance" },
    { family: "Joshi", programme: "Speaking", balance: "₹1,400 credit · auto debit 28 Oct", type: "Auto debit" },
];
const CHECKLIST = [
    { title: "Send phonics reading log to Rao family", owner: "Learning Manager" },
    { title: "Confirm showcase rehearsal logistics", owner: "Teacher · Riya", highlight: true },
    { title: "Share fee reminder draft with finance", owner: "Learning Manager" },
];
export default function LearningManagerPortal() {
    const navigate = useNavigate();
    useEffect(() => {
        if (typeof window === "undefined")
            return;
        const role = window.sessionStorage.getItem("tinysteps-role");
        if (role !== "learning-managers") {
            navigate("/login/learning-managers", { replace: true });
        }
    }, [navigate]);
    const [activeTab, setActiveTab] = useState("pipeline");
    const scrollToId = useCallback((id) => {
        return () => {
            const el = document.getElementById(id);
            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        };
    }, []);
    const navItems = useMemo(() => buildNavItems("groups", {
        includeKeys: ["groups", "homework", "payouts"],
        overrides: {
            groups: {
                label: "Learning manager hub",
                badge: `${SNAPSHOTS[1].value}`,
                onSelect: scrollToId("operations-board"),
            },
            homework: {
                label: "Daily checklist",
                badge: `${COMMUNICATION.length}`,
                onSelect: scrollToId("daily-checklist"),
            },
            payouts: {
                label: "Fee overview",
                onSelect: scrollToId("family-fee"),
            },
        },
    }), [scrollToId]);
    const headerToolbar = (_jsxs("div", { className: "flex flex-col gap-2 sm:flex-row sm:items-center", children: [_jsx("button", { className: "inline-flex items-center justify-center rounded-full border border-[#0b7ad7]/20 bg-white px-4 py-2 text-sm font-semibold text-[#0b7ad7] shadow-sm shadow-[#0b7ad7]/10 transition hover:bg-[#0b7ad7]/10", children: "Export daily sheet" }), _jsx("button", { className: "inline-flex items-center justify-center rounded-full bg-[#0b7ad7] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#0b7ad7]/30 transition hover:bg-[#0b6ac0]", children: "Create parent update" })] }));
    const rightRail = (_jsxs(_Fragment, { children: [_jsxs("section", { className: "rounded-3xl border border-[#0b7ad7]/10 bg-white p-6 shadow-xl shadow-slate-900/8", children: [_jsx("h2", { className: "text-base font-semibold text-slate-900", children: "Today's snapshot" }), _jsx("div", { className: "mt-4 space-y-3", children: SNAPSHOTS.map((item) => (_jsxs("div", { className: "rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.22em] text-[#0b7ad7]", children: item.label }), _jsx("p", { className: "mt-2 text-2xl font-bold text-slate-900", children: item.value }), _jsx("p", { className: "mt-1 text-xs text-slate-600", children: item.helper })] }, item.label))) })] }), _jsxs("section", { className: "rounded-3xl border border-[#0b7ad7]/10 bg-white p-6 shadow-xl shadow-slate-900/8", children: [_jsx("h2", { className: "text-base font-semibold text-slate-900", children: "Fee alerts" }), _jsx("div", { className: "mt-4 space-y-3", children: PARENT_FEES.map((family) => (_jsxs("div", { className: "rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3", children: [_jsxs("p", { className: "text-sm font-semibold text-slate-900", children: [family.family, " family"] }), _jsx("p", { className: "text-xs uppercase tracking-[0.22em] text-[#0b7ad7]", children: family.programme }), _jsx("p", { className: "mt-2 text-sm text-slate-600", children: family.balance }), _jsx("p", { className: "mt-1 text-xs text-slate-500", children: family.type })] }, family.family))) })] })] }));
    return (_jsxs(DashboardShell, { navItems: navItems, header: {
            title: "Learning manager control room",
            subtitle: "Coordinate teachers, parents, and payments without switching tools. Draft updates and confirm reschedules in seconds.",
            toolbar: headerToolbar,
        }, rightRail: rightRail, children: [_jsxs("section", { id: "operations-board", className: "rounded-3xl border border-white/70 bg-white/85 p-6 shadow-xl shadow-slate-900/8", children: [_jsxs("div", { className: "flex flex-col gap-4 md:flex-row md:items-center md:justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold text-slate-900", children: "Operations board" }), _jsx("p", { className: "mt-1 text-sm text-slate-600", children: "Switch between family pipeline, teacher payouts, and parent communication." })] }), _jsx("div", { className: "flex rounded-full bg-white/70 p-1 shadow-inner shadow-slate-900/5", children: ["pipeline", "teachers", "parents"].map((tab) => {
                                    const label = tab === "pipeline" ? "Family pipeline" : tab === "teachers" ? "Teacher payouts" : "Parent calls";
                                    const selected = activeTab === tab;
                                    return (_jsx("button", { onClick: () => setActiveTab(tab), className: `rounded-full px-4 py-1.5 text-sm font-semibold transition ${selected ? "bg-white text-[#0b7ad7] shadow" : "text-slate-500"}`, type: "button", children: label }, tab));
                                }) })] }), activeTab === "pipeline" && (_jsx("div", { className: "mt-6 space-y-4", children: PIPELINE.map((item) => (_jsxs("article", { className: "rounded-3xl border border-white/60 bg-white/80 p-5 shadow-sm", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [_jsx("p", { className: "text-lg font-semibold text-slate-900", children: item.stage }), _jsxs("span", { className: "rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#0b7ad7]", children: [item.families, " families"] })] }), _jsx("p", { className: "mt-3 text-sm text-slate-600", children: item.notes })] }, item.stage))) })), activeTab === "teachers" && (_jsx("div", { className: "mt-6 space-y-4", children: TEACHER_SUMMARY.map((row) => (_jsxs("article", { className: "rounded-3xl border border-white/60 bg-white/80 p-5 shadow-sm", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-lg font-semibold text-slate-900", children: row.teacher }), _jsxs("p", { className: "text-sm text-slate-600", children: [row.classes, " classes today"] })] }), _jsx("span", { className: "rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#0b7ad7]", children: row.pay })] }), _jsx("p", { className: "mt-3 text-xs uppercase tracking-[0.22em] text-[#0b7ad7]", children: row.status })] }, row.teacher))) })), activeTab === "parents" && (_jsx("div", { className: "mt-6 space-y-4", children: COMMUNICATION.map((item) => (_jsxs("article", { className: "rounded-3xl border border-white/60 bg-white/80 p-5 shadow-sm", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [_jsx("p", { className: "text-lg font-semibold text-slate-900", children: item.parent }), _jsx("span", { className: "rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#0b7ad7]", children: item.slot })] }), _jsx("p", { className: "mt-2 text-sm text-slate-600", children: item.topic }), _jsx("p", { className: "mt-3 text-xs uppercase tracking-[0.22em] text-[#0b7ad7]", children: item.action })] }, `${item.parent}-${item.slot}`))) }))] }), _jsxs("section", { id: "family-fee", className: "rounded-3xl border border-white/70 bg-white/85 p-6 shadow-xl shadow-slate-900/8", children: [_jsxs("div", { className: "flex flex-col gap-2 md:flex-row md:items-center md:justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold text-slate-900", children: "Family fee overview" }), _jsx("p", { className: "mt-1 text-sm text-slate-600", children: "Track balances before nightly parent updates go out." })] }), _jsx("button", { className: "rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-100", children: "Download CSV" })] }), _jsx("div", { className: "mt-6 grid gap-4 md:grid-cols-3", children: PARENT_FEES.map((family) => (_jsxs("article", { className: "rounded-3xl border border-white/60 bg-white/80 p-5 shadow-sm", children: [_jsxs("p", { className: "text-lg font-semibold text-slate-900", children: [family.family, " family"] }), _jsx("p", { className: "mt-1 text-xs uppercase tracking-[0.22em] text-[#0b7ad7]", children: family.programme }), _jsx("p", { className: "mt-3 text-sm text-slate-600", children: family.balance }), _jsx("p", { className: "mt-2 text-xs text-slate-500", children: family.type })] }, family.family))) })] }), _jsxs("section", { id: "daily-checklist", className: "rounded-3xl border border-white/70 bg-white/85 p-6 shadow-xl shadow-slate-900/8", children: [_jsx("h2", { className: "text-xl font-semibold text-slate-900", children: "Daily checklist" }), _jsx("p", { className: "mt-1 text-sm text-slate-600", children: "Confirm these items before the evening parent digest." }), _jsx("div", { className: "mt-6 space-y-3", children: CHECKLIST.map((item) => (_jsxs("div", { className: `rounded-3xl border border-white/60 px-5 py-4 text-sm text-slate-600 ${item.highlight ? "bg-[#e0f2fe]" : "bg-white/80"}`, children: [_jsx("p", { className: "font-semibold text-slate-900", children: item.title }), _jsx("p", { className: "mt-1 text-xs uppercase tracking-[0.22em] text-[#0b7ad7]", children: item.owner })] }, item.title))) })] })] }));
}
//# sourceMappingURL=LearningManagerPortal.js.map