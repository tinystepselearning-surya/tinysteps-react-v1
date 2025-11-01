import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const stories = [
    {
        name: "Kavya · Grade 1",
        details: "Started: struggling with SATPIN · After 12 weeks: reading storybooks independently",
        quote: "The structured digital practice meant we never had to print worksheets. Kavya reads nightly and shares voice notes with her teacher.",
        outcome: "Moved from emerging to proficient on phonics dashboard.",
        avatarColor: "bg-gradient-to-br from-[#ffddc8] to-[#ff9a5c]",
    },
    {
        name: "Aarav · Grade 4",
        details: "Started: avoided writing paragraphs · After 16 weeks: published persuasive essays",
        quote: "The grammar labs feel like creative workshops. The weekly feedback voice notes keep us aligned without hovering.",
        outcome: "Scored 28/30 in school writing assessment and leads class presentations.",
        avatarColor: "bg-gradient-to-br from-[#c7d2fe] to-[#6366f1]",
    },
    {
        name: "Riya · Grade 5",
        details: "Started: whispered during show & tell · After 20 weeks: hosted school assembly",
        quote: "Video clips after each session helped us watch Riya’s progress together. She now speaks with pace and poise.",
        outcome: "Won district storytelling contest and mentors juniors in school club.",
        avatarColor: "bg-gradient-to-br from-[#fbcfe8] to-[#f472b6]",
    },
];
export default function SuccessStories() {
    return (_jsx("section", { className: "bg-[#f5f0ff] py-20", id: "success-stories", children: _jsxs("div", { className: "mx-auto max-w-6xl px-4", children: [_jsxs("div", { className: "mx-auto max-w-3xl text-center", children: [_jsx("p", { className: "text-sm font-semibold uppercase tracking-[0.24em] text-[#7c3aed]", children: "Success stories" }), _jsx("h2", { className: "mt-2 text-3xl md:text-4xl font-black text-[#0f172a]", children: "Real families, measurable transformations" }), _jsx("p", { className: "mt-3 text-lg text-gray-600", children: "Our dashboards show the numbers and parents share the joy. Here are a few journeys from the 3,500+ children we\u2019ve coached." })] }), _jsx("div", { className: "mt-12 grid gap-6 md:grid-cols-3", children: stories.map((story) => (_jsxs("article", { className: "flex h-full flex-col gap-4 rounded-3xl border border-white/60 bg-white p-6 shadow-xl", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: `inline-flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold text-white ${story.avatarColor}`, children: story.name.charAt(0) }), _jsx("p", { className: "text-sm font-semibold text-[#0f172a]", children: story.name })] }), _jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.32em] text-[#7c3aed]", children: "Progress snapshot" }), _jsx("p", { className: "text-sm text-gray-600 leading-relaxed", children: story.details }), _jsxs("blockquote", { className: "text-[0.95rem] font-medium leading-6 text-gray-900", children: ["\u201C", story.quote, "\u201D"] }), _jsxs("p", { className: "mt-auto text-sm font-semibold text-[#0f172a]", children: ["Outcome: ", story.outcome] })] }, story.name))) })] }) }));
}
//# sourceMappingURL=SuccessStories.js.map