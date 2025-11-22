import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import PaymentModal from '../../Payments/PaymentModal';
export const InvoiceList = ({ invoices }) => {
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const outstanding = useMemo(() => invoices.filter((invoice) => invoice.status !== 'paid'), [invoices]);
    if (!invoices.length) {
        return _jsx(Card, { className: "p-6 text-sm text-muted-foreground", children: "No invoices available." });
    }
    return (_jsxs(_Fragment, { children: [_jsxs(Card, { className: "p-6 space-y-4", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Invoices & Payments" }), outstanding.length ? (outstanding.map((invoice) => (_jsxs("div", { className: "border rounded-lg p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between", children: [_jsxs("div", { children: [_jsxs("p", { className: "font-semibold", children: ["Invoice ", invoice.id] }), _jsxs("p", { className: "text-sm text-muted-foreground", children: ["Due ", invoice.dueDate] }), _jsxs("p", { className: "text-sm text-muted-foreground", children: ["Status: ", invoice.status] })] }), _jsxs("div", { className: "text-right", children: [_jsxs("p", { className: "text-2xl font-bold", children: ["\u20B9", invoice.amount] }), _jsx(Button, { className: "mt-2", onClick: () => setSelectedInvoice(invoice), children: "Pay Now" })] })] }, invoice.id)))) : (_jsx("p", { className: "text-sm text-muted-foreground", children: "No outstanding invoices. Thank you!" }))] }), _jsx(PaymentModal, { invoiceId: selectedInvoice.id, amount: selectedInvoice.amount, onPaymentComplete: () => { }, onClose: () => setSelectedInvoice(null) })] }));
};
