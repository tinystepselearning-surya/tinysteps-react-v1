/**
 * Production Hardening Helpers
 * Debouncing, batching, cleanup utilities
 */

// Debounced localStorage writer
// Use ReturnType<typeof setTimeout> to be compatible with both browser (number) and NodeJS (Timeout)
const debouncedWrites = new Map<string, ReturnType<typeof setTimeout>>();

export function debouncedLocalStorageWrite(
  key: string,
  value: string,
  delay = 150
): void {
  // Clear existing timeout
  const existing = debouncedWrites.get(key);
  if (existing) {
    clearTimeout(existing);
  }

  // Set new timeout
  const timeoutId = setTimeout(() => {
    try {
      localStorage.setItem(key, value);
      debouncedWrites.delete(key);
    } catch (err) {
      console.warn(`Failed to write ${key}:`, err);
    }
  }, delay);

  debouncedWrites.set(key, timeoutId);
}

// Flush all pending writes (call on unmount)
export function flushDebouncedWrites(): void {
  debouncedWrites.forEach((timeoutId, key) => {
    clearTimeout(timeoutId);
    // Force immediate write
    const value = sessionStorage.getItem(`pending_${key}`);
    if (value) {
      try {
        localStorage.setItem(key, value);
        sessionStorage.removeItem(`pending_${key}`);
      } catch (err) {
        console.warn(`Failed to flush ${key}:`, err);
      }
    }
  });
  debouncedWrites.clear();
}

// Timer registry for cleanup
const activeTimers = new Set<number>();

export function registerTimeout(
  callback: () => void,
  delay: number
): number {
  const timeoutId = window.setTimeout(() => {
    callback();
    activeTimers.delete(timeoutId);
  }, delay);
  activeTimers.add(timeoutId);
  return timeoutId;
}

export function registerInterval(
  callback: () => void,
  delay: number
): number {
  const intervalId = window.setInterval(callback, delay);
  activeTimers.add(intervalId);
  return intervalId;
}

export function clearAllTimers(): void {
  activeTimers.forEach((timerId) => {
    clearTimeout(timerId);
    clearInterval(timerId);
  });
  activeTimers.clear();
}

// Audio pre-warming
let audioPrimed = false;
let speechPrimed = false;

export function primeAudio(): void {
  if (audioPrimed) return;

  try {
    // Create dummy audio elements to prime the audio context
    const correctBeep = new Audio();
    correctBeep.src = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTcIGWi77eefTRAMUKfj8LZjHAY4kdfy";
    correctBeep.load();

    const wrongBeep = new Audio();
    wrongBeep.src = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTcIGWi77eefTRAMUKfj8LZjHAY4kdfy";
    wrongBeep.load();

    audioPrimed = true;
  } catch (err) {
    console.warn("Audio priming failed:", err);
  }
}

export function primeSpeech(): { success: boolean; message?: string } {
  if (speechPrimed) return { success: true };

  if (!window.speechSynthesis) {
    return {
      success: false,
      message: "🔊 Speech not supported in this browser",
    };
  }

  try {
    // Try to warm up speech synthesis
    const utterance = new SpeechSynthesisUtterance("");
    utterance.volume = 0;
    window.speechSynthesis.speak(utterance);
    speechPrimed = true;
    return { success: true };
  } catch (err) {
    return {
      success: false,
      message: "🔊 Tap anywhere to enable sound",
    };
  }
}

// State batching helper
export interface BatchedStateUpdate {
  score?: number;
  streak?: number;
  coins?: number;
  masteryUpdates?: Map<number, unknown>;
}

export function batchStateUpdates(
  updates: BatchedStateUpdate,
  setters: {
    setScore?: (score: number) => void;
    setStreak?: (streak: number) => void;
    setCoins?: (coins: number) => void;
    setMastery?: (mastery: Map<number, unknown>) => void;
  }
): void {
  // React will automatically batch these in React 18+
  if (updates.score !== undefined && setters.setScore) {
    setters.setScore(updates.score);
  }
  if (updates.streak !== undefined && setters.setStreak) {
    setters.setStreak(updates.streak);
  }
  if (updates.coins !== undefined && setters.setCoins) {
    setters.setCoins(updates.coins);
  }
  if (updates.masteryUpdates !== undefined && setters.setMastery) {
    setters.setMastery(updates.masteryUpdates);
  }
}
