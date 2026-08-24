import { describe, expect, it } from "vitest";

import {
  PARENT_UPCOMING_CLASS_DAYS,
  resolveParentClassSessionDateBounds,
  resolveParentClassSessionReadMode,
  shouldRunParentLegacySessionFallback,
} from "../../pages/parent/parentClassSessionReadPolicy";

describe("parent class session read policy", () => {
  it("keeps operational reads to the current month plus the next 14 days", () => {
    expect(PARENT_UPCOMING_CLASS_DAYS).toBe(14);
    expect(
      resolveParentClassSessionDateBounds({
        activeTab: "dashboard",
        classesView: "today",
        now: new Date(2026, 7, 24, 10, 30),
      }),
    ).toEqual({
      startKey: "2026-08-01",
      endKey: "2026-09-07",
    });
  });

  it.each(["completed", "past_pending", "rescheduled"])(
    "loads %s history only when that history view is selected",
    (classesView) => {
      expect(resolveParentClassSessionReadMode({ activeTab: "classes", classesView })).toBe("history");
      expect(
        resolveParentClassSessionDateBounds({
          activeTab: "classes",
          classesView,
          now: new Date(2026, 7, 24),
        }),
      ).toBeNull();
    },
  );

  it("keeps Today and Upcoming on the bounded operational path", () => {
    expect(resolveParentClassSessionReadMode({ activeTab: "classes", classesView: "today" })).toBe("operational");
    expect(resolveParentClassSessionReadMode({ activeTab: "classes", classesView: "upcoming" })).toBe("operational");
  });

  it("bounds the calendar to the selected month", () => {
    expect(resolveParentClassSessionReadMode({ activeTab: "classes", classesView: "calendar" })).toBe("calendar");
    expect(
      resolveParentClassSessionDateBounds({
        activeTab: "classes",
        classesView: "calendar",
        now: new Date(2026, 7, 24),
        calendarMonth: new Date(2026, 8, 1),
      }),
    ).toEqual({
      startKey: "2026-09-01",
      endKey: "2026-09-30",
    });
  });

  it("runs the legacy kidId query only when the canonical query misses", () => {
    expect(shouldRunParentLegacySessionFallback(3)).toBe(false);
    expect(shouldRunParentLegacySessionFallback(1)).toBe(false);
    expect(shouldRunParentLegacySessionFallback(0)).toBe(true);
  });
});
