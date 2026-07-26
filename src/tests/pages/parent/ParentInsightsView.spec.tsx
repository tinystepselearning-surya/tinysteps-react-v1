import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ParentInsightsView from "../../../pages/parent/components/insights/ParentInsightsView";
import {
  getParentInsightStageKey,
  getParentInsightStageStateLabel,
  resolveParentInsightStageState,
  type ParentInsightStageDisplay,
} from "../../../pages/parent/components/insights/parentInsightsPresentation";

const stage = (
  order: number,
  overrides: Partial<ParentInsightStageDisplay> = {},
): ParentInsightStageDisplay => {
  const label = `Stage ${order} learning`;
  return {
    key: getParentInsightStageKey(order, label),
    order,
    label,
    state: order === 2 ? "current" : order < 2 ? "completed" : "upcoming",
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

const commonProps = {
  isNativeIOSApp: false,
  childSelected: true,
  courseOptions: [{ courseId: "course-internal-id", label: "Phonics Foundation" }],
  selectedCourseId: "course-internal-id",
  selectedCourseLabel: "Phonics Foundation",
  progressState: "available" as const,
  completedLessons: 6,
  totalLessons: 12,
  completionPct: 50,
  completedStages: 1,
  lastUpdatedLabel: "26 Jul 2026",
  usesLatestLessonFallback: false,
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

describe("parent Insights presentation helpers", () => {
  it("creates stable stage identities and textual states", () => {
    expect(getParentInsightStageKey(2, "Blending")).toBe("2__Blending");
    expect(getParentInsightStageStateLabel("completed")).toBe("Completed");
    expect(getParentInsightStageStateLabel("current")).toBe("Current stage");
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
    })).toBe("upcoming");
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

  it("preserves genuine zero and exact lesson counts with progress semantics", () => {
    render(
      <ParentInsightsView
        {...commonProps}
        completionPct={0}
        completedLessons={0}
        totalLessons={12}
      />,
    );
    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.getByText("0/12 lessons completed")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Current-course progress" })).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
    expect(screen.getByText("Current-course progress")).toBeInTheDocument();
  });

  it("shows unavailable progress without a false zero or aria-valuenow", () => {
    render(
      <ParentInsightsView
        {...commonProps}
        progressState="unavailable"
        completedLessons={null}
        totalLessons={null}
        completionPct={null}
        completedStages={null}
        stages={[]}
        activeStage={null}
        nextStage={null}
      />,
    );
    expect(screen.getByText(/curriculum breakdown is not available/i)).toBeInTheDocument();
    expect(screen.queryByRole("progressbar", { name: "Current-course progress" })).not.toBeInTheDocument();
    expect(screen.queryByText("0%")).not.toBeInTheDocument();
  });

  it("shows a stable loading skeleton rather than empty or zero values", () => {
    render(<ParentInsightsView {...commonProps} progressState="loading" />);
    expect(screen.getByRole("status", { name: "Loading learning insights" })).toBeInTheDocument();
    expect(screen.queryByText("0%")).not.toBeInTheDocument();
    expect(screen.queryByText(/once a course is assigned/i)).not.toBeInTheDocument();
  });

  it("prioritises the exact current stage without inventing missing mastery", () => {
    const current = stage(2, {
      label: "A very long current stage label that remains readable",
      masteryLabel: "",
      completedCount: 2,
      totalCount: 7,
      hint: "Practise blending sounds into words.",
      focusItems: ["CVC blending"],
    });
    render(
      <ParentInsightsView
        {...commonProps}
        stages={[stages[0], current, stages[2]]}
        activeStage={current}
      />,
    );
    const currentCard = screen.getByTestId("parent-current-stage");
    expect(within(currentCard).getByText(current.label)).toHaveClass("break-words");
    expect(within(currentCard).getByText("2/7 lessons completed")).toBeInTheDocument();
    expect(within(currentCard).getByText("Practise blending sounds into words.")).toBeInTheDocument();
    expect(within(currentCard).getByText("CVC blending")).toBeInTheDocument();
    expect(within(currentCard).queryByText(/Mastery:/)).not.toBeInTheDocument();
  });

  it("preserves stage order and expands only the current stage by default", () => {
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
    expect(within(rows[0] as HTMLElement).queryByText("Stage 1 expectation")).not.toBeInTheDocument();
    expect(within(rows[1] as HTMLElement).getByText(/Stage 2 expectation/)).toBeVisible();
  });

  it("uses single-stage disclosure and resets it when course context changes", () => {
    const { rerender } = render(<ParentInsightsView {...commonProps} />);
    const firstRow = document.querySelector(`[data-stage-key="${stages[0].key}"]`) as HTMLElement;
    fireEvent.click(within(firstRow).getByRole("button"));
    expect(within(firstRow).getByRole("button")).toHaveAttribute("aria-expanded", "true");
    const currentRow = document.querySelector(`[data-stage-key="${stages[1].key}"]`) as HTMLElement;
    expect(within(currentRow).getByRole("button")).toHaveAttribute("aria-expanded", "false");

    const nextCourseStages = [stage(4, { state: "current" }), stage(5)];
    rerender(
      <ParentInsightsView
        {...commonProps}
        contextKey="kid-1::course-2"
        stages={nextCourseStages}
        activeStage={nextCourseStages[0]}
        nextStage={nextCourseStages[1]}
      />,
    );
    const newCurrent = document.querySelector(`[data-stage-key="${nextCourseStages[0].key}"]`) as HTMLElement;
    expect(within(newCurrent).getByRole("button")).toHaveAttribute("aria-expanded", "true");
  });

  it("renders textual completed, current, upcoming, and unavailable states", () => {
    const unavailable = stage(4, {
      state: "unavailable",
      progressPct: null,
      completedCount: null,
      totalCount: null,
    });
    render(<ParentInsightsView {...commonProps} stages={[...stages, unavailable]} />);
    expect(screen.getByText("Stage 1 · Completed")).toBeInTheDocument();
    expect(screen.getByText("Stage 2 · Current stage")).toBeInTheDocument();
    expect(screen.getByText("Stage 3 · Upcoming")).toBeInTheDocument();
    expect(screen.getByText("Stage 4 · Progress unavailable")).toBeInTheDocument();
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
    const { rerender } = render(
      <ParentInsightsView
        {...commonProps}
        teacherInsight={null}
        teacherInsightLoading={false}
        nextStage={null}
      />,
    );
    expect(screen.getByText(/after a lesson is reviewed/i)).toBeInTheDocument();
    expect(screen.getByText("No next stage is available in this course.")).toBeInTheDocument();
    expect(screen.queryByText(/Stage 4/)).not.toBeInTheDocument();

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
