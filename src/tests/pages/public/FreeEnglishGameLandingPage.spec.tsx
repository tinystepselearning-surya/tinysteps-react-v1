import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FreeEnglishGameLandingPage from "../../../pages/public/FreeEnglishGameLandingPage";
import { PUBLIC_ENGLISH_GAME_LANDING_CONFIGS } from "../../../lib/publicEnglishGames";

const landingMocks = vi.hoisted(() => ({
  recordLevelResultMock: vi.fn(),
  getFirestoreMock: vi.fn(),
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

vi.mock("../../../components/components/LiquidEther", () => ({
  default: () => <div data-testid="liquid-ether" />,
}));

vi.mock("../../../components/common/MagicBento", () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../../../games/engine/recordLevelResult", () => ({
  recordLevelResult: landingMocks.recordLevelResultMock,
}));

vi.mock("firebase/firestore", () => ({
  getFirestore: landingMocks.getFirestoreMock,
  doc: vi.fn(),
  setDoc: vi.fn(),
  serverTimestamp: vi.fn(),
}));

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location-probe">{`${location.pathname}${location.search}`}</div>;
}

function renderRoute(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="*"
          element={
            <>
              <LocationProbe />
              <FreeEnglishGameLandingPage />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("FreeEnglishGameLandingPage", () => {
  beforeEach(() => {
    landingMocks.recordLevelResultMock.mockReset();
    landingMocks.getFirestoreMock.mockReset();
    localStorage.clear();
    vi.stubGlobal(
      "Audio",
      class {
        preload = "";
        currentTime = 0;
        onended: (() => void) | null = null;
        onpause: (() => void) | null = null;
        pause() {}
        play() {
          return Promise.resolve();
        }
      },
    );
  });

  it.each([
    ["/free-letter-sounds-game-for-kids", "Free Letter Sounds Game for Kids", "/free-letter-sound-games-for-kids"],
    ["/free-sound-listening-game-for-kids", "Free Sound Listening Game for Kids", "/free-phonics-games-for-kids"],
    ["/free-word-building-game-for-kids", "Free Word Building Game for Kids", "/free-word-building-games-for-kids"],
    ["/free-sentence-making-game-for-kids", "Free Sentence Making Game for Kids", "/free-sentence-building-games-for-kids"],
    ["/free-reading-fluency-game-for-kids", "Free Reading Fluency Game for Kids", "/free-reading-games-for-kids"],
    ["/free-grammar-practice-game-for-kids", "Free Grammar Practice Game for Kids", "/free-grammar-games-for-kids"],
    ["/free-speaking-practice-game-for-kids", "Free Speaking Practice Game for Kids", "/free-speaking-games-for-kids"],
  ])(
    "renders %s without auth and links back to hub/category",
    (route, heading, categoryPath) => {
      renderRoute(route);

      expect(screen.getByRole("heading", { name: heading, level: 1 })).toBeInTheDocument();
      expect(screen.getAllByText(/no login required\./i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/temporarily in this browser/i).length).toBeGreaterThan(0);
      expect(screen.getAllByRole("link", { name: /all english games|back to free english games for kids/i }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole("link", { name: /category page|related category page|open the related category page/i }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole("link").some((link) => link.getAttribute("href") === "/free-english-games-for-kids")).toBe(true);
      expect(screen.getAllByRole("link").some((link) => link.getAttribute("href") === categoryPath)).toBe(true);
      expect(landingMocks.recordLevelResultMock).not.toHaveBeenCalled();
    },
  );

  it("covers every configured individual landing route", () => {
    const configuredRoutes = new Set(PUBLIC_ENGLISH_GAME_LANDING_CONFIGS.map((config) => config.publicPath));

    expect(configuredRoutes).toEqual(
      new Set([
        "/free-letter-sounds-game-for-kids",
        "/free-sound-listening-game-for-kids",
        "/free-word-building-game-for-kids",
        "/free-sentence-making-game-for-kids",
        "/free-reading-fluency-game-for-kids",
        "/free-grammar-practice-game-for-kids",
        "/free-speaking-practice-game-for-kids",
      ]),
    );
  });

  it("renders the public letter sounds play experience without auth or kidId", () => {
    renderRoute("/free-letter-sounds-game-for-kids?play=1");

    expect(screen.getByRole("heading", { name: /free letter sounds game for kids/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /guest play mode/i, level: 2 })).toBeInTheDocument();
    expect(screen.getAllByText(/temporarily in this browser/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/letter sounds adventure/i)).toBeInTheDocument();
    expect(screen.queryByText(/no child selected/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/synced per-child tracking/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("location-probe")).toHaveTextContent("/free-letter-sounds-game-for-kids?play=1");
    expect(
      screen
        .getAllByRole("link", { name: /back to english games/i })
        .some((link) => link.getAttribute("href") === "/free-letter-sounds-game-for-kids"),
    ).toBe(true);
    expect(landingMocks.recordLevelResultMock).not.toHaveBeenCalled();
    expect(landingMocks.getFirestoreMock).not.toHaveBeenCalled();
  });

  it("renders the public sound listening play experience without auth or kidId", () => {
    renderRoute("/free-sound-listening-game-for-kids?play=1");

    expect(screen.getByRole("heading", { name: /free sound listening game for kids/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /guest play mode/i, level: 2 })).toBeInTheDocument();
    expect(screen.getByText(/choose level/i)).toBeInTheDocument();
    expect(screen.getByText(/sound detective/i)).toBeInTheDocument();
    expect(screen.getAllByText(/temporarily in this browser/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/no child selected/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/synced per-child tracking/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("location-probe")).toHaveTextContent("/free-sound-listening-game-for-kids?play=1");
    expect(landingMocks.recordLevelResultMock).not.toHaveBeenCalled();
    expect(landingMocks.getFirestoreMock).not.toHaveBeenCalled();
  });

  it("renders the public word building play experience without auth, kidId, or active-kid recovery", () => {
    const getItemSpy = vi.spyOn(Storage.prototype, "getItem");

    renderRoute("/free-word-building-game-for-kids?play=1");

    expect(screen.getByRole("heading", { name: /free word building game for kids/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /guest play mode/i, level: 2 })).toBeInTheDocument();
    expect(screen.getByText(/my first words/i)).toBeInTheDocument();
    expect(screen.getByText(/choose level/i)).toBeInTheDocument();
    expect(screen.getAllByText(/temporarily in this browser/i).length).toBeGreaterThan(0);
    expect(screen.getByTestId("location-probe")).toHaveTextContent("/free-word-building-game-for-kids?play=1");
    expect(getItemSpy).not.toHaveBeenCalledWith("ts_active_kid_v1");
    expect(landingMocks.recordLevelResultMock).not.toHaveBeenCalled();
    expect(landingMocks.getFirestoreMock).not.toHaveBeenCalled();
    getItemSpy.mockRestore();
  });

  it("renders the public sentence making play experience without auth, kidId, or active-kid recovery", () => {
    const getItemSpy = vi.spyOn(Storage.prototype, "getItem");

    renderRoute("/free-sentence-making-game-for-kids?play=1");

    expect(screen.getByRole("heading", { name: /free sentence making game for kids/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /guest play mode/i, level: 2 })).toBeInTheDocument();
    expect(screen.getByText(/sentence stepper/i)).toBeInTheDocument();
    expect(screen.getByText(/public sentence practice/i)).toBeInTheDocument();
    expect(screen.getAllByText(/temporarily in this browser/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/no child selected/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/synced per-child tracking/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("location-probe")).toHaveTextContent("/free-sentence-making-game-for-kids?play=1");
    expect(getItemSpy).not.toHaveBeenCalledWith("ts_active_kid_v1");
    expect(landingMocks.recordLevelResultMock).not.toHaveBeenCalled();
    expect(landingMocks.getFirestoreMock).not.toHaveBeenCalled();
    getItemSpy.mockRestore();
  });

  it("renders the public grammar play experience without auth, kidId, or active-kid recovery", () => {
    const getItemSpy = vi.spyOn(Storage.prototype, "getItem");

    renderRoute("/free-grammar-practice-game-for-kids?play=1");

    expect(screen.getByRole("heading", { name: /free grammar practice game for kids/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /guest play mode/i, level: 2 })).toBeInTheDocument();
    expect(screen.getAllByText(/build better sentences/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/choose better sentence/i)).toBeInTheDocument();
    expect(screen.getAllByText(/temporarily in this browser/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/no child selected/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/synced per-child tracking/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("location-probe")).toHaveTextContent("/free-grammar-practice-game-for-kids?play=1");
    expect(getItemSpy).not.toHaveBeenCalledWith("ts_active_kid_v1");
    expect(landingMocks.recordLevelResultMock).not.toHaveBeenCalled();
    expect(landingMocks.getFirestoreMock).not.toHaveBeenCalled();
    getItemSpy.mockRestore();
  });

  it("shows Play Free only for the playable public routes and keeps other landing pages in ready-soon mode", () => {
    const playableView = renderRoute("/free-letter-sounds-game-for-kids");

    expect(screen.getByRole("link", { name: "Play Free" })).toHaveAttribute(
      "href",
      "/free-letter-sounds-game-for-kids?play=1",
    );

    playableView.unmount();
    const wordBuildingView = renderRoute("/free-word-building-game-for-kids");

    expect(screen.getByRole("link", { name: "Play Free" })).toHaveAttribute(
      "href",
      "/free-word-building-game-for-kids?play=1",
    );

    wordBuildingView.unmount();
    const sentenceMakingView = renderRoute("/free-sentence-making-game-for-kids");

    expect(screen.getByRole("link", { name: "Play Free" })).toHaveAttribute(
      "href",
      "/free-sentence-making-game-for-kids?play=1",
    );

    sentenceMakingView.unmount();
    const grammarView = renderRoute("/free-grammar-practice-game-for-kids");

    expect(screen.getByRole("link", { name: "Play Free" })).toHaveAttribute(
      "href",
      "/free-grammar-practice-game-for-kids?play=1",
    );

    grammarView.unmount();
    renderRoute("/free-reading-fluency-game-for-kids");

    expect(screen.queryByRole("link", { name: "Play Free" })).not.toBeInTheDocument();
    expect(screen.getAllByText(/ready soon|coming soon/i).length).toBeGreaterThan(0);
    expect(landingMocks.recordLevelResultMock).not.toHaveBeenCalled();
  });
});
