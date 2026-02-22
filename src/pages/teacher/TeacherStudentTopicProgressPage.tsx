// src/pages/teacher/TeacherStudentTopicProgressPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, query, Timestamp, where } from 'firebase/firestore';
import { toast } from '@components/hooks/use-toast';
import { auth, db } from '../../lib/firebaseConfig';
import StudentTopicProgressEditor from '../../components/teacher/StudentTopicProgressEditor';
import { WeeklyProgressCard } from '../../components/insights/WeeklyProgressCard';
import {
  buildWeekKeyForIST,
  fetchTeacherWeeklyReport,
  saveWeeklyReport,
  type WeeklyReport,
} from '../../lib/insights/weeklyReports';

type EnrollmentOption = {
  id: string;
  courseId: string;
  label: string;
};

type WeekOption = {
  weekKey: string;
  weekStartAt: number;
  weekEndAt: number;
  label: string;
};

type WeeklyFormState = {
  sessionsPlanned: string;
  sessionsAttended: string;
  scores: {
    overall: string;
    consistency: string;
    understanding: string;
    confidence: string;
  };
  covered: string;
  wins: string;
  focusAreas: string;
  nextWeekPlan: string;
  homePractice: {
    quickRevision: string;
    focusedSkill: string;
    confidenceBooster: string;
  };
  teacherNote: string;
};

const emptyForm: WeeklyFormState = {
  sessionsPlanned: '',
  sessionsAttended: '',
  scores: {
    overall: '',
    consistency: '',
    understanding: '',
    confidence: '',
  },
  covered: '',
  wins: '',
  focusAreas: '',
  nextWeekPlan: '',
  homePractice: {
    quickRevision: '',
    focusedSkill: '',
    confidenceBooster: '',
  },
  teacherNote: '',
};

function toInt(value: string): number | null {
  if (value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.round(n);
}

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function splitLines(text: string): string[] {
  return text
    .split('\n')
    .map((t) => t.trim())
    .filter(Boolean);
}

function toMillis(value: any): number {
  if (!value) return 0;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.seconds === 'number') return value.seconds * 1000;
  if (value instanceof Date) return value.getTime();
  return 0;
}

function masteryRank(value: any): number {
  const v = String(value || '').toLowerCase();
  if (v === 'mastered') return 4;
  if (v === 'proficient') return 3;
  if (v === 'developing') return 2;
  if (v === 'emerging') return 1;
  if (v === 'not_started' || v === 'not started') return 0;
  return 0;
}

function scoreBandMidpoint(value: any): number | null {
  if (value == null) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return clampScore(value);
  const raw = String(value).trim();
  const num = Number(raw);
  if (Number.isFinite(num)) return clampScore(num);
  const match = raw.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (match) {
    const a = Number(match[1]);
    const b = Number(match[2]);
    if (Number.isFinite(a) && Number.isFinite(b)) {
      return clampScore(Math.round((a + b) / 2));
    }
  }
  return null;
}

