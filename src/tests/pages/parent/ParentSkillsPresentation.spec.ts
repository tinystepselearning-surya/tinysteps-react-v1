import { describe, expect, it } from "vitest";

import {
  buildParentSkillRatingDisplay,
  dedupeParentSkillLabels,
  formatParentSkillTag,
  parentSkillUpdateId,
} from "../../../pages/parent/components/skills/parentSkillsPresentation";
import type { ProgressSkillDefinition } from "../../../lib/progressSkills";

const skills: ProgressSkillDefinition[] = [
  { key: "recognition", label: "Recognition" },
  { key: "blending", label: "Blending" },
];

describe("parent Skills rating presentation", () => {
  it("keeps explicit zero distinct from missing ratings", () => {
    const result = buildParentSkillRatingDisplay({
      skills,
      normalizedRatings: { recognition: 0, blending: 3 },
      explicitRatings: { recognition: 0 },
      origin: "explicit",
    });

    expect(result.state).toBe("partially_rated");
    expect(result.stateLabel).toBe("Partially rated");
    expect(result.entries).toEqual([
      expect.objectContaining({ key: "recognition", value: 0, text: "Not started", state: "not_started" }),
      expect.objectContaining({ key: "blending", value: null, text: "Not rated yet", state: "unrated" }),
    ]);
  });

  it("labels a complete explicit zero record without displaying it as absent", () => {
    const result = buildParentSkillRatingDisplay({
      skills,
      normalizedRatings: { recognition: 0, blending: 0 },
      explicitRatings: { recognition: 0, blending: 0 },
      origin: "explicit",
    });

    expect(result.state).toBe("explicit_not_started");
    expect(result.stateLabel).toBe("Explicitly marked Not started");
    expect(result.entries.every((entry) => entry.value === 0)).toBe(true);
  });

  it("labels fully rated and partially rated records accurately", () => {
    const full = buildParentSkillRatingDisplay({
      skills,
      normalizedRatings: { recognition: 4, blending: 2 },
      explicitRatings: { recognition: 4, blending: 2 },
      origin: "explicit",
    });
    const partial = buildParentSkillRatingDisplay({
      skills,
      normalizedRatings: { recognition: 4, blending: 0 },
      explicitRatings: { recognition: 4 },
      origin: "explicit",
    });

    expect(full.state).toBe("rated");
    expect(full.entries.map((entry) => entry.text)).toEqual(["Mastered", "Developing"]);
    expect(partial.state).toBe("partially_rated");
  });

  it("does not promote absent or ambiguous legacy zero values to teacher ratings", () => {
    const absent = buildParentSkillRatingDisplay({
      skills,
      normalizedRatings: { recognition: 0, blending: 0 },
      origin: "none",
    });
    const legacy = buildParentSkillRatingDisplay({
      skills,
      normalizedRatings: { recognition: 0, blending: 2 },
      origin: "legacy",
    });

    expect(absent.state).toBe("unrated");
    expect(absent.entries.every((entry) => entry.value === null)).toBe(true);
    expect(legacy.state).toBe("partially_rated");
    expect(legacy.entries[0]).toEqual(expect.objectContaining({ value: null, text: "Not rated yet" }));
    expect(legacy.entries[1]).toEqual(expect.objectContaining({ value: 2, text: "Developing" }));
  });

  it("handles missing skill definitions as no rating data", () => {
    expect(
      buildParentSkillRatingDisplay({
        skills: [],
        normalizedRatings: {},
        explicitRatings: {},
        origin: "explicit",
      }),
    ).toEqual({ entries: [], state: "no_skills", stateLabel: "No rating data" });
  });

  it("deduplicates exact labels without changing first-seen order", () => {
    expect(dedupeParentSkillLabels(["Blending", "Reading", "Blending", "Writing"], 3)).toEqual([
      "Blending",
      "Reading",
      "Writing",
    ]);
  });

  it("formats parent-friendly skill tags and deterministic update identities", () => {
    expect(formatParentSkillTag("subtopic:cvc_word_reading")).toBe("Cvc Word Reading");
    expect(formatParentSkillTag("letter:a")).toBe("Letter A");
    expect(
      parentSkillUpdateId({
        tag: "blending",
        stageLabel: "Stage 2",
        stageOrder: 2,
        updatedAtMs: 123,
      }),
    ).toBe("blending__Stage 2__2__123");
  });
});
