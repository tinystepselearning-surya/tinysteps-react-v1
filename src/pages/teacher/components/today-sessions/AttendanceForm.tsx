import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Label } from '@components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Textarea } from '@components/ui/textarea';
import { Input } from '@components/ui/input';
import { TeacherSession, AttendanceStatus } from '../../../../types/Teacher';
import { useTeacherFilteredStudents } from '@/hooks/useTeacherFilteredData';
import { collection, doc, documentId, endAt, getDoc, getDocs, onSnapshot, orderBy, query, startAt, where } from 'firebase/firestore';
import { db } from '../../../../lib/firebaseConfig';
import { toast } from '@components/hooks/use-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../../store/useAuthStore';

interface AttendanceFormProps {
  open: boolean;
  session: TeacherSession | null;
  onClose: () => void;
  onSubmit: (data: {
    attendance: Record<
      string,
      {
        status: AttendanceStatus;
        notes?: string;
        mastery?: TopicMastery;
        topics?: string[];
        topicUpdates?: TopicUpdateState[];
      }
    >;
    sessionNotes: string;
    meta?: { courseId?: string; courseLabel?: string; attendanceOnly?: boolean };
  }) => Promise<void>;
  attendanceOnly?: boolean;
}

type AttendanceOutcome = AttendanceStatus | 'reschedule_requested' | '';

const STATUS_OPTIONS: AttendanceOutcome[] = ['present', 'absent', 'late', 'reschedule_requested'];

type TopicMastery = 'not_started' | 'emerging' | 'developing' | 'proficient' | 'mastered';

type CurriculumTopic = {
  id: string;
  courseId?: string;
  lesson?: string;
  label?: string;
};

type TopicUpdateState = {
  topicId: string;
  mastery: TopicMastery;
  teacherRemark: string;
  topicName?: string;
};

type AttendanceEntryState = {
  status: AttendanceOutcome;
  notes?: string;
  mastery?: TopicMastery;
  topicUpdatesById?: Record<string, TopicUpdateState>;
};

type SavedTopicProgress = {
  mastery?: string;
  teacherRemark?: string;
  updatedAt?: any;
  topicName?: string;
};

const TOPIC_MASTERY_OPTIONS: TopicMastery[] = [
  'not_started',
  'emerging',
  'developing',
  'proficient',
  'mastered',
];

const COURSE_ID_ALIASES: Record<string, string> = {
  'phonics-foundation': 'phonics-foundations',
  'phonics-advanced': 'advanced-phonics',
  'phonics-early': 'early-phonics',
  'grammar-essentials': 'basic-grammar',
  'grammar-mastery': 'advanced-grammar',
  'intermediate-grammar': 'basic-grammar',
  'public-speaking-foundations': 'basic-public-speaking',
  'public-speaking-excellence': 'advanced-public-speaking',
  'intermediate-public-speaking': 'basic-public-speaking',
};

const COURSE_NAME_TO_ID: Record<string, string> = {
  'phonics foundations': 'phonics-foundations',
  'phonics foundation': 'phonics-foundations',
  'early phonics': 'early-phonics',
  'advanced phonics': 'advanced-phonics',
  'basic grammar': 'basic-grammar',
  'intermediate grammar': 'basic-grammar',
  'advanced grammar': 'advanced-grammar',
  'public speaking (basic)': 'basic-public-speaking',
  'public speaking (intermediate)': 'basic-public-speaking',
  'public speaking (advanced)': 'advanced-public-speaking',
  'public speaking foundations': 'basic-public-speaking',
  'public speaking excellence': 'advanced-public-speaking',
};

const COURSE_LABEL_BY_ID: Record<string, string> = {
  'phonics-foundations': 'Phonics Foundations',
  'early-phonics': 'Early Phonics',
  'advanced-phonics': 'Advanced Phonics',
  'basic-grammar': 'Basic Grammar',
  'advanced-grammar': 'Advanced Grammar',
  'basic-public-speaking': 'Public Speaking (Basic)',
  'advanced-public-speaking': 'Public Speaking (Advanced)',
};


const normalizeCourseId = (value?: string | null): string | null => {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const key = trimmed.toLowerCase();
  return COURSE_ID_ALIASES[key] || trimmed;
};

