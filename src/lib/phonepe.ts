/**
 * PhonePe Payment Gateway Utilities
 */

// Generate checksum for PhonePe (SHA256 HMAC)
export const generateChecksum = (payload: string, saltKey: string, saltIndex: number): string => {
  // This is typically done on backend for security
  // Frontend should NOT generate checksums
  // Just a placeholder - actual implementation in Cloud Function
  return '';
};

// Calculate transaction fee
export const calculateFee = (amount: number): number => {
  // PhonePe charges: 1.5% for payments
  // Example: ₹2000 → ₹30 fee
  return Math.round(amount * 0.015);
};

// Format amount for PhonePe (in paise if needed, or rupees)
export const formatAmountForPhonePe = (amount: number): number => {
  // PhonePe accepts amount in paise (multiply by 100)
  // Or in rupees with decimal
  // Check with your PhonePe API docs
  return amount * 100; // In paise
};

// Parse PhonePe response
export const parsePhonePeResponse = (response: any) => {
  return {
    transactionId: response.data?.transactionId,
    orderId: response.data?.merchantTransactionId,
    status: response.data?.responseCode === '00' ? 'success' : 'failed',
    amount: response.data?.amount,
    timestamp: response.data?.transactionDate
  };
};