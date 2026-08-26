import { useEffect, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  ClipboardList,
  MessageSquareText,
  Sparkles,
  Star,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { hapticSelection } from "../../../../lib/nativeHaptics";
import {
  SKILL_RATING_MAX,
  skillRatingLegendLabel,
} from "../../../../lib/skillRatings";
import {
  consolidateParentSkillUpdates,
  type ParentSkillRatingDisplay,
  type ParentSkillsLesson,
  type ParentSkillsStage,
  type ParentSkillUpdate,
} from "./parentSkillsPresentation";

type ParentSkillsViewProps = {
  isNativeIOSApp: boolean;
  childName: string | null;
  loading: boolean;
  error: string | null;
  courses: Array<{ id: string; label: string }>;
  selectedCourseId: string;
  lessons: ParentSkillsLesson[];
  recentAverage: number | null;
  recentAverageLabel: string | null;
  ratedLessonCount: number;
  strengths: string[];
  practiceAreas: string[];
  stages: ParentSkillsStage[];
  recentUpdates: ParentSkillUpdate[];
  onCourseChange: (courseId: string) => void;
  onOpenLesson: (lesson: ParentSkillsLesson) => void;
};

const formatDate = (timestamp: number): string =>
  new Date(timestamp).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

function ParentSkillsSkeleton() {
  return (
    <div role="status" aria-label="Loading teacher feedback" className="space-y-4">
      <span className="sr-only">Loading teacher feedback…</span>
      <div className="rounded-[20px] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="h-3 w-32 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-3 h-6 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-4 h-16 rounded-xl bg-slate-100 dark:bg-slate-800" />
      </div>
      <div className="rounded-[20px] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        {[0, 1, 2].map((slot) => (
          <div key={slot} className="border-b border-slate-100 py-4 last:border-0 dark:border-slate-800">
            <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="mt-2 h-3 w-1/3 rounded bg-slate-100 dark:bg-slate-800" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ParentReadOnlySkillRatings({ entries }: { entries: ParentSkillRatingDisplay[] }) {
  return (
    <div className="grid min-w-0 gap-2 sm:grid-cols-2" data-testid="parent-read-only-skill-ratings">
      {entries.map((entry) => (
        <div
          key={entry.key}
          aria-label={`${entry.label}: ${
            entry.value === null ? entry.text : `${entry.value} of ${SKILL_RATING_MAX}, ${entry.text}`
          }`}
          className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900"
        >
          <p className="break-words text-sm font-semibold leading-5 text-slate-900 dark:text-slate-100">
            {entry.label}
          </p>
          <div aria-hidden="true" className="mt-2 flex items-center gap-1">
            {Array.from({ length: SKILL_RATING_MAX }, (_, index) => (
              <Star
                key={`${entry.key}-${index + 1}`}
                className={`h-3.5 w-3.5 ${
                  entry.value !== null && index + 1 <= entry.value
                    ? "fill-amber-200 text-amber-500"
                    : "fill-transparent text-slate-300 dark:text-slate-600"
                }`}
              />
            ))}
          </div>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{entry.text}</p>
        </div>
      ))}
    </div>
  );
}

function SkillChips({
  title,
  values,
  tone,
}: {
  title: string;
  values: string[];
  tone: "strength" | "practice";
}) {
  const strength = tone === "strength";
  return (
    <div>
      <h3 className={`text-sm font-semibold ${strength ? "text-emerald-800 dark:text-emerald-300" : "text-amber-800 dark:text-amber-300"}`}>
        {title}
      </h3>
      {values.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {values.map((value) => (
            <span
              key={`${tone}-${value}`}
              className={`break-words rounded-full border px-2.5 py-1 text-xs font-medium ${
                strength
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"
                  : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
              }`}
            >
              {value}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {strength
            ? "No strength areas are available in the current teacher feedback."
            : "No practice areas are available in the current teacher feedback."}
        </p>
      )}
    </div>
  );
}

export default function ParentSkillsView({
  isNativeIOSApp,
  childName,
  loading,
  error,
  courses,
  selectedCourseId,
  lessons,
  recentAverage,
  recentAverageLabel,
  ratedLessonCount,
  strengths,
  practiceAreas,
  stages,
  recentUpdates,
  onCourseChange,
  onOpenLesson,
}: ParentSkillsViewProps) {
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);
  const [expandedStageId, setExpandedStageId] = useState<string | null>(null);
  const contextKey = `${childName || "none"}__${selectedCourseId || "none"}`;

  useEffect(() => {
    setExpandedLessonId(null);
    setExpandedStageId(null);
  }, [contextKey]);

  useEffect(() => {
    if (expandedLessonId && !lessons.some((lesson) => lesson.id === expandedLessonId)) {
      setExpandedLessonId(null);
    }
  }, [expandedLessonId, lessons]);

  if (!childName) {
    return (
      <section className="rounded-[20px] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-lg font-semibold text-slate-950 dark:text-slate-100">Teacher feedback</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Select a child to view lesson ratings and teacher notes.
        </p>
      </section>
    );
  }
  if (loading) return <ParentSkillsSkeleton />;
  if (error) {
    return (
      <section role="alert" className="rounded-[20px] border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/20">
        <h1 className="text-lg font-semibold text-red-900 dark:text-red-100">Teacher feedback is unavailable</h1>
        <p className="mt-2 text-sm text-red-700 dark:text-red-200">{error}</p>
      </section>
    );
  }

  const selectedCourse = courses.find((course) => course.id === selectedCourseId) ?? courses[0] ?? null;
  const latestLesson = lessons[0] ?? null;
  const consolidatedRecentUpdates = consolidateParentSkillUpdates(recentUpdates);

  return (
    <div className="min-w-0 space-y-4 overflow-x-hidden pb-2" data-testid="parent-skills-view">
      <header className={isNativeIOSApp ? "sr-only" : ""}>
        <h1 className="text-xl font-semibold text-slate-950 dark:text-slate-100">Teacher feedback</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Lesson ratings and observations shared by your child&apos;s teacher.
        </p>
      </header>

      <section aria-labelledby="latest-teacher-feedback-title" className="rounded-[20px] border border-emerald-100 border-t-2 border-t-emerald-500 bg-white p-4 shadow-sm dark:border-emerald-900/60 dark:border-t-emerald-400 dark:bg-slate-900">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{childName}</p>
            <h2 id="latest-teacher-feedback-title" className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-100">
              Latest teacher feedback
            </h2>
          </div>
          {courses.length > 1 ? (
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Course
              <select
                aria-label="Teacher feedback course"
                value={selectedCourseId}
                onChange={(event) => {
                  hapticSelection();
                  onCourseChange(event.target.value);
                }}
                className="mt-1 min-h-11 max-w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>{course.label}</option>
                ))}
              </select>
            </label>
          ) : (
            <p className="break-words text-sm font-medium text-slate-600 dark:text-slate-300">
              {selectedCourse?.label || "Course context unavailable"}
            </p>
          )}
        </div>

        {latestLesson ? (
          <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-words text-base font-semibold text-slate-950 dark:text-slate-100">{latestLesson.label}</p>
                <p className="mt-1 break-words text-xs text-slate-500 dark:text-slate-400">
                  {[latestLesson.courseLabel || "Course context unavailable", latestLesson.stageLabel].filter(Boolean).join(" · ")}
                </p>
                {latestLesson.updatedAtMs ? (
                  <time dateTime={new Date(latestLesson.updatedAtMs).toISOString()} className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                    Updated {formatDate(latestLesson.updatedAtMs)}
                  </time>
                ) : null}
              </div>
              <div className="shrink-0 text-right">
                {latestLesson.ratedSkillCount > 0 ? (
                  <>
                    <p className="text-xl font-semibold text-slate-950 dark:text-slate-50">{latestLesson.averageRating.toFixed(1)}/4</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{skillRatingLegendLabel(latestLesson.roundedAverageRating)}</p>
                  </>
                ) : (
                  <p className="max-w-28 text-xs font-semibold text-slate-600 dark:text-slate-300">{latestLesson.ratingStateLabel}</p>
                )}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
              <span>{latestLesson.ratedSkillCount}/{latestLesson.totalSkillCount} positive skill ratings</span>
              <span>{latestLesson.ratingStateLabel}</span>
            </div>
            {latestLesson.remark ? (
              <p className="mt-3 line-clamp-3 whitespace-pre-line break-words text-sm leading-5 text-slate-700 dark:text-slate-200">
                <span className="font-semibold">Teacher note:</span> {latestLesson.remark}
              </p>
            ) : (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No teacher note was added for this lesson.</p>
            )}
            <Button
              type="button"
              variant="outline"
              aria-label={`Open ${latestLesson.label} details`}
              onClick={() => onOpenLesson(latestLesson)}
              className="mt-4 min-h-11 rounded-xl"
            >
              <BookOpen className="mr-2 h-4 w-4" aria-hidden="true" />
              Open {latestLesson.label} details
            </Button>
          </div>
        ) : (
          <p className="mt-4 border-t border-slate-200 pt-4 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
            No teacher-rated lessons are available for {selectedCourse?.label || "this course"} yet.
          </p>
        )}

        <div className="mt-4 grid gap-3 border-t border-slate-200 pt-4 sm:grid-cols-3 dark:border-slate-800">
          <div>
            <p className="text-xs text-slate-500">Recent teacher average</p>
            <p className="mt-1 text-base font-semibold text-slate-950 dark:text-slate-100">
              {recentAverage === null ? "No positive ratings yet" : `${recentAverage.toFixed(1)}/4`}
            </p>
            {recentAverageLabel ? <p className="text-xs text-slate-500">{recentAverageLabel}</p> : null}
          </div>
          <SkillChips title="Strengths observed" values={strengths} tone="strength" />
          <SkillChips title="Practice areas" values={practiceAreas} tone="practice" />
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Based on {ratedLessonCount} recent {ratedLessonCount === 1 ? "lesson" : "lessons"} with positive teacher ratings. Scale: 0 Not started, 1 Emerging, 2 Developing, 3 Proficient, 4 Mastered.
        </p>
      </section>

      <section aria-labelledby="lesson-rating-history-title" className="rounded-[20px] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 id="lesson-rating-history-title" className="text-base font-semibold text-slate-950 dark:text-slate-100">Lesson rating history</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{lessons.length} recent lessons</p>
          </div>
          <ClipboardList className="h-5 w-5 text-slate-400" aria-hidden="true" />
        </div>
        {lessons.length > 0 ? (
          <ul className="mt-3 divide-y divide-slate-200 dark:divide-slate-800">
            {lessons.map((lesson) => {
              const expanded = expandedLessonId === lesson.id;
              const detailsId = `parent-lesson-rating-${lesson.id}`;
              return (
                <li key={lesson.id} data-lesson-id={lesson.id}>
                  <button
                    type="button"
                    aria-label={`Show rating details for ${lesson.label}`}
                    aria-expanded={expanded}
                    aria-controls={detailsId}
                    onClick={() => {
                      hapticSelection();
                      setExpandedLessonId(expanded ? null : lesson.id);
                    }}
                    className="flex min-h-14 w-full min-w-0 items-center justify-between gap-3 rounded-lg py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    <span className="min-w-0">
                      <span className="block break-words text-sm font-semibold text-slate-900 dark:text-slate-100">{lesson.label}</span>
                      <span className="mt-1 block break-words text-xs text-slate-500">
                        {[lesson.courseLabel || "Course context unavailable", lesson.stageLabel].filter(Boolean).join(" · ")}
                        {lesson.updatedAtMs ? ` · ${formatDate(lesson.updatedAtMs)}` : ""}
                      </span>
                      <span className="mt-1 block text-xs text-slate-600 dark:text-slate-300">
                        {lesson.ratedSkillCount}/{lesson.totalSkillCount} positive ratings · {lesson.ratingStateLabel}
                        {lesson.remark ? " · Teacher note" : ""}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {lesson.ratedSkillCount > 0 ? (
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{lesson.averageRating.toFixed(1)}/4</span>
                      ) : null}
                      <ChevronDown className={`h-5 w-5 text-slate-500 transition-transform motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`} aria-hidden="true" />
                    </span>
                  </button>
                  {expanded ? (
                    <div id={detailsId} className="pb-4">
                      <ParentReadOnlySkillRatings entries={lesson.ratingEntries} />
                      <p className="mt-3 text-xs text-slate-500">Teacher rating scale: 0 Not started · 1 Emerging · 2 Developing · 3 Proficient · 4 Mastered</p>
                      {lesson.id !== latestLesson?.id ? (
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          <SkillChips title="Lesson strengths" values={lesson.strengthChips} tone="strength" />
                          <SkillChips title="Lesson practice areas" values={lesson.practiceChips} tone="practice" />
                        </div>
                      ) : null}
                      <div className="mt-4">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Teacher note</h3>
                        <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-slate-700 selection:bg-indigo-100 dark:text-slate-200">
                          {lesson.remark || "No teacher note was added for this lesson."}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        aria-label={`Open ${lesson.label} details`}
                        onClick={() => onOpenLesson(lesson)}
                        className="mt-4 min-h-11 rounded-xl"
                      >
                        Open {lesson.label} details
                      </Button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Lessons may be present, but no teacher rating history is available for this course.
          </p>
        )}
      </section>

      <section aria-labelledby="skills-by-stage-title" className="rounded-[20px] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 id="skills-by-stage-title" className="text-base font-semibold text-slate-950 dark:text-slate-100">Skills by stage</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Teacher-tagged skill areas, grouped by curriculum stage.</p>
          </div>
          <Sparkles className="h-5 w-5 text-slate-400" aria-hidden="true" />
        </div>
        {stages.length > 0 ? (
          <div className="mt-3 divide-y divide-slate-200 dark:divide-slate-800">
            {stages.map((stage) => {
              const expanded = expandedStageId === stage.id;
              const detailsId = `parent-skill-stage-${stage.id}`;
              return (
                <div key={stage.id} data-stage-id={stage.id}>
                  <button
                    type="button"
                    aria-label={`Show skills for ${stage.order > 0 ? `Stage ${stage.order}` : "stage"}: ${stage.displayLabel}`}
                    aria-expanded={expanded}
                    aria-controls={detailsId}
                    onClick={() => {
                      hapticSelection();
                      setExpandedStageId(expanded ? null : stage.id);
                    }}
                    className="flex min-h-14 w-full min-w-0 items-center justify-between gap-3 rounded-lg py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    <span className="min-w-0">
                      <span className="block text-xs font-medium text-slate-500">
                        {stage.order > 0 ? `Stage ${stage.order}` : "Stage"}
                      </span>
                      <span className="mt-1 block break-words text-sm font-semibold text-slate-900 dark:text-slate-100">{stage.displayLabel}</span>
                      <span className="mt-1 block truncate text-xs text-slate-500">
                        {stage.skills.length > 0 ? stage.skills.slice(0, 2).map((skill) => skill.label).join(" · ") : "No skills tagged yet"}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2 text-xs text-slate-500">
                      {stage.skills.length} tagged
                      <ChevronDown className={`h-5 w-5 transition-transform motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`} aria-hidden="true" />
                    </span>
                  </button>
                  {expanded ? (
                    <div id={detailsId} className="pb-4">
                      {stage.skills.length > 0 ? (
                        <ul className="flex flex-wrap gap-2">
                          {stage.skills.map((skill) => (
                            <li key={`${stage.id}-${skill.tag}`} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                              {skill.label}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-slate-500">No teacher-tagged skills are available for this stage.</p>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">No stage skill tags are available for this course yet.</p>
        )}
      </section>

      <section aria-labelledby="recent-skill-updates-title" className="rounded-[20px] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <MessageSquareText className="h-4 w-4 text-slate-400" aria-hidden="true" />
          <h2 id="recent-skill-updates-title" className="text-base font-semibold text-slate-950 dark:text-slate-100">Recent skill updates</h2>
        </div>
        {consolidatedRecentUpdates.length > 0 ? (
          <ul className="mt-3 divide-y divide-slate-200 dark:divide-slate-800">
            {consolidatedRecentUpdates.map((update) => (
              <li key={update.id} data-update-id={update.id} className="flex min-w-0 items-start justify-between gap-3 py-3">
                <span className="min-w-0">
                  <span className="block break-words text-sm font-medium text-slate-900 dark:text-slate-100">{update.label}</span>
                  <span className="mt-1 block break-words text-xs text-slate-500">{update.stageLabel}</span>
                </span>
                {update.updatedAtMs ? (
                  <time dateTime={new Date(update.updatedAtMs).toISOString()} className="shrink-0 text-xs text-slate-500">
                    {formatDate(update.updatedAtMs)}
                  </time>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">No recent teacher-tagged skill updates are available.</p>
        )}
      </section>
    </div>
  );
}
