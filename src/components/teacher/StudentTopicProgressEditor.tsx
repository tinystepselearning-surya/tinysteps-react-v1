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

  const handleSave = async () => {
    if (!kidId || !selectedTopicId || !selectedTopicDef) return;

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
    } catch (err: any) {
      setSaveMessage(
        err?.message || 'Could not save progress. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  const disabled =
    topicsLoading || !selectedCourseId || courseTopics.length === 0;

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 text-sm">
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">
            Topic-wise Progress (Teacher View)
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

      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
          Course
          <select
            className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
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
            className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
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

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
          Subskill (optional)
          <input
            type="text"
            className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
            placeholder="e.g., CVC blending"
            value={selectedSubskill}
            onChange={(e) => setSelectedSubskill(e.target.value)}
            disabled={disabled}
          />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
          Mastery
          <select
            className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
            value={mastery}
            onChange={(e) => setMastery(e.target.value)}
            disabled={disabled}
          >
            {(config?.mastery ?? ['not_started']).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
          Score band
          <select
            className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
            value={scoreBand}
            onChange={(e) => setScoreBand(e.target.value)}
            disabled={disabled}
          >
            <option value="">Not set</option>
            {(config?.scoreBands ?? []).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
          Last evidence
          <select
            className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
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

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
          Next action
          <select
            className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
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
      </div>

      <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
        Strengths (comma-separated)
        <input
          type="text"
          className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
          placeholder="e.g., blending, confidence, pronunciation"
          value={strengths}
          onChange={(e) => setStrengths(e.target.value)}
          disabled={disabled}
        />
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
        Weaknesses (comma-separated)
        <input
          type="text"
          className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
          placeholder="e.g., blends, pacing, handwriting"
          value={weaknesses}
          onChange={(e) => setWeaknesses(e.target.value)}
          disabled={disabled}
        />
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
        Teacher remark
        <textarea
          className="min-h-[60px] rounded border border-slate-300 bg-white px-2 py-1 text-sm"
          placeholder="Short note for parents & internal tracking"
          value={teacherRemark}
          onChange={(e) => setTeacherRemark(e.target.value)}
          disabled={disabled}
        />
      </label>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={disabled || saving || !selectedTopicId}
          className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {saving ? 'Saving…' : 'Save topic progress'}
        </button>
      </div>
    </div>
  );
};

export default StudentTopicProgressEditor;
