import { useCallback, useEffect, useRef, useState } from "react";
import { PHONEME_SAY } from "../data/phonemeSayMap";

type SpeakStatus = "idle" | "ready" | "unavailable";

function normalizeIPA(raw: string): string {
  return (raw || "").replace(/\//g, "").trim();
}

export function useSpeak() {
  const [status, setStatus] = useState<SpeakStatus>("idle");
  const voicesReadyRef = useRef(false);
  const lastSpokeAtRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setStatus("unavailable");
      return;
    }
    const synth = window.speechSynthesis;
    const ensureVoices = () => {
      const v = synth.getVoices?.() ?? [];
      if (v.length) {
        voicesReadyRef.current = true;
        setStatus("ready");
      }
    };
    ensureVoices();
    if (!voicesReadyRef.current) {
      // Some browsers fire voices later
      window.speechSynthesis.onvoiceschanged = ensureVoices;
      setTimeout(() => setStatus((s) => (s === "idle" ? "ready" : s)), 400);
    }
  }, []);

  const speakPhoneme = useCallback(async (rawIPA: string): Promise<void> => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setStatus("unavailable");
      return;
    }
    const now = performance.now();
    if (now - lastSpokeAtRef.current < 400) return; // debounce
    lastSpokeAtRef.current = now;

    const ipa = normalizeIPA(rawIPA);
  const text = PHONEME_SAY[ipa] ?? (ipa || "uh");

    try {
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 0.85;
      utter.pitch = 1.0;
      utter.lang = "en-US";

      const all = window.speechSynthesis.getVoices?.() ?? [];
      const pick =
        all.find((v) => /en(-|_)/i.test(v.lang || "")) ||
        all.find((v) => /English/i.test(v.name || "")) ||
        all[0];

      if (pick) utter.voice = pick;

      await new Promise<void>((resolve) => {
        utter.onend = () => resolve();
        utter.onerror = () => resolve();
        window.speechSynthesis.cancel?.();
        window.speechSynthesis.speak(utter);
      });
    } catch {
      setStatus("unavailable");
    }
  }, []);

  return { status, speakPhoneme };
}
