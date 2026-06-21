// React is not required in new JSX transform; keep imports minimal
import { useRealtimeData } from '../../hooks/useRealtime';
import { useAuthStore } from '../../store/useAuthStore';
import { where } from 'firebase/firestore';
import { format } from 'date-fns';
import { INDIA_TIME_ZONE, formatSessionTimeRange } from '../../lib/sessionTime';

export default function TeacherSessionList() {
  const { user } = useAuthStore();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: sessions = [], isLoading, error } = useRealtimeData('sessions', [
    where('teacherId', '==', user?.uid),
    where('date', '==', today),
  ]);

  if (isLoading) return <div>Loading sessions...</div>;
  if (error) return <div className="text-red-600">Failed to load sessions: {String(error.message)}</div>;

  if (!sessions || sessions.length === 0) return <div>No sessions for today.</div>;

  return (
    <div className="space-y-3">
      {sessions.map((session: any) => (
        <div key={session.id} className="p-4 bg-white rounded shadow">
          <h3 className="font-semibold">
            {formatSessionTimeRange(session, { timeZone: INDIA_TIME_ZONE }) || '—'}
          </h3>
          <p className="text-sm text-gray-600">Kids: {(session.kidIds || []).length}</p>
          <div className="mt-3">
            <a
              className="inline-block px-3 py-1 bg-blue-600 text-white rounded"
              href={session.joinUrl || '#'}
              target="_blank"
              rel="noreferrer"
            >
              Join Zoom
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
