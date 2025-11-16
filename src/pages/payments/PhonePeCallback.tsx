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
    const verifyPayment = async () => {
      try {
        // Extract PhonePe response from URL
        const merchantTransactionId = searchParams.get('merchantTransactionId');
        const transactionId = searchParams.get('transactionId');

        if (!merchantTransactionId || !transactionId) {
          throw new Error('Missing payment parameters');
        }

        // Verify with backend
        const verifyPhonePePayment = httpsCallable(
          functions,
          'verifyPhonePePayment'
        );
        const result = await verifyPhonePePayment({
          merchantTransactionId,
          transactionId,
        });

        const data = result.data as { success?: boolean };
        if (data.success) {
          toast({
            title: 'Payment Successful',
            description: 'Your payment has been processed',
          });
          // Redirect to success page or invoices
          navigate('/parent/payments?success=true');
        } else {
          throw new Error('Payment verification failed');
        }
      } catch (error: any) {
        console.error('Callback error:', error);
        toast({
          title: 'Payment Verification Error',
          description: error.message,
          variant: 'destructive',
        });
        navigate('/parent/payments?error=true');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams, navigate, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1>Verifying Payment...</h1>
          <p className="text-gray-600">Please wait while we confirm your payment</p>
        </div>
      </div>
    );
  }

  return null;
}