const mapCourseNameToId = (value?: string | null): string | null => {
  if (!value) return null;
  const key = String(value).trim().toLowerCase();
  return COURSE_NAME_TO_ID[key] || null;
};

const normalizeMasteryValue = (value?: string | null): TopicMastery => {
  const raw = String(value ?? '').trim().toLowerCase().replace(/\s+/g, '_');
  if (TOPIC_MASTERY_OPTIONS.includes(raw as TopicMastery)) return raw as TopicMastery;
  return 'developing';
};

export const AttendanceForm: React.FC<AttendanceFormProps> = ({
  open,
  session,
  onClose,
  onSubmit,
  attendanceOnly = false,
}) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState<Record<string, AttendanceEntryState>>({});
  const [sessionNotes, setSessionNotes] = useState('');
  const [kidNameById, setKidNameById] = useState<Record<string, string>>({});
  const [curriculumTopics, setCurriculumTopics] = useState<CurriculumTopic[]>([]);
  const [curriculumLoading, setCurriculumLoading] = useState(true);
  const [curriculumError, setCurriculumError] = useState<string | null>(null);
  const [enrollmentCourseId, setEnrollmentCourseId] = useState<string | null>(null);
  const [enrollmentCourseLoading, setEnrollmentCourseLoading] = useState(false);
  const [expandedTopics, setExpandedTopics] = useState<Record<string, Record<string, boolean>>>({});
  const [savedTopicProgressByKidId, setSavedTopicProgressByKidId] = useState<Record<string, Record<string, SavedTopicProgress>>>({});
  const [savedTopicProgressLoading, setSavedTopicProgressLoading] = useState(false);
  const canOverrideAttendanceTime = String((user as any)?.role || '').trim().toLowerCase() === 'admin';

  const { students } = useTeacherFilteredStudents();

  // Build name lookup map from hook (priority source)
  const kidNameFromHookById = useMemo(() => {
    const map = new Map<string, string>();
    students.forEach((student) => {
      // Robust name resolution: try multiple fields
      const name = student.fullName || 
                   (student as any).studentName || 
                   (student as any).name || 
                   (student as any).displayName || 
                   (student as any).email || 
                   '';
      if (name && student.uid) {
        map.set(student.uid, name);
      }
      // Also map by alternative ID fields if present
      if (name && (student as any).id) map.set((student as any).id, name);
      if (name && (student as any).userId) map.set((student as any).userId, name);
    });
    return map;
  }, [students]);

  // Extract kidIds from session
  const kidIds = useMemo(
    () => (session?.kidIds?.length ? session.kidIds : []),
    [session]
  );

  const enrollmentId = useMemo(
    () => (session as any)?.enrollmentId as string | undefined,
    [session]
  );

  useEffect(() => {
    if (attendanceOnly) {
      setCurriculumTopics([]);
      setCurriculumLoading(false);
      setCurriculumError(null);
      return;
    }
    const ref = doc(db, 'config', 'curriculumTopics');
    setCurriculumLoading(true);
    setCurriculumError(null);

    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setCurriculumTopics([]);
          setCurriculumLoading(false);
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
        setCurriculumLoading(false);
      },
      (err) => {
        console.error('curriculumTopics onSnapshot error', err);
        setCurriculumError(err?.message || String(err));
        setCurriculumTopics([]);
        setCurriculumLoading(false);
      },
    );

    return () => unsub();
  }, [attendanceOnly]);

  useEffect(() => {
    let cancelled = false;

    const resolveEnrollmentCourse = async () => {
      if (attendanceOnly) {
        setEnrollmentCourseId(null);
        setEnrollmentCourseLoading(false);
        return;
      }
      if (!session) {
        setEnrollmentCourseId(null);
        setEnrollmentCourseLoading(false);
        return;
      }

      const direct = normalizeCourseId(session?.courseId);
      if (direct) {
        setEnrollmentCourseId(null);
        setEnrollmentCourseLoading(false);
        return;
      }

      if (!enrollmentId) {
        setEnrollmentCourseId(null);
        setEnrollmentCourseLoading(false);
        return;
      }

      setEnrollmentCourseLoading(true);
      try {
        const snap = await getDoc(doc(db, 'enrollments', enrollmentId));
        const next = snap.exists()
          ? normalizeCourseId((snap.data() as any)?.courseId)
          : null;
        if (!cancelled) {
          setEnrollmentCourseId(next);
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('[AttendanceForm] enrollment course fetch failed', err);
        }
        if (!cancelled) {
          setEnrollmentCourseId(null);
        }
      } finally {
        if (!cancelled) setEnrollmentCourseLoading(false);
      }
    };

    resolveEnrollmentCourse();

    return () => {
      cancelled = true;
    };
  }, [session, enrollmentId, attendanceOnly]);

  // Fallback fetch: read missing kid names from Firestore
  useEffect(() => {
    if (!session || kidIds.length === 0) return;

    let cancelled = false;

    const fetchMissingNames = async () => {
      const missingKidIds = kidIds.filter(id => !kidNameFromHookById.has(id) && !kidNameById[id]);
      
      if (missingKidIds.length === 0) return;

      const fetchedNames: Record<string, string> = {};
      
      await Promise.all(
        missingKidIds.map(async (kidId) => {
          try {
            const kidDocRef = doc(db, 'kids', kidId);
            const kidDocSnap = await getDoc(kidDocRef);
            
            if (kidDocSnap.exists() && !cancelled) {
              const data = kidDocSnap.data();
              const name = data.fullName || 
                          data.studentName || 
                          data.name || 
                          data.displayName || 
                          'Student';
              fetchedNames[kidId] = name;
            }
          } catch (err) {
            console.warn(`Failed to fetch name for kid ${kidId}:`, err);
          }
        })
      );

      if (!cancelled && Object.keys(fetchedNames).length > 0) {
        setKidNameById(prev => ({ ...prev, ...fetchedNames }));
      }
    };

    fetchMissingNames();

    return () => {
      cancelled = true;
    };
  }, [session, kidIds, kidNameFromHookById, kidNameById]);

  const normalizeStatus = (value: any): AttendanceOutcome => {
    if (!value) return '';
    if (typeof value === 'string') {
      return STATUS_OPTIONS.includes(value as AttendanceOutcome) ? (value as AttendanceOutcome) : '';
    }
    if (typeof value === 'object' && typeof value.status === 'string') {
      return STATUS_OPTIONS.includes(value.status as AttendanceOutcome)
        ? (value.status as AttendanceOutcome)
        : '';
    }
    return '';
  };

  const toDateMaybe = (value: any): Date | null => {
    if (!value) return null;
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
    if (typeof value?.toDate === 'function') {
      const date = value.toDate();
      if (date instanceof Date && !Number.isNaN(date.getTime())) return date;
    }
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) return date;
    }
    return null;
  };

  const normalizeStartTime = (value: unknown): string | null => {
    const raw = typeof value === 'string' ? value.trim() : '';
    if (!raw) return null;
    const match = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/.exec(raw);
    if (!match) return null;
    const seconds = match[3] || '00';
    return `${match[1]}:${match[2]}:${seconds}`;
  };

  const getSessionStartMillis = (): number | null => {
    const fromStartAt = toDateMaybe((session as any)?.startAt);
    if (fromStartAt) return fromStartAt.getTime();
    const dateYmd = typeof session?.date === 'string' ? session.date.trim() : '';
    const startTime = normalizeStartTime(session?.startTime);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateYmd) || !startTime) return null;
    const parsed = Date.parse(`${dateYmd}T${startTime}+05:30`);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const getAttendanceAllowedAtMillis = (): number | null => {
    const startMs = getSessionStartMillis();
    if (startMs === null) return null;
    return startMs + 30 * 60 * 1000;
  };

  const getAttendanceWindowCloseMillis = (): number | null => {
    const startMs = getSessionStartMillis();
    if (startMs === null) return null;
    return startMs + 24 * 60 * 60 * 1000;
  };

  useEffect(() => {
    if (session) {
      const defaults: Record<string, AttendanceEntryState> = {};
      const attendance = (session.attendance as any) || {};
      const allPresentByDefault =
        kidIds.length > 0 &&
        kidIds.every((kidId) => normalizeStatus(attendance?.[kidId]) === 'present') &&
        session.status !== 'completed' &&
        session.status !== 'in_progress';
      kidIds.forEach((kidId) => {
        const existingEntry = (session.attendance as any)?.[kidId];
        const existingStatus = normalizeStatus(existingEntry);
        const existingTopics = Array.isArray(existingEntry?.topics)
          ? (existingEntry.topics as string[]).filter(Boolean)
          : [];
          const topicUpdatesById = existingTopics.reduce((acc, topicId) => {
            acc[topicId] = {
              topicId,
              mastery: 'developing',
              teacherRemark: '',
              topicName: topicId,
            };
            return acc;
          }, {} as Record<string, TopicUpdateState>);

        defaults[kidId] = {
          status: allPresentByDefault ? '' : existingStatus,
          notes: '',
          mastery: 'developing',
          topicUpdatesById,
        };
      });
      setFormState(defaults);
      setSessionNotes(session.notes || '');
    }
  }, [session, kidIds]);

  const handleChange = (kidId: string, status: AttendanceOutcome) => {
    setFormState((prev) => ({
      ...prev,
      [kidId]: {
        ...prev[kidId],
        status,
      },
    }));
  };

  const handleNotesChange = (kidId: string, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [kidId]: {
        ...prev[kidId],
        notes: value,
      },
    }));
  };

  const handleMasteryChange = (kidId: string, value: TopicMastery) => {
    setFormState((prev) => ({
      ...prev,
      [kidId]: {
        ...prev[kidId],
        mastery: value,
      },
    }));
  };

  const handleTopicToggle = (kidId: string, topic: CurriculumTopic, checked: boolean) => {
    setFormState((prev) => {
      const current = prev[kidId] || { status: '' as AttendanceOutcome };
      const topicUpdatesById = { ...(current.topicUpdatesById || {}) };
      if (checked) {
        const saved = savedTopicProgressByKidId[kidId]?.[topic.id];
        topicUpdatesById[topic.id] = topicUpdatesById[topic.id] || {
          topicId: topic.id,
          mastery: normalizeMasteryValue(saved?.mastery),
          teacherRemark: saved?.teacherRemark ?? '',
          topicName: saved?.topicName || formatTopicLabel(topic),
        };
      } else {
        delete topicUpdatesById[topic.id];
      }
      return {
        ...prev,
        [kidId]: {
          ...current,
          topicUpdatesById,
        },
      };
    });

    setExpandedTopics((prev) => {
      const next = { ...prev };
      if (checked) {
        const kidTopics = { ...(next[kidId] || {}) };
        kidTopics[topic.id] = true;
        next[kidId] = kidTopics;
      } else if (next[kidId]) {
        const kidTopics = { ...next[kidId] };
        delete kidTopics[topic.id];
        if (Object.keys(kidTopics).length === 0) {
          delete next[kidId];
        } else {
          next[kidId] = kidTopics;
        }
      }
      return next;
    });
  };

  const toggleTopicExpanded = (kidId: string, topicId: string) => {
    setExpandedTopics((prev) => {
      const next = { ...prev };
      const kidTopics = { ...(next[kidId] || {}) };
      kidTopics[topicId] = !kidTopics[topicId];
      next[kidId] = kidTopics;
      return next;
    });
  };

  const handleTopicMasteryChange = (kidId: string, topic: CurriculumTopic, value: TopicMastery) => {
    setFormState((prev) => {
      const current = prev[kidId] || { status: '' as AttendanceOutcome };
      const topicUpdatesById = { ...(current.topicUpdatesById || {}) };
      const existing = topicUpdatesById[topic.id] || {
        topicId: topic.id,
        mastery: 'developing' as TopicMastery,
        teacherRemark: '',
        topicName: formatTopicLabel(topic),
      };
      topicUpdatesById[topic.id] = {
        ...existing,
        mastery: value,
      };
      return {
        ...prev,
        [kidId]: {
          ...current,
          topicUpdatesById,
        },
      };
    });
  };

  const handleTopicRemarkChange = (kidId: string, topic: CurriculumTopic, value: string) => {
    setFormState((prev) => {
      const current = prev[kidId] || { status: '' as AttendanceOutcome };
      const topicUpdatesById = { ...(current.topicUpdatesById || {}) };
      const existing = topicUpdatesById[topic.id] || {
        topicId: topic.id,
        mastery: 'developing' as TopicMastery,
        teacherRemark: '',
        topicName: formatTopicLabel(topic),
      };
      topicUpdatesById[topic.id] = {
        ...existing,
        teacherRemark: value,
      };
      return {
        ...prev,
        [kidId]: {
          ...current,
          topicUpdatesById,
        },
      };
    });
  };

  const handleSubmit = async () => {
    if (!session) return;
    if (hasMissingStatus) {
      toast({
        title: 'Select attendance status',
        description: 'Please choose Present/Absent/Late/Reschedule for each student.',
        variant: 'destructive',
      });
      return;
    }
    if (!canOverrideAttendanceTime) {
      const allowedAt = getAttendanceAllowedAtMillis();
      const windowCloseAt = getAttendanceWindowCloseMillis();
      const nowMs = Date.now();
      if (allowedAt === null || windowCloseAt === null) {
        toast({
          title: 'Attendance unavailable',
          description: 'Attendance time could not be verified. Please contact admin.',
          variant: 'destructive',
        });
        return;
      }
      if (nowMs < allowedAt) {
        toast({
          title: 'Attendance unavailable',
          description: `Attendance opens at ${new Date(allowedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.`,
          variant: 'destructive',
        });
        return;
      }
      if (nowMs > windowCloseAt) {
        toast({
          title: 'Attendance unavailable',
          description: 'Attendance window has closed. Please contact admin to update this attendance.',
          variant: 'destructive',
        });
        return;
      }
    }
    setIsSubmitting(true);
    try {
      if (attendanceOnly) {
        const sanitizedAttendance: Record<string, any> = {};
        kidIds.forEach((kidId) => {
          const entry = formState[kidId];
          if (!entry) return;
          sanitizedAttendance[kidId] = {
            status: entry.status,
            notes: entry.notes ?? '',
          };
        });

        await onSubmit({
          attendance: sanitizedAttendance as Record<
            string,
            { status: AttendanceStatus; notes?: string }
          >,
          sessionNotes,
          meta: {
            courseId: effectiveCourseId || undefined,
            courseLabel: effectiveCourseLabel || undefined,
            attendanceOnly: true,
          },
        });
        onClose();
        return;
      }

      await onSubmit({
        attendance: Object.fromEntries(
          Object.entries(formState).map(([kidId, entry]) => {
            const topicUpdates = Object.values(entry.topicUpdatesById || {});
            const topicIds = topicUpdates.map((t) => t.topicId).filter(Boolean);
            const { topicUpdatesById, ...rest } = entry;
            return [
              kidId,
              {
                ...rest,
                topics: topicIds,
                topicUpdates,
              },
            ];
          })
        ) as Record<
          string,
          { status: AttendanceStatus; notes?: string; mastery?: TopicMastery; topics?: string[]; topicUpdates?: TopicUpdateState[] }
        >,
        sessionNotes,
        meta: {
          courseId: effectiveCourseId || undefined,
          courseLabel: effectiveCourseLabel || undefined,
        },
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const directCourseId = useMemo(
    () => normalizeCourseId(session?.courseId),
    [session?.courseId]
  );
  const sessionCourseLabel = session?.courseName || (session as any)?.courseLabel || null;
  const nameCourseId = useMemo(
    () => mapCourseNameToId(sessionCourseLabel),
    [sessionCourseLabel]
  );
  const effectiveCourseId = directCourseId || enrollmentCourseId || nameCourseId || '';
  const effectiveCourseLabel =
    sessionCourseLabel ||
    (effectiveCourseId ? COURSE_LABEL_BY_ID[effectiveCourseId] : '') ||
    effectiveCourseId ||
    '';

  const topics = useMemo(() => {
    const courseId = effectiveCourseId;
    if (!courseId) return [];
    return curriculumTopics.filter((topic) => topic.courseId === courseId);
  }, [curriculumTopics, effectiveCourseId]);

  useEffect(() => {
    let cancelled = false;

    const loadSavedProgress = async () => {
      if (attendanceOnly) {
        setSavedTopicProgressByKidId({});
        setSavedTopicProgressLoading(false);
        return;
      }
      if (!open || !effectiveCourseId || kidIds.length === 0) {
        setSavedTopicProgressByKidId({});
        setSavedTopicProgressLoading(false);
        return;
      }
      setSavedTopicProgressLoading(true);
      try {
        const entries = await Promise.all(
          kidIds.map(async (kidId) => {
            const progressCol = collection(db, 'students', kidId, 'progress');
            const map: Record<string, SavedTopicProgress> = {};

            const byCourseQuery = query(
              progressCol,
              where('courseId', '==', effectiveCourseId)
            );
            const byCourseSnap = await getDocs(byCourseQuery);
            byCourseSnap.forEach((docSnap) => {
              const data = docSnap.data() || {};
              map[docSnap.id] = {
                mastery: typeof data.mastery === 'string' ? data.mastery : undefined,
                teacherRemark: typeof data.teacherRemark === 'string' ? data.teacherRemark : '',
                updatedAt: data.updatedAt,
                topicName: data.topicName || data.topicLabel || data.name || '',
              };
            });

            const prefix = `${effectiveCourseId}__`;
            const byIdQuery = query(
              progressCol,
              orderBy(documentId()),
              startAt(prefix),
              endAt(`${prefix}\uf8ff`)
            );
            const byIdSnap = await getDocs(byIdQuery);
            byIdSnap.forEach((docSnap) => {
              if (map[docSnap.id]) return;
              const data = docSnap.data() || {};
              map[docSnap.id] = {
                mastery: typeof data.mastery === 'string' ? data.mastery : undefined,
                teacherRemark: typeof data.teacherRemark === 'string' ? data.teacherRemark : '',
                updatedAt: data.updatedAt,
                topicName: data.topicName || data.topicLabel || data.name || '',
              };
            });

            return [kidId, map] as const;
          })
        );
        if (!cancelled) {
          setSavedTopicProgressByKidId(Object.fromEntries(entries));
          if (import.meta.env.DEV) {
            const total = entries.reduce((acc, [, map]) => acc + Object.keys(map).length, 0);
            console.debug('[AttendanceForm] loaded saved progress', {
              courseId: effectiveCourseId,
              kids: entries.length,
              totalTopics: total,
            });
          }
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('[AttendanceForm] loadSavedProgress failed', err);
        }
        if (!cancelled) {
          setSavedTopicProgressByKidId({});
        }
      } finally {
        if (!cancelled) setSavedTopicProgressLoading(false);
      }
    };

    loadSavedProgress();

    return () => {
      cancelled = true;
    };
  }, [open, effectiveCourseId, kidIds, attendanceOnly]);

  useEffect(() => {
    if (!session) return;
    setFormState((prev) => {
      const next = { ...prev };
      kidIds.forEach((kidId) => {
        const entry = next[kidId];
        if (!entry?.topicUpdatesById) return;
        const savedMap = savedTopicProgressByKidId[kidId];
        if (!savedMap) return;
        const updated = { ...entry.topicUpdatesById };
        Object.entries(updated).forEach(([topicId, topicEntry]) => {
          const saved = savedMap[topicId];
          if (!saved) return;
          const isDefault =
            topicEntry.mastery === 'developing' &&
            !topicEntry.teacherRemark;
          if (!isDefault) return;
          updated[topicId] = {
            ...topicEntry,
            mastery: normalizeMasteryValue(saved.mastery),
            teacherRemark: saved.teacherRemark ?? topicEntry.teacherRemark,
            topicName: saved.topicName || topicEntry.topicName,
          };
        });
        next[kidId] = { ...entry, topicUpdatesById: updated };
      });
      return next;
    });
  }, [session, kidIds, savedTopicProgressByKidId]);

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.debug('[AttendanceForm topics]', {
        sessionId: session?.id,
        sessionCourseId: session?.courseId,
        effectiveCourseId,
        totalTopicsLoaded: curriculumTopics.length,
        topicsForCourseCount: topics.length,
      });
    }
  }, [session?.id, session?.courseId, effectiveCourseId, curriculumTopics.length, topics.length]);

  const hasMissingStatus = useMemo(
    () => kidIds.some((kidId) => !formState[kidId]?.status),
    [kidIds, formState]
  );

  const formatTopicLabel = (topic: CurriculumTopic) => {
    const base = topic.label || topic.id;
    return topic.lesson ? `${topic.lesson} — ${base}` : base;
  };

  const formatSavedSummary = (saved?: SavedTopicProgress) => {
    if (!saved) return '';
    const mastery = saved.mastery ? normalizeMasteryValue(saved.mastery).replace(/_/g, ' ') : '';
    const remark = saved.teacherRemark ? `“${saved.teacherRemark}”` : '';
    return [mastery, remark].filter(Boolean).join(' • ');
  };

  const buildTopicProgressUrl = (kidId: string) => {
    const params = new URLSearchParams();
    const tabParam = new URLSearchParams(location.search).get('tab');
    const fromParam =
      tabParam === 'today'
        ? 'today'
        : tabParam === 'schedule'
          ? 'schedule'
          : 'sessions';
    const returnTo = `${location.pathname}${location.search}`;

    params.set('from', fromParam);
    params.set('tab', 'topic');
    params.set('returnTo', returnTo);
    if (effectiveCourseId) params.set('courseId', effectiveCourseId);
    if (enrollmentId) params.set('enrollmentId', enrollmentId);

    return `/teacher/students/${kidId}/topic-progress?${params.toString()}`;
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mark Attendance</DialogTitle>
          <DialogDescription>
            {attendanceOnly
              ? 'Mark attendance and optional class notes only. Update topics/progress from My Students.'
              : 'Mark attendance for the selected session. Only the assigned teacher or admin can update attendance.'}
          </DialogDescription>
        </DialogHeader>
        {!session ? (
          <p className="text-sm text-muted-foreground">Select a session to mark attendance.</p>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">
                {session.courseName || session.courseId || 'Course'}
              </p>
              <p className="text-xs text-muted-foreground">
                {session.startTime} - {session.endTime}
              </p>
            </div>
            {kidIds.length === 0 ? (
              <p className="text-sm text-muted-foreground">No students assigned to this session.</p>
            ) : (
              kidIds.map((kidId) => {
                // Resolve kid name: try hook first, then fallback fetch, then truncated ID
                const displayName = kidNameFromHookById.get(kidId) || 
                                   kidNameById[kidId] || 
                                   `Student (${kidId.slice(0, 6)}…)`;
                const selectedStatus = formState[kidId]?.status;
                const isRescheduleRequested =
                  selectedStatus === 'reschedule_requested';
                const isAbsent = selectedStatus === 'absent';
                
                return (
                  <div key={kidId} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                        <Label className="font-medium">
                          {displayName}
                        </Label>
                      </div>
                    <Select
                      value={formState[kidId]?.status ?? ''}
                      onValueChange={(v) => handleChange(kidId, v as AttendanceOutcome)}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {!attendanceOnly && (
                    <>
                      <div>
                        <Label>Mastery</Label>
                        <Select
                          value={formState[kidId]?.mastery || 'developing'}
                          onValueChange={(value) =>
                            handleMasteryChange(kidId, value as TopicMastery)
                          }
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TOPIC_MASTERY_OPTIONS.map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {opt.replace(/_/g, ' ')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {!isRescheduleRequested ? (
                        <div className="space-y-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(buildTopicProgressUrl(kidId))}
                          >
                            Open Topics & Lesson Feedback
                          </Button>
                          <p className="text-xs text-muted-foreground">
                            Update lesson-wise topic progress from the full topic feedback page.
                          </p>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">
                          Topics covered disabled for reschedule requests.
                        </div>
                      )}
                    </>
                  )}
                  <div className="space-y-1">
                    <Label>{isAbsent || isRescheduleRequested ? 'Reason (optional)' : 'Class note (optional)'}</Label>
                    <Textarea
                      placeholder={isAbsent || isRescheduleRequested ? 'Add reason (optional)' : 'Add class note (optional)'}
                      value={formState[kidId]?.notes || ''}
                      onChange={(event) => handleNotesChange(kidId, event.target.value)}
                    />
                  </div>
                </div>
                );
              })
            )}
            <div>
              <Label>Class feedback (optional)</Label>
              <Textarea
                placeholder="How was the session? Any issues?"
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-between">
              <div className="flex gap-2">
                <Button variant="outline">Clear All</Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting || kidIds.length === 0 || hasMissingStatus}>
                  {isSubmitting ? 'Saving...' : 'Save & Close'}
                </Button>
              </div>
              {hasMissingStatus && (
                <p className="text-xs text-amber-600 mt-2">
                  Select attendance status for all students to save.
                </p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
