// src/pages/payments/PhonePeCheckout.tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../../firebaseConfig'; // 👈 matches your file

const PhonePeCheckout: React.FC = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayNow = async () => {
    if (!invoiceId) {
      setError('Missing invoice ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const functions = getFunctions(app, 'asia-south1');
      const createPhonePeOrder = httpsCallable(functions, 'createPhonePeOrder');

      // 🔹 Placeholder: later you’ll fetch real amount from Firestore
      const result = await createPhonePeOrder({
        invoiceId,
        amount: 199, // ₹199 placeholder
      });

      const data = result.data as any;
      if (!data || !data.redirectUrl) {
        throw new Error('Payment creation failed. Please try again.');
      }

      window.location.href = data.redirectUrl;
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Something went wrong while creating the payment.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => navigate('/parent');

  if (!invoiceId) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-4">Payment</h1>
        <p className="text-red-600 text-sm">
          Missing or invalid invoice. Please go back to your dashboard.
        </p>
        <button
          onClick={handleBack}
          className="mt-4 px-4 py-2 rounded-md bg-gray-100 text-gray-700 text-sm"
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-3">Complete Your Payment</h1>
      <p className="text-sm text-gray-600 mb-6">
        Invoice ID: <span className="font-mono">{invoiceId}</span>
      </p>

      <div className="border rounded-xl p-4 bg-white shadow-sm mb-4">
        <p className="text-sm mb-2">
          <span className="font-semibold">Plan:</span> Tiny Steps Games + Support
        </p>
        <p className="text-sm mb-1">
          <span className="font-semibold">Amount:</span> ₹199 (placeholder)
        </p>
        <p className="text-xs text-gray-500">
          *Later you’ll load the exact amount and plan from Firestore.
        </p>
      </div>

      {error && (
        <div className="mb-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handlePayNow}
          disabled={loading}
          className="px-4 py-2 rounded-md bg-purple-600 text-white text-sm font-medium disabled:opacity-60"
        >
          {loading ? 'Redirecting…' : 'Pay with PhonePe'}
        </button>
        <button
          type="button"
          onClick={handleBack}
          className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default PhonePeCheckout;
