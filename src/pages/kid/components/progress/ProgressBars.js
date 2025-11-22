import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from '@components/ui/card';
export const ProgressBars = ({ kidId }) => {
    // Mock data - in real implementation, fetch from Firestore
    const subjects = [
        {
            subject: 'Phonics',
            progress: 75,
            level: 'Level 2',
            color: 'bg-blue-500',
            icon: '🔤',
        },
        {
            subject: 'Grammar',
            progress: 60,
            level: 'Level 1',
            color: 'bg-green-500',
            icon: '📝',
        },
        {
            subject: 'Public Speaking',
            progress: 45,
            level: 'Level 1',
            color: 'bg-purple-500',
            icon: '🎤',
        },
        {
            subject: 'Reading',
            progress: 85,
            level: 'Level 3',
            color: 'bg-orange-500',
            icon: '📖',
        },
    ];
    return (_jsxs(Card, { className: "p-6", children: [_jsx("h2", { className: "text-2xl font-bold mb-6 text-center", children: "My Learning Progress" }), _jsx("div", { className: "space-y-6", children: subjects.map((subject) => (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("span", { className: "text-2xl", children: subject.icon }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-lg", children: subject.subject }), _jsx("p", { className: "text-sm text-gray-600", children: subject.level })] })] }), _jsxs("span", { className: "text-lg font-bold text-blue-600", children: [subject.progress, "%"] })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-4", children: _jsx("div", { className: `h-4 rounded-full transition-all duration-500 ${subject.color}`, style: { width: `${subject.progress}%` } }) }), _jsxs("div", { className: "flex justify-between text-sm text-gray-500", children: [_jsx("span", { children: "Keep going! \uD83C\uDF89" }), _jsxs("span", { children: [subject.progress, "/100"] })] })] }, subject.subject))) }), _jsx("div", { className: "mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200", children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("span", { className: "text-2xl", children: "\u2B50" }), _jsxs("div", { children: [_jsx("p", { className: "font-semibold text-yellow-800", children: "Great Progress!" }), _jsx("p", { className: "text-sm text-yellow-700", children: "You're doing amazing! Keep practicing to unlock new levels." })] })] }) })] }));
};
