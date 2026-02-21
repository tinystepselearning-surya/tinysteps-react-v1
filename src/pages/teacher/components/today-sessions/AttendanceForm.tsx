import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Label } from '@components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Textarea } from '@components/ui/textarea';
import { Input } from '@components/ui/input';
import { TeacherSession, AttendanceStatus } from '../../../../types/Teacher';
import { useTeacherFilteredStudents } from '@/hooks/useTeacherFilteredData';
import { collection, doc, documentId, endAt, getDoc, getDocs, onSnapshot, orderBy, query, serverTimestamp, startAt, updateDoc, where } from 'firebase/firestore';
import { db } from '../../../../lib/firebaseConfig';
import { useAuthStore } from '../../../../store/useAuthStore';
import { toast } from '@components/hooks/use-toast';

interface AttendanceFormProps {
  open: boolean;
  session: TeacherSession | null;
  onClose: () => void;
  onSubmit: (data: { attendance: Record<string, { status: AttendanceStatus; notes?: string; mastery?: number; topics?: string[]; topicUpdates?: TopicUpdateState[] }>; sessionNotes: string; meta?: { courseId?: string; courseLabel?: string } }) => Promise<void>;
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
  score: number;
  teacherRemark: string;
  topicName?: string;
};

type AttendanceEntryState = {
  status: AttendanceOutcome;
  notes?: string;
  mastery?: number;
  topicUpdatesById?: Record<string, TopicUpdateState>;
};

type SavedTopicProgress = {
  mastery?: string;
  score?: number;
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
};

const COURSE_NAME_TO_ID: Record<string, string> = {
  'phonics foundations': 'phonics-foundations',
  'phonics foundation': 'phonics-foundations',
  'early phonics': 'early-phonics',
  'advanced phonics': 'advanced-phonics',
};

const COURSE_LABEL_BY_ID: Record<string, string> = {
  'phonics-foundations': 'Phonics Foundations',
  'early-phonics': 'Early Phonics',
  'advanced-phonics': 'Advanced Phonics',
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

const parseScoreValue = (value: any): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const direct = Number(value);
    if (Number.isFinite(direct)) return direct;
    const m = value.match(/(\d+)/);
    if (m) {
      const n = Number(m[1]);
      if (Number.isFinite(n)) return n;
    }
  }
  return undefined;
};

