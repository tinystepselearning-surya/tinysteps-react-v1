import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import Button from '../Button/Button';
const courses = [
    { id: 'phonics', icon: '🔤', title: 'PHONICS', subtitle: 'From Sounds to Reading', age: 'Ages: 3–8', duration: 'Duration: 8–24 weeks' },
    { id: 'grammar', icon: '✍️', title: 'GRAMMAR', subtitle: 'Speaking & Writing', age: 'Ages: 4–12', duration: 'Duration: 8–24 weeks' },
    { id: 'speaking', icon: '🎤', title: 'PUBLIC SPEAKING', subtitle: 'From Shy to Confident', age: 'Ages: 4–12', duration: 'Duration: 8–24 weeks' }
];
const levelDetails = {
    phonics: [
        { name: 'Level 1: Foundation', points: ['Sound recognition', '3–4 letter words'], duration: '8–12 weeks' },
        { name: 'Level 2: Intermediate', points: ['Digraphs & clusters', 'Fluent reading'], duration: '12–16 weeks' },
        { name: 'Level 3: Advanced', points: ['Chapter books', 'Comprehension'], duration: '16–20 weeks' },
        { name: 'Level 4: Mastery', points: ['Independent reading', 'Novel reading'], duration: '20–24 weeks' }
    ],
    grammar: [
        { name: 'Level 1: Foundations', points: ['Nouns, verbs, pronouns', 'Simple sentences'], duration: '8–12 weeks' },
        { name: 'Level 2: Building Sentences', points: ['Adjectives & prepositions', 'Tenses'], duration: '12–16 weeks' },
        { name: 'Level 3: Complex Speaking', points: ['Conjunctions & compounds', 'Degrees of comparison'], duration: '16–20 weeks' },
        { name: 'Level 4: Mastery', points: ['Active/passive', 'Academic writing'], duration: '20–24 weeks' }
    ],
    speaking: [
        { name: 'Level 1: Building Confidence', points: ['Overcome shyness', 'Pronunciation'], duration: '8–12 weeks' },
        { name: 'Level 2: Foundations', points: ['2‑minute speeches', 'Body language'], duration: '12–16 weeks' },
        { name: 'Level 3: Intermediate', points: ['5‑minute presentations', 'Debates'], duration: '16–20 weeks' },
        { name: 'Level 4: Mastery', points: ['Formal presentations', 'Leadership skills'], duration: '20–24 weeks' }
    ]
};
const palette = {
    phonics: { gradient: 'from-[#ffe4c0] via-white to-[#fff4e1]', accent: 'text-[#b45309]' },
    grammar: { gradient: 'from-[#e0f2ff] via-white to-[#edf4ff]', accent: 'text-[#0f62fe]' },
    speaking: { gradient: 'from-[#f3e8ff] via-white to-[#fef2ff]', accent: 'text-[#7c3aed]' }
};
const slugMap = {
    phonics: '/courses/phonics-foundation',
    grammar: '/courses/grammar-essentials',
    speaking: '/courses/public-speaking-foundations'
};
const CoursesSection = () => {
    const [activeCourse, setActiveCourse] = useState(courses[0]);
    const levels = useMemo(() => levelDetails[activeCourse.id], [activeCourse]);
    return (_jsx("section", { "data-animate": "fade-up", className: "bg-white py-20", children: _jsxs("div", { className: "mx-auto max-w-6xl px-6", children: [_jsxs("div", { className: "mb-10 text-center", children: [_jsx("h2", { className: "font-heading text-3xl font-bold md:text-4xl", children: "Our Three Core Courses" }), _jsx("p", { className: "mt-2 text-base text-gray-700", children: "Tap a course tab to preview outcomes and levels." })] }), _jsx("div", { className: "flex flex-wrap justify-center gap-4", children: courses.map((course) => {
                        const isActive = course.id === activeCourse.id;
                        return (_jsxs("button", { type: "button", onClick: () => setActiveCourse(course), className: `flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition ${isActive ? 'bg-gradient-to-r from-[#ff8f5c] via-[#ffb347] to-[#59c3ff] text-white shadow-lg' : 'bg-white/80 text-gray-700 ring-1 ring-gray-200'}`, "aria-pressed": isActive, children: [_jsx("span", { children: course.icon }), course.title] }, course.id));
                    }) }), _jsxs("div", { className: "mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]", children: [_jsxs("div", { className: `rounded-3xl border border-white/0 bg-gradient-to-br ${palette[activeCourse.id].gradient} p-6 shadow-card-hover`, children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-4xl", children: activeCourse.icon }), _jsxs("div", { children: [_jsx("h3", { className: "text-2xl font-semibold text-gray-900", children: activeCourse.subtitle }), _jsx("p", { className: `text-sm font-semibold ${palette[activeCourse.id].accent}`, children: activeCourse.title })] })] }), _jsxs("div", { className: "mt-4 space-y-1 text-sm text-gray-700", children: [_jsx("p", { children: activeCourse.age }), _jsx("p", { children: activeCourse.duration })] }), _jsxs("ul", { className: "mt-4 space-y-2 text-sm text-gray-700", children: [activeCourse.subtitle && _jsxs("li", { children: ["\u2022 ", activeCourse.subtitle] }), activeCourse.age && _jsxs("li", { children: ["\u2022 Tailored for ", activeCourse.age.toLowerCase()] }), _jsx("li", { children: "\u2022 Live classes with AI nudges, worksheets, and recordings." })] }), _jsxs("div", { className: "mt-6 flex flex-wrap gap-3", children: [_jsx(Button, { size: "sm", onClick: () => window.location.assign(slugMap[activeCourse.id]), children: "View Curriculum" }), _jsx(Button, { size: "sm", variant: "outline", onClick: () => { var _a; return (_a = document.getElementById('book-trial')) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: 'smooth' }); }, children: "Book Trial" })] })] }), _jsxs("div", { className: "rounded-3xl border border-gray-100 bg-white/90 p-6 shadow-card-hover", children: [_jsx("h4", { className: "text-lg font-semibold text-gray-900", children: "Level Roadmap" }), _jsx("div", { className: "mt-4 space-y-4", children: levels.map((lvl, index) => (_jsxs("div", { className: "rounded-2xl border border-gray-100 bg-gray-50/80 p-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "font-medium text-gray-900", children: lvl.name }), _jsxs("span", { className: "rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-500", children: ["Step ", index + 1] })] }), _jsxs("div", { className: "text-xs text-gray-500", children: ["Duration: ", lvl.duration] }), _jsx("ul", { className: "mt-2 space-y-1 text-sm text-gray-700", children: lvl.points.map((p) => (_jsxs("li", { children: ["\u2022 ", p] }, p))) })] }, lvl.name))) })] })] })] }) }));
};
export default CoursesSection;
