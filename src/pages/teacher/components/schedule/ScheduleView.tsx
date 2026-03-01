import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@components/ui/dialog';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { useTeacherSessions } from '../../hooks/useTeacherSessions';
import { useTeacherFilteredStudents } from '@/hooks/useTeacherFilteredData';
import { AttendanceForm } from '../today-sessions/AttendanceForm';
import { TeacherSession, AttendanceStatus } from '../../../../types/Teacher';
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, Timestamp, where, writeBatch } from 'firebase/firestore';
import { db } from '../../../../lib/firebaseConfig';
import { useAuthStore } from '../../../../store/useAuthStore';
import { toast } from '@components/hooks/use-toast';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, eachDayOfInterval, isSameMonth, isToday, isSameDay, startOfDay, endOfDay } from 'date-fns';

interface ScheduleViewProps {
  teacherId?: string;
}

interface BlockedSlot {
  id: string;
  startAt: Date;
  endAt: Date;
  reason?: string;
  createdAt?: unknown;
  createdBy?: string | null;
}

interface SessionRequest {
  id: string;
  kidId: string;
  startAt: Date;
  endAt: Date;
  durationMins: number;
  note?: string;
  status?: string;
}

interface CurriculumTopic {
  id: string;
  courseId?: string;
  lesson?: string;
  label?: string;
}

type TopicUpdatePayload = {
  topicId: string;
  mastery?: string;
  teacherRemark?: string;
  topicName?: string;
};

const COURSE_LABEL_BY_ID: Record<string, string> = {
  'phonics-foundations': 'Phonics Foundations',
  'early-phonics': 'Early Phonics',
  'advanced-phonics': 'Advanced Phonics',
  'basic-grammar': 'Basic Grammar',
  'advanced-grammar': 'Advanced Grammar',
  'basic-public-speaking': 'Public Speaking (Basic)',
  'advanced-public-speaking': 'Public Speaking (Advanced)',
  foundational: 'Phonics Foundations',
  early: 'Early Phonics',
  advanced: 'Advanced Phonics',
};

const COURSE_ID_ALIASES: Record<string, string> = {
  'phonics-foundation': 'phonics-foundations',
  'phonics-foundations': 'phonics-foundations',
  foundational: 'phonics-foundations',
  'phonics-early': 'early-phonics',
  early: 'early-phonics',
  'phonics-advanced': 'advanced-phonics',
  advanced: 'advanced-phonics',
  'grammar-essentials': 'basic-grammar',
  'grammar-mastery': 'advanced-grammar',
  'intermediate-grammar': 'basic-grammar',
  'public-speaking-foundations': 'basic-public-speaking',
  'public-speaking-excellence': 'advanced-public-speaking',
  'intermediate-public-speaking': 'basic-public-speaking',
};

const normalizeCourseId = (value?: string | null): string | null => {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const key = trimmed.toLowerCase();
  return COURSE_ID_ALIASES[key] || trimmed;
};


