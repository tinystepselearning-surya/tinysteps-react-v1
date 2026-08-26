import React, { useEffect, useMemo, useState } from 'react';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import ChildSkillRatingCard from '../progress/ChildSkillRatingCard';
import { db } from '../../lib/firebaseConfig';
import { useKidTopicProgress } from '../../hooks/useKidTopicProgress';
import { useAuthStore } from '../../store/useAuthStore';
import {
  deriveLegacyProgressFromRatings,
  normalizeProgressRatings,
  type ProgressRatings,
} from '../../lib/skillRatings';
import { getProgressSkillsForLesson } from '../../lib/progressSkills';
import {
  deriveProgressSubskillSuggestions,
  resolveProgressSubskillSelection,
  type SubskillSelectionSource,
} from '../../lib/progressSubskillSuggestions';
import {
  buildTeacherLessonStatusScalars,
  planTeacherLessonStatusWrite,
  resolveTeacherEditableLessonStatus,
  type TeacherEditableLessonStatus,
} from '../../lib/teacherLessonProgressContract';
import { canonicalLessonStatus } from '../../lib/parentDashboardDataContract';
import {
  getPhonicsLessons,
  isPhonicsCourseId,
  PHONICS_COURSES,
  PHONICS_CURRICULUM_REVISION,
  type PhonicsLesson,
} from '../../content/phonicsCurriculum';

interface StudentTopicProgressEditorProps {
  kidId: string;
  kidName?: string;
  enrollmentId?: string;
  courseId?: string;
  onSaveAndBack?: () => void;
}

type CourseId =
  | 'phonics-foundations'
  | 'early-phonics'
  | 'advanced-phonics'
  | 'basic-grammar'
  | 'advanced-grammar'
  | 'basic-public-speaking'
  | 'advanced-public-speaking';

type TopicArea = 'phonics' | 'grammar' | 'speaking';

type TeacherTopic = {
  id: string;
  courseId: CourseId;
  courseLabel: string;
  area: TopicArea;
  lesson: string;
  label: string;
  displayTitle: string;
  order: number;
  stageLabel?: string | null;
  stageOrder?: number | null;
  rubricType?: string | null;
  subskillChips?: string[];
};

const COURSE_LABELS: Record<CourseId, string> = {
  'phonics-foundations': 'Foundation Phonics',
  'early-phonics': 'Early Phonics',
  'advanced-phonics': 'Advanced Phonics',
  'basic-grammar': 'Basic Grammar',
  'advanced-grammar': 'Advanced Grammar',
  'basic-public-speaking': 'Public Speaking (Basic)',
  'advanced-public-speaking': 'Public Speaking (Advanced)',
};

const COURSE_OPTIONS = (Object.keys(COURSE_LABELS) as CourseId[]).map((id) => ({
  id,
  label: COURSE_LABELS[id],
}));

const COURSE_ALIASES: Record<string, CourseId> = {
  'phonics-foundation': 'phonics-foundations',
  'phonics-foundations': 'phonics-foundations',
  foundational: 'phonics-foundations',
  foundation: 'phonics-foundations',
  'phonics-early': 'early-phonics',
  'early-phonics': 'early-phonics',
  early: 'early-phonics',
  'phonics-advanced': 'advanced-phonics',
  'advanced-phonics': 'advanced-phonics',
  'basic-grammar': 'basic-grammar',
  'grammar-essentials': 'basic-grammar',
  'advanced-grammar': 'advanced-grammar',
  'grammar-mastery': 'advanced-grammar',
  'basic-public-speaking': 'basic-public-speaking',
  'public-speaking-foundations': 'basic-public-speaking',
  'advanced-public-speaking': 'advanced-public-speaking',
  'public-speaking-excellence': 'advanced-public-speaking',
};

