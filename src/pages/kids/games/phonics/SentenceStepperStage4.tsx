// src/pages/kids/games/phonics/SentenceStepperStage4.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { buildMissionReturnHref } from "./missionNavigation";

/**
 * Sentence Stepper (Stage 4: Early Reader Fluency)
 * - Tap-to-read short decodable phrases/sentences (mostly CVC + a few decodable helper words)
 * - SATPIN + Expanded CVC letters: m,d,g,o,c,k,e,r,u
 * - Calm feedback, guided correction, no timers/speed pressure
 *
 * Fullscreen:
 * - Browsers require a user gesture to enter fullscreen, so we show a Start button.
 *
 * Audio:
 * - Uses speechSynthesis (system-generated) now.
 * - Later replace speakWord/speakSentence with your MP3 playback pipeline.
 */

type PackId = "4.0" | "4.1" | "4.2" | "4.3" | "4.4" | "4.5" | "4.6";

type SentenceItem = {
  id: string;
  packId: PackId;
  sentence: string;
  words: string[];
};

type TelemetryEvent =
  | { type: "round_start"; kidId?: string; itemId: string; packId: PackId; ts: number }
  | {
      type: "tap";
      kidId?: string;
      itemId: string;
      word: string;
      isCorrect: boolean;
      activeIndex: number;
      wrongTapsWord: number;
      wrongTapsRound: number;
      hintLevel: number;
      latencyMs: number;
      ts: number;
    }
  | {
      type: "round_complete";
      kidId?: string;
      itemId: string;
      packId: PackId;
      wrongTapsRound: number;
      hintLevelMax: number;
      guidedRescueUsed: boolean;
      timeToFirstTapMs: number;
      ts: number;
    }
  | { type: "pack_mastery"; kidId?: string; packId: PackId; mastery: boolean; accuracy: number; hintRate: number; ts: number }
  | { type: "audio_ready"; kidId?: string; voiceName?: string; ts: number }
  | { type: "speak_error"; kidId?: string; msg: string; ts: number };

const PACK_ORDER: PackId[] = ["4.0", "4.1", "4.2", "4.3", "4.4", "4.5", "4.6"];

/**
 * Decodable helper words:
 * - in, at, on, is, and
 * (Avoids introducing tricky words like the/to/a too early.)
 */
const CONTENT: Record<PackId, string[]> = {
  "4.0": [
    "pat sat",
    "tap pat",
    "pin tin",
    "sit in pit",
    "sit in tin",
    "nap in pan",
    "tan in pan",
    "pin in tin",
    "tap in pan",
    "pat in pan",
    "sit at pit",
    "sat at pan",
  ],
  "4.1": [
    "dan sat",
    "sam sat",
    "sam is sad",
    "dan is mad",
    "dim sam",
    "mad dan",
    "pat did tap",
    "dan did sit",
    "sam did sit",
    "sam sat at mat",
    "dan sat at mat",
    "dip in pan",
  ],
  "4.2": [
    "pat can sit",
    "sam can tap",
    "dan can dig",
    "kit can sit",
    "kid can tap",
    "cat can nap",
    "ram can sit",
    "rag on mat",
    "dig in pit",
    "kit can dig",
    "sam can sit",
    "dan can tap",
  ],
  "4.3": [
    "tom sat",
    "dog can dig",
    "cat sat on mat",
    "pop on top",
    "tom can sit",
    "sam can pop",
    "dan can nod",
    "top can pop",
    "dog sat on mat",
    "tom can nod",
    "pop on mat",
    // Removed anything with letters outside target set
  ],
  "4.4": [
    "ted sat",
    "red pen",
    "ten men",
    "dan met ted",
    "sam can get pen",
    "ted can sit",
    "sam can set pen",
    "pet cat",
    "net on mat",
    "get red pen",
    "met dan",
    "ted is red",
  ],
  "4.5": [
    "sun is up",
    "sam can run",
    "cut mud",
    "bug on rug",
    "run on mat",
    "dan can cut",
    "tom can run",
    "mud on rug",
    "cup on mat",
    "sam cut rug",
    "dan ran",
    "rug in mud",
  ],
  "4.6": [
    "sam can sit on mat",
    "dan can get red pen",
    "kit can dig in mud",
    "tom can pop on top",
    "cat can nap in sun",
    "dog can run on rug",
    "sam and dan can sit",
    "red cat sat on mat",
    "dan can nod on mat",
    "tom can get pen",
  ],
};

