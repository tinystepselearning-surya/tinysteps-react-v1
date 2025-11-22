import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from '@components/ui/card';
export const PaymentHistory = ({ payments }) => {
    if (!payments.length) {
        return _jsx(Card, { className: "p-6 text-sm text-muted-foreground", children: "No payment history yet." });
    }
    return (_jsxs(Card, { className: "p-6 space-y-3", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Payment History" }), payments.slice(0, 5).map((payment) => (_jsxs("div", { className: "border rounded-lg p-3 flex flex-col md:flex-row md:items-center md:justify-between text-sm", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium", children: payment.date }), _jsxs("p", { className: "text-muted-foreground", children: ["Invoice ", payment.invoiceId] })] }), _jsxs("div", { className: "text-right", children: [_jsxs("p", { className: "font-semibold", children: ["\u20B9", payment.amount] }), _jsx("p", { className: "text-muted-foreground capitalize", children: payment.status })] })] }, payment.id)))] }));
};
