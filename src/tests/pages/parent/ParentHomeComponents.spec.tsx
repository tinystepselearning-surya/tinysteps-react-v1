import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ParentAttendanceSummary from "../../../pages/parent/components/ParentAttendanceSummary";
import ParentBillingSummary from "../../../pages/parent/components/ParentBillingSummary";
import ParentDashboardKpis from "../../../pages/parent/components/ParentDashboardKpis";
import ParentLearningInsights from "../../../pages/parent/components/ParentLearningInsights";
import ParentProgressOverview from "../../../pages/parent/components/ParentProgressOverview";
import ParentRecommendations from "../../../pages/parent/components/ParentRecommendations";
import type { ParentOverviewCourseSummary } from "../../../pages/parent/parentOverviewProjection";

const canonicalCourse: ParentOverviewCourseSummary = {
  courseId: "phonics-foundations",
  courseLabel: "Phonics Foundations",
  totalTopics: 12,
  completedTopics: 3,
  inProgressTopics: 3,
  notStartedTopics: 6,
  overallPct: 25,
  totalStages: 3,
  completedStages: 1,
  stageSummaries: [
    {
      key: "stage-1",
      order: 1,
      label: "Stage 1 Sounds",
      totalTopics: 3,
      completedTopics: 3,
      inProgressTopics: 0,
      notStartedTopics: 0,
      completionPct: 100,
    },
    {
      key: "stage-2",
      order: 2,
      label: "Stage 2 Blending",
      totalTopics: 3,
      completedTopics: 0,
      inProgressTopics: 3,
      notStartedTopics: 0,
      completionPct: 0,
    },
    {
      key: "stage-3",
      order: 3,
      label: "Stage 3 Digraphs",
      totalTopics: 6,
      completedTopics: 0,
      inProgressTopics: 0,
      notStartedTopics: 6,
      completionPct: 0,
    },
  ],
  activeStage: null,
  nextStage: null,
  lastUpdatedAtMs: 100,
};
canonicalCourse.activeStage = canonicalCourse.stageSummaries[1];
canonicalCourse.nextStage = canonicalCourse.stageSummaries[2];

