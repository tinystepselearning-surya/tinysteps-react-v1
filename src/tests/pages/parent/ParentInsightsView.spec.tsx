import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { useProjectionMock } = vi.hoisted(() => ({
  useProjectionMock: vi.fn(),
}));

vi.mock("../../../hooks/useChildCourseProgressProjection", () => ({
  useCurrentParentCourseProgressProjection: useProjectionMock,
}));

import ParentInsightsView from "../../../pages/parent/components/insights/ParentInsightsView";
import {
  getParentInsightStageKey,
  getParentInsightStageStateLabel,
  resolveParentInsightStageState,
  type ParentInsightStageDisplay,
} from "../../../pages/parent/components/insights/parentInsightsPresentation";
import type { ChildCourseProgressProjection } from "../../../hooks/useChildCourseProgressProjection";

const stage = (
  order: number,
  overrides: Partial<ParentInsightStageDisplay> = {},
): ParentInsightStageDisplay => {
  const label = `Stage ${order} learning`;
  return {
    key: getParentInsightStageKey(order, label),
    order,
    label,
    state: order === 2 ? "current" : order < 2 ? "completed" : "not_started",
    progressPct: order === 1 ? 100 : order === 2 ? 40 : 0,
    completedCount: order === 1 ? 4 : order === 2 ? 2 : 0,
    totalCount: 4,
    masteryLabel: order === 2 ? "Developing" : "",
    hint: `Stage ${order} hint`,
    focusItems: order === 2 ? ["Blending", "Short vowels"] : [],
    expectations: [`Stage ${order} expectation`],
    ...overrides,
  };
};

const stages = [stage(1), stage(2), stage(3)];

type StageCount = { order: number; total: number; completed: number };

function canonicalProjection(
  courseId: string,
  counts: StageCount[] = [
    { order: 1, total: 4, completed: 4 },
    { order: 2, total: 4, completed: 2 },
    { order: 3, total: 4, completed: 0 },
  ],
): ChildCourseProgressProjection {
  const totalTopics = counts.reduce((sum, item) => sum + item.total, 0);
  const completedTopics = counts.reduce((sum, item) => sum + item.completed, 0);
  return {
    schemaVersion: 3,
    modelType: "child_course_progress_v3",
    completionAuthority: "teacher_progress_save",
    definitionStatus: "configured",
    courseId,
    courseLabel: "Phonics Foundation",
    totalTopics,
    completedTopics,
    inProgressTopics: 0,
    notStartedTopics: totalTopics - completedTopics,
    overallPct: totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0,
    totalStages: counts.length,
    completedStages: counts.filter((item) => item.total > 0 && item.completed === item.total).length,
    stageSummaries: counts.map((item) => ({
      key: `canonical-${item.order}`,
      label: `Canonical Stage ${item.order}`,
      order: item.order,
      totalTopics: item.total,
      completedTopics: item.completed,
      inProgressTopics: 0,
      notStartedTopics: item.total - item.completed,
      completionPct: item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0,
    })),
    lastUpdatedAtMs: Date.parse("2026-08-26T01:00:00+05:30"),
  };
}

type HookState = {
  data: ChildCourseProgressProjection | null;
  loading: boolean;
  error: string | null;
  isLoading: boolean;
  isError: boolean;
};

const projectionStates = new Map<string, HookState>();

function availableState(data: ChildCourseProgressProjection): HookState {
  return { data, loading: false, error: null, isLoading: false, isError: false };
}

const commonProps = {
  isNativeIOSApp: false,
  childSelected: true,
  courseOptions: [{ courseId: "course-internal-id", label: "Phonics Foundation" }],
  selectedCourseId: "course-internal-id",
  selectedCourseLabel: "Phonics Foundation",
  // These legacy props deliberately remain contradictory. P6 must not consume them for
  // curriculum completion after the V3 cutover.
  progressState: "available" as const,
  completedLessons: 12,
  totalLessons: 12,
  completionPct: 100,
  completedStages: 3,
  lastUpdatedLabel: "legacy label",
  usesLatestLessonFallback: true,
  stages,
  activeStage: stages[1],
  nextStage: stages[2],
  teacherInsight: null,
  teacherInsightLoading: false,
  errorMessage: null,
  contextKey: "kid-1::course-1",
  onCourseChange: vi.fn(),
  onViewTeacherRatings: vi.fn(),
  onSelectionFeedback: vi.fn(),
};

