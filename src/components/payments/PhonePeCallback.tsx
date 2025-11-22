// src/pages/payments/PhonePeCallback.tsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { app, db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

type PaymentStatus = 'checking' | 'success' | 'failed' | 'pending' | 'error';

const PhonePeCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const invoiceId = searchParams.get('invoiceId');

  const [status, setStatus] = useState<PaymentStatus>('checking');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const verify = async () => {
      if (!invoiceId) {
        setStatus('error');
        setMessage('Missing invoice ID in URL.');
        return;
      }

      try {
        const ref = doc(db, 'invoices', invoiceId);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setStatus('error');
          setMessage('Invoice not found.');
          return;
        }

        const invoiceData = snap.data() as any;
        const merchantTransactionId = invoiceData.phonepeTransactionId;

        if (!merchantTransactionId) {
          setStatus('error');
          setMessage(
            'Payment reference not found for this invoice. If you completed payment, please contact support.'
          );
          return;
        }

        const functions = getFunctions(app, 'asia-south1');
        const verifyPhonePePayment = httpsCallable<
          { invoiceId: string; merchantTransactionId: string },
          { success: boolean; status: 'completed' | 'failed' | 'pending' }
        >(functions, 'verifyPhonePePayment');

        const result = await verifyPhonePePayment({
          invoiceId,
          merchantTransactionId,
        });

        const { success, status: backendStatus } = result.data;

        if (success && backendStatus === 'completed') {
          setStatus('success');
          setMessage('Payment received successfully. Thank you!');
        } else if (backendStatus === 'failed') {
          setStatus('failed');
          setMessage(
            'Payment was not completed. If money was deducted, please contact support with your transaction reference.'
          );
        } else {
          setStatus('pending');
          setMessage(
            'Payment is still being processed. Please wait a few minutes and refresh, or contact support if it stays pending.'
          );
        }
      } catch (err: any) {
        console.error('verifyPhonePePayment error', err);
        const rawMessage: string = err?.message || '';

        if (rawMessage.includes('PhonePe payment gateway is not yet configured')) {
          setStatus('error');
          setMessage(
            'Online payments are not yet configured. If you already paid, please share the reference with Tiny Steps support.'
          );
        } else if (err?.code === 'functions/unauthenticated') {
          setStatus('error');
          setMessage('Please log in again and then refresh this page.');
        } else {
          setStatus('error');
          setMessage(
            'We could not confirm your payment right now. Please retry in a minute or contact support.'
          );
        }
      }
    };

    verify();
  }, [invoiceId]);

  const heading = (() => {
    switch (status) {
      case 'checking':
        return 'Checking your payment…';
      case 'success':
        return 'Payment successful 🎉';
      case 'failed':
        return 'Payment failed';
      case 'pending':
        return 'Payment pending';
      case 'error':
      default:
        return 'Payment status';
    }
  })();

  return (
    <div className="min-h-screen flex justify-center items-center bg-slate-50 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>{heading}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'checking' && (
            <p className="text-sm text-slate-600">
              Please wait while we confirm your payment with PhonePe…
            </p>
          )}

          {status !== 'checking' && message && (
            <p className="text-sm text-slate-700">{message}</p>
          )}

          {invoiceId && (
            <p className="text-xs text-slate-400">
              Invoice ID: <span className="font-mono">{invoiceId}</span>
            </p>
          )}

          <div className="pt-2 flex justify-end">
            <Link
              to="/parent"
              className="text-xs text-violet-600 hover:underline"
            >
              Go to Parent Dashboard
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PhonePeCallback;
