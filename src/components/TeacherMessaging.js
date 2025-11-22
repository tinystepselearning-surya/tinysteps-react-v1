import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Badge } from '@components/ui/badge';
const TeacherMessaging = () => {
    const [selectedTeacher, setSelectedTeacher] = React.useState('');
    const [message, setMessage] = React.useState('');
    // Do not include demo teacher or child names in the build.
    const teachers = [];
    const messages = [];
    const handleSendMessage = () => {
        console.log('Sending message:', message);
        setMessage('');
    };
    return (_jsxs("div", { className: "p-4 flex gap-4", children: [_jsxs(Card, { className: "w-1/3", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Teachers" }) }), _jsxs(CardContent, { children: [teachers.length === 0 && _jsx("p", { className: "text-sm text-gray-500", children: "No teachers found. Connect a teacher to start messaging." }), teachers.map(teacher => {
                                var _a, _b;
                                return (_jsx("div", { className: `p-2 cursor-pointer rounded ${selectedTeacher === teacher.id ? 'bg-blue-100' : ''}`, onClick: () => setSelectedTeacher(teacher.id), children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold", children: ((_a = teacher.name) === null || _a === void 0 ? void 0 : _a[0]) || 'T' }), _jsxs("div", { children: [_jsx("p", { className: "font-bold", children: teacher.name }), _jsx("p", { className: "text-sm text-gray-600", children: teacher.child }), _jsx("p", { className: "text-sm", children: teacher.lastMessage })] }), ((_b = teacher.unread) !== null && _b !== void 0 ? _b : 0) > 0 && _jsx(Badge, { children: teacher.unread }), _jsx(Badge, { variant: teacher.online ? 'default' : 'secondary', children: teacher.online ? 'Online' : 'Offline' })] }) }, teacher.id));
                            })] })] }), _jsxs(Card, { className: "flex-1", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Messages" }) }), _jsxs(CardContent, { className: "flex flex-col h-96", children: [_jsx("div", { className: "flex-1 overflow-y-auto", children: messages.map(msg => {
                                    var _a;
                                    return (_jsx("div", { className: `mb-2 ${msg.sender === 'parent' ? 'text-right' : 'text-left'}`, children: _jsxs("div", { className: `inline-block p-2 rounded ${msg.sender === 'parent' ? 'bg-blue-200' : 'bg-gray-200'}`, children: [_jsx("p", { children: msg.text }), (_a = msg.attachments) === null || _a === void 0 ? void 0 : _a.map(att => _jsx("p", { className: "text-sm underline", children: att }, att)), _jsx("p", { className: "text-xs", children: msg.time })] }) }, msg.id));
                                }) }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { value: message, onChange: (e) => setMessage(e.target.value), placeholder: "Type a message..." }), _jsx(Button, { onClick: handleSendMessage, children: "Send" })] })] })] })] }));
};
export default TeacherMessaging;
