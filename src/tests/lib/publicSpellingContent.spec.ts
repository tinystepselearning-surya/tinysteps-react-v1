import { describe, expect, it } from "vitest";
import {
  PUBLIC_SPELLING_LEVELS,
  PUBLIC_SPELLING_SESSION_SIZE,
  publicSpellingPracticeRound,
  normalizePublicSpellingAnswer,
  validatePublicSpellingContent,
  type PublicSpellingChallenge,
  type PublicSpellingLevel,
} from "../../lib/publicSpellingContent";

describe("publicSpellingContent", () => {
  it("provides a valid six-mode, 108-challenge spelling curriculum", () => {
    expect(validatePublicSpellingContent(PUBLIC_SPELLING_LEVELS)).toEqual([]);
    expect(PUBLIC_SPELLING_LEVELS.map((level) => level.mode)).toEqual([
      "build",
      "family",
      "missing",
      "choice",
      "fix",
      "spell",
    ]);
    expect(PUBLIC_SPELLING_LEVELS.flatMap((level) => level.challenges)).toHaveLength(108);
    expect(PUBLIC_SPELLING_LEVELS.every((level) => level.challenges.length === 18)).toBe(true);
  });

  it("serves three different six-question sets per activity without saving progress", () => {
    expect(PUBLIC_SPELLING_SESSION_SIZE).toBe(6);
    for (const level of PUBLIC_SPELLING_LEVELS) {
      const rounds = [0, 1, 2].map(round => publicSpellingPracticeRound(level, round));
      expect(rounds.every(round => round.length === 6)).toBe(true);
      expect(new Set(rounds.flat().map(item => item.id)).size).toBe(18);
      expect(new Set(rounds.flat().map(item => item.id)))
        .toEqual(new Set(level.challenges.map(item => item.id)));
      expect(publicSpellingPracticeRound(level, 3).map(item => item.id))
        .toEqual(rounds[0].map(item => item.id));
    }
  });

  it("normalizes only outer whitespace and letter case", () => {
    expect(normalizePublicSpellingAnswer("  ElEpHaNt  ")).toBe("elephant");
    expect(normalizePublicSpellingAnswer("ice cream")).toBe("ice cream");
    expect(normalizePublicSpellingAnswer("ice  cream")).not.toBe("ice cream");
  });

  it("reports duplicate IDs, invalid choices, image paths, mode data, and revealed spell answers", () => {
    const choiceChallenge = PUBLIC_SPELLING_LEVELS[3].challenges[0] as Extract<
      PublicSpellingChallenge,
      { mode: "choice" }
    >;
    const spellChallenge = PUBLIC_SPELLING_LEVELS[5].challenges[0] as Extract<
      PublicSpellingChallenge,
      { mode: "spell" }
    >;
    const invalidLevels: PublicSpellingLevel[] = [
      {
        ...PUBLIC_SPELLING_LEVELS[3],
        id: "duplicate-level",
        challenges: [
          {
            ...choiceChallenge,
            id: "duplicate-challenge",
            choices: ["fish", "fish", "fesh"],
            img: "https://example.com/fish.png",
          },
        ],
      },
      {
        ...PUBLIC_SPELLING_LEVELS[5],
        id: "duplicate-level",
        challenges: [
          {
            ...spellChallenge,
            id: "duplicate-challenge",
            clue: "Spell the word sun.",
          },
        ],
      },
    ];

    expect(validatePublicSpellingContent(invalidLevels)).toEqual(
      expect.arrayContaining([
        "Duplicate spelling level id: duplicate-level",
        "Duplicate spelling challenge id: duplicate-challenge",
        "duplicate-challenge has duplicate spelling choices.",
        "duplicate-challenge must contain its correct answer exactly once.",
        "duplicate-challenge has an invalid image path: https://example.com/fish.png",
        "duplicate-challenge reveals its target word in the clue.",
      ]),
    );
  });
});
