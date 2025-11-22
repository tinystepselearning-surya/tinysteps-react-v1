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
import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../lib/firebaseConfig';
import { Button } from '@components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, } from '@components/ui/dialog';
import { useToast } from '@components/hooks/use-toast';
export function PhonePePaymentModal({ invoiceId, amount, open, onClose, onSuccess, }) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const handlePhonePePayment = () => __awaiter(this, void 0, void 0, function* () {
        setIsLoading(true);
        try {
            // 1. Call Cloud Function to create PhonePe order
            const createPhonePeOrder = httpsCallable(functions, 'createPhonePeOrder');
            const response = yield createPhonePeOrder({
                invoiceId,
                amount, // in rupees
            });
            // 2. Redirect to PhonePe payment page
            const data = response.data;
            if (data.redirectUrl) {
                window.location.href = data.redirectUrl;
            }
            else {
                throw new Error('No redirect URL received');
            }
        }
        catch (error) {
            console.error('PhonePe payment error:', error);
            const errorMessage = error.message || 'Failed to initiate payment';
            // Check if it's a configuration error
            const isConfigError = errorMessage.includes('not yet configured');
            toast({
                title: isConfigError ? 'Payment Method Unavailable' : 'Payment Error',
                description: isConfigError
                    ? 'PhonePe payment gateway is currently being set up. Please try again in a few days or contact support for alternative payment options.'
                    : errorMessage,
                variant: isConfigError ? 'default' : 'destructive',
            });
            setIsLoading(false);
        }
    });
    return (_jsx(Dialog, { open: open, onOpenChange: onClose, children: _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Pay with PhonePe" }) }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "bg-gray-50 rounded-lg p-4 space-y-2", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "Invoice ID:" }), _jsx("span", { className: "font-semibold", children: invoiceId })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "Amount:" }), _jsxs("span", { className: "font-semibold text-lg", children: ["\u20B9", amount] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "Payment Method:" }), _jsx("span", { className: "font-semibold", children: "PhonePe" })] })] }), _jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-700", children: ["\u2705 Secure payment gateway", _jsx("br", {}), "You will be redirected to PhonePe for payment"] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "outline", onClick: onClose, disabled: isLoading, className: "flex-1", children: "Cancel" }), _jsx(Button, { onClick: handlePhonePePayment, disabled: isLoading, className: "flex-1 bg-blue-600 hover:bg-blue-700", children: isLoading ? 'Processing...' : 'Pay ₹' + amount })] })] })] }) }));
}