describe("Parent Home components", () => {
  it("distinguishes genuine zero progress and class activity from unavailable canonical data", () => {
    const commonProps = {
      lessonsSummaryText: "0 of 12 lessons completed",
      attendanceLabel: "0 completed · 0 sessions",
      attendanceMetaText: "July 2026 · selected child",
      billingLabel: "Wallet unavailable",
      billingMetaText: "Deductions · July 2026",
    };
    const { rerender } = render(
      <ParentDashboardKpis
        {...commonProps}
        progressState="available"
        completionPct={0}
        attendanceState="available"
      />,
    );

    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.getByText("0 completed · 0 sessions")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Current course progress" })).toHaveAttribute("aria-valuenow", "0");
    expect(screen.getByLabelText("Parent dashboard snapshot")).toHaveAttribute("data-layout", "fixed-grid");
    expect(screen.getByText("Classes this month")).toBeInTheDocument();
    expect(screen.queryByText("Confidence snapshot")).not.toBeInTheDocument();

    rerender(
      <ParentDashboardKpis
        {...commonProps}
        progressState="unavailable"
        attendanceState="unavailable"
      />,
    );
    expect(screen.queryByText("0%")).not.toBeInTheDocument();
    expect(screen.getAllByText("Not available").length).toBeGreaterThan(0);
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("renders canonical lesson totals and identifies the active stage", () => {
    render(
      <ParentProgressOverview
        childName="Aarav"
        loading={false}
        course={canonicalCourse}
        stripStagePrefix={(label) => label.replace(/^Stage \d+ /, "")}
      />,
    );

    expect(screen.getByText("3/12 lessons")).toBeInTheDocument();
    expect(screen.getByText("25%")).toBeInTheDocument();
    expect(screen.getByRole("listitem", { current: "step" })).toHaveTextContent("Blending");
    expect(screen.getByText(/lessons saved by your child's teacher/i)).toBeInTheDocument();
    expect(screen.queryByText(/teacher lesson status/i)).not.toBeInTheDocument();
  });

  it("marks partial, current, and untouched stage rows without calling partial progress upcoming", () => {
    const partialCourse: ParentOverviewCourseSummary = {
      ...canonicalCourse,
      stageSummaries: [
        { ...canonicalCourse.stageSummaries[0], completedTopics: 2, notStartedTopics: 1, completionPct: 67 },
        { ...canonicalCourse.stageSummaries[1], completedTopics: 1, inProgressTopics: 0, notStartedTopics: 2, completionPct: 33 },
        canonicalCourse.stageSummaries[2],
      ],
      activeStage: null,
      nextStage: null,
    };
    partialCourse.activeStage = partialCourse.stageSummaries[1];
    partialCourse.nextStage = partialCourse.stageSummaries[2];

    render(
      <ParentProgressOverview
        childName="Aarav"
        loading={false}
        course={partialCourse}
        stripStagePrefix={(label) => label.replace(/^Stage \d+ /, "")}
      />,
    );

    const rows = screen.getAllByRole("listitem");
    expect(rows[0]).toHaveAttribute("data-stage-state", "in_progress");
    expect(rows[1]).toHaveAttribute("data-stage-state", "current");
    expect(rows[2]).toHaveAttribute("data-stage-state", "not_started");
  });

  it("does not expose detailed lesson rows in P5 progress overview", () => {
    render(
      <ParentProgressOverview
        childName="Aarav"
        loading={false}
        course={canonicalCourse}
        stripStagePrefix={(label) => label.replace(/^Stage \d+ /, "")}
      />,
    );

    expect(screen.queryByRole("button", { name: /course details/i })).not.toBeInTheDocument();
    expect(screen.queryByText("Lesson 1 — S")).not.toBeInTheDocument();
  });

  it("shows explicit unavailable state rather than a mastery-based course estimate", () => {
    render(
      <ParentProgressOverview
        childName="Aarav"
        loading={false}
        course={null}
        stripStagePrefix={(label) => label}
      />,
    );

    expect(screen.getByText(/No mastery-based estimate is substituted/i)).toBeInTheDocument();
  });

  it("prioritises the next class and sends the correct session to Join", () => {
    const onJoinSession = vi.fn();
    const nextSession = {
      id: "session-next",
      date: "2026-07-28",
      startTime: "10:00",
      endTime: "11:00",
      courseName: "Phonics",
      teacherName: "Ms Anu",
    };
    const laterSession = { ...nextSession, id: "session-later", date: "2026-07-30" };
    render(
      <ParentAttendanceSummary
        classesState="available"
        classesCounts={{ total: 4, completed: 2, reschedule_requested: 1 }}
        scopeLabel="Class activity · July 2026"
        upcomingPreviewRows={[
          { session: nextSession, status: "scheduled", start: new Date("2026-07-28T10:00:00") },
          { session: laterSession, status: "scheduled", start: new Date("2026-07-30T10:00:00") },
        ]}
        joiningSessionId={null}
        onOpenClasses={vi.fn()}
        onJoinSession={onJoinSession}
        canJoinFromOverview={() => true}
      />,
    );

    const list = screen.getByTestId("upcoming-class-list");
    const rows = within(list).getAllByText(/Phonics/).map((node) => node.closest("[data-class-priority]"));
    expect(rows[0]).toHaveAttribute("data-class-priority", "next");
    fireEvent.click(screen.getAllByRole("button", { name: "Join Class" })[0]);
    expect(onJoinSession).toHaveBeenCalledWith(nextSession);
  });

  it("excludes an already-completed same-day row from the Next Class preview", () => {
    const completedSession = {
      id: "session-completed",
      date: "2026-08-26",
      startTime: "12:30",
      endTime: "13:05",
      courseName: "Completed Phonics",
      teacherName: "Ms Anu",
    };
    const nextSession = {
      id: "session-next",
      date: "2026-08-27",
      startTime: "12:30",
      endTime: "13:05",
      courseName: "Next Phonics",
      teacherName: "Ms Anu",
    };

    render(
      <ParentAttendanceSummary
        classesState="available"
        classesCounts={{ total: 22, completed: 16, reschedule_requested: 0 }}
        scopeLabel="Class activity · August 2026"
        upcomingPreviewRows={[
          { session: completedSession, status: "completed", start: new Date("2026-08-26T12:30:00") },
          { session: nextSession, status: "scheduled", start: new Date("2026-08-27T12:30:00") },
        ]}
        joiningSessionId={null}
        onOpenClasses={vi.fn()}
        onJoinSession={vi.fn()}
        canJoinFromOverview={() => true}
      />,
    );

    expect(screen.queryByText("Completed Phonics · Ms Anu")).not.toBeInTheDocument();
    expect(screen.getByText("Next Phonics · Ms Anu").closest("[data-class-priority]")).toHaveAttribute(
      "data-class-priority",
      "next",
    );
    expect(screen.getAllByRole("button", { name: "Join Class" })).toHaveLength(1);
  });

  it("does not substitute family totals when selected-child class totals are unavailable", () => {
    render(
      <ParentAttendanceSummary
        classesState="unavailable"
        classesCounts={null}
        scopeLabel="Class activity · July 2026"
        upcomingPreviewRows={[]}
        joiningSessionId={null}
        onOpenClasses={vi.fn()}
        onJoinSession={vi.fn()}
        canJoinFromOverview={() => false}
      />,
    );

    expect(screen.getByText(/Family totals are not substituted/i)).toBeInTheDocument();
    expect(screen.getAllByText("—")).toHaveLength(3);
  });

  it("shows teacher-provided lesson information", () => {
    render(
      <ParentLearningInsights
        latestTeacherLesson={{
          label: "Blending CVC words",
          stageLabel: "Stage 2",
          remark: "Aarav blended confidently today.",
          updatedAtMs: 100,
        }}
        selectedCourseLabel="Phonics"
        formatTimestamp={() => "26 Jul"
        }
        dashboardStrengthChips={["Sound recognition"]}
        dashboardPracticeChips={["Short vowels"]}
        onOpenAllRatings={vi.fn()}
      />,
    );

    expect(screen.getByText("Blending CVC words")).toBeInTheDocument();
    expect(screen.getByText("Aarav blended confidently today.")).toBeInTheDocument();
    expect(screen.getByText("Sound recognition")).toBeInTheDocument();
    expect(screen.getByText("Short vowels")).toBeInTheDocument();
  });

  it("keeps the standalone recommendations component functional outside P5 Overview", () => {
    const onStartPractice = vi.fn();
    const onOpenGamesProgress = vi.fn();
    render(
      <ParentRecommendations
        dashboardRecommendedNext={{ gameId: "sound-detective", reason: "Practise listening.", estMinutes: 8 }}
        labelFromGameId={() => "Sound Detective"}
        onStartPractice={onStartPractice}
        onOpenGamesProgress={onOpenGamesProgress}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Start Practice" }));
    fireEvent.click(screen.getByRole("button", { name: "Games Progress" }));
    expect(onStartPractice).toHaveBeenCalledWith("sound-detective");
    expect(onOpenGamesProgress).toHaveBeenCalledOnce();
  });

  it("displays wallet values exactly as passed", () => {
    render(
      <ParentBillingSummary
        billingLoading={false}
        dueNowText="Amount to pay: ₹1,234"
        billedText="₹2,345"
        paidText="₹1,111"
        deductionsLabel="Class deductions · July 2026"
        paymentsLabel="Payments received · July 2026"
        billingDetailText="Wallet details."
        onOpenPayments={vi.fn()}
      />,
    );

    expect(screen.getByText("Amount to pay: ₹1,234")).toBeInTheDocument();
    expect(screen.getByText("₹2,345")).toBeInTheDocument();
    expect(screen.getByText("₹1,111")).toBeInTheDocument();
  });
});
