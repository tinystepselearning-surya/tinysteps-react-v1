import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, orderBy, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { XCircleIcon } from '@heroicons/react/24/outline';

type AuditLog = {
  id: string;
  createdAt: any;
  actorId?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: string;
};

export default function AdminAuditLogsPage() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'7'|'30'|'all'>('7');

  useEffect(() => {
    if (loading) return;
    if (!isAdmin()) {
      navigate('/signin');
      return;
    }
  }, [loading, isAdmin, navigate]);

  useEffect(() => {
    async function loadLogs() {
      setLoadingLogs(true);
      try {
        const auditsRef = collection(db, 'auditLogs');
        let q = query(auditsRef, orderBy('createdAt', 'desc'));

        // Build client-side applied filters afterwards (we fetch a reasonable page)
        // If dateRange is a number, compute start timestamp for server filtering
        if (dateRange !== 'all') {
          const days = Number(dateRange);
          const start = new Date();
          start.setDate(start.getDate() - days);
          const startTs = Timestamp.fromDate(start);
          q = query(auditsRef, where('createdAt', '>=', startTs), orderBy('createdAt', 'desc'));
        }

        // If actionFilter is specific, add where
        if (actionFilter !== 'all') {
          q = query(q, where('action', '==', actionFilter));
        }

        const snap = await getDocs(q);
        const items: AuditLog[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        setLogs(items);
      } catch (err: any) {
        console.error('Failed to load audit logs:', err);
        if (err?.code === 'permission-denied') {
          console.error('Permission denied reading /auditLogs. Suggest adding a rule that allows read for admin role only.');
          console.info(`Suggested Firestore rule (minimal, admin-only read):\nmatch /auditLogs/{id} {\n  allow read: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';\n  allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';\n}`);
        }
      } finally {
        setLoadingLogs(false);
      }
    }

    loadLogs();
  }, [actionFilter, dateRange, isAdmin, loading]);

  const actionOptions = useMemo(() => {
    const setA = new Set<string>();
    logs.forEach(l => setA.add(l.action));
    return ['all', ...Array.from(setA)];
  }, [logs]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Audit Logs</h1>
          <p className="text-gray-400">Recent administrative actions and system events.</p>
        </div>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-400">Action</label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
          >
            {actionOptions.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-400">Date</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left text-sm text-gray-300">Time</th>
              <th className="px-4 py-3 text-left text-sm text-gray-300">Actor</th>
              <th className="px-4 py-3 text-left text-sm text-gray-300">Action</th>
              <th className="px-4 py-3 text-left text-sm text-gray-300">Target Type</th>
              <th className="px-4 py-3 text-left text-sm text-gray-300">Target ID</th>
              <th className="px-4 py-3 text-left text-sm text-gray-300">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {loadingLogs ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">Loading...</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400 flex items-center justify-center gap-2">
                  <XCircleIcon className="h-6 w-6 text-gray-500" />
                  No audit logs found
                </td>
              </tr>
            ) : (
              logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-750 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-300">{log.createdAt?.toDate ? log.createdAt.toDate().toLocaleString() : new Date(log.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{log.actorId || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{log.action}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{log.targetType || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{log.targetId || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-300 max-w-xl truncate">{log.details || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
