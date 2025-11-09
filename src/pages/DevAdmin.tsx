import React, { useState } from 'react';
import useAuthStore, { AuthUser } from '../store/useAuthStore';
import { useEnrollments, useInvoices } from '../hooks/useData';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebaseConfig';

export default function DevAdmin() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const clearUser = useAuthStore((s) => s.clearUser);

  const [parentId, setParentId] = useState('');
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastIndexLink, setLastIndexLink] = useState<string | null>(null);
  const [teacherIdCheck, setTeacherIdCheck] = useState('');

  const enrollments = useEnrollments(parentId);
  const invoices = useInvoices(parentId);

  function seedAuth() {
    const u: AuthUser = {
      uid: 'dev-user-1',
      email: 'dev@example.com',
      displayName: 'Dev User',
      role: 'admin',
    };
    setUser(u);
  }

  function clearAll() {
    clearUser();
    try {
      localStorage.clear();
    } catch (e) {
      // ignore
    }
    // reload to ensure persisted stores cleared
    window.location.reload();
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Dev / Admin Debug Page</h1>

      <section className="mb-6 p-4 bg-white rounded shadow">
        <h2 className="font-medium">Auth Store</h2>
        <p className="text-sm text-gray-600">Current user: {user ? user.email : '—'}</p>
        <div className="mt-2 flex gap-2">
          <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={seedAuth}>Seed Auth</button>
          <button className="px-3 py-1 bg-gray-200 rounded" onClick={() => clearUser()}>Clear Auth</button>
          <button className="px-3 py-1 bg-red-500 text-white rounded" onClick={clearAll}>Clear Storage & Reload</button>
        </div>
      </section>

      <section className="mb-6 p-4 bg-white rounded shadow">
        <h2 className="font-medium">Enrollments / Invoices</h2>
        <div className="flex gap-2 items-center mb-3">
          <input value={parentId} onChange={(e) => setParentId(e.target.value)} placeholder="Enter parentId" className="border p-2 rounded flex-1" />
          <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={() => enrollments.refetch()}>Refetch</button>
        </div>
        <div className="flex gap-2 items-center mb-3">
          <input value={teacherIdCheck} onChange={(e) => setTeacherIdCheck(e.target.value)} placeholder="TeacherId for sessions check" className="border p-2 rounded flex-1" />
          <button className="px-3 py-1 bg-indigo-600 text-white rounded" onClick={async () => {
            setLastError(null);
            try {
              if (!teacherIdCheck) throw new Error('Enter a teacherId to check');
              const q = query(collection(db, 'sessions'), where('teacherId', '==', teacherIdCheck), where('status', 'in', ['scheduled','in_progress']), orderBy('date', 'asc'));
              await getDocs(q);
              setLastError('Query succeeded — no index error returned');
              setLastIndexLink(null);
            } catch (err: any) {
              const msg = err?.message || String(err);
              setLastError(msg);
              // try to extract firebase console link
              const urlMatch = msg.match(/https?:\/\/console\.firebase\.google\.com\S+/i);
              if (urlMatch) {
                setLastIndexLink(urlMatch[0]);
              } else {
                // sometimes error contains a direct createIndex link with escaped chars
                const altMatch = msg.match(/https?:\/\/[^\s]*firebase\.google\.com[^\s]*/i);
                setLastIndexLink(altMatch ? altMatch[0] : null);
              }
            }
          }}>Check sessions index</button>
        </div>

        <div className="mb-3">
          <h3 className="font-medium">Enrollments</h3>
          {enrollments.isLoading && <p>Loading...</p>}
          {enrollments.isError && <p className="text-red-600">Error: {(enrollments.error as any)?.message}</p>}
          {enrollments.data && enrollments.data.length === 0 && <p className="text-sm text-gray-500">No enrollments</p>}
          {enrollments.data && enrollments.data.map((e: any) => (
            <div key={e.id} className="border p-2 my-2 rounded">
              <div className="text-sm">Enrollment: {e.id}</div>
              <div className="text-xs text-gray-600">Kids: {(e.kids || []).map((k: any) => k.id).join(', ')}</div>
            </div>
          ))}
        </div>

        <div>
          <h3 className="font-medium">Invoices</h3>
          {invoices.isLoading && <p>Loading...</p>}
          {invoices.data && invoices.data.map((inv: any) => (
            <div key={inv.id} className="border p-2 my-2 rounded">
              <div className="text-sm">Invoice: {inv.id} — {inv.amount || '—'}</div>
              <div className="text-xs text-gray-600">Status: {inv.status}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-6 p-4 bg-white rounded shadow">
        <h2 className="font-medium">Index Check Output</h2>
        <p className="text-sm text-gray-600">Last runtime error / message from Firestore:</p>
        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs whitespace-pre-wrap">{lastError || 'No messages yet'}</pre>
        {lastIndexLink && (
          <div className="mt-2">
            <a href={lastIndexLink} target="_blank" rel="noreferrer" className="text-blue-600 underline">Open suggested index in Firebase Console</a>
          </div>
        )}
        <div className="mt-2 flex gap-2">
          <button
            className="px-3 py-1 bg-blue-600 text-white rounded"
            onClick={() => {
              if (!lastError) return;
              navigator.clipboard.writeText(lastError);
            }}
          >
            Copy Error Text
          </button>
          {lastIndexLink && (
            <button
              className="px-3 py-1 bg-green-600 text-white rounded"
              onClick={() => {
                navigator.clipboard.writeText(lastIndexLink);
              }}
            >
              Copy Console Link
            </button>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-2">If Firestore requires an index, the error message contains a Console link you can click/copy to create it.</p>
      </section>

      <section className="p-4 bg-white rounded shadow">
        <h2 className="font-medium">Quick Utilities</h2>
        <div className="mt-2 flex gap-2">
          <button className="px-3 py-1 bg-yellow-500 rounded" onClick={() => window.location.reload()}>Reload</button>
          <button className="px-3 py-1 bg-indigo-600 text-white rounded" onClick={() => console.clear()}>Clear Console</button>
          <button className="px-3 py-1 bg-gray-300 rounded" onClick={() => {
            try { if ((globalThis as any).__enrollmentsCache) (globalThis as any).__enrollmentsCache.clear(); } catch (e) {}
            alert('Enrollments cache cleared');
          }}>Clear Enrollments Cache</button>
        </div>
      </section>
    </div>
  );
}
