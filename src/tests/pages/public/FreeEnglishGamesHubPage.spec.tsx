import type { ReactNode } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FreeEnglishGamesHubPage from "../../../pages/public/FreeEnglishGamesHubPage";
import EnglishExcellenceHub from "../../../components/games/EnglishExcellenceHub";
import {
  PUBLIC_ENGLISH_GAMES_CATEGORY_CONFIGS,
  getPublicEnglishGameDirectoryEntries,
} from "../../../lib/publicEnglishGames";
import { ENGLISH_EXCELLENCE_STAGES } from "../../../lib/englishExcellenceMission";

const publicMocks = vi.hoisted(() => ({
  recordLevelResultMock: vi.fn(),
  loadBbsProgressMock: vi.fn(() => ({})),
  loadGrammarFixProgressMock: vi.fn(() => ({})),
  loadCollocationBuilderProgressMock: vi.fn(() => ({})),
  applySeoMock: vi.fn(),
}));

vi.mock("../../../components/common/Meta", () => ({
  default: () => null,
}));

vi.mock("../../../lib/seo", () => ({
  applySeo: publicMocks.applySeoMock,
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
  recordLevelResult: publicMocks.recordLevelResultMock,
}));

vi.mock("../../../pages/kids/games/grammar/buildBetterSentencesProgress", () => ({
  BBS_STAGE_1A: "1a",
  BBS_STAGE_1B: "1b",
  BBS_STAGE_1C: "1c",
  BBS_STAGE_1D: "1d",
  loadBbsProgress: publicMocks.loadBbsProgressMock,
}));

vi.mock("../../../pages/kids/games/grammar/grammarFixProgress", () => ({
  GF_STAGE_2A: "2a",
  GF_STAGE_2B: "2b",
  GF_STAGE_2C: "2c",
  GF_STAGE_2D: "2d",
  loadGrammarFixProgress: publicMocks.loadGrammarFixProgressMock,
}));

vi.mock("../../../pages/kids/games/grammar/collocationBuilderProgress", () => ({
  CB_STAGE_3A: "3a",
  CB_STAGE_3B: "3b",
  CB_STAGE_3C: "3c",
  loadCollocationBuilderProgress: publicMocks.loadCollocationBuilderProgressMock,
}));

