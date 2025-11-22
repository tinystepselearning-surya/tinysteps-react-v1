import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
const LearningTimeline = () => {
    const timelineEvents = [
        { date: 'Nov 1', event: 'Started course', emoji: '🎓', type: 'milestone' },
        { date: 'Nov 3', event: 'Learned phoneme A', emoji: '✨', type: 'topic' },
        { date: 'Nov 5', event: 'Learned phoneme B', emoji: '✨', type: 'topic' },
        { date: 'Nov 7', event: 'Got "Super Learner" badge', emoji: '🏆', type: 'badge' },
        { date: 'Nov 10', event: 'Mastered Level 1', emoji: '🎉', type: 'milestone' },
        { date: 'Nov 12', event: 'Learned phoneme C', emoji: '✨', type: 'topic' },
        { date: 'Nov 15', event: 'Next: Start Level 2', emoji: '🚀', type: 'future' }
    ];
    const getEventColor = (type) => {
        switch (type) {
            case 'milestone': return 'bg-yellow-400';
            case 'badge': return 'bg-purple-400';
            case 'topic': return 'bg-blue-400';
            case 'future': return 'bg-gray-400';
            default: return 'bg-gray-400';
        }
    };
    return (_jsxs("div", { className: "p-6", children: [_jsx("h1", { className: "text-3xl font-bold text-center mb-6", children: "Your Learning Journey! \uD83C\uDF1F" }), _jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-purple-400 rounded-full" }), _jsx("div", { className: "space-y-6", children: timelineEvents.map((event, index) => (_jsxs(motion.div, { className: "flex items-center", initial: { opacity: 0, x: -50 }, animate: { opacity: 1, x: 0 }, transition: { delay: index * 0.1 }, children: [_jsx("div", { className: `w-16 h-16 rounded-full ${getEventColor(event.type)} flex items-center justify-center text-2xl shadow-lg z-10`, children: event.emoji }), _jsx("div", { className: "ml-4 bg-white rounded-3xl p-4 shadow-lg flex-1", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h3", { className: "text-xl font-bold", children: event.event }), _jsx("span", { className: "text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full", children: event.date })] }) })] }, index))) })] }), _jsxs(motion.div, { className: "mt-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-3xl p-6 text-white text-center", initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 1 }, children: [_jsx("h2", { className: "text-2xl font-bold mb-2", children: "Keep Going! \uD83D\uDE80" }), _jsx("p", { className: "text-lg", children: "Your learning adventure is just beginning!" })] })] }));
};
export default LearningTimeline;
