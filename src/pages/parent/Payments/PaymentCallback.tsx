import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../lib/firebaseConfig';
import { toast } from '@components/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import TinyStepsBrand from '../../../components/common/TinyStepsBrand';

const PaymentCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('Verifying payment...');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get payment parameters from URL
        const transactionId = searchParams.get('transactionId');
        const merchantId = searchParams.get('merchantId');
        const responseCode = searchParams.get('responseCode');

        if (!transactionId) {
          setStatus('failed');
          setMessage('Invalid payment response - missing transaction ID');
          return;
        }

        // Call the verify payment function
        const verifyPaymentFunction = httpsCallable(functions, 'verifyPhonePePayment');
        const result = await verifyPaymentFunction({
          transactionId,
          merchantId,
          responseCode
        });

        const { success, message: resultMessage } = result.data as {
          success: boolean;
          message: string;
        };

        if (success) {
          setStatus('success');
          setMessage(resultMessage || 'Payment completed successfully!');
          toast({
            title: 'Payment Successful',
            description: 'Your payment has been processed successfully.',
          });
        } else {
          setStatus('failed');
          setMessage(resultMessage || 'Payment verification failed');
          toast({
            title: 'Payment Failed',
            description: resultMessage || 'Payment verification failed',
            variant: 'destructive',
          });
        }
      } catch (error: any) {
        console.error('Payment verification error:', error);
        setStatus('failed');
        setMessage('An error occurred while verifying payment');
        toast({
          title: 'Verification Error',
          description: 'An error occurred while verifying your payment.',
          variant: 'destructive',
        });
      }
    };

    verifyPayment();
  }, [searchParams]);

  const handleReturnToDashboard = () => {
    navigate('/parent/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center gap-6">
        <TinyStepsBrand subtitle="Parent billing" className="w-fit" />
        <Card className="w-full max-w-md self-center">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'loading' && <Loader2 className="h-6 w-6 animate-spin" />}
            {status === 'success' && <CheckCircle className="h-6 w-6 text-green-600" />}
            {status === 'failed' && <XCircle className="h-6 w-6 text-red-600" />}
            Payment {status === 'loading' ? 'Processing' : status === 'success' ? 'Successful' : 'Failed'}
          </CardTitle>
          <CardDescription>
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === 'loading' && (
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <div className="text-green-600">
                <CheckCircle className="h-12 w-12 mx-auto mb-2" />
                <p className="font-medium">Payment Completed</p>
              </div>
              <Button onClick={handleReturnToDashboard} className="w-full">
                Return to Dashboard
              </Button>
            </div>
          )}

          {status === 'failed' && (
            <div className="space-y-4">
              <div className="text-red-600">
                <XCircle className="h-12 w-12 mx-auto mb-2" />
                <p className="font-medium">Payment Failed</p>
              </div>
              <div className="space-y-2">
                <Button onClick={handleReturnToDashboard} variant="outline" className="w-full">
                  Return to Dashboard
                </Button>
                <Button onClick={() => window.history.back()} variant="outline" className="w-full">
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default PaymentCallback;
