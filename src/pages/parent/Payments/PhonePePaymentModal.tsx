import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../lib/firebaseConfig';
import { Button } from '@components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog';
import { useToast } from '@components/hooks/use-toast';

interface PhonePePaymentModalProps {
  invoiceId: string;
  amount: number;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PhonePePaymentModal({
  invoiceId,
  amount,
  open,
  onClose,
  onSuccess,
}: PhonePePaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePhonePePayment = async () => {
    setIsLoading(true);
    try {
      // 1. Call Cloud Function to create PhonePe order
      const createPhonePeOrder = httpsCallable(functions, 'createPhonePeOrder');
      const response = await createPhonePeOrder({
        invoiceId,
        amount, // in rupees
      });

      // 2. Redirect to PhonePe payment page
      const data = response.data as { redirectUrl?: string };
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        throw new Error('No redirect URL received');
      }
    } catch (error: any) {
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
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pay with PhonePe</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Payment Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Invoice ID:</span>
              <span className="font-semibold">{invoiceId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="font-semibold text-lg">₹{amount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method:</span>
              <span className="font-semibold">PhonePe</span>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-700">
            ✅ Secure payment gateway
            <br />
            You will be redirected to PhonePe for payment
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePhonePePayment}
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? 'Processing...' : 'Pay ₹' + amount}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}