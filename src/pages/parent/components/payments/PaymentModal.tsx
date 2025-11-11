import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { ParentInvoice } from '../../../../types/Parent';
import { functions } from '../../../../lib/firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import { toast } from '@components/hooks/use-toast';
import { useAuthStore } from '../../../../store/useAuthStore';

interface PaymentModalProps {
  invoice: ParentInvoice | null;
  onClose: () => void;
}

const loadRazorpayScript = () => {
  if (document.getElementById('razorpay-sdk')) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.id = 'razorpay-sdk';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const PaymentModal: React.FC<PaymentModalProps> = ({ invoice, onClose }) => {
  const { user } = useAuthStore();

  useEffect(() => {
    if (invoice) {
      loadRazorpayScript();
    }
  }, [invoice]);

  const handlePayment = async () => {
    if (!invoice) return;
    const ready = await loadRazorpayScript();
    if (!ready) {
      toast({ title: 'Unable to load payment gateway', variant: 'destructive' });
      return;
    }
    try {
      const createOrder = httpsCallable(functions, 'createRazorpayOrder');
      const response = await createOrder({ invoiceId: invoice.id, amount: invoice.amount * 100 });
      const options: any = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: response.data.amount,
        currency: 'INR',
        order_id: response.data.orderId,
        name: 'Tiny Steps Learning',
        description: `Invoice ${invoice.id}`,
        prefill: {
          name: user?.displayName,
          email: user?.email,
        },
        handler: async (paymentResponse: any) => {
          try {
            const verify = httpsCallable(functions, 'verifyRazorpayPayment');
            await verify({ invoiceId: invoice.id, ...paymentResponse });
            toast({ title: 'Payment successful' });
            onClose();
          } catch (err) {
            console.error(err);
            toast({ title: 'Verification failed', variant: 'destructive' });
          }
        },
      };
      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error(error);
      toast({ title: 'Unable to start payment', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={Boolean(invoice)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pay Invoice</DialogTitle>
        </DialogHeader>
        {!invoice ? (
          <p className="text-sm text-muted-foreground">No invoice selected.</p>
        ) : (
          <div className="space-y-2 text-sm">
            <p>Invoice ID: {invoice.id}</p>
            <p>Amount: ₹{invoice.amount}</p>
            <p>Due Date: {invoice.dueDate}</p>
            <p>Status: {invoice.status}</p>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handlePayment} disabled={!invoice}>
            Pay Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
