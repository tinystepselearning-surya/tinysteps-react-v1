import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';
const comparisons = [
    {
        feature: 'Live, credentialed language coaches',
        tinySteps: 'check',
        others: 'tilde'
    },
    {
        feature: 'Personalized age + confidence pathways',
        tinySteps: 'check',
        others: 'cross'
    },
    {
        feature: 'Weekly progress dashboards for parents',
        tinySteps: 'check',
        others: 'cross'
    },
    {
        feature: 'Immersive AR/VR phonics labs',
        tinySteps: 'check',
        others: 'cross'
    },
    {
        feature: 'Micro-pod speaking clubs (5:1)',
        tinySteps: 'check',
        others: 'tilde'
    },
    {
        feature: 'Global showcase events & badges',
        tinySteps: 'check',
        others: 'cross'
    },
    {
        feature: 'Recorded feedback + AI pronunciation coach',
        tinySteps: 'check',
        others: 'tilde'
    },
    {
        feature: 'Family coaching + habit trackers',
        tinySteps: 'check',
        others: 'cross'
    }
];
const rowVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.05, duration: 0.4 }
    })
};
const renderCell = (value) => {
    if (value === 'check')
        return _jsx("span", { className: "text-emerald-500", children: "\u2714" });
    if (value === 'cross')
        return _jsx("span", { className: "text-rose-500", children: "\u2715" });
    if (value === 'tilde')
        return _jsx("span", { className: "text-amber-500", children: "~" });
    return value;
};
const ComparisonTableSection = () => {
    const { ref, isInView } = useScrollAnimation(0.2);
    return (_jsx("section", { className: "bg-white py-20", children: _jsxs("div", { className: "mx-auto max-w-6xl px-6", children: [_jsxs("div", { className: "text-center", children: [_jsx("h2", { className: "font-heading text-3xl font-bold text-gray-900 md:text-4xl", children: "How We Stand Out" }), _jsx("p", { className: "mt-2 text-base text-gray-600 md:text-lg", children: "A quick look at the difference between Tiny Steps and traditional tutoring." })] }), _jsx("div", { className: "mt-10 overflow-x-auto", children: _jsxs("table", { ref: ref, className: "w-full min-w-[600px] divide-y divide-gray-200 rounded-3xl bg-white shadow-xl", children: [_jsx("thead", { children: _jsxs("tr", { className: "text-left text-xs font-semibold uppercase tracking-wide text-gray-500", children: [_jsx("th", { className: "px-6 py-4", children: "Feature" }), _jsx("th", { className: "px-6 py-4 text-primary-600", children: "Tiny Steps" }), _jsx("th", { className: "px-6 py-4 text-gray-600", children: "Others" })] }) }), _jsx("tbody", { children: comparisons.map((row, index) => (_jsxs(motion.tr, { custom: index, initial: "hidden", animate: isInView ? 'visible' : 'hidden', variants: rowVariants, className: "text-sm text-gray-700", children: [_jsx("td", { className: "px-6 py-4", children: row.feature }), _jsx("td", { className: "px-6 py-4 text-center text-lg", children: renderCell(row.tinySteps) }), _jsx("td", { className: "px-6 py-4 text-center text-lg", children: renderCell(row.others) })] }, row.feature))) })] }) })] }) }));
};
export default ComparisonTableSection;
