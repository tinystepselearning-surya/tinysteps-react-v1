import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import LetterTracingGame from "../../../../../pages/kids/games/phonics/LetterTracingGame";

vi.mock("../../../../../lib/analytics", () => ({
  trackEvent: vi.fn(),
}));

function renderGame(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/free-letter-tracing-game-for-kids"
          element={<LetterTracingGame baseRoute="/free-letter-tracing-game-for-kids" forceAnonymousMode />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("LetterTracingGame", () => {
  const originalPrint = window.print;
  const originalRequestAnimationFrame = window.requestAnimationFrame;
  const originalCancelAnimationFrame = window.cancelAnimationFrame;
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  const originalPause = HTMLMediaElement.prototype.pause;
  const originalPlay = HTMLMediaElement.prototype.play;

  beforeEach(() => {
    window.print = vi.fn();
    window.requestAnimationFrame = vi.fn(() => 1);
    window.cancelAnimationFrame = vi.fn();
    (HTMLCanvasElement.prototype.getContext as unknown as (...args: unknown[]) => unknown) = vi.fn(() => ({
      clearRect: vi.fn(),
      setTransform: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      arc: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
    }));
    HTMLMediaElement.prototype.pause = vi.fn();
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    window.print = originalPrint;
    window.requestAnimationFrame = originalRequestAnimationFrame;
    window.cancelAnimationFrame = originalCancelAnimationFrame;
    HTMLCanvasElement.prototype.getContext = originalGetContext;
    HTMLMediaElement.prototype.pause = originalPause;
    HTMLMediaElement.prototype.play = originalPlay;
  });

  it("renders the live tracing board in play mode, including fullscreen query views", () => {
    renderGame("/free-letter-tracing-game-for-kids?level=1&pair=0&step=0&fs=1");

    expect(screen.getByTestId("letter-tracing-board")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /print worksheet/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /exit/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /levels/i })).toBeInTheDocument();
    expect(screen.getByText(/start from the red dot and follow the blue dot/i)).toBeInTheDocument();
  });

  it("prints the current worksheet through the portal with stroke numbers and arrow glyphs", () => {
    renderGame("/free-letter-tracing-game-for-kids?level=1&pair=0&step=0");

    const printButton = screen.getByRole("button", { name: /print worksheet/i });
    expect(printButton).toHaveAttribute("type", "button");

    const rafMock = vi.mocked(window.requestAnimationFrame);
    rafMock
      .mockImplementationOnce((cb: FrameRequestCallback) => {
        cb(0);
        return 1;
      })
      .mockImplementationOnce((cb: FrameRequestCallback) => {
        cb(0);
        return 2;
      });

    fireEvent.click(printButton);

    const portal = screen.getByTestId("print-worksheet-portal");
    expect(portal).toBeInTheDocument();

    const worksheetSvg = screen.getByTestId("print-worksheet-svg");
    expect(worksheetSvg.querySelector("marker")).toBeNull();
    expect(screen.getAllByTestId("print-stroke-number").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("print-arrow-glyph").length).toBeGreaterThan(0);
    expect(worksheetSvg.textContent).toContain("1");
    expect(window.print).toHaveBeenCalledTimes(1);
  });
});
