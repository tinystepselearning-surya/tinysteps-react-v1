// src/components/teacher/StudentTopicProgressEditor.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';
import {
  useProgressPicklists,
} from '../../hooks/useProgressPicklists';
import {
  useKidTopicProgress,
  type KidTopicProgress,
} from '../../hooks/useKidTopicProgress';

interface StudentTopicProgressEditorProps {
  kidId: string;
  kidName?: string;
  onSaveAndBack?: () => void;
}

type CourseId = 'foundational' | 'early' | 'advanced';

type CourseDefinition = {
  id: CourseId;
  label: string;
};

type CourseTopic = {
  id: string;
  lesson: string;
  label: string;
  courseId: CourseId;
  courseLabel: string;
  area: 'phonics';
};

const PHONICS_COURSES: CourseDefinition[] = [
  { id: 'foundational', label: 'Foundational Course' },
  { id: 'early', label: 'Early Phonics' },
  { id: 'advanced', label: 'Advanced Phonics' },
];

const normalizeSlug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const makeTopicId = (courseId: CourseId, lesson: string, label: string): string =>
  `${courseId}:${normalizeSlug(lesson)}:${normalizeSlug(label)}`;

const PHONICS_TOPICS_BY_COURSE: Record<CourseId, CourseTopic[]> = {
  foundational: [
    { lesson: 'Lesson-1', label: 's' },
    { lesson: 'Lesson-2', label: 'a' },
    { lesson: 'Lesson-3', label: 't' },
    { lesson: 'Lesson-4', label: 'i' },
    { lesson: 'Lesson-5', label: 'p' },
    { lesson: 'Lesson-6', label: 'n' },
    { lesson: 'Lesson-7', label: 'c' },
    { lesson: 'Lesson-8', label: 'k' },
    { lesson: 'Lesson-9', label: 'e' },
    { lesson: 'Lesson-10', label: 'h' },
    { lesson: 'Lesson-11', label: 'r' },
    { lesson: 'Lesson-12', label: 'm' },
    { lesson: 'Lesson-13', label: 'd' },
    { lesson: 'Lesson-14', label: 'g' },
    { lesson: 'Lesson-15', label: 'o' },
    { lesson: 'Lesson-16', label: 'u' },
    { lesson: 'Lesson-17', label: 'l' },
    { lesson: 'Lesson-18', label: 'f' },
    { lesson: 'Lesson-19', label: 'b' },
    { lesson: 'Lesson-20', label: 'j' },
    { lesson: 'Lesson-21', label: 'z' },
    { lesson: 'Lesson-22', label: 'w' },
    { lesson: 'Lesson-23', label: 'v' },
    { lesson: 'Lesson-24', label: 'y' },
    { lesson: 'Lesson-25', label: 'x' },
    { lesson: 'Lesson-26', label: 'q' },
    { lesson: 'Lesson-27', label: 'a e i o u' },
    { lesson: 'Lesson-28', label: 'all letter sounds' },
    { lesson: 'Lesson-29', label: 'revision' },
    { lesson: 'Lesson-30', label: 'revision' },
  ].map((topic) => ({
    ...topic,
    id: makeTopicId('foundational', topic.lesson, topic.label),
    courseId: 'foundational',
    courseLabel: 'Foundational Course',
    area: 'phonics',
  })),
  early: [
    { lesson: 'Lesson 1', label: 's a t' },
    { lesson: 'Lesson-2', label: 'i p n' },
    { lesson: 'Lesson-3', label: 'c and k' },
    { lesson: 'Lesson-4', label: 'e  h  r' },
    { lesson: 'Lesson-5', label: 'm d g' },
    { lesson: 'Lesson-6', label: 'o u l' },
    { lesson: 'Lesson-7', label: 'f b j' },
    { lesson: 'Lesson-8', label: 'z w v' },
    { lesson: 'Lesson-9', label: 'y x q' },
    { lesson: 'Lesson-10', label: 'short vowels' },
    { lesson: 'Lesson-11', label: 'sh' },
    { lesson: 'Lesson-12', label: 'ch, tch' },
    { lesson: 'Lesson-13', label: 'th, TH' },
    { lesson: 'Lesson-14', label: 'ck' },
    { lesson: 'Lesson-15', label: 'ng, mb' },
    { lesson: 'Lesson-16', label: 'kn' },
    { lesson: 'Lesson-17', label: 'wr' },
    { lesson: 'Lesson-18', label: 'wh' },
    { lesson: 'Lesson-19', label: 'ph, gh' },
    { lesson: 'Lesson-20', label: 'revision of digraphs' },
    { lesson: 'Lesson-21', label: 'Floss rule' },
    { lesson: 'Lesson-22', label: 'ai' },
    { lesson: 'Lesson-23', label: 'ee' },
    { lesson: 'Lesson-24', label: 'ea' },
    { lesson: 'Lesson-25', label: 'ie' },
    { lesson: 'Lesson-26', label: 'oa' },
    { lesson: 'Lesson-27', label: 'oo' },
    { lesson: 'Lesson-28', label: 'oe' },
    { lesson: 'Lesson-29', label: 'oo-ui' },
    { lesson: 'Lesson-30', label: 'oo-ue' },
    { lesson: 'Lesson-31', label: 'igh' },
    { lesson: 'Lesson-32', label: 'a_e' },
    { lesson: 'Lesson-33', label: 'e_e' },
    { lesson: 'Lesson-34', label: 'i_e' },
    { lesson: 'Lesson-35', label: 'o_e' },
    { lesson: 'Lesson-36', label: 'u_e' },
    { lesson: 'Lesson-37', label: 'Rabbit rule' },
    { lesson: 'Lesson-38', label: 'monster le' },
    { lesson: 'Lesson-39', label: 'soft c' },
    { lesson: 'Lesson-40', label: 'hard g' },
    { lesson: 'Lesson-40', label: 'Revision' },
  ].map((topic) => ({
    ...topic,
    id: makeTopicId('early', topic.lesson, topic.label),
    courseId: 'early',
    courseLabel: 'Early Phonics',
    area: 'phonics',
  })),
  advanced: [
    { lesson: 'Lesson 1', label: 'ai, ay' },
    { lesson: 'Lesson-2', label: 'oi, oy' },
    { lesson: 'Lesson-3', label: 'ou, ow' },
    { lesson: 'Lesson-4', label: 'au, aw' },
    { lesson: 'Lesson-5', label: 'bossy ar' },
    { lesson: 'Lesson-6', label: 'bossy or' },
    { lesson: 'Lesson-7', label: 'ir, ur, er' },
    { lesson: 'Lesson-8', label: '3  j sounds' },
    { lesson: 'Lesson-9', label: 'shun sounds' },
    { lesson: 'Lesson-10', label: 'silent letters' },
    { lesson: 'Lesson-11', label: 'alternate a' },
    { lesson: 'Lesson-12', label: 'alternate e' },
    { lesson: 'Lesson-13', label: 'alternate i' },
    { lesson: 'Lesson-14', label: 'alternate o' },
    { lesson: 'Lesson-15', label: 'alternate u' },
    { lesson: 'Lesson-16', label: 'c at the end, ct sound' },
    { lesson: 'Lesson-17', label: 'revision' },
    { lesson: 'Lesson-18', label: 'revision' },
    { lesson: 'Lesson-19', label: 'revision' },
    { lesson: 'Lesson-20', label: 'revision' },
  ].map((topic) => ({
    ...topic,
    id: makeTopicId('advanced', topic.lesson, topic.label),
    courseId: 'advanced',
    courseLabel: 'Advanced Phonics',
    area: 'phonics',
  })),
};

