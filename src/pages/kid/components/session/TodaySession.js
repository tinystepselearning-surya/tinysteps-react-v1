import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Clock, Video, Users } from 'lucide-react';
export const TodaySession = ({ kidId }) => {
    // Mock data - in real implementation, fetch from Firestore
    const session = {
        id: 'session-1',
        subject: 'Phonics Fun',
        teacherName: 'Ms. Sarah',
        time: '10:00 AM',
        duration: 35,
        joinUrl: 'https://zoom.us/j/123456789',
        isGroup: false,
        status: 'upcoming',
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'in-progress':
                return 'bg-green-100 text-green-800';
            case 'starting':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-blue-100 text-blue-800';
        }
    };
    const getStatusText = (status) => {
        switch (status) {
            case 'in-progress':
                return 'Class in Progress';
            case 'starting':
                return 'Starting Soon';
            default:
                return 'Upcoming';
        }
    };
    return (_jsxs(Card, { className: "p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h2", { className: "text-2xl font-bold text-blue-800", children: "Today's Session" }), _jsx(Badge, { className: getStatusColor(session.status), children: getStatusText(session.status) })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold", children: "\uD83D\uDCDA" }), _jsxs("div", { children: [_jsx("h3", { className: "text-xl font-semibold", children: session.subject }), _jsxs("p", { className: "text-gray-600", children: ["with ", session.teacherName] })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Clock, { className: "w-5 h-5 text-blue-600" }), _jsx("span", { className: "font-medium", children: session.time })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Video, { className: "w-5 h-5 text-blue-600" }), _jsxs("span", { className: "font-medium", children: [session.duration, " minutes"] })] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Users, { className: "w-5 h-5 text-blue-600" }), _jsx("span", { className: "font-medium", children: session.isGroup ? 'Group Class' : '1-on-1 Session' })] }), _jsx("div", { className: "pt-4 border-t", children: _jsx(Button, { className: "w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg", onClick: () => window.open(session.joinUrl, '_blank'), children: "\uD83D\uDE80 Join Class Now" }) })] })] }));
};