export const AttendanceForm: React.FC<AttendanceFormProps> = ({ open, session, onClose, onSubmit }) => {
  const { user } = useAuthStore();
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
  const kidIdsKey = useMemo(() => kidIds.join('|'), [kidIds]);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    let cancelled = false;

    const resolveEnrollmentCourse = async () => {
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
  }, [session, enrollmentId]);

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
              score: 50,
              teacherRemark: '',
              topicName: topicId,
            };
            return acc;
          }, {} as Record<string, TopicUpdateState>);

        defaults[kidId] = {
          status: allPresentByDefault ? '' : existingStatus,
          notes: '',
          mastery: 50,
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

  const handleMasteryChange = (kidId: string, value: number[]) => {
    setFormState((prev) => ({
      ...prev,
      [kidId]: {
        ...prev[kidId],
        mastery: value[0],
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
          score: parseScoreValue(saved?.score) ?? 50,
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
        score: 50,
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

  const handleTopicScoreChange = (kidId: string, topic: CurriculumTopic, value: number) => {
    setFormState((prev) => {
      const current = prev[kidId] || { status: '' as AttendanceOutcome };
      const topicUpdatesById = { ...(current.topicUpdatesById || {}) };
      const existing = topicUpdatesById[topic.id] || {
        topicId: topic.id,
        mastery: 'developing' as TopicMastery,
        score: 50,
        teacherRemark: '',
        topicName: formatTopicLabel(topic),
      };
      topicUpdatesById[topic.id] = {
        ...existing,
        score: value,
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
        score: 50,
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
    setIsSubmitting(true);
    try {
      const hasReschedule = Object.values(formState).some(
        (entry) => entry?.status === 'reschedule_requested'
      );

      if (hasReschedule) {
        const sanitizedAttendance: Record<string, any> = {};
        kidIds.forEach((kidId) => {
          const entry = formState[kidId];
          if (!entry) return;
          if (entry.status === 'reschedule_requested') {
            sanitizedAttendance[kidId] = {
              status: 'reschedule_requested',
              notes: entry.notes ?? '',
            };
          } else {
            const topicUpdates = Object.values(entry.topicUpdatesById || {});
            const topicIds = topicUpdates.map((t) => t.topicId).filter(Boolean);
            const { topicUpdatesById, ...rest } = entry;
            sanitizedAttendance[kidId] = {
              ...rest,
              topics: topicIds,
              topicUpdates,
            };
          }
        });

        await updateDoc(doc(db, 'sessions', session.id), {
          attendance: sanitizedAttendance,
          notes: sessionNotes,
          updatedAt: serverTimestamp(),
          updatedBy: user?.uid ?? null,
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
          { status: AttendanceStatus; notes?: string; mastery?: number; topics?: string[]; topicUpdates?: TopicUpdateState[] }
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
  const nameCourseId = useMemo(
    () => mapCourseNameToId(session?.courseName || (session as any)?.courseLabel || null),
    [session?.courseName, (session as any)?.courseLabel]
  );
  const effectiveCourseId = directCourseId || enrollmentCourseId || nameCourseId || '';
  const effectiveCourseLabel =
    session?.courseName ||
    (session as any)?.courseLabel ||
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
              const score = parseScoreValue(data.score ?? data.scoreBand);
              map[docSnap.id] = {
                mastery: typeof data.mastery === 'string' ? data.mastery : undefined,
                score: score ?? 50,
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
              const score = parseScoreValue(data.score ?? data.scoreBand);
              map[docSnap.id] = {
                mastery: typeof data.mastery === 'string' ? data.mastery : undefined,
                score: score ?? 50,
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
  }, [open, effectiveCourseId, kidIdsKey]);

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
            topicEntry.score === 50 &&
            !topicEntry.teacherRemark;
          if (!isDefault) return;
          updated[topicId] = {
            ...topicEntry,
            mastery: normalizeMasteryValue(saved.mastery),
            score: parseScoreValue(saved.score) ?? topicEntry.score,
            teacherRemark: saved.teacherRemark ?? topicEntry.teacherRemark,
            topicName: saved.topicName || topicEntry.topicName,
          };
        });
        next[kidId] = { ...entry, topicUpdatesById: updated };
      });
      return next;
    });
  }, [session?.id, kidIdsKey, savedTopicProgressByKidId]);

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
    [kidIdsKey, formState]
  );

  const formatTopicLabel = (topic: CurriculumTopic) => {
    const base = topic.label || topic.id;
    return topic.lesson ? `${topic.lesson} — ${base}` : base;
  };

  const formatSavedSummary = (saved?: SavedTopicProgress) => {
    if (!saved) return '';
    const mastery = saved.mastery ? normalizeMasteryValue(saved.mastery).replace(/_/g, ' ') : '';
    const score = Number.isFinite(Number(saved.score)) ? `${Number(saved.score)}%` : '';
    const remark = saved.teacherRemark ? `“${saved.teacherRemark}”` : '';
    return [mastery, score, remark].filter(Boolean).join(' • ');
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mark Attendance</DialogTitle>
          <DialogDescription>Mark attendance for the selected session. Only the assigned teacher or an LP can update attendance.</DialogDescription>
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
                const isRescheduleRequested =
                  formState[kidId]?.status === 'reschedule_requested';
                
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
                  <div>
                    <Label>Mastery (0-100%)</Label>
                    <Input
                      type="range"
                      min="0"
                      max="100"
                      value={formState[kidId]?.mastery || 50}
                      onChange={(e) => handleMasteryChange(kidId, [parseInt(e.target.value)])}
                      className="mt-2"
                    />
                    <span className="text-sm">{formState[kidId]?.mastery || 50}%</span>
                  </div>
                  {!isRescheduleRequested ? (
                    <div>
                      <Label>Topics Covered</Label>
                      {!effectiveCourseId ? (
                        enrollmentCourseLoading ? (
                          <p className="text-sm text-gray-500">Resolving course…</p>
                        ) : (
                          <p className="text-sm text-gray-500">
                            This session has no course. Topics can’t be loaded. Ask Admin to re-generate sessions from schedule or fix the session courseId.
                          </p>
                        )
                      ) : curriculumLoading ? (
                        <p className="text-sm text-gray-500">Loading topics...</p>
                      ) : curriculumError ? (
                        <p className="text-sm text-red-500">Unable to load topics.</p>
                      ) : topics.length === 0 ? (
                        <p className="text-sm text-gray-500">No curriculum topics available for this course.</p>
                      ) : (
                        <div className="space-y-4 mt-2">
                          {Object.entries(
                            topics.reduce((acc, topic) => {
                              const lessonKey = topic.lesson || 'Other';
                              if (!acc[lessonKey]) acc[lessonKey] = [];
                              acc[lessonKey].push(topic);
                              return acc;
                            }, {} as Record<string, CurriculumTopic[]>)
                          )
                            .sort(([a], [b]) => {
                              const aNum = Number(String(a).replace(/[^0-9]/g, '')) || 0;
                              const bNum = Number(String(b).replace(/[^0-9]/g, '')) || 0;
                              return aNum - bNum;
                            })
                            .map(([lesson, lessonTopics]) => (
                              <div key={lesson} className="border rounded-lg p-3 bg-white/60">
                                <div className="text-xs font-semibold text-gray-700 mb-2">{lesson}</div>
                                <div className="space-y-3">
                                  {lessonTopics.map((topic) => {
                                    const topicEntry = formState[kidId]?.topicUpdatesById?.[topic.id];
                                    const isChecked = Boolean(topicEntry);
                                    const isExpanded = Boolean(expandedTopics[kidId]?.[topic.id]);
                                    return (
                                      <div key={topic.id} className="text-sm">
                                        <div className="flex items-center justify-between gap-2">
                                          <label className="flex items-center gap-2">
                                            <input
                                              type="checkbox"
                                              checked={isChecked}
                                              onChange={(e) => handleTopicToggle(kidId, topic, e.target.checked)}
                                            />
                                            <span>{formatTopicLabel(topic)}</span>
                                          </label>
                                          {!isChecked && !savedTopicProgressLoading && savedTopicProgressByKidId[kidId]?.[topic.id] && (
                                            <span className="text-xs text-gray-500">
                                              Saved: {formatSavedSummary(savedTopicProgressByKidId[kidId]?.[topic.id])}
                                            </span>
                                          )}
                                          {isChecked && (
                                            <button
                                              type="button"
                                              className="text-xs text-primary-600 hover:underline"
                                              onClick={() => toggleTopicExpanded(kidId, topic.id)}
                                            >
                                              {isExpanded ? 'Hide' : 'Details'}
                                            </button>
                                          )}
                                        </div>
                                        {isChecked && !isExpanded && savedTopicProgressByKidId[kidId]?.[topic.id] && (
                                          <div className="pl-6 text-xs text-gray-500 mt-1">
                                            Saved: {formatSavedSummary(savedTopicProgressByKidId[kidId]?.[topic.id])}
                                          </div>
                                        )}
                                        {isChecked && isExpanded && (
                                          <div className="mt-2 space-y-2 pl-6">
                                            <div className="flex flex-wrap items-center gap-3">
                                              <div className="min-w-[160px]">
                                                <Label className="text-xs">Mastery</Label>
                                                <Select
                                                  value={topicEntry?.mastery || 'developing'}
                                                  onValueChange={(value) =>
                                                    handleTopicMasteryChange(
                                                      kidId,
                                                      topic,
                                                      value as TopicMastery
                                                    )
                                                  }
                                                >
                                                  <SelectTrigger className="h-8 text-xs">
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
                                              <div className="min-w-[200px]">
                                                <Label className="text-xs">Score</Label>
                                                <Input
                                                  type="range"
                                                  min="0"
                                                  max="100"
                                                  value={topicEntry?.score ?? 50}
                                                  onChange={(e) =>
                                                    handleTopicScoreChange(
                                                      kidId,
                                                      topic,
                                                      parseInt(e.target.value, 10)
                                                    )
                                                  }
                                                  className="mt-1"
                                                />
                                                <span className="text-xs text-gray-600">
                                                  {topicEntry?.score ?? 50}%
                                                </span>
                                              </div>
                                            </div>
                                            <div>
                                              <Label className="text-xs">Remark</Label>
                                              <Input
                                                value={topicEntry?.teacherRemark ?? ''}
                                                onChange={(e) =>
                                                  handleTopicRemarkChange(kidId, topic, e.target.value)
                                                }
                                                placeholder="Quick remark"
                                                className="h-8 text-xs"
                                              />
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      Topics covered disabled for reschedule requests.
                    </div>
                  )}
                  <Textarea
                    placeholder="Notes (optional)"
                    value={formState[kidId]?.notes || ''}
                    onChange={(event) => handleNotesChange(kidId, event.target.value)}
                  />
                </div>
                );
              })
            )}
            <div>
              <Label>Session Notes</Label>
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