function normalizeCourseId(value: unknown): CourseId | '' {
  const raw = String(value ?? '').trim().toLowerCase();
  if (!raw) return '';
  if (COURSE_ALIASES[raw]) return COURSE_ALIASES[raw];
  if (raw.includes('phonics')) {
    if (raw.includes('advanced')) return 'advanced-phonics';
    if (raw.includes('early') || raw.includes('brush')) return 'early-phonics';
    return 'phonics-foundations';
  }
  if (raw.includes('grammar')) {
    return raw.includes('advanced') || raw.includes('mastery')
      ? 'advanced-grammar'
      : 'basic-grammar';
  }
  if (raw.includes('speaking') || raw.includes('speech')) {
    return raw.includes('advanced') || raw.includes('excellence')
      ? 'advanced-public-speaking'
      : 'basic-public-speaking';
  }
  return '';
}

function timestampMs(value: any): number {
  if (!value) return 0;
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (typeof value?.toDate === 'function') return value.toDate().getTime();
  if (value instanceof Date) return value.getTime();
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function canonicalPhonicsTopic(lesson: PhonicsLesson): TeacherTopic {
  return {
    id: lesson.id,
    courseId: lesson.courseId,
    courseLabel: PHONICS_COURSES[lesson.courseId].label,
    area: 'phonics',
    lesson: lesson.lesson,
    label: lesson.label,
    displayTitle: lesson.displayTitle,
    order: lesson.order,
    stageLabel: lesson.stageLabel,
    stageOrder: lesson.stageOrder,
    rubricType: lesson.rubricType,
  };
}

function normalizeConfiguredTopic(raw: any, index: number): TeacherTopic | null {
  const courseId = normalizeCourseId(raw?.courseId ?? raw?.course ?? raw?.courseLabel);
  if (!courseId || isPhonicsCourseId(courseId)) return null;
  const lesson = String(raw?.lesson ?? raw?.lessonId ?? `Lesson-${index + 1}`).trim();
  const label = String(raw?.label ?? raw?.name ?? raw?.topicName ?? lesson).trim();
  const area: TopicArea = courseId.includes('grammar') ? 'grammar' : 'speaking';
  const lessonMatch = /lesson[-_ ]*0*(\d+)/i.exec(lesson || String(raw?.id ?? ''));
  const order = Number(raw?.order ?? raw?.sequenceNumber ?? lessonMatch?.[1] ?? index + 1);
  const id = String(raw?.id ?? `${courseId}__lesson-${String(order).padStart(2, '0')}`);
  return {
    id,
    courseId,
    courseLabel: COURSE_LABELS[courseId],
    area,
    lesson,
    label,
    displayTitle: String(raw?.displayTitle ?? `${lesson} — ${label}`),
    order: Number.isFinite(order) ? order : index + 1,
    stageLabel: raw?.stageLabel ?? null,
    stageOrder: raw?.stageOrder ?? null,
    rubricType: raw?.rubricType ?? null,
    subskillChips: Array.isArray(raw?.subskillChips)
      ? raw.subskillChips.filter((item: unknown) => typeof item === 'string')
      : undefined,
  };
}

function toggleLimited(value: string, current: string[], limit = 3): string[] {
  if (current.includes(value)) return current.filter((item) => item !== value);
  return current.length >= limit ? current : [...current, value];
}

function lessonStatusLabel(status: TeacherEditableLessonStatus): string {
  return status === 'completed' ? 'Ready to move on' : 'Still learning';
}

export default function StudentTopicProgressEditorCanonicalV2({
  kidId,
  kidName,
  enrollmentId,
  courseId,
  onSaveAndBack,
}: StudentTopicProgressEditorProps) {
  const { user } = useAuthStore();
  const routeCourseId = normalizeCourseId(courseId);
  const [configuredTopics, setConfiguredTopics] = useState<TeacherTopic[]>([]);
  const [configLoading, setConfigLoading] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [lockedCourseId, setLockedCourseId] = useState<CourseId | ''>('');
  const [selectedCourseId, setSelectedCourseId] = useState<CourseId | ''>(routeCourseId);
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [lessonStatus, setLessonStatus] = useState<TeacherEditableLessonStatus>('in_progress');
  const [ratings, setRatings] = useState<ProgressRatings>({});
  const [strengths, setStrengths] = useState<string[]>([]);
  const [needsPractice, setNeedsPractice] = useState<string[]>([]);
  const [subskillSelectionSource, setSubskillSelectionSource] = useState<SubskillSelectionSource>('stars');
  const [teacherRemark, setTeacherRemark] = useState('');
  const [baseline, setBaseline] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  const {
    topics: existingTopics,
    loading: existingLoading,
    error: existingError,
    upsertLocalTopic,
  } = useKidTopicProgress(
    kidId,
    selectedCourseId || null,
    Boolean(selectedCourseId && enrollmentId),
    enrollmentId ?? null,
    selectedTopicId || null,
  );

  useEffect(() => {
    if (routeCourseId && !lockedCourseId) setSelectedCourseId(routeCourseId);
  }, [lockedCourseId, routeCourseId]);

  useEffect(() => {
    if (!selectedCourseId || isPhonicsCourseId(selectedCourseId)) {
      setConfigLoading(false);
      setConfigError(null);
      return;
    }

    let active = true;
    const loadConfig = async () => {
      setConfigLoading(true);
      setConfigError(null);
      try {
        const snap = await getDoc(doc(db, 'config', 'curriculumTopics'));
        if (!active) return;
        const rawTopics = snap.exists() && Array.isArray(snap.data()?.topics)
          ? snap.data().topics
          : [];
        setConfiguredTopics(
          rawTopics
            .map((item: any, index: number) => normalizeConfiguredTopic(item, index))
            .filter((item: TeacherTopic | null): item is TeacherTopic => Boolean(item)),
        );
      } catch (error: any) {
        if (!active) return;
        setConfiguredTopics([]);
        setConfigError(error?.message ?? 'Could not load non-phonics curriculum.');
      } finally {
        if (active) setConfigLoading(false);
      }
    };
    void loadConfig();
    return () => {
      active = false;
    };
  }, [selectedCourseId]);

  useEffect(() => {
    if (!enrollmentId) {
      setLockedCourseId('');
      return;
    }
    let active = true;
    const loadEnrollment = async () => {
      try {
        const snap = await getDoc(doc(db, 'enrollments', enrollmentId));
        if (!active || !snap.exists()) return;
        const data = snap.data() as any;
        const resolved = normalizeCourseId(
          data.courseId ?? data.courseName ?? data.courseLabel ?? data.course?.id ?? data.course?.name,
        );
        if (resolved) {
          setLockedCourseId(resolved);
          setSelectedCourseId(resolved);
        }
      } catch (error) {
        console.warn('[StudentTopicProgressEditor] enrollment lookup failed', error);
      }
    };
    void loadEnrollment();
    return () => {
      active = false;
    };
  }, [enrollmentId]);

  const courseTopics = useMemo<TeacherTopic[]>(() => {
    if (!selectedCourseId) return [];
    if (isPhonicsCourseId(selectedCourseId)) {
      return getPhonicsLessons(selectedCourseId).map(canonicalPhonicsTopic);
    }
    return configuredTopics
      .filter((topic) => topic.courseId === selectedCourseId)
      .sort((a, b) => a.order - b.order || a.displayTitle.localeCompare(b.displayTitle));
  }, [configuredTopics, selectedCourseId]);

  useEffect(() => {
    if (!courseTopics.length) {
      setSelectedTopicId('');
      return;
    }
    if (!courseTopics.some((topic) => topic.id === selectedTopicId)) {
      setSelectedTopicId(courseTopics[0].id);
    }
  }, [courseTopics, selectedTopicId]);

  const selectedTopic = useMemo(
    () => courseTopics.find((topic) => topic.id === selectedTopicId) ?? null,
    [courseTopics, selectedTopicId],
  );
  const existing = useMemo(
    () => existingTopics.find((topic) => topic.id === selectedTopicId) ?? null,
    [existingTopics, selectedTopicId],
  );

  const progressSkills = useMemo(() => {
    if (!selectedTopic) return [];
    return getProgressSkillsForLesson({
      courseId: selectedTopic.courseId,
      topicId: selectedTopic.id,
      lessonId: selectedTopic.lesson,
      rubricType: selectedTopic.rubricType,
      stageLabel: selectedTopic.stageLabel,
      lessonTitle: selectedTopic.displayTitle,
      topicLabel: selectedTopic.label,
      area: selectedTopic.area,
      subskillChips: selectedTopic.subskillChips,
      progressSkillsMeta: isPhonicsCourseId(selectedTopic.courseId)
        ? undefined
        : existing?.progressSkillsMeta,
    });
  }, [existing?.progressSkillsMeta, selectedTopic]);

  const starSuggestions = useMemo(
    () => deriveProgressSubskillSuggestions(ratings, progressSkills),
    [progressSkills, ratings],
  );

  useEffect(() => {
    if (!selectedTopic) {
      setLessonStatus('in_progress');
      setRatings({});
      setStrengths([]);
      setNeedsPractice([]);
      setSubskillSelectionSource('stars');
      setTeacherRemark('');
      setBaseline('');
      return;
    }

    const nextLessonStatus = resolveTeacherEditableLessonStatus(existing);
    const baselineLessonStatus = canonicalLessonStatus(existing);
    const nextRatings = normalizeProgressRatings(existing?.progressRatings, progressSkills, {
      legacyRatings: existing?.skillRatings,
      mastery: existing?.masteryKey ?? existing?.mastery,
      checks: (existing as any)?.checks,
    });
    const nextSelection = resolveProgressSubskillSelection({
      progressRatings: nextRatings,
      progressSkills,
      savedSource: (existing as any)?.subskillSelectionSource,
      savedStrengths: (existing as any)?.strengthSubskills,
      savedNeedsPractice: (existing as any)?.needsPracticeSubskills,
    });
    const nextRemark = existing?.teacherRemark ?? '';

    setLessonStatus(nextLessonStatus);
    setRatings(nextRatings);
    setStrengths(nextSelection.strengths);
    setNeedsPractice(nextSelection.needsPractice);
    setSubskillSelectionSource(nextSelection.source);
    setTeacherRemark(nextRemark);
    setLastSavedAt(timestampMs(existing?.updatedAt) || null);
    setSaveMessage(null);
    setBaseline(JSON.stringify({
      lessonStatus: baselineLessonStatus,
      ratings: nextRatings,
      strengths: [...nextSelection.strengths].sort(),
      needsPractice: [...nextSelection.needsPractice].sort(),
      subskillSelectionSource: nextSelection.source,
      teacherRemark: nextRemark,
    }));
  }, [existing, progressSkills, selectedTopic]);

  useEffect(() => {
    if (subskillSelectionSource !== 'stars') return;
    const savedSource = (existing as any)?.subskillSelectionSource;
    const hasLegacySavedSelection = Boolean(existing) && (
      Array.isArray((existing as any)?.strengthSubskills)
      || Array.isArray((existing as any)?.needsPracticeSubskills)
    );
    if (savedSource === 'teacher' || (!savedSource && hasLegacySavedSelection)) return;
    setStrengths(starSuggestions.strengths);
    setNeedsPractice(starSuggestions.needsPractice);
  }, [existing, starSuggestions, subskillSelectionSource]);

  const currentSnapshot = JSON.stringify({
    lessonStatus,
    ratings,
    strengths: [...strengths].sort(),
    needsPractice: [...needsPractice].sort(),
    subskillSelectionSource,
    teacherRemark,
  });
  const isDirty = Boolean(baseline) && currentSnapshot !== baseline;
  const disabled = existingLoading || configLoading || !selectedCourseId || !selectedTopic;

  const handleSave = async (): Promise<boolean> => {
    if (!selectedTopic || !kidId) return false;
    setSaving(true);
    setSaveMessage(null);
    try {
      const actorUid = user?.uid || null;
      const legacy = deriveLegacyProgressFromRatings(ratings, progressSkills);
      const combinedSubskills = Array.from(new Set([...strengths, ...needsPractice]));
      const savedAt = new Date();
      const statusPlan = planTeacherLessonStatusWrite(existing, lessonStatus);
      const statusScalars = buildTeacherLessonStatusScalars(statusPlan, actorUid);
      const statusFirestoreFields: Record<string, any> = {};
      const statusLocalFields: Record<string, any> = {};

      if (statusPlan.statusChanged) {
        statusFirestoreFields.lessonStatusUpdatedAt = serverTimestamp();
        statusLocalFields.lessonStatusUpdatedAt = savedAt;
      } else {
        statusLocalFields.lessonStatusUpdatedAt = (existing as any)?.lessonStatusUpdatedAt ?? null;
      }

      if (statusPlan.setCompletedMetadata) {
        statusFirestoreFields.completedAt = serverTimestamp();
        statusFirestoreFields.completedBy = actorUid;
        statusLocalFields.completedAt = savedAt;
        statusLocalFields.completedBy = actorUid;
      } else if (statusPlan.clearCompletedMetadata) {
        statusFirestoreFields.completedAt = null;
        statusFirestoreFields.completedBy = null;
        statusFirestoreFields.reopenedAt = serverTimestamp();
        statusFirestoreFields.reopenedBy = actorUid;
        statusLocalFields.completedAt = null;
        statusLocalFields.completedBy = null;
        statusLocalFields.reopenedAt = savedAt;
        statusLocalFields.reopenedBy = actorUid;
      } else {
        statusLocalFields.completedAt = (existing as any)?.completedAt ?? null;
        statusLocalFields.completedBy = (existing as any)?.completedBy ?? null;
        statusLocalFields.reopenedAt = (existing as any)?.reopenedAt ?? null;
        statusLocalFields.reopenedBy = (existing as any)?.reopenedBy ?? null;
      }

      const progressData = {
        topicId: selectedTopic.id,
        topicName: selectedTopic.displayTitle,
        area: selectedTopic.area,
        courseId: selectedTopic.courseId,
        courseLabel: COURSE_LABELS[selectedTopic.courseId],
        courseTotalTopics: courseTopics.length,
        lesson: selectedTopic.lesson,
        lessonNumber: selectedTopic.order,
        stageLabel: selectedTopic.stageLabel ?? null,
        stageOrder: selectedTopic.stageOrder ?? null,
        rubricType: selectedTopic.rubricType ?? null,
        curriculumRevision: isPhonicsCourseId(selectedTopic.courseId)
          ? PHONICS_CURRICULUM_REVISION
          : null,
        progressRatings: ratings,
        progressRatingsMeta: progressSkills.map((skill) => ({
          key: skill.key,
          label: skill.label,
          area: skill.area,
        })),
        mastery: legacy.mastery,
        checks: legacy.checks,
        strengthSubskills: [...strengths].sort(),
        needsPracticeSubskills: [...needsPractice].sort(),
        selectedSubskills: [...combinedSubskills].sort(),
        subskillSelectionSource,
        teacherRemark: teacherRemark || null,
        enrollmentId: enrollmentId || null,
        updatedBy: actorUid,
        updatedByRole: String((user as any)?.role || 'teacher').trim().toLowerCase(),
        source: 'teacher_topic_progress',
        ...statusScalars,
      };

      await setDoc(
        doc(db, 'students', kidId, 'progress', selectedTopic.id),
        {
          ...progressData,
          ...statusFirestoreFields,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      upsertLocalTopic({
        id: selectedTopic.id,
        ...progressData,
        ...statusLocalFields,
        updatedAt: savedAt,
      });
      setBaseline(currentSnapshot);
      setLastSavedAt(savedAt.getTime());
      setSaveMessage('Lesson progress saved. This lesson counts once in curriculum progress.');
      return true;
    } catch (error: any) {
      setSaveMessage(error?.message ?? 'Could not save progress. Please try again.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndNext = async () => {
    const ok = await handleSave();
    if (!ok) return;
    const index = courseTopics.findIndex((topic) => topic.id === selectedTopicId);
    if (index >= 0 && index < courseTopics.length - 1) {
      setSelectedTopicId(courseTopics[index + 1].id);
    }
  };

  const stageGroups = useMemo(() => {
    const groups = new Map<string, TeacherTopic[]>();
    courseTopics.forEach((topic) => {
      const key = topic.stageLabel || 'Lessons';
      const existingGroup = groups.get(key) ?? [];
      existingGroup.push(topic);
      groups.set(key, existingGroup);
    });
    return Array.from(groups.entries());
  }, [courseTopics]);

  const chipLabels = progressSkills.map((skill) => skill.label);
  const lastCourseTopicId = courseTopics.length > 0
    ? courseTopics[courseTopics.length - 1].id
    : null;

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-slate-900">{kidName || 'Student'} • Lesson Progress</div>
          <div className="text-xs text-slate-500">
            Select the lesson taught today, update the child&apos;s learning status and skills, then save.
          </div>
        </div>
        {saveMessage ? (
          <span className={saveMessage.toLowerCase().includes('could not') ? 'text-xs text-red-600' : 'text-xs text-emerald-600'}>
            {saveMessage}
          </span>
        ) : null}
      </div>

      {existingError ? <p className="text-xs text-red-600">Couldn&apos;t load progress: {existingError}</p> : null}
      {configError ? <p className="text-xs text-amber-700">Non-phonics curriculum: {configError}</p> : null}

      <div className="grid gap-2 rounded-xl border border-sky-200 bg-sky-50/60 p-3 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-700">
          Course {lockedCourseId ? <span className="font-normal text-emerald-700">(locked to enrollment)</span> : null}
          <select
            className="h-10 rounded-lg border border-slate-300 bg-white px-2 text-sm"
            value={selectedCourseId}
            disabled={Boolean(lockedCourseId) || saving}
            onChange={(event) => setSelectedCourseId(event.target.value as CourseId)}
          >
            <option value="">Select course</option>
            {COURSE_OPTIONS.map((course) => (
              <option key={course.id} value={course.id}>{course.label}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-700">
          Lesson
          <select
            className="h-10 rounded-lg border border-slate-300 bg-white px-2 text-sm"
            value={selectedTopicId}
            disabled={disabled || saving}
            onChange={(event) => setSelectedTopicId(event.target.value)}
          >
            {courseTopics.length === 0 ? <option value="">No lessons configured</option> : null}
            {stageGroups.map(([stage, topics]) => (
              <optgroup key={stage} label={stage}>
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>{topic.displayTitle}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
      </div>

      {selectedTopic ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current lesson</div>
          <div className="mt-0.5 font-semibold text-slate-900">{selectedTopic.displayTitle}</div>
          {isPhonicsCourseId(selectedTopic.courseId) ? (
            <div className="mt-0.5 text-[11px] text-slate-500">Curriculum revision {PHONICS_CURRICULUM_REVISION}</div>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-violet-800">Learning status</div>
            <p className="mt-1 text-xs text-violet-900/80">
              Saving records this lesson once in curriculum progress. Use this status and the skill stars to show how the child is progressing; both can be updated later.
            </p>
          </div>
          <span className="rounded-full border border-violet-200 bg-white px-2.5 py-1 text-xs font-semibold text-violet-800">
            {lessonStatusLabel(lessonStatus)}
          </span>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            disabled={disabled || saving}
            onClick={() => setLessonStatus('in_progress')}
            className={`rounded-lg border px-3 py-2 text-left ${
              lessonStatus === 'in_progress'
                ? 'border-amber-500 bg-amber-50 text-amber-950'
                : 'border-slate-300 bg-white text-slate-700'
            }`}
          >
            <div className="text-xs font-semibold">Still learning</div>
            <div className="mt-0.5 text-[11px] opacity-80">The lesson was taught; the child still needs more teaching or practice.</div>
          </button>
          <button
            type="button"
            disabled={disabled || saving}
            onClick={() => setLessonStatus('completed')}
            className={`rounded-lg border px-3 py-2 text-left ${
              lessonStatus === 'completed'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-950'
                : 'border-slate-300 bg-white text-slate-700'
            }`}
          >
            <div className="text-xs font-semibold">Ready to move on</div>
            <div className="mt-0.5 text-[11px] opacity-80">The lesson was taught and the child is ready to continue to the next learning step.</div>
          </button>
        </div>
      </div>

      <ChildSkillRatingCard
        title="Child Progress"
        subtitle="Mark stars for each skill after the lesson."
        skills={progressSkills}
        values={ratings}
        onChange={disabled ? undefined : (key, value) => setRatings((prev) => ({ ...prev, [key]: value }))}
        compact
      />

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
        <span>
          {subskillSelectionSource === 'stars'
            ? 'Strengths and practice are suggested from the skill stars.'
            : 'Strengths and practice were adjusted by the teacher.'}
        </span>
        {subskillSelectionSource === 'teacher' ? (
          <button
            type="button"
            disabled={disabled}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 font-semibold text-slate-700 disabled:opacity-50"
            onClick={() => {
              setSubskillSelectionSource('stars');
              setStrengths(starSuggestions.strengths);
              setNeedsPractice(starSuggestions.needsPractice);
            }}
          >
            Use star suggestions
          </button>
        ) : null}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-800">Strengths</div>
          <div className="flex flex-wrap gap-1.5">
            {chipLabels.map((label) => {
              const active = strengths.includes(label);
              return (
                <button
                  type="button"
                  key={`strength-${label}`}
                  disabled={disabled}
                  onClick={() => {
                    setSubskillSelectionSource('teacher');
                    setStrengths((current) => toggleLimited(label, current));
                    setNeedsPractice((current) => current.filter((item) => item !== label));
                  }}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                    active
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-emerald-200 bg-white text-emerald-900'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-800">Needs practice</div>
          <div className="flex flex-wrap gap-1.5">
            {chipLabels.map((label) => {
              const active = needsPractice.includes(label);
              return (
                <button
                  type="button"
                  key={`practice-${label}`}
                  disabled={disabled}
                  onClick={() => {
                    setSubskillSelectionSource('teacher');
                    setNeedsPractice((current) => toggleLimited(label, current));
                    setStrengths((current) => current.filter((item) => item !== label));
                  }}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                    active
                      ? 'border-amber-600 bg-amber-600 text-white'
                      : 'border-amber-200 bg-white text-amber-900'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <label className="block space-y-1 text-xs font-semibold text-slate-700">
        Teacher note for parent
        <textarea
          rows={3}
          className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal"
          value={teacherRemark}
          disabled={disabled}
          placeholder="Write one short note about today&apos;s progress."
          onChange={(event) => setTeacherRemark(event.target.value)}
        />
      </label>

      <div className="sticky bottom-0 -mx-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white/95 px-3 py-2 backdrop-blur">
        <div className="text-[11px] text-slate-500">
          {isDirty ? 'Unsaved changes' : 'All changes saved'}
          <span className="ml-2">• Last saved: {lastSavedAt ? new Date(lastSavedAt).toLocaleString() : '—'}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50"
            disabled={disabled || saving || !isDirty}
            onClick={() => void handleSave()}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          {onSaveAndBack ? (
            <button
              type="button"
              className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
              disabled={disabled || saving || !isDirty}
              onClick={() => void handleSave().then((ok) => ok && onSaveAndBack())}
            >
              Save & Back
            </button>
          ) : null}
          <button
            type="button"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50"
            disabled={disabled || saving || !isDirty || lastCourseTopicId === selectedTopicId}
            onClick={() => void handleSaveAndNext()}
          >
            Save & Next
          </button>
        </div>
      </div>
    </div>
  );
}
