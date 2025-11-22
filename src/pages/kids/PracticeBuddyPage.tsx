import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';
import PracticeBuddy from '../../components/PracticeBuddy/PracticeBuddy.jsx';
import { useAuthStore } from '../../store/useAuthStore';

type StudentMeta = {
  studentName?: string;
  age?: number;
  level?: string;
  enrolledCourses?: string[];
  teacherId?: string;
};

export default function PracticeBuddyPage() {
  const { childId } = useParams();
  const navigate = useNavigate();
  const { user, isLoading } = useAuthStore();
  const [meta, setMeta] = useState<StudentMeta | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOwner = useMemo(() => {
    if (!user || !childId) return false;
    return user.uid === childId && user.role === 'kid';
  }, [childId, user]);

  useEffect(() => {
    const fetchMeta = async () => {
      if (!childId) return;
      try {
        const snap = await getDoc(doc(db, 'students', childId));
        if (snap.exists()) {
          setMeta(snap.data() as StudentMeta);
        }
      } catch (err) {
        setError('Failed to load student info.');
      } finally {
        setLoadingMeta(false);
      }
    };
    fetchMeta();
  }, [childId]);

  const logSession = async (status: 'started' | 'completed') => {
    if (!childId) return;
    try {
      await addDoc(collection(db, 'ai-sessions'), {
        studentId: childId,
        teacherId: meta?.teacherId || null,
        feature: 'practice-buddy',
        status,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      // swallow logging errors
    }
  };

  if (isLoading || loadingMeta) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-600">
        Loading Practice Buddy…
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        <div className="bg-white rounded-2xl shadow p-6 max-w-md space-y-3">
          <p className="text-lg font-semibold text-gray-900">Access denied</p>
          <p className="text-sm text-gray-600">
            This Practice Buddy is only for the logged-in child account.
          </p>
          <button
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white"
            onClick={() => navigate('/parent/login')}
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-sky-50 to-white py-6">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-indigo-600 font-semibold">Kids Portal</p>
            <h1 className="text-3xl font-bold text-gray-900">
              Practice Buddy <span role="img" aria-label="robot">🤖</span>
            </h1>
            {meta && (
              <p className="text-sm text-gray-600">
                Hi {meta.studentName || 'there'}! Age {meta.age || '—'} · Level {meta.level || '—'}
              </p>
            )}
          </div>
          <Link
            to={`/kids/${childId}/dashboard`}
            className="text-sm text-indigo-700 hover:underline font-semibold"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <PracticeBuddy
          studentId={childId as string}
          onBeforePractice={() => logSession('started')}
          onAfterPractice={() => logSession('completed')}
        />

        {error && (
          <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