beforeEach(() => {
  projectionStates.clear();
  useProjectionMock.mockReset();
  useProjectionMock.mockImplementation((courseId: string, enabled = true) => {
    if (!enabled) {
      return { data: null, loading: false, error: null, isLoading: false, isError: false };
    }
    return projectionStates.get(courseId) || availableState(canonicalProjection(courseId));
  });
});

describe("parent Insights presentation helpers", () => {
  it("creates stable stage identities and textual states", () => {
    expect(getParentInsightStageKey(2, "Blending")).toBe("2__Blending");
    expect(getParentInsightStageStateLabel("completed")).toBe("Completed");
    expect(getParentInsightStageStateLabel("current")).toBe("Current stage");
    expect(getParentInsightStageStateLabel("in_progress")).toBe("In progress");
    expect(getParentInsightStageStateLabel("not_started")).toBe("Not started");
    expect(getParentInsightStageStateLabel("upcoming")).toBe("Upcoming");
    expect(getParentInsightStageStateLabel("unavailable")).toBe("Progress unavailable");
  });

  it("does not confuse unavailable stage progress with genuine zero", () => {
    expect(resolveParentInsightStageState({
      key: "3__Next",
      order: 3,
      progressPct: null,
      activeStageKey: "2__Now",
      activeStageOrder: 2,
    })).toBe("unavailable");
    expect(resolveParentInsightStageState({
      key: "3__Next",
      order: 3,
      progressPct: 0,
      activeStageKey: "2__Now",
      activeStageOrder: 2,
    })).toBe("not_started");
    expect(resolveParentInsightStageState({
      key: "1__Earlier",
      order: 1,
      progressPct: 40,
      activeStageKey: "2__Now",
      activeStageOrder: 2,
    })).toBe("in_progress");
  });
});

