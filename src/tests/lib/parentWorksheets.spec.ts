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

  it("normalizes lesson metadata so parent resources group by the curriculum lesson", () => {
    const worksheet = toParentWorksheetItem("worksheet-1", {
      title: "CVC blending practice",
      worksheetUrl: "https://drive.google.com/file/d/example/view",
      category: "Homework",
      resourceType: "Practice worksheet",
      lessonId: "lesson-07",
      lessonTitle: "Lesson-7 · CVC Blending",
      targetLessonIds: ["lesson-07", "lesson-07"],
      targetCourseIds: ["early-phonics"],
    });

    expect(worksheet.lessonId).toBe("lesson-07");
    expect(worksheet.lessonTitle).toBe("Lesson-7 · CVC Blending");
    expect(worksheet.targetLessonIds).toEqual(["lesson-07"]);
    expect(worksheet.resourceType).toBe("Practice worksheet");
    expect(worksheet.category).toBe("Lesson-7 · CVC Blending");
    expect(worksheet.targetCourseIds).toEqual(["early-phonics"]);
  });

  it("keeps legacy worksheet records readable when lesson metadata is absent", () => {
    const worksheet = toParentWorksheetItem("legacy", {
      title: "Revision",
      category: "Revision",
      url: "https://example.com/revision.pdf",
      targetCourseIds: ["advanced-phonics"],
    });

    expect(worksheet.lessonId).toBe("");
    expect(worksheet.lessonTitle).toBe("");
    expect(worksheet.targetLessonIds).toEqual([]);
    expect(worksheet.category).toBe("Revision");
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