const LEVELS: { packId: PackId; title: string; focus: string }[] = [
  { packId: "4.0", title: "Level 1", focus: "SATPIN phrases (easy start)" },
  { packId: "4.1", title: "Level 2", focus: "+ m, d (more CVC variety)" },
  { packId: "4.2", title: "Level 3", focus: "+ c, k, g, r (use “can” frames)" },
  { packId: "4.3", title: "Level 4", focus: "+ short o (on/top/tom)" },
  { packId: "4.4", title: "Level 5", focus: "+ short e (pen/red/get)" },
  { packId: "4.5", title: "Level 6", focus: "+ short u (sun/run/mud)" },
  { packId: "4.6", title: "Level 7", focus: "Mixed fluency (longer sentences)" },
];

function tokenize(sentence: string): string[] {
  return sentence
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

type SupportMode = "GUIDED_NEXT_ONLY" | "GUIDED_REDIRECTS";

export default function SentenceStepperStage4() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const kidId = searchParams.get("kidId") || localStorage.getItem("ts_active_kid_v1") || "";
  const missionReturnHref = buildMissionReturnHref(searchParams, kidId);
  const missionStage = searchParams.get("eemStage");
  const missionTile = (searchParams.get("eemTile") || "").toLowerCase();
  const activityContextLabel =
    missionStage === "3"
      ? missionTile.includes("read_sentences")
        ? "Stage 3 • Read Sentences"
        : missionTile.includes("early_reader_fluency")
          ? "Stage 3 • Early Reader Fluency"
          : "Stage 3 • Make Sentences"
      : "Early Reader Fluency";
  const roundsPerPack = 10;

  // Fullscreen element ref
  const fullscreenRef = useRef<HTMLDivElement>(null);

  // Unlock progression
  const unlockedKey = useMemo(() => `ts_sentence_stepper_stage4_unlocked_v1_${kidId || "anon"}`, [kidId]);
  const storedUnlocked = Number(localStorage.getItem(unlockedKey) || "0");
  const [unlockedPackIndex, setUnlockedPackIndex] = useState<number>(clamp(storedUnlocked, 0, PACK_ORDER.length - 1));

  // Start screen / selection
  const startPackParam = (searchParams.get("pack") as PackId) || undefined;
  const initialPackIndex = useMemo(() => {
    if (startPackParam && PACK_ORDER.includes(startPackParam)) return PACK_ORDER.indexOf(startPackParam);
    return 0;
  }, [startPackParam]);

  const [hasStarted, setHasStarted] = useState(false);
  const [selectedPackIndex, setSelectedPackIndex] = useState<number>(clamp(initialPackIndex, 0, PACK_ORDER.length - 1));

  // Gameplay state
  const [packIndex, setPackIndex] = useState<number>(clamp(selectedPackIndex, 0, PACK_ORDER.length - 1));
  const activePackId: PackId = PACK_ORDER[packIndex];

  const [queue, setQueue] = useState<SentenceItem[]>([]);
  const [queueIdx, setQueueIdx] = useState<number>(0);

  const [activeWordIndex, setActiveWordIndex] = useState<number>(0);
  const [wrongTapsWord, setWrongTapsWord] = useState<number>(0);
  const [wrongTapsRound, setWrongTapsRound] = useState<number>(0);
  const [hintLevelMax, setHintLevelMax] = useState<number>(0);
  const [guidedRescueUsed, setGuidedRescueUsed] = useState<boolean>(false);

  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [supportMode, setSupportMode] = useState<SupportMode>("GUIDED_NEXT_ONLY");
  const [showIdleHint, setShowIdleHint] = useState<boolean>(false);

  // Pack stats
  const [roundCountInPack, setRoundCountInPack] = useState<number>(0);
  const [fluentRoundsInPack, setFluentRoundsInPack] = useState<number>(0);
  const [hintedRoundsInPack, setHintedRoundsInPack] = useState<number>(0);

  // Round timing
  const roundStartTs = useRef<number>(0);
  const firstTapTs = useRef<number | null>(null);
  const idleTimerRef = useRef<number | null>(null);

  // Speech synthesis robustness
  const [audioSupported, setAudioSupported] = useState(true);
  const voicesReadyRef = useRef(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  function track(ev: TelemetryEvent) {
    // Replace with your analytics pipeline
     
    console.log("[telemetry]", ev);
  }

  async function enterFullscreen() {
    try {
      const el = fullscreenRef.current;
      if (!el) return;
      if (el.requestFullscreen) await el.requestFullscreen();
    } catch {
      // ignore
    }
  }

  async function exitFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {
      // ignore
    }
  }

  function cancelSpeech() {
    try {
      window.speechSynthesis?.cancel();
    } catch {
      // ignore
    }
  }

  function chooseEnglishVoice(voices: SpeechSynthesisVoice[]) {
    // Prefer local English voices if possible
    const preferred =
      voices.find((v) => v.lang?.toLowerCase().startsWith("en") && v.localService) ||
      voices.find((v) => v.lang?.toLowerCase().startsWith("en")) ||
      voices[0] ||
      null;
    return preferred;
  }

  function ensureVoicesReady(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === "undefined") return resolve();
      if (!("speechSynthesis" in window)) {
        setAudioSupported(false);
        return resolve();
      }

      const synth = window.speechSynthesis;

      const finalize = () => {
        const voices = synth.getVoices();
        if (voices && voices.length > 0) {
          voiceRef.current = chooseEnglishVoice(voices);
          voicesReadyRef.current = true;
          track({ type: "audio_ready", kidId, voiceName: voiceRef.current?.name, ts: Date.now() });
          resolve();
          return true;
        }
        return false;
      };

      // If already ready
      if (finalize()) return;

      // Wait for voiceschanged (Chrome often needs this)
      const onVoicesChanged = () => {
        if (finalize()) {
          synth.removeEventListener("voiceschanged", onVoicesChanged);
        }
      };
      synth.addEventListener("voiceschanged", onVoicesChanged);

      // Also try again shortly (some browsers never fire voiceschanged reliably)
      window.setTimeout(() => {
        if (!voicesReadyRef.current) finalize();
        // resolve anyway after 800ms so UI doesn't hang
        resolve();
      }, 800);
    });
  }

  async function warmUpSpeech() {
    // Called from Start button (user gesture) to reduce “silent first speak” issues
    try {
      await ensureVoicesReady();
      speak("Ready.", 0.9);
    } catch (e) {
      track({ type: "speak_error", kidId, msg: String(e), ts: Date.now() });
    }
  }

  function speak(text: string, rate = 0.9) {
    if (typeof window === "undefined") return;
    if (!("speechSynthesis" in window)) {
      setAudioSupported(false);
      return;
    }
    const synth = window.speechSynthesis;

    // In case voices weren't ready yet, try to load them (non-blocking)
    if (!voicesReadyRef.current) {
      void ensureVoicesReady();
    }

    // Avoid over-canceling: only cancel if currently speaking/pending
    try {
      if (synth.speaking || synth.pending) synth.cancel();
    } catch {
      // ignore
    }

    // Next-tick scheduling helps some Chrome builds
    window.setTimeout(() => {
      try {
        const u = new SpeechSynthesisUtterance(text);
        u.rate = rate;
        u.pitch = 1.0;
        u.volume = 1.0;
        u.lang = "en-US";
        if (voiceRef.current) u.voice = voiceRef.current;
        synth.speak(u);
      } catch (e) {
        track({ type: "speak_error", kidId, msg: String(e), ts: Date.now() });
      }
    }, 0);
  }

  function speakWord(word: string) {
    speak(word, 0.85);
  }

  function speakSentence(sentence: string) {
    speak(sentence, 0.9);
  }

  function clearIdleTimer() {
    if (idleTimerRef.current) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }

  function armIdleTimer() {
    clearIdleTimer();
    setShowIdleHint(false);

    if (supportMode !== "GUIDED_REDIRECTS") return;
    if (isLocked) return;

    idleTimerRef.current = window.setTimeout(() => {
      setShowIdleHint(true);
      const item = queue[queueIdx];
      if (item) speakWord(item.words[activeWordIndex] || "");
    }, 4000);
  }

  function buildPackItems(packId: PackId): SentenceItem[] {
    const sentences = (CONTENT[packId] || [])
      .map((s) => s.trim())
      .filter(Boolean);

    return sentences.map((sentence, idx) => ({
      id: `${packId}-${idx}`,
      packId,
      sentence,
      words: tokenize(sentence),
    }));
  }

  const currentItem = queue[queueIdx];

  function resetRoundState() {
    setActiveWordIndex(0);
    setWrongTapsWord(0);
    setWrongTapsRound(0);
    setHintLevelMax(0);
    setGuidedRescueUsed(false);
    setIsLocked(false);
    setShowIdleHint(false);
    clearIdleTimer();
  }

  function resetPackState(newPackIndex: number) {
    const newPackId = PACK_ORDER[newPackIndex];
    const items = shuffle(buildPackItems(newPackId));

    // Ensure enough variety
    let pool = items;
    while (pool.length < Math.max(roundsPerPack, 6)) {
      pool = pool.concat(shuffle(items).map((it, i) => ({ ...it, id: `${it.id}-r${pool.length}-${i}` })));
    }

    setQueue(pool);
    setQueueIdx(0);

    setSupportMode("GUIDED_NEXT_ONLY");
    setRoundCountInPack(0);
    setFluentRoundsInPack(0);
    setHintedRoundsInPack(0);

    resetRoundState();

    window.setTimeout(() => speak("Tap the words to read."), 200);
  }

  async function startGame() {
    await warmUpSpeech();        // <-- critical for reliable speech
    await enterFullscreen();
    setHasStarted(true);
    setPackIndex(clamp(selectedPackIndex, 0, PACK_ORDER.length - 1));
    resetPackState(clamp(selectedPackIndex, 0, PACK_ORDER.length - 1));
  }

  useEffect(() => {
    // On initial mount, detect support and start loading voices
    if (typeof window === "undefined") return;
    if (!("speechSynthesis" in window)) {
      setAudioSupported(false);
      return;
    }
    void ensureVoicesReady();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hasStarted) return;
    resetPackState(packIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packIndex]);

  useEffect(() => {
    if (!hasStarted) return;
    if (!currentItem) return;

    roundStartTs.current = Date.now();
    firstTapTs.current = null;

    track({ type: "round_start", kidId, itemId: currentItem.id, packId: currentItem.packId, ts: Date.now() });

    if (activePackId === "4.0" && roundCountInPack === 0 && queueIdx === 0) {
      window.setTimeout(() => speakSentence(currentItem.sentence), 300);
    }

    armIdleTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentItem?.id, hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;
    armIdleTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWordIndex, supportMode, isLocked]);

  function getHintLevelForWord(): number {
    if (wrongTapsWord <= 1) return 0;
    if (wrongTapsWord === 2) return 1;
    return 2;
  }

  function markHintUsed(level: number) {
    setHintLevelMax((prev) => Math.max(prev, level));
  }

  function isWordTappable(wordIdx: number) {
    if (isLocked) return false;
    if (!currentItem) return false;
    if (supportMode === "GUIDED_NEXT_ONLY") return wordIdx === activeWordIndex;
    return true;
  }

  function reinjectForReview(item: SentenceItem, offset: number) {
    setQueue((prev) => {
      const insertAt = clamp(queueIdx + offset, queueIdx + 1, prev.length);
      const next = [...prev];
      next.splice(insertAt, 0, { ...item, id: `${item.id}-rev-${Date.now()}` });
      return next;
    });
  }

  async function handleWordTap(wordIdx: number) {
    if (!currentItem) return;
    if (isLocked) return;

    clearIdleTimer();
    setShowIdleHint(false);

    if (firstTapTs.current === null) firstTapTs.current = Date.now();
    const latencyMs = Date.now() - roundStartTs.current;

    const correctIdx = activeWordIndex;
    const isCorrect = wordIdx === correctIdx;

    track({
      type: "tap",
      kidId,
      itemId: currentItem.id,
      word: currentItem.words[wordIdx] ?? "",
      isCorrect,
      activeIndex: correctIdx,
      wrongTapsWord,
      wrongTapsRound,
      hintLevel: getHintLevelForWord(),
      latencyMs,
      ts: Date.now(),
    });

    if (isCorrect) {
      speakWord(currentItem.words[wordIdx]);
      setWrongTapsWord(0);

      const nextIndex = activeWordIndex + 1;
      if (nextIndex >= currentItem.words.length) {
        await completeRound(currentItem);
      } else {
        setActiveWordIndex(nextIndex);
      }
      return;
    }

    const newWrongWord = wrongTapsWord + 1;
    setWrongTapsWord(newWrongWord);
    setWrongTapsRound((n) => n + 1);

    const hintLevel = newWrongWord >= 3 ? 2 : newWrongWord === 2 ? 1 : 0;
    markHintUsed(hintLevel);

    if (newWrongWord === 1) {
      speak("This one next.");
    } else if (newWrongWord === 2) {
      speakWord(currentItem.words[correctIdx]);
    } else {
      setGuidedRescueUsed(true);
      setSupportMode("GUIDED_NEXT_ONLY");
      speakWord(currentItem.words[correctIdx]);
    }
  }

  async function completeRound(itemSnapshot: SentenceItem) {
    setIsLocked(true);
    speakSentence(itemSnapshot.sentence);

    const timeToFirstTapMs =
      firstTapTs.current === null ? -1 : firstTapTs.current - roundStartTs.current;

    const hinted = hintLevelMax >= 1 || guidedRescueUsed;
    const fluent = !hinted;

    setRoundCountInPack((n) => n + 1);
    if (fluent) setFluentRoundsInPack((n) => n + 1);
    if (hinted) setHintedRoundsInPack((n) => n + 1);

    track({
      type: "round_complete",
      kidId,
      itemId: itemSnapshot.id,
      packId: itemSnapshot.packId,
      wrongTapsRound,
      hintLevelMax,
      guidedRescueUsed,
      timeToFirstTapMs,
      ts: Date.now(),
    });

    if (guidedRescueUsed) reinjectForReview(itemSnapshot, 2);
    else if (hintLevelMax >= 1) reinjectForReview(itemSnapshot, 6);

    await new Promise((r) => setTimeout(r, 2400));

    setQueueIdx((idx) => idx + 1);

    setIsLocked(false);
    setActiveWordIndex(0);
    setWrongTapsWord(0);
    setWrongTapsRound(0);
    setHintLevelMax(0);
    setGuidedRescueUsed(false);

    setTimeout(() => {
      if (roundCountInPack >= 3) setSupportMode("GUIDED_REDIRECTS");
    }, 0);
  }

  useEffect(() => {
    if (!hasStarted) return;
    if (!queue.length) return;
    if (queueIdx >= queue.length) {
      setQueue(shuffle(queue));
      setQueueIdx(0);
    }
  }, [queueIdx, queue.length, hasStarted]);

  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [lastMastery, setLastMastery] = useState<{ mastery: boolean; accuracy: number; hintRate: number } | null>(null);

  useEffect(() => {
    if (!hasStarted) return;
    if (roundCountInPack < roundsPerPack) return;

    const accuracy = fluentRoundsInPack / Math.max(1, roundCountInPack);
    const hintRate = hintedRoundsInPack / Math.max(1, roundCountInPack);
    const mastery = accuracy >= 0.8 && hintRate <= 0.3;

    track({ type: "pack_mastery", kidId, packId: activePackId, mastery, accuracy, hintRate, ts: Date.now() });

    setLastMastery({ mastery, accuracy, hintRate });
    setShowLevelComplete(true);

    if (mastery) {
      const nextUnlocked = Math.max(unlockedPackIndex, packIndex + 1);
      if (nextUnlocked !== unlockedPackIndex) {
        setUnlockedPackIndex(clamp(nextUnlocked, 0, PACK_ORDER.length - 1));
        localStorage.setItem(unlockedKey, String(clamp(nextUnlocked, 0, PACK_ORDER.length - 1)));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundCountInPack]);

  function replaySentence() {
    if (!currentItem) return;
    speakSentence(currentItem.sentence);
  }

  async function goBackToLibrary() {
    cancelSpeech();
    await exitFullscreen();
    navigate(missionReturnHref, { replace: true });
  }

  function continueAfterLevel() {
    setShowLevelComplete(false);

    if (!lastMastery?.mastery) {
      resetPackState(packIndex);
      return;
    }

    const nextPackIndex = packIndex + 1;
    if (nextPackIndex < PACK_ORDER.length) setPackIndex(nextPackIndex);
    else goBackToLibrary();
  }

  if (!hasStarted) {
    return (
      <div className="fixed inset-0 z-[9999] bg-gradient-to-b from-slate-50 to-sky-50 flex items-center justify-center p-4">
        <div ref={fullscreenRef} className="w-full max-w-4xl rounded-3xl bg-white/90 border border-slate-200 shadow-sm p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-slate-500 text-sm">{activityContextLabel}</div>
              <div className="text-slate-900 text-2xl font-semibold">Sentence Stepper</div>
              <div className="text-slate-600 text-sm mt-1">
                Tap words left-to-right to read short decodable phrases.
              </div>
              {!audioSupported && (
                <div className="mt-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2">
                  Sound not supported in this browser. Try Chrome desktop.
                </div>
              )}
              <div className="text-slate-500 text-xs mt-2">
                Tip: Press Start to enter fullscreen (browser requires a tap).
              </div>
            </div>

            <button
              onClick={goBackToLibrary}
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 active:scale-[0.99] transition"
            >
              ← Back to Mission
            </button>
          </div>

          <div className="mt-5">
            <div className="text-slate-800 font-semibold">Choose a level</div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {LEVELS.map((lvl, idx) => {
                const locked = idx > unlockedPackIndex;
                const selected = idx === selectedPackIndex;
                return (
                  <button
                    key={lvl.packId}
                    disabled={locked}
                    onClick={() => !locked && setSelectedPackIndex(idx)}
                    className={[
                      "rounded-2xl border p-4 text-left transition",
                      selected ? "border-sky-300 bg-sky-50" : "border-slate-200 bg-white",
                      locked ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-slate-900 font-semibold">{lvl.title}</div>
                      <div className="text-xs text-slate-500">{locked ? "🔒 Locked" : "✅ Available"}</div>
                    </div>
                    <div className="text-slate-600 text-sm mt-1">{lvl.focus}</div>
                    <div className="text-slate-500 text-xs mt-2">Pack {lvl.packId}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              onClick={startGame}
              className="rounded-2xl px-5 py-3 bg-sky-600 text-white hover:bg-sky-700 active:scale-[0.99] transition font-semibold"
            >
              Start (Fullscreen)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={fullscreenRef} className="fixed inset-0 z-[9999] bg-gradient-to-b from-slate-50 to-sky-50">
      <div className="w-full h-full flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={goBackToLibrary}
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 active:scale-[0.99] transition"
            >
              ← Back to Mission
            </button>

            <button
              onClick={replaySentence}
              className="rounded-2xl px-4 py-2 bg-sky-100 text-sky-900 hover:bg-sky-200 active:scale-[0.99] transition text-sm font-medium"
              aria-label="Replay sentence"
            >
              🔊 Replay
            </button>
          </div>

          <div className="w-full rounded-3xl bg-white/85 shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-slate-500 text-sm">{activityContextLabel}</div>
                <div className="text-slate-900 text-xl font-semibold">Sentence Stepper</div>
                <div className="text-slate-600 text-sm">
                  Level {packIndex + 1} • Pack {activePackId} • Round {Math.min(roundCountInPack + 1, roundsPerPack)} / {roundsPerPack}
                </div>
              </div>

              <div className="text-slate-500 text-sm">
                {supportMode === "GUIDED_NEXT_ONLY" ? "Guided" : "Independent"}
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-200 p-3">
              <div className="text-slate-700 text-base">Tap the words to read.</div>
              {(showIdleHint || getHintLevelForWord() >= 1) && (
                <div className="text-slate-500 text-sm mt-1">Hint: tap the highlighted word next.</div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {(currentItem?.words || []).map((w, idx) => {
                const isNext = idx === activeWordIndex;
                const isDone = idx < activeWordIndex;
                const enabled = isWordTappable(idx);

                const hintLevel = getHintLevelForWord();
                const shouldHighlight =
                  (hintLevel >= 1 || showIdleHint) ? isNext : (isNext && supportMode === "GUIDED_NEXT_ONLY");

                const base = "select-none rounded-3xl px-6 py-4 text-2xl font-semibold border transition";
                const palette = isDone
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : shouldHighlight
                    ? "bg-amber-50 border-amber-300 text-amber-900"
                    : "bg-white border-slate-200 text-slate-800";
                const disabled = enabled
                  ? "hover:bg-slate-50 active:scale-[0.99] cursor-pointer"
                  : "opacity-40 cursor-not-allowed";

                return (
                  <button
                    key={`${currentItem?.id}-${idx}`}
                    className={`${base} ${palette} ${disabled} min-w-[120px]`}
                    onClick={() => enabled && handleWordTap(idx)}
                    disabled={!enabled}
                    aria-label={`Word ${idx + 1}: ${w}`}
                  >
                    {w}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex items-center justify-center">
              <div className="text-slate-500 text-sm">{isLocked ? "⭐ Nice reading!" : " "}</div>
            </div>

            <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
              <div>{supportMode === "GUIDED_NEXT_ONLY" ? "Next word only" : "Tap any word (we’ll guide you)"}</div>
              <div>Wrong taps: {wrongTapsRound}</div>
            </div>
          </div>
        </div>

        {showLevelComplete && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 border border-slate-200 shadow-sm">
              <div className="text-slate-900 text-xl font-semibold">
                {lastMastery?.mastery ? "✅ Level complete!" : "Let’s practice a bit more"}
              </div>
              <div className="text-slate-600 text-sm mt-2">
                {lastMastery?.mastery
                  ? "Nice work! You’re ready for the next level."
                  : "Good try. We’ll repeat this level so it feels easy."}
              </div>

              <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-200 p-3 text-sm text-slate-600">
                <div>Fluent rounds: {fluentRoundsInPack} / {roundCountInPack}</div>
                <div>Hinted rounds: {hintedRoundsInPack} / {roundCountInPack}</div>
              </div>

              <div className="mt-5 flex justify-end gap-3">
                <button
                  onClick={continueAfterLevel}
                  className="rounded-2xl px-5 py-3 bg-sky-600 text-white hover:bg-sky-700 active:scale-[0.99] transition font-semibold"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
