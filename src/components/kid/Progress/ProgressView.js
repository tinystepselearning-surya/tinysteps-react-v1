import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
const ProgressView = () => {
    const progressData = [
        {
            subject: 'Phonics',
            emoji: '🔤',
            level: 2,
            progress: 80,
            learned: 52,
            topicsDone: 8,
            totalTopics: 12,
            next: 'Phoneme "U"',
            color: 'from-blue-400 to-blue-600'
        },
        {
            subject: 'Grammar',
            emoji: '📚',
            level: 1,
            progress: 60,
            learned: 15,
            topicsDone: 6,
            totalTopics: 10,
            next: 'Past tense',
            color: 'from-green-400 to-green-600'
        },
        {
            subject: 'Speaking',
            emoji: '🗣️',
            level: 1,
            progress: 40,
            learned: 8,
            topicsDone: 4,
            totalTopics: 10,
            next: 'Pronunciation',
            color: 'from-purple-400 to-purple-600'
        }
    ];
    const getMotivationalMessage = (progress) => {
        if (progress >= 80)
            return "Wow! You're so smart! 🌟";
        if (progress >= 60)
            return "Almost there! 💪";
        return "You're doing great! 🎉";
    };
    return (_jsxs("div", { className: "p-6", children: [_jsx("h1", { className: "text-3xl font-bold text-center mb-6", children: "Your Amazing Progress! \uD83D\uDE80" }), progressData.map((item, index) => (_jsxs(motion.div, { className: `bg-gradient-to-r ${item.color} rounded-3xl p-6 mb-6 text-white shadow-lg`, initial: { opacity: 0, x: -50 }, animate: { opacity: 1, x: 0 }, transition: { delay: index * 0.2 }, children: [_jsxs("div", { className: "flex items-center mb-4", children: [_jsx("span", { className: "text-4xl mr-4", children: item.emoji }), _jsxs("div", { children: [_jsxs("h2", { className: "text-2xl font-bold", children: [item.subject, " Level ", item.level] }), _jsxs("p", { className: "text-lg opacity-90", children: [item.progress, "% done! \uD83C\uDFAF"] })] })] }), _jsx("div", { className: "mb-4", children: _jsx("div", { className: "bg-white bg-opacity-30 rounded-full h-6 mb-2", children: _jsx(motion.div, { className: "bg-white h-full rounded-full", initial: { width: 0 }, animate: { width: `${item.progress}%` }, transition: { duration: 1, delay: index * 0.2 } }) }) }), _jsxs("div", { className: "grid grid-cols-2 gap-4 mb-4", children: [_jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-3xl font-bold", children: item.learned }), _jsx("p", { className: "text-sm opacity-90", children: "Learned! \u270F\uFE0F" })] }), _jsxs("div", { className: "text-center", children: [_jsxs("p", { className: "text-3xl font-bold", children: [item.topicsDone, "/", item.totalTopics] }), _jsx("p", { className: "text-sm opacity-90", children: "Topics Done! \uD83D\uDCD6" })] })] }), _jsxs("p", { className: "text-lg mb-2", children: ["Next: ", item.next, " \uD83C\uDF93"] }), _jsx("p", { className: "text-xl font-bold", children: getMotivationalMessage(item.progress) })] }, item.subject))), _jsxs(motion.div, { className: "bg-yellow-100 rounded-3xl p-6 text-center", initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.8 }, children: [_jsx("h3", { className: "text-2xl font-bold mb-2", children: "You've learned 52 words in Phonics! \uD83C\uDF89" }), _jsx("p", { className: "text-lg text-yellow-700", children: "Keep going, superstar! \uD83C\uDF1F" })] })] }));
};
export default ProgressView;
