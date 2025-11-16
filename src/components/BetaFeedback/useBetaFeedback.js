import { useCallback, useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';
import { useAuthStore } from '../../store/useAuthStore';

export function useBetaFeedback(role) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const submitFeedback = useCallback(
    async (payload) => {
      setError('');
      setSubmitted(false);
      setLoading(true);
      try {
        await addDoc(collection(db, 'beta-feedback'), {
          role,
          ...payload,
          userId: user?.uid || null,
          timestamp: serverTimestamp(),
        });
        setSubmitted(true);
      } catch (err) {
        setError(err?.message || 'Could not submit feedback.');
      } finally {
        setLoading(false);
      }
    },
    [role, user?.uid]
  );

  return { submitFeedback, loading, error, submitted };
}

export default useBetaFeedback;
