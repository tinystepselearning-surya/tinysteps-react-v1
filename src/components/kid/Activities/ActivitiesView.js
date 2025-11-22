import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { motion } from 'framer-motion';
const ActivitiesView = () => {
    const [activeFilter, setActiveFilter] = useState('all');
    const assignedWorksheets = [
        {
            id: 1,
            title: 'Phonics Words Practice',
            difficulty: 2,
            time: '5-10 min',
            status: 'ready',
            thumbnail: '📝'
        },
        {
            id: 2,
            title: 'Grammar Fun Quiz',
            difficulty: 1,
            time: '3-5 min',
            status: 'completed',
            completedDate: 'Nov 14',
            thumbnail: '📚'
        }
    ];
    const availableGames = [
        {
            id: 1,
            title: 'Phoneme Matching',
            category: 'phonics',
            emoji: '🔤',
            highScore: 850,
            thumbnail: '🎯'
        },
        {
            id: 2,
            title: 'Grammar Builder',
            category: 'grammar',
            emoji: '📚',
            highScore: null,
            thumbnail: '🧱'
        },
        {
            id: 3,
            title: 'Speaking Stars',
            category: 'speaking',
            emoji: '🗣️',
            highScore: 720,
            thumbnail: '⭐'
        }
    ];
    const filters = [
        { id: 'all', label: '📋 All' },
        { id: 'phonics', label: '🔤 Phonics' },
        { id: 'grammar', label: '📚 Grammar' },
        { id: 'speaking', label: '🗣️ Speaking' }
    ];
    const filteredGames = activeFilter === 'all'
        ? availableGames
        : availableGames.filter(game => game.category === activeFilter);
    return (_jsxs("div", { className: "p-6", children: [_jsx("h1", { className: "text-3xl font-bold text-center mb-6", children: "Fun Activities! \uD83C\uDF89" }), _jsx("h2", { className: "text-2xl font-bold mb-4", children: "Your Worksheets \uD83D\uDCDD" }), _jsx("div", { className: "space-y-4 mb-8", children: assignedWorksheets.map((worksheet) => (_jsxs(motion.div, { className: "bg-white rounded-3xl p-4 shadow-lg flex items-center", whileHover: { scale: 1.02 }, children: [_jsx("div", { className: "text-4xl mr-4", children: worksheet.thumbnail }), _jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "text-xl font-bold", children: worksheet.title }), _jsxs("div", { className: "flex items-center mb-2", children: [_jsx("span", { className: "text-yellow-500 mr-1", children: '⭐'.repeat(worksheet.difficulty) }), _jsx("span", { className: "text-gray-500 ml-2", children: worksheet.time })] }), worksheet.status === 'completed' ? (_jsxs("div", { className: "flex items-center", children: [_jsx("span", { className: "text-green-600 font-bold mr-2", children: "\u2705 Completed" }), _jsx("span", { className: "text-sm text-gray-500", children: worksheet.completedDate })] })) : (_jsx("span", { className: "text-blue-600 font-bold", children: "Ready to do!" }))] }), _jsx(motion.button, { className: `text-xl font-bold py-2 px-4 rounded-2xl ${worksheet.status === 'completed'
                                ? 'bg-gray-300 text-gray-500'
                                : 'bg-green-500 text-white'}`, whileTap: { scale: 0.95 }, disabled: worksheet.status === 'completed', children: worksheet.status === 'completed' ? 'Done!' : 'Do Now' })] }, worksheet.id))) }), _jsx("div", { className: "flex justify-center mb-6", children: filters.map((filter) => (_jsx("button", { onClick: () => setActiveFilter(filter.id), className: `text-lg font-bold py-2 px-4 mx-1 rounded-2xl transition-all ${activeFilter === filter.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700'}`, children: filter.label }, filter.id))) }), _jsx("h2", { className: "text-2xl font-bold mb-4", children: "Games to Play \uD83C\uDFAE" }), _jsx("div", { className: "grid grid-cols-1 gap-4", children: filteredGames.map((game) => (_jsx(motion.div, { className: "bg-gradient-to-r from-purple-400 to-pink-400 rounded-3xl p-4 text-white shadow-lg", whileHover: { scale: 1.02 }, children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "text-4xl mr-4", children: game.thumbnail }), _jsxs("div", { children: [_jsx("h3", { className: "text-xl font-bold", children: game.title }), _jsxs("div", { className: "flex items-center", children: [_jsx("span", { className: "text-2xl mr-2", children: game.emoji }), game.highScore && (_jsxs("span", { className: "text-sm bg-white bg-opacity-30 px-2 py-1 rounded-full", children: ["High Score: ", game.highScore, " \uD83C\uDFC6"] }))] })] })] }), _jsx(motion.button, { className: "bg-white text-purple-600 text-xl font-bold py-3 px-6 rounded-2xl shadow-lg", whileTap: { scale: 0.95 }, children: game.highScore ? 'Play Again' : 'Play' })] }) }, game.id))) })] }));
};
export default ActivitiesView;
