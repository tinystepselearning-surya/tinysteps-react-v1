import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import ParentClassesView, {
  ParentClassMonthSummaryPanel,
} from "../../../pages/parent/components/classes/ParentClassesView";
import {
  buildParentClassMonthSummaryDisplay,
  formatParentClassMonthCompletion,
  getParentClassDisplayStatus,
  getParentClassStatusLabel,
  selectNextParentClass,
  shouldShowClassJoinAction,
  type ParentClassesFilterId,
  type ParentClassSessionDisplay,
} from "../../../pages/parent/components/classes/parentClassPresentation";
import { resolveParentClassKidId } from "../../../pages/parent/components/classes/useParentCanonicalClassMonth";
import type { MaterializedParentChildMonthClassAttendance } from "../../../lib/parentClassAttendanceProjection";

const row = (
  id: string,
  overrides: Partial<ParentClassSessionDisplay> = {},
): ParentClassSessionDisplay => ({
  id,
  source: { id },
  dateLabel: "Mon, 27 Jul",
  dateTime: "2026-07-27T10:00:00.000Z",
  timeLabel: "3:30 PM – 4:30 PM",
  indiaTimeLabel: "India time: 3:30 PM – 4:30 PM",
  legacyTimeWarning: false,
  courseName: "Phonics",
  teacherName: "Ms Anu",
  childName: "",
  status: "scheduled",
  startMs: 100,
  isToday: false,
  isFuture: true,
  canJoin: true,
  joinDisabledReason: "",
  ...overrides,
});

const canonicalMonthRow: MaterializedParentChildMonthClassAttendance = {
  kidId: "kid-1",
  monthKey: "2026-08",
  totalSessions: 18,
  completedSessions: 15,
  scheduledSessions: 1,
  inProgressSessions: 0,
  cancelledSessions: 1,
  noShowSessions: 0,
  rescheduleRequestedSessions: 1,
  rescheduledSessions: 0,
  otherSessions: 0,
  upcomingSessions: 1,
  unresolvedPastSessions: 0,
  pendingTimeUnknownSessions: 0,
  presentSessions: 12,
  lateSessions: 1,
  absentSessions: 1,
  attendanceMarkedSessions: 14,
  attendanceUnmarkedCompletedSessions: 1,
  attendancePct: 93,
  pendingSessionStartAtMs: [2_000_000_000_000],
};

const filters = [
  {
    id: "today" as const,
    label: "Today",
    count: 2,
    scopeText: "Classes scheduled for today.",
    emptyText: "No classes are scheduled for today.",
  },
  {
    id: "upcoming" as const,
    label: "Upcoming",
    count: 3,
    scopeText: "All future scheduled classes.",
    emptyText: "No upcoming classes are scheduled.",
  },
  {
    id: "completed" as const,
    label: "Completed",
    count: 4,
    scopeText: "All completed classes in the available history.",
    emptyText: "No completed classes are available yet.",
  },
  {
    id: "past_pending" as const,
    label: "Review",
    count: 1,
    scopeText: "Past scheduled classes awaiting a status update.",
    emptyText: "No past classes need review.",
  },
  {
    id: "rescheduled" as const,
    label: "Rescheduled",
    count: 5,
    scopeText: "All classes marked as rescheduled in the available history.",
    emptyText: "No rescheduled classes are available.",
  },
];

const resources = [
  { id: "calendar" as const, label: "Class calendar", description: "Browse classes by day." },
  {
    id: "recordings" as const,
    label: "Class recordings",
    description: "July Phonics folder · updated 25 Jul",
  },
];

const commonProps = {
  filters,
  nextClass: null,
  resources,
  joiningSessionId: null,
  isSessionsLoading: false,
  sessionsError: null,
  onSelectFilter: vi.fn(),
  onSelectResource: vi.fn(),
  onJoinSession: vi.fn(),
};

