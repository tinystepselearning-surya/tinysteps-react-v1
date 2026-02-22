// src/pages/teacher/TeacherStudentTopicProgressPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
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

const TeacherStudentTopicProgressPage: React.FC = () => {
  const { kidId } = useParams<{ kidId: string }>();
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
      <header>
        <h1 className="text-xl font-semibold text-slate-900">
          Student Topic Progress
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Student ID: {kidId}
        </p>
        {loadingName && (
          <p className="mt-1 text-xs text-slate-500">
            Loading student name…
          </p>
        )}
        {!loadingName && kidName && (
          <p className="mt-1 text-sm text-slate-700">
            Name: {kidName}
          </p>
        )}
      </header>

      <StudentTopicProgressEditor
        kidId={kidId}
        kidName={kidName ?? undefined}
      />

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
              onChange={(e) => setForm((prev) => ({ ...prev, sessionsPlanned: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Sessions attended</label>
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              value={form.sessionsAttended}
              onChange={(e) => setForm((prev) => ({ ...prev, sessionsAttended: e.target.value }))}
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
          <div>
            <label className="text-sm font-medium text-slate-700">Focus areas (one per line)</label>
            <textarea
              rows={4}
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              value={form.focusAreas}
              onChange={(e) => setForm((prev) => ({ ...prev, focusAreas: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Next week plan (one per line)</label>
            <textarea
              rows={4}
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

        <div>
          <label className="text-sm font-medium text-slate-700">Teacher note (optional)</label>
          <textarea
            rows={3}
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            value={form.teacherNote}
            onChange={(e) => setForm((prev) => ({ ...prev, teacherNote: e.target.value }))}
          />
        </div>

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
    </div>
  );
};

export default TeacherStudentTopicProgressPage;
