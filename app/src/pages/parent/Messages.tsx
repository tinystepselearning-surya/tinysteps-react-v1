import React, { useState } from "react";
import { useParentTeacherNotes } from "../../hooks/useParentTeacherNotes";
import { useParentSessions } from "../../hooks/useParentSessions";
import { useParentTickets } from "../../hooks/useParentTickets";
import useParentChildren from "../../hooks/useParentChildren";
import type { TeacherNote, Session, Ticket } from "../../types/models";

const TABS = ["Teacher Notes", "Class Recordings", "Support Tickets"];

const MessagesPage: React.FC = () => {
  const [tab, setTab] = useState(0);
  const { notes, loading: notesLoading } = useParentTeacherNotes();
  const { sessions, loading: sessionsLoading } = useParentSessions();
  const { tickets, loading: ticketsLoading } = useParentTickets();
  const { children } = useParentChildren();
  const [showModal, setShowModal] = useState(false);
  const [ticketType, setTicketType] = useState("support");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketChild, setTicketChild] = useState<string | undefined>(undefined);
  const [weeklyDigest, setWeeklyDigest] = useState(false); // TODO: wire to /users/{uid}.settings.weeklyDigest

  // Teacher Notes Tab
  const teacherNotes = (
    <div className="mt-4">
      {notesLoading ? (
        <div className="p-8 text-center text-gray-500">Loading notes…</div>
      ) : notes.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-6 border text-center text-gray-600">No teacher notes found.</div>
      ) : (
        <ul className="space-y-4">
          {notes.map((note: TeacherNote) => (
            <li key={note.noteId} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="font-semibold text-purple-700 mb-1">{children.find(c => c.sid === note.studentId)?.name || "Child"}</div>
              <div className="text-sm text-gray-600 mb-1">{note.message}</div>
              <div className="text-xs text-gray-500">{note.createdAt?.toDate ? note.createdAt.toDate().toLocaleDateString() : "-"}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  // Class Recordings Tab
  const recordings = sessions.filter((s: Session) => s.status === "completed" && s.recordingUrl);
  const classRecordings = (
    <div className="mt-4">
      {sessionsLoading ? (
        <div className="p-8 text-center text-gray-500">Loading recordings…</div>
      ) : recordings.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-6 border text-center text-gray-600">No class recordings found.</div>
      ) : (
        <ul className="space-y-4">
          {recordings.map((rec: Session) => (
            <li key={rec.sessionId} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex-1">
                <div className="font-semibold text-purple-700 mb-1">{children.find(c => c.sid === rec.studentId)?.name || "Child"}</div>
                <div className="text-xs text-gray-500 mb-1">{rec.startAt?.toDate ? rec.startAt.toDate().toLocaleDateString() : "-"}</div>
              </div>
              <a href={rec.recordingUrl} target="_blank" rel="noopener" className="bg-purple-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-purple-700 transition">Watch Recording</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  // Support Tickets Tab
  const supportTickets = (
    <div className="mt-4">
      <button className="bg-purple-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-purple-700 transition mb-4" onClick={() => setShowModal(true)}>New Support Ticket</button>
      {ticketsLoading ? (
        <div className="p-8 text-center text-gray-500">Loading tickets…</div>
      ) : tickets.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-6 border text-center text-gray-600">No support tickets found.</div>
      ) : (
        <ul className="space-y-4">
          {tickets.map((t: Ticket) => (
            <li key={t.ticketId} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="font-semibold text-purple-700 mb-1">{children.find(c => c.sid === t.studentId)?.name || "General"}</div>
              <div className="text-sm text-gray-600 mb-1">{t.message}</div>
              <span className={`px-2 py-1 rounded-full text-xs font-bold mr-2 ${t.status === "open" ? "bg-yellow-100 text-yellow-700" : t.status === "in_progress" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>{t.status.replace("_", " ")}</span>
              <div className="text-xs text-gray-500">{t.createdAt?.toDate ? t.createdAt.toDate().toLocaleDateString() : "-"}</div>
            </li>
          ))}
        </ul>
      )}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <form className="bg-white rounded-xl p-6 shadow-lg w-full max-w-md" onSubmit={e => {e.preventDefault(); setShowModal(false); setTicketMessage(""); setTicketType("support"); setTicketChild(undefined); alert("Support ticket submitted (stub)");}}>
            <h3 className="text-lg font-bold mb-4">New Support Ticket</h3>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Type</label>
              <select className="w-full border rounded px-3 py-2" value={ticketType} onChange={e => setTicketType(e.target.value)}>
                <option value="support">Support</option>
                <option value="reschedule">Reschedule</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Child (optional)</label>
              <select className="w-full border rounded px-3 py-2" value={ticketChild || ""} onChange={e => setTicketChild(e.target.value || undefined)}>
                <option value="">General</option>
                {children.map(c => <option key={c.sid} value={c.sid}>{c.name}</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Message</label>
              <textarea className="w-full border rounded px-3 py-2" value={ticketMessage} onChange={e => setTicketMessage(e.target.value)} required />
            </div>
            <div className="flex gap-3 mt-4">
              <button type="submit" className="bg-purple-600 text-white rounded-lg px-4 py-2 font-semibold">Submit</button>
              <button type="button" className="bg-gray-200 rounded-lg px-4 py-2 font-semibold" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Messages & Feedback</h1>
      <div className="flex gap-3 mb-6">
        {TABS.map((t, i) => (
          <button key={t} className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${tab === i ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-purple-100"}`} onClick={() => setTab(i)}>{t}</button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-gray-700">Weekly Digest</span>
          <button className={`w-10 h-6 rounded-full border ${weeklyDigest ? "bg-purple-600 border-purple-600" : "bg-gray-200 border-gray-300"}`} onClick={() => setWeeklyDigest(v => !v)}>
            <span className={`block w-4 h-4 rounded-full bg-white shadow transition-transform ${weeklyDigest ? "translate-x-4" : "translate-x-0"}`}></span>
          </button>
        </div>
      </div>
      {tab === 0 && teacherNotes}
      {tab === 1 && classRecordings}
      {tab === 2 && supportTickets}
    </div>
  );
};

export default MessagesPage;

