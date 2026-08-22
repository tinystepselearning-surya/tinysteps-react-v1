import { describe, expect, it } from "vitest";

import {
  getSafeWorksheetUrl,
  getGoogleDriveFileId,
  getWorksheetDownloadUrl,
  groupParentWorksheets,
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

  it("derives downloads only from recognized Drive file URLs", () => {
    const drive = "https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/view?usp=sharing";
    expect(getGoogleDriveFileId(drive)).toBe("1AbCdEfGhIjKlMnOp");
    expect(getWorksheetDownloadUrl(drive)).toBe("https://drive.google.com/uc?export=download&id=1AbCdEfGhIjKlMnOp");
    expect(getWorksheetDownloadUrl("https://example.com/file.pdf")).toBeNull();
    expect(getGoogleDriveFileId("javascript:alert(1)")).toBeNull();
  });

  it("never merges duplicate lesson titles from distinct lesson/course identities", () => {
    const make = (id: string, lessonId: string, courseId: string) => toParentWorksheetItem(id, {
      title: id, url: "https://example.com/file.pdf", lessonId, lessonTitle: "Lesson-1",
      targetCourseIds: [courseId], courseId,
    });
    const groups = groupParentWorksheets([
      make("a", "foundation-lesson-1", "foundations"),
      make("b", "phonics-lesson-1", "early-phonics"),
    ]);
    expect(groups).toHaveLength(2);
    expect(groups.map((group) => group.key)).toEqual(expect.arrayContaining([
      "foundations::foundation-lesson-1", "early-phonics::phonics-lesson-1",
    ]));
  });

  it("sorts lesson groups in natural numeric order", () => {
    const make = (lessonNumber: number) => toParentWorksheetItem(`sheet-${lessonNumber}`, {
      title: `Practice ${lessonNumber}`,
      url: "https://example.com/file.pdf",
      lessonId: `lesson-${lessonNumber}`,
      lessonTitle: `Lesson-${lessonNumber}`,
      lessonFolderTitle: `Lesson-${lessonNumber}`,
      courseId: "phonics-foundations",
      courseTitle: "Phonics Foundations",
      targetCourseIds: ["phonics-foundations"],
    });

    const groups = groupParentWorksheets([make(12), make(2), make(11), make(1), make(10), make(3)]);
    expect(groups.map((group) => group.lessonTitle)).toEqual([
      "Lesson-1",
      "Lesson-2",
      "Lesson-3",
      "Lesson-10",
      "Lesson-11",
      "Lesson-12",
    ]);
  });

  it("keeps lessonless records in an explicit legacy group", () => {
    const legacy = toParentWorksheetItem("legacy", { title: "Old sheet", url: "https://example.com/old.pdf", targetCourseIds: ["course-1"] });
    expect(groupParentWorksheets([legacy])[0]).toMatchObject({ legacy: true, lessonTitle: "Legacy / General Resources" });
  });
});
