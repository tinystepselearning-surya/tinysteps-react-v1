import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ParentClassesView from "../../../pages/parent/components/classes/ParentClassesView";
import type {
  ParentClassesFilterId,
  ParentClassSessionDisplay,
} from "../../../pages/parent/components/classes/parentClassPresentation";

const filters = [
  {
    id: "past_pending" as ParentClassesFilterId,
    label: "Review",
    count: 1,
    scopeText: "Past scheduled classes awaiting a status update.",
    emptyText: "No past classes need review.",
  },
];

const resources = [
  { id: "calendar" as const, label: "Class calendar", description: "Browse classes by day." },
  { id: "recordings" as const, label: "Class recordings", description: "No recordings yet." },
];

const scheduledRow = (
  id: string,
  overrides: Partial<ParentClassSessionDisplay>,
): ParentClassSessionDisplay => ({
  id,
  source: { id },
  dateLabel: "Thu 20 Aug",
  dateTime: "2026-08-20T07:00:00.000Z",
  timeLabel: "12:30 - 13:05",
  indiaTimeLabel: "India time: 12:30 - 13:05 IST",
  legacyTimeWarning: false,
  courseName: "Early Phonics",
  teacherName: "Teacher",
  childName: "",
  status: "scheduled",
  startMs: 1,
  isToday: false,
  isFuture: false,
  canJoin: true,
  joinDisabledReason: "",
  ...overrides,
});

describe("ParentClassesView past join guard", () => {
  it("never offers Join Class for a past scheduled Review row", () => {
    const past = scheduledRow("past", {});

    render(
      <ParentClassesView
        activeView="past_pending"
        filters={filters}
        activeRows={[past]}
        nextClass={null}
        resources={resources}
        joiningSessionId={null}
        isSessionsLoading={false}
        sessionsError={null}
        onSelectFilter={vi.fn()}
        onSelectResource={vi.fn()}
        onJoinSession={vi.fn()}
      />,
    );

    expect(screen.getByText("Scheduled")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Join Early Phonics class/i })).not.toBeInTheDocument();
  });

  it("keeps Join Class available for a future scheduled row", () => {
    const future = scheduledRow("future", { isFuture: true, startMs: Date.now() + 60_000 });

    render(
      <ParentClassesView
        activeView="past_pending"
        filters={filters}
        activeRows={[future]}
        nextClass={future}
        resources={resources}
        joiningSessionId={null}
        isSessionsLoading={false}
        sessionsError={null}
        onSelectFilter={vi.fn()}
        onSelectResource={vi.fn()}
        onJoinSession={vi.fn()}
      />,
    );

    expect(screen.getAllByRole("button", { name: /Join Early Phonics class/i }).length).toBeGreaterThan(0);
  });
});
