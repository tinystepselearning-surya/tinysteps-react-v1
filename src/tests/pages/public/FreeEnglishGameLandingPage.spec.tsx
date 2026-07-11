import type { ReactNode } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
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
    vi.useRealTimers();
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
    ["/free-spelling-game-for-kids", "Free Spelling Game for Kids", "/free-word-building-games-for-kids"],
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
        "/free-spelling-game-for-kids",
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

  it("renders and completes the expanded public spelling journey without auth, kidId, audio, active-kid recovery, Firestore, or tracked results", async () => {
    vi.useFakeTimers();
    const getItemSpy = vi.spyOn(Storage.prototype, "getItem");
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
    const speechSynthesisMock = {
      cancel: vi.fn(),
      speak: vi.fn(),
      getVoices: vi.fn(() => []),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      speaking: false,
      pending: false,
    };
    const SpeechSynthesisUtteranceMock = vi.fn();
    const AudioMock = vi.fn().mockImplementation(() => ({
      preload: "",
      currentTime: 0,
      volume: 0,
      pause: vi.fn(),
      play: vi.fn(() => Promise.resolve()),
    }));
    vi.stubGlobal("Audio", AudioMock);
    vi.stubGlobal("speechSynthesis", speechSynthesisMock);
    vi.stubGlobal("SpeechSynthesisUtterance", SpeechSynthesisUtteranceMock);

    renderRoute("/free-spelling-game-for-kids?play=1");

    expect(screen.getByRole("heading", { name: /free spelling game for kids/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /guest play mode/i, level: 2 })).toBeInTheDocument();
    expect(screen.getByText(/guest play mode • spelling adventure/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /spelling adventure/i })).toBeInTheDocument();
    expect(screen.getByText(/build words, complete missing letters, fix mistakes, and spell whole words/i)).toBeInTheDocument();
    expect(screen.getByText("Build It")).toBeInTheDocument();
    expect(screen.getAllByText("Word Families").length).toBeGreaterThan(0);
    expect(screen.getByText("Complete It")).toBeInTheDocument();
    expect(screen.getByText("Choose It")).toBeInTheDocument();
    expect(screen.getByText("Fix It")).toBeInTheDocument();
    expect(screen.getByText("Spell It")).toBeInTheDocument();
    expect(screen.getByTestId("location-probe")).toHaveTextContent("/free-spelling-game-for-kids?play=1");
    expect(screen.queryByText(/no child selected/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/kidId|synced child tracking|synced per-child tracking/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /start spelling adventure/i }));

    expect(screen.getByRole("heading", { name: "Build It" })).toBeInTheDocument();
    expect(screen.queryByText(/listen/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/magnet:/i)).not.toBeInTheDocument();
    expect(screen.getByAltText("cat")).toBeInTheDocument();
    expect(screen.getByText(/0\/36 done/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /letter t/i }));
    expect(screen.getByText(/^try again\.$/i)).toBeInTheDocument();
    await act(async () => {
      vi.advanceTimersByTime(540);
    });

    const clickLetter = (letter: string) => {
      fireEvent.click(screen.getByRole("button", { name: new RegExp(`letter ${letter}`, "i") }));
    };
    const finishCorrect = async (word: string) => {
      await act(async () => {
        vi.advanceTimersByTime(40);
      });
      expect(screen.getByText(new RegExp(`correct: ${word}`, "i"))).toBeInTheDocument();
      await act(async () => {
        vi.advanceTimersByTime(950);
      });
    };
    const buildWord = async (word: string) => {
      for (const letter of word.split("")) clickLetter(letter);
      await finishCorrect(word);
    };
    const chooseLetter = async (letter: string, word: string) => {
      clickLetter(letter);
      await finishCorrect(word);
    };
    const chooseMissing = async (letter: string, word: string) => {
      fireEvent.click(screen.getByRole("button", { name: new RegExp(`missing letter ${letter}`, "i") }));
      await finishCorrect(word);
    };
    const chooseSpelling = async (choice: string, word: string) => {
      fireEvent.click(screen.getByRole("button", { name: new RegExp(`spelling ${choice}`, "i") }));
      await finishCorrect(word);
    };
    const typeAnswer = async (answer: string, word: string, useEnter = false) => {
      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: answer } });
      if (useEnter) fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
      else fireEvent.click(screen.getByRole("button", { name: /check answer/i }));
      await finishCorrect(word);
    };

    await buildWord("cat");
    await buildWord("dog");
    await buildWord("sun");
    await buildWord("cat");
    await buildWord("pig");
    await buildWord("train");
    await buildWord("nest");

    expect(screen.getAllByRole("heading", { name: "Word Families" }).length).toBeGreaterThan(0);
    expect(screen.getByAltText("cat")).toBeInTheDocument();
    await chooseLetter("c", "cat");
    await chooseLetter("m", "map");
    await chooseLetter("d", "dog");
    await chooseLetter("s", "sun");
    await chooseLetter("p", "pig");
    await chooseLetter("r", "ring");

    expect(screen.getByRole("heading", { name: "Complete It" })).toBeInTheDocument();
    expect(screen.getByText("c _ t")).toBeInTheDocument();
    await chooseMissing("a", "cat");
    await chooseMissing("u", "sun");
    await chooseMissing("i", "pig");
    await chooseMissing("e", "hen");
    await chooseMissing("i", "fish");
    await chooseMissing("i", "kite");

    expect(screen.getByRole("heading", { name: "Choose It" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /spelling fish/i })).toBeInTheDocument();
    await chooseSpelling("fish", "fish");
    await chooseSpelling("elephant", "elephant");
    await chooseSpelling("tiger", "tiger");
    await chooseSpelling("queen", "queen");
    await chooseSpelling("whale", "whale");
    await chooseSpelling("grape", "grape");

    expect(screen.getByRole("heading", { name: "Fix It" })).toBeInTheDocument();
    expect(screen.getByText("frend")).toBeInTheDocument();
    const fixInput = screen.getByRole("textbox", { name: /correct spelling/i });
    expect(fixInput).toHaveAttribute("spellcheck", "false");
    expect(fixInput).toHaveAttribute("autocomplete", "off");
    expect(fixInput).toHaveAttribute("autocorrect", "off");
    fireEvent.change(fixInput, { target: { value: "freind" } });
    fireEvent.click(screen.getByRole("button", { name: /check answer/i }));
    fireEvent.click(screen.getByRole("button", { name: /check answer/i }));
    expect(screen.getByText(/^try again\.$/i)).toBeInTheDocument();
    await act(async () => {
      vi.advanceTimersByTime(540);
    });
    await typeAnswer("  FRIEND  ", "friend", true);
    await typeAnswer("because", "because");
    await typeAnswer("elephant", "elephant");
    expect(screen.getByText(/review/i)).toBeInTheDocument();
    await typeAnswer("FrIeNd", "friend");
    await typeAnswer("people", "people");
    await typeAnswer("watch", "watch");
    await typeAnswer("school", "school");

    expect(screen.getByRole("heading", { name: "Spell It" })).toBeInTheDocument();
    expect(screen.getByText(/the ___ shines brightly during the day/i)).toBeInTheDocument();
    expect(screen.queryByText(/^sun$/i)).not.toBeInTheDocument();
    const spellInput = screen.getByRole("textbox", { name: /your spelling/i });
    fireEvent.change(spellInput, { target: { value: "son" } });
    fireEvent.click(screen.getByRole("button", { name: /check answer/i }));
    expect(screen.getByText(/^try again\.$/i)).toBeInTheDocument();
    await act(async () => {
      vi.advanceTimersByTime(540);
    });
    await typeAnswer("sun", "sun");
    expect(screen.getByRole("textbox")).toHaveValue("");
    await typeAnswer("friend", "friend");
    await typeAnswer("queen", "queen");
    expect(screen.getByText(/review/i)).toBeInTheDocument();
    await typeAnswer("SUN", "sun");
    await typeAnswer("elephant", "elephant");
    await typeAnswer("train", "train");
    await typeAnswer("library", "library");

    expect(screen.getByRole("heading", { name: /spelling journey complete/i })).toBeInTheDocument();
    expect(screen.getByText(/first-try accuracy:/i)).toHaveTextContent("First-try accuracy: 92%");
    expect(screen.getByText(/first-try accuracy:/i)).toHaveTextContent("Turns played: 39");

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /replay/i }));
    });
    await act(async () => {
      vi.advanceTimersByTime(1);
    });

    expect(screen.getByRole("heading", { name: "Build It" })).toBeInTheDocument();
    expect(screen.getByAltText("cat")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /letter c/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /back to free games/i }));

    expect(screen.getByTestId("location-probe")).toHaveTextContent("/free-spelling-game-for-kids");
    expect(getItemSpy).not.toHaveBeenCalledWith("ts_active_kid_v1");
    expect(getItemSpy.mock.calls.some(([key]) => String(key).includes("progress"))).toBe(false);
    expect(setItemSpy.mock.calls.some(([key]) => String(key).includes("progress"))).toBe(false);
    expect(AudioMock).not.toHaveBeenCalled();
    expect(speechSynthesisMock.cancel).not.toHaveBeenCalled();
    expect(speechSynthesisMock.speak).not.toHaveBeenCalled();
    expect(SpeechSynthesisUtteranceMock).not.toHaveBeenCalled();
    expect(landingMocks.recordLevelResultMock).not.toHaveBeenCalled();
    expect(landingMocks.getFirestoreMock).not.toHaveBeenCalled();

    getItemSpy.mockRestore();
    setItemSpy.mockRestore();
    vi.useRealTimers();
  });

  it("starts focused practice at a later spelling level and cancels stale advancement when switching levels", async () => {
    vi.useFakeTimers();
    renderRoute("/free-spelling-game-for-kids?play=1");

    fireEvent.click(screen.getByRole("button", { name: /start at spell it/i }));

    expect(screen.getByRole("heading", { name: "Spell It" })).toBeInTheDocument();
    expect(screen.getByText(/30\/36 done/i)).toBeInTheDocument();
    expect(screen.getByText(/the ___ shines brightly during the day/i)).toBeInTheDocument();

    fireEvent.change(screen.getByRole("textbox", { name: /your spelling/i }), {
      target: { value: "SUN" },
    });
    fireEvent.click(screen.getByRole("button", { name: /check answer/i }));
    expect(screen.getByText(/correct: sun/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /go to fix it/i }));
    expect(screen.getByRole("heading", { name: "Fix It" })).toBeInTheDocument();
    expect(screen.getByText("frend")).toBeInTheDocument();
    expect(screen.getByText(/24\/36 done/i)).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByRole("heading", { name: "Fix It" })).toBeInTheDocument();
    expect(screen.getByText("frend")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /correct spelling/i })).toHaveValue("");

    fireEvent.click(screen.getByRole("button", { name: /back to free games/i }));
    expect(screen.getByTestId("location-probe")).toHaveTextContent("/free-spelling-game-for-kids");
    vi.useRealTimers();
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
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");

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
    expect(getItemSpy.mock.calls.some(([key]) => String(key).startsWith("ts_bbs_progress_v1"))).toBe(false);
    expect(setItemSpy.mock.calls.some(([key]) => String(key).startsWith("ts_bbs_progress_v1"))).toBe(false);
    expect(landingMocks.recordLevelResultMock).not.toHaveBeenCalled();
    expect(landingMocks.getFirestoreMock).not.toHaveBeenCalled();
    getItemSpy.mockRestore();
    setItemSpy.mockRestore();
  });

  it("lets public grammar gameplay complete without tracked persistence and returns to the public landing URL", async () => {
    vi.useFakeTimers();
    const getItemSpy = vi.spyOn(Storage.prototype, "getItem");
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");

    renderRoute("/free-grammar-practice-game-for-kids?play=1");

    const correctAnswers = [
      /she goes to school every day\./i,
      /i saw an elephant at the zoo\./i,
      /riya and sam are friends\. they play together\./i,
      /the book is on the table\./i,
      /we are playing in the park\./i,
      /he quickly finished his homework\./i,
    ];

    for (const answer of correctAnswers) {
      fireEvent.click(screen.getByRole("button", { name: answer }));
      await act(async () => {
        vi.advanceTimersByTime(500);
      });
    }

    expect(screen.getByRole("heading", { name: /stage summary/i })).toBeInTheDocument();
    expect(screen.getByText(/accuracy:/i)).toHaveTextContent("100%");
    expect(getItemSpy).not.toHaveBeenCalledWith("ts_active_kid_v1");
    expect(getItemSpy.mock.calls.some(([key]) => String(key).startsWith("ts_bbs_progress_v1"))).toBe(false);
    expect(setItemSpy.mock.calls.some(([key]) => String(key).startsWith("ts_bbs_progress_v1"))).toBe(false);
    expect(landingMocks.recordLevelResultMock).not.toHaveBeenCalled();
    expect(landingMocks.getFirestoreMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getAllByRole("button", { name: /back to english games/i })[0]);

    expect(screen.getByTestId("location-probe")).toHaveTextContent("/free-grammar-practice-game-for-kids");
    expect(screen.queryByRole("heading", { name: /guest play mode/i, level: 2 })).not.toBeInTheDocument();

    getItemSpy.mockRestore();
    setItemSpy.mockRestore();
    vi.useRealTimers();
  });

  it("renders the public reading fluency play experience without auth, kidId, active-kid recovery, Firestore, or tracked result calls", () => {
    const getItemSpy = vi.spyOn(Storage.prototype, "getItem");

    renderRoute("/free-reading-fluency-game-for-kids?play=1");

    expect(screen.getByRole("heading", { name: /free reading fluency game for kids/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /guest play mode/i, level: 2 })).toBeInTheDocument();
    expect(screen.getByText(/guest play mode • reading fluency/i)).toBeInTheDocument();
    expect(screen.getAllByText(/story reading/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/the bear's balloon/i)).toBeInTheDocument();
    expect(screen.queryByText(/no child selected/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/synced child tracking|synced per-child tracking/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("location-probe")).toHaveTextContent("/free-reading-fluency-game-for-kids?play=1");

    fireEvent.click(screen.getByRole("button", { name: /the bear's balloon/i }));

    expect(screen.getByText(/a little bear went to the market/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /i'm finished reading/i })).toBeInTheDocument();
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
    const spellingView = renderRoute("/free-spelling-game-for-kids");

    expect(screen.getByRole("link", { name: "Play Free" })).toHaveAttribute(
      "href",
      "/free-spelling-game-for-kids?play=1",
    );
    expect(screen.getAllByText("FREE TO PLAY").length).toBeGreaterThan(0);

    spellingView.unmount();
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
    expect(screen.getAllByText("FREE TO PLAY").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/ready soon|coming soon/i).length).toBeGreaterThan(0);

    grammarView.unmount();
    const readingView = renderRoute("/free-reading-fluency-game-for-kids");

    expect(screen.getByRole("link", { name: "Play Free" })).toHaveAttribute(
      "href",
      "/free-reading-fluency-game-for-kids?play=1",
    );
    expect(screen.getAllByText("FREE TO PLAY").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/ready soon|coming soon/i).length).toBeGreaterThan(0);

    readingView.unmount();
    renderRoute("/free-speaking-practice-game-for-kids");

    expect(screen.queryByRole("link", { name: "Play Free" })).not.toBeInTheDocument();
    expect(screen.getAllByText(/ready soon|coming soon/i).length).toBeGreaterThan(0);
    expect(landingMocks.recordLevelResultMock).not.toHaveBeenCalled();
  });

  describe("Phase 1: Learning journey and conversion content", () => {
    it("renders unique benefits list for Letter Sounds", () => {
      renderRoute("/free-letter-sounds-game-for-kids");

      expect(screen.getByRole("heading", { name: /what children learn/i, level: 2 })).toBeInTheDocument();
      expect(screen.getByText(/connects each letter with its phonics sound/i)).toBeInTheDocument();
      expect(screen.getByText(/builds alphabet recognition and sound recall/i)).toBeInTheDocument();
      expect(screen.getByText(/prepares children for blending and word reading/i)).toBeInTheDocument();
    });

    it("renders parent guidance for Letter Sounds", () => {
      renderRoute("/free-letter-sounds-game-for-kids");

      expect(screen.getByText(/parent guidance/i)).toBeInTheDocument();
      expect(screen.getByText(/start with 3–5 letter sounds/i)).toBeInTheDocument();
    });

    it("renders unique FAQs for Letter Sounds", () => {
      renderRoute("/free-letter-sounds-game-for-kids");

      expect(screen.getByText(/should my child learn letter names or sounds first/i)).toBeInTheDocument();
      expect(screen.getByText(/how many letter sounds should my child practice at once/i)).toBeInTheDocument();
      expect(screen.queryByText(/is this game free\?/i)).not.toBeInTheDocument();
    });

    it("renders next game recommendation for Letter Sounds", () => {
      renderRoute("/free-letter-sounds-game-for-kids");

      expect(screen.getByRole("heading", { name: /ready for the next step/i, level: 2 })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /blend 2 sounds/i, level: 3 })).toBeInTheDocument();
    });

    it("renders assessment bridge CTA for Letter Sounds", () => {
      renderRoute("/free-letter-sounds-game-for-kids");

      expect(screen.getByRole("heading", { name: /take the next step/i, level: 2 })).toBeInTheDocument();
      expect(screen.getByText(/from free games to guided learning/i)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /book free assessment/i })).toHaveAttribute("href", "/book-demo");
    });

    it("renders helpful tip for Letter Sounds", () => {
      renderRoute("/free-letter-sounds-game-for-kids");

      expect(screen.getByRole("heading", { name: /helpful tip/i, level: 2 })).toBeInTheDocument();
      expect(screen.getByText(/children often say the letter name instead of the sound/i)).toBeInTheDocument();
    });

    it("renders curated related games for Letter Sounds", () => {
      renderRoute("/free-letter-sounds-game-for-kids");

      expect(screen.getByRole("heading", { name: /related game skills/i, level: 2 })).toBeInTheDocument();
      expect(screen.getByText(/letter tracing/i)).toBeInTheDocument();
      expect(screen.getByText(/sound listening|sound detective/i)).toBeInTheDocument();
    });

    it("renders unique benefits for Spelling", () => {
      renderRoute("/free-spelling-game-for-kids");

      expect(screen.getByRole("heading", { name: /what children learn/i, level: 2 })).toBeInTheDocument();
      expect(screen.getByText(/builds spelling confidence from short words to complex patterns/i)).toBeInTheDocument();
      expect(screen.getByText(/practises blends, digraphs, and long-vowel spelling rules/i)).toBeInTheDocument();
    });

    it("renders unique FAQs for Spelling", () => {
      renderRoute("/free-spelling-game-for-kids");

      expect(screen.getByText(/at what age should my child start spelling practice/i)).toBeInTheDocument();
      expect(screen.getByText(/my child spells words the way they sound/i)).toBeInTheDocument();
      expect(screen.queryByText(/is this game free\?/i)).not.toBeInTheDocument();
    });

    it("renders next game for Spelling pointing to Vocabulary", () => {
      renderRoute("/free-spelling-game-for-kids");

      expect(screen.getByRole("heading", { name: /ready for the next step/i, level: 2 })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /vocabulary adventure/i, level: 3 })).toBeInTheDocument();
    });

    it("renders unique benefits for Sentence Making", () => {
      renderRoute("/free-sentence-making-game-for-kids");

      expect(screen.getByRole("heading", { name: /what children learn/i, level: 2 })).toBeInTheDocument();
      expect(screen.getByText(/teaches correct english word order naturally/i)).toBeInTheDocument();
      expect(screen.getByText(/builds grammar intuition through sentence construction/i)).toBeInTheDocument();
    });

    it("renders unique FAQs for Sentence Making", () => {
      renderRoute("/free-sentence-making-game-for-kids");

      expect(screen.getByText(/what age should my child start making sentences/i)).toBeInTheDocument();
      expect(screen.getByText(/my child puts words in the wrong order/i)).toBeInTheDocument();
      expect(screen.queryByText(/is this game free\?/i)).not.toBeInTheDocument();
    });

    it("renders next game for Sentence Making pointing to Grammar", () => {
      renderRoute("/free-sentence-making-game-for-kids");

      expect(screen.getByRole("heading", { name: /ready for the next step/i, level: 2 })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /build better sentences/i, level: 3 })).toBeInTheDocument();
    });

    it("preserves existing public play behavior for all three enhanced games", () => {
      renderRoute("/free-letter-sounds-game-for-kids?play=1");
      expect(screen.getAllByRole("heading", { name: /guest play mode/i, level: 2 }).length).toBeGreaterThanOrEqual(1);
      expect(landingMocks.recordLevelResultMock).not.toHaveBeenCalled();

      renderRoute("/free-spelling-game-for-kids?play=1");
      expect(screen.getAllByRole("heading", { name: /guest play mode/i, level: 2 }).length).toBeGreaterThanOrEqual(1);
      expect(landingMocks.recordLevelResultMock).not.toHaveBeenCalled();

      renderRoute("/free-sentence-making-game-for-kids?play=1");
      expect(screen.getAllByRole("heading", { name: /guest play mode/i, level: 2 }).length).toBeGreaterThanOrEqual(1);
      expect(landingMocks.recordLevelResultMock).not.toHaveBeenCalled();
    });
  });
});
