import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { motion } from 'framer-motion';
const AchievementsView = () => {
    const [showCelebration, setShowCelebration] = useState(false);
    const [celebratedBadge, setCelebratedBadge] = useState(null);
    const earnedBadges = [
        {
            id: 1,
            title: 'First Lesson',
            emoji: '🎖️',
            description: 'You attended your first session!',
            earnedDate: 'Nov 1',
            message: 'Welcome to the learning adventure! 🚀'
        },
        {
            id: 2,
            title: 'Perfect Week',
            emoji: '🏆',
            description: 'You attended all sessions this week!',
            earnedDate: 'Nov 7',
            message: 'You\'re unstoppable! 💪'
        },
        {
            id: 3,
            title: 'Speedy Learner',
            emoji: '⚡',
            description: 'You completed 5 topics! Wow!',
            earnedDate: 'Nov 10',
            message: 'Learning fast like a rocket! 🚀'
        },
        {
            id: 4,
            title: 'Super Phonics Star',
            emoji: '⭐',
            description: 'You mastered all Phonics Level 1 topics!',
            earnedDate: 'Nov 12',
            message: 'You\'re a phonics champion! 🏆'
        }
    ];
    const inProgressBadges = [
        {
            id: 5,
            title: '50 Words',
            emoji: '📝',
            description: 'Learn 10 more words to unlock this!',
            progress: 40,
            total: 50,
            message: 'Almost there! Keep learning! 📚'
        },
        {
            id: 6,
            title: 'Perfect Month',
            emoji: '📅',
            description: 'Complete 4 more sessions this month!',
            progress: 6,
            total: 10,
            message: 'You\'re doing great! Stay consistent! 🌟'
        },
        {
            id: 7,
            title: 'Master of All',
            emoji: '👑',
            description: 'Master all 3 areas to unlock!',
            progress: { phonics: 80, grammar: 60, speaking: 40 },
            message: 'You\'re becoming a learning master! 🎓'
        }
    ];
    const handleBadgeClick = (badge) => {
        if (earnedBadges.some(b => b.id === badge.id)) {
            setCelebratedBadge(badge);
            setShowCelebration(true);
            setTimeout(() => setShowCelebration(false), 3000);
        }
    };
    return (_jsxs("div", { className: "p-6", children: [_jsx("h1", { className: "text-3xl font-bold text-center mb-6", children: "Your Amazing Badges! \uD83C\uDFC6" }), _jsx("h2", { className: "text-2xl font-bold mb-4", children: "Earned Badges \u2B50" }), _jsx("div", { className: "grid grid-cols-2 gap-4 mb-8", children: earnedBadges.map((badge) => (_jsxs(motion.div, { className: "bg-gradient-to-br from-yellow-300 to-orange-400 rounded-3xl p-4 text-center shadow-lg cursor-pointer", whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, onClick: () => handleBadgeClick(badge), children: [_jsx("div", { className: "text-6xl mb-2", children: badge.emoji }), _jsx("h3", { className: "text-xl font-bold mb-1", children: badge.title }), _jsx("p", { className: "text-sm mb-2", children: badge.description }), _jsxs("p", { className: "text-xs opacity-80", children: ["Earned ", badge.earnedDate] })] }, badge.id))) }), _jsx("h2", { className: "text-2xl font-bold mb-4", children: "Coming Soon \u23F3" }), _jsx("div", { className: "space-y-4", children: inProgressBadges.map((badge) => (_jsxs(motion.div, { className: "bg-gray-200 rounded-3xl p-4 shadow-lg", initial: { opacity: 0.7 }, children: [_jsxs("div", { className: "flex items-center mb-2", children: [_jsx("span", { className: "text-4xl mr-3", children: badge.emoji }), _jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "text-xl font-bold", children: badge.title }), _jsx("p", { className: "text-sm text-gray-600", children: badge.description })] })] }), badge.progress && typeof badge.progress === 'number' ? (_jsxs("div", { className: "mb-2", children: [_jsx("div", { className: "bg-gray-300 rounded-full h-4", children: _jsx(motion.div, { className: "bg-blue-500 h-full rounded-full", initial: { width: 0 }, animate: { width: `${(badge.progress / badge.total) * 100}%` }, transition: { duration: 1 } }) }), _jsxs("p", { className: "text-sm text-center mt-1", children: [badge.progress, "/", badge.total] })] })) : badge.progress && typeof badge.progress === 'object' ? (_jsx("div", { className: "grid grid-cols-3 gap-2 mb-2", children: Object.entries(badge.progress).map(([subject, progress]) => (_jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-xs capitalize", children: subject }), _jsxs("p", { className: "text-sm font-bold", children: [progress, "%"] })] }, subject))) })) : null, _jsx("p", { className: "text-sm text-gray-700", children: badge.message })] }, badge.id))) }), showCelebration && celebratedBadge && (_jsx(motion.div, { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", initial: { opacity: 0 }, animate: { opacity: 1 }, children: _jsxs(motion.div, { className: "bg-white rounded-3xl p-8 text-center max-w-md mx-4", initial: { scale: 0 }, animate: { scale: 1 }, transition: { type: "spring", stiffness: 300 }, children: [_jsx("div", { className: "text-8xl mb-4", children: "\uD83C\uDF89" }), _jsx("h2", { className: "text-3xl font-bold mb-2", children: "Congratulations!" }), _jsx("div", { className: "text-6xl mb-4", children: celebratedBadge.emoji }), _jsx("h3", { className: "text-2xl font-bold mb-2", children: celebratedBadge.title }), _jsx("p", { className: "text-lg mb-4", children: celebratedBadge.message }), _jsx("button", { className: "bg-blue-500 text-white text-xl font-bold py-3 px-6 rounded-2xl", children: "Show Parents! \uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67\u200D\uD83D\uDC66" })] }) }))] }));
};
export default AchievementsView;
