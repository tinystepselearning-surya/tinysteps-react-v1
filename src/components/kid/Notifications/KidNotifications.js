import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
const KidNotifications = () => {
    const notifications = [
        {
            id: 1,
            message: "Your session is in 1 hour! 🎓",
            type: "session",
            time: "2 hours ago"
        },
        {
            id: 2,
            message: "You earned a new badge! 🏆",
            type: "achievement",
            time: "1 day ago"
        },
        {
            id: 3,
            message: "Parent sent you a message! 💌",
            type: "message",
            time: "2 days ago"
        },
        {
            id: 4,
            message: "Great job today! 🌟",
            type: "praise",
            time: "3 days ago"
        }
    ];
    const getNotificationColor = (type) => {
        switch (type) {
            case 'session': return 'bg-blue-100 border-blue-300';
            case 'achievement': return 'bg-yellow-100 border-yellow-300';
            case 'message': return 'bg-pink-100 border-pink-300';
            case 'praise': return 'bg-green-100 border-green-300';
            default: return 'bg-gray-100 border-gray-300';
        }
    };
    return (_jsxs("div", { className: "p-6", children: [_jsx("h1", { className: "text-3xl font-bold text-center mb-6", children: "Your Messages! \uD83D\uDC8C" }), _jsx("div", { className: "space-y-4", children: notifications.map((notification, index) => (_jsxs(motion.div, { className: `rounded-3xl p-4 border-2 ${getNotificationColor(notification.type)} shadow-lg`, initial: { opacity: 0, x: -50 }, animate: { opacity: 1, x: 0 }, transition: { delay: index * 0.1 }, whileHover: { scale: 1.02 }, children: [_jsx("p", { className: "text-lg font-bold mb-1", children: notification.message }), _jsx("p", { className: "text-sm text-gray-600", children: notification.time })] }, notification.id))) }), _jsxs(motion.div, { className: "mt-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-3xl p-6 text-center text-white", initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.8 }, children: [_jsx("h2", { className: "text-2xl font-bold mb-2", children: "Stay Tuned! \uD83C\uDF89" }), _jsx("p", { className: "text-lg", children: "More exciting messages coming your way!" })] })] }));
};
export default KidNotifications;
