import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpenCheck,
  CheckCircle2,
  ChevronDown,
  Circle,
  GraduationCap,
  Info,
} from "lucide-react";

import { cn } from "@/components/lib/utils";
import { useLatestActiveChildCourseProgressProjection } from "../../../../hooks/useChildCourseProgressProjection";
import {
  buildCanonicalParentInsightStages,
  getParentInsightStageStateLabel,
  type ParentInsightCourseOption,
  type ParentInsightProgressState,
  type ParentInsightStageDisplay,
  type ParentInsightTeacherDisplay,
} from "./parentInsightsPresentation";

type ParentInsightsViewProps = {
  isNativeIOSApp: boolean;
  childSelected: boolean;
  courseOptions: ParentInsightCourseOption[];
  selectedCourseId: string;
  selectedCourseLabel: string;
  progressState: ParentInsightProgressState;
  completedLessons: number | null;
  totalLessons: number | null;
  completionPct: number | null;
  completedStages: number | null;
  lastUpdatedLabel: string;
  usesLatestLessonFallback: boolean;
  stages: ParentInsightStageDisplay[];
  activeStage: ParentInsightStageDisplay | null;
  nextStage: ParentInsightStageDisplay | null;
  teacherInsight: ParentInsightTeacherDisplay | null;
  teacherInsightLoading: boolean;
  errorMessage: string | null;
  contextKey: string;
  onCourseChange: (courseId: string) => void;
  onViewTeacherRatings: () => void;
  onSelectionFeedback?: () => void;
};

