import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Bell } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@components/ui/dropdown-menu';
export const NotificationsPanel = ({ teacherId }) => {
    const [notifications, setNotifications] = useState([
        {
            id: '1',
            title: 'New session scheduled',
            message: 'You have a new session scheduled for tomorrow.',
            timestamp: new Date(),
            read: false,
        },
        {
            id: '2',
            title: 'Parent message',
            message: 'A parent has sent you a message.',
            timestamp: new Date(Date.now() - 3600000),
            read: false,
        },
    ]);
    const unreadCount = notifications.filter(n => !n.read).length;
    const markAsRead = (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? Object.assign(Object.assign({}, n), { read: true }) : n));
    };
    return (_jsx("div", { className: "space-y-6", children: _jsxs(Card, { className: "p-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Notifications" }), _jsx("div", { className: "space-y-4", children: notifications.map(notification => (_jsxs("div", { className: `p-4 border rounded ${notification.read ? 'bg-gray-50' : 'bg-blue-50'}`, children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("h4", { className: "font-medium", children: notification.title }), !notification.read && (_jsx(Badge, { variant: "destructive", children: "New" }))] }), _jsx("p", { className: "text-sm text-muted-foreground", children: notification.message }), _jsx("p", { className: "text-xs text-muted-foreground", children: notification.timestamp.toLocaleString() }), !notification.read && (_jsx(Button, { size: "sm", variant: "outline", onClick: () => markAsRead(notification.id), className: "mt-2", children: "Mark as Read" }))] }, notification.id))) })] }) }));
};
// For header bell icon
export const NotificationBell = ({ count }) => {
    return (_jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsxs(Button, { variant: "ghost", size: "sm", className: "relative", children: [_jsx(Bell, { className: "h-5 w-5" }), count > 0 && (_jsx(Badge, { className: "absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs", children: count }))] }) }), _jsx(DropdownMenuContent, { className: "w-80", children: _jsxs("div", { className: "space-y-2", children: [_jsx("h4", { className: "font-medium", children: "Notifications" }), _jsxs("div", { className: "text-sm text-muted-foreground", children: ["You have ", count, " unread notifications."] }), _jsx(Button, { variant: "outline", size: "sm", children: "View All" })] }) })] }));
};