describe("parent class identity selection", () => {
  const kids = [{ id: "kid-a" }, { id: "kid-b" }];

  it("uses a valid requested child", () => {
    expect(resolveParentClassKidId("kid-b", kids)).toBe("kid-b");
  });

  it("uses the dashboard default first child when the URL has no kidId", () => {
    expect(resolveParentClassKidId("", kids)).toBe("kid-a");
  });

  it("rejects a stale URL kidId and uses the dashboard default child", () => {
    expect(resolveParentClassKidId("kid-stale", kids)).toBe("kid-a");
  });
});

describe("parent class presentation", () => {
  it("uses distinct parent-facing reschedule labels", () => {
    expect(getParentClassStatusLabel("scheduled")).toBe("Scheduled");
    expect(getParentClassStatusLabel("in_progress")).toBe("In progress");
    expect(getParentClassStatusLabel("completed")).toBe("Completed");
    expect(getParentClassStatusLabel("cancelled")).toBe("Cancelled");
    expect(getParentClassStatusLabel("no_show")).toBe("No show");
    expect(getParentClassStatusLabel("reschedule_requested")).toBe("Reschedule requested");
    expect(getParentClassStatusLabel("rescheduled")).toBe("Rescheduled");
  });

  it("recovers raw rescheduled status from a compatibility-normalized detail row", () => {
    const legacyNormalized = row("rescheduled", {
      status: "reschedule_requested",
      source: { id: "rescheduled", status: "rescheduled" },
    });
    expect(getParentClassDisplayStatus(legacyNormalized)).toBe("rescheduled");
  });

  it("never exposes join actions for historical or reschedule lifecycle states", () => {
    expect(shouldShowClassJoinAction("scheduled")).toBe(true);
    expect(shouldShowClassJoinAction("in_progress")).toBe(true);
    expect(shouldShowClassJoinAction("completed")).toBe(false);
    expect(shouldShowClassJoinAction("cancelled")).toBe(false);
    expect(shouldShowClassJoinAction("no_show")).toBe(false);
    expect(shouldShowClassJoinAction("reschedule_requested")).toBe(false);
    expect(shouldShowClassJoinAction("rescheduled")).toBe(false);
  });

  it("selects a today joinable class before future classes", () => {
    const future = row("future", { startMs: 200 });
    const today = row("today", { isToday: true, isFuture: false, startMs: 100 });
    expect(selectNextParentClass([future, today])?.id).toBe("today");
  });

  it("falls back to the next future class and excludes historical statuses", () => {
    const completed = row("completed", { status: "completed", startMs: 50 });
    const cancelled = row("cancelled", { status: "cancelled", startMs: 75 });
    const next = row("next", { startMs: 100 });
    expect(selectNextParentClass([completed, cancelled, next])?.id).toBe("next");
    expect(selectNextParentClass([completed, cancelled])).toBeNull();
  });

  it("derives the P8 monthly summary only from the canonical P4 child row", () => {
    const summary = buildParentClassMonthSummaryDisplay(canonicalMonthRow);
    expect(summary).toMatchObject({
      totalSessions: 18,
      completedSessions: 15,
      upcomingSessions: 1,
      cancelledSessions: 1,
      rescheduleRequestedSessions: 1,
      presentSessions: 12,
      lateSessions: 1,
      absentSessions: 1,
      attendanceMarkedSessions: 14,
      attendanceUnmarkedCompletedSessions: 1,
      attendancePct: 93,
    });
    expect(formatParentClassMonthCompletion(summary, "August 2026")).toBe(
      "15 completed of 18 August sessions",
    );
  });
});

