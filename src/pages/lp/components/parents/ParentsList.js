import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
export const ParentsList = ({ lpId }) => {
    // Mock data - in real implementation, fetch from Firestore
    const parents = [
        {
            id: '1',
            name: 'Parent Name',
            email: 'rajesh@example.com',
            phone: '+91 98765 43210',
            childrenCount: 2,
            totalDue: 4000,
            lastPayment: '2025-11-01',
            status: 'active',
        },
        {
            id: '2',
            name: 'Parent Name',
            email: 'email@example.com',
            phone: '+91 98765 43211',
            childrenCount: 1,
            totalDue: 2000,
            lastPayment: '2025-10-15',
            status: 'active',
        },
    ];
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-2xl font-bold", children: "Assigned Parents" }), _jsx(Button, { children: "Add Parent" })] }), _jsx("div", { className: "grid gap-4", children: parents.map((parent) => (_jsx(Card, { className: "p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("h3", { className: "text-lg font-semibold", children: parent.name }), _jsx(Badge, { variant: parent.status === 'active' ? 'default' : 'secondary', children: parent.status })] }), _jsx("p", { className: "text-muted-foreground", children: parent.email }), _jsx("p", { className: "text-muted-foreground", children: parent.phone }), _jsxs("div", { className: "flex gap-4 text-sm", children: [_jsxs("span", { children: [parent.childrenCount, " children"] }), _jsxs("span", { children: ["Last payment: ", parent.lastPayment] })] })] }), _jsxs("div", { className: "text-right space-y-2", children: [_jsxs("p", { className: "text-lg font-semibold text-red-600", children: ["\u20B9", parent.totalDue, " due"] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "outline", size: "sm", children: "View Details" }), _jsx(Button, { variant: "outline", size: "sm", children: "Contact" })] })] })] }) }, parent.id))) })] }));
};
export default ParentsList;
