import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../lib/firebaseConfig';
import { toast } from '@components/hooks/use-toast';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card';
import { Loader2 } from 'lucide-react';

interface PaymentModalProps {
  invoiceId: string;
  amount: number;
  onPaymentComplete: () => void;
  onClose: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  invoiceId,
  amount,
  onPaymentComplete,
  onClose
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePhonePePayment = async () => {
    if (!invoiceId || !amount) {
      toast({ title: 'Error', description: 'Invalid payment details', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
    try {
      // Create PhonePe order
      const createOrder = httpsCallable(functions, 'createPhonePeOrder');
      const response = await createOrder({
        invoiceId,
        amount: amount // amount in rupees
      });

      const { redirectUrl } = response.data as { redirectUrl: string };

      if (!redirectUrl) {
        throw new Error('Failed to get payment URL');
      }

      // Redirect to PhonePe payment page
      window.location.href = redirectUrl;

      // Note: User will be redirected back to callback URL after payment
      // The callback page should handle verification and call onPaymentComplete

    } catch (error: any) {
      console.error('Payment initiation failed:', error);
      toast({ title: 'Error', description: error.message || 'Payment initiation failed', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Complete Payment</CardTitle>
          <CardDescription>
            Pay ₹{amount} for Invoice #{invoiceId}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-lg font-semibold">₹{amount}</p>
            <p className="text-sm text-gray-600">Total amount due</p>
          </div>

          <Button
            onClick={handlePhonePePayment}
            disabled={isProcessing}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Pay with PhonePe'
            )}
          </Button>

          <Button
            variant="outline"
            onClick={onClose}
            className="w-full"
            disabled={isProcessing}
          >
            Cancel
          </Button>

          <div className="text-xs text-gray-500 text-center">
            You will be redirected to PhonePe secure payment page
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentModal;