var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Textarea } from '@components/ui/textarea';
import { Badge } from '@components/ui/badge';
import { useMessages } from '../../hooks/useMessages';
import { format } from 'date-fns';
export const MessagesView = ({ teacherId }) => {
    const { conversations, messages, isLoading, error, sendMessage } = useMessages(teacherId);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const conversationMessages = messages.filter(m => (selectedConversation === null || selectedConversation === void 0 ? void 0 : selectedConversation.participants.includes(m.fromId)) &&
        (selectedConversation === null || selectedConversation === void 0 ? void 0 : selectedConversation.participants.includes(m.toId))).sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());
    const handleSend = () => __awaiter(void 0, void 0, void 0, function* () {
        if (!selectedConversation || !newMessage.trim())
            return;
        yield sendMessage(selectedConversation.id, newMessage);
        setNewMessage('');
    });
    if (isLoading) {
        return _jsx(Card, { className: "p-6", children: _jsx("p", { children: "Loading messages..." }) });
    }
    if (error) {
        return _jsx(Card, { className: "p-6", children: _jsx("p", { className: "text-red-500", children: error.message }) });
    }
    return (_jsxs("div", { className: "flex gap-6 h-[600px]", children: [_jsx("div", { className: "w-1/3", children: _jsxs(Card, { className: "p-4 h-full", children: [_jsx("h3", { className: "font-semibold mb-4", children: "Inbox" }), _jsx("div", { className: "space-y-2 overflow-y-auto", children: conversations.map((conv) => (_jsxs("div", { className: `p-3 rounded cursor-pointer ${(selectedConversation === null || selectedConversation === void 0 ? void 0 : selectedConversation.id) === conv.id ? 'bg-blue-100' : 'hover:bg-gray-100'}`, onClick: () => setSelectedConversation(conv), children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("p", { className: "font-medium", children: conv.id }), conv.unreadCount > 0 && (_jsx(Badge, { variant: "destructive", children: conv.unreadCount }))] }), _jsx("p", { className: "text-sm text-muted-foreground truncate", children: conv.lastMessage.content }), _jsx("p", { className: "text-xs text-muted-foreground", children: format(conv.lastMessage.timestamp.toDate(), 'MMM d, h:mm a') })] }, conv.id))) })] }) }), _jsx("div", { className: "flex-1", children: _jsx(Card, { className: "p-4 h-full flex flex-col", children: selectedConversation ? (_jsxs(_Fragment, { children: [_jsx("h3", { className: "font-semibold mb-4", children: selectedConversation.id }), _jsx("div", { className: "flex-1 overflow-y-auto space-y-2 mb-4", children: conversationMessages.map((msg) => (_jsxs("div", { className: `p-3 rounded max-w-md ${msg.fromId === teacherId ? 'ml-auto bg-blue-100' : 'bg-gray-100'}`, children: [_jsx("p", { children: msg.content }), _jsx("p", { className: "text-xs text-muted-foreground", children: format(msg.timestamp.toDate(), 'h:mm a') })] }, msg.id))) }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Textarea, { placeholder: "Type your message...", value: newMessage, onChange: (e) => setNewMessage(e.target.value), className: "flex-1" }), _jsx(Button, { onClick: handleSend, children: "Send" })] })] })) : (_jsx("div", { className: "flex items-center justify-center h-full", children: _jsx("p", { className: "text-muted-foreground", children: "Select a conversation to view messages" }) })) }) })] }));
};
