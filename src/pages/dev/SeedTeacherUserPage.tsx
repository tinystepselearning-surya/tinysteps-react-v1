import React, { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';

type Status = 'idle' | 'loading' | 'no-user' | 'success' | 'error' | 'not-dev';

const SeedTeacherUserPage: React.FC = () => {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    // Guard: dev-only
    if (!import.meta.env.DEV) {
      setStatus('not-dev');
      setMessage('This page is only available in development.');
      return;
    }

    let unsub: (() => void) | undefined;

    const runSeed = async (user: FirebaseUser | null) => {
      if (!user) {
        setStatus('no-user');
        setMessage('Please sign in first.');
        return;
      }

      setStatus('loading');
      try {
        const uid = user.uid;
        const ref = doc(db, 'users', uid);

        // Read existing doc (we'll merge/update)
        const snap = await getDoc(ref);

        const payload = {
          role: 'teacher',
          email: user.email || '',
          displayName: user.displayName || '',
        } as Record<string, unknown>;

        // Use merge so we don't clobber other fields if present
        await setDoc(ref, payload, { merge: true });

        setStatus('success');
        setMessage(`Seeded users/${uid} with role='teacher'. You can now access the Teacher pages.`);
      } catch (err: any) {
        console.error('Seeding failed', err);
        setStatus('error');
        setMessage(err?.message || 'Unknown error');
      }
    };

    // First try currentUser (fast)
    if (auth.currentUser) {
      runSeed(auth.currentUser);
    } else {
      // Wait for auth state change (in case auth is still initializing)
      unsub = onAuthStateChanged(auth, (u) => {
        if (u) {
          runSeed(u);
        } else {
          setStatus('no-user');
          setMessage('Please sign in first.');
        }
      });
    }

    return () => {
      if (unsub) unsub();
    };
  }, []);

  return (
    <div className="min-h-[50vh] flex items-center justify-center px-4">
      <div className="max-w-2xl w-full bg-white rounded-lg border p-6 text-sm text-slate-700 shadow">
        <h2 className="text-lg font-semibold mb-2">Dev: Seed current user as Teacher</h2>

        {status === 'not-dev' && (
          <div className="text-yellow-700">This page is only available in development.</div>
        )}

        {status === 'idle' && <div>Preparing…</div>}

        {status === 'loading' && <div>Seeding your user as a teacher…</div>}

        {status === 'no-user' && (
          <div className="text-sm text-slate-600">Please sign in first, then revisit this page.</div>
        )}

        {status === 'success' && (
          <div className="text-sm text-green-700">{message}</div>
        )}

        {status === 'error' && (
          <div className="text-sm text-red-700">Seeding failed: {message}</div>
        )}

        <div className="mt-4 text-xs text-gray-500">
          Note: this helper is for local development only. It writes to `users/&lt;uid&gt;` with role=`teacher`.
        </div>
      </div>
    </div>
  );
};

export default SeedTeacherUserPage;
