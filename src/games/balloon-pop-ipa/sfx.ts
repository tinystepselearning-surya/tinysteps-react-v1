/**
 * Balloon Pop IPA - Sound Effects
 * 
 * Manages audio playback using howler.js with graceful fallback.
 * Handles pop, correct, wrong, and celebration sounds.
 */

// Simple fallback implementation without howler.js dependency
// Can be replaced with actual Howler implementation when audio files are added

export type SoundType = 'pop' | 'correct' | 'wrong' | 'celebrate' | 'levelUp';

// ========== AUDIO CONTEXT ==========

let audioContext: AudioContext | null = null;
let audioEnabled = true;

/**
 * Initialize audio context (lazy loading)
 */
function getAudioContext(): AudioContext | null {
  if (!audioEnabled) return null;
  
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContext;
  } catch (error) {
    console.warn('Audio not supported:', error);
    audioEnabled = false;
    return null;
  }
}

/**
 * Play a simple beep using Web Audio API (fallback)
 */
function playBeep(frequency: number, duration: number, volume: number = 0.3): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  
  try {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (error) {
    console.warn('Failed to play beep:', error);
  }
}

/**
 * Play a pop sound (balloon popping)
 */
function playPopSound(): void {
  // Quick high-to-low sweep for pop effect
  playBeep(800, 0.1, 0.2);
  setTimeout(() => playBeep(400, 0.05, 0.15), 50);
}

/**
 * Play a correct answer sound
 */
function playCorrectSound(): void {
  // Pleasant ascending tones
  playBeep(523, 0.1, 0.25); // C
  setTimeout(() => playBeep(659, 0.1, 0.25), 100); // E
  setTimeout(() => playBeep(784, 0.15, 0.3), 200); // G
}

/**
 * Play a wrong answer sound
 */
function playWrongSound(): void {
  // Gentle descending tone (not harsh)
  playBeep(400, 0.15, 0.2);
  setTimeout(() => playBeep(300, 0.15, 0.2), 100);
}

/**
 * Play a celebration sound (streak, achievement)
 */
function playCelebrateSound(): void {
  // Cheerful ascending arpeggio
  const notes = [523, 659, 784, 1047]; // C, E, G, C
  notes.forEach((freq, i) => {
    setTimeout(() => playBeep(freq, 0.15, 0.3), i * 100);
  });
}

/**
 * Play a level up sound
 */
function playLevelUpSound(): void {
  // Triumphant fanfare
  playBeep(659, 0.1, 0.25); // E
  setTimeout(() => playBeep(784, 0.1, 0.25), 100); // G
  setTimeout(() => playBeep(1047, 0.2, 0.3), 200); // C
}

// ========== PUBLIC API ==========

/**
 * Initialize the sound system
 */
export function initSounds(): void {
  getAudioContext();
}

/**
 * Play a sound effect
 */
export function playSound(type: SoundType): void {
  if (!audioEnabled) return;
  
  try {
    switch (type) {
      case 'pop':
        playPopSound();
        break;
      case 'correct':
        playCorrectSound();
        break;
      case 'wrong':
        playWrongSound();
        break;
      case 'celebrate':
        playCelebrateSound();
        break;
      case 'levelUp':
        playLevelUpSound();
        break;
    }
  } catch (error) {
    console.warn('Failed to play sound:', error);
  }
}

/**
 * Enable/disable sound effects
 */
export function setSoundEnabled(enabled: boolean): void {
  audioEnabled = enabled;
  
  if (enabled) {
    getAudioContext();
  }
}

/**
 * Check if sound is enabled
 */
export function isSoundEnabled(): boolean {
  return audioEnabled;
}

/**
 * Preload sound effects (for future howler.js implementation)
 */
export function preloadSounds(): void {
  // Placeholder for future implementation
  // Will load sound files when added to public/audio/
}

// ========== HOWLER.JS INTEGRATION (Future) ==========

/*
 * To integrate howler.js:
 * 
 * 1. Install: npm install howler @types/howler
 * 
 * 2. Add sound files to public/audio/balloon-pop/:
 *    - pop.mp3
 *    - correct.mp3
 *    - wrong.mp3
 *    - celebrate.mp3
 *    - levelup.mp3
 * 
 * 3. Replace the simple beep implementation with:
 * 
 * import { Howl } from 'howler';
 * 
 * const sounds = {
 *   pop: new Howl({ src: ['/audio/balloon-pop/pop.mp3'], volume: 0.5 }),
 *   correct: new Howl({ src: ['/audio/balloon-pop/correct.mp3'], volume: 0.6 }),
 *   wrong: new Howl({ src: ['/audio/balloon-pop/wrong.mp3'], volume: 0.4 }),
 *   celebrate: new Howl({ src: ['/audio/balloon-pop/celebrate.mp3'], volume: 0.7 }),
 *   levelUp: new Howl({ src: ['/audio/balloon-pop/levelup.mp3'], volume: 0.7 })
 * };
 * 
 * export function playSound(type: SoundType): void {
 *   if (!audioEnabled || !sounds[type]) return;
 *   sounds[type].play();
 * }
 */