const COURSE_LABEL_BY_ID = PHONICS_COURSES.reduce<Record<CourseId, string>>(
  (acc, course) => {
    acc[course.id] = course.label;
    return acc;
  },
  { foundational: 'Foundational Course', early: 'Early Phonics', advanced: 'Advanced Phonics' },
);

const normalizeCourseId = (value?: string): CourseId | null => {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'foundational' || normalized === 'foundational course') return 'foundational';
  if (normalized === 'early' || normalized === 'early phonics') return 'early';
  if (normalized === 'advanced' || normalized === 'advanced phonics') return 'advanced';
  return null;
};

const normalizeCourseName = (value?: string): CourseId | null =>
  normalizeCourseId(value);

const parseCommaList = (value: string): string[] =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

const formatCommaList = (value: unknown): string => {
  if (Array.isArray(value)) {
    return value
      .filter((item) => typeof item === 'string' && item.trim().length > 0)
      .map((item) => item.trim())
      .join(', ');
  }
  if (typeof value === 'string') return value;
  return '';
};

const StudentTopicProgressEditor: React.FC<StudentTopicProgressEditorProps> = ({
  kidId,
  kidName,
  onSaveAndBack,
}) => {
  const { config, loading: configLoading, error: configError } =
    useProgressPicklists();

  const {
    topics: existingTopics,
    loading: topicsLoading,
    error: topicsError,
  } = useKidTopicProgress(kidId);

  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [selectedCourseId, setSelectedCourseId] = useState<CourseId | ''>('');
  const [courseOptions, setCourseOptions] = useState<CourseDefinition[]>(PHONICS_COURSES);
  const [courseManuallySelected, setCourseManuallySelected] = useState(false);
  const [selectedSubskill, setSelectedSubskill] = useState<string>('');
  const [mastery, setMastery] = useState<string>('not_started');
  const [scoreBand, setScoreBand] = useState<string>('');
  const [lastEvidence, setLastEvidence] = useState<string>('');
  const [nextAction, setNextAction] = useState<string>('');
  const [strengths, setStrengths] = useState<string>('');
  const [weaknesses, setWeaknesses] = useState<string>('');
  const [teacherRemark, setTeacherRemark] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  const resolvedCourseOptions = useMemo<CourseDefinition[]>(() => courseOptions, [courseOptions]);

  const courseTopics = useMemo<CourseTopic[]>(() => {
    const configCourses = (config as any)?.phonicsCourses as any[] | undefined;
    const configTopics = (config as any)?.phonicsTopics as any[] | undefined;
    if (selectedCourseId && Array.isArray(configCourses) && Array.isArray(configTopics)) {
      const matchedCourse = configCourses.find(
        (c) => normalizeCourseId(String(c?.id ?? c?.courseId ?? c?.label)) === selectedCourseId,
      );
      const courseLabel = String(matchedCourse?.label || COURSE_LABEL_BY_ID[selectedCourseId]);
      const topicsForCourse = configTopics
        .filter((t) => normalizeCourseId(String(t?.courseId ?? t?.course)) === selectedCourseId)
        .map((t) => {
          const lesson = String(t?.lesson ?? t?.lessonNumber ?? t?.lessonNo ?? '');
          const label = String(t?.label ?? t?.topic ?? t?.topicName ?? '');
          return {
            id: String(t?.id ?? makeTopicId(selectedCourseId, lesson, label)),
            lesson,
            label,
            courseId: selectedCourseId,
            courseLabel,
            area: 'phonics',
          } as CourseTopic;
        });
      if (topicsForCourse.length > 0) return topicsForCourse;
    }

    if (selectedCourseId) {
      return PHONICS_TOPICS_BY_COURSE[selectedCourseId] || [];
    }
    return [];
  }, [config, selectedCourseId]);

  const selectedTopicDef: CourseTopic | undefined = useMemo(
    () => courseTopics.find((t) => t.id === selectedTopicId),
    [courseTopics, selectedTopicId],
  );

  // Load student courses
  useEffect(() => {
    let active = true;
    const loadCourses = async () => {
      try {
        const studentRef = doc(db, 'students', kidId);
        const snap = await getDoc(studentRef);
        if (!active) return;
        if (snap.exists()) {
          const data = snap.data() as any;
          const explicitIds = [
            ...(Array.isArray(data.courseIds) ? data.courseIds : []),
            ...(data.courseId ? [data.courseId] : []),
          ]
            .map((id: string) => normalizeCourseId(String(id)))
            .filter(Boolean) as CourseId[];

          const nameSources = [
            ...(Array.isArray(data.courseNames) ? data.courseNames : []),
            ...(Array.isArray(data.courses) ? data.courses : []),
            ...(data.courseName ? [data.courseName] : []),
          ]
            .map((name: string) => normalizeCourseName(String(name)))
            .filter(Boolean) as CourseId[];

          const uniqueIds = Array.from(new Set([...explicitIds, ...nameSources]));
          const normalizedActive = normalizeCourseId(String(data.activeCourseId || ''));
          if (uniqueIds.length > 0) {
            const options = PHONICS_COURSES.filter((c) => uniqueIds.includes(c.id));
            const defaultCourse = (normalizedActive && uniqueIds.includes(normalizedActive))
              ? normalizedActive
              : uniqueIds[0];
            setCourseOptions(options);
            setSelectedCourseId((prev) => (courseManuallySelected ? prev : (defaultCourse || prev || options[0]?.id || '')));
          } else {
            setCourseOptions(PHONICS_COURSES);
            setSelectedCourseId((prev) => (courseManuallySelected ? prev : prev || 'foundational'));
          }
        } else {
          setCourseOptions(PHONICS_COURSES);
          setSelectedCourseId((prev) => (courseManuallySelected ? prev : prev || 'foundational'));
        }
      } catch {
        if (!active) return;
        setCourseOptions(PHONICS_COURSES);
        setSelectedCourseId((prev) => (courseManuallySelected ? prev : prev || 'foundational'));
      }
    };

    if (kidId) {
      loadCourses();
    }

    return () => {
      active = false;
    };
  }, [kidId, courseManuallySelected]);

  // When course changes, pick first topic by default
  useEffect(() => {
    if (!selectedCourseId) return;
    if (!selectedTopicId && courseTopics.length > 0) {
      setSelectedTopicId(courseTopics[0].id);
    }
    if (selectedTopicId && courseTopics.length > 0) {
      const exists = courseTopics.some((t) => t.id === selectedTopicId);
      if (!exists) {
        setSelectedTopicId(courseTopics[0].id);
      }
    }
  }, [selectedCourseId, selectedTopicId, courseTopics]);

  // When topic changes, load existing progress (if any) or reset form
  useEffect(() => {
    if (!selectedTopicId) return;

    const existing: KidTopicProgress | undefined = existingTopics.find(
      (t) => t.id === selectedTopicId,
    );

    if (existing) {
      const existingMastery = existing.mastery;
      // Coerce possible number | "not_started" into a string
      setMastery(
        existingMastery == null
          ? 'not_started'
          : typeof existingMastery === 'number'
          ? String(existingMastery)
          : existingMastery,
      );
      setScoreBand(existing.scoreBand || '');
      setLastEvidence(existing.lastEvidence || '');
      setNextAction(existing.nextAction || '');
      setStrengths(formatCommaList((existing as any).strengths));
      setWeaknesses(formatCommaList((existing as any).weaknesses));
      setTeacherRemark(existing.teacherRemark || '');
      setSelectedSubskill(existing.subskill || '');
    } else {
      setMastery('not_started');
      setScoreBand('');
      setLastEvidence('');
      setNextAction('');
      setStrengths('');
      setWeaknesses('');
      setTeacherRemark('');
      setSelectedSubskill('');
    }

    setSaveMessage(null);
  }, [selectedTopicId, existingTopics]);

  const handleSave = async (): Promise<boolean> => {
    if (!kidId || !selectedTopicId || !selectedTopicDef) return false;

    try {
      setSaving(true);
      setSaveMessage(null);

      const ref = doc(db, 'students', kidId, 'progress', selectedTopicId);

      await setDoc(
        ref,
        {
          topicName: `${selectedTopicDef.lesson} — ${selectedTopicDef.label}`,
          area: selectedTopicDef.area,
          courseId: selectedCourseId || null,
          courseLabel: selectedCourseId ? COURSE_LABEL_BY_ID[selectedCourseId] : null,
          subskill: selectedSubskill || null,
          mastery: mastery || 'not_started',
          scoreBand: scoreBand || null,
          lastEvidence: lastEvidence || null,
          nextAction: nextAction || null,
          strengths: parseCommaList(strengths),
          weaknesses: parseCommaList(weaknesses),
          teacherRemark: teacherRemark || null,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      setSaveMessage('Progress saved.');
      setLastSavedAt(Date.now());
      return true;
    } catch (err: any) {
      setSaveMessage(
        err?.message || 'Could not save progress. Please try again.',
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndBack = async () => {
    const ok = await handleSave();
    if (ok && onSaveAndBack) onSaveAndBack();
  };

  const handleSaveAndNext = async () => {
    const ok = await handleSave();
    if (!ok) return;
    const idx = courseTopics.findIndex((t) => t.id === selectedTopicId);
    if (idx >= 0 && idx < courseTopics.length - 1) {
      setSelectedTopicId(courseTopics[idx + 1].id);
    }
  };

  const disabled =
    topicsLoading || !selectedCourseId || courseTopics.length === 0;

  return (
    <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3 text-sm">
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">
            Topic Progress — Quick Update
          </h2>
          {kidName && (
            <p className="text-xs text-slate-500">
              Updating progress for: {kidName}
            </p>
          )}
        </div>
        {saving && (
          <span className="text-xs text-slate-500">
            Saving…
          </span>
        )}
        {!saving && saveMessage && (
          <span className="text-xs text-emerald-600">{saveMessage}</span>
        )}
      </div>

      {configError && (
        <p className="text-xs text-red-600">
          Couldn&apos;t load picklists: {configError}
        </p>
      )}
      {topicsError && (
        <p className="text-xs text-red-600">
          Couldn&apos;t load existing progress: {topicsError}
        </p>
      )}

      <div className="grid gap-2 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
          Course
          <select
            className="h-9 rounded border border-slate-300 bg-white px-2 text-sm"
            value={selectedCourseId}
            onChange={(e) => {
              setCourseManuallySelected(true);
              setSelectedCourseId(e.target.value as CourseId);
            }}
            disabled={configLoading || topicsLoading}
          >
            {resolvedCourseOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
          Topic
          <select
            className="h-9 rounded border border-slate-300 bg-white px-2 text-sm"
            value={selectedTopicId}
            onChange={(e) => setSelectedTopicId(e.target.value)}
            disabled={disabled}
          >
            {courseTopics.length === 0 && (
              <option value="">No topics configured</option>
            )}
            {courseTopics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.lesson} — {t.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-2 md:grid-cols-4">
        <div className="md:col-span-2 space-y-1">
          <div className="text-xs font-medium text-slate-700">Mastery</div>
          <div className="flex flex-wrap gap-2">
            {(config?.mastery ?? [
              'not_started',
              'emerging',
              'developing',
              'proficient',
              'mastered',
            ]).map((m) => {
              const active = mastery === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMastery(m)}
                  disabled={disabled}
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                    active
                      ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {String(m).replace(/_/g, ' ')}
                </button>
              );
            })}
          </div>
          <div className="text-xs text-slate-500">
            Pick the child's current level for this topic.
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs font-medium text-slate-700">Score band</div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: '0–20', fallback: '0-20' },
              { label: '21–40', fallback: '21-40' },
              { label: '41–60', fallback: '41-60' },
              { label: '61–80', fallback: '61-80' },
              { label: '81–100', fallback: '81-100' },
            ].map((opt) => {
              const candidates = (config?.scoreBands ?? []) as string[];
              const value =
                candidates.find((c) => c === opt.label || c === opt.fallback) ?? opt.fallback;
              const active = scoreBand === value;
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setScoreBand(value)}
                  disabled={disabled}
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                    active
                      ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <div className="text-xs text-slate-500">
            Pick a band based on today's performance.
          </div>
        </div>

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
          Next action
          <select
            className="h-9 rounded border border-slate-300 bg-white px-2 text-sm"
            value={nextAction}
            onChange={(e) => setNextAction(e.target.value)}
            disabled={disabled}
          >
            <option value="">Not set</option>
            {(config?.nextActions ?? []).map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
          Teacher remark
          <input
            type="text"
            className="h-9 rounded border border-slate-300 bg-white px-2 text-sm"
            placeholder="One-line note for parents"
            value={teacherRemark}
            onChange={(e) => setTeacherRemark(e.target.value)}
            disabled={disabled}
          />
        </label>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="text-xs font-semibold text-slate-700">Optional</div>
          <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500">
            Optional
          </span>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Subskill
            <input
              type="text"
              className="h-9 rounded border border-slate-300 bg-white px-2 text-sm"
              placeholder="e.g., CVC blending"
              value={selectedSubskill}
              onChange={(e) => setSelectedSubskill(e.target.value)}
              disabled={disabled}
            />
            <span className="text-[11px] text-slate-500">
              Exact skill observed today (e.g., CVC blending, letter formation).
            </span>
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                'CVC blending',
                'segmenting',
                'letter formation',
                'sound recognition',
                'word reading',
                'spelling',
                'sentence reading',
                'pronunciation',
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() =>
                    setSelectedSubskill((prev) => (prev ? `${prev}, ${chip}` : chip))
                  }
                  className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  disabled={disabled}
                >
                  {chip}
                </button>
              ))}
            </div>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Last evidence
            <select
              className="h-9 rounded border border-slate-300 bg-white px-2 text-sm"
              value={lastEvidence}
              onChange={(e) => setLastEvidence(e.target.value)}
              disabled={disabled}
            >
              <option value="">Not set</option>
              {(config?.lastEvidence ?? []).map((ev) => (
                <option key={ev} value={ev}>
                  {ev}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Strengths (comma-separated)
            <input
              type="text"
              className="h-9 rounded border border-slate-300 bg-white px-2 text-sm"
              placeholder="e.g., blending, confidence"
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              disabled={disabled}
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Weaknesses (comma-separated)
            <input
              type="text"
              className="h-9 rounded border border-slate-300 bg-white px-2 text-sm"
              placeholder="e.g., blends, pacing"
              value={weaknesses}
              onChange={(e) => setWeaknesses(e.target.value)}
              disabled={disabled}
            />
          </label>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={disabled || saving || !selectedTopicId}
          className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        {onSaveAndBack ? (
          <button
            type="button"
            onClick={handleSaveAndBack}
            disabled={disabled || saving || !selectedTopicId}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {saving ? 'Saving…' : 'Save & Back'}
          </button>
        ) : null}
        <button
          type="button"
          onClick={handleSaveAndNext}
          disabled={disabled || saving || !selectedTopicId}
          className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100"
        >
          {saving ? 'Saving…' : 'Save & Next Topic'}
        </button>
      </div>
      <div className="text-xs text-slate-500">
        Last saved: {lastSavedAt ? new Date(lastSavedAt).toLocaleString() : '—'}
      </div>
    </div>
  );
};

export default StudentTopicProgressEditor;
