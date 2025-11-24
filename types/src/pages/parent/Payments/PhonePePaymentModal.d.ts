interface PhonePePaymentModalProps {
    invoiceId: string;
    amount: number;
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}
export declare function PhonePePaymentModal({ invoiceId, amount, open, onClose, onSuccess, }: PhonePePaymentModalProps): import("react/jsx-runtime").JSX.Element;
export {};
