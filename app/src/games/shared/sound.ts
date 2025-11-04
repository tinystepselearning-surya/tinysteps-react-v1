/**
 * Sound System with Gate & Pre-warming
 * One-time "Enable Sound" prompt; pre-warm on first interaction
 */

export interface SoundConfig {
  enabled: boolean;
  volume: number;
  muted: boolean;
}

const STORAGE_KEY_PREFIX = "sound-config-";

export function getSoundConfig(gameSlug: string): SoundConfig {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${gameSlug}`);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return { enabled: false, volume: 0.7, muted: false };
}

export function saveSoundConfig(gameSlug: string, config: SoundConfig): void {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${gameSlug}`, JSON.stringify(config));
  } catch {
    // ignore
  }
}

export function enableSound(gameSlug: string): void {
  const config = getSoundConfig(gameSlug);
  config.enabled = true;
  saveSoundConfig(gameSlug, config);
}

export function setVolume(gameSlug: string, volume: number): void {
  const config = getSoundConfig(gameSlug);
  config.volume = Math.max(0, Math.min(1, volume));
  saveSoundConfig(gameSlug, config);
}

export function toggleMute(gameSlug: string): boolean {
  const config = getSoundConfig(gameSlug);
  config.muted = !config.muted;
  saveSoundConfig(gameSlug, config);
  return config.muted;
}

// Pre-warm audio context (call after first user interaction)
export function prewarmAudio(): void {
  if (typeof window === "undefined") return;
  
  try {
    // Web Speech API
    if (window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance("");
      utterance.volume = 0;
      window.speechSynthesis.speak(utterance);
    }
    
    // Audio context (for future SFX)
    if (window.AudioContext || (window as any).webkitAudioContext) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      gainNode.gain.value = 0;
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.001);
    }
  } catch {
    // ignore errors
  }
}

// Play sound with volume control
export function playSound(gameSlug: string, soundUrl: string): void {
  const config = getSoundConfig(gameSlug);
  if (!config.enabled || config.muted) return;
  
  try {
    const audio = new Audio(soundUrl);
    audio.volume = config.volume;
    audio.play().catch(() => {
      // ignore autoplay errors
    });
  } catch {
    // ignore
  }
}

// TTS with volume control
export function speak(gameSlug: string, text: string, rate = 0.9, pitch = 1.1): void {
  const config = getSoundConfig(gameSlug);
  if (!config.enabled || config.muted || !window.speechSynthesis) return;
  
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.volume = config.volume;
  
  // Prefer female voice
  const voices = window.speechSynthesis.getVoices();
  const femaleVoice = voices.find(v => v.name.includes("Female") || v.name.includes("Samantha"));
  if (femaleVoice) utterance.voice = femaleVoice;
  
  window.speechSynthesis.speak(utterance);
}
