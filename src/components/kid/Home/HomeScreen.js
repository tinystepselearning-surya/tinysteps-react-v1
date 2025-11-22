import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
const HomeScreen = () => {
    const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 30, seconds: 15 });
    const [sessionStatus, setSessionStatus] = useState('upcoming'); // upcoming, ready, inProgress
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                let { hours, minutes, seconds } = prev;
                if (seconds > 0)
                    seconds--;
                else if (minutes > 0) {
                    minutes--;
                    seconds = 59;
                }
                else if (hours > 0) {
                    hours--;
                    minutes = 59;
                    seconds = 59;
                }
                else {
                    setSessionStatus('ready');
                    return { hours: 0, minutes: 0, seconds: 0 };
                }
                return { hours, minutes, seconds };
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);
    const getTimerColor = () => {
        const totalSeconds = timeLeft.hours * 3600 + timeLeft.minutes * 60 + timeLeft.seconds;
        if (totalSeconds > 300)
            return 'text-green-600';
        if (totalSeconds > 60)
            return 'text-yellow-600';
        return 'text-red-600 animate-pulse';
    };
    const handleJoinSession = () => {
        setSessionStatus('inProgress');
        // Open Zoom link
        window.open('https://zoom.us/j/example', '_blank');
    };
    return (_jsxs("div", { className: "p-6", children: [_jsxs(motion.div, { className: "bg-gradient-to-r from-blue-400 to-purple-500 rounded-3xl p-8 mb-6 text-white text-center", initial: { scale: 0.9 }, animate: { scale: 1 }, transition: { duration: 0.5 }, children: [_jsx("h1", { className: "text-4xl font-bold mb-4", children: "Next Session In" }), _jsxs("div", { className: `text-6xl font-mono font-bold mb-4 ${getTimerColor()}`, children: [String(timeLeft.hours).padStart(2, '0'), ":", String(timeLeft.minutes).padStart(2, '0'), ":", String(timeLeft.seconds).padStart(2, '0')] }), _jsx("p", { className: "text-xl", children: "Get ready for fun learning! \uD83C\uDF93" })] }), _jsxs(motion.div, { className: "bg-white rounded-3xl p-6 mb-6 shadow-lg", whileHover: { scale: 1.02 }, transition: { type: "spring", stiffness: 300 }, children: [_jsxs("div", { className: "flex items-center mb-4", children: [_jsx("span", { className: "text-4xl mr-4", children: "\uD83D\uDC69\u200D\uD83C\uDFEB" }), _jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold" }), _jsx("p", { className: "text-gray-600" })] })] }), _jsxs("div", { className: "flex items-center mb-4", children: [_jsx("span", { className: "text-4xl mr-4", children: "\uD83D\uDD24" }), _jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold" }), _jsx("p", { className: "text-gray-600" })] })] }), sessionStatus === 'ready' ? (_jsx(motion.button, { onClick: handleJoinSession, className: "w-full bg-green-500 text-white text-2xl font-bold py-4 rounded-2xl shadow-lg", whileTap: { scale: 0.95 }, animate: { scale: [1, 1.05, 1] }, transition: { repeat: Infinity, duration: 2 }, children: "\uD83C\uDF93 JOIN NOW \uD83C\uDF93" })) : (_jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-xl font-bold text-blue-600 mb-2", children: "Can't wait! \uD83D\uDE80" }), _jsx("p", { className: "text-gray-600", children: "Get your crayons ready!" })] }))] }), _jsxs(motion.div, { className: "bg-orange-100 rounded-3xl p-6 text-center", initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.3 }, children: [_jsx("div", { className: "text-6xl mb-2", children: "\uD83D\uDD25" }), _jsx("h3", { className: "text-2xl font-bold mb-2", children: "7 Day Streak!" }), _jsx("p", { className: "text-lg text-orange-700", children: "Keep it up! You're amazing! \uD83C\uDF1F" })] })] }));
};
export default HomeScreen;
