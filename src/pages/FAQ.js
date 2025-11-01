import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
function Accordion({ items }) {
    const [openIndex, setOpenIndex] = useState(null);
    return (_jsx("div", { className: "space-y-2", children: items.map((item, idx) => {
            const open = openIndex === idx;
            return (_jsxs("div", { className: "border rounded-md overflow-hidden", children: [_jsxs("button", { type: "button", onClick: () => setOpenIndex(open ? null : idx), className: "w-full text-left px-4 py-3 flex items-center justify-between", "aria-expanded": open, children: [_jsx("span", { className: "font-medium", children: item.question }), _jsx("span", { className: `transform transition-transform ${open ? "rotate-180" : "rotate-0"}`, children: "\u25BE" })] }), open && (_jsx("div", { className: "px-4 py-3 border-t", children: _jsx("p", { className: "text-sm text-gray-700", children: item.answer }) }))] }, idx));
        }) }));
}
export default function FAQ() {
    const general = [
        { question: "Are the classes live or recorded?", answer: "Live on Zoom. Recordings are shared for revision when requested." },
        { question: "What are the batch sizes?", answer: "Small groups (3–6 learners) to ensure one-on-one attention." },
        { question: "How do payments work?", answer: "Monthly plans. UPI, cards, and bank transfer supported." },
    ];
    const phonics = [
        { question: "What levels do you cover?", answer: "A–Z sounds, CVC blending, digraphs, long vowels, Magic-E, rules." },
        { question: "Do you give worksheets?", answer: "Yes—digital worksheets, decodables, and mini-games each week." },
    ];
    const grammar = [
        { question: "Is grammar taught with writing?", answer: "Yes—mini-lessons + writing labs (narrative/info/opinion)." },
        { question: "Do you share feedback?", answer: "Yes—rubric-based feedback and simple action points." },
    ];
    const speaking = [
        { question: "Will my child get stage practice?", answer: "Weekly speaking slots + monthly showcase to build confidence." },
        { question: "Do you correct accent/pronunciation?", answer: "We coach clarity, diction, pace, and expression with drills." },
    ];
    return (_jsxs("div", { className: "px-4 py-10 max-w-5xl mx-auto", children: [_jsx("h1", { className: "text-3xl font-bold mb-6", children: "Frequently Asked Questions" }), _jsx("h2", { className: "text-xl font-semibold mt-8 mb-3", children: "General" }), _jsx(Accordion, { items: general }), _jsx("h2", { className: "text-xl font-semibold mt-8 mb-3", children: "Phonics" }), _jsx(Accordion, { items: phonics }), _jsx("h2", { className: "text-xl font-semibold mt-8 mb-3", children: "Grammar" }), _jsx(Accordion, { items: grammar }), _jsx("h2", { className: "text-xl font-semibold mt-8 mb-3", children: "Public Speaking" }), _jsx(Accordion, { items: speaking })] }));
}
//# sourceMappingURL=FAQ.js.map