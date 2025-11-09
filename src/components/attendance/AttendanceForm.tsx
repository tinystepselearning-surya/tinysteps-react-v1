import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../lib/firebaseConfig';
import { useAuthStore } from '../../store/useAuthStore';

type Props = {
  sessionId: string;
  kidIds: string[];
};

export default function AttendanceForm({ sessionId, kidIds }: Props) {
  const { user } = useAuthStore();
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const markAttendance = httpsCallable(functions, 'markAttendance');

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const date = new Date().toISOString().split('T')[0];
      await markAttendance({ sessionId, date, attendance });
    } catch (err: any) {
      setError(err?.message || 'Failed to submit attendance');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      {error && <div className="text-red-600">{error}</div>}
      {kidIds.map((kidId) => (
        <div key={kidId} className="flex gap-2 items-center">
          <span className="w-40">{kidId}</span>
          <button
            className={`px-3 py-1 rounded ${attendance[kidId] === 'present' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
            onClick={() => setAttendance({ ...attendance, [kidId]: 'present' })}
          >
            Present
          </button>
          <button
            className={`px-3 py-1 rounded ${attendance[kidId] === 'absent' ? 'bg-red-600 text-white' : 'bg-white border'}`}
            onClick={() => setAttendance({ ...attendance, [kidId]: 'absent' })}
          >
            Absent
          </button>
        </div>
      ))}

      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className={`w-full px-4 py-2 rounded ${isSubmitting ? 'bg-gray-400' : 'bg-blue-600 text-white'}`}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Attendance'}
      </button>
    </div>
  );
}
