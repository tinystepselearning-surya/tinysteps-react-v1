import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardShell from "../../components/dashboard/DashboardShell";
import { buildNavItems } from "../../components/dashboard/navItems";
const GAME_LIBRARY = [
    {
        id: "spellbee-grade1",
        title: "Spellbee Words · Grade 1",
        level: "Grade 1",
        duration: "8 mins",
        description: "Use context clues and glowing hints to spell Grade 1 reading words correctly.",
        badge: "Just added",
        launchHref: "/games/spellbee-grade1",
        launchLabel: "Launch Spellbee challenge",
    },
    {
        id: "phonics-safari",
        title: "Phonics Safari",
        level: "Ages 5-7",
        duration: "10 mins",
        description: "Match letter sounds to friendly jungle animals and unlock the secret word.",
        badge: "New",
    },
    {
        id: "grammar-galaxy",
        title: "Grammar Galaxy",
        level: "Ages 8-10",
        duration: "12 mins",
        description: "Fix spaceship sentences and collect star coins for correctly placed punctuation.",
        badge: "Top pick",
    },
    {
        id: "speech-quest",
        title: "Speech Quest",
        level: "Ages 9-12",
        duration: "8 mins",
        description: "Practise storytelling prompts and earn applause by recording your best opening lines.",
    },
];
const WORKSHEETS = [
    {
        id: "blends-pack",
        title: "Blend Busters Pack",
        focus: "Phonics · sh, ch, th",
        pages: 6,
        format: "Printable + interactive",
    },
    {
        id: "dialogue-tags",
        title: "Dialogue Tags Detective",
        focus: "Grammar · punctuation",
        pages: 4,
        format: "PDF + audio guide",
    },
    {
        id: "debate-cards",
        title: "Debate Sparks Cards",
        focus: "Public speaking · quick rebuttals",
        pages: 5,
        format: "Flip cards",
    },
];
const STORY_LIBRARY = [
    {
        id: "rainbow-rocket",
        title: "Rainbow Rocket",
        author: "Tiny Steps Originals",
        length: "6 min read",
        theme: "Confidence & curiosity",
    },
    {
        id: "milo-manners",
        title: "Milo and the Magic Manners",
        author: "Coach Aaminah",
        length: "8 min read",
        theme: "Empathy & friendship",
    },
    {
        id: "lost-letter",
        title: "The Case of the Lost Letter",
        author: "Coach Ravi",
        length: "10 min read",
        theme: "Creative writing mystery",
    },
];
const LIVE_SESSIONS = [
    {
        id: "junior-club",
        title: "Junior Reading Club",
        time: "Tue · 5:30 PM",
        coach: "Coach Kavya",
        detail: "Read aloud your favourite page and play expression bingo.",
    },
    {
        id: "story-lab",
        title: "Story Lab Workshop",
        time: "Thu · 6:00 PM",
        coach: "Coach Riya",
        detail: "Create a mini-comic with characters, setting, and a wow ending.",
    },
    {
        id: "confidence-circle",
        title: "Confidence Circle",
        time: "Sat · 11:00 AM",
        coach: "Coach Aarav",
        detail: "Join a fun improv game to practise quick-thinking responses.",
    },
];
export default function KidsPortal() {
    const [activeTab, setActiveTab] = useState("games");
    const [selectedGame, setSelectedGame] = useState(GAME_LIBRARY[0].id);
    const navigate = useNavigate();
    useEffect(() => {
        if (typeof window === "undefined")
            return;
        const role = window.sessionStorage.getItem("tinysteps-role");
        if (role !== "kids") {
            navigate("/login/kids", { replace: true });
        }
    }, [navigate]);
    const scrollToId = useCallback((id) => {
        return () => {
            const el = document.getElementById(id);
            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        };
    }, []);
    const navItems = useMemo(() => buildNavItems("kids", {
        includeKeys: ["kids", "parents", "homework"],
        overrides: {
            kids: { label: "Kids arena", badge: "Fun", onSelect: scrollToId("kids-adventure") },
            parents: { label: "Family dashboard", href: "/parents" },
            homework: { label: "Practice hub", onSelect: scrollToId("kids-adventure") },
        },
    }), [scrollToId]);
    const selectedGameData = useMemo(() => GAME_LIBRARY.find((game) => game.id === selectedGame) ?? GAME_LIBRARY[0], [selectedGame]);
    const headerToolbar = (_jsxs("div", { className: "flex flex-col gap-2 sm:flex-row sm:items-center", children: [_jsx("button", { className: "inline-flex items-center justify-center rounded-full border border-[#7c2d58]/30 bg-white/90 px-4 py-2 text-sm font-semibold text-[#7c2d58] shadow-sm shadow-[#7c2d58]/15 transition hover:bg-[#7c2d58]/10", children: "Download activity pack" }), _jsx("button", { className: "inline-flex items-center justify-center rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#2563eb]/30 transition hover:bg-[#1d4ed8]", children: "Join live club" })] }));
    return (_jsx(DashboardShell, { navItems: navItems, header: {
            title: "Kids play & learn hub",
            subtitle: "Pick a quick game, download worksheets, or hop into a live class. Everything is curated for short, joyful practice.",
            toolbar: headerToolbar,
        }, children: _jsxs("section", { id: "kids-adventure", className: "rounded-3xl border border-white/70 bg-white/85 p-6 shadow-xl shadow-slate-900/8", children: [_jsxs("div", { className: "flex flex-col gap-4 md:flex-row md:items-center md:justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold text-slate-900", children: "Choose your adventure" }), _jsx("p", { className: "mt-1 text-sm text-slate-600", children: "Switch tabs to explore mini-games, printable worksheets, storybooks, or join a live club." })] }), _jsx("div", { className: "flex rounded-full bg-white/70 p-1 shadow-inner shadow-slate-900/5", children: ["games", "worksheets", "stories", "live"].map((tab) => {
                                const label = tab === "games"
                                    ? "Games"
                                    : tab === "worksheets"
                                        ? "Worksheets"
                                        : tab === "stories"
                                            ? "Story books"
                                            : "Live clubs";
                                const selected = activeTab === tab;
                                return (_jsx("button", { type: "button", onClick: () => setActiveTab(tab), className: `rounded-full px-4 py-1.5 text-sm font-semibold transition ${selected ? "bg-white text-[#2563eb] shadow" : "text-slate-500"}`, children: label }, tab));
                            }) })] }), activeTab === "games" && (_jsxs("div", { className: "mt-6 grid gap-4 lg:grid-cols-[1.4fr,1fr]", children: [_jsx("div", { className: "space-y-4", children: GAME_LIBRARY.map((game) => {
                                const selected = selectedGame === game.id;
                                return (_jsx("button", { type: "button", onClick: () => setSelectedGame(game.id), className: `w-full rounded-3xl border px-5 py-5 text-left transition ${selected
                                        ? "border-[#2563eb]/60 bg-white shadow-lg shadow-[#2563eb]/10"
                                        : "border-white/60 bg-white/80 shadow-sm hover:border-[#2563eb]/30"}`, children: _jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-slate-900", children: game.title }), _jsx("p", { className: "mt-1 text-sm text-slate-600", children: game.description }), _jsxs("div", { className: "mt-3 flex flex-wrap gap-2 text-xs text-slate-500", children: [_jsx("span", { className: "rounded-full bg-[#2563eb]/10 px-3 py-1 font-semibold text-[#2563eb]", children: game.level }), _jsx("span", { className: "rounded-full bg-[#7c2d58]/10 px-3 py-1 font-semibold text-[#7c2d58]", children: game.duration })] })] }), game.badge && (_jsx("span", { className: "rounded-full bg-[#f472b6]/10 px-3 py-1 text-xs font-semibold text-[#be185d]", children: game.badge }))] }) }, game.id));
                            }) }), _jsxs("aside", { className: "rounded-3xl border border-white/60 bg-white/85 p-5 shadow-inner shadow-slate-900/10", children: [_jsx("h3", { className: "text-sm font-semibold uppercase tracking-[0.22em] text-[#2563eb]", children: "How to play" }), selectedGameData && (_jsxs("div", { className: "mt-4 space-y-3 text-sm text-slate-600", children: [_jsxs("p", { children: ["Launch ", _jsx("strong", { children: selectedGameData.title }), " on a tablet or laptop. Use headphones if you want a quieter space."] }), _jsxs("p", { children: ["Complete the challenge in under ", selectedGameData.duration, ". Screenshots of your score go straight to your Learning Manager."] }), _jsx("p", { className: "rounded-2xl bg-[#2563eb]/10 px-4 py-3 text-[#1d4ed8]", children: "Tip: replay the level to beat your personal best and unlock bonus stickers." }), selectedGameData.launchHref && (_jsx(Link, { to: selectedGameData.launchHref, className: "inline-flex items-center justify-center rounded-full bg-[#2563eb] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-[#2563eb]/30 transition hover:bg-[#1d4ed8]", children: selectedGameData.launchLabel ?? "Open game" }))] }))] })] })), activeTab === "worksheets" && (_jsx("div", { className: "mt-6 grid gap-4 md:grid-cols-3", children: WORKSHEETS.map((sheet) => (_jsxs("article", { className: "rounded-3xl border border-white/60 bg-white/80 p-5 shadow-sm", children: [_jsx("h3", { className: "text-base font-semibold text-slate-900", children: sheet.title }), _jsx("p", { className: "mt-2 text-sm text-slate-600", children: sheet.focus }), _jsx("p", { className: "mt-3 text-xs uppercase tracking-[0.22em] text-[#7c2d58]", children: sheet.format }), _jsxs("p", { className: "mt-1 text-xs text-slate-500", children: [sheet.pages, " pages"] }), _jsx("button", { className: "mt-4 inline-flex items-center justify-center rounded-full bg-[#2563eb] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-[#2563eb]/30 transition hover:bg-[#1d4ed8]", children: "Download" })] }, sheet.id))) })), activeTab === "stories" && (_jsx("div", { className: "mt-6 space-y-4", children: STORY_LIBRARY.map((story) => (_jsxs("article", { className: "rounded-3xl border border-white/60 bg-white/80 p-5 shadow-sm", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-base font-semibold text-slate-900", children: story.title }), _jsxs("p", { className: "text-sm text-slate-600", children: ["By ", story.author] })] }), _jsx("span", { className: "rounded-full bg-[#f9a8d4]/20 px-3 py-1 text-xs font-semibold text-[#be185d]", children: story.theme })] }), _jsx("p", { className: "mt-3 text-sm text-slate-600", children: story.length }), _jsx("button", { className: "mt-3 inline-flex items-center justify-center rounded-full border border-[#2563eb]/30 bg-white px-4 py-2 text-xs font-semibold text-[#2563eb] shadow-sm transition hover:bg-[#2563eb]/10", children: "Read online" })] }, story.id))) })), activeTab === "live" && (_jsx("div", { className: "mt-6 grid gap-4 md:grid-cols-3", children: LIVE_SESSIONS.map((session) => (_jsxs("article", { className: "rounded-3xl border border-white/60 bg-white/80 p-5 shadow-sm", children: [_jsx("h3", { className: "text-base font-semibold text-slate-900", children: session.title }), _jsx("p", { className: "mt-2 text-sm text-slate-600", children: session.detail }), _jsx("p", { className: "mt-3 text-xs uppercase tracking-[0.22em] text-[#2563eb]", children: session.time }), _jsxs("p", { className: "mt-1 text-xs text-slate-500", children: ["Coach ", session.coach] }), _jsx("button", { className: "mt-4 inline-flex items-center justify-center rounded-full bg-[#7c2d58] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-[#7c2d58]/30 transition hover:bg-[#661f47]", children: "Reserve my seat" })] }, session.id))) }))] }) }));
}
//# sourceMappingURL=KidsPortal.js.map