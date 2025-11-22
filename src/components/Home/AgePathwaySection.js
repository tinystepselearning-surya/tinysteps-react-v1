import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';
import AnimatedText from '../common/AnimatedText';
const pathways = {
    3: { courses: ['Sound Discovery', 'Story Time Crafts', 'Rhythm & Rhyme'], focus: 'Play-based phonemic awareness.' },
    4: { courses: ['Letter Launch', 'Mini Readers Lab', 'Expressive Play'], focus: 'Blend sounds with imaginative play.' },
    5: { courses: ['Phonics Power', 'Confidence Club', 'Storytelling Circles'], focus: 'Sentence building through drama.' },
    6: { courses: ['Grammar Safari', 'Stage Stars', 'Word Wizards'], focus: 'Early grammar mastery + projection.' },
    7: { courses: ['Grammar Safari', 'Debate Buds', 'Creative Writing Lab'], focus: 'Paragraph writing and vocal clarity.' },
    8: { courses: ['Structure Sprint', 'Spotlight Speeches', 'Reading Champs'], focus: 'Narrative writing and poise.' },
    9: { courses: ['Grammar Studio', 'Junior TED Talks', 'Reading for Impact'], focus: 'Persuasive writing & gestures.' },
    10: { courses: ['Essay Architects', 'Confidence on Camera', 'Book Club Live'], focus: 'Long-form writing and media confidence.' },
    11: { courses: ['Advanced Grammar Lab', 'Leadership Speaking', 'Podcast Lab'], focus: 'Argumentation and tonal control.' },
    12: { courses: ['Scholars Writing Lab', 'Global Speakers Forum', 'Innovation Pitch'], focus: 'Academic rigor + storytelling.' }
};
const listVariants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.1
        }
    }
};
const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } }
};
const AgePathwaySection = () => {
    var _a;
    const [selectedAge, setSelectedAge] = useState(6);
    const { ref } = useScrollAnimation(0.2);
    const pathway = (_a = pathways[selectedAge]) !== null && _a !== void 0 ? _a : pathways[6];
    const coursesWithIndex = useMemo(() => pathway.courses.map((course, index) => ({ course, index })), [pathway]);
    return (_jsxs("section", { className: "relative overflow-hidden py-20", children: [_jsx("div", { className: "pointer-events-none absolute inset-0 bg-gradient-to-br from-[#E0F2FE] via-[#FEF2F2] to-[#F0FDF4] animate-gradient-shift opacity-80" }), _jsxs("div", { className: "relative mx-auto max-w-5xl px-6", children: [_jsx("div", { ref: ref, className: "text-center", children: _jsx(AnimatedText, { text: "Your Child's Learning Path", as: "h2", className: "font-heading text-3xl font-bold text-gray-900 md:text-4xl", animation: "slide" }) }), _jsxs("div", { className: "mt-10 space-y-6", children: [_jsxs("div", { className: "flex flex-col items-center gap-4", children: [_jsxs("label", { htmlFor: "age-slider", className: "font-semibold text-gray-800", children: ["Select Age: ", _jsx("span", { className: "text-primary-600", children: selectedAge }), " years"] }), _jsx("input", { id: "age-slider", type: "range", min: 3, max: 12, step: 1, value: selectedAge, onChange: (event) => setSelectedAge(Number(event.target.value)), className: "age-slider w-full max-w-xl" })] }), _jsx(AnimatePresence, { mode: "wait", children: pathway && (_jsx(motion.div, { className: "rounded-3xl bg-white/90 p-[1px] shadow-[0_20px_50px_rgba(0,82,204,0.15)]", initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, transition: { duration: 0.3 }, children: _jsxs("div", { className: "rounded-3xl bg-white p-8", children: [_jsx("h3", { className: "font-heading text-2xl font-semibold text-gray-900", children: "Recommended Courses" }), _jsx(motion.ul, { className: "mt-6 space-y-4", variants: listVariants, initial: "hidden", animate: "visible", children: coursesWithIndex.map(({ course, index }) => (_jsxs(motion.li, { variants: itemVariants, className: "flex items-center gap-4 rounded-2xl border border-gray-100 bg-gray-50/80 p-4", children: [_jsx("span", { className: "flex h-10 w-10 items-center justify-center rounded-full bg-primary-500 font-semibold text-white shadow-lg", children: index + 1 }), _jsx("p", { className: "text-lg font-medium text-gray-800", children: course })] }, course))) }), _jsxs("div", { className: "mt-8 rounded-2xl border-l-4 border-orange-500 bg-orange-50 p-4 text-sm italic text-orange-900", children: ["Focus Area: ", pathway.focus] })] }) }, selectedAge)) })] })] })] }));
};
export default AgePathwaySection;
