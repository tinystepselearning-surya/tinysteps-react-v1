import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { useAuthStore } from '../../../store/useAuthStore';
import type { TeacherSession } from '../../../types/Teacher';
import { resolveOperationalTeacherId } from '../../../lib/teacherIdentity';

type Range = { teacherId: string; start: string; end: string };
type Listener = { next: (rows: TeacherSession[]) => void; fail: (error: Error) => void };
type Entry = {
  range: Range;
  listeners: Set<Listener>;
  rows: TeacherSession[] | null;
  promise: Promise<void> | null;
};

export const TEACHER_CALENDAR_READ_AHEAD_DAYS = 60;

/**
 * All three Teacher calendar views share one future-exception query for the
 * current IST day through 60 days ahead. A deliberately selected later date
 * extends the bounds on demand; normal Today/Upcoming/Month navigation reuses
 * the initial result without another Firestore query.
 */
export const teacherCalendarReadWindow = (selectedEndYmd: string, todayYmd?: string) => {
  const today = todayYmd || new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);
  const horizon = new Date(Date.parse(today + 'T00:00:00.000Z') +
    TEACHER_CALENDAR_READ_AHEAD_DAYS * 86_400_000).toISOString().slice(0, 10);
  if (selectedEndYmd <= horizon) return { start: today, end: horizon };
  // Explicitly browsing a remote month still uses no more than 60 days of
  // real exceptions, not an unbounded now-to-arbitrary-future query.
  const boundedStart = new Date(Date.parse(selectedEndYmd + 'T00:00:00.000Z') -
    TEACHER_CALENDAR_READ_AHEAD_DAYS * 86_400_000).toISOString().slice(0, 10);
  return { start: boundedStart, end: selectedEndYmd };
};

const rangeKey = ({ teacherId, start, end }: Range) => [teacherId, start, end].join('|');
const includes = (range: Range, date: string) => range.start <= date && date <= range.end;

/**
 * Browser-memory-only canonical session exception cache.
 *
 * Teacher timetables come from enrollments. Real classSessions are loaded
 * at most once per teacher/date range to preserve ad hoc bookings, cancellations
 * and recorded attendance. There are NO Firestore onSnapshot listeners or
 * background polling. After a teacher action we read back only its session
 * document and broadcast the confirmed state to mounted calendar views.
 */
export class TeacherCalendarSessionReadCache {
  private entries = new Map<string, Entry>();
  private confirmed = new Map<string, Map<string, TeacherSession>>();

  subscribe(
    range: Range,
    load: () => Promise<TeacherSession[]>,
    next: (rows: TeacherSession[]) => void,
    fail: (error: Error) => void,
  ): () => void {
    const key = rangeKey(range);
    let entry = this.entries.get(key);
    if (!entry) {
      entry = { range, listeners: new Set(), rows: null, promise: null };
      this.entries.set(key, entry);
    }
    const current = entry;
    const listener: Listener = { next, fail };
    current.listeners.add(listener);
    const publish = () => {
      if (!current.rows) return;
      current.listeners.forEach(fn => fn.next([...(current.rows || [])]));
    };

    if (current.rows) {
      next([...current.rows]);
    } else if (!current.promise) {
      current.promise = load()
        .then(rows => {
          if (this.entries.get(key) !== current) return;
          const byId = new Map(rows.map(row => [row.id, row]));
          this.confirmed.get(range.teacherId)?.forEach(row => {
            if (includes(range, String(row.date || ''))) byId.set(row.id, row);
          });
          current.rows = [...byId.values()];
          publish();
        })
        .catch(error => {
          if (this.entries.get(key) !== current) return;
          this.entries.delete(key);
          const problem = error instanceof Error ? error : new Error(String(error));
          current.listeners.forEach(fn => fn.fail(problem));
        })
        .finally(() => { current.promise = null; });
    }
    return () => { current.listeners.delete(listener); };
  }

  /** Called ONLY from explicit Refresh, not when a tab re-mounts. */
  invalidateTeacher(teacherId: string): void {
    for (const [key, entry] of this.entries) {
      if (entry.range.teacherId === teacherId) this.entries.delete(key);
    }
    this.confirmed.delete(teacherId);
  }

  clear(): void {
    this.entries.clear();
    this.confirmed.clear();
  }

  publishConfirmed(teacherId: string, row: TeacherSession): void {
    if (!teacherId || !row.id || !row.date) return;
    const existing = this.confirmed.get(teacherId) || new Map<string, TeacherSession>();
    existing.set(row.id, row);
    this.confirmed.set(teacherId, existing);
    this.entries.forEach(entry => {
      if (entry.range.teacherId !== teacherId || !includes(entry.range, row.date)) return;
      if (!entry.rows) return;
      const rows = new Map(entry.rows.map(item => [item.id, item]));
      rows.set(row.id, row);
      entry.rows = [...rows.values()];
      entry.listeners.forEach(listener => listener.next([...entry.rows!]));
    });
  }

  async confirmSavedSession(teacherId: string, sessionId: string): Promise<TeacherSession> {
    if (!teacherId || !sessionId) throw new Error('Teacher and session identity are required');
    const snap = await getDoc(doc(db, 'classSessions', sessionId));
    if (!snap.exists()) throw new Error('Saved attendance session was not found');
    const row = { id: snap.id, ...snap.data() } as TeacherSession;
    if (resolveOperationalTeacherId(row as unknown as Record<string, unknown>) !== teacherId) {
      throw new Error('Saved attendance session does not belong to this teacher');
    }
    this.publishConfirmed(teacherId, row);
    return row;
  }
}

export const teacherCalendarSessionReadCache = new TeacherCalendarSessionReadCache();

// Keep private browser-memory attendance/exception snapshots scoped to login.
if (typeof useAuthStore.subscribe === 'function') {
  useAuthStore.subscribe((next, previous) => {
    if (next.user?.uid !== previous.user?.uid) teacherCalendarSessionReadCache.clear();
  });
}
