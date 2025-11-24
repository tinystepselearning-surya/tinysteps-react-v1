/**
 * PhonePe Payment Gateway Utilities
 */
export declare const generateChecksum: (payload: string, saltKey: string, saltIndex: number) => string;
export declare const calculateFee: (amount: number) => number;
export declare const formatAmountForPhonePe: (amount: number) => number;
export declare const parsePhonePeResponse: (response: any) => {
    transactionId: any;
    orderId: any;
    status: string;
    amount: any;
    timestamp: any;
};
