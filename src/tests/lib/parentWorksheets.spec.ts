import { describe, expect, it } from "vitest";

import {
  getSafeWorksheetUrl,
  toParentWorksheetItem,
  worksheetMatchesContext,
} from "../../lib/parentWorksheets";

describe("parent worksheet helpers", () => {
  it("normalizes active and archive fields used by the visibility filter", () => {
    const active = toParentWorksheetItem("active", {
      title: "Short vowels",
      worksheetUrl: "https://example.com/short-vowels.pdf",
      active: true,
      archived: false,
    });
    const inactive = toParentWorksheetItem("inactive", { active: false });
    const archived = toParentWorksheetItem("archived", { archived: true });

    expect(active.isActive && !active.isArchived).toBe(true);
    expect(inactive.isActive).toBe(false);
    expect(archived.isArchived).toBe(true);
  });

  it("matches only the supplied parent, child, course, and enrollment context", () => {
    const worksheet = toParentWorksheetItem("targeted", {
      targetParentIds: ["parent-1"],
      targetKidIds: ["kid-1"],
      targetCourseIds: ["course-1"],
      targetEnrollmentIds: ["enrollment-1"],
    });
    const matchingContext = {
      parentUid: "parent-1",
      kidId: "kid-1",
      courseIds: ["course-1"],
      enrollmentIds: ["enrollment-1"],
    };

    expect(worksheetMatchesContext(worksheet, matchingContext)).toBe(true);
    expect(worksheetMatchesContext(worksheet, { ...matchingContext, kidId: "kid-2" })).toBe(false);
    expect(worksheetMatchesContext(worksheet, { ...matchingContext, courseIds: ["course-2"] })).toBe(false);
    expect(worksheetMatchesContext(worksheet, { ...matchingContext, enrollmentIds: [] })).toBe(false);
  });

  it("allows only HTTP(S) worksheet destinations", () => {
    expect(getSafeWorksheetUrl("https://example.com/worksheet.pdf")).toBe(
      "https://example.com/worksheet.pdf",
    );
    expect(getSafeWorksheetUrl("javascript:alert(1)")).toBeNull();
    expect(getSafeWorksheetUrl("not a url")).toBeNull();
  });
});
