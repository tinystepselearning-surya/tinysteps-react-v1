import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
export const WorksheetsList = ({ kidId }) => {
    // Mock data - in real implementation, fetch from Firestore
    const worksheets = [
        {
            id: '1',
            title: 'Letter A Practice',
            subject: 'Phonics',
            difficulty: 'Easy',
            estimatedTime: 10,
            completed: true,
            score: 95,
            icon: '🔤',
        },
        {
            id: '2',
            title: 'Short Vowel Sounds',
            subject: 'Phonics',
            difficulty: 'Medium',
            estimatedTime: 15,
            completed: true,
            score: 88,
            icon: '📝',
        },
        {
            id: '3',
            title: 'Simple Sentences',
            subject: 'Grammar',
            difficulty: 'Easy',
            estimatedTime: 12,
            completed: false,
            icon: '✏️',
        },
        {
            id: '4',
            title: 'Story Comprehension',
            subject: 'Reading',
            difficulty: 'Medium',
            estimatedTime: 20,
            completed: false,
            icon: '📖',
        },
        {
            id: '5',
            title: 'Word Families',
            subject: 'Phonics',
            difficulty: 'Medium',
            estimatedTime: 18,
            completed: false,
            icon: '🏠',
        },
    ];
    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'Easy':
                return 'bg-green-100 text-green-800';
            case 'Medium':
                return 'bg-yellow-100 text-yellow-800';
            case 'Hard':
                return 'bg-red-100 text-red-800';
        }
    };
    const completedWorksheets = worksheets.filter(w => w.completed);
    const pendingWorksheets = worksheets.filter(w => !w.completed);
    return (_jsxs(Card, { className: "p-6", children: [_jsx("h2", { className: "text-2xl font-bold mb-6 text-center", children: "My Worksheets" }), _jsxs("div", { className: "mb-6", children: [_jsxs("div", { className: "flex items-center justify-center space-x-2 mb-4", children: [_jsx("span", { className: "text-3xl", children: "\uD83D\uDCDD" }), _jsxs("span", { className: "text-xl font-bold", children: [completedWorksheets.length, " of ", worksheets.length, " Completed"] })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-3", children: _jsx("div", { className: "bg-blue-400 h-3 rounded-full transition-all duration-500", style: { width: `${(completedWorksheets.length / worksheets.length) * 100}%` } }) })] }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold mb-4 text-green-700", children: "\u2705 Completed Worksheets" }), _jsx("div", { className: "space-y-3", children: completedWorksheets.map((worksheet) => (_jsxs("div", { className: "p-4 bg-green-50 border border-green-200 rounded-lg", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("span", { className: "text-2xl", children: worksheet.icon }), _jsxs("div", { children: [_jsx("h4", { className: "font-semibold text-green-800", children: worksheet.title }), _jsx("p", { className: "text-sm text-green-600", children: worksheet.subject })] })] }), _jsxs("div", { className: "text-right", children: [_jsx(Badge, { className: getDifficultyColor(worksheet.difficulty), children: worksheet.difficulty }), _jsxs("p", { className: "text-sm text-green-700 mt-1", children: ["Score: ", worksheet.score, "%"] })] })] }), _jsxs("div", { className: "mt-2 flex items-center justify-between text-sm text-green-600", children: [_jsxs("span", { children: ["\u23F1\uFE0F ", worksheet.estimatedTime, " minutes"] }), _jsx(Button, { variant: "outline", size: "sm", className: "text-green-700 border-green-300", children: "Review Again" })] })] }, worksheet.id))) })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold mb-4 text-blue-700", children: "\uD83C\uDFAF Available Worksheets" }), _jsx("div", { className: "space-y-3", children: pendingWorksheets.map((worksheet) => (_jsxs("div", { className: "p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("span", { className: "text-2xl", children: worksheet.icon }), _jsxs("div", { children: [_jsx("h4", { className: "font-semibold text-blue-800", children: worksheet.title }), _jsx("p", { className: "text-sm text-blue-600", children: worksheet.subject })] })] }), _jsx("div", { className: "text-right", children: _jsx(Badge, { className: getDifficultyColor(worksheet.difficulty), children: worksheet.difficulty }) })] }), _jsxs("div", { className: "mt-2 flex items-center justify-between text-sm text-blue-600", children: [_jsxs("span", { children: ["\u23F1\uFE0F ", worksheet.estimatedTime, " minutes"] }), _jsx(Button, { size: "sm", className: "bg-blue-600 hover:bg-blue-700", children: "Start Now" })] })] }, worksheet.id))) })] })] }), _jsx("div", { className: "mt-8 p-4 bg-purple-50 rounded-lg border border-purple-200", children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("span", { className: "text-2xl", children: "\uD83C\uDFA8" }), _jsxs("div", { children: [_jsx("p", { className: "font-semibold text-purple-800", children: "Practice Makes Perfect!" }), _jsx("p", { className: "text-sm text-purple-700", children: "Complete worksheets to strengthen your skills and earn more achievements." })] })] }) })] }));
};
