// src/pages/payments/PhonePeCallback.tsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../../lib/firebaseConfig';

const PhonePeCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<
    'checking' | 'success' | 'failed' | 'pending'
  >('checking');
  const [message, setMessage] = useState<string>('Verifying your payment…');

  useEffect(() => {
    const invoiceId = searchParams.get('invoiceId');
    const merchantTransactionId = searchParams.get('transactionId');

    if (!invoiceId || !merchantTransactionId) {
      setStatus('failed');
      setMessage(
        'Missing payment details. Please contact support if amount was deducted.',
      );
      return;
    }

    const verify = async () => {
      try {
        const functions = getFunctions(app, 'asia-south1');
        const verifyPhonePePayment = httpsCallable(
          functions,
          'verifyPhonePePayment',
        );

        const result = await verifyPhonePePayment({
          invoiceId,
          merchantTransactionId,
        });

        const data = result.data as any;

        if (data?.status === 'completed') {
          setStatus('success');
          setMessage(
            'Payment successful! Your subscription will be updated shortly.',
          );
        } else if (data?.status === 'failed') {
          setStatus('failed');
          setMessage(
            'Payment failed. Please try again or use another method.',
          );
        } else {
          setStatus('pending');
          setMessage(
            'Payment is still pending. Please refresh after a few minutes.',
          );
        }
      } catch (err: any) {
        console.error(err);
        setStatus('failed');
        setMessage(
          err?.message ||
            'Could not verify payment. Please contact support.',
        );
      }
    };

    void verify();
  }, [searchParams]);

  const goToDashboard = () => navigate('/parent');

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-4">PhonePe Payment Status</h1>
      <div className="mb-4 rounded-xl border bg-white p-4 shadow-sm">
        <p className="mb-2 text-sm">{message}</p>
        <p className="text-xs text-gray-500">
          Status:{' '}
          <span className="font-semibold">
            {status === 'checking' ? 'Checking…' : status}
          </span>
        </p>
      </div>
      <button
        onClick={goToDashboard}
        className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white"
      >
        Go to Parent Dashboard
      </button>
    </div>
  );
};

export default PhonePeCallback;
