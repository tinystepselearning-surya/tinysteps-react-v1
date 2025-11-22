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
import { useSearchParams, useNavigate } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../lib/firebaseConfig';
import { toast } from '@components/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
const PaymentCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading');
    const [message, setMessage] = useState('Verifying payment...');
    useEffect(() => {
        const verifyPayment = () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                // Get payment parameters from URL
                const transactionId = searchParams.get('transactionId');
                const merchantId = searchParams.get('merchantId');
                const responseCode = searchParams.get('responseCode');
                if (!transactionId) {
                    setStatus('failed');
                    setMessage('Invalid payment response - missing transaction ID');
                    return;
                }
                // Call the verify payment function
                const verifyPaymentFunction = httpsCallable(functions, 'verifyPhonePePayment');
                const result = yield verifyPaymentFunction({
                    transactionId,
                    merchantId,
                    responseCode
                });
                const { success, message: resultMessage } = result.data;
                if (success) {
                    setStatus('success');
                    setMessage(resultMessage || 'Payment completed successfully!');
                    toast({
                        title: 'Payment Successful',
                        description: 'Your payment has been processed successfully.',
                    });
                }
                else {
                    setStatus('failed');
                    setMessage(resultMessage || 'Payment verification failed');
                    toast({
                        title: 'Payment Failed',
                        description: resultMessage || 'Payment verification failed',
                        variant: 'destructive',
                    });
                }
            }
            catch (error) {
                console.error('Payment verification error:', error);
                setStatus('failed');
                setMessage('An error occurred while verifying payment');
                toast({
                    title: 'Verification Error',
                    description: 'An error occurred while verifying your payment.',
                    variant: 'destructive',
                });
            }
        });
        verifyPayment();
    }, [searchParams]);
    const handleReturnToDashboard = () => {
        navigate('/parent/dashboard');
    };
    return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center p-4", children: _jsxs(Card, { className: "w-full max-w-md", children: [_jsxs(CardHeader, { className: "text-center", children: [_jsxs(CardTitle, { className: "flex items-center justify-center gap-2", children: [status === 'loading' && _jsx(Loader2, { className: "h-6 w-6 animate-spin" }), status === 'success' && _jsx(CheckCircle, { className: "h-6 w-6 text-green-600" }), status === 'failed' && _jsx(XCircle, { className: "h-6 w-6 text-red-600" }), "Payment ", status === 'loading' ? 'Processing' : status === 'success' ? 'Successful' : 'Failed'] }), _jsx(CardDescription, { children: message })] }), _jsxs(CardContent, { className: "text-center space-y-4", children: [status === 'loading' && (_jsx("div", { className: "flex justify-center", children: _jsx(Loader2, { className: "h-8 w-8 animate-spin text-blue-600" }) })), status === 'success' && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "text-green-600", children: [_jsx(CheckCircle, { className: "h-12 w-12 mx-auto mb-2" }), _jsx("p", { className: "font-medium", children: "Payment Completed" })] }), _jsx(Button, { onClick: handleReturnToDashboard, className: "w-full", children: "Return to Dashboard" })] })), status === 'failed' && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "text-red-600", children: [_jsx(XCircle, { className: "h-12 w-12 mx-auto mb-2" }), _jsx("p", { className: "font-medium", children: "Payment Failed" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Button, { onClick: handleReturnToDashboard, variant: "outline", className: "w-full", children: "Return to Dashboard" }), _jsx(Button, { onClick: () => window.history.back(), variant: "outline", className: "w-full", children: "Try Again" })] })] }))] })] }) }));
};
export default PaymentCallback;