function normalizeCourseId(value: unknown): string {
  const raw = String(value ?? '').trim().toLowerCase();
  if (!raw) return '';
  const aliases: Record<string, string> = {
    'phonics-foundation': 'phonics-foundations',
    foundational: 'phonics-foundations',
    foundation: 'phonics-foundations',
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
  return aliases[raw] || raw;
}

function ParentInsightsSkeleton() {
  return (
    <div role="status" aria-label="Loading learning insights" className="space-y-4">
      <span className="sr-only">Loading learning insights…</span>
      <div className="rounded-[20px] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="h-4 w-36 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-4 h-8 w-24 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-3 h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800" />
      </div>
      <div className="rounded-[20px] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-3 h-6 w-52 max-w-full rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-3 h-14 rounded-xl bg-slate-100 dark:bg-slate-800" />
      </div>
    </div>
  );
}

function CourseIdentity({
  courseOptions,
  selectedCourseId,
  selectedCourseLabel,
  onCourseChange,
}: Pick<
  ParentInsightsViewProps,
  "courseOptions" | "selectedCourseId" | "selectedCourseLabel" | "onCourseChange"
>) {
  if (courseOptions.length === 1) {
    return (
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current course</p>
        <p className="mt-1 break-words text-base font-semibold text-slate-950 dark:text-slate-100">
          {selectedCourseLabel}
        </p>
      </div>
    );
  }

  return (
    <label className="block min-w-0">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Current course
      </span>
      <select
        aria-label="Current course"
        value={selectedCourseId}
        onChange={(event) => onCourseChange(event.target.value)}
        className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-950 outline-none focus-visible:ring-2 focus-visible:ring-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      >
        {courseOptions.map((course) => (
          <option key={course.courseId} value={course.courseId}>
            {course.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function CourseProgressSummary({
  completedLessons,
  totalLessons,
  completionPct,
  completedStages,
  lastUpdatedLabel,
  usesLatestLessonFallback,
  hasLearningActivityAwaitingCompletion,
}: Pick<
  ParentInsightsViewProps,
  | "completedLessons"
  | "totalLessons"
  | "completionPct"
  | "completedStages"
  | "lastUpdatedLabel"
  | "usesLatestLessonFallback"
> & { hasLearningActivityAwaitingCompletion: boolean }) {
  const progressAvailable = typeof completionPct === "number";
  const progressWidth = progressAvailable
    ? Math.max(0, Math.min(100, completionPct))
    : 0;

  return (
    <section
      aria-labelledby="parent-course-progress-title"
      className="rounded-[20px] border border-indigo-100 bg-white p-4 shadow-sm dark:border-indigo-900/60 dark:bg-slate-900"
    >
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 id="parent-course-progress-title" className="text-sm font-semibold text-slate-950 dark:text-slate-100">
            Current-course progress
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {completedLessons !== null && totalLessons !== null
              ? `${completedLessons}/${totalLessons} lessons completed`
              : "Lesson completion is unavailable"}
          </p>
        </div>
        <p className="shrink-0 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
          {progressAvailable ? `${completionPct}%` : "Unavailable"}
        </p>
      </div>
      {progressAvailable ? (
        <div
          role="progressbar"
          aria-label="Current-course progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={completionPct}
          className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
        >
          <div className="h-full rounded-full bg-indigo-600 dark:bg-indigo-400" style={{ width: `${progressWidth}%` }} />
        </div>
      ) : (
        <div role="status" className="mt-3 h-2.5 rounded-full bg-slate-100 dark:bg-slate-800">
          <span className="sr-only">Current-course progress is unavailable.</span>
        </div>
      )}

      {hasLearningActivityAwaitingCompletion ? (
        <div
          role="note"
          data-testid="parent-progress-unconfirmed-activity"
          className="mt-3 flex gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            Some lessons have teacher learning activity recorded but are not explicitly marked completed yet. Completion percentage stays based only on teacher lesson status.
          </p>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-200 pt-3 text-xs text-slate-500 dark:border-slate-700">
        {completedStages !== null ? <span>{completedStages} completed stages</span> : null}
        {lastUpdatedLabel ? <span>Updated {lastUpdatedLabel}</span> : null}
        {usesLatestLessonFallback ? <span>Based on the latest available lesson progress</span> : null}
      </div>
    </section>
  );
}

function CurrentStageCard({ stage }: { stage: ParentInsightStageDisplay }) {
  const progressWidth = typeof stage.progressPct === "number"
    ? Math.max(0, Math.min(100, stage.progressPct))
    : 0;

  return (
    <section
      aria-labelledby="parent-current-stage-title"
      aria-current="step"
      className="rounded-[20px] border border-violet-200 bg-violet-50/35 p-4 shadow-sm dark:border-violet-900/70 dark:bg-violet-950/20"
      data-testid="parent-current-stage"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Learning now · Stage {stage.order}</p>
      <h2 id="parent-current-stage-title" className="mt-1 break-words text-xl font-semibold text-slate-950 dark:text-slate-100">
        {stage.label}
      </h2>
      {stage.hint ? <p className="mt-2 text-sm leading-5 text-slate-600 dark:text-slate-300">{stage.hint}</p> : null}
      {stage.progressPct !== null ? (
        <div className="mt-4">
          <div className="flex justify-between gap-3 text-xs text-slate-500">
            <span>Lesson completion</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">{stage.progressPct}%</span>
          </div>
          <div
            role="progressbar"
            aria-label={`${stage.label} lesson completion`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={stage.progressPct}
            className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
          >
            <div className="h-full rounded-full bg-violet-600 dark:bg-violet-400" style={{ width: `${progressWidth}%` }} />
          </div>
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        {stage.completedCount !== null && stage.totalCount !== null ? (
          <span>{stage.completedCount}/{stage.totalCount} lessons completed</span>
        ) : null}
      </div>
      {stage.focusItems.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Teacher learning focus</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {stage.focusItems.slice(0, 2).map((item) => (
              <span key={item} className="rounded-full bg-violet-100/80 px-2.5 py-1 text-xs text-violet-900 dark:bg-violet-950/60 dark:text-violet-200">
                {item}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function StageJourney({
  stages,
  activeStage,
  contextKey,
  onSelectionFeedback,
}: Pick<ParentInsightsViewProps, "stages" | "activeStage" | "contextKey" | "onSelectionFeedback">) {
  const defaultExpandedKey = activeStage?.key ?? stages[0]?.key ?? null;
  const [expandedKey, setExpandedKey] = useState<string | null>(defaultExpandedKey);
  const previousContextKey = useRef(contextKey);

  useEffect(() => {
    const nextKey = activeStage?.key ?? stages[0]?.key ?? null;
    if (previousContextKey.current !== contextKey) {
      previousContextKey.current = contextKey;
      setExpandedKey(nextKey);
      return;
    }
    setExpandedKey((current) => (
      current && stages.some((stage) => stage.key === current) ? current : nextKey
    ));
  }, [activeStage?.key, contextKey, stages]);

  return (
    <section aria-labelledby="parent-stage-journey-title">
      <h2 id="parent-stage-journey-title" className="text-base font-semibold text-slate-950 dark:text-slate-100">
        Learning journey
      </h2>
      <ol className="mt-2 overflow-hidden rounded-[20px] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {stages.map((stage) => {
          const expanded = expandedKey === stage.key;
          const panelId = `parent-insight-stage-${encodeURIComponent(stage.key)}`;
          const stateLabel = getParentInsightStageStateLabel(stage.state);
          const historical = stage.state === "completed";
          return (
            <li
              key={stage.key}
              data-stage-key={stage.key}
              data-stage-state={stage.state}
              className={cn("border-b border-slate-200 last:border-b-0 dark:border-slate-800", historical && "bg-slate-50/70 dark:bg-slate-900/60")}
            >
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => {
                  onSelectionFeedback?.();
                  setExpandedKey((current) => current === stage.key ? null : stage.key);
                }}
                className="flex min-h-14 w-full min-w-0 items-center gap-3 px-4 py-3 text-left outline-none transition hover:bg-slate-50 active:bg-slate-100 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-600 dark:hover:bg-slate-800/60 dark:active:bg-slate-800"
              >
                {stage.state === "completed" ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                ) : (
                  <Circle className={cn("h-5 w-5 shrink-0", stage.state === "current" ? "fill-violet-600 text-violet-600 dark:fill-violet-400 dark:text-violet-400" : "text-slate-300 dark:text-slate-600")} aria-hidden="true" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-xs text-slate-500">Stage {stage.order} · {stateLabel}</span>
                  <span className="mt-0.5 block break-words text-sm font-semibold text-slate-900 dark:text-slate-100">{stage.label}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    {stage.progressPct !== null ? `${stage.progressPct}% lesson completion` : "Progress unavailable"}
                    {stage.completedCount !== null && stage.totalCount !== null
                      ? ` · ${stage.completedCount}/${stage.totalCount} lessons`
                      : ""}
                  </span>
                </span>
                <ChevronDown className={cn("h-4 w-4 shrink-0 text-slate-400 transition-transform motion-reduce:transition-none", expanded && "rotate-180")} aria-hidden="true" />
              </button>
              <div id={panelId} hidden={!expanded} className="border-t border-slate-100 px-4 py-4 dark:border-slate-800">
                {stage.hint ? <p className="text-sm leading-5 text-slate-600 dark:text-slate-300">{stage.hint}</p> : null}
                {stage.expectations.length > 0 ? (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">What to expect</p>
                    <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                      {stage.expectations.map((expectation) => <li key={expectation}>• {expectation}</li>)}
                    </ul>
                  </div>
                ) : null}
                {stage.focusItems.length > 0 ? (
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">Teacher learning focus:</span>{" "}
                    {stage.focusItems.join(" · ")}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function TeacherInsightSummary({
  teacherInsight,
  loading,
  onViewTeacherRatings,
}: {
  teacherInsight: ParentInsightTeacherDisplay | null;
  loading: boolean;
  onViewTeacherRatings: () => void;
}) {
  return (
    <section aria-labelledby="parent-teacher-insight-title" className="rounded-[20px] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="parent-teacher-insight-title" className="text-sm font-semibold text-slate-950 dark:text-slate-100">Latest teacher insight</h2>
          <p className="mt-1 text-xs text-slate-500">A concise view of the latest published rating.</p>
        </div>
        <button type="button" onClick={onViewTeacherRatings} className="min-h-11 shrink-0 rounded-xl border border-slate-300 px-3 text-sm font-semibold text-slate-800 outline-none active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-slate-600 dark:border-slate-700 dark:text-slate-100">
          View teacher ratings
        </button>
      </div>
      {loading ? (
        <div role="status" aria-label="Loading teacher insight" className="mt-4 h-14 rounded-xl bg-slate-100 dark:bg-slate-800" />
      ) : teacherInsight ? (
        <div className="mt-4">
          <p className="break-words text-sm font-semibold text-slate-900 dark:text-slate-100">{teacherInsight.lessonLabel}</p>
          <p className="mt-1 text-xs text-slate-500">
            {teacherInsight.contextLabel}{teacherInsight.updatedLabel ? ` · ${teacherInsight.updatedLabel}` : ""}
          </p>
          {teacherInsight.ratingValue !== null ? (
            <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
              {teacherInsight.ratingValue.toFixed(1)}/4 · {teacherInsight.ratingLabel}
            </p>
          ) : null}
          {teacherInsight.note ? (
            <blockquote className="mt-3 line-clamp-3 border-l-2 border-slate-300 pl-3 text-sm leading-5 text-slate-600 dark:border-slate-600 dark:text-slate-300">
              {teacherInsight.note}
            </blockquote>
          ) : null}
        </div>
      ) : (
        <p role="status" className="mt-4 text-sm text-slate-600 dark:text-slate-300">
          Teacher ratings will appear here after a lesson is reviewed.
        </p>
      )}
    </section>
  );
}

export default function ParentInsightsView(props: ParentInsightsViewProps) {
  const {
    isNativeIOSApp,
    childSelected,
    courseOptions,
    selectedCourseId,
    selectedCourseLabel,
    progressState,
    completedLessons,
    totalLessons,
    completionPct,
    completedStages,
    lastUpdatedLabel,
    usesLatestLessonFallback,
    stages,
    activeStage,
    nextStage,
    teacherInsight,
    teacherInsightLoading,
    errorMessage,
    contextKey,
    onCourseChange,
    onViewTeacherRatings,
    onSelectionFeedback,
  } = props;

  const activeProjection = useLatestActiveChildCourseProgressProjection(childSelected);
  const canonicalProjectionMatchesCourse = Boolean(
    activeProjection.data
    && normalizeCourseId(activeProjection.courseId || activeProjection.data.courseId) === normalizeCourseId(selectedCourseId),
  );
  const canonicalStageResult = useMemo(
    () => canonicalProjectionMatchesCourse
      ? buildCanonicalParentInsightStages({
          projection: activeProjection.data,
          expectedCourseId: selectedCourseId,
          presentationStages: stages,
        })
      : null,
    [activeProjection.data, canonicalProjectionMatchesCourse, selectedCourseId, stages],
  );

  const canonicalProjection = canonicalProjectionMatchesCourse ? activeProjection.data : null;
  const effectiveStages = canonicalStageResult?.stages ?? stages;
  const effectiveActiveStage = canonicalStageResult?.activeStage ?? activeStage;
  const effectiveNextStage = canonicalStageResult?.nextStage ?? nextStage;
  const effectiveCompletedLessons = canonicalProjection
    ? Number(canonicalProjection.completedTopics ?? 0)
    : completedLessons;
  const effectiveTotalLessons = canonicalProjection
    ? Number(canonicalProjection.totalTopics ?? 0)
    : totalLessons;
  const effectiveCompletionPct = canonicalProjection
    ? Number(canonicalProjection.overallPct ?? 0)
    : completionPct;
  const effectiveCompletedStages = canonicalProjection
    ? Number(canonicalProjection.completedStages ?? 0)
    : completedStages;
  const effectiveProgressState: ParentInsightProgressState = canonicalStageResult
    ? 'available'
    : progressState;
  const hasLearningActivityAwaitingCompletion = Boolean(
    canonicalProjection
    && Number(canonicalProjection.inProgressTopics ?? 0) > 0,
  );

  return (
    <div className="min-w-0 space-y-4 overflow-x-hidden pb-2" data-testid="parent-insights-view">
      <header className={isNativeIOSApp ? "sr-only" : ""}>
        <h1 className="text-xl font-semibold text-slate-950 dark:text-slate-100">Insights</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">A concise view of the current learning journey.</p>
      </header>

      {effectiveProgressState === "loading" ? (
        <ParentInsightsSkeleton />
      ) : errorMessage ? (
        <div role="alert" className="rounded-[20px] border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
          {errorMessage}
        </div>
      ) : !childSelected ? (
        <div role="status" className="rounded-[20px] border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          Select a child to view learning insights.
        </div>
      ) : courseOptions.length === 0 ? (
        <div role="status" className="rounded-[20px] border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          Learning insights will appear once a course is assigned.
        </div>
      ) : (
        <>
          <section className="rounded-[20px] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <CourseIdentity
              courseOptions={courseOptions}
              selectedCourseId={selectedCourseId}
              selectedCourseLabel={selectedCourseLabel}
              onCourseChange={onCourseChange}
            />
          </section>

          {effectiveProgressState === "unavailable" ? (
            <div role="status" className="rounded-[20px] border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              This course is assigned, but its curriculum breakdown is not available yet.
            </div>
          ) : (
            <>
              <CourseProgressSummary
                completedLessons={effectiveCompletedLessons}
                totalLessons={effectiveTotalLessons}
                completionPct={effectiveCompletionPct}
                completedStages={effectiveCompletedStages}
                lastUpdatedLabel={lastUpdatedLabel}
                usesLatestLessonFallback={canonicalProjection ? false : usesLatestLessonFallback}
                hasLearningActivityAwaitingCompletion={hasLearningActivityAwaitingCompletion}
              />
              {effectiveActiveStage ? (
                <CurrentStageCard stage={effectiveActiveStage} />
              ) : (
                <div role="status" className="rounded-[20px] border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                  A stage breakdown is not available for this course yet.
                </div>
              )}

              <section aria-labelledby="parent-now-next-title" className="rounded-[20px] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <h2 id="parent-now-next-title" className="text-sm font-semibold text-slate-950 dark:text-slate-100">Now and next</h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="flex gap-3">
                    <BookOpenCheck className="mt-0.5 h-5 w-5 shrink-0 text-slate-600" aria-hidden="true" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Learning now</p>
                      <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                        {effectiveActiveStage?.focusItems.length ? effectiveActiveStage.focusItems.join(" · ") : effectiveActiveStage?.label || "Current focus will appear here."}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-slate-600" aria-hidden="true" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Coming next</p>
                      <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                        {effectiveNextStage ? `Stage ${effectiveNextStage.order} — ${effectiveNextStage.label}` : "No next stage is available in this course."}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <TeacherInsightSummary
                teacherInsight={teacherInsight}
                loading={teacherInsightLoading}
                onViewTeacherRatings={onViewTeacherRatings}
              />

              {effectiveStages.length > 0 ? (
                <StageJourney
                  stages={effectiveStages}
                  activeStage={effectiveActiveStage}
                  contextKey={`${contextKey}::${canonicalProjection ? 'p3' : 'legacy'}`}
                  onSelectionFeedback={onSelectionFeedback}
                />
              ) : null}
            </>
          )}
        </>
      )}
    </div>
  );
}