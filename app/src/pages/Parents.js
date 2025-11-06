import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useMemo, useState } from "react";
import DashboardShell from "../components/dashboard/DashboardShell";
import { buildNavItems } from "../components/dashboard/navItems";
const PROGRAMME_SUMMARIES = [
    {
        id: "phonics",
        name: "Phonics Foundations",
        accent: "from-[#fee2b6] to-[#fbbf24]",
        summary: "Letter-sound mastery, blending fluency, and expressive reading.",
        quickStats: [
            { label: "Sound mastery", value: "92%", helper: "Completed 24 / 26 focus sounds" },
            { label: "Practice streak", value: "5 days", helper: "Home activity streak" },
        ],
        progress: [
            { label: "SATPIN + next sets", value: 95 },
            { label: "Digraph discovery", value: 72 },
            { label: "Story retell", value: 80 },
        ],
        milestone: "Practise voice modulation for expressive reading",
    },
    {
        id: "grammar",
        name: "Grammar & Writing Lab",
        accent: "from-[#d9e9ff] to-[#60a5fa]",
        summary: "Sentence craft, punctuation practice, and confident drafting.",
        quickStats: [
            { label: "Grammar accuracy", value: "87%", helper: "Last 5 submissions" },
            { label: "Draft feedback", value: "4 notes", helper: "Voice notes this week" },
        ],
        progress: [
            { label: "Sentence expansion", value: 84 },
            { label: "Punctuation mastery", value: 68 },
            { label: "Editing skills", value: 76 },
        ],
        milestone: "Draft persuasive letter #1 ready for teacher comments",
    },
    {
        id: "speaking",
        name: "Public Speaking Studio",
        accent: "from-[#e0e7ff] to-[#6366f1]",
        summary: "Storytelling, voice modulation, and stage confidence drills.",
        quickStats: [
            { label: "Confidence score", value: "4.8 / 5", helper: "Self + coach rating" },
            { label: "Video library", value: "9 clips", helper: "Feedback tagged recordings" },
        ],
        progress: [
            { label: "Voice modulation", value: 78 },
            { label: "Story structure", value: 88 },
            { label: "Audience Q&A", value: 65 },
        ],
        milestone: "Practise quick bridging statements for Q&A",
    },
];
const HOMEWORK_QUEUE = [
    {
        id: "class-19",
        title: "Class #19",
        subject: "English · Pronunciation",
        duration: "30 mins",
        date: "6 February 2024 · 6:15 pm — 7:00 pm",
        coach: "Aaminah Khan",
        status: "Completed",
    },
    {
        id: "class-27",
        title: "Class #27",
        subject: "English · Pronunciation",
        duration: "30 mins",
        date: "9 February 2024 · 5:30 pm — 6:00 pm",
        coach: "Aaminah Khan",
        status: "Pending review",
    },
    {
        id: "class-29",
        title: "Class #29",
        subject: "English · Pronunciation",
        duration: "30 mins",
        date: "13 February 2024 · 5:30 pm — 6:00 pm",
        coach: "Aaminah Khan",
        status: "Uploaded",
    },
];
const UPCOMING_EVENTS = [
    {
        id: "debate",
        title: "Confidence circle — debate",
        timing: "Thu · 7:30 PM · Online",
        focus: "Quick rebuttal rounds",
    },
    {
        id: "showcase",
        title: "Showcase rehearsal",
        timing: "Sun · 11:00 AM · Studio",
        focus: "Stage blocking & mic cues",
    },
    {
        id: "portfolio",
        title: "Portfolio review call",
        timing: "Sat · 4:00 PM · Virtual",
        focus: "Share rubric insights",
    },
];
const FEE_STATUS = {
    badge: "Due soon",
    amount: "₹1,050 · 3 classes left",
    detail: "Learning Manager will confirm the top-up reminder on Thursday.",
};
const MONTHLY_HIGHLIGHTS = [
    "Kavya mastered sh/ch digraphs and can explain tricky words independently.",
    "Aarav edited dialogue tags accurately using question mark pause practice.",
    "Riya’s voice projection improved; showcase clip shared with you on portal.",
];
const CONTACT_INFO = [
    { label: "Learning Manager", value: "Saanvi Gupta · +91 98200 11234" },
    { label: "Email", value: "support@tinysteps.in" },
];
function ProgressBar({ value }) {
    return (_jsx("div", { className: "h-2 w-full overflow-hidden rounded-full bg-slate-100", children: _jsx("div", { className: "h-full rounded-full bg-[#0b7ad7]", style: { width: `${value}%` } }) }));
}
export default function Parents() {
    const [activeTab, setActiveTab] = useState("progress");
    const [programmeFilter, setProgrammeFilter] = useState("all");
    const pendingHomework = HOMEWORK_QUEUE.filter((item) => item.status !== "Completed").length;
    const scrollToId = useCallback((id) => {
        return () => {
            const el = document.getElementById(id);
            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        };
    }, []);
    const navItems = useMemo(() => buildNavItems("parents", {
        includeKeys: ["parents", "homework", "kids"],
        overrides: {
            parents: {
                label: "Family dashboard",
                badge: `${PROGRAMME_SUMMARIES.length}`,
                onSelect: scrollToId("learning-overview"),
            },
            homework: {
                label: "Homework log",
                badge: pendingHomework ? `${pendingHomework}` : undefined,
                onSelect: scrollToId("daily-updates"),
            },
            kids: { label: "Kids arena", href: "/roles/kids" },
        },
    }), [pendingHomework, scrollToId]);
    const filteredProgrammes = useMemo(() => {
        if (programmeFilter === "all")
            return PROGRAMME_SUMMARIES;
        return PROGRAMME_SUMMARIES.filter((programme) => programme.id === programmeFilter);
    }, [programmeFilter]);
    const headerToolbar = (_jsxs("div", { className: "flex flex-col gap-2 sm:flex-row sm:items-center", children: [_jsx("button", { className: "inline-flex items-center justify-center rounded-full border border-[#0b7ad7]/20 bg-white px-4 py-2 text-sm font-semibold text-[#0b7ad7] shadow-sm shadow-[#0b7ad7]/10 transition hover:bg-[#0b7ad7]/10", children: "Download monthly summary" }), _jsx("button", { className: "inline-flex items-center justify-center rounded-full bg-[#0b7ad7] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#0b7ad7]/30 transition hover:bg-[#0b6ac0]", children: "Message Learning Manager" })] }));
    const rightRail = (_jsxs(_Fragment, { children: [_jsxs("section", { className: "rounded-3xl border border-[#0b7ad7]/10 bg-white p-6 shadow-xl shadow-slate-900/8", children: [_jsx("h2", { className: "text-base font-semibold text-slate-900", children: "Fee status" }), _jsxs("div", { className: "mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600", children: [_jsx("span", { className: "inline-flex items-center gap-2 rounded-full bg-[#fee2b6] px-3 py-1 text-xs font-semibold text-[#b45309]", children: FEE_STATUS.badge }), _jsx("p", { className: "mt-3 text-base font-semibold text-slate-900", children: FEE_STATUS.amount }), _jsx("p", { className: "mt-2 text-xs text-slate-500", children: FEE_STATUS.detail })] })] }), _jsxs("section", { className: "rounded-3xl border border-[#0b7ad7]/10 bg-white p-6 shadow-xl shadow-slate-900/8", children: [_jsx("h2", { className: "text-base font-semibold text-slate-900", children: "Monthly highlights" }), _jsx("ul", { className: "mt-4 space-y-3 text-sm text-slate-600", children: MONTHLY_HIGHLIGHTS.map((item) => (_jsx("li", { className: "rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3", children: item }, item))) })] }), _jsxs("section", { className: "rounded-3xl border border-[#0b7ad7]/10 bg-white p-6 shadow-xl shadow-slate-900/8", children: [_jsx("h2", { className: "text-base font-semibold text-slate-900", children: "Need help?" }), _jsx("ul", { className: "mt-4 space-y-3 text-sm text-slate-600", children: CONTACT_INFO.map((row) => (_jsxs("li", { className: "rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.22em] text-[#0b7ad7]", children: row.label }), _jsx("p", { className: "mt-1 text-sm text-slate-600", children: row.value })] }, row.label))) })] })] }));
    return (_jsxs(DashboardShell, { navItems: navItems, header: {
            title: "Family dashboard",
            subtitle: "Track progress, homework, and upcoming events. Learning Managers coordinate every update so you never miss a milestone.",
            toolbar: headerToolbar,
        }, rightRail: rightRail, children: [_jsxs("section", { id: "learning-overview", className: "rounded-3xl border border-white/70 bg-white/85 p-6 shadow-xl shadow-slate-900/8", children: [_jsxs("div", { className: "flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold text-slate-900", children: "Learning overview" }), _jsx("p", { className: "mt-1 text-sm text-slate-600", children: "Choose a programme to view detailed progress and milestones." })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx("button", { onClick: () => setProgrammeFilter("all"), className: `rounded-full px-4 py-2 text-sm font-semibold transition ${programmeFilter === "all" ? "bg-[#0b7ad7] text-white shadow" : "bg-slate-100 text-slate-600"}`, type: "button", children: "All programmes" }), PROGRAMME_SUMMARIES.map((programme) => (_jsx("button", { onClick: () => setProgrammeFilter(programme.id), className: `rounded-full px-4 py-2 text-sm font-semibold transition ${programmeFilter === programme.id ? "bg-[#0b7ad7] text-white shadow" : "bg-slate-100 text-slate-600"}`, type: "button", children: programme.name }, programme.id)))] })] }), _jsx("div", { className: "mt-6 grid gap-4 md:grid-cols-2", children: filteredProgrammes.map((programme) => (_jsxs("article", { className: "flex flex-col gap-4 rounded-3xl border border-white/70 bg-white/85 p-5 shadow-sm shadow-slate-900/10 transition hover:-translate-y-0.5 hover:shadow-lg", children: [_jsxs("div", { className: "flex items-start gap-4", children: [_jsx("div", { className: `h-20 w-24 shrink-0 rounded-2xl bg-gradient-to-br ${programme.accent}` }), _jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "text-lg font-semibold text-slate-900", children: programme.name }), _jsx("p", { className: "mt-1 text-sm text-slate-600", children: programme.summary })] })] }), _jsx("div", { className: "grid gap-3 sm:grid-cols-2", children: programme.quickStats.map((stat) => (_jsxs("div", { className: "rounded-2xl border border-white/60 bg-white/70 px-4 py-3", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.22em] text-[#0b7ad7]", children: stat.label }), _jsx("p", { className: "mt-2 text-lg font-semibold text-slate-900", children: stat.value }), _jsx("p", { className: "mt-1 text-xs text-slate-500", children: stat.helper })] }, stat.label))) }), _jsx("div", { className: "space-y-3", children: programme.progress.map((skill) => (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between text-xs text-slate-500", children: [_jsx("span", { children: skill.label }), _jsxs("span", { className: "font-semibold text-slate-700", children: [skill.value, "%"] })] }), _jsx(ProgressBar, { value: skill.value })] }, skill.label))) }), _jsxs("div", { className: "rounded-2xl bg-white/70 px-4 py-3 text-sm text-slate-600", children: [_jsx("span", { className: "text-xs font-semibold uppercase tracking-[0.22em] text-[#0b7ad7]", children: "Current focus" }), _jsx("p", { className: "mt-1", children: programme.milestone })] })] }, programme.id))) })] }), _jsxs("section", { id: "daily-updates", className: "rounded-3xl border border-white/70 bg-white/85 p-6 shadow-xl shadow-slate-900/8", children: [_jsxs("div", { className: "flex flex-col gap-4 md:flex-row md:items-center md:justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold text-slate-900", children: "Daily updates" }), _jsx("p", { className: "mt-1 text-sm text-slate-600", children: "Switch between progress notes, homework timelines, and upcoming events." })] }), _jsx("div", { className: "flex rounded-full bg-white/70 p-1 shadow-inner shadow-slate-900/5", children: ["progress", "homework", "updates"].map((tab) => {
                                    const selected = activeTab === tab;
                                    const label = tab === "progress" ? "Progress" : tab === "homework" ? "Homework" : "Updates";
                                    return (_jsx("button", { onClick: () => setActiveTab(tab), className: `rounded-full px-4 py-1.5 text-sm font-semibold transition ${selected ? "bg-white text-[#0b7ad7] shadow" : "text-slate-500"}`, type: "button", children: label }, tab));
                                }) })] }), activeTab === "progress" && (_jsx("div", { className: "mt-6 space-y-4 text-sm text-slate-600", children: MONTHLY_HIGHLIGHTS.map((highlight) => (_jsx("div", { className: "rounded-3xl border border-white/60 bg-white/75 px-5 py-4 text-slate-700 shadow-sm", children: highlight }, highlight))) })), activeTab === "homework" && (_jsx("div", { className: "mt-6 space-y-4", children: HOMEWORK_QUEUE.map((task) => (_jsxs("article", { className: "rounded-3xl border border-white/60 bg-white/80 p-5 shadow-sm", children: [_jsxs("header", { className: "flex flex-wrap items-center justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-slate-900", children: task.title }), _jsx("p", { className: "text-sm text-slate-600", children: task.subject })] }), _jsx("span", { className: `rounded-full px-3 py-1 text-xs font-semibold ${task.status === "Completed"
                                                ? "bg-[#dcfce7] text-[#047857]"
                                                : task.status === "Uploaded"
                                                    ? "bg-[#e0e7ff] text-[#4338ca]"
                                                    : "bg-[#fee2b6] text-[#b45309]"}`, children: task.status })] }), _jsx("p", { className: "mt-3 text-sm text-slate-600", children: task.date }), _jsxs("div", { className: "mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500", children: [_jsx("span", { className: "rounded-full bg-white px-3 py-1 font-semibold text-[#0b7ad7]", children: task.duration }), _jsxs("span", { children: ["Coach \u00B7 ", task.coach] })] })] }, task.id))) })), activeTab === "updates" && (_jsx("div", { className: "mt-6 grid gap-4 md:grid-cols-3", children: UPCOMING_EVENTS.map((event) => (_jsxs("article", { className: "rounded-3xl border border-white/60 bg-white/80 p-5 shadow-sm", children: [_jsx("h3", { className: "text-base font-semibold text-slate-900", children: event.title }), _jsx("p", { className: "mt-2 text-sm text-slate-600", children: event.timing }), _jsx("p", { className: "mt-2 text-xs uppercase tracking-[0.22em] text-[#7c2d58]", children: "Focus" }), _jsx("p", { className: "mt-1 text-sm text-slate-600", children: event.focus })] }, event.id))) }))] })] }));
}
//# sourceMappingURL=Parents.js.map