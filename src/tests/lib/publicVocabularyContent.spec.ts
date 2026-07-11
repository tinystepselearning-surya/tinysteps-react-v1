import { describe, expect, it } from "vitest";
import {
  PUBLIC_VOCABULARY_LEVELS,
  PUBLIC_VOCABULARY_WORDS,
  validatePublicVocabularyContent,
} from "../../lib/publicVocabularyContent";

describe("publicVocabularyContent", () => {
  it("validates vocabulary content without throwing", () => {
    expect(() => validatePublicVocabularyContent()).not.toThrow();
  });

  it("keeps level and challenge IDs unique", () => {
    const levelIds = new Set(PUBLIC_VOCABULARY_LEVELS.map((level) => level.id));
    const challengeIds = new Set(
      PUBLIC_VOCABULARY_LEVELS.flatMap((level) => level.challenges.map((challenge) => challenge.id)),
    );

    expect(levelIds.size).toBe(PUBLIC_VOCABULARY_LEVELS.length);
    expect(challengeIds.size).toBe(
      PUBLIC_VOCABULARY_LEVELS.reduce((sum, level) => sum + level.challenges.length, 0),
    );
  });

  it("reuses a substantial shared vocabulary bank", () => {
    expect(PUBLIC_VOCABULARY_WORDS.length).toBeGreaterThanOrEqual(50);
    expect(PUBLIC_VOCABULARY_LEVELS.length).toBe(6);
  });
});
