import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FreeEnglishGamesCategoryPage from "../../../pages/public/FreeEnglishGamesCategoryPage";
import { PUBLIC_ENGLISH_GAMES_CATEGORY_CONFIGS } from "../../../lib/publicEnglishGames";

const categoryMocks = vi.hoisted(() => ({
  recordLevelResultMock: vi.fn(),
}));

vi.mock("../../../components/common/Meta", () => ({
  default: () => null,
}));

vi.mock("../../../lib/seo", () => ({
  applySeo: vi.fn(),
}));

vi.mock("../../../components/common/TinyStepsBrand", () => ({
  default: ({ subtitle }: { subtitle: string }) => (
    <div>
      <span>Tiny Steps</span>
      <span>{subtitle}</span>
    </div>
  ),
}));

vi.mock("../../../components/common/MagicBento", () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../../../components/components/LiquidEther", () => ({
  default: () => <div data-testid="liquid-ether" />,
}));

vi.mock("../../../games/engine/recordLevelResult", () => ({
  recordLevelResult: categoryMocks.recordLevelResultMock,
}));

function renderRoute(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="*" element={<FreeEnglishGamesCategoryPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("FreeEnglishGamesCategoryPage", () => {
  beforeEach(() => {
    localStorage.clear();
    categoryMocks.recordLevelResultMock.mockReset();
  });

  it.each([
    ["/free-phonics-games-for-kids", "Free Phonics Games for Kids", "Letter Tracing"],
    ["/free-letter-sound-games-for-kids", "Free Letter Sound Games for Kids", "Letter Sounds"],
    ["/free-word-building-games-for-kids", "Free Word Building Games for Kids", "Blend 2 Sounds"],
    ["/free-sentence-building-games-for-kids", "Free Sentence Building Games for Kids", "Read Sentences"],
    ["/free-reading-games-for-kids", "Free Reading Games for Kids", "Fluent Reading"],
    ["/free-grammar-games-for-kids", "Free Grammar Games for Kids", "Build Better Sentences"],
    ["/free-speaking-games-for-kids", "Free Speaking Games for Kids", "Picture Talk"],
  ])(
    "renders %s publicly with trust copy and category cards",
    (route, heading, expectedCardTitle) => {
      renderRoute(route);

      expect(screen.getByRole("heading", { name: heading, level: 1 })).toBeInTheDocument();
      expect(screen.getByText(/no login required\. public progress is saved only temporarily in this browser\./i)).toBeInTheDocument();
      expect(screen.getAllByText(expectedCardTitle).length).toBeGreaterThan(0);
      expect(categoryMocks.recordLevelResultMock).not.toHaveBeenCalled();
    },
  );

  it("features Tiny Steps Phonics Balloon Pop on the letter-sound authority category", () => {
    renderRoute("/free-letter-sound-games-for-kids");

    expect(screen.getByRole("heading", { level: 2, name: /tiny steps phonics balloon pop/i })).toBeInTheDocument();
    expect(screen.getByText(/hear one target letter sound, find the matching printed letter/i)).toBeInTheDocument();
    expect(screen.getAllByText(/satpin/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /play balloon pop free/i })).toHaveAttribute(
      "href",
      "/free-balloon-pop-phonics-game-for-kids",
    );
  });

  it("covers every configured public category route", () => {
    const configuredRoutes = new Set(PUBLIC_ENGLISH_GAMES_CATEGORY_CONFIGS.map((config) => config.route));

    expect(configuredRoutes).toEqual(
      new Set([
        "/free-phonics-games-for-kids",
        "/free-letter-sound-games-for-kids",
        "/free-word-building-games-for-kids",
        "/free-sentence-building-games-for-kids",
        "/free-reading-games-for-kids",
        "/free-grammar-games-for-kids",
        "/free-speaking-games-for-kids",
      ]),
    );
  });

  it("shows Play Free only for the public-safe category cards and keeps unfinished cards in ready-soon mode", () => {
    const playableView = renderRoute("/free-letter-sound-games-for-kids");

    expect(screen.getAllByText("Letter Sounds").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Play Free").length).toBeGreaterThan(0);
    expect(screen.getAllByText("FREE TO PLAY").length).toBeGreaterThan(0);

    playableView.unmount();
    const wordBuildingView = renderRoute("/free-word-building-games-for-kids");

    expect(screen.getAllByText("Blend 2 Sounds").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Play Free").length).toBeGreaterThan(0);

    wordBuildingView.unmount();
    const spellingView = renderRoute("/free-word-building-games-for-kids");

    expect(screen.getAllByText("Spelling Practice").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Play Free").length).toBeGreaterThan(0);
    expect(screen.getAllByText("FREE TO PLAY").length).toBeGreaterThan(0);
    expect(categoryMocks.recordLevelResultMock).not.toHaveBeenCalled();
    spellingView.unmount();

    const sentenceMakingView = renderRoute("/free-sentence-building-games-for-kids");

    expect(screen.getAllByText("Sentence Builder").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Play Free").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/ready soon/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/^READY$/i)).not.toBeInTheDocument();
    expect(categoryMocks.recordLevelResultMock).not.toHaveBeenCalled();
    sentenceMakingView.unmount();

    const grammarView = renderRoute("/free-grammar-games-for-kids");

    expect(screen.getAllByText("Build Better Sentences").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Play Free").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/ready soon/i).length).toBeGreaterThan(0);
    expect(categoryMocks.recordLevelResultMock).not.toHaveBeenCalled();
    grammarView.unmount();

    renderRoute("/free-reading-games-for-kids");

    expect(screen.getAllByText("Fluent Reading").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Play Free").length).toBeGreaterThan(0);
    expect(screen.getAllByText("FREE TO PLAY").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/ready soon|coming soon/i).length).toBeGreaterThan(0);
    expect(categoryMocks.recordLevelResultMock).not.toHaveBeenCalled();
  });

  it("does not allow non-playable public games to be manually marked completed", () => {
    localStorage.setItem(
      "ts_public_game_progress_v1",
      JSON.stringify({ v: 1, completedTileIds: ["eem-g19-comprehension-questions"] }),
    );

    renderRoute("/free-reading-games-for-kids");

    const disabledMarkButtons = screen.getAllByRole("button", { name: /mark .* as completed/i })
      .filter((button) => button.hasAttribute("disabled"));

    expect(disabledMarkButtons.length).toBeGreaterThan(0);
    expect(screen.queryByText("PLAYED HERE")).not.toBeInTheDocument();

    fireEvent.click(disabledMarkButtons[0]);

    expect(screen.queryByRole("button", { name: /set .* to in progress/i })).not.toBeInTheDocument();
    expect(categoryMocks.recordLevelResultMock).not.toHaveBeenCalled();
  });
});
