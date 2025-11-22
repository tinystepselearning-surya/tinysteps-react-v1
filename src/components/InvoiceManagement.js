import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { Badge } from '@components/ui/badge';
import { ChevronDown } from 'lucide-react';
import PaymentModal from '../pages/parent/Payments/PaymentModal';
const InvoiceManagement = () => {
    const [showPaymentModal, setShowPaymentModal] = React.useState(false);
    const [selectedInvoice, setSelectedInvoice] = React.useState(null);
    const [showPaid, setShowPaid] = React.useState(false);
    const outstandingInvoices = [
        { id: 1, description: 'November Tuition', amount: 2000, dueDate: '2025-11-15', status: 'OVERDUE', courses: ['Phonics Level 1', 'Grammar Level 1'] },
        { id: 2, description: 'October Tuition', amount: 1500, dueDate: '2025-11-20', status: 'DUE SOON', courses: ['Speaking Level 1'] },
    ];
    const paidInvoices = [
        { id: 3, description: 'September Tuition', amount: 2000, paidDate: '2025-10-01', method: 'UPI' },
    ];
    const handlePayNow = (invoice) => {
        setSelectedInvoice(invoice);
        setShowPaymentModal(true);
    };
    const handlePaymentComplete = () => {
        setShowPaymentModal(false);
        setSelectedInvoice(null);
        // Refresh invoices or show success message
        console.log('Payment completed successfully');
    };
    return (_jsxs("div", { className: "p-4", children: [_jsx("h1", { className: "text-2xl font-bold mb-4", children: "Invoice Management" }), _jsxs(Card, { className: "mb-6", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "OUTSTANDING INVOICES" }) }), _jsx(CardContent, { children: _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "Invoice ID" }), _jsx(TableHead, { children: "Amount" }), _jsx(TableHead, { children: "Due Date" }), _jsx(TableHead, { children: "Status" }), _jsx(TableHead, { children: "Actions" })] }) }), _jsx(TableBody, { children: outstandingInvoices.map((invoice) => (_jsxs(TableRow, { children: [_jsxs(TableCell, { children: ["INV-2025-", invoice.id.toString().padStart(3, '0')] }), _jsxs(TableCell, { children: ["\u20B9", invoice.amount] }), _jsx(TableCell, { children: invoice.dueDate }), _jsx(TableCell, { children: _jsx(Badge, { variant: invoice.status === 'OVERDUE' ? 'destructive' : invoice.status === 'DUE SOON' ? 'secondary' : 'default', children: invoice.status }) }), _jsxs(TableCell, { children: [_jsx(Button, { variant: "outline", className: "mr-2", children: "View Invoice" }), _jsx(Button, { onClick: () => handlePayNow(invoice), children: "Pay Now" })] })] }, invoice.id))) })] }) })] }), _jsxs(Button, { variant: "outline", onClick: () => setShowPaid(!showPaid), className: "mb-4", children: ["Paid Invoices ", _jsx(ChevronDown, { className: `ml-2 transition-transform ${showPaid ? 'rotate-180' : ''}` })] }), showPaid && (_jsx(Card, { children: _jsx(CardContent, { children: _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "Invoice ID" }), _jsx(TableHead, { children: "Amount" }), _jsx(TableHead, { children: "Paid Date" }), _jsx(TableHead, { children: "Method" }), _jsx(TableHead, { children: "Status" })] }) }), _jsx(TableBody, { children: paidInvoices.map((invoice) => (_jsxs(TableRow, { children: [_jsxs(TableCell, { children: ["INV-2025-", invoice.id.toString().padStart(3, '0')] }), _jsxs(TableCell, { children: ["\u20B9", invoice.amount] }), _jsx(TableCell, { children: invoice.paidDate }), _jsx(TableCell, { children: invoice.method }), _jsx(TableCell, { children: _jsx(Badge, { variant: "default", children: "Paid" }) })] }, invoice.id))) })] }) }) })), showPaymentModal && selectedInvoice && (_jsx(PaymentModal, { invoiceId: `INV-2025-${selectedInvoice.id.toString().padStart(3, '0')}`, amount: selectedInvoice.amount, onPaymentComplete: handlePaymentComplete, onClose: () => {
                    setShowPaymentModal(false);
                    setSelectedInvoice(null);
                } }))] }));
};
export default InvoiceManagement;
