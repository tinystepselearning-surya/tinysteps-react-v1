/**
 * Accessibility helpers: aria-live announcer, dyslexia font
 */

export function createAnnouncer(): HTMLDivElement {
  const announcer = document.createElement("div");
  announcer.setAttribute("aria-live", "polite");
  announcer.setAttribute("aria-atomic", "true");
  announcer.className = "sr-only";
  announcer.style.position = "absolute";
  announcer.style.left = "-10000px";
  announcer.style.width = "1px";
  announcer.style.height = "1px";
  announcer.style.overflow = "hidden";
  return announcer;
}

export function announce(announcer: HTMLDivElement | null, message: string): void {
  if (!announcer) return;
  announcer.textContent = message;
}

// Dyslexia-friendly font preference
const DYSLEXIA_KEY = "prefer-dyslexia-font";

export function getDyslexiaPreference(): boolean {
  try {
    return localStorage.getItem(DYSLEXIA_KEY) === "true";
  } catch {
    return false;
  }
}

export function setDyslexiaPreference(enabled: boolean): void {
  try {
    localStorage.setItem(DYSLEXIA_KEY, String(enabled));
  } catch {
    // ignore
  }
}

export function applyDyslexiaFont(enabled: boolean): void {
  if (enabled) {
    document.documentElement.style.fontFamily = "OpenDyslexic, Comic Sans MS, sans-serif";
  } else {
    document.documentElement.style.fontFamily = "";
  }
}