function renderPage(initialEntry = "/free-english-games-for-kids") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/free-english-games-for-kids" element={<FreeEnglishGamesHubPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("FreeEnglishGamesHubPage", () => {
  beforeEach(() => {
    localStorage.clear();
    publicMocks.applySeoMock.mockClear();
  });

  it("renders publicly without kidId and shows the public mode labels", () => {
    renderPage();

    expect(screen.getByText(/free learning games/i)).toBeInTheDocument();
    expect(
      screen.getByText(/play free english games for kids\. no login required\./i),
    ).toBeInTheDocument();
    expect(screen.getByText("English Excellence Games")).toBeInTheDocument();
    expect(screen.getByText("Temporary")).toBeInTheDocument();
    expect(screen.getByText("Browser Only")).toBeInTheDocument();
  });

  it('shows "Play Free" only for the public-safe cards and keeps tracking modules untouched', () => {
    renderPage();

    expect(screen.getAllByText("Play Free").length).toBeGreaterThan(0);
    expect(screen.getAllByText("FREE TO PLAY").length).toBeGreaterThan(0);
    expect(screen.getByText("Letter Sounds")).toBeInTheDocument();
    expect(screen.getByText("Sound Listening")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /build words/i }));
    expect(screen.getByText("Blend 2 Sounds")).toBeInTheDocument();
    expect(screen.getByText("Spelling Practice")).toBeInTheDocument();
    expect(screen.getAllByText("Play Free").length).toBeGreaterThan(0);
    expect(screen.getAllByText("FREE TO PLAY").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: /make sentences/i }));
    expect(screen.getByText("Sentence Builder")).toBeInTheDocument();
    expect(screen.getAllByText("Play Free").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/ready soon|coming soon/i).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: /fluent reading/i }));
    expect(screen.getAllByText("Fluent Reading").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Play Free").length).toBeGreaterThan(0);
    expect(screen.getAllByText("FREE TO PLAY").length).toBeGreaterThan(0);
    expect(screen.getByText("Story Reading")).toBeInTheDocument();
    expect(screen.getAllByText(/ready soon|coming soon/i).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: /grammar practice/i }));
    expect(screen.getByText("Build Better Sentences")).toBeInTheDocument();
    expect(screen.getAllByText("Play Free").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/ready soon|coming soon/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/^READY$/i)).not.toBeInTheDocument();
    expect(publicMocks.recordLevelResultMock).not.toHaveBeenCalled();
    expect(publicMocks.loadBbsProgressMock).not.toHaveBeenCalled();
    expect(publicMocks.loadGrammarFixProgressMock).not.toHaveBeenCalled();
    expect(publicMocks.loadCollocationBuilderProgressMock).not.toHaveBeenCalled();
  });

  it("stores temporary browser-only completion locally", () => {
    renderPage();

    const markCompletedButtons = screen.getAllByRole("button", { name: /mark as completed/i });
    fireEvent.click(markCompletedButtons[0]);

    expect(localStorage.getItem("ts_public_game_progress_v1")).toContain("completedTileIds");
    expect(screen.getByRole("button", { name: /set to in progress/i })).toBeInTheDocument();
  });

  it("renders all category routes as descriptive links in the initial render", () => {
    renderPage();

    const section = screen.getByRole("region", { name: /browse english games by skill/i });
    for (const category of PUBLIC_ENGLISH_GAMES_CATEGORY_CONFIGS) {
      expect(within(section).getByRole("link", { name: category.h1 })).toHaveAttribute("href", category.route);
    }
  });

  it("renders every unique playable canonical game route once in the initial directory", () => {
    renderPage();

    const section = screen.getByRole("region", { name: /play free english games/i });
    const expected = getPublicEnglishGameDirectoryEntries();
    const directoryLinks = within(section).getAllByRole("link");
    expect(directoryLinks).toHaveLength(expected.length);
    expect(new Set(expected.map((game) => game.route)).size).toBe(expected.length);
    for (const game of expected) {
      expect(within(section).getByRole("link", { name: `Play ${game.title}` })).toHaveAttribute("href", game.route);
    }
  });

  it("uses real links for playable cards and no active links for locked cards", () => {
    renderPage();

    expect(screen.getByRole("link", { name: "Play Letter Sounds" })).toHaveAttribute(
      "href",
      "/free-letter-sounds-game-for-kids",
    );
    fireEvent.click(screen.getByRole("button", { name: /make sentences/i }));
    expect(screen.getByText("Read Sentences").closest("article")?.querySelector("a")).toBeNull();
    expect(screen.getByRole("link", { name: "Play Sentence Builder" })).toHaveAttribute(
      "href",
      "/free-sentence-making-game-for-kids",
    );
  });

  it("marks a card complete without following its card link", () => {
    renderPage();

    const card = screen.getByRole("link", { name: "Play Letter Tracing" }).closest("article");
    fireEvent.click(within(card as HTMLElement).getByRole("button", { name: /mark as completed/i }));
    expect(screen.getByRole("heading", { name: "English Excellence Games" })).toBeInTheDocument();
    expect(within(card as HTMLElement).getByRole("button", { name: /set to in progress/i })).toBeInTheDocument();
  });

  it("preserves the page SEO metadata", () => {
    renderPage();

    expect(publicMocks.applySeoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Free English Games for Kids | Phonics, Reading, Grammar & Speaking",
        description: expect.stringContaining("No login required"),
        canonicalPath: "/free-english-games-for-kids",
      }),
    );
  });

  it("keeps callback navigation available for the authenticated hub use case", () => {
    const onTileClick = vi.fn();
    const stage = ENGLISH_EXCELLENCE_STAGES[0];
    const tile = stage.tiles[0];
    render(
      <MemoryRouter>
        <EnglishExcellenceHub
          brandSubtitle="Kid workspace"
          title="English Excellence Mission"
          currentStage={stage}
          trainingTracks={[{ stageId: stage.stageId, stageNumber: 1, title: stage.stageTitle, completed: 0, total: 1, playable: 1, pct: 0 }]}
          stats={[]}
          cards={[{ tile, icon: "A", badgeText: "READY", badgeClassName: "", footerText: "Tap to open", ctaText: "Play", locked: false, isCompleted: false }]}
          selectedStageIndex={0}
          onSelectStage={vi.fn()}
          onTileClick={onTileClick}
        />
      </MemoryRouter>,
    );

    const article = screen.getByText(tile.gameTitle).closest("article");
    expect(article?.querySelector("a")).toBeNull();
    fireEvent.click(article as HTMLElement);
    expect(onTileClick).toHaveBeenCalledWith(stage.stageNumber, tile);
  });

  it("renders card links with correct hrefs for all enabled games in stage 1", () => {
    renderPage();

    // Stage 1 games that should be playable and linked
    const expectedStage1Games = [
      { name: "Play Letter Tracing", href: "/free-letter-tracing-game-for-kids" },
      { name: "Play Letter Sounds", href: "/free-letter-sounds-game-for-kids" },
      { name: "Play Balloon Pop", href: "/free-balloon-pop-phonics-game-for-kids" },
    ];

    for (const game of expectedStage1Games) {
      const link = screen.queryByRole("link", { name: game.name });
      expect(link, `Link "${game.name}" should exist`).toBeTruthy();
      if (link) {
        expect(link).toHaveAttribute("href", game.href);
        // Verify the link is absolutely positioned for card overlay
        expect(link).toHaveClass("absolute", "inset-0", "z-10");
      }
    }
  });

  it("allows clicking card links to navigate to game pages", () => {
    render(
      <MemoryRouter initialEntries={["/free-english-games-for-kids"]}>
        <Routes>
          <Route path="/free-english-games-for-kids" element={<FreeEnglishGamesHubPage />} />
          <Route path="/free-letter-tracing-game-for-kids" element={<div data-testid="letter-tracing-page">Letter Tracing Page</div>} />
          <Route path="/free-letter-sounds-game-for-kids" element={<div data-testid="letter-sounds-page">Letter Sounds Page</div>} />
          <Route path="/letter-tracing-with-sounds-game" element={<div data-testid="letter-tracing-sounds-page">Letter Tracing With Sounds Page</div>} />
          <Route path="/free-balloon-pop-phonics-game-for-kids" element={<div data-testid="balloon-pop-page">Balloon Pop Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    // Test Letter Tracing navigation
    const letterTracingLink = screen.getByRole("link", { name: /play letter tracing$/i });
    fireEvent.click(letterTracingLink);
    expect(screen.queryByTestId("letter-tracing-page")).toBeInTheDocument();
  });
});
