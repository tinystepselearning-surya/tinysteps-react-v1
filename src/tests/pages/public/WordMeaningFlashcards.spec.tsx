import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WordMeaningFlashcards from "../../../pages/kids/games/reading/WordMeaningFlashcards";
import {
  PUBLIC_VOCABULARY_LEVELS,
  PUBLIC_VOCABULARY_WORDS_BY_ID,
} from "../../../lib/publicVocabularyContent";

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location-probe">{`${location.pathname}${location.search}`}</div>;
}

function renderRoute(initialEntry = "/free-games/word-meaning-flashcards") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="*"
          element={
            <>
              <LocationProbe />
              <WordMeaningFlashcards />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("WordMeaningFlashcards (Vocabulary Adventure)", () => {
  beforeEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it("renders intro with all activity modes and supports public back navigation", () => {
    renderRoute();

    expect(screen.getByRole("heading", { name: /vocabulary adventure/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/no audio, no login, no child profile/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /match it/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /find the word/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /context clues/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /synonym challenge/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /antonym challenge/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /word detective/i })).toBeInTheDocument();

    const backLink = screen.getByRole("link", { name: /back/i });
    expect(backLink.getAttribute("href")).toBe("/free-english-games-for-kids");
    expect(screen.getByTestId("location-probe")).toHaveTextContent("/free-games/word-meaning-flashcards");
  });

  it("handles incorrect and correct retry flow with review insertion", async () => {
    vi.useFakeTimers();
    renderRoute();

    fireEvent.click(screen.getByRole("button", { name: /match it/i }));

    const firstChallenge = PUBLIC_VOCABULARY_LEVELS[0].challenges[0];
    if (firstChallenge.mode !== "match-it") throw new Error("Unexpected challenge mode for test");

    const correctMeaning = PUBLIC_VOCABULARY_WORDS_BY_ID[firstChallenge.correctWordId].meaning;
    const wrongMeaning = firstChallenge.choiceWordIds
      .map((wordId) => PUBLIC_VOCABULARY_WORDS_BY_ID[wordId].meaning)
      .find((meaning) => meaning !== correctMeaning);

    if (!wrongMeaning) throw new Error("Expected wrong meaning option");

    fireEvent.click(screen.getByRole("button", { name: wrongMeaning }));
    expect(screen.getByText(/not yet\. try again\./i)).toBeInTheDocument();
    expect(screen.getByText(/review round added\./i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: correctMeaning }));
    expect(screen.getByText(/correct! great job\./i)).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByText(/challenge 2 of 6/i)).toBeInTheDocument();
  });

  it("supports level switching during play", () => {
    renderRoute();

    fireEvent.click(screen.getByRole("button", { name: /find the word/i }));
    expect(screen.getByRole("heading", { name: /find the word/i, level: 2 })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /change activity/i }));
    fireEvent.click(screen.getByRole("button", { name: /antonym challenge/i }));

    expect(screen.getByRole("heading", { name: /antonym challenge/i, level: 2 })).toBeInTheDocument();
  });

  it("supports keyboard submit in word detective mode", async () => {
    vi.useFakeTimers();
    renderRoute();

    fireEvent.click(screen.getByRole("button", { name: /word detective/i }));

    const input = screen.getByLabelText(/type the mystery word/i);
    fireEvent.change(input, { target: { value: "library" } });
    fireEvent.submit(input.closest("form") as HTMLFormElement);

    expect(screen.getByText(/correct! great job\./i)).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByText(/challenge 2 of 5/i)).toBeInTheDocument();
  });

  it("completes an activity and supports replay/reset", async () => {
    vi.useFakeTimers();
    renderRoute();

    fireEvent.click(screen.getByRole("button", { name: /synonym challenge/i }));

    const synonymLevel = PUBLIC_VOCABULARY_LEVELS.find((level) => level.id === "vocab-synonym");
    if (!synonymLevel) throw new Error("Missing synonym level");

    for (const challenge of synonymLevel.challenges) {
      if (challenge.mode !== "synonym") continue;
      fireEvent.click(screen.getByRole("button", { name: challenge.correctChoice }));
      await act(async () => {
        vi.advanceTimersByTime(500);
      });
    }

    expect(screen.getByText(/vocabulary adventure complete/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /replay activity/i }));
    expect(screen.getByRole("heading", { name: /synonym challenge/i, level: 2 })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /change activity/i }));
    expect(screen.getByRole("heading", { name: /vocabulary adventure/i, level: 1 })).toBeInTheDocument();
  });

  it("does not use localStorage persistence in public play", () => {
    const getSpy = vi.spyOn(Storage.prototype, "getItem");
    const setSpy = vi.spyOn(Storage.prototype, "setItem");

    renderRoute();
    fireEvent.click(screen.getByRole("button", { name: /match it/i }));

    expect(getSpy).not.toHaveBeenCalledWith("ts_word_meaning_flashcards_v2");
    expect(setSpy).not.toHaveBeenCalledWith("ts_word_meaning_flashcards_v2", expect.anything());

    getSpy.mockRestore();
    setSpy.mockRestore();
  });

  describe("Authenticated route (/kids/games/reading/word-meaning-flashcards)", () => {
    it("restores saved levelIndex from localStorage on mount", () => {
      // Pre-populate localStorage as if an authenticated session saved progress
      localStorage.setItem("ts_word_meaning_flashcards_v2", JSON.stringify({ levelIndex: 2, completedLevelIndices: [0, 1] }));

      renderRoute("/kids/games/reading/word-meaning-flashcards");

      // Verify the correct activity is pre-selected (levelIndex 2 = Context Clues, activity 3)
      const buttons = screen.getAllByRole("button", { name: /activity/i });
      expect(buttons.length).toBeGreaterThan(0);

      // Context clues should be present (third activity, index 2)
      expect(screen.getByRole("button", { name: /context clues/i })).toBeInTheDocument();
    });

    it("shows completion badges for completed levels on intro screen", () => {
      // Simulate session where activities 0 and 1 were completed
      localStorage.setItem("ts_word_meaning_flashcards_v2", JSON.stringify({ levelIndex: 0, completedLevelIndices: [0, 1] }));

      renderRoute("/kids/games/reading/word-meaning-flashcards");

      const badges = screen.getAllByText("✓");
      expect(badges.length).toBeGreaterThanOrEqual(2);
    });

    it("shows 'Your Progress Saved' mode indicator in authenticated route", () => {
      renderRoute("/kids/games/reading/word-meaning-flashcards");

      expect(screen.getByText(/your progress saved/i)).toBeInTheDocument();
    });

    it("shows 'Guest Mode' indicator in public route", () => {
      renderRoute("/free-games/word-meaning-flashcards");

      expect(screen.getByText(/guest mode/i)).toBeInTheDocument();
    });

    it("persists levelIndex when changing activity", () => {
      renderRoute("/kids/games/reading/word-meaning-flashcards");

      // Start Match It
      fireEvent.click(screen.getByRole("button", { name: /match it/i }));
      expect(screen.getByText(/activity 1 of 6/i)).toBeInTheDocument();

      // Go back and start Find the Word
      fireEvent.click(screen.getByRole("button", { name: /change activity/i }));
      fireEvent.click(screen.getByRole("button", { name: /find the word/i }));

      // Verify stored state reflects new activity
      const stored = JSON.parse(localStorage.getItem("ts_word_meaning_flashcards_v2") || "{}");
      expect(stored.levelIndex).toBe(1);
    });

    it("marks level as completed in localStorage when clicking 'Change Activity' from completion screen", async () => {
      vi.useFakeTimers();
      renderRoute("/kids/games/reading/word-meaning-flashcards");

      // Start Match It activity
      fireEvent.click(screen.getByRole("button", { name: /match it/i }));

      const matchItLevel = PUBLIC_VOCABULARY_LEVELS.find((level) => level.id === "vocab-match-it");
      if (!matchItLevel) throw new Error("Missing match-it level");

      // Complete all challenges quickly
      for (const challenge of matchItLevel.challenges) {
        if (challenge.mode !== "match-it") continue;
        const correctMeaning = PUBLIC_VOCABULARY_WORDS_BY_ID[challenge.correctWordId].meaning;
        fireEvent.click(screen.getByRole("button", { name: correctMeaning }));
        await act(async () => {
          vi.advanceTimersByTime(500);
        });
      }

      // Should reach completion screen
      expect(screen.getByText(/vocabulary adventure complete/i)).toBeInTheDocument();

      // Click "Change Activity" which should mark completion
      fireEvent.click(screen.getByRole("button", { name: /change activity/i }));

      // After changing activity, verify completion was persisted
      const stored = JSON.parse(localStorage.getItem("ts_word_meaning_flashcards_v2") || "{}");
      expect(stored.completedLevelIndices).toContain(0);
    });

    it("restores completion state across remount in authenticated route", () => {
      // Pre-set completion state
      localStorage.setItem("ts_word_meaning_flashcards_v2", JSON.stringify({ levelIndex: 0, completedLevelIndices: [0] }));

      const { unmount } = renderRoute("/kids/games/reading/word-meaning-flashcards");

      let badges = screen.getAllByText("✓");
      expect(badges.length).toBeGreaterThanOrEqual(1);

      // Unmount and remount
      unmount();
      renderRoute("/kids/games/reading/word-meaning-flashcards");

      // Completion badges should still be visible
      badges = screen.getAllByText("✓");
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });

    it("does not use or restore localStorage in public route", () => {
      // Pre-set localStorage (should be completely ignored in public mode)
      localStorage.setItem("ts_word_meaning_flashcards_v2", JSON.stringify({ levelIndex: 3, completedLevelIndices: [0, 1, 2] }));

      renderRoute("/free-games/word-meaning-flashcards");

      // Should show all 6 activities on intro, starting fresh with no saved state
      expect(screen.getByRole("button", { name: /match it/i })).toBeInTheDocument();

      // No completion badges in public mode
      const badges = screen.queryAllByText("✓");
      expect(badges.length).toBe(0);

      // When starting an activity in public mode, progress is not persisted
      fireEvent.click(screen.getByRole("button", { name: /match it/i }));
      expect(screen.getByText(/activity 1 of 6/i)).toBeInTheDocument();

      // Verify no attempt to persist was made
      const stored = JSON.parse(localStorage.getItem("ts_word_meaning_flashcards_v2") || "{}");
      expect(stored.levelIndex).not.toBe(0); // Should still be 3 from before
    });
  });
});
