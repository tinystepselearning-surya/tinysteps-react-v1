import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { NotificationBell } from '../notifications/NotificationsPanel';
import { signOut } from 'firebase/auth';
import { auth } from '../../../../lib/firebaseConfig';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import { useAuthStore } from '../../../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

export const TeacherHeader = ({ name, upcomingCount, onToggleNotifications }) => {
    const { clearUser } = useAuthStore();
    const navigate = useNavigate();
    const handleLogout = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield signOut(auth);
            clearUser();
            navigate('/teacher/login');
        }
        catch (err) {
            console.error('Logout failed', err);
        }
    });
    const initials = name === null || name === void 0 ? void 0 : name.split(' ').map((part) => part[0] || '').join('').slice(0, 2).toUpperCase();
    return (_jsxs(Card, { className: "flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Welcome back" }), _jsx("h1", { className: "text-2xl font-bold", children: name || 'Teacher' }), typeof upcomingCount === 'number' && (_jsxs("p", { className: "text-sm text-muted-foreground mt-1", children: ["You have ", _jsx("span", { className: "font-semibold", children: upcomingCount }), " session", upcomingCount === 1 ? '' : 's', " today."] }))] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsx(React.Suspense, { fallback: null, children: _jsx(NotificationBell, { count: 2 }) }), " ", _jsx("div", { className: "h-12 w-12 rounded-full bg-white/80 dark:bg-slate-800 text-blue-600 flex items-center justify-center font-semibold", children: initials || 'TT' }), _jsx(Button, { variant: "outline", onClick: handleLogout, children: "Logout" })] })] }));
};