describe("ParentClassMonthSummaryPanel", () => {
  it("shows explicit monthly class lifecycle and completed-class attendance", () => {
    render(
      <ParentClassMonthSummaryPanel
        state="available"
        monthLabel="August 2026"
        row={canonicalMonthRow}
      />,
    );

    expect(screen.getByText("15 completed of 18 August sessions")).toBeInTheDocument();
    expect(screen.getByText("Class lifecycle and attendance are kept separate from lesson progress.")).toBeInTheDocument();
    expect(screen.getByText("93%")).toBeInTheDocument();
    expect(screen.getByText("Upcoming")).toBeInTheDocument();
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
    expect(screen.getByText("No show")).toBeInTheDocument();
    expect(screen.getByText("Reschedule requests")).toBeInTheDocument();
    expect(screen.getByText("Rescheduled")).toBeInTheDocument();
    expect(screen.getByText("Needs review")).toBeInTheDocument();
    expect(screen.getByText("14 marked · 1 awaiting attendance")).toBeInTheDocument();
    expect(screen.getByText("Present")).toBeInTheDocument();
    expect(screen.getByText("Late")).toBeInTheDocument();
    expect(screen.getByText("Absent")).toBeInTheDocument();
  });

  it("shows unavailable rather than substituting parent/family totals", () => {
    render(
      <ParentClassMonthSummaryPanel
        state="unavailable"
        monthLabel="August 2026"
        row={null}
      />,
    );
    expect(screen.getByText("Class and attendance summary unavailable")).toBeInTheDocument();
    expect(screen.getByText(/Family totals are not substituted/i)).toBeInTheDocument();
  });
});

