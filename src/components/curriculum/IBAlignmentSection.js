import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const pillars = [
    {
        title: 'Approaches to Learning',
        detail: 'Communication · Thinking · Research · Social · Self-Management',
        bullets: [
            'Weekly reflections and voice/video journals nurture communication + self-management.',
            'Inquiry prompts in every unit connect literacy skills to real-life contexts.',
        ],
    },
    {
        title: 'Transdisciplinary Themes',
        detail: 'Who we are · How we express ourselves · How we organize ourselves',
        bullets: [
            'Phonics texts and speeches draw from culture, community, nature, and innovation themes.',
            'Grammar + writing projects map to PYP exhibition style tasks and persuasive writing.',
        ],
    },
    {
        title: 'IB Learner Profile',
        detail: 'Inquirer · Communicator · Reflective · Principled',
        bullets: [
            'Learners set weekly goals, reflect using “Glow & Grow,” and share evidence with parents.',
            'Capstone speeches + writing tasks emphasise principled expression and empathy.',
        ],
    },
];
const IBAlignmentSection = () => (_jsx("section", { "data-animate": "fade-up", className: "px-6 pb-10", children: _jsxs("div", { className: "mx-auto max-w-6xl rounded-[32px] border border-white/40 bg-white/85 p-6 shadow-card-hover", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "gradient-chip mx-auto w-max", children: "IB Primary Years Programme lens" }), _jsx("h2", { className: "mt-3 text-3xl font-semibold text-gray-900", children: "How Tiny Steps aligns with IB English scopes" }), _jsx("p", { className: "mt-2 text-sm text-gray-700", children: "Every course publishes inquiry questions, ATL focus, and learner-profile outcomes inside the parent dashboard." })] }), _jsx("div", { className: "mt-8 grid gap-6 md:grid-cols-3", children: pillars.map((pillar) => (_jsxs("div", { className: "rounded-3xl border border-gray-100 bg-gradient-to-br from-white via-slate-50 to-white p-5 shadow-sm hover:shadow-lg transition", children: [_jsx("div", { className: "text-xs font-semibold uppercase tracking-wide text-gray-500", children: pillar.title }), _jsx("div", { className: "text-lg font-semibold text-gray-900", children: pillar.detail }), _jsx("ul", { className: "mt-3 space-y-2 text-sm text-gray-700", children: pillar.bullets.map((bullet) => (_jsxs("li", { className: "flex items-start gap-2", children: [_jsx("span", { children: "\u2726" }), _jsx("span", { children: bullet })] }, bullet))) })] }, pillar.title))) })] }) }));
export default IBAlignmentSection;
