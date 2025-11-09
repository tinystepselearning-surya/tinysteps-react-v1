import React, { useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';
import { useAuthStore } from '../../store/useAuthStore';

type Props = {
  studentId: string;
  topicId: string;
};

export default function StudentProgressForm({ studentId, topicId }: Props) {
  const { user } = useAuthStore();
  const [mastery, setMastery] = useState('emerging');
  const [nextAction, setNextAction] = useState('practice');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const docRef = doc(db, 'progress', `${studentId}_${topicId}`);
      await setDoc(
        docRef,
        {
          studentId,
          topicId,
          mastery,
          nextAction,
          updatedAt: serverTimestamp(),
          updatedBy: user?.uid,
        },
        { merge: true }
      );

      // optional: show success feedback
    } catch (err: any) {
      setError(err?.message || 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && <div className="text-red-600">{error}</div>}

      <label className="block">
        <div className="text-sm text-gray-700 mb-1">Mastery</div>
        <select value={mastery} onChange={(e) => setMastery(e.target.value)} className="w-full p-2 border rounded">
          <option value="not_started">not_started</option>
          <option value="emerging">emerging</option>
          <option value="developing">developing</option>
          <option value="proficient">proficient</option>
          <option value="mastered">mastered</option>
        </select>
      </label>

      <label className="block">
        <div className="text-sm text-gray-700 mb-1">Next action</div>
        <select value={nextAction} onChange={(e) => setNextAction(e.target.value)} className="w-full p-2 border rounded">
          <option value="practice">practice</option>
          <option value="reteach">reteach</option>
          <option value="advance">advance</option>
          <option value="review">review</option>
        </select>
      </label>

      <button
        onClick={handleUpdate}
        disabled={isSaving}
        className={`w-full px-4 py-2 rounded ${isSaving ? 'bg-gray-400' : 'bg-blue-600 text-white'}`}
      >
        {isSaving ? 'Saving...' : 'Save Progress'}
      </button>
    </div>
  );
}