export const ScheduleView: React.FC<ScheduleViewProps> = ({ teacherId }) => {
  const { user } = useAuthStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [selectedSession, setSelectedSession] = useState<TeacherSession | null>(null);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockDate, setBlockDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [blockStartTime, setBlockStartTime] = useState('09:00');
  const [blockDuration, setBlockDuration] = useState(35);
  const [blockReason, setBlockReason] = useState('');
  const [isSavingBlock, setIsSavingBlock] = useState(false);
  const [sessionRequests, setSessionRequests] = useState<SessionRequest[]>([]);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleKidId, setScheduleKidId] = useState('');
  const [scheduleDate, setScheduleDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [scheduleStartTime, setScheduleStartTime] = useState('09:00');
  const [scheduleDuration, setScheduleDuration] = useState(35);
  const [scheduleNote, setScheduleNote] = useState('');
  const [isSavingRequest, setIsSavingRequest] = useState(false);
  const [curriculumTopics, setCurriculumTopics] = useState<CurriculumTopic[]>([]);
  const [isOverflowOpen, setIsOverflowOpen] = useState(false);
  const [overflowDay, setOverflowDay] = useState<Date | null>(null);
  const [overflowSessions, setOverflowSessions] = useState<TeacherSession[]>([]);

  const { monthStart, monthEnd } = useMemo(
    () => ({ monthStart: startOfMonth(currentDate), monthEnd: endOfMonth(currentDate) }),
    [currentDate],
  );

  useEffect(() => {
    const ref = doc(db, 'config', 'curriculumTopics');
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setCurriculumTopics([]);
          return;
        }
        const data = snap.data() || {};
        const rawTopics = Array.isArray(data.topics) ? data.topics : [];
        const topics = rawTopics
          .map((t: any) => ({
            id: String(t?.id ?? ''),
            courseId: t?.courseId ? String(t.courseId) : undefined,
            lesson: t?.lesson ? String(t.lesson) : undefined,
            label: String(t?.label ?? t?.topicName ?? t?.name ?? ''),
          }))
          .filter((t: CurriculumTopic) => t.id);
        setCurriculumTopics(topics);
      },
      (err) => {
        console.error('curriculumTopics onSnapshot error', err);
        setCurriculumTopics([]);
      },
    );

    return () => unsub();
  }, []);

  // Build topic label lookup map
  const topicLabelById = useMemo(() => {
    const map = new Map<string, string>();
    curriculumTopics.forEach((topic) => {
      if (topic.id) {
        const base = topic.label || topic.id;
        const display = topic.lesson ? `${topic.lesson} — ${base}` : base;
        map.set(topic.id, display);
      }
    });
    return map;
  }, [curriculumTopics]);

  const topicCourseById = useMemo(() => {
    const map = new Map<string, string>();
    curriculumTopics.forEach((topic) => {
      if (!topic.id || !topic.courseId) return;
      const normalized = normalizeCourseId(topic.courseId);
      if (normalized) {
        map.set(topic.id, normalized);
      }
    });
    return map;
  }, [curriculumTopics]);

  // Calculate date range based on view
  const { rangeStart, rangeEnd } = useMemo(() => {
    if (view === 'month') {
      return { rangeStart: startOfMonth(currentDate), rangeEnd: endOfMonth(currentDate) };
    } else if (view === 'week') {
      return { rangeStart: startOfWeek(currentDate, { weekStartsOn: 0 }), rangeEnd: endOfWeek(currentDate, { weekStartsOn: 0 }) };
    } else {
      // day
      return { rangeStart: currentDate, rangeEnd: currentDate };
    }
  }, [currentDate, view]);

  // Fetch all sessions for the visible range
  const { sessions, error: sessionsError } = useTeacherSessions(
    teacherId,
    format(rangeStart, 'yyyy-MM-dd'),
    format(rangeEnd, 'yyyy-MM-dd')
  );

  // Fetch sessions for monthly summary
  const { sessions: monthSessions } = useTeacherSessions(
    teacherId,
    format(monthStart, 'yyyy-MM-dd'),
    format(monthEnd, 'yyyy-MM-dd')
  );

  const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });

  const effectiveTeacherId = teacherId || user?.uid;

  useEffect(() => {
    if (!effectiveTeacherId) {
      setBlockedSlots([]);
      return;
    }

    const rangeStartAt = startOfDay(monthStart);
    const rangeEndAt = endOfDay(monthEnd);

    const q = query(
      collection(db, 'teachers', effectiveTeacherId, 'blockedSlots'),
      where('startAt', '>=', Timestamp.fromDate(rangeStartAt)),
      where('startAt', '<=', Timestamp.fromDate(rangeEndAt)),
      orderBy('startAt', 'asc'),
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs
          .map((d) => {
            const raw = d.data();
            const startAt = raw?.startAt?.toDate ? raw.startAt.toDate() : raw?.startAt ? new Date(raw.startAt) : null;
            const endAt = raw?.endAt?.toDate ? raw.endAt.toDate() : raw?.endAt ? new Date(raw.endAt) : null;
            if (!startAt || !endAt) return null;
            return {
              id: d.id,
              startAt,
              endAt,
              reason: raw?.reason || '',
              createdAt: raw?.createdAt,
              createdBy: raw?.createdBy ?? null,
            } as BlockedSlot;
          })
          .filter(Boolean) as BlockedSlot[];
        setBlockedSlots(data);
      },
      (err) => {
        console.error('blockedSlots onSnapshot error', err);
      },
    );

    return () => unsub();
  }, [effectiveTeacherId, monthStart, monthEnd]);

  useEffect(() => {
    if (!effectiveTeacherId) {
      setSessionRequests([]);
      return;
    }

    const rangeStartAt = startOfDay(monthStart);
    const rangeEndAt = endOfDay(monthEnd);

    const q = query(
      collection(db, 'teachers', effectiveTeacherId, 'sessionRequests'),
      where('startAt', '>=', Timestamp.fromDate(rangeStartAt)),
      where('startAt', '<=', Timestamp.fromDate(rangeEndAt)),
      orderBy('startAt', 'asc'),
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs
          .map((d) => {
            const raw = d.data();
            const startAt = raw?.startAt?.toDate ? raw.startAt.toDate() : raw?.startAt ? new Date(raw.startAt) : null;
            const endAt = raw?.endAt?.toDate ? raw.endAt.toDate() : raw?.endAt ? new Date(raw.endAt) : null;
            if (!startAt || !endAt) return null;
            return {
              id: d.id,
              kidId: raw?.kidId || '',
              startAt,
              endAt,
              durationMins: raw?.durationMins || 0,
              note: raw?.note || '',
              status: raw?.status || 'requested',
            } as SessionRequest;
          })
          .filter(Boolean) as SessionRequest[];
        setSessionRequests(data);
      },
      (err) => {
        console.error('sessionRequests onSnapshot error', err);
      },
    );

    return () => unsub();
  }, [effectiveTeacherId, monthStart, monthEnd]);

  // Fetch students for name lookup
  const { students } = useTeacherFilteredStudents();

  // Create quick lookup map: kidId -> studentName
  const studentNameById = useMemo(
    () => new Map(students.map((s) => [s.uid, s.fullName || ''])),
    [students]
  );

  const studentCourseLabelById = useMemo(() => {
    const map = new Map<string, string>();
    students.forEach((student) => {
      const data = student as any;
      const kidId = data.uid || data.id;
      if (!kidId) return;

      const ids = Array.isArray(data.courseIds) ? data.courseIds.map(String) : [];
      const labels = Array.isArray(data.courseLabels) ? data.courseLabels.map(String) : [];
      const activeId = typeof data.activeCourseId === 'string' ? data.activeCourseId : '';

      let label = '';
      if (activeId) {
        const idx = ids.indexOf(activeId);
        label = (idx >= 0 && labels[idx]) ? labels[idx] : (COURSE_LABEL_BY_ID[activeId] || '');
      }

      if (!label) {
        if (labels.length > 0) label = labels[0];
        else if (ids.length > 0) label = COURSE_LABEL_BY_ID[ids[0]] || ids[0];
      }

      if (!label) {
        const legacy = Array.isArray(data.courseNames)
          ? data.courseNames
          : Array.isArray(data.courses)
            ? data.courses
            : [];
        if (legacy.length > 0) label = String(legacy[0]);
      }

      if (label) map.set(String(kidId), label);
    });
    return map;
  }, [students]);

  const knownKidIds = useMemo(() => {
    const ids = new Set<string>();
    students.forEach((student) => {
      const data = student as any;
      const kidId = data?.uid || data?.id;
      if (kidId) ids.add(String(kidId));
    });
    return ids;
  }, [students]);

  const resolveSessionKidId = (session: any): string | null => {
    if (!session) return null;
    const direct = session.kidId || (Array.isArray(session.kidIds) ? session.kidIds[0] : null);
    return direct ? String(direct) : null;
  };

  const visibleSessions = useMemo(() => {
    if (knownKidIds.size === 0) return sessions;
    return sessions.filter((session) => {
      const kidId = resolveSessionKidId(session);
      return kidId && knownKidIds.has(kidId);
    });
  }, [sessions, knownKidIds]);

  const hiddenSessions = useMemo(() => {
    if (knownKidIds.size === 0) return [];
    return sessions.filter((session) => {
      const kidId = resolveSessionKidId(session);
      return !kidId || !knownKidIds.has(kidId);
    });
  }, [sessions, knownKidIds]);

  const visibleMonthSessions = useMemo(() => {
    if (knownKidIds.size === 0) return monthSessions;
    return monthSessions.filter((session) => {
      const kidId = resolveSessionKidId(session);
      return kidId && knownKidIds.has(kidId);
    });
  }, [monthSessions, knownKidIds]);

  const getCourseLabel = (session?: Partial<TeacherSession>): string => {
    if (!session) return '';
    return (
      (session as any).courseLabel ||
      session.courseName ||
      (session as any).courseTitle ||
      session.courseId ||
      ''
    );
  };

  const truncateLabel = (value: string, max = 18): string => {
    if (!value) return '';
    if (value.length <= max) return value;
    if (max <= 3) return value.slice(0, max);
    return `${value.slice(0, max - 3)}...`;
  };

  const sessionsByDate = visibleSessions.reduce((acc, session) => {
    if (!acc[session.date]) acc[session.date] = [];
    acc[session.date].push(session);
    return acc;
  }, {} as Record<string, any[]>);

  const blockedSlotsByDate = useMemo(() => {
    const map: Record<string, BlockedSlot[]> = {};
    blockedSlots.forEach((slot) => {
      const dateKey = format(slot.startAt, 'yyyy-MM-dd');
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(slot);
    });
    Object.values(map).forEach((list) =>
      list.sort((a, b) => a.startAt.getTime() - b.startAt.getTime()),
    );
    return map;
  }, [blockedSlots]);

  const requestsByDate = useMemo(() => {
    const map: Record<string, SessionRequest[]> = {};
    sessionRequests.forEach((req) => {
      const dateKey = format(req.startAt, 'yyyy-MM-dd');
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(req);
    });
    Object.values(map).forEach((list) =>
      list.sort((a, b) => a.startAt.getTime() - b.startAt.getTime()),
    );
    return map;
  }, [sessionRequests]);

  const monthlySummary = useMemo(() => {
    const start = monthStart.getTime();
    const end = monthEnd.getTime();

    const monthRequests = sessionRequests.filter(
      (req) => req.startAt.getTime() >= start && req.startAt.getTime() <= end,
    );
    const monthBlocked = blockedSlots.filter(
      (slot) => slot.startAt.getTime() >= start && slot.startAt.getTime() <= end,
    );

    let presentKids = 0;
    let absentKids = 0;
    let lateKids = 0;
    let rescheduleKids = 0;

    visibleMonthSessions.forEach((session) => {
      const attendance = session.attendance || {};
      Object.values(attendance).forEach((entry: any) => {
        const status = entry?.status ?? entry;
        if (status === 'present') presentKids += 1;
        if (status === 'absent') absentKids += 1;
        if (status === 'late') lateKids += 1;
        if (status === 'reschedule_requested') rescheduleKids += 1;
      });
    });

    return {
      sessionsInMonth: visibleMonthSessions.length,
      completedSessions: visibleMonthSessions.filter((s) => s.status === 'completed').length,
      presentKids,
      absentKids,
      lateKids,
      rescheduleKids,
      pendingRequests: monthRequests.length,
      blockedSlots: monthBlocked.length,
    };
  }, [monthStart, monthEnd, monthSessions, sessionRequests, blockedSlots]);

  const openBlockModal = () => {
    setBlockDate(format(currentDate, 'yyyy-MM-dd'));
    setBlockStartTime('09:00');
    setBlockDuration(35);
    setBlockReason('');
    setIsBlockModalOpen(true);
  };

  const openScheduleModal = () => {
    setScheduleDate(format(currentDate, 'yyyy-MM-dd'));
    setScheduleStartTime('09:00');
    setScheduleDuration(35);
    setScheduleNote('');
    setScheduleKidId(students[0]?.uid || '');
    setIsScheduleModalOpen(true);
  };

  const handleCreateBlock = async () => {
    if (!effectiveTeacherId) {
      toast({ title: 'Missing teacher', description: 'Please sign in again.', variant: 'destructive' });
      return;
    }

    if (!blockDate || !blockStartTime) {
      toast({ title: 'Missing info', description: 'Select a date and start time.', variant: 'destructive' });
      return;
    }

    const [year, month, day] = blockDate.split('-').map(Number);
    const [hour, minute] = blockStartTime.split(':').map(Number);
    const durationMinutes = Number(blockDuration);

    if (!year || !month || !day || Number.isNaN(hour) || Number.isNaN(minute) || !durationMinutes || durationMinutes <= 0) {
      toast({ title: 'Invalid block', description: 'Please check date, time, and duration.', variant: 'destructive' });
      return;
    }

    const startAt = new Date(year, month - 1, day, hour, minute, 0, 0);
    const endAt = new Date(startAt.getTime() + durationMinutes * 60 * 1000);

    setIsSavingBlock(true);
    try {
      await addDoc(collection(db, 'teachers', effectiveTeacherId, 'blockedSlots'), {
        startAt,
        endAt,
        reason: blockReason.trim(),
        createdAt: serverTimestamp(),
        createdBy: user?.uid ?? effectiveTeacherId,
      });
      toast({ title: 'Time blocked', description: 'Blocked slot added to your calendar.' });
      setIsBlockModalOpen(false);
    } catch (err) {
      console.error('create blocked slot error', err);
      toast({
        title: 'Unable to block time',
        description: err instanceof Error ? err.message : 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingBlock(false);
    }
  };

  const handleCreateSessionRequest = async () => {
    if (!effectiveTeacherId) {
      toast({ title: 'Missing teacher', description: 'Please sign in again.', variant: 'destructive' });
      return;
    }

    if (!scheduleKidId) {
      toast({ title: 'Select a student', description: 'Choose a student to schedule.', variant: 'destructive' });
      return;
    }

    const [year, month, day] = scheduleDate.split('-').map(Number);
    const [hour, minute] = scheduleStartTime.split(':').map(Number);
    const durationMinutes = Number(scheduleDuration);

    if (!year || !month || !day || Number.isNaN(hour) || Number.isNaN(minute) || !durationMinutes || durationMinutes <= 0) {
      toast({ title: 'Invalid session', description: 'Check date, time, and duration.', variant: 'destructive' });
      return;
    }

    const startAt = new Date(year, month - 1, day, hour, minute, 0, 0);
    const endAt = new Date(startAt.getTime() + durationMinutes * 60 * 1000);

    const overlapsBlocked = blockedSlots.some(
      (slot) => startAt < slot.endAt && endAt > slot.startAt,
    );

    if (overlapsBlocked) {
      toast({
        title: 'Overlaps a blocked time',
        description: 'Pick a different time or remove the blocked slot.',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingRequest(true);
    try {
      await addDoc(collection(db, 'teachers', effectiveTeacherId, 'sessionRequests'), {
        teacherId: effectiveTeacherId,
        kidId: scheduleKidId,
        startAt,
        endAt,
        durationMins: durationMinutes,
        note: scheduleNote.trim(),
        status: 'requested',
        createdAt: serverTimestamp(),
        createdBy: user?.uid ?? effectiveTeacherId,
      });
      toast({ title: 'Session requested', description: 'Admin will confirm this session.' });
      setIsScheduleModalOpen(false);
    } catch (err) {
      console.error('create session request error', err);
      toast({
        title: 'Unable to schedule',
        description: err instanceof Error ? err.message : 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingRequest(false);
    }
  };

  const handleCancelRequest = async (reqId: string) => {
    if (!effectiveTeacherId) {
      toast({ title: 'Missing teacher', description: 'Please sign in again.', variant: 'destructive' });
      return;
    }

    const confirmed = window.confirm('Cancel this session request?');
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, 'teachers', effectiveTeacherId, 'sessionRequests', reqId));
      toast({ title: 'Request cancelled', description: 'Pending request removed.' });
    } catch (err) {
      console.error('cancel session request error', err);
      toast({
        title: 'Unable to cancel',
        description: err instanceof Error ? err.message : 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const handleAttendanceSubmit = async (data: { attendance: Record<string, { status: AttendanceStatus; notes?: string; mastery?: string; topics?: string[]; topicUpdates?: TopicUpdatePayload[] }>; sessionNotes: string; meta?: { courseId?: string; courseLabel?: string; attendanceOnly?: boolean } }) => {
    if (!selectedSession) return;
    try {
      const batch = writeBatch(db);

      if (data.meta?.attendanceOnly) {
        const existingAttendance = ((selectedSession as any)?.attendance || {}) as Record<string, any>;
        const mergedAttendance: Record<string, any> = { ...existingAttendance };

        Object.entries(data.attendance || {}).forEach(([kidId, entry]) => {
          const prev = existingAttendance[kidId];
          const prevObj =
            typeof prev === 'object' && prev !== null
              ? prev
              : prev
                ? { status: prev }
                : {};
          mergedAttendance[kidId] = {
            ...prevObj,
            status: entry.status,
            notes: entry.notes ?? prevObj?.notes ?? '',
          };
        });

        const hasPresentOrLate = Object.values(mergedAttendance || {}).some((entry: any) => {
          const status = entry?.status ?? entry;
          return status === 'present' || status === 'late';
        });

        const sessionUpdate: Record<string, any> = {
          attendance: mergedAttendance,
          notes: data.sessionNotes,
          updatedAt: serverTimestamp(),
          updatedBy: user?.uid ?? null,
        };

        if (hasPresentOrLate) {
          sessionUpdate.status = 'completed';
        }

        const classSessionRef = doc(db, 'classSessions', selectedSession.id);
        batch.set(classSessionRef, sessionUpdate, { merge: true });
        await batch.commit();
        toast({ title: 'Attendance saved', description: 'Attendance updated.' });
        setSelectedSession(null);
        return;
      }
      
      // Update session document
      const hasPresentOrLate = Object.values(data.attendance || {}).some((entry: any) => {
        const status = entry?.status ?? entry;
        return status === 'present' || status === 'late';
      });

      const sessionUpdate: Record<string, any> = {
        attendance: data.attendance,
        notes: data.sessionNotes,
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid ?? null,
      };

      if (hasPresentOrLate) {
        sessionUpdate.status = 'completed';
      }

      const classSessionRef = doc(db, 'classSessions', selectedSession.id);
      batch.set(classSessionRef, sessionUpdate, { merge: true });

      const sessionCourseId =
        normalizeCourseId(data.meta?.courseId || (selectedSession as any)?.courseId) || '';
      const sessionCourseLabel =
        data.meta?.courseLabel ||
        (selectedSession as any)?.courseLabel ||
        selectedSession.courseName ||
        (sessionCourseId ? COURSE_LABEL_BY_ID[sessionCourseId] : '') ||
        sessionCourseId ||
        '';

      // Write curriculum completion for each kid with topics (only if present/late)
      for (const [kidId, entry] of Object.entries(data.attendance)) {
        const status = (entry as any)?.status ?? entry;
        if (status !== 'present' && status !== 'late') continue;

        const topicUpdates = Array.isArray((entry as any)?.topicUpdates) ? (entry as any).topicUpdates : [];
        const topicIds = topicUpdates.length
          ? topicUpdates.map((t: any) => t?.topicId).filter(Boolean)
          : (Array.isArray(entry?.topics) ? entry.topics : []);
        if (!Array.isArray(topicIds) || topicIds.length === 0) continue;

        const updatesById = new Map<string, TopicUpdatePayload>(
          topicUpdates.map((t: any) => [t?.topicId, t])
        );

        for (const topicId of topicIds) {
          if (!topicId) continue;
          const update = updatesById.get(topicId);
          const mastery = typeof update?.mastery === 'string' ? update.mastery.trim() : '';
          const isCompleted = mastery === 'proficient' || mastery === 'mastered';
          const topicName = update?.topicName || topicLabelById.get(topicId) || topicId;
          const resolvedCourseId = sessionCourseId || topicCourseById.get(topicId) || '';
          const resolvedCourseLabel =
            sessionCourseLabel ||
            (resolvedCourseId ? COURSE_LABEL_BY_ID[resolvedCourseId] : '') ||
            resolvedCourseId ||
            '';
          const payload: Record<string, any> = {
            status: isCompleted ? 'completed' : 'in_progress',
            updatedAt: serverTimestamp(),
            updatedBy: user?.uid ?? null,
            source: 'attendance',
            lastSessionId: selectedSession.id,
            topicName,
          };
          if (resolvedCourseId) payload.courseId = resolvedCourseId;
          if (resolvedCourseLabel) {
            payload.courseLabel = resolvedCourseLabel;
            payload.courseName = resolvedCourseLabel;
          }
          const curRef = doc(db, 'students', kidId, 'curriculum', topicId);
          batch.set(curRef, payload, { merge: true });
        }
      }

      // Write progress docs for each kid with topics (only if present/late)
      for (const [kidId, entry] of Object.entries(data.attendance)) {
        const status = (entry as any)?.status ?? entry;
        if (status !== 'present' && status !== 'late') continue;

        const topicUpdates = Array.isArray((entry as any)?.topicUpdates) ? (entry as any).topicUpdates : [];
        const topicIds = topicUpdates.length
          ? topicUpdates.map((t: any) => t?.topicId).filter(Boolean)
          : (Array.isArray(entry?.topics) ? entry.topics : []);
        if (!Array.isArray(topicIds) || topicIds.length === 0) continue;

        const updatesById = new Map<string, TopicUpdatePayload>(
          topicUpdates.map((t: any) => [t?.topicId, t])
        );

        for (const topicId of topicIds) {
          if (!topicId) continue;
          const update = updatesById.get(topicId);
          const mastery = typeof update?.mastery === 'string' ? update.mastery.trim() : '';
          const teacherRemark = typeof update?.teacherRemark === 'string' ? update.teacherRemark.trim() : '';
          const topicName = update?.topicName || topicLabelById.get(topicId) || topicId;
          const resolvedCourseId = sessionCourseId || topicCourseById.get(topicId) || '';
          const resolvedCourseLabel =
            sessionCourseLabel ||
            (resolvedCourseId ? COURSE_LABEL_BY_ID[resolvedCourseId] : '') ||
            resolvedCourseId ||
            '';
          const payload: Record<string, any> = {
            lastEvidence: 'session',
            lastSessionId: selectedSession.id,
            updatedAt: serverTimestamp(),
            updatedBy: user?.uid ?? null,
            source: 'attendance',
            topicName,
            topicId,
          };
          if (mastery) payload.mastery = mastery;
          if (teacherRemark) payload.teacherRemark = teacherRemark;
          if (resolvedCourseId) payload.courseId = resolvedCourseId;
          if (resolvedCourseLabel) {
            payload.courseLabel = resolvedCourseLabel;
            payload.courseName = resolvedCourseLabel;
          }
          const progRef = doc(db, 'students', kidId, 'progress', topicId);
          batch.set(progRef, payload, { merge: true });
        }
      }

      await batch.commit();
      toast({ title: 'Attendance saved', description: 'Attendance and curriculum completion recorded.' });
      setSelectedSession(null);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Unable to save attendance',
        description: err instanceof Error ? err.message : 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const handlePrev = () => {
    if (view === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subDays(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (view === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const getTitle = () => {
    if (view === 'month') {
      return format(currentDate, 'MMMM yyyy');
    } else if (view === 'week') {
      return `Week of ${format(rangeStart, 'MMM d')} - ${format(rangeEnd, 'MMM d, yyyy')}`;
    } else {
      return format(currentDate, 'EEEE, MMMM d, yyyy');
    }
  };

  const hiddenCount = knownKidIds.size > 0 ? hiddenSessions.length : 0;

  const handleCopyHiddenSessions = () => {
    if (!hiddenSessions.length) return;
    const lines = hiddenSessions.map((session: any) => {
      const kidId = resolveSessionKidId(session) || '';
      const enrollmentId = session.enrollmentId || '';
      return `${session.id}\t${kidId}\t${enrollmentId}`;
    });
    const payload = lines.join('\n');
    if (navigator?.clipboard?.writeText) {
      void navigator.clipboard.writeText(payload);
    } else {
      window.prompt('Copy hidden session IDs', payload);
    }
  };

  return (
    <div className="space-y-6">
      {sessionsError && (
        <Card className="p-4 border border-red-200 bg-red-50 text-red-700">
          <p className="text-sm font-medium">Unable to load sessions.</p>
          <p className="text-xs text-red-600 mt-1">
            {sessionsError.message}
          </p>
          <p className="text-xs text-red-600 mt-1">
            If you’re an admin, deploy the required Firestore indexes for classSessions.
          </p>
        </Card>
      )}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrev}>Prev</Button>
          <h2 className="text-2xl font-bold">
            {getTitle()}
          </h2>
          <Button variant="outline" size="sm" onClick={handleNext}>Next</Button>
        </div>
        <div className="flex gap-2">
          <Button variant={view === 'month' ? 'default' : 'outline'} onClick={() => setView('month')}>Month</Button>
          <Button variant={view === 'week' ? 'default' : 'outline'} onClick={() => setView('week')}>Week</Button>
          <Button variant={view === 'day' ? 'default' : 'outline'} onClick={() => setView('day')}>Day</Button>
          <Button variant="outline" onClick={openScheduleModal}>Schedule New Session</Button>
          <Button onClick={openBlockModal}>Block Time</Button>
        </div>
      </div>

      {hiddenCount > 0 && (
        <Card className="p-3 border border-amber-200 bg-amber-50 text-amber-800">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span>
              Hidden {hiddenCount} old/unknown sessions (missing student records).
            </span>
            {import.meta.env.DEV && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyHiddenSessions}
              >
                Copy hidden session IDs
              </Button>
            )}
          </div>
        </Card>
      )}

      <Card className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold">This Month</h3>
            <p className="text-xs text-muted-foreground">
              {format(monthStart, 'MMM d')} - {format(monthEnd, 'MMM d, yyyy')}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Sessions</div>
              <div className="font-semibold">{monthlySummary.sessionsInMonth}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Completed</div>
              <div className="font-semibold">{monthlySummary.completedSessions}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Present kids</div>
              <div className="font-semibold">{monthlySummary.presentKids}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Absent kids</div>
              <div className="font-semibold">{monthlySummary.absentKids}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Late kids</div>
              <div className="font-semibold">{monthlySummary.lateKids}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Reschedule</div>
              <div className="font-semibold">{monthlySummary.rescheduleKids}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Pending requests</div>
              <div className="font-semibold">{monthlySummary.pendingRequests}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Blocked slots</div>
              <div className="font-semibold">{monthlySummary.blockedSlots}</div>
            </div>
          </div>
        </div>
      </Card>

      {view === 'month' && (
        <Card className="p-6">
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center font-semibold">
                {day}
              </div>
            ))}
            {days.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const daySessions = sessionsByDate[dateStr] || [];
              const dayBlocks = blockedSlotsByDate[dateStr] || [];
              const dayRequests = requestsByDate[dateStr] || [];
              return (
                <div
                  key={day.toString()}
                  className={`p-2 border min-h-[100px] ${
                    isToday(day) ? 'bg-blue-50 border-blue-200' : 'border-gray-200'
                  }`}
                >
                  <div className="text-sm font-medium">{format(day, 'd')}</div>
                  <div className="space-y-1 mt-1">
                    {dayBlocks.slice(0, 2).map((block) => (
                      <Badge
                        key={block.id}
                        variant="outline"
                        className="text-xs bg-rose-50 text-rose-800 border-rose-200"
                      >
                        Blocked · {format(block.startAt, 'HH:mm')}
                      </Badge>
                    ))}
                    {dayBlocks.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayBlocks.length - 2} blocked
                      </div>
                    )}
                    {dayRequests.slice(0, 2).map((req) => {
                      const kidName = studentNameById.get(req.kidId) || 'Student';
                      const courseLabel = studentCourseLabelById.get(req.kidId) || '';
                      return (
                        <Badge
                          key={req.id}
                          variant="outline"
                          className="text-xs bg-amber-50 text-amber-900 border-amber-200"
                        >
                          Pending · {format(req.startAt, 'HH:mm')} · {kidName}
                          {courseLabel ? ` · ${truncateLabel(courseLabel, 14)}` : ''}
                        </Badge>
                      );
                    })}
                    {dayRequests.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayRequests.length - 2} pending
                      </div>
                    )}
                    {daySessions.slice(0, 2).map((session, idx) => {
                      // Resolve kid names from kidIds array or fallback to single kidId
                      const kidIds: string[] = session.kidIds?.length ? session.kidIds : [];
                      const kidNames = kidIds
                        .map(id => studentNameById.get(id))
                        .filter(Boolean)
                        .join(', ') || 'Student';
                      const fallbackCourseLabel = kidIds
                        .map(id => studentCourseLabelById.get(id))
                        .find(Boolean) || '';
                      const courseLabel = getCourseLabel(session) || fallbackCourseLabel;
                      const isRescheduleRequested = Object.values(session.attendance || {})
                        .some((entry: any) => (entry?.status ?? entry) === 'reschedule_requested');
                      const isCompleted = session.status === 'completed';
                      
                      return (
                        <Badge 
                          key={idx} 
                          variant="secondary" 
                          className={`text-xs cursor-pointer hover:bg-secondary/80 ${
                            isCompleted ? 'opacity-70' : ''
                          } ${isRescheduleRequested ? 'bg-amber-100 text-amber-900 border border-amber-200' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSession(session);
                          }}
                        >
                          {isRescheduleRequested ? 'Reschedule · ' : ''}
                          {isCompleted ? '✓ ' : ''}{session.startTime} · {kidNames}
                          {courseLabel ? ` · ${truncateLabel(courseLabel, 14)}` : ''}
                        </Badge>
                      );
                    })}
                    {daySessions.length > 2 && (
                      <button
                        type="button"
                        className="text-xs text-primary-600 hover:underline text-left"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOverflowDay(day);
                          setOverflowSessions(daySessions);
                          setIsOverflowOpen(true);
                        }}
                      >
                        +{daySessions.length - 2} more
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {view === 'week' && (
        <Card className="p-6">
          <div className="grid grid-cols-7 gap-2">
            {days.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const daySessions = sessionsByDate[dateStr] || [];
              const dayBlocks = blockedSlotsByDate[dateStr] || [];
              const dayRequests = requestsByDate[dateStr] || [];
              return (
                <div key={day.toString()} className={`border rounded p-2 min-h-[150px] ${
                  isToday(day) ? 'bg-blue-50 border-blue-300' : 'border-gray-200'
                }`}>
                  <div className="text-center font-semibold mb-2">
                    <div className="text-xs text-muted-foreground">{format(day, 'EEE')}</div>
                    <div className="text-sm">{format(day, 'd')}</div>
                  </div>
                  <div className="space-y-1">
                    {dayBlocks.map((block) => (
                      <Badge
                        key={block.id}
                        variant="outline"
                        className="text-xs w-full justify-start bg-rose-50 text-rose-800 border-rose-200"
                      >
                        Blocked · {format(block.startAt, 'HH:mm')}
                      </Badge>
                    ))}
                    {dayRequests.map((req) => {
                      const kidName = studentNameById.get(req.kidId) || 'Student';
                      const courseLabel = studentCourseLabelById.get(req.kidId) || '';
                      return (
                        <Badge
                          key={req.id}
                          variant="outline"
                          className="text-xs w-full justify-start bg-amber-50 text-amber-900 border-amber-200"
                        >
                          Pending · {format(req.startAt, 'HH:mm')} · {kidName}
                          {courseLabel ? ` · ${truncateLabel(courseLabel, 16)}` : ''}
                        </Badge>
                      );
                    })}
                    {daySessions.map((session, idx) => {
                      const kidIds: string[] = session.kidIds?.length ? session.kidIds : [];
                      const kidNames = kidIds
                        .map(id => studentNameById.get(id))
                        .filter(Boolean)
                        .join(', ') || 'Student';
                      const fallbackCourseLabel = kidIds
                        .map(id => studentCourseLabelById.get(id))
                        .find(Boolean) || '';
                      const courseLabel = getCourseLabel(session) || fallbackCourseLabel;
                      const isRescheduleRequested = Object.values(session.attendance || {})
                        .some((entry: any) => (entry?.status ?? entry) === 'reschedule_requested');
                      const isCompleted = session.status === 'completed';
                      
                      return (
                        <Badge 
                          key={idx} 
                          variant="secondary" 
                          className={`text-xs cursor-pointer hover:bg-secondary/80 w-full justify-start ${
                            isCompleted ? 'opacity-70' : ''
                          } ${isRescheduleRequested ? 'bg-amber-100 text-amber-900 border border-amber-200' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSession(session);
                          }}
                        >
                          <div className="truncate">
                            {isRescheduleRequested ? 'Reschedule · ' : ''}
                            {isCompleted ? '✓ ' : ''}{session.startTime} · {kidNames}
                            {courseLabel ? ` · ${truncateLabel(courseLabel, 16)}` : ''}
                          </div>
                        </Badge>
                      );
                    })}
                    {daySessions.length === 0 && dayBlocks.length === 0 && dayRequests.length === 0 && (
                      <div className="text-xs text-muted-foreground text-center">No sessions</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {view === 'day' && (
        <Card className="p-6">
          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-2">
            {(sessionsByDate[format(currentDate, 'yyyy-MM-dd')]?.length > 0 ||
              blockedSlotsByDate[format(currentDate, 'yyyy-MM-dd')]?.length > 0 ||
              requestsByDate[format(currentDate, 'yyyy-MM-dd')]?.length > 0) ? (
              <>
                {blockedSlotsByDate[format(currentDate, 'yyyy-MM-dd')]?.map((block) => (
                  <div
                    key={block.id}
                    className="p-4 border rounded-lg bg-rose-50 border-rose-200"
                  >
                    <div className="font-semibold text-rose-900">
                      Blocked · {format(block.startAt, 'HH:mm')} - {format(block.endAt, 'HH:mm')}
                    </div>
                    {block.reason && (
                      <div className="text-xs text-rose-800 mt-1">{block.reason}</div>
                    )}
                  </div>
                ))}
                {requestsByDate[format(currentDate, 'yyyy-MM-dd')]?.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 border rounded-lg bg-amber-50 border-amber-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-amber-900">
                          Pending (Admin) · {format(req.startAt, 'HH:mm')} - {format(req.endAt, 'HH:mm')}
                        </div>
                        <div className="text-sm text-amber-800">
                          {studentNameById.get(req.kidId) || 'Student'}
                        </div>
                        {studentCourseLabelById.get(req.kidId) && (
                          <div className="text-xs text-amber-800 mt-1">
                            {truncateLabel(studentCourseLabelById.get(req.kidId) || '', 24)}
                          </div>
                        )}
                        {req.note && (
                          <div className="text-xs text-amber-800 mt-1">{req.note}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-amber-300 text-amber-900 bg-amber-100">
                          Pending
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelRequest(req.id)}
                          disabled={!effectiveTeacherId}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {sessionsByDate[format(currentDate, 'yyyy-MM-dd')].map((session, idx) => {
                  const kidIds: string[] = session.kidIds?.length ? session.kidIds : [];
                  const kidNames = kidIds
                    .map(id => studentNameById.get(id))
                    .filter(Boolean)
                    .join(', ') || 'Student';
                const fallbackCourseLabel = kidIds
                  .map(id => studentCourseLabelById.get(id))
                  .find(Boolean) || '';
                const courseLabel = getCourseLabel(session) || fallbackCourseLabel;
                const isRescheduleRequested = Object.values(session.attendance || {})
                  .some((entry: any) => (entry?.status ?? entry) === 'reschedule_requested');
                
                // Collect topic labels for completed sessions
                const topicLabels: string[] = [];
                if (session.status === 'completed' && session.attendance) {
                  const topicIds = Object.values(session.attendance)
                    .filter((e: any) => e?.status === 'present' || e?.status === 'late')
                    .flatMap((e: any) => (Array.isArray(e?.topics) ? e.topics : []));
                  
                  // De-dupe while preserving order
                  const uniqueTopicIds = [...new Set(topicIds)];
                  uniqueTopicIds.forEach((id) => {
                    if (id) {
                      topicLabels.push(topicLabelById.get(id) ?? id);
                    }
                  });
                }

                return (
                  <div 
                    key={idx}
                    className="p-4 border rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors"
                    onClick={() => setSelectedSession(session)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{session.startTime} - {session.endTime}</div>
                        <div className="text-sm text-muted-foreground">{kidNames}</div>
                        {courseLabel && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {truncateLabel(courseLabel, 28)}
                          </div>
                        )}
                      </div>
                      {isRescheduleRequested ? (
                        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-900">
                          Reschedule requested
                        </Badge>
                      ) : (
                        <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
                          {session.status}
                        </Badge>
                      )}
                    </div>
                    {topicLabels.length > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground flex flex-wrap gap-1 items-center">
                        <span>Topics:</span>
                        {topicLabels.slice(0, 4).map((label, i) => (
                          <span key={i} className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
                            {label}
                          </span>
                        ))}
                        {topicLabels.length > 4 && (
                          <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
                            +{topicLabels.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
                })}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No sessions scheduled for this day
              </div>
            )}
          </div>
        </Card>
      )}

      <AttendanceForm
        open={Boolean(selectedSession)}
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
        onSubmit={handleAttendanceSubmit}
        attendanceOnly
      />

      <Dialog
        open={isOverflowOpen}
        onOpenChange={(open) => {
          setIsOverflowOpen(open);
          if (!open) {
            setOverflowSessions([]);
            setOverflowDay(null);
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              Sessions on {overflowDay ? format(overflowDay, 'EEE, MMM d') : 'this day'}
            </DialogTitle>
            <DialogDescription>
              Tap a session to mark attendance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {overflowSessions.map((session, idx) => {
              const kidIds: string[] = session.kidIds?.length ? session.kidIds : [];
              const kidNames = kidIds
                .map((id) => studentNameById.get(id))
                .filter(Boolean)
                .join(', ') || 'Student';
              const fallbackCourseLabel = kidIds
                .map((id) => studentCourseLabelById.get(id))
                .find(Boolean) || '';
              const courseLabel = getCourseLabel(session) || fallbackCourseLabel;
              const isRescheduleRequested = Object.values(session.attendance || {})
                .some((entry: any) => (entry?.status ?? entry) === 'reschedule_requested');
              const timeLabel = session.startTime && session.endTime
                ? `${session.startTime} - ${session.endTime}`
                : session.startTime || '';
              return (
                <button
                  key={session.id || idx}
                  type="button"
                  className="w-full text-left border rounded-lg px-3 py-2 hover:bg-muted/40 transition-colors"
                  onClick={() => {
                    setSelectedSession(session);
                    setIsOverflowOpen(false);
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-sm">{timeLabel}</div>
                      <div className="text-xs text-muted-foreground">{kidNames}</div>
                      {courseLabel && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {truncateLabel(courseLabel, 24)}
                        </div>
                      )}
                    </div>
                    {isRescheduleRequested ? (
                      <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-900">
                        Reschedule
                      </Badge>
                    ) : (
                      <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
                        {session.status}
                      </Badge>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isBlockModalOpen} onOpenChange={setIsBlockModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Block Time</DialogTitle>
            <DialogDescription>
              Add a blocked slot so it shows up on your calendar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="block-date">Date</Label>
              <Input
                id="block-date"
                type="date"
                value={blockDate}
                onChange={(e) => setBlockDate(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="block-start">Start time</Label>
                <Input
                  id="block-start"
                  type="time"
                  value={blockStartTime}
                  onChange={(e) => setBlockStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="block-duration">Duration (min)</Label>
                <Input
                  id="block-duration"
                  type="number"
                  min={5}
                  step={5}
                  value={blockDuration}
                  onChange={(e) => setBlockDuration(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="block-reason">Reason (optional)</Label>
              <Input
                id="block-reason"
                type="text"
                placeholder="Personal, admin work, break..."
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsBlockModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleCreateBlock}
                disabled={isSavingBlock}
              >
                {isSavingBlock ? 'Saving...' : 'Save Block'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule New Session</DialogTitle>
            <DialogDescription>
              Request an ad-hoc session. Admin will confirm it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="schedule-student">Student</Label>
              <Select value={scheduleKidId} onValueChange={setScheduleKidId}>
                <SelectTrigger id="schedule-student">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.uid} value={student.uid}>
                      {student.fullName || 'Unnamed student'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule-date">Date</Label>
              <Input
                id="schedule-date"
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="schedule-start">Start time</Label>
                <Input
                  id="schedule-start"
                  type="time"
                  value={scheduleStartTime}
                  onChange={(e) => setScheduleStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule-duration">Duration (min)</Label>
                <Input
                  id="schedule-duration"
                  type="number"
                  min={5}
                  step={5}
                  value={scheduleDuration}
                  onChange={(e) => setScheduleDuration(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule-note">Note (optional)</Label>
              <Input
                id="schedule-note"
                type="text"
                placeholder="Reason or context"
                value={scheduleNote}
                onChange={(e) => setScheduleNote(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleCreateSessionRequest}
                disabled={isSavingRequest || students.length === 0}
              >
                {isSavingRequest ? 'Saving...' : 'Request Session'}
              </Button>
            </div>
            {students.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No students assigned. Ask admin to assign a student first.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
