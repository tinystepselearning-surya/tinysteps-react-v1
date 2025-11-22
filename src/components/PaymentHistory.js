import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Card, CardContent } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { Badge } from '@components/ui/badge';
import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
const PaymentHistory = () => {
    const [filterDate, setFilterDate] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterMethod, setFilterMethod] = useState('');
    const payments = [
        { id: 1, invoiceId: 'INV-2025-001', amount: 2000, date: '2025-11-01', method: 'UPI', status: 'Paid' },
        { id: 2, invoiceId: 'INV-2025-002', amount: 1500, date: '2025-10-15', method: 'Bank Transfer', status: 'Paid' },
        { id: 3, invoiceId: 'INV-2025-003', amount: 1000, date: '2025-09-20', method: 'Credit Card', status: 'Refunded' },
    ];
    const filteredPayments = payments.filter(payment => {
        return (!filterDate || payment.date.includes(filterDate)) &&
            (!filterStatus || payment.status === filterStatus) &&
            (!filterMethod || payment.method === filterMethod);
    });
    const handleExport = () => {
        // Implement CSV export
        console.log('Exporting to CSV');
    };
    return (_jsxs("div", { className: "p-4", children: [_jsx("h1", { className: "text-2xl font-bold mb-4", children: "Payment History" }), _jsx(Card, { className: "mb-4", children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex gap-4", children: [_jsx(Input, { type: "date", placeholder: "Filter by date", value: filterDate, onChange: (e) => setFilterDate(e.target.value) }), _jsxs(Select, { value: filterStatus, onValueChange: setFilterStatus, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Status" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "Paid", children: "Paid" }), _jsx(SelectItem, { value: "Refunded", children: "Refunded" })] })] }), _jsxs(Select, { value: filterMethod, onValueChange: setFilterMethod, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Payment Method" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "UPI", children: "UPI" }), _jsx(SelectItem, { value: "Bank Transfer", children: "Bank Transfer" }), _jsx(SelectItem, { value: "Credit Card", children: "Credit Card" })] })] }), _jsx(Button, { onClick: handleExport, children: "Export CSV" })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { children: _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "Invoice ID" }), _jsx(TableHead, { children: "Amount" }), _jsx(TableHead, { children: "Date Paid" }), _jsx(TableHead, { children: "Payment Method" }), _jsx(TableHead, { children: "Status" }), _jsx(TableHead, { children: "Receipt" })] }) }), _jsx(TableBody, { children: filteredPayments.map((payment) => (_jsxs(TableRow, { children: [_jsx(TableCell, { children: payment.invoiceId }), _jsxs(TableCell, { children: ["\u20B9", payment.amount] }), _jsx(TableCell, { children: payment.date }), _jsx(TableCell, { children: payment.method }), _jsx(TableCell, { children: _jsx(Badge, { variant: payment.status === 'Paid' ? 'default' : 'secondary', children: payment.status }) }), _jsx(TableCell, { children: _jsx(Button, { variant: "outline", size: "sm", children: "Download" }) })] }, payment.id))) })] }) }) })] }));
};
export default PaymentHistory;
