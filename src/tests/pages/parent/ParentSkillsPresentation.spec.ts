import { describe, expect, it } from "vitest";

import {
  buildParentSkillRatingDisplay,
  canonicalizeParentSkillsSummary,
  consolidateParentSkillUpdates,
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

  it("consolidates the same skill within a stage and keeps the newest update", () => {
    const result = consolidateParentSkillUpdates([
      { id: "old", label: "Vowel Team Recognition", stageLabel: "Magic E + word rules", updatedAtMs: 100 },
      { id: "new", label: "Vowel Team Recognition", stageLabel: "Magic E + word rules", updatedAtMs: 300 },
      { id: "middle", label: "Sound Pronunciation", stageLabel: "Magic E + word rules", updatedAtMs: 200 },
    ]);

    expect(result).toEqual([
      expect.objectContaining({ id: "new", label: "Vowel Team Recognition", updatedAtMs: 300 }),
      expect.objectContaining({ id: "middle", label: "Sound Pronunciation", updatedAtMs: 200 }),
    ]);
  });

  it("keeps the same skill separate when it belongs to different stages", () => {
    const result = consolidateParentSkillUpdates([
      { id: "stage-2", label: "Word Reading", stageLabel: "Digraphs + vowel teams", updatedAtMs: 100 },
      { id: "stage-3", label: "Word Reading", stageLabel: "Magic E + word rules", updatedAtMs: 200 },
    ]);

    expect(result).toHaveLength(2);
    expect(result.map((item) => item.id)).toEqual(["stage-3", "stage-2"]);
  });

  it("normalizes harmless casing/spacing differences when consolidating updates", () => {
    const result = consolidateParentSkillUpdates([
      { id: "a", label: "  Blending ", stageLabel: "Stage 1", updatedAtMs: 100 },
      { id: "b", label: "blending", stageLabel: " stage 1 ", updatedAtMs: 200 },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("b");
  });

  it("filters stale cross-stage phonics skills and canonicalizes the stage identity", () => {
    const result = canonicalizeParentSkillsSummary({
      courseId: "early-phonics",
      stages: [
        {
          id: "legacy-stage-4",
          label: "Stage 4 — Controlling R + secret vowel",
          order: 4,
          displayLabel: "Controlling R + secret vowel",
          skills: [
            { tag: "magic_e_rule", label: "Magic E Rule", count: 1 },
            { tag: "bossy_r_recognition", label: "Bossy R Recognition", count: 2 },
          ],
        },
      ],
      recentUpdates: [
        { id: "bad", label: "Magic E Rule", stageLabel: "Controlling R + secret vowel", updatedAtMs: 300 },
        { id: "good", label: "Bossy R Recognition", stageLabel: "Controlling R + secret vowel", updatedAtMs: 200 },
      ],
    });

    expect(result.stages).toHaveLength(1);
    expect(result.stages[0]).toMatchObject({
      order: 4,
      displayLabel: "Controlling R + secret vowel",
    });
    expect(result.stages[0].skills.map((skill) => skill.label)).toEqual(["Bossy R Recognition"]);
    expect(result.recentUpdates.map((update) => update.id)).toEqual(["good"]);
  });

  it("keeps valid Diphthong skills while excluding Magic-E leakage from stage 5", () => {
    const result = canonicalizeParentSkillsSummary({
      courseId: "early-phonics",
      stages: [
        {
          id: "legacy-stage-5",
          label: "Stage 5 — Diphthongs",
          order: 5,
          displayLabel: "Diphthongs",
          skills: [
            { tag: "magic_e_rule", label: "Magic E Rule", count: 1 },
            { tag: "diphthong_recognition", label: "Diphthong Recognition", count: 1 },
            { tag: "word_reading", label: "Word Reading", count: 1 },
          ],
        },
      ],
      recentUpdates: [],
    });

    expect(result.stages[0].skills.map((skill) => skill.label)).toEqual([
      "Diphthong Recognition",
      "Word Reading",
    ]);
  });

  it("does not apply phonics filtering to non-phonics courses", () => {
    const result = canonicalizeParentSkillsSummary({
      courseId: "basic-grammar",
      stages: [
        {
          id: "grammar-stage",
          label: "Nouns",
          order: 1,
          displayLabel: "Nouns",
          skills: [{ tag: "identify_nouns", label: "Identify Nouns", count: 1 }],
        },
      ],
      recentUpdates: [
        { id: "grammar-update", label: "Identify Nouns", stageLabel: "Nouns", updatedAtMs: 1 },
      ],
    });

    expect(result.stages).toHaveLength(1);
    expect(result.recentUpdates).toHaveLength(1);
  });
});
