// src/pages/payments/PhonePeCheckout.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import TinyStepsBrand from '../../components/common/TinyStepsBrand';
import { app, db } from '../../lib/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

interface Invoice {
  amount: number;
  status: string;
  currency?: string;
  childName?: string;
  description?: string;
  dueDate?: string;
  phonepeTransactionId?: string;
}

const PhonePeCheckout: React.FC = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load invoice data from Firestore
  useEffect(() => {
    const fetchInvoice = async () => {
      if (!invoiceId) {
        setError('Missing invoice ID in URL.');
        setLoadingInvoice(false);
        return;
      }

      try {
        const ref = doc(db, 'invoices', invoiceId);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setError('Invoice not found.');
          setLoadingInvoice(false);
          return;
        }

        const data = snap.data() as any;
        setInvoice({
          amount: data.amount,
          status: data.status,
          currency: data.currency || 'INR',
          childName: data.childName,
          description: data.description,
          dueDate: data.dueDate,
          phonepeTransactionId: data.phonepeTransactionId,
        });
      } catch (err: any) {
        console.error('Error loading invoice', err);
        setError('Failed to load invoice. Please try again.');
      } finally {
        setLoadingInvoice(false);
      }
    };

    fetchInvoice();
  }, [invoiceId]);

  const handlePayWithPhonePe = async () => {
    if (!invoiceId || !invoice) return;

    setError(null);
    setPaying(true);

    try {
      const functions = getFunctions(app, 'asia-south1');

      const createPhonePeOrder = httpsCallable<
        { invoiceId: string; amount: number },
        { merchantTransactionId: string; redirectUrl: string; amount: number }
      >(functions, 'createPhonePeOrder');

      const result = await createPhonePeOrder({
        invoiceId,
        amount: invoice.amount, // amount in rupees as stored in invoice
      });

      const { redirectUrl } = result.data;

      // Redirect parent to PhonePe payment page
      window.location.href = redirectUrl;
    } catch (err: any) {
      console.error('createPhonePeOrder error', err);

      const rawMessage: string = err?.message || '';
      if (rawMessage.includes('PhonePe payment gateway is not yet configured')) {
        setError(
          'Online payments are not yet configured. Please contact Tiny Steps support to complete this payment.',
        );
      } else if (err?.code === 'functions/unauthenticated') {
        setError('Please log in again to continue with the payment.');
      } else {
        setError('Failed to start payment. Please try again in a moment.');
      }
    } finally {
      setPaying(false);
    }
  };

  const formattedAmount =
    invoice?.amount != null ? `₹${invoice.amount.toFixed(2)}` : '—';

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center gap-6">
        <TinyStepsBrand subtitle="Parent billing" className="w-fit" />
        <Card className="w-full max-w-md self-center shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Tiny Steps – Payment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingInvoice && <p>Loading invoice...</p>}

          {!loadingInvoice && error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          {!loadingInvoice && !error && invoice && (
            <>
              <div className="space-y-1">
                <p className="text-sm text-slate-500">
                  Invoice ID:{' '}
                  <span className="font-mono">{invoiceId}</span>
                </p>
                {invoice.childName && (
                  <p className="text-sm text-slate-500">
                    Child:{' '}
                    <span className="font-medium">
                      {invoice.childName}
                    </span>
                  </p>
                )}
                {invoice.description && (
                  <p className="text-sm text-slate-500">
                    For:{' '}
                    <span className="font-medium">
                      {invoice.description}
                    </span>
                  </p>
                )}
                {invoice.dueDate && (
                  <p className="text-sm text-slate-500">
                    Due by:{' '}
                    <span className="font-medium">
                      {invoice.dueDate}
                    </span>
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between border-t pt-3 mt-3">
                <span className="text-sm text-slate-600">Amount</span>
                <span className="text-lg font-bold text-emerald-700">
                  {formattedAmount}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Status</span>
                <span
                  className={`text-sm font-semibold ${
                    invoice.status === 'paid'
                      ? 'text-emerald-600'
                      : invoice.status === 'cancelled'
                      ? 'text-red-600'
                      : 'text-amber-600'
                  }`}
                >
                  {invoice.status.toUpperCase()}
                </span>
              </div>

              {invoice.status === 'paid' ? (
                <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md px-3 py-2">
                  This invoice is already paid. Thank you! 💛
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handlePayWithPhonePe}
                  disabled={paying}
                  className="w-full mt-2 inline-flex items-center justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {paying ? 'Redirecting to PhonePe…' : 'Pay with PhonePe'}
                </button>
              )}

              <p className="text-[11px] text-slate-400 text-center mt-2">
                Online payments are processed securely via PhonePe.
              </p>
            </>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default PhonePeCheckout;
