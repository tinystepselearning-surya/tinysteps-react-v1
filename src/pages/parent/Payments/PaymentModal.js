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
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../lib/firebaseConfig';
import { toast } from '@components/hooks/use-toast';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card';
import { Loader2 } from 'lucide-react';
const PaymentModal = ({ invoiceId, amount, onPaymentComplete, onClose }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const handlePhonePePayment = () => __awaiter(void 0, void 0, void 0, function* () {
        if (!invoiceId || !amount) {
            toast({ title: 'Error', description: 'Invalid payment details', variant: 'destructive' });
            return;
        }
        setIsProcessing(true);
        try {
            // Create PhonePe order
            const createOrder = httpsCallable(functions, 'createPhonePeOrder');
            const response = yield createOrder({
                invoiceId,
                amount: amount // amount in rupees
            });
            const { redirectUrl } = response.data;
            if (!redirectUrl) {
                throw new Error('Failed to get payment URL');
            }
            // Redirect to PhonePe payment page
            window.location.href = redirectUrl;
            // Note: User will be redirected back to callback URL after payment
            // The callback page should handle verification and call onPaymentComplete
        }
        catch (error) {
            console.error('Payment initiation failed:', error);
            toast({ title: 'Error', description: error.message || 'Payment initiation failed', variant: 'destructive' });
        }
        finally {
            setIsProcessing(false);
        }
    });
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs(Card, { className: "w-full max-w-md mx-4", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Complete Payment" }), _jsxs(CardDescription, { children: ["Pay \u20B9", amount, " for Invoice #", invoiceId] })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "text-center", children: [_jsxs("p", { className: "text-lg font-semibold", children: ["\u20B9", amount] }), _jsx("p", { className: "text-sm text-gray-600", children: "Total amount due" })] }), _jsx(Button, { onClick: handlePhonePePayment, disabled: isProcessing, className: "w-full bg-blue-600 hover:bg-blue-700", children: isProcessing ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Processing..."] })) : ('Pay with PhonePe') }), _jsx(Button, { variant: "outline", onClick: onClose, className: "w-full", disabled: isProcessing, children: "Cancel" }), _jsx("div", { className: "text-xs text-gray-500 text-center", children: "You will be redirected to PhonePe secure payment page" })] })] }) }));
};
export default PaymentModal;
