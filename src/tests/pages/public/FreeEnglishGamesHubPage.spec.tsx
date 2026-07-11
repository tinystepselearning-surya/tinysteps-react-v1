import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import FreeEnglishGamesHubPage from "../../../pages/public/FreeEnglishGamesHubPage";

const publicMocks = vi.hoisted(() => ({
  recordLevelResultMock: vi.fn(),
  loadBbsProgressMock: vi.fn(() => ({})),
  loadGrammarFixProgressMock: vi.fn(() => ({})),
  loadCollocationBuilderProgressMock: vi.fn(() => ({})),
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
});
