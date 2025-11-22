var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../../lib/firebaseConfig';
export const TicketsList = ({ lpId }) => {
    const [tickets, setTickets] = useState([]);
    useEffect(() => {
        const fetchTickets = () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const ticketsQuery = query(collection(db, 'tickets'), where('lpId', '==', lpId || null));
                const querySnapshot = yield getDocs(ticketsQuery);
                const fetchedTickets = querySnapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
                setTickets(fetchedTickets);
            }
            catch (error) {
                console.error('Error fetching tickets:', error);
            }
        });
        fetchTickets();
    }, [lpId]);
    const getStatusColor = (status) => {
        switch (status) {
            case 'open': return 'destructive';
            case 'in_progress': return 'default';
            case 'resolved': return 'secondary';
            case 'closed': return 'outline';
            default: return 'secondary';
        }
    };
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent': return 'destructive';
            case 'high': return 'orange';
            case 'medium': return 'yellow';
            case 'low': return 'green';
            default: return 'secondary';
        }
    };
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-2xl font-bold", children: "Support Tickets" }), _jsx(Button, { children: "Create Ticket" })] }), _jsx("div", { className: "grid gap-4", children: tickets.map((ticket) => (_jsx(Card, { className: "p-6", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "space-y-2 flex-1", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("h3", { className: "text-lg font-semibold", children: ticket.title }), _jsx(Badge, { variant: getStatusColor(ticket.status), children: ticket.status.replace('_', ' ') }), _jsx(Badge, { variant: "outline", className: `text-${getPriorityColor(ticket.priority)}-600`, children: ticket.priority })] }), _jsx("p", { className: "text-muted-foreground", children: ticket.description }), _jsxs("div", { className: "flex gap-4 text-sm text-muted-foreground", children: [_jsxs("span", { children: ["By: ", ticket.createdBy] }), _jsxs("span", { children: ["Created: ", ticket.createdAt] }), ticket.assignedTo && _jsxs("span", { children: ["Assigned: ", ticket.assignedTo] })] })] }), _jsxs("div", { className: "flex gap-2 ml-4", children: [_jsx(Button, { variant: "outline", size: "sm", children: "View Details" }), ticket.status !== 'resolved' && ticket.status !== 'closed' && (_jsx(Button, { variant: "outline", size: "sm", children: "Update" }))] })] }) }, ticket.id))) })] }));
};
export default TicketsList;
