import React from 'react';
interface PaymentModalProps {
    invoiceId: string;
    amount: number;
    onPaymentComplete: () => void;
    onClose: () => void;
}
declare const PaymentModal: React.FC<PaymentModalProps>;
export default PaymentModal;
