import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const dashboardSource = fs.readFileSync(
  path.resolve(process.cwd(), "src/pages/parent/ParentDashboard.tsx"),
  "utf8",
);
const firestoreIndexes = JSON.parse(fs.readFileSync(
  path.resolve(process.cwd(), "firestore.indexes.json"),
  "utf8",
));

describe("ParentDashboard class-session read plan", () => {
  it("uses the bounded read policy instead of the old 6-month/3-month range", () => {
    expect(dashboardSource).toContain("resolveParentClassSessionDateBounds");
    expect(dashboardSource).toContain("parentClassSessionDateBounds?.startKey");
    expect(dashboardSource).toContain('where("date", ">=", parentClassSessionDateBounds.startKey)');
    expect(dashboardSource).toContain('where("date", "<=", parentClassSessionDateBounds.endKey)');
    expect(dashboardSource).not.toContain("recentRangeStart.setMonth(recentRangeStart.getMonth() - 6)");
    expect(dashboardSource).not.toContain("recentRangeEnd.setMonth(recentRangeEnd.getMonth() + 3)");
  });

  it("keeps both canonical and legacy child ownership queries scoped to the selected parent", () => {
    expect(dashboardSource).toContain('where("kidIds", "array-contains", selectedKidId)');
    expect(dashboardSource).toContain('where("kidId", "==", selectedKidId)');
    expect(dashboardSource).toContain('where("parentId", "==", user.uid)');
    expect(dashboardSource).toContain('const [snapA, snapB] = await Promise.all([');
    expect(dashboardSource).toContain('readQueryDocs("Query A", buildCanonicalQuery)');
    expect(dashboardSource).toContain('readQueryDocs("Query B", buildLegacyQuery)');
    expect(dashboardSource).toContain('emitParentLegacyFallbackTelemetry("classSessions_kidId"');
    // A missing-date historical compatibility scan must never be triggered
    // by the routine Today/Upcoming calendar.
    expect(dashboardSource).not.toContain('"classSessions_missing_date"');
  });

  it("declares the bounded Query B composite index used by legacy kidId rows", () => {
    const queryBIndex = firestoreIndexes.indexes.find((index: any) =>
      index.collectionGroup === "classSessions" &&
      index.queryScope === "COLLECTION" &&
      index.fields.map((field: any) => field.fieldPath).join("|") === "kidId|parentId|date|__name__"
    );
    expect(queryBIndex).toBeTruthy();
  });

  it("loads history lazily and does not display partial history counts", () => {
    expect(dashboardSource).toContain('parentClassSessionReadMode !== "history" ? null : completedClassSessions.length');
    expect(dashboardSource).toContain('parentClassSessionReadMode !== "history" ? null : pastPendingClassSessions.length');
    expect(dashboardSource).toContain('parentClassSessionReadMode !== "history" ? null : rescheduledClassSessions.length');
  });

  it("communicates the 14-day upcoming scope to parents", () => {
    expect(dashboardSource).toContain('scopeText: "Scheduled classes in the next 14 days."');
  });
});
