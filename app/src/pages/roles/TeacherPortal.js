import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardShell from "../../components/dashboard/DashboardShell";
import { buildNavItems } from "../../components/dashboard/navItems";
const REPORT_QUEUE = [
    {
        id: "viraj",
        name: "Viraj Dinesh",
        age: "9 yrs",
        subject: "English",
        strand: "Pronunciation",
        lastUpdated: "6 August 2024 · 8:16 pm",
        status: "pending",
        accent: "from-[#fee2b6] to-[#fbbf24]",
        lessonType: "1:1 CLASS",
    },
    {
        id: "vedaa",
        name: "Vedaaryann",
        age: "6 yrs",
        subject: "English",
        strand: "Pronunciation",
        lastUpdated: "31 July 2024 · 5:50 pm",
        status: "pending",
        accent: "from-[#d9e9ff] to-[#60a5fa]",
        lessonType: "1:1 CLASS",
    },
    {
        id: "dev",
        name: "Dev Ishan",
        age: "7 yrs",
        subject: "Phonics",
        strand: "Blends",
        lastUpdated: "30 July 2024 · 1:45 pm",
        status: "draft",
        accent: "from-[#ffe5f4] to-[#f472b6]",
        lessonType: "1:1 CLASS",
    },
    {
        id: "aadvika",
        name: "Aadvika Singla",
        age: "6 yrs",
        subject: "English",
        strand: "Pronunciation",
        lastUpdated: "25 July 2024 · 3:50 pm",
        status: "reviewed",
        accent: "from-[#dcfce7] to-[#34d399]",
        lessonType: "1:1 CLASS",
    },
    {
        id: "nikhil",
        name: "Nikhil Rao",
        age: "8 yrs",
        subject: "Grammar",
        strand: "Dialogue punctuation",
        lastUpdated: "22 July 2024 · 4:05 pm",
        status: "reviewed",
        accent: "from-[#fef3c7] to-[#f59e0b]",
        lessonType: "GROUP CLASS",
    },
    {
        id: "aarav",
        name: "Aarav Sharma",
        age: "8 yrs",
        subject: "Writing",
        strand: "Draft feedback",
        lastUpdated: "20 July 2024 · 6:10 pm",
        status: "draft",
        accent: "from-[#e0e7ff] to-[#6366f1]",
        lessonType: "1:1 CLASS",
    },
];
const DAY_CLASSES = [
    {
        time: "3:00 PM",
        learner: "Kavya Rao",
        programme: "Phonics Foundations 1:1",
        focus: "Digraph blending · sh/ch",
        status: "Present",
        actions: ["Log stars", "Share homework"],
    },
    {
        time: "4:15 PM",
        learner: "Aarav Sharma",
        programme: "Grammar Lab 1:1",
        focus: "Dialogue punctuation",
        status: "Present",
        actions: ["Update draft", "Record note"],
    },
    {
        time: "6:00 PM",
        learner: "Riya Joshi",
        programme: "Speaking Studio 1:1",
        focus: "Showcase rehearsal",
        status: "Present",
        actions: ["Upload clip", "Notify LM"],
    },
];
const FOLLOW_UPS = [
    { student: "Kavya Rao", action: "Send reading log to Learning Manager for parent update" },
    { student: "Aarav Sharma", action: "Share rubric voice note via Learning Manager" },
    { student: "Riya Joshi", action: "Add showcase clip to portal and notify Learning Manager" },
];
const EARNINGS = {
    today: { classes: 3, amount: "₹525" },
    month: { classes: 36, amount: "₹6,300" },
    total: { classes: 108, amount: "₹18,900" },
    nextPayout: "28 Oct",
};
const SNAPSHOT = [
    { label: "Pending reports", value: "7", helper: "Due before 9 pm today" },
    { label: "Draft voice notes", value: "4", helper: "Waiting to upload" },
    { label: "Attendance this week", value: "96%", helper: "23 / 24 students present" },
];
const TAB_ORDER = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "draft", label: "Drafts" },
    { key: "reviewed", label: "Reviewed" },
];
function StatusBadge({ status }) {
    const tone = status === "pending"
        ? "bg-[#fee2b6] text-[#b45309]"
        : status === "draft"
            ? "bg-[#e0e7ff] text-[#4338ca]"
            : "bg-[#dcfce7] text-[#047857]";
    const label = status === "pending" ? "Pending" : status === "draft" ? "Draft" : "Reviewed";
    return _jsx("span", { className: `rounded-full px-3 py-1 text-xs font-semibold ${tone}`, children: label });
}
export default function TeacherPortal() {
    const navigate = useNavigate();
    useEffect(() => {
        if (typeof window === "undefined")
            return;
        const role = window.sessionStorage.getItem("tinysteps-role");
        if (role !== "teachers") {
            navigate("/login/teachers", { replace: true });
        }
    }, [navigate]);
    const [activeTab, setActiveTab] = useState("pending");
    const [query, setQuery] = useState("");
    const reportCounts = useMemo(() => {
        return REPORT_QUEUE.reduce((acc, report) => {
            acc.all += 1;
            acc[report.status] += 1;
            return acc;
        }, { all: 0, pending: 0, reviewed: 0, draft: 0 });
    }, []);
    const filteredReports = useMemo(() => {
        const term = query.trim().toLowerCase();
        return REPORT_QUEUE.filter((report) => {
            const matchesTab = activeTab === "all" ? true : report.status === activeTab;
            const matchesQuery = !term ||
                report.name.toLowerCase().includes(term) ||
                report.subject.toLowerCase().includes(term) ||
                report.strand.toLowerCase().includes(term);
            return matchesTab && matchesQuery;
        });
    }, [activeTab, query]);
    const scrollToId = useCallback((id) => {
        return () => {
            const el = document.getElementById(id);
            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        };
    }, []);
    const navItems = useMemo(() => buildNavItems("classes", {
        includeKeys: ["classes", "homework"],
        overrides: {
            classes: {
                label: "Teacher workspace",
                badge: `${EARNINGS.today.classes}`,
                onSelect: scrollToId("report-queue"),
            },
            homework: {
                label: "Class flow",
                badge: `${reportCounts.pending}`,
                onSelect: scrollToId("class-flow"),
            },
        },
    }), [reportCounts.pending, scrollToId]);
    const headerToolbar = (_jsxs("div", { className: "flex flex-col gap-2 sm:flex-row sm:items-center", children: [_jsx("button", { className: "inline-flex items-center justify-center rounded-full border border-[#7c2d58]/30 bg-white/90 px-4 py-2 text-sm font-semibold text-[#7c2d58] shadow-sm shadow-[#7c2d58]/15 transition hover:bg-[#7c2d58]/10", children: "Download day sheet" }), _jsx("button", { className: "inline-flex items-center justify-center rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#2563eb]/30 transition hover:bg-[#1d4ed8]", children: "Start new report" })] }));
    const rightRail = (_jsxs(_Fragment, { children: [_jsxs("section", { className: "rounded-3xl border border-white/60 bg-white/85 p-6 shadow-xl shadow-slate-900/8", children: [_jsx("h2", { className: "text-base font-semibold text-slate-900", children: "Earnings snapshot" }), _jsxs("div", { className: "mt-4 space-y-3 text-sm text-slate-600", children: [_jsxs("div", { className: "flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3", children: [_jsxs("span", { children: ["Today \u00B7 ", EARNINGS.today.classes, " classes"] }), _jsx("span", { className: "text-base font-semibold text-slate-900", children: EARNINGS.today.amount })] }), _jsxs("div", { className: "flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3", children: [_jsxs("span", { children: ["This month \u00B7 ", EARNINGS.month.classes, " classes"] }), _jsx("span", { className: "text-base font-semibold text-slate-900", children: EARNINGS.month.amount })] }), _jsxs("div", { className: "flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3", children: [_jsxs("span", { children: ["Till date \u00B7 ", EARNINGS.total.classes, " classes"] }), _jsx("span", { className: "text-base font-semibold text-slate-900", children: EARNINGS.total.amount })] })] }), _jsxs("p", { className: "mt-4 text-xs font-semibold uppercase tracking-[0.28em] text-[#0b7ad7]", children: ["Next payout \u00B7 ", EARNINGS.nextPayout] })] }), _jsxs("section", { className: "rounded-3xl border border-white/60 bg-white/85 p-6 shadow-xl shadow-slate-900/8", children: [_jsx("h2", { className: "text-base font-semibold text-slate-900", children: "Follow-ups" }), _jsx("ul", { className: "mt-4 space-y-3", children: FOLLOW_UPS.map((item) => (_jsxs("li", { className: "rounded-2xl border border-white/50 bg-white/80 px-4 py-3", children: [_jsx("p", { className: "text-sm font-semibold text-slate-900", children: item.student }), _jsx("p", { className: "mt-1 text-xs text-slate-600", children: item.action })] }, item.student))) })] }), _jsxs("section", { className: "rounded-3xl border border-white/60 bg-white/85 p-6 shadow-xl shadow-slate-900/8", children: [_jsx("h2", { className: "text-base font-semibold text-slate-900", children: "Quick stats" }), _jsx("div", { className: "mt-4 space-y-3", children: SNAPSHOT.map((item) => (_jsxs("div", { className: "rounded-2xl border border-white/60 bg-white/80 px-4 py-3", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.22em] text-[#0b7ad7]", children: item.label }), _jsx("p", { className: "mt-2 text-2xl font-bold text-slate-900", children: item.value }), _jsx("p", { className: "mt-1 text-xs text-slate-600", children: item.helper })] }, item.label))) })] })] }));
    return (_jsxs(DashboardShell, { navItems: navItems, header: {
            title: "Teacher workspace",
            subtitle: "Track reports, classes, and parent follow-ups in one clean view. Learning Managers remain the bridge for every update.",
            toolbar: headerToolbar,
        }, rightRail: rightRail, children: [_jsxs("section", { id: "report-queue", className: "rounded-3xl border border-white/70 bg-white/85 p-6 shadow-xl shadow-slate-900/8", children: [_jsxs("div", { className: "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold text-slate-900", children: "Students report queue" }), _jsx("p", { className: "mt-1 text-sm text-slate-600", children: "Fill pending notes before parents receive the nightly digest." })] }), _jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-center", children: [_jsx("div", { className: "flex rounded-full bg-white/70 p-1 shadow-inner shadow-slate-900/5", children: TAB_ORDER.map((tab) => {
                                            const count = reportCounts[tab.key];
                                            const selected = activeTab === tab.key;
                                            return (_jsxs("button", { onClick: () => setActiveTab(tab.key), className: `flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold transition ${selected ? "bg-white text-[#0b7ad7] shadow" : "text-slate-500"}`, type: "button", children: [tab.label, _jsx("span", { className: "rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-[#0b7ad7]", children: count })] }, tab.key));
                                        }) }), _jsxs("div", { className: "flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end", children: [_jsxs("label", { className: "flex w-full max-w-xs items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-inner", children: [_jsx("span", { className: "whitespace-nowrap text-xs font-semibold uppercase tracking-[0.28em] text-slate-400", children: "Search" }), _jsx("input", { value: query, onChange: (event) => setQuery(event.target.value), placeholder: "Student or focus", className: "w-full bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none" })] }), _jsx("button", { className: "inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-100", children: "Filter" })] })] })] }), _jsx("div", { className: "mt-6 grid gap-4 md:grid-cols-2", children: filteredReports.map((report) => (_jsxs("article", { className: "flex flex-col justify-between rounded-3xl border border-white/70 bg-white/80 p-5 shadow-sm shadow-slate-900/10 transition hover:-translate-y-0.5 hover:shadow-lg", children: [_jsxs("div", { className: "flex items-start gap-4", children: [_jsx("div", { className: `h-20 w-24 shrink-0 rounded-2xl bg-gradient-to-br ${report.accent}` }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-slate-900", children: report.name }), _jsxs("p", { className: "text-xs text-slate-500", children: [report.age, " \u00B7 ", report.subject] })] }), _jsx(StatusBadge, { status: report.status })] }), _jsxs("div", { className: "mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600", children: [_jsx("span", { className: "rounded-full bg-slate-100 px-3 py-1 font-semibold text-[#0b7ad7]", children: report.lessonType }), _jsx("span", { children: report.strand })] }), _jsxs("p", { className: "mt-3 text-sm text-slate-600", children: ["Last class: ", report.lastUpdated] })] })] }), _jsxs("div", { className: "mt-4 flex items-center justify-between gap-3", children: [_jsx("button", { className: "rounded-full bg-[#0b7ad7] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#0b7ad7]/30 transition hover:bg-[#0b6ac0]", children: report.status === "reviewed" ? "View report" : "Fill report" }), _jsx("p", { className: "text-xs text-slate-500", children: "Updated via Learning Manager" })] })] }, report.id))) }), filteredReports.length === 0 && (_jsx("div", { className: "mt-6 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500", children: "Nothing in this state right now. Try another filter or clear the search." }))] }), _jsxs("section", { id: "class-flow", className: "rounded-3xl border border-white/70 bg-white/85 p-6 shadow-xl shadow-slate-900/8", children: [_jsxs("div", { className: "flex flex-col gap-2", children: [_jsx("h2", { className: "text-xl font-semibold text-slate-900", children: "Today's class flow" }), _jsx("p", { className: "text-sm text-slate-600", children: "Attendance, focus, and quick actions stream straight into Learning Manager updates." })] }), _jsx("div", { className: "mt-6 space-y-4", children: DAY_CLASSES.map((lesson) => (_jsxs("article", { className: "rounded-3xl border border-white/60 bg-white/70 p-5 shadow-sm", children: [_jsxs("header", { className: "flex flex-wrap items-center justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-slate-900", children: lesson.learner }), _jsx("p", { className: "text-xs uppercase tracking-[0.22em] text-[#0b7ad7]", children: lesson.programme })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#0b7ad7]", children: lesson.time }), _jsx("span", { className: "rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700", children: lesson.status })] })] }), _jsxs("p", { className: "mt-3 text-sm text-slate-600", children: ["Focus: ", lesson.focus] }), _jsx("div", { className: "mt-4 flex flex-wrap gap-2", children: lesson.actions.map((action) => (_jsx("button", { className: "rounded-full border border-[#0b7ad7]/30 bg-white px-4 py-2 text-xs font-semibold text-[#0b7ad7] shadow-sm transition hover:bg-[#0b7ad7]/10", type: "button", children: action }, action))) })] }, `${lesson.learner}-${lesson.time}`))) })] })] }));
}
//# sourceMappingURL=TeacherPortal.js.map