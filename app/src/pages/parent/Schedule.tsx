import React, { useState } from "react";
import { useParentSessions } from "../../hooks/useParentSessions";
import useParentChildren from "../../hooks/useParentChildren";
import type { Student } from "../../types/models";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../../firebase";

type ReschedulePayload = {
  sessionId: string;
  studentId: string;
  currentDate: string;
  newDate: string;
  reason: string;
};

function formatDate(ts: any) {
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function isToday(ts: any) {
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
  no_show: "bg-red-100 text-red-700",
};

const ParentSchedule: React.FC = () => {
  const { sessions, loading } = useParentSessions();
  const { children } = useParentChildren();
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [reschedulePayload, setReschedulePayload] = useState<ReschedulePayload | null>(null);
  const [submittingReschedule, setSubmittingReschedule] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelingSession, setCancelingSession] = useState<{ sessionId: string; studentId: string; } | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const childMap: Record<string, Student> = Object.fromEntries(children.map(c => [c.sid, c]));
  const now = new Date();

  const upcoming = sessions.filter(s => s.status === "scheduled" && (s.startAt?.toDate ? s.startAt.toDate() : new Date(s.startAt)) >= now)
    .sort((a, b) => (a.startAt?.toDate ? a.startAt.toDate() : new Date(a.startAt)) - (b.startAt?.toDate ? b.startAt.toDate() : new Date(b.startAt)));
  const past = sessions.filter(s => ["completed", "cancelled", "no_show"].includes(s.status))
    .sort((a, b) => (b.startAt?.toDate ? b.startAt.toDate() : new Date(b.startAt)) - (a.startAt?.toDate ? a.startAt.toDate() : new Date(a.startAt)));

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Schedule</h1>
      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading schedule…</div>
      ) : (
        <>
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">Upcoming Classes</h2>
            {upcoming.length === 0 ? (
              <div className="bg-purple-50 rounded-xl p-6 border border-purple-200 text-center text-gray-600">No upcoming classes scheduled.</div>
            ) : (
              <ul className="space-y-4">
                {upcoming.map((s) => (
                  <li key={s.sessionId} className={`rounded-xl border p-4 flex flex-col md:flex-row md:items-center gap-3 shadow-sm ${isToday(s.startAt) ? "border-purple-400 bg-purple-50" : "border-gray-100 bg-white"}`}>
                    <div className="flex-1">
                      <div className="font-semibold text-purple-700">{childMap[s.studentId]?.name || "-"}</div>
                      <div className="text-sm text-gray-600">Course: {s.courseId}</div>
                      <div className="text-sm text-gray-600">Date: {formatDate(s.startAt)}</div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[s.status]}`}>{s.status.replace("_", " ")}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setReschedulePayload({
                            sessionId: s.sessionId,
                            studentId: s.studentId,
                            currentDate: (s.startAt?.toDate ? s.startAt.toDate().toISOString().split('T')[0] : new Date(s.startAt).toISOString().split('T')[0]),
                            newDate: "",
                            reason: "",
                          });
                          setShowRescheduleModal(true);
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      >
                        Request Reschedule
                      </button>
                      <button
                        onClick={() => {
                          setCancelingSession({ sessionId: s.sessionId, studentId: s.studentId });
                          setCancelReason("");
                          setShowCancelModal(true);
                        }}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                      >
                        Request Cancel
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
          {/* Reschedule Modal */}
          {showRescheduleModal && reschedulePayload && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Request Reschedule</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Date</label>
                    <input type="date" value={reschedulePayload.currentDate} disabled className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preferred New Date</label>
                    <input type="date" value={reschedulePayload.newDate} onChange={(e) => setReschedulePayload({ ...reschedulePayload, newDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                    <textarea value={reschedulePayload.reason} onChange={(e) => setReschedulePayload({ ...reschedulePayload, reason: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="Please provide a reason for rescheduling..." />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setShowRescheduleModal(false)} disabled={submittingReschedule} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">Cancel</button>
                  <button onClick={async () => {
                    if (!reschedulePayload?.newDate || !reschedulePayload?.reason) { alert('Please fill in all fields'); return; }
                    setSubmittingReschedule(true);
                    try {
                      await addDoc(collection(db, 'tickets'), {
                        type: 'reschedule',
                        studentId: reschedulePayload.studentId,
                        sessionId: reschedulePayload.sessionId,
                        currentDate: reschedulePayload.currentDate,
                        newDate: reschedulePayload.newDate,
                        reason: reschedulePayload.reason,
                        status: 'pending',
                        createdBy: auth.currentUser?.uid || 'unknown',
                        createdAt: serverTimestamp(),
                        updatedBy: auth.currentUser?.uid || 'unknown',
                        updatedAt: serverTimestamp(),
                      });
                      alert('Reschedule request submitted!');
                      setShowRescheduleModal(false);
                      setReschedulePayload(null);
                    } catch (err) {
                      console.error('Error submitting reschedule request from Schedule page:', err);
                      alert('Failed to submit request.');
                    } finally {
                      setSubmittingReschedule(false);
                    }
                  }} disabled={submittingReschedule} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50">{submittingReschedule ? 'Submitting...' : 'Submit Request'}</button>
                </div>
              </div>
            </div>
          )}

          {/* Cancel Modal */}
          {showCancelModal && cancelingSession && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Request Cancel</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                    <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="Please provide a reason for cancelling the session..." />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setShowCancelModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                  <button onClick={async () => {
                    if (!cancelReason) { alert('Please add a reason'); return; }
                    try {
                      await addDoc(collection(db, 'tickets'), {
                        type: 'cancel',
                        studentId: cancelingSession.studentId,
                        sessionId: cancelingSession.sessionId,
                        reason: cancelReason,
                        status: 'pending',
                        createdBy: auth.currentUser?.uid || 'unknown',
                        createdAt: serverTimestamp(),
                        updatedBy: auth.currentUser?.uid || 'unknown',
                        updatedAt: serverTimestamp(),
                      });
                      alert('Cancel request submitted!');
                      setShowCancelModal(false);
                      setCancelReason('');
                    } catch (err) {
                      console.error('Error submitting cancel request:', err);
                      alert('Failed to submit cancel request.');
                    }
                  }} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Submit Request</button>
                </div>
              </div>
            </div>
          )}
          <section>
            <h2 className="text-lg font-semibold mb-3">Past Classes</h2>
            {past.length === 0 ? (
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 text-center text-gray-600">No past classes found.</div>
            ) : (
              <ul className="space-y-4">
                {past.map((s) => (
                  <li key={s.sessionId} className="rounded-xl border border-gray-100 bg-white p-4 flex flex-col md:flex-row md:items-center gap-3 shadow-sm">
                    <div className="flex-1">
                      <div className="font-semibold text-purple-700">{childMap[s.studentId]?.name || "-"}</div>
                      <div className="text-sm text-gray-600">Course: {s.courseId}</div>
                      <div className="text-sm text-gray-600">Date: {formatDate(s.startAt)}</div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[s.status]}`}>{s.status.replace("_", " ")}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default ParentSchedule;