const TeacherStudentTopicProgressPage: React.FC = () => {
  const { kidId } = useParams<{ kidId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [kidName, setKidName] = useState<string | null>(null);
  const [loadingName, setLoadingName] = useState(false);
  const [courseOptions, setCourseOptions] = useState<EnrollmentOption[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedWeekKey, setSelectedWeekKey] = useState<string>('');
  const [form, setForm] = useState<WeeklyFormState>(emptyForm);
  const [overallManual, setOverallManual] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [savingStatus, setSavingStatus] = useState<'draft' | 'published' | null>(null);
  const [loadedStatus, setLoadedStatus] = useState<'draft' | 'published' | null>(null);
  const [showWeeklyMore, setShowWeeklyMore] = useState(false);
  const [copyingWeekly, setCopyingWeekly] = useState(false);
  const [generatingWeekly, setGeneratingWeekly] = useState(false);
  const [sessionsTouched, setSessionsTouched] = useState(false);
  const [sessionsAutoFilledFor, setSessionsAutoFilledFor] = useState<string | null>(null);

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const returnTo = searchParams.get('returnTo');
  const fromStudents = searchParams.get('from') === 'students';
  const activeTab = searchParams.get('tab') === 'weekly' ? 'weekly' : 'topic';

  const setTab = (tab: 'topic' | 'weekly') => {
    const next = new URLSearchParams(location.search);
    next.set('tab', tab);
    navigate(`${location.pathname}?${next.toString()}`, { replace: true });
  };

  const handleBack = () => {
    if (returnTo) {
      navigate(returnTo);
      return;
    }
    if (fromStudents) {
      navigate('/teacher?tab=students');
      return;
    }
    navigate(-1);
  };

  const weekOptions = useMemo<WeekOption[]>(() => {
    const options: WeekOption[] = [];
    for (let i = 0; i < 7; i += 1) {
      const date = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000);
      const info = buildWeekKeyForIST(date);
      options.push({
        ...info,
        label: i === 0 ? `${info.weekKey} (This week)` : info.weekKey,
      });
    }
    return options;
  }, []);

  useEffect(() => {
    if (!selectedWeekKey && weekOptions.length > 0) {
      setSelectedWeekKey(weekOptions[0].weekKey);
    }
  }, [selectedWeekKey, weekOptions]);

  useEffect(() => {
    setSessionsTouched(false);
    setSessionsAutoFilledFor(null);
  }, [selectedWeekKey, selectedCourseId, kidId]);

  useEffect(() => {
    if (!kidId) return;

    setLoadingName(true);
    const ref = doc(db, 'students', kidId);

    getDoc(ref)
      .then((snap) => {
        if (snap.exists()) {
          const data = snap.data() as any;
          setKidName(
            data.fullName ??
              data.displayName ??
              data.name ??
              null,
          );
        } else {
          setKidName(null);
        }
      })
      .finally(() => setLoadingName(false));
  }, [kidId]);

  useEffect(() => {
    if (!kidId) return;
    let active = true;

    const loadEnrollments = async () => {
      const enrollmentsCol = collection(db, 'enrollments');
      const results = new Map<string, any>();
      const queries = [
        query(enrollmentsCol, where('studentId', '==', kidId)),
        query(enrollmentsCol, where('kidId', '==', kidId)),
        query(enrollmentsCol, where('kidIds', 'array-contains', kidId)),
      ];

      for (const q of queries) {
        const snap = await getDocs(q);
        snap.docs.forEach((d) => results.set(d.id, { id: d.id, ...(d.data() as any) }));
      }

      const options = Array.from(results.values())
        .map((enr) => {
          const courseId = String(enr.courseId || '').trim();
          const label = String(enr.courseLabel || enr.courseName || courseId || 'Course').trim();
          return { id: enr.id, courseId, label };
        })
        .filter((opt) => opt.courseId);

      if (!active) return;
      setCourseOptions(options);
      if (!selectedCourseId || !options.find((o) => o.courseId === selectedCourseId)) {
        setSelectedCourseId(options[0]?.courseId ?? '');
      }
    };

    loadEnrollments().catch(() => {
      if (!active) return;
      setCourseOptions([]);
    });

    return () => {
      active = false;
    };
  }, [kidId, selectedCourseId]);

  useEffect(() => {
    if (!kidId || !selectedCourseId || !selectedWeekKey) return;
    let active = true;
    setLoadingReport(true);
    setLoadedStatus(null);

    fetchTeacherWeeklyReport(kidId, selectedCourseId, selectedWeekKey)
      .then((report) => {
        if (!active) return;
        if (!report) {
          setForm(emptyForm);
          setOverallManual(false);
          return;
        }

        setForm({
          sessionsPlanned: String(report.sessionsPlanned ?? ''),
          sessionsAttended: String(report.sessionsAttended ?? ''),
          scores: {
            overall: String(report.scores?.overall ?? ''),
            consistency: String(report.scores?.consistency ?? ''),
            understanding: String(report.scores?.understanding ?? ''),
            confidence: String(report.scores?.confidence ?? ''),
          },
          covered: (report.covered || []).join('\n'),
          wins: (report.wins || []).join('\n'),
          focusAreas: (report.focusAreas || []).join('\n'),
          nextWeekPlan: (report.nextWeekPlan || []).join('\n'),
          homePractice: {
            quickRevision: report.homePractice?.quickRevision ?? '',
            focusedSkill: report.homePractice?.focusedSkill ?? '',
            confidenceBooster: report.homePractice?.confidenceBooster ?? '',
          },
          teacherNote: report.teacherNote ?? '',
        });

        const avg =
          report.scores?.consistency != null &&
          report.scores?.understanding != null &&
          report.scores?.confidence != null
            ? Math.round(
                (report.scores.consistency + report.scores.understanding + report.scores.confidence) / 3,
              )
            : null;
        setOverallManual(avg == null || report.scores?.overall !== avg);
        setLoadedStatus(report.status ?? null);
      })
      .finally(() => {
        if (active) setLoadingReport(false);
      });

    return () => {
      active = false;
    };
  }, [kidId, selectedCourseId, selectedWeekKey]);

  useEffect(() => {
    if (overallManual) return;
    const c = toInt(form.scores.consistency);
    const u = toInt(form.scores.understanding);
    const f = toInt(form.scores.confidence);
    if (c == null || u == null || f == null) return;
    const avg = Math.round((clampScore(c) + clampScore(u) + clampScore(f)) / 3);
    setForm((prev) => {
      if (prev.scores.overall === String(avg)) return prev;
      return { ...prev, scores: { ...prev.scores, overall: String(avg) } };
    });
  }, [form.scores.consistency, form.scores.understanding, form.scores.confidence, overallManual]);

  const selectedWeek = useMemo(() => {
    return weekOptions.find((opt) => opt.weekKey === selectedWeekKey) ?? weekOptions[0];
  }, [weekOptions, selectedWeekKey]);

  const scoresNum = {
    overall: clampScore(toInt(form.scores.overall) ?? 0),
    consistency: clampScore(toInt(form.scores.consistency) ?? 0),
    understanding: clampScore(toInt(form.scores.understanding) ?? 0),
    confidence: clampScore(toInt(form.scores.confidence) ?? 0),
  };

  const previewReport: WeeklyReport | null =
    kidId && selectedCourseId && selectedWeek
      ? {
          studentId: kidId,
          courseId: selectedCourseId,
          weekKey: selectedWeek.weekKey,
          weekStartAt: selectedWeek.weekStartAt,
          weekEndAt: selectedWeek.weekEndAt,
          sessionsPlanned: toInt(form.sessionsPlanned) ?? 0,
          sessionsAttended: toInt(form.sessionsAttended) ?? 0,
          scores: scoresNum,
          covered: splitLines(form.covered),
          wins: splitLines(form.wins),
          focusAreas: splitLines(form.focusAreas),
          nextWeekPlan: splitLines(form.nextWeekPlan),
          homePractice: {
            quickRevision: form.homePractice.quickRevision || '2 minutes: quick revision',
            focusedSkill: form.homePractice.focusedSkill || '2 minutes: one focused skill',
            confidenceBooster: form.homePractice.confidenceBooster || '1 minute: confidence booster',
          },
          teacherNote: form.teacherNote || undefined,
          status: 'draft',
          updatedBy: auth.currentUser?.uid ?? 'unknown',
          updatedAt: Date.now(),
        }
      : null;

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid || !kidId || !selectedCourseId || !selectedWeek) return;
    if (sessionsTouched) return;
    if (sessionsAutoFilledFor === selectedWeek.weekKey) return;
    if (form.sessionsPlanned || form.sessionsAttended) return;

    const loadSessions = async () => {
      const start = Timestamp.fromMillis(selectedWeek.weekStartAt);
      const end = Timestamp.fromMillis(selectedWeek.weekEndAt);
      const base = collection(db, 'classSessions');
      try {
        const q = query(
          base,
          where('teacherId', '==', uid),
          where('startAt', '>=', start),
          where('startAt', '<=', end),
        );
        const snap = await getDocs(q);
        return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      } catch (err: any) {
        const message = String(err?.message || '');
        if (
          err?.code === 'failed-precondition' ||
          /requires an index|index is currently building/i.test(message)
        ) {
          const snap = await getDocs(query(base, where('teacherId', '==', uid)));
          return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        }
        throw err;
      }
    };

    loadSessions()
      .then((sessions) => {
        const filtered = sessions.filter((session) => {
          const matchesKid =
            session.kidId === kidId ||
            (Array.isArray(session.kidIds) && session.kidIds.includes(kidId));
          const matchesCourse = session.courseId ? session.courseId === selectedCourseId : true;
          const startAt = session.startAt?.toMillis
            ? session.startAt.toMillis()
            : typeof session.startAt === 'number'
              ? session.startAt
              : session.startAt?.seconds
                ? session.startAt.seconds * 1000
                : 0;
          return (
            matchesKid &&
            matchesCourse &&
            startAt >= selectedWeek.weekStartAt &&
            startAt <= selectedWeek.weekEndAt
          );
        });

        if (filtered.length === 0) {
          setSessionsAutoFilledFor(selectedWeek.weekKey);
          return;
        }

        const planned = filtered.filter((s) => {
          const status = String(s.status || '').toLowerCase();
          return !['cancelled', 'canceled', 'no_show'].includes(status);
        }).length;
        const attended = filtered.filter((s) => {
          const status = String(s.status || '').toLowerCase();
          return status === 'completed' || status === 'present';
        }).length;

        setForm((prev) => ({
          ...prev,
          sessionsPlanned: prev.sessionsPlanned || String(planned),
          sessionsAttended: prev.sessionsAttended || String(attended),
        }));
        setSessionsAutoFilledFor(selectedWeek.weekKey);
      })
      .catch(() => {
        setSessionsAutoFilledFor(selectedWeek.weekKey);
      });
  }, [
    auth.currentUser?.uid,
    kidId,
    selectedCourseId,
    selectedWeek,
    form.sessionsPlanned,
    form.sessionsAttended,
    sessionsTouched,
    sessionsAutoFilledFor,
  ]);

  const handleCopyLastWeek = async () => {
    if (!kidId || !selectedCourseId) return;
    const currentIndex = weekOptions.findIndex((opt) => opt.weekKey === selectedWeekKey);
    const prevWeek = currentIndex >= 0 ? weekOptions[currentIndex + 1] : null;
    if (!prevWeek) {
      toast({ title: 'No previous week', description: 'There is no earlier week to copy from.' });
      return;
    }

    setCopyingWeekly(true);
    try {
      const report = await fetchTeacherWeeklyReport(kidId, selectedCourseId, prevWeek.weekKey);
      if (!report) {
        toast({ title: 'No report found', description: 'No report found for the previous week.' });
        return;
      }

      setForm((prev) => ({
        ...prev,
        sessionsPlanned: String(report.sessionsPlanned ?? ''),
        scores: {
          overall: String(report.scores?.overall ?? ''),
          consistency: String(report.scores?.consistency ?? ''),
          understanding: String(report.scores?.understanding ?? ''),
          confidence: String(report.scores?.confidence ?? ''),
        },
        covered: (report.covered || []).join('\n'),
        wins: (report.wins || []).join('\n'),
        focusAreas: (report.focusAreas || []).join(', '),
        nextWeekPlan: (report.nextWeekPlan || []).join(', '),
        homePractice: {
          quickRevision: report.homePractice?.quickRevision ?? '',
          focusedSkill: report.homePractice?.focusedSkill ?? '',
          confidenceBooster: report.homePractice?.confidenceBooster ?? '',
        },
        teacherNote: report.teacherNote ?? '',
        sessionsAttended: prev.sessionsAttended,
      }));

      const avg =
        report.scores?.consistency != null &&
        report.scores?.understanding != null &&
        report.scores?.confidence != null
          ? Math.round(
              (report.scores.consistency + report.scores.understanding + report.scores.confidence) / 3,
            )
          : null;
      setOverallManual(avg == null || report.scores?.overall !== avg);
      setSessionsTouched(true);
    } finally {
      setCopyingWeekly(false);
    }
  };

  const handleGenerateFromWeek = async () => {
    if (!kidId || !selectedWeek || !selectedCourseId) return;
    setGeneratingWeekly(true);
    try {
      const snap = await getDocs(collection(db, 'students', kidId, 'progress'));
      const docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      const weekStart = selectedWeek.weekStartAt;
      const weekEnd = selectedWeek.weekEndAt;
      const prevStart = weekStart - 7 * 24 * 60 * 60 * 1000;
      const prevEnd = weekStart - 1;

      const matchesCourse = (doc: any): boolean => {
        const courseId = String(doc?.courseId || '').trim();
        return !courseId || courseId === selectedCourseId;
      };

      const currentDocs = docs.filter((doc) => {
        const updatedAt = toMillis(doc.updatedAt);
        return updatedAt >= weekStart && updatedAt <= weekEnd && matchesCourse(doc);
      });
      const prevDocs = docs.filter((doc) => {
        const updatedAt = toMillis(doc.updatedAt);
        return updatedAt >= prevStart && updatedAt <= prevEnd && matchesCourse(doc);
      });

      const prevById = new Map<string, any>();
      prevDocs.forEach((doc) => {
        const key = String(doc?.topicId || doc?.id || '');
        if (key) prevById.set(key, doc);
      });

      const labelFor = (doc: any): string => {
        return String(
          doc?.topicName || doc?.topicLabel || doc?.label || doc?.topicId || doc?.id || '',
        ).trim();
      };

      const unique = (list: string[]): string[] => {
        const seen = new Set<string>();
        const out: string[] = [];
        list.forEach((item) => {
          const v = item.trim();
          if (!v || seen.has(v)) return;
          seen.add(v);
          out.push(v);
        });
        return out;
      };

      const getScoreValue = (doc: any): number | null => {
        const pct = doc?.scorePct;
        if (typeof pct === 'number' && Number.isFinite(pct)) return clampScore(pct);
        const score = doc?.score;
        if (typeof score === 'number' && Number.isFinite(score)) return clampScore(score);
        return scoreBandMidpoint(doc?.scoreBand);
      };

      const covered = unique(currentDocs.map(labelFor)).slice(0, 5);

      const focusAreas = unique(
        currentDocs
          .filter((doc) => {
            const score = getScoreValue(doc);
            const lowScore = score != null && score <= 40;
            const lowMastery = masteryRank(doc?.mastery) <= 1;
            return lowScore || lowMastery;
          })
          .map(labelFor),
      ).slice(0, 2);

      const wins = unique(
        currentDocs
          .filter((doc) => {
            const key = String(doc?.topicId || doc?.id || '');
            const prev = key ? prevById.get(key) : null;
            if (!prev) return false;
            const prevScore = getScoreValue(prev) ?? 0;
            const currentScore = getScoreValue(doc) ?? 0;
            const prevMastery = masteryRank(prev?.mastery);
            const currentMastery = masteryRank(doc?.mastery);
            return currentScore > prevScore || currentMastery > prevMastery;
          })
          .map(labelFor),
      ).slice(0, 2);

      const nextWeekPlan = focusAreas.map((item) => `Practice ${item}`).slice(0, 2);

      const planned = toInt(form.sessionsPlanned) ?? 0;
      const attended = toInt(form.sessionsAttended) ?? 0;
      const consistency = planned > 0 ? Math.round((attended / planned) * 100) : 0;

      const understandingValues = currentDocs
        .map((doc) => getScoreValue(doc))
        .filter((value): value is number => value != null);
      const understanding =
        understandingValues.length > 0
          ? Math.round(
              understandingValues.reduce((acc, v) => acc + v, 0) / understandingValues.length,
            )
          : 0;

      setOverallManual(false);
      setForm((prev) => ({
        ...prev,
        covered: covered.join('\n'),
        wins: wins.join('\n'),
        focusAreas: focusAreas.join(', '),
        nextWeekPlan: nextWeekPlan.join(', '),
        scores: {
          ...prev.scores,
          consistency: String(consistency),
          understanding: String(understanding),
          confidence: '',
          overall: '',
        },
      }));
    } finally {
      setGeneratingWeekly(false);
    }
  };

  const handleSave = async (status: 'draft' | 'published') => {
    if (!kidId) return;
    if (!selectedCourseId || !selectedWeek) {
      toast({ title: 'Missing course', description: 'Select a course to continue.', variant: 'destructive' });
      return;
    }
    const uid = auth.currentUser?.uid;
    if (!uid) {
      toast({ title: 'Missing teacher', description: 'Please sign in again.', variant: 'destructive' });
      return;
    }

    const sessionsPlanned = toInt(form.sessionsPlanned);
    const sessionsAttended = toInt(form.sessionsAttended);
    const hasScores =
      toInt(form.scores.consistency) != null &&
      toInt(form.scores.understanding) != null &&
      toInt(form.scores.confidence) != null &&
      toInt(form.scores.overall) != null;

    if (status === 'published') {
      if (sessionsPlanned == null || sessionsAttended == null) {
        toast({ title: 'Missing sessions', description: 'Add sessions planned and attended.', variant: 'destructive' });
        return;
      }
      if (!hasScores) {
        toast({ title: 'Missing scores', description: 'Fill all score fields.', variant: 'destructive' });
        return;
      }
      if (splitLines(form.focusAreas).length === 0) {
        toast({ title: 'Missing focus areas', description: 'Add at least one focus area.', variant: 'destructive' });
        return;
      }
      if (splitLines(form.nextWeekPlan).length === 0) {
        toast({ title: 'Missing next week plan', description: 'Add at least one next week plan item.', variant: 'destructive' });
        return;
      }
      if (!form.homePractice.quickRevision || !form.homePractice.focusedSkill || !form.homePractice.confidenceBooster) {
        toast({ title: 'Missing home practice', description: 'Fill all home practice fields.', variant: 'destructive' });
        return;
      }
    }

    const report: WeeklyReport = {
      studentId: kidId,
      courseId: selectedCourseId,
      weekKey: selectedWeek.weekKey,
      weekStartAt: selectedWeek.weekStartAt,
      weekEndAt: selectedWeek.weekEndAt,
      sessionsPlanned: sessionsPlanned ?? 0,
      sessionsAttended: sessionsAttended ?? 0,
      scores: scoresNum,
      covered: splitLines(form.covered),
      wins: splitLines(form.wins),
      focusAreas: splitLines(form.focusAreas),
      nextWeekPlan: splitLines(form.nextWeekPlan),
      homePractice: {
        quickRevision: form.homePractice.quickRevision || '2 minutes: quick revision',
        focusedSkill: form.homePractice.focusedSkill || '2 minutes: one focused skill',
        confidenceBooster: form.homePractice.confidenceBooster || '1 minute: confidence booster',
      },
      teacherNote: form.teacherNote || undefined,
      status,
      updatedBy: uid,
      updatedAt: Date.now(),
    };

    setSavingStatus(status);
    try {
      await saveWeeklyReport(kidId, report);
      setLoadedStatus(status);
      toast({
        title: status === 'published' ? 'Weekly report published' : 'Weekly report saved',
        description: status === 'published' ? 'Parents can now view this report.' : 'Draft saved for later.',
      });
    } catch (err) {
      toast({ title: 'Save failed', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setSavingStatus(null);
    }
  };

  if (!kidId) {
    return (
      <div className="px-4 py-8 text-sm text-slate-600">
        No student selected. Open this page with a valid student ID
        (e.g. via <code>/teacher/students/&lt;kidUid&gt;/topic-progress</code>).
      </div>
    );
  }

  return (
    <div className="px-4 pb-8 space-y-4">
      <div className="sticky top-0 z-20 -mx-4 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="text-sm font-semibold text-slate-700 hover:text-slate-900"
          >
            ← {fromStudents || returnTo ? 'Back to My Students' : 'Back'}
          </button>
          <div className="text-sm font-semibold text-slate-900">
            {kidName ?? 'Student'} • Topic Progress
          </div>
          <button
            type="button"
            onClick={handleBack}
            className="text-sm font-semibold text-slate-500 hover:text-slate-900"
            aria-label="Close"
          >
            ✕ Close
          </button>
        </div>
      </div>

      <header>
        <p className="text-sm text-slate-600">Student ID: {kidId}</p>
        {loadingName && (
          <p className="mt-1 text-xs text-slate-500">Loading student name…</p>
        )}
        {!loadingName && kidName && (
          <p className="mt-1 text-sm text-slate-700">Name: {kidName}</p>
        )}
      </header>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab('topic')}
          className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${
            activeTab === 'topic'
              ? 'border-blue-600 bg-blue-600 text-white'
              : 'border-slate-200 bg-white text-slate-700'
          }`}
        >
          Topic Progress
        </button>
        <button
          type="button"
          onClick={() => setTab('weekly')}
          className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${
            activeTab === 'weekly'
              ? 'border-blue-600 bg-blue-600 text-white'
              : 'border-slate-200 bg-white text-slate-700'
          }`}
        >
          Weekly Insights
        </button>
      </div>

      {activeTab === 'topic' && (
        <StudentTopicProgressEditor
          kidId={kidId}
          kidName={kidName ?? undefined}
          onSaveAndBack={handleBack}
        />
      )}

      {activeTab === 'weekly' && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Weekly Insights (New)</h2>
              <p className="mt-1 text-sm text-slate-600">
                Create a weekly progress card for parents. Save as draft or publish.
              </p>
              {loadedStatus && (
                <div className="mt-2 text-xs text-slate-500">Loaded status: {loadedStatus}</div>
              )}
            </div>
            {loadingReport ? (
              <div className="text-xs font-semibold text-slate-500">Loading report...</div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleGenerateFromWeek}
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              disabled={generatingWeekly || !selectedCourseId || !selectedWeekKey}
            >
              {generatingWeekly ? 'Generating...' : 'Generate from this week'}
            </button>
            <button
              type="button"
              onClick={handleCopyLastWeek}
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              disabled={copyingWeekly || !selectedCourseId || !selectedWeekKey}
            >
              {copyingWeekly ? 'Copying...' : 'Copy last week'}
            </button>
            <button
              type="button"
              onClick={() => setShowWeeklyMore((prev) => !prev)}
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              {showWeeklyMore ? 'Hide details' : 'More details'}
            </button>
          </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-700">Course</label>
            <select
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
            >
              <option value="">Select a course</option>
              {courseOptions.map((opt) => (
                <option key={opt.id} value={opt.courseId}>
                  {opt.label || opt.courseId}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Week</label>
            <select
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              value={selectedWeekKey}
              onChange={(e) => setSelectedWeekKey(e.target.value)}
            >
              {weekOptions.map((opt) => (
                <option key={opt.weekKey} value={opt.weekKey}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-700">Sessions planned</label>
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              value={form.sessionsPlanned}
              onChange={(e) => {
                setSessionsTouched(true);
                setForm((prev) => ({ ...prev, sessionsPlanned: e.target.value }));
              }}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Sessions attended</label>
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              value={form.sessionsAttended}
              onChange={(e) => {
                setSessionsTouched(true);
                setForm((prev) => ({ ...prev, sessionsAttended: e.target.value }));
              }}
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Consistency</label>
            <input
              type="number"
              min={0}
              max={100}
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              value={form.scores.consistency}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  scores: { ...prev.scores, consistency: e.target.value },
                }))
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Understanding</label>
            <input
              type="number"
              min={0}
              max={100}
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              value={form.scores.understanding}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  scores: { ...prev.scores, understanding: e.target.value },
                }))
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Confidence</label>
            <input
              type="number"
              min={0}
              max={100}
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              value={form.scores.confidence}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  scores: { ...prev.scores, confidence: e.target.value },
                }))
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Overall</label>
            <input
              type="number"
              min={0}
              max={100}
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              value={form.scores.overall}
              onChange={(e) => {
                const val = e.target.value;
                setOverallManual(val.trim() !== '');
                setForm((prev) => ({
                  ...prev,
                  scores: { ...prev.scores, overall: val },
                }));
              }}
            />
          </div>
        </div>
        <div className="text-xs text-slate-500">
          Overall auto-calculates from the three scores unless you override it.
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-700">Focus area</label>
            <input
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              value={form.focusAreas}
              onChange={(e) => setForm((prev) => ({ ...prev, focusAreas: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Next week plan</label>
            <input
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              value={form.nextWeekPlan}
              onChange={(e) => setForm((prev) => ({ ...prev, nextWeekPlan: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="text-sm font-medium text-slate-700">Home practice: quick revision</label>
            <input
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              value={form.homePractice.quickRevision}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  homePractice: { ...prev.homePractice, quickRevision: e.target.value },
                }))
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Home practice: focused skill</label>
            <input
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              value={form.homePractice.focusedSkill}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  homePractice: { ...prev.homePractice, focusedSkill: e.target.value },
                }))
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Home practice: confidence booster</label>
            <input
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              value={form.homePractice.confidenceBooster}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  homePractice: { ...prev.homePractice, confidenceBooster: e.target.value },
                }))
              }
            />
          </div>
        </div>

        {showWeeklyMore ? (
          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">What we covered (one per line)</label>
                <textarea
                  rows={4}
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  value={form.covered}
                  onChange={(e) => setForm((prev) => ({ ...prev, covered: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Wins this week (one per line)</label>
                <textarea
                  rows={4}
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  value={form.wins}
                  onChange={(e) => setForm((prev) => ({ ...prev, wins: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Teacher note (optional)</label>
              <textarea
                rows={3}
                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                value={form.teacherNote}
                onChange={(e) => setForm((prev) => ({ ...prev, teacherNote: e.target.value }))}
              />
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() => handleSave('draft')}
            disabled={savingStatus !== null}
          >
            {savingStatus === 'draft' ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            type="button"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            onClick={() => handleSave('published')}
            disabled={savingStatus !== null}
          >
            {savingStatus === 'published' ? 'Publishing...' : 'Publish'}
          </button>
        </div>

          <div className="pt-2">
            {previewReport ? (
              <WeeklyProgressCard report={previewReport} variant="teacher" />
            ) : (
              <div className="text-sm text-slate-500">
                Select a course and week to preview the weekly progress card.
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default TeacherStudentTopicProgressPage;
