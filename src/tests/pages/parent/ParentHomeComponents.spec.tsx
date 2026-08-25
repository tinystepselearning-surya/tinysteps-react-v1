import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ParentAttendanceSummary from "../../../pages/parent/components/ParentAttendanceSummary";
import ParentBillingSummary from "../../../pages/parent/components/ParentBillingSummary";
import ParentDashboardKpis from "../../../pages/parent/components/ParentDashboardKpis";
import ParentLearningInsights from "../../../pages/parent/components/ParentLearningInsights";
import ParentProgressOverview from "../../../pages/parent/components/ParentProgressOverview";
import ParentRecommendations from "../../../pages/parent/components/ParentRecommendations";

describe("Parent Home components", () => {
  it("distinguishes genuine zero progress from unavailable progress in a fixed KPI grid", () => {
    const commonProps = {
      lessonsSummaryText: "0/12 lessons",
      confidenceLabel: "Not available",
      confidenceMetaText: "No confidence snapshot yet",
      attendanceLabel: "0/0",
      attendanceMetaText: "July 2026 · 0 rescheduled",
      billingLabel: "Wallet unavailable",
      billingMetaText: "Deductions · July 2026",
    };
    const { rerender } = render(
      <ParentDashboardKpis {...commonProps} progressState="available" completionPct={0} />,
    );

    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Current course progress" })).toHaveAttribute("aria-valuenow", "0");
    expect(screen.getByLabelText("Parent dashboard snapshot")).toHaveAttribute("data-layout", "fixed-grid");
    expect(screen.getByText("Classes in selected month")).toBeInTheDocument();

    rerender(<ParentDashboardKpis {...commonProps} progressState="unavailable" />);
    expect(screen.queryByText("0%")).not.toBeInTheDocument();
    expect(screen.getAllByText("Not available").length).toBeGreaterThan(0);
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("preserves lesson totals and identifies the active stage", () => {
    const activeStage = { order: 2, label: "Stage 2 Blending", progressPct: 50 };
    render(
      <ParentProgressOverview
        childName="Aarav"
        isRefetching={false}
        onRefresh={vi.fn()}
        showsFallbackBanner={false}
        phonicsLoading={false}
        phonicsError={false}
        phonicsErrorMessage=""
        completionPct={25}
        curriculumData={{
          summaryCompletedCount: 3,
          summaryTotalTopics: 12,
          activeStage,
          nextStage: { order: 3, label: "Stage 3 Digraphs", progressPct: 0 },
          stageSummaries: [
            { order: 1, label: "Stage 1 Sounds", progressPct: 100 },
            activeStage,
            { order: 3, label: "Stage 3 Digraphs", progressPct: 0 },
          ],
        }}
        stripStagePrefix={(label) => label.replace(/^Stage \d+ /, "")}
      />,
    );

    expect(screen.getByText("3/12 lessons")).toBeInTheDocument();
    expect(screen.getByText("25%")).toBeInTheDocument();
    expect(screen.getByRole("listitem", { current: "step" })).toHaveTextContent("Blending");
  });

  it("expands course details without triggering a progress refetch loop", () => {
    const onRefresh = vi.fn();
    render(
      <ParentProgressOverview
        childName="Aarav"
        isRefetching={false}
        onRefresh={onRefresh}
        showsFallbackBanner={false}
        phonicsLoading={false}
        phonicsError={false}
        phonicsErrorMessage=""
        completionPct={50}
        curriculumData={{
          summaryCompletedCount: 2,
          summaryTotalTopics: 4,
          activeStage: { order: 1, label: "Stage 1 Sounds", progressPct: 50 },
          nextStage: { order: 2, label: "Stage 2 Blending", progressPct: 0 },
          stageSummaries: [
            { order: 1, label: "Stage 1 Sounds", progressPct: 50 },
            { order: 2, label: "Stage 2 Blending", progressPct: 0 },
          ],
          groupedLessons: [
            {
              key: "1__Stage 1 Sounds",
              label: "Stage 1 Sounds",
              order: 1,
              summary: { progressPct: 50 },
              rows: [
                { id: "lesson-1", label: "Lesson 1 — S", status: "completed" },
                { id: "lesson-2", label: "Lesson 2 — A", status: "in_progress" },
              ],
            },
          ],
        }}
        stripStagePrefix={(label) => label.replace(/^Stage \d+ /, "")}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "View course details" }));
    expect(screen.getByText("Lesson 1 — S")).toBeInTheDocument();
    expect(screen.getByText("Lesson 2 — A")).toBeInTheDocument();
    expect(document.querySelector('[data-fetch-behavior="render-only"]')).toBeInTheDocument();
    expect(onRefresh).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Hide course details" }));
    expect(screen.queryByText("Lesson 1 — S")).not.toBeInTheDocument();
    expect(onRefresh).not.toHaveBeenCalled();
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
        formatTimestamp={() => "26 Jul"}
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

  it("keeps recommendations focused on one action and preserves callbacks", () => {
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

    expect(screen.getByText("Sound Detective")).toBeInTheDocument();
    expect(screen.queryByText("Strengths")).not.toBeInTheDocument();
    expect(screen.queryByText("Needs practice")).not.toBeInTheDocument();
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
