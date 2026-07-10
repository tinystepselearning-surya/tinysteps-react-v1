import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import KidsEnglishExcellence from "../../pages/KidsEnglishExcellence";

const progressMocks = vi.hoisted(() => ({
  loadBbsProgressMock: vi.fn(() => ({})),
  loadGrammarFixProgressMock: vi.fn(() => ({})),
  loadCollocationBuilderProgressMock: vi.fn(() => ({})),
}));

vi.mock("../../components/common/TinyStepsBrand", () => ({
  default: ({ subtitle }: { subtitle: string }) => (
    <div>
      <span>Tiny Steps</span>
      <span>{subtitle}</span>
    </div>
  ),
}));

vi.mock("../../components/common/MagicBento", () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../../components/components/LiquidEther", () => ({
  default: () => <div data-testid="liquid-ether" />,
}));

vi.mock("../../pages/kids/games/grammar/buildBetterSentencesProgress", () => ({
  BBS_STAGE_1A: "1a",
  BBS_STAGE_1B: "1b",
  BBS_STAGE_1C: "1c",
  BBS_STAGE_1D: "1d",
  loadBbsProgress: progressMocks.loadBbsProgressMock,
}));

vi.mock("../../pages/kids/games/grammar/grammarFixProgress", () => ({
  GF_STAGE_2A: "2a",
  GF_STAGE_2B: "2b",
  GF_STAGE_2C: "2c",
  GF_STAGE_2D: "2d",
  loadGrammarFixProgress: progressMocks.loadGrammarFixProgressMock,
}));

vi.mock("../../pages/kids/games/grammar/collocationBuilderProgress", () => ({
  CB_STAGE_3A: "3a",
  CB_STAGE_3B: "3b",
  CB_STAGE_3C: "3c",
  loadCollocationBuilderProgress: progressMocks.loadCollocationBuilderProgressMock,
}));

function renderPage(initialEntry = "/kids/games/english-excellence?kidId=test-kid") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/kids/games/english-excellence" element={<KidsEnglishExcellence />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("KidsEnglishExcellence", () => {
  it("still renders the tracked hub for the kid route", () => {
    renderPage();

    expect(screen.getByText("English Excellence Mission")).toBeInTheDocument();
    expect(screen.getByText(/kid workspace/i)).toBeInTheDocument();
    expect(progressMocks.loadBbsProgressMock).toHaveBeenCalledWith("test-kid");
    expect(progressMocks.loadGrammarFixProgressMock).toHaveBeenCalledWith("test-kid");
    expect(progressMocks.loadCollocationBuilderProgressMock).toHaveBeenCalledWith("test-kid");
  });
});
