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
import { functions } from '../../lib/firebaseConfig';
import { useToast } from '@components/hooks/use-toast';
export function PhonePeCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const verifyPayment = () => __awaiter(this, void 0, void 0, function* () {
            try {
                // Extract PhonePe response from URL
                const merchantTransactionId = searchParams.get('merchantTransactionId');
                const transactionId = searchParams.get('transactionId');
                if (!merchantTransactionId || !transactionId) {
                    throw new Error('Missing payment parameters');
                }
                // Verify with backend
                const verifyPhonePePayment = httpsCallable(functions, 'verifyPhonePePayment');
                const result = yield verifyPhonePePayment({
                    merchantTransactionId,
                    transactionId,
                });
                const data = result.data;
                if (data.success) {
                    toast({
                        title: 'Payment Successful',
                        description: 'Your payment has been processed',
                    });
                    // Redirect to success page or invoices
                    navigate('/parent/payments?success=true');
                }
                else {
                    throw new Error('Payment verification failed');
                }
            }
            catch (error) {
                console.error('Callback error:', error);
                toast({
                    title: 'Payment Verification Error',
                    description: error.message,
                    variant: 'destructive',
                });
                navigate('/parent/payments?error=true');
            }
            finally {
                setLoading(false);
            }
        });
        verifyPayment();
    }, [searchParams, navigate, toast]);
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center h-screen", children: _jsxs("div", { className: "text-center", children: [_jsx("h1", { children: "Verifying Payment..." }), _jsx("p", { className: "text-gray-600", children: "Please wait while we confirm your payment" })] }) }));
    }
    return null;
}
