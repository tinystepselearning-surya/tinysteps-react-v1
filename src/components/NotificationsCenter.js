import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Label } from '@components/ui/label';
const NotificationsCenter = () => {
    const [emailNotifs, setEmailNotifs] = React.useState(true);
    const [smsNotifs, setSmsNotifs] = React.useState(false);
    const [inAppNotifs, setInAppNotifs] = React.useState(true);
    // No demo notifications shipped with the build
    const notifications = [];
    const handleMarkRead = (id) => {
        console.log('Marking notification as read:', id);
    };
    return (_jsxs("div", { className: "p-4", children: [_jsx("h1", { className: "text-2xl font-bold mb-4", children: "Notifications Center" }), _jsxs(Card, { className: "mb-4", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Notification Settings" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "checkbox", checked: emailNotifs, onChange: (e) => setEmailNotifs(e.target.checked) }), _jsx(Label, { children: "Email Notifications" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "checkbox", checked: smsNotifs, onChange: (e) => setSmsNotifs(e.target.checked) }), _jsx(Label, { children: "SMS Notifications" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "checkbox", checked: inAppNotifs, onChange: (e) => setInAppNotifs(e.target.checked) }), _jsx(Label, { children: "In-App Notifications" })] })] }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Recent Notifications" }) }), _jsxs(CardContent, { children: [notifications.length === 0 && _jsx("p", { className: "text-sm text-gray-500", children: "No notifications yet." }), notifications.map(notification => (_jsx("div", { className: `p-4 border-b ${notification.read ? 'bg-gray-50' : 'bg-white'}`, children: _jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { children: [_jsx(Badge, { variant: "outline", children: notification.type }), _jsx("p", { className: "mt-1", children: notification.message }), _jsx("p", { className: "text-sm text-gray-500", children: notification.time })] }), !notification.read && (_jsx(Button, { size: "sm", onClick: () => handleMarkRead(notification.id), children: "Mark Read" }))] }) }, notification.id)))] })] })] }));
};
export default NotificationsCenter;
