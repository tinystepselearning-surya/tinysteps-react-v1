/**
 * PhonePe Payment Gateway Utilities
 */
// Generate checksum for PhonePe (SHA256 HMAC)
export const generateChecksum = (payload, saltKey, saltIndex) => {
    // This is typically done on backend for security
    // Frontend should NOT generate checksums
    // Just a placeholder - actual implementation in Cloud Function
    return '';
};
// Calculate transaction fee
export const calculateFee = (amount) => {
    // PhonePe charges: 1.5% for payments
    // Example: ₹2000 → ₹30 fee
    return Math.round(amount * 0.015);
};
// Format amount for PhonePe (in paise if needed, or rupees)
export const formatAmountForPhonePe = (amount) => {
    // PhonePe accepts amount in paise (multiply by 100)
    // Or in rupees with decimal
    // Check with your PhonePe API docs
    return amount * 100; // In paise
};
// Parse PhonePe response
export const parsePhonePeResponse = (response) => {
    var _a, _b, _c, _d, _e;
    return {
        transactionId: (_a = response.data) === null || _a === void 0 ? void 0 : _a.transactionId,
        orderId: (_b = response.data) === null || _b === void 0 ? void 0 : _b.merchantTransactionId,
        status: ((_c = response.data) === null || _c === void 0 ? void 0 : _c.responseCode) === '00' ? 'success' : 'failed',
        amount: (_d = response.data) === null || _d === void 0 ? void 0 : _d.amount,
        timestamp: (_e = response.data) === null || _e === void 0 ? void 0 : _e.transactionDate
    };
};
