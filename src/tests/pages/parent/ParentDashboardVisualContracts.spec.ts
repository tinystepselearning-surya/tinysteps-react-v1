import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readSource = (file: string) =>
  readFileSync(resolve(process.cwd(), file), "utf8");

describe("parent premium visual contracts", () => {
  it("keeps every Parent Menu destination in its established order", () => {
    const source = readSource("src/pages/parent/ParentDashboard.tsx");
    const destinations = [
      "Overview",
      "Insights",
      "Games Progress",
      "Skills",
      "Classes",
      "Messages",
      "Holiday Calendar",
      "Payments",
    ];
    let cursor = source.indexOf("const parentNavItems");

    destinations.forEach((destination) => {
      const next = source.indexOf(`label: "${destination}"`, cursor);
      expect(next).toBeGreaterThan(cursor);
      cursor = next;
    });
    expect(source).toContain('aria-label="Parent Menu destinations"');
    expect(source).toContain('aria-current={isActive ? "page" : undefined}');
  });

  it("keeps every Profile & Payments section and its payment action", () => {
    const dashboardSource = readSource("src/pages/parent/ParentDashboard.tsx");
    const paymentsSource = readSource(
      "src/pages/parent/components/payments/ParentProfilePaymentsPanel.tsx",
    );

    ["Parent", "Children", "Enrolments", "Class insights"].forEach((heading) => {
      expect(dashboardSource).toContain(`>${heading}<`);
    });
    expect(paymentsSource).toContain(">Payments<");
    expect(paymentsSource).toContain("Parent class rates");
    expect(paymentsSource).toContain("onClick={onOpenPayments}");
    expect(paymentsSource).toContain("Open Payments");
  });

  it("uses the existing safe-area variable once on the native parent header", () => {
    const stylesheet = readSource("src/index.css");
    const rule = stylesheet.match(
      /html\.ts-capacitor-native \.ts-parent-mobile-header \{([\s\S]*?)\}/,
    )?.[1];

    expect(rule).toContain("top: 0");
    expect(rule).toContain("z-index: 50");
    expect(rule).toContain(
      "padding-top: calc(var(--ts-safe-top) + 0.5rem)",
    );
    expect(rule).not.toMatch(/top:\s*-/);
    expect(rule?.match(/--ts-safe-top/g)).toHaveLength(1);
  });

  it("keeps Firebase and Firestore calls out of presentation-only components", () => {
    const files = [
      "src/pages/parent/parentVisualTokens.ts",
      "src/pages/parent/components/ParentDashboardHero.tsx",
      "src/pages/parent/components/ParentDashboardKpis.tsx",
      "src/pages/parent/components/ParentLessonTracker.tsx",
      "src/pages/parent/components/ParentMobileHeader.tsx",
      "src/pages/parent/components/classes/ParentClassesView.tsx",
      "src/pages/parent/components/insights/ParentInsightsView.tsx",
      "src/pages/parent/components/payments/ParentPaymentsView.tsx",
      "src/pages/parent/components/payments/ParentProfilePaymentsPanel.tsx",
      "src/pages/parent/components/skills/ParentSkillsView.tsx",
      "src/pages/messages/components/MessageConversation.tsx",
      "src/pages/messages/components/MessageThreadList.tsx",
    ];

    files.forEach((file) => {
      expect(readSource(file)).not.toMatch(
        /firebase\/|firebaseConfig|from\s+["']firebase|getDocs\(|onSnapshot\(|setDoc\(|updateDoc\(/,
      );
    });
  });
});
