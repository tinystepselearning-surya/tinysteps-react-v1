/**
 * Audio System for Balloon Pop IPA
 * 
 * Handles phoneme audio, SFX, and iOS autoplay restrictions.
 * Uses Howler.js for reliable cross-platform audio playback.
 */

import { Howl, Howler } from 'howler';

// ========== STATE ==========

let audioContext: AudioContext | null = null;
let isInitialized = false;
let volumeLevel = 1.0;
let isMutedState = false;
const warnedMissing = new Set<string>();

// ========== SFX INSTANCES ==========

const createSafeHowl = (src: string, volume = 1.0): Howl | null => {
  try {
    return new Howl({
      src: [src],
      volume: volume * volumeLevel,
      preload: true,
      html5: false,
      onloaderror: (_id: number, error: unknown) => {
        if (!warnedMissing.has(src)) {
          console.warn(`[Audio] Failed to load: ${src}`, error);
          warnedMissing.add(src);
        }
      },
    });
  } catch (error) {
    if (!warnedMissing.has(src)) {
      console.warn(`[Audio] Error creating Howl for ${src}:`, error);
      warnedMissing.add(src);
    }
    return null;
  }
};

// Lazy-initialized SFX
let popHowl: Howl | null = null;
let correctHowl: Howl | null = null;
let wrongHowl: Howl | null = null;

const initSFX = () => {
  if (!popHowl) popHowl = createSafeHowl('/sfx/pop.mp3', 0.6);
  if (!correctHowl) correctHowl = createSafeHowl('/sfx/correct.mp3', 0.8);
  if (!wrongHowl) wrongHowl = createSafeHowl('/sfx/wrong.mp3', 0.7);
};

export const sfx = {
  pop: () => {
    initSFX();
    if (!isMutedState && popHowl) {
      try {
        popHowl.play();
      } catch (error) {
        console.warn('[Audio] Error playing pop:', error);
      }
    }
  },
  correct: () => {
    initSFX();
    if (!isMutedState && correctHowl) {
      try {
        correctHowl.play();
      } catch (error) {
        console.warn('[Audio] Error playing correct:', error);
      }
    }
  },
  wrong: () => {
    initSFX();
    if (!isMutedState && wrongHowl) {
      try {
        wrongHowl.play();
      } catch (error) {
        console.warn('[Audio] Error playing wrong:', error);
      }
    }
  },
};

// ========== AUDIO CONTEXT (iOS UNLOCK) ==========

/**
 * Initialize audio context on first user interaction.
 * Required for iOS to enable audio playback.
 */
export const initAudioContext = (): void => {
  if (isInitialized) return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      console.warn('[Audio] AudioContext not supported');
      return;
    }

    if (!audioContext) {
      audioContext = new AudioContextClass();
    }

    if (audioContext.state === 'suspended') {
      audioContext.resume().then(() => {
        console.log('[Audio] AudioContext resumed');
        isInitialized = true;
      }).catch((error) => {
        console.warn('[Audio] Failed to resume AudioContext:', error);
      });
    } else {
      isInitialized = true;
    }

    // Initialize SFX on first interaction
    initSFX();
  } catch (error) {
    console.warn('[Audio] Error initializing AudioContext:', error);
  }
};

// ========== PROMPT AUDIO ==========

const promptAudioCache = new Map<string, Howl>();

/**
 * Preload and return a Howl instance for prompt audio.
 * @param src - Audio file path (e.g., '/audio/phonemes/ae.mp3')
 * @returns Promise that resolves to Howl instance or null on failure
 */
export const loadPromptAudio = async (src: string): Promise<Howl | null> => {
  // Check cache first
  if (promptAudioCache.has(src)) {
    return promptAudioCache.get(src)!;
  }

  return new Promise((resolve) => {
    try {
      const howl = new Howl({
        src: [src],
        volume: volumeLevel,
        preload: true,
        html5: false,
        onload: () => {
          promptAudioCache.set(src, howl);
          resolve(howl);
        },
        onloaderror: (_id: number, error: unknown) => {
          if (!warnedMissing.has(src)) {
            console.warn(`[Audio] Failed to preload prompt audio: ${src}`, error);
            warnedMissing.add(src);
          }
          resolve(null);
        },
      });
    } catch (error) {
      if (!warnedMissing.has(src)) {
        console.warn(`[Audio] Error creating prompt audio for ${src}:`, error);
        warnedMissing.add(src);
      }
      resolve(null);
    }
  });
};

/**
 * Play prompt audio with safe guards.
 * @param howl - Howl instance to play (optional)
 */
export const playPromptAudio = (howl?: Howl | null): void => {
  if (!howl || isMutedState) return;

  try {
    // Stop any currently playing instance
    if (howl.playing()) {
      howl.stop();
    }
    howl.play();
  } catch (error) {
    console.warn('[Audio] Error playing prompt audio:', error);
  }
};

// ========== VOLUME CONTROLS ==========

/**
 * Set global volume level (0.0 to 1.0)
 */
export const setVolume = (level: number): void => {
  volumeLevel = Math.max(0, Math.min(1, level));

  // Update existing Howls
  if (popHowl) popHowl.volume(0.6 * volumeLevel);
  if (correctHowl) correctHowl.volume(0.8 * volumeLevel);
  if (wrongHowl) wrongHowl.volume(0.7 * volumeLevel);

  // Update cached prompt audio
  promptAudioCache.forEach((howl) => {
    howl.volume(volumeLevel);
  });
};

/**
 * Mute/unmute all audio
 */
export const mute = (shouldMute: boolean): void => {
  isMutedState = shouldMute;
  Howler.mute(shouldMute);
};

/**
 * Get current mute state
 */
export const isMuted = (): boolean => {
  return isMutedState;
};

/**
 * Get current volume level
 */
export const getVolume = (): number => {
  return volumeLevel;
};

// ========== CLEANUP ==========

/**
 * Unload all cached audio to free memory
 */
export const unloadAllAudio = (): void => {
  promptAudioCache.forEach((howl) => {
    howl.unload();
  });
  promptAudioCache.clear();

  if (popHowl) {
    popHowl.unload();
    popHowl = null;
  }
  if (correctHowl) {
    correctHowl.unload();
    correctHowl = null;
  }
  if (wrongHowl) {
    wrongHowl.unload();
    wrongHowl = null;
  }
};