describe("ParentInsightsView", () => {
  it("renders one course as a compact labelled identity without exposing its raw ID", () => {
    render(<ParentInsightsView {...commonProps} />);
    expect(screen.getByText("Current course")).toBeInTheDocument();
    expect(screen.getByText("Phonics Foundation")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByText("course-internal-id")).not.toBeInTheDocument();
  });

  it("renders an accessible multi-course selector and preserves its callback", () => {
    const onCourseChange = vi.fn();
    render(
      <ParentInsightsView
        {...commonProps}
        courseOptions={[
          { courseId: "phonics", label: "Phonics" },
          { courseId: "grammar", label: "Grammar" },
        ]}
        selectedCourseId="phonics"
        selectedCourseLabel="Phonics"
        onCourseChange={onCourseChange}
      />,
    );
    fireEvent.change(screen.getByRole("combobox", { name: "Current course" }), {
      target: { value: "grammar" },
    });
    expect(onCourseChange).toHaveBeenCalledWith("grammar");
  });

  it("ignores mastery-derived legacy completion props and renders V3 saved-lesson counts", () => {
    render(<ParentInsightsView {...commonProps} />);
    expect(screen.getByRole("progressbar", { name: "Current-course progress" })).toHaveAttribute(
      "aria-valuenow",
      "50",
    );
    expect(screen.getByText("6/12 lessons completed")).toBeInTheDocument();
    expect(screen.queryByText("100%")).not.toBeInTheDocument();
    expect(screen.queryByText("12/12 lessons completed")).not.toBeInTheDocument();
    expect(screen.queryByText(/latest available lesson progress/i)).not.toBeInTheDocument();
  });

  it("preserves genuine canonical zero and exact lesson counts with progress semantics", () => {
    projectionStates.set(
      "course-internal-id",
      availableState(canonicalProjection("course-internal-id", [
        { order: 1, total: 4, completed: 0 },
        { order: 2, total: 4, completed: 0 },
        { order: 3, total: 4, completed: 0 },
      ])),
    );
    render(<ParentInsightsView {...commonProps} />);
    expect(screen.getAllByText("0%").length).toBeGreaterThan(0);
    expect(screen.getByText("0/12 lessons completed")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Current-course progress" })).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
  });

  it("rejects stale V2 progress without falling back to mastery or false zero", () => {
    projectionStates.set("course-internal-id", availableState({
      ...canonicalProjection("course-internal-id"),
      schemaVersion: 2,
      modelType: "child_course_progress_v2",
      completionAuthority: "teacher_lesson_status",
    }));
    render(<ParentInsightsView {...commonProps} />);
    expect(screen.getByText(/saved-lesson curriculum progress is not available yet/i)).toBeInTheDocument();
    expect(screen.queryByRole("progressbar", { name: "Current-course progress" })).not.toBeInTheDocument();
    expect(screen.queryByText("100%")).not.toBeInTheDocument();
  });

  it("shows a stable loading skeleton rather than legacy or zero values", () => {
    projectionStates.set("course-internal-id", {
      data: null,
      loading: true,
      error: null,
      isLoading: true,
      isError: false,
    });
    render(<ParentInsightsView {...commonProps} />);
    expect(screen.getByRole("status", { name: "Loading learning insights" })).toBeInTheDocument();
    expect(screen.queryByText("100%")).not.toBeInTheDocument();
  });

  it("uses canonical stage counts while preserving non-authoritative mastery/focus metadata", () => {
    const current = stage(2, {
      label: "A very long current stage label that remains readable",
      masteryLabel: "Mastered",
      completedCount: 99,
      totalCount: 99,
      progressPct: 100,
      hint: "Practise blending sounds into words.",
      focusItems: ["CVC blending"],
    });
    projectionStates.set(
      "course-internal-id",
      availableState(canonicalProjection("course-internal-id", [
        { order: 1, total: 4, completed: 4 },
        { order: 2, total: 7, completed: 2 },
        { order: 3, total: 4, completed: 0 },
      ])),
    );
    render(
      <ParentInsightsView
        {...commonProps}
        stages={[stages[0], current, stages[2]]}
      />,
    );
    const currentCard = screen.getByTestId("parent-current-stage");
    expect(within(currentCard).getByText(current.label)).toHaveClass("break-words");
    expect(within(currentCard).getByText("2/7 lessons completed")).toBeInTheDocument();
    expect(within(currentCard).getByText("Practise blending sounds into words.")).toBeInTheDocument();
    expect(within(currentCard).getByText("CVC blending")).toBeInTheDocument();
    expect(within(currentCard).getByText("Mastery: Mastered")).toBeInTheDocument();
    expect(within(currentCard).queryByText("99/99 lessons completed")).not.toBeInTheDocument();
  });

  it("preserves stage order and expands only the canonical current stage by default", () => {
    render(<ParentInsightsView {...commonProps} />);
    const rows = document.querySelectorAll("[data-stage-key]");
    expect(rows[0]).toHaveAttribute("data-stage-key", stages[0].key);
    expect(rows[1]).toHaveAttribute("data-stage-key", stages[1].key);
    expect(rows[2]).toHaveAttribute("data-stage-key", stages[2].key);

    const firstButton = within(rows[0] as HTMLElement).getByRole("button");
    const currentButton = within(rows[1] as HTMLElement).getByRole("button");
    const futureButton = within(rows[2] as HTMLElement).getByRole("button");
    expect(firstButton).toHaveAttribute("aria-expanded", "false");
    expect(currentButton).toHaveAttribute("aria-expanded", "true");
    expect(futureButton).toHaveAttribute("aria-expanded", "false");
    expect(within(rows[1] as HTMLElement).getByText(/Stage 2 expectation/)).toBeVisible();
  });

  it("uses single-stage disclosure and resets it when canonical course context changes", () => {
    const { rerender } = render(<ParentInsightsView {...commonProps} />);
    const firstRow = document.querySelector(`[data-stage-key="${stages[0].key}"]`) as HTMLElement;
    fireEvent.click(within(firstRow).getByRole("button"));
    expect(within(firstRow).getByRole("button")).toHaveAttribute("aria-expanded", "true");

    const nextCourseStages = [stage(4, { state: "current" }), stage(5)];
    projectionStates.set(
      "course-2",
      availableState(canonicalProjection("course-2", [
        { order: 4, total: 3, completed: 1 },
        { order: 5, total: 3, completed: 0 },
      ])),
    );
    rerender(
      <ParentInsightsView
        {...commonProps}
        courseOptions={[
          { courseId: "course-internal-id", label: "Phonics Foundation" },
          { courseId: "course-2", label: "Next Course" },
        ]}
        selectedCourseId="course-2"
        selectedCourseLabel="Next Course"
        contextKey="kid-1::course-2"
        stages={nextCourseStages}
      />,
    );
    const newCurrent = document.querySelector(`[data-stage-key="${nextCourseStages[0].key}"]`) as HTMLElement;
    expect(within(newCurrent).getByRole("button")).toHaveAttribute("aria-expanded", "true");
  });

  it("renders canonical completed, current, and not-started stage states", () => {
    render(<ParentInsightsView {...commonProps} />);
    expect(screen.getByText("Stage 1 · Completed")).toBeInTheDocument();
    expect(screen.getByText("Stage 2 · Current stage")).toBeInTheDocument();
    expect(screen.getByText("Stage 3 · Not started")).toBeInTheDocument();
    expect(screen.queryByText("Stage 3 · Upcoming")).not.toBeInTheDocument();
  });

  it("keeps teacher ratings on the four-point scale and preserves the Skills callback", () => {
    const onViewTeacherRatings = vi.fn();
    render(
      <ParentInsightsView
        {...commonProps}
        teacherInsight={{
          lessonLabel: "Blending CVC words",
          contextLabel: "Stage 2",
          updatedLabel: "26 Jul 2026",
          note: "Blended sounds confidently today.",
          ratingValue: 3.25,
          ratingLabel: "Proficient",
        }}
        onViewTeacherRatings={onViewTeacherRatings}
      />,
    );
    expect(screen.getByText("Blending CVC words")).toBeInTheDocument();
    expect(screen.getByText("3.3/4 · Proficient")).toBeInTheDocument();
    expect(screen.queryByText("81%")).not.toBeInTheDocument();
    expect(screen.getByText("Blended sounds confidently today.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "View teacher ratings" }));
    expect(onViewTeacherRatings).toHaveBeenCalledOnce();
  });

  it("keeps no-rating, loading-rating, and missing-next-stage states distinct", () => {
    projectionStates.set(
      "course-internal-id",
      availableState(canonicalProjection("course-internal-id", [
        { order: 1, total: 4, completed: 4 },
        { order: 2, total: 4, completed: 4 },
        { order: 3, total: 4, completed: 2 },
      ])),
    );
    const { rerender } = render(
      <ParentInsightsView
        {...commonProps}
        teacherInsight={null}
        teacherInsightLoading={false}
      />,
    );
    expect(screen.getByText(/after a lesson is reviewed/i)).toBeInTheDocument();
    expect(screen.getByText("No next stage is available in this course.")).toBeInTheDocument();

    rerender(
      <ParentInsightsView
        {...commonProps}
        teacherInsight={null}
        teacherInsightLoading
      />,
    );
    expect(screen.getByRole("status", { name: "Loading teacher insight" })).toBeInTheDocument();
    expect(screen.queryByText(/after a lesson is reviewed/i)).not.toBeInTheDocument();
  });

  it("provides distinct child, course, curriculum, and error states", () => {
    const { rerender } = render(
      <ParentInsightsView {...commonProps} childSelected={false} courseOptions={[]} />,
    );
    expect(screen.getByText("Select a child to view learning insights.")).toBeInTheDocument();

    rerender(<ParentInsightsView {...commonProps} courseOptions={[]} />);
    expect(screen.getByText(/once a course is assigned/i)).toBeInTheDocument();

    rerender(<ParentInsightsView {...commonProps} errorMessage="Unable to load progress right now." />);
    expect(screen.getByRole("alert")).toHaveTextContent("Unable to load progress right now.");
  });

  it("keeps the native page heading logical without repeating it visually", () => {
    render(<ParentInsightsView {...commonProps} isNativeIOSApp />);
    expect(screen.getByRole("heading", { level: 1, name: "Insights" }).parentElement).toHaveClass("sr-only");
    expect(screen.getByTestId("parent-insights-view")).toHaveClass("overflow-x-hidden");
  });
});
