import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import ParentLessonTracker from "../../../pages/parent/components/ParentLessonTracker";
import { stripParentStagePrefix } from "../../../pages/parent/parentVisualTokens";

const curriculumData = {
  summaryCompletedCount: 1,
  summaryTotalTopics: 2,
  summaryInProgressCount: 1,
  summaryLastUpdatedAtMs: null,
  filteredRows: [{ id: "topic-1" }, { id: "topic-2" }],
  groupedLessons: [
    {
      key: "stage-1",
      order: 1,
      label: "Stage 1 — Foundations",
      summary: { completedCount: 1, totalCount: 1, progressPct: 100 },
      rows: [
        {
          id: "topic-1",
          label: "Initial sounds",
          mastery: "mastered",
          progressRatings: {},
          progressSkills: [],
        },
      ],
    },
    {
      key: "stage-2",
      order: 2,
      label: "Blending",
      summary: { completedCount: 0, totalCount: 1, progressPct: 0 },
      rows: [
        {
          id: "topic-2",
          label: "Simple words",
          mastery: "in_progress",
          progressRatings: {},
          progressSkills: [],
        },
      ],
    },
  ],
};

function Harness() {
  const [collapsedStages, setCollapsedStages] = useState<Record<string, boolean>>({
    "stage-1": false,
    "stage-2": true,
  });

  return (
    <ParentLessonTracker
      phonicsLoading={false}
      phonicsError={false}
      phonicsErrorMessage=""
      displayCourseId="course-1"
      curriculumData={curriculumData}
      curriculumFilter="all"
      setCurriculumFilter={vi.fn()}
      collapsedStages={collapsedStages}
      setCollapsedStages={setCollapsedStages}
      onRefresh={vi.fn()}
      isRefetching={false}
      formatTimestamp={() => "Today"}
      stripStagePrefix={stripParentStagePrefix}
      teacherStarGuide={[{ stars: "★★★", label: "Secure" }]}
      starString={() => "☆☆☆"}
      selectedCourseLabel="Phonics"
      onSelectTopic={vi.fn()}
      curriculumTopicModalOpen={false}
      selectedCurriculumTopic={null}
      onModalOpenChange={vi.fn()}
      getLessonNeedsPracticeChips={() => []}
    />
  );
}

describe("ParentLessonTracker", () => {
  it("uses full-row stage disclosures and keeps one stage open at a time", () => {
    render(<Harness />);

    const firstStage = screen.getByRole("button", {
      name: /Stage 1 — Foundations/,
    });
    const secondStage = screen.getByRole("button", {
      name: /Stage 2 — Blending/,
    });
    expect(firstStage).toHaveAttribute("aria-expanded", "true");
    expect(secondStage).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(secondStage);
    expect(firstStage).toHaveAttribute("aria-expanded", "false");
    expect(secondStage).toHaveAttribute("aria-expanded", "true");
  });

  it("keeps bulk controls hidden on compact layouts and exposes rating help on demand", () => {
    render(<Harness />);
    expect(screen.getByRole("button", { name: "Expand all" })).toHaveClass("hidden");
    expect(screen.getByRole("button", { name: "Collapse all" })).toHaveClass("hidden");
    expect(screen.getByText("How ratings work")).toBeInTheDocument();
  });
});
