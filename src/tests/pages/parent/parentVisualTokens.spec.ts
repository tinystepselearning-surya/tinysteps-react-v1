import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  formatParentStageLabel,
  stripParentStagePrefix,
} from "../../../pages/parent/parentVisualTokens";

describe("parent visual presentation helpers", () => {
  it("removes only an existing stage prefix", () => {
    expect(stripParentStagePrefix("Stage 3 — Blending", 3)).toBe("Blending");
    expect(stripParentStagePrefix("Stage 3: Blending", 3)).toBe("Blending");
    expect(stripParentStagePrefix("Stage 3 - Blending", 3)).toBe("Blending");
  });

  it("keeps a clean or long curriculum label intact", () => {
    expect(stripParentStagePrefix("Blending", 3)).toBe("Blending");
    expect(
      formatParentStageLabel(
        "Reading and blending increasingly complex phoneme patterns",
        4,
      ),
    ).toBe(
      "Stage 4 — Reading and blending increasingly complex phoneme patterns",
    );
  });

  it("provides a calm fallback for a missing label without duplicating the stage", () => {
    expect(stripParentStagePrefix("", 2)).toBe("Stage 2");
    expect(formatParentStageLabel("", 2)).toBe("Stage 2");
    expect(formatParentStageLabel("Stage 2 — ", 2)).toBe("Stage 2");
    expect(formatParentStageLabel("Foundations", 0)).toBe("Foundations");
  });

  it("does not introduce Firebase imports into the shared presentation module", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/pages/parent/parentVisualTokens.ts"),
      "utf8",
    );
    expect(source).not.toMatch(/firebase\/|firebaseConfig|from\s+["']firebase/);
  });
});
