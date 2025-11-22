import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from '@components/ui/card';
import { Badge } from '@components/ui/badge';
export const Achievements = ({ kidId }) => {
    // Mock data - in real implementation, fetch from Firestore
    const achievements = [
        {
            id: '1',
            title: 'First Letter',
            description: 'Learned your first letter sound!',
            icon: '🔤',
            earned: true,
            earnedDate: '2024-01-15',
            category: 'Phonics',
        },
        {
            id: '2',
            title: 'Word Builder',
            description: 'Built your first 5-letter word',
            icon: '🧱',
            earned: true,
            earnedDate: '2024-01-20',
            category: 'Phonics',
        },
        {
            id: '3',
            title: 'Story Teller',
            description: 'Told your first complete story',
            icon: '📖',
            earned: true,
            earnedDate: '2024-01-25',
            category: 'Speaking',
        },
        {
            id: '4',
            title: 'Grammar Guru',
            description: 'Mastered basic sentence structure',
            icon: '🎓',
            earned: false,
            category: 'Grammar',
        },
        {
            id: '5',
            title: 'Reading Champion',
            description: 'Read a full story without help',
            icon: '🏆',
            earned: false,
            category: 'Reading',
        },
        {
            id: '6',
            title: 'Perfect Attendance',
            description: 'Attended all classes this month',
            icon: '📅',
            earned: true,
            earnedDate: '2024-01-30',
            category: 'Attendance',
        },
    ];
    const earnedAchievements = achievements.filter(a => a.earned);
    const upcomingAchievements = achievements.filter(a => !a.earned);
    return (_jsxs(Card, { className: "p-6", children: [_jsx("h2", { className: "text-2xl font-bold mb-6 text-center", children: "My Achievements" }), _jsxs("div", { className: "mb-6", children: [_jsxs("div", { className: "flex items-center justify-center space-x-2 mb-4", children: [_jsx("span", { className: "text-3xl", children: "\uD83C\uDFC6" }), _jsxs("span", { className: "text-xl font-bold", children: [earnedAchievements.length, " of ", achievements.length, " Earned"] })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-3", children: _jsx("div", { className: "bg-yellow-400 h-3 rounded-full transition-all duration-500", style: { width: `${(earnedAchievements.length / achievements.length) * 100}%` } }) })] }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold mb-4 text-green-700", children: "\uD83C\uDF89 Earned Badges" }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-4", children: earnedAchievements.map((achievement) => (_jsxs("div", { className: "p-4 bg-green-50 border-2 border-green-200 rounded-lg text-center hover:bg-green-100 transition-colors", children: [_jsx("div", { className: "text-4xl mb-2", children: achievement.icon }), _jsx("h4", { className: "font-semibold text-green-800", children: achievement.title }), _jsx("p", { className: "text-sm text-green-600 mb-2", children: achievement.description }), _jsx(Badge, { variant: "secondary", className: "text-xs", children: achievement.category }), achievement.earnedDate && (_jsxs("p", { className: "text-xs text-gray-500 mt-1", children: ["Earned ", new Date(achievement.earnedDate).toLocaleDateString()] }))] }, achievement.id))) })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold mb-4 text-blue-700", children: "\uD83C\uDFAF Next Goals" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: upcomingAchievements.map((achievement) => (_jsx("div", { className: "p-4 bg-gray-50 border-2 border-gray-200 rounded-lg hover:bg-gray-100 transition-colors", children: _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "text-3xl opacity-50", children: achievement.icon }), _jsxs("div", { className: "flex-1", children: [_jsx("h4", { className: "font-semibold text-gray-700", children: achievement.title }), _jsx("p", { className: "text-sm text-gray-600", children: achievement.description }), _jsx(Badge, { variant: "outline", className: "text-xs mt-1", children: achievement.category })] })] }) }, achievement.id))) })] })] }), _jsx("div", { className: "mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200", children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("span", { className: "text-2xl", children: "\uD83D\uDCAA" }), _jsxs("div", { children: [_jsx("p", { className: "font-semibold text-blue-800", children: "Keep Learning!" }), _jsx("p", { className: "text-sm text-blue-700", children: "You're doing great! Complete more activities to earn new badges." })] })] }) })] }));
};
