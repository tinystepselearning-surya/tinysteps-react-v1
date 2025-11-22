import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { MasteryProgress } from '../common/MasteryProgress';
const summaries = {
    phonics: {
        course: 'Phonics Foundation',
        week: 'Week 4',
        mastery: 68,
        status: 'Developing → Proficient',
        trend: '42% → 55% → 61% → 68%',
        mastered: ['Long-vowel picture sort (ai/ay)', 'Sound-motion drills (daily streak 5/5)', 'Decodable reader — Level B'],
        practice: ['Magic-e words speed (cap/cape)', 'Tricky words: said, come'],
        tip: 'Play “Magic-e Flip” for 7 mins · Read Level B reader aloud · Write 5 sentences using long vowels.'
    },
    grammar: {
        course: 'Grammar Essentials',
        week: 'Week 5',
        mastery: 52,
        status: 'Developing',
        trend: '30% → 36% → 45% → 52%',
        mastered: ['Identify nouns/pronouns', 'Present vs. past verb swap', 'Punctuation of basic sentences'],
        practice: ['Subject-verb agreement in simple past', 'Comma usage in lists'],
        tip: 'Use the “Grammar Safari” game for 10 mins · Write a 4-sentence diary entry focusing on verbs.'
    },
    speaking: {
        course: 'Super Speakers Studio',
        week: 'Week 6',
        mastery: 74,
        status: 'Confidence rising',
        trend: '50% → 58% → 66% → 74%',
        mastered: ['3-point storytelling without cue cards', 'Hand gestures synced with speech', 'Introductions under 30s'],
        practice: ['Vocal variety (rise/fall)', 'Handling audience Q&A for 2 questions'],
        tip: 'Record a quick “My city” speech · Review coach notes on pace · Play mirror game for 5 minutes.'
    },
    all: {
        course: 'Integrated English Journey',
        week: 'Week 4',
        mastery: 60,
        status: 'Solid momentum',
        trend: '35% → 44% → 52% → 60%',
        mastered: ['Reading stamina +3 mins', 'Pronunciation of target digraphs', 'Paragraph with capitalisation'],
        practice: ['Consistent speaking volume', 'Commas before conjunctions'],
        tip: 'Cycle phonics + grammar drills 5 mins each · Practice a short show-and-tell in front of family.'
    }
};
export const ParentReportPreview = ({ track }) => {
    const summary = summaries[track] || summaries.all;
    return (_jsxs("div", { className: "rounded-2xl bg-white p-5 shadow ring-1 ring-slate-200", children: [_jsx("div", { className: "mb-3 font-semibold text-gray-900", children: "\uD83D\uDCCA Weekly Progress Summary" }), _jsxs("div", { className: "mb-3 grid gap-4 md:grid-cols-[1fr_auto_auto]", children: [_jsxs("div", { className: "space-y-1 text-sm text-gray-700", children: [_jsx("div", { children: "Child: Sarah" }), _jsxs("div", { children: ["Week: ", summary.week] }), _jsxs("div", { children: ["Course: ", summary.course] })] }), _jsxs("div", { className: "flex flex-col items-center justify-center gap-2 sm:flex-row", children: [_jsx(MasteryProgress, { percent: summary.mastery }), _jsx("div", { className: "text-sm text-gray-700 text-center", children: summary.status })] }), _jsxs("div", { className: "flex flex-col items-center justify-center rounded-2xl bg-gray-50 p-3 text-center text-xs text-gray-600", children: [_jsx("span", { className: "font-semibold text-gray-900", children: "Trend" }), _jsx("span", { children: summary.trend })] })] }), _jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsxs("div", { children: [_jsx("div", { className: "font-medium", children: "\u2713 Mastered This Week:" }), _jsx("ul", { className: "list-disc pl-5 text-sm", children: summary.mastered.map((item) => (_jsx("li", { children: item }, item))) })] }), _jsxs("div", { children: [_jsx("div", { className: "font-medium", children: "\u26A0 Needs Practice:" }), _jsx("ul", { className: "list-disc pl-5 text-sm", children: summary.practice.map((item) => (_jsx("li", { children: item }, item))) })] })] }), _jsxs("div", { className: "mt-3 text-sm text-gray-700", children: ["\uD83D\uDCA1 Tips: ", summary.tip] }), _jsx("div", { className: "mt-3 text-right text-sm text-primary-600", children: "[Download Full Report PDF]" })] }));
};
