import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { CURRICULUM } from "../data/curriculum";
const TRACK_STYLES = {
    phonics: {
        headerBg: "bg-gradient-to-r from-[#fbe7ff] via-[#f4ecff] to-[#e3f4ff]",
        chipBg: "bg-[#fdf4ff] text-[#a855f7]",
        chipText: "text-[#a855f7]",
        unitBg: "bg-[#fdf4ff]/80",
        accentBorder: "border-[#f5d7ff]",
    },
    grammar: {
        headerBg: "bg-gradient-to-r from-[#e7f3ff] via-[#f0f8ff] to-[#fef6ff]",
        chipBg: "bg-[#ebf4ff] text-[#2563eb]",
        chipText: "text-[#2563eb]",
        unitBg: "bg-[#f0f6ff]",
        accentBorder: "border-[#cfe0ff]",
    },
    speaking: {
        headerBg: "bg-gradient-to-r from-[#f4e7ff] via-[#f8eaff] to-[#eaf5ff]",
        chipBg: "bg-[#f7edff] text-[#7c3aed]",
        chipText: "text-[#7c3aed]",
        unitBg: "bg-[#f5f0ff]",
        accentBorder: "border-[#dcc7ff]",
    },
};
const FILTER_LABELS = {
    phonics: "Phonics",
    grammar: "Grammar",
    speaking: "Public Speaking",
};
export default function Curriculum() {
    const [activeTrack, setActiveTrack] = useState("all");
    const tracksToRender = activeTrack === "all" ? CURRICULUM : CURRICULUM.filter((track) => track.id === activeTrack);
    const [expandedLevels, setExpandedLevels] = useState({});
    const currentLevelIds = useMemo(() => tracksToRender.flatMap((track) => track.levels.map((level) => level.id)), [tracksToRender]);
    const handleSelectTrack = (trackId) => {
        setActiveTrack(trackId);
        if (trackId !== "all") {
            const el = document.getElementById(trackId);
            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        }
        else {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };
    const toggleLevel = (levelId) => {
        setExpandedLevels((prev) => {
            const explicit = prev[levelId];
            const defaultExpanded = activeTrack !== "all";
            const current = explicit ?? defaultExpanded;
            return { ...prev, [levelId]: !current };
        });
    };
    const setAllLevels = (value) => {
        setExpandedLevels((prev) => {
            const next = { ...prev };
            currentLevelIds.forEach((id) => {
                next[id] = value;
            });
            return next;
        });
    };
    return (_jsxs("div", { className: "bg-gradient-to-br from-[#f5f0ff] via-white to-[#eaf5ff] scroll-smooth", children: [_jsx("section", { className: "bg-gradient-to-br from-[#ede7ff] via-[#f8edff] to-[#eaf6ff]", children: _jsxs("div", { className: "mx-auto max-w-6xl px-4 py-20 text-center", children: [_jsx("p", { className: "mx-auto inline-flex items-center gap-2 rounded-full border border-[#ffb38d] bg-white/60 px-4 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-[#d94b03]", children: "Curriculum" }), _jsx("h1", { className: "mt-5 text-4xl font-black tracking-tight text-[#0f172a] sm:text-5xl", children: "Tiny Steps Master Curriculum" }), _jsx("p", { className: "mx-auto mt-4 max-w-3xl text-lg text-gray-700 sm:text-xl", children: "Every one-to-one journey maps foundations, fluency, and mastery through clear levels, teacher logging, and parent dashboards\u2014with a communication-first mindset so children speak, write, and present confidently in a competitive world." }), _jsx("p", { className: "mx-auto mt-3 max-w-3xl text-sm uppercase tracking-[0.28em] text-gray-500", children: "Ages 3\u201312 \u00B7 Listening \u00B7 Reading \u00B7 Writing \u00B7 Speaking" })] }) }), _jsx("div", { className: "mx-auto max-w-6xl px-4 py-10", children: _jsxs("div", { className: "rounded-3xl border border-gray-100 bg-[#fafafa] p-6 shadow-inner shadow-gray-200/60", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-4", children: [_jsx("p", { className: "text-sm font-semibold text-[#d94b03]", children: "Jump to a track" }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx("button", { type: "button", onClick: () => handleSelectTrack("all"), className: `rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] transition ${activeTrack === "all" ? "bg-[#d94b03] text-white" : "bg-white text-[#d94b03] hover:bg-[#ffe3d1]"}`, "aria-pressed": activeTrack === "all", children: "View all" }), CURRICULUM.map((track) => (_jsx("button", { type: "button", onClick: () => handleSelectTrack(track.id), className: `rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] transition ${activeTrack === track.id ? "bg-[#0f172a] text-white" : "bg-white text-[#0f172a] hover:bg-[#e9efff]"}`, "aria-pressed": activeTrack === track.id, children: FILTER_LABELS[track.id] }, track.id)))] })] }), _jsx("div", { className: "mt-6 flex flex-wrap gap-3 text-xs font-semibold text-[#0f172a]", children: CURRICULUM.map((track) => (_jsxs("a", { href: `#${track.id}`, className: "rounded-full border border-[#bfd0ff] bg-white px-3 py-1 text-[#273371] hover:bg-[#f4f7ff]", children: [FILTER_LABELS[track.id], " Track"] }, track.id))) }), _jsxs("div", { className: "mt-4 flex flex-wrap gap-3 text-xs font-semibold text-[#0f172a]", children: [_jsx("button", { type: "button", onClick: () => setAllLevels(true), className: "rounded-full border border-[#bfd0ff] bg-white px-3 py-2 uppercase tracking-[0.22em] hover:bg-[#f4f7ff]", children: "Expand all levels" }), _jsx("button", { type: "button", onClick: () => setAllLevels(false), className: "rounded-full border border-[#ffb88a] bg-white px-3 py-2 uppercase tracking-[0.22em] hover:bg-[#ffe3d1]", children: "Collapse all" })] })] }) }), _jsx("div", { className: "mx-auto max-w-6xl px-4 pb-16 space-y-16", children: tracksToRender.map((track) => (_jsxs("section", { id: track.id, className: "space-y-8 scroll-mt-24", children: [_jsxs("header", { className: `rounded-3xl border border-gray-100 ${TRACK_STYLES[track.id].headerBg} p-8 shadow-xl shadow-gray-200/60 transition hover:-translate-y-1`, children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.3em] text-[#0f172a]/70", children: track.ageRange }), _jsx("h2", { className: "mt-2 text-3xl font-bold text-[#0f172a]", children: track.title }), _jsx("p", { className: "mt-4 text-lg text-gray-700", children: track.focus }), _jsx("div", { className: "mt-5 flex flex-wrap gap-2 text-xs font-semibold text-[#d94b03]", children: track.pathway.map((phase) => (_jsx("span", { className: `rounded-full border ${TRACK_STYLES[track.id].accentBorder} ${TRACK_STYLES[track.id].chipBg} px-3 py-1`, children: phase }, phase))) }), _jsx("ul", { className: "mt-6 grid gap-3 text-sm text-gray-600 md:grid-cols-3", children: track.deliveryNotes.map((note, idx) => (_jsx("li", { className: "rounded-2xl border border-white bg-white p-4 shadow-sm shadow-[#ffe0c8]/40", children: note }, idx))) })] }), _jsx("div", { className: "space-y-10", children: track.levels.map((level) => (_jsxs("article", { className: "rounded-3xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-200/50", children: [_jsxs("div", { className: "flex flex-col gap-4 md:flex-row md:items-start md:justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.3em] text-[#d94b03]", children: level.ageRange }), _jsx("h3", { className: "mt-1 text-2xl font-bold text-[#0f172a]", children: level.title }), _jsx("p", { className: "mt-2 max-w-2xl text-sm text-gray-600", children: level.summary })] }), _jsxs("button", { type: "button", onClick: () => toggleLevel(level.id), className: "inline-flex items-center gap-2 rounded-full border border-[#ffb88a] bg-[#fff3eb] px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#d94b03] transition hover:-translate-y-px hover:bg-[#ffd6b8]", children: ["Mastery Stage", _jsx("span", { "aria-hidden": "true", children: (expandedLevels[level.id] ?? activeTrack !== "all") ? "−" : "+" })] })] }), _jsx("p", { className: "mt-3 text-xs uppercase tracking-[0.28em] text-gray-500", children: (expandedLevels[level.id] ?? activeTrack !== "all")
                                            ? "Showing focus areas and skills"
                                            : "Tap to expand focus areas and skills" }), (expandedLevels[level.id] ?? activeTrack !== "all") && (_jsx("div", { className: "mt-6 grid gap-6 md:grid-cols-2", children: level.units.map((unit) => (_jsxs("div", { className: `rounded-2xl border ${TRACK_STYLES[track.id].accentBorder} ${TRACK_STYLES[track.id].unitBg} p-5 shadow-inner shadow-gray-200/40`, children: [_jsx("h4", { className: "text-lg font-semibold text-[#0f172a]", children: unit.title }), _jsx("p", { className: "mt-2 text-sm text-gray-600", children: unit.summary }), _jsx("ul", { className: "mt-4 space-y-2 text-sm text-gray-700", children: unit.skills.map((skill) => (_jsxs("li", { className: "rounded-xl bg-white/90 px-3 py-2 shadow-sm shadow-gray-200/60 transition hover:-translate-y-0.5 hover:shadow-lg", children: [_jsx("p", { className: "font-semibold text-[#0f172a]", children: skill.title }), _jsx("p", { className: "text-xs text-gray-500", children: skill.description }), skill.notes && _jsx("p", { className: "mt-1 text-xs text-gray-500", children: skill.notes })] }, skill.id))) })] }, unit.id))) }))] }, level.id))) })] }, track.id))) })] }));
}
//# sourceMappingURL=Curriculum.js.map