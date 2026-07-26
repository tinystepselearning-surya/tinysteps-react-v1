import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import ParentClassesView from "../../../pages/parent/components/classes/ParentClassesView";
import {
  getParentClassStatusLabel,
  selectNextParentClass,
  type ParentClassesFilterId,
  type ParentClassSessionDisplay,
} from "../../../pages/parent/components/classes/parentClassPresentation";

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
  { id: "worksheets" as const, label: "Worksheets", description: "Practice resources.", count: 6 },
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

describe("parent class presentation", () => {
  it("uses parent-facing status labels", () => {
    expect(getParentClassStatusLabel("scheduled")).toBe("Scheduled");
    expect(getParentClassStatusLabel("in_progress")).toBe("In progress");
    expect(getParentClassStatusLabel("completed")).toBe("Completed");
    expect(getParentClassStatusLabel("cancelled")).toBe("Cancelled");
    expect(getParentClassStatusLabel("no_show")).toBe("No show");
    expect(getParentClassStatusLabel("reschedule_requested")).toBe("Rescheduled");
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
});

describe("ParentClassesView", () => {
  it("shows supplied counts and scope wording without changing row order", () => {
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

  it("contains the horizontal filter row inside a clipped visual frame", () => {
    render(<ParentClassesView {...commonProps} activeView="today" activeRows={[]} />);
    expect(screen.getByTestId("parent-class-filter-frame")).toHaveClass("overflow-hidden");
    expect(screen.getByTestId("parent-class-filter-scroll")).toHaveClass("overflow-x-auto");
  });

  it("does not present loading counts as zero or show a no-class empty state", () => {
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

  it("keeps historical and attention statuses non-joinable", () => {
    const historicalRows = [
      row("completed", { status: "completed", canJoin: false }),
      row("cancelled", { status: "cancelled", canJoin: false }),
      row("rescheduled", { status: "reschedule_requested", canJoin: false }),
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

  it("preserves local filter and resource callbacks", () => {
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
    fireEvent.click(screen.getByRole("button", { name: /Worksheets/i }));
    fireEvent.click(screen.getByRole("button", { name: /Class recordings/i }));
    expect(screen.getByText("July Phonics folder · updated 25 Jul")).toBeInTheDocument();
    expect(onSelectResource.mock.calls.map(([id]) => id)).toEqual([
      "calendar",
      "worksheets",
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
