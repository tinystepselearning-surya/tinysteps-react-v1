import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import KidsBalloonPop from "../../pages/KidsBalloonPop";

class FakeAudio {
  preload = ""; volume = 1; muted = false; currentTime = 0;
  constructor(public src: string) {}
  pause() {}
  play() { return Promise.resolve(); }
}

function renderGame() {
  return render(
    <MemoryRouter initialEntries={["/kids/games/phonics/balloon-pop?kidId=test-kid"]}>
      <Routes><Route path="/kids/games/phonics/balloon-pop" element={<KidsBalloonPop disableFullscreen unlockAllLevels />} /></Routes>
    </MemoryRouter>,
  );
}

describe("KidsBalloonPop pedagogy UX", () => {
  beforeEach(() => {
    vi.stubGlobal("Audio", FakeAudio as unknown as typeof Audio);
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.spyOn(Math, "random").mockReturnValue(0.01);
    localStorage.clear();
  });
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it("uses one correct balloon by default and an auditory-only cue", async () => {
    renderGame();
    expect(screen.getByRole("button", { name: /Listening Focus/i })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: /Sound Group 1: s a t i p n/i }));
    const start = await screen.findByRole("button", { name: /Start Listening/i });
    expect(screen.getAllByRole("button", { name: "Balloon s" })).toHaveLength(1);
    fireEvent.click(start);
    const cue = await screen.findByTestId("balloon-pop-sound-cue");
    expect(cue).toHaveTextContent("Listen carefully");
    expect(cue).toHaveTextContent("Tap to hear again");
  });

  it("adds visual guidance only after the second mistake", async () => {
    renderGame();
    fireEvent.click(screen.getByRole("button", { name: /Sound Group 1: s a t i p n/i }));
    fireEvent.click(await screen.findByRole("button", { name: /Start Listening/i }));
    const distractor = screen.getAllByRole("button", { name: "Balloon a" })[0];
    fireEvent.click(distractor);
    expect(await screen.findByText(/Listen again/i)).toBeInTheDocument();
    expect((screen.getByRole("button", { name: "Balloon s" }).getAttribute("style") || "")).not.toContain("hintPulse");
    fireEvent.click(distractor);
    expect(await screen.findByText(/matching balloon will glow/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: "Balloon s" }).getAttribute("style") || "").toContain("hintPulse"));
  });

  it("offers a separate speed challenge with two matches", async () => {
    renderGame();
    fireEvent.click(screen.getByRole("button", { name: /Speed Challenge/i }));
    fireEvent.click(screen.getByRole("button", { name: /Sound Group 1: s a t i p n/i }));
    const start = await screen.findByRole("button", { name: /Start Listening/i });
    expect(screen.getAllByRole("button", { name: "Balloon s" })).toHaveLength(2);
    fireEvent.click(start);
    expect(await screen.findByText(/Listen — pop all matches/i)).toBeInTheDocument();
  });

  it("shows positive micro-feedback for a correct pop", async () => {
    renderGame();
    fireEvent.click(screen.getByRole("button", { name: /Sound Group 1: s a t i p n/i }));
    fireEvent.click(await screen.findByRole("button", { name: /Start Listening/i }));
    fireEvent.click(screen.getByRole("button", { name: "Balloon s" }));
    expect(await screen.findByRole("status")).toHaveTextContent(/Great listening/i);
  });
});