describe("ParentClassesView", () => {
  it("shows supplied detail counts and scope wording without changing row order", () => {
    const rows = [
      row("first", { dateLabel: "First date", timeLabel: "9:00 AM" }),
      row("second", { dateLabel: "Second date", timeLabel: "10:00 AM" }),
    ];
    render(<ParentClassesView {...commonProps} activeView="today" activeRows={rows} />);

    expect(screen.getByRole("tab", { name: "Today, 2" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Upcoming, 3" })).toBeInTheDocument();
    expect(screen.getByText("Classes scheduled for today.")).toBeInTheDocument();
    const sessionRows = document.querySelectorAll("[data-session-id]");
    expect(sessionRows[0]).toHaveAttribute("data-session-id", "first");
    expect(sessionRows[1]).toHaveAttribute("data-session-id", "second");
  });

  it("presents the mixed compatibility history bucket as Reschedules", () => {
    render(<ParentClassesView {...commonProps} activeView="rescheduled" activeRows={[]} />);
    expect(screen.getByRole("tab", { name: "Reschedules, 5" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Reschedule requests and rescheduled classes in the available history.")).toBeInTheDocument();
  });

  it("contains the horizontal filter row inside a clipped visual frame", () => {
    render(<ParentClassesView {...commonProps} activeView="today" activeRows={[]} />);
    expect(screen.getByTestId("parent-class-filter-frame")).toHaveClass("overflow-hidden");
    expect(screen.getByTestId("parent-class-filter-scroll")).toHaveClass("overflow-x-auto");
  });

  it("does not present loading detail counts as zero or show a no-class empty state", () => {
    render(
      <ParentClassesView
        {...commonProps}
        activeView="today"
        activeRows={[]}
        filters={filters.map((filter) => ({ ...filter, count: null }))}
        isSessionsLoading
      />,
    );
    expect(screen.getByRole("tab", { name: "Today, loading" })).toHaveTextContent("…");
    expect(screen.queryByText("No classes are scheduled for today.")).not.toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Loading classes" })).toBeInTheDocument();
  });

  it("keeps historical and attention statuses non-joinable and restores raw rescheduled display", () => {
    const historicalRows = [
      row("completed", { status: "completed", canJoin: false }),
      row("cancelled", { status: "cancelled", canJoin: false }),
      row("reschedule-requested", {
        status: "reschedule_requested",
        source: { id: "reschedule-requested", status: "reschedule_requested" },
        canJoin: false,
      }),
      row("rescheduled", {
        status: "reschedule_requested",
        source: { id: "rescheduled", status: "rescheduled" },
        canJoin: false,
      }),
    ];
    render(
      <ParentClassesView
        {...commonProps}
        activeView="completed"
        activeRows={historicalRows}
      />,
    );
    expect(screen.queryByRole("button", { name: /Join .* class/ })).not.toBeInTheDocument();
    expect(within(document.querySelector('[data-session-id="completed"]') as HTMLElement).getByText("Completed")).toBeInTheDocument();
    expect(within(document.querySelector('[data-session-id="cancelled"]') as HTMLElement).getByText("Cancelled")).toBeInTheDocument();
    expect(within(document.querySelector('[data-session-id="reschedule-requested"]') as HTMLElement).getByText("Reschedule requested")).toBeInTheDocument();
    expect(within(document.querySelector('[data-session-id="rescheduled"]') as HTMLElement).getByText("Rescheduled")).toBeInTheDocument();
  });

  it("joins the correct session and exposes a disabled reason", () => {
    const onJoinSession = vi.fn();
    const enabled = row("enabled", { courseName: "Early Maths" });
    const disabled = row("disabled", {
      courseName: "Reading",
      canJoin: false,
      joinDisabledReason: "A class link is not available yet.",
    });
    render(
      <ParentClassesView
        {...commonProps}
        activeView="today"
        activeRows={[enabled, disabled]}
        nextClass={enabled}
        onJoinSession={onJoinSession}
      />,
    );
    fireEvent.click(screen.getAllByRole("button", { name: "Join Early Maths class" })[0]);
    expect(onJoinSession).toHaveBeenCalledWith(enabled);
    const disabledJoin = screen.getByRole("button", { name: "Join Reading class" });
    expect(disabledJoin).toBeDisabled();
    expect(disabledJoin).toHaveAccessibleDescription("A class link is not available yet.");
  });

  it("renders a calm no-next-class state distinct from loading", () => {
    render(<ParentClassesView {...commonProps} activeView="upcoming" activeRows={[]} />);
    expect(screen.getByText("No upcoming class")).toBeInTheDocument();
    expect(screen.getByText("No upcoming classes are scheduled.")).toBeInTheDocument();
    expect(screen.queryByLabelText("Loading classes")).not.toBeInTheDocument();
  });

  it("preserves local filter and remaining class-resource callbacks", () => {
    function Harness() {
      const [activeView, setActiveView] = useState<ParentClassesFilterId>("today");
      return (
        <ParentClassesView
          {...commonProps}
          activeView={activeView}
          activeRows={[row(activeView, { courseName: `${activeView} course` })]}
          onSelectFilter={setActiveView}
        />
      );
    }
    const onSelectResource = vi.fn();
    const { rerender } = render(<Harness />);
    fireEvent.click(screen.getByRole("tab", { name: "Upcoming, 3" }));
    expect(screen.getByRole("tab", { name: "Upcoming, 3" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("upcoming course")).toBeInTheDocument();

    rerender(
      <ParentClassesView
        {...commonProps}
        activeView="today"
        activeRows={[]}
        onSelectResource={onSelectResource}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Class calendar/i }));
    expect(screen.queryByRole("button", { name: /Worksheets/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Class recordings/i }));
    expect(screen.getByText("July Phonics folder · updated 25 Jul")).toBeInTheDocument();
    expect(onSelectResource.mock.calls.map(([id]) => id)).toEqual([
      "calendar",
      "recordings",
    ]);
  });

  it("keeps India-time and legacy schedule text visible with safe long-name layout", () => {
    const legacy = row("legacy", {
      courseName: "A very long programme name that must remain readable",
      teacherName: "A very long teacher name that must remain readable",
      indiaTimeLabel: "India time: 3:30 PM – 4:30 PM · Legacy schedule time",
      legacyTimeWarning: true,
    });
    render(<ParentClassesView {...commonProps} activeView="today" activeRows={[legacy]} />);
    const session = document.querySelector('[data-session-id="legacy"]');
    expect(session).not.toBeNull();
    expect(within(session as HTMLElement).getByText(/Legacy schedule time/)).toBeInTheDocument();
    expect(within(session as HTMLElement).getByText(legacy.courseName)).toHaveClass("break-words");
    expect(within(session as HTMLElement).getByText(/A very long teacher name/)).toHaveClass("break-words");
  });
});
