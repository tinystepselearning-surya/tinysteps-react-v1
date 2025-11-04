/**
 * Sound Effects Utility
 * Manages celebratory and feedback sounds with user preferences
 */

const SOUND_ENABLED_KEY = 'spellbee-sounds-enabled';

/**
 * Check if sounds are enabled (defaults to true)
 */
export function areSoundsEnabled(): boolean {
  const stored = localStorage.getItem(SOUND_ENABLED_KEY);
  return stored !== 'false'; // Default to enabled
}

/**
 * Toggle sound preference
 */
export function toggleSounds(): boolean {
  const newValue = !areSoundsEnabled();
  localStorage.setItem(SOUND_ENABLED_KEY, String(newValue));
  return newValue;
}

/**
 * Play celebration sound (success chime)
 */
export function playCelebrationSound() {
  if (!areSoundsEnabled()) return;
  
  try {
    // Create a pleasant success chime using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Resume if suspended (handles autoplay policy)
    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {});
    }
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Pleasant C major arpeggio: C5 -> E5 -> G5
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 in Hz
    const noteDuration = 0.15;
    
    notes.forEach((freq, i) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      osc.connect(gain);
      gain.connect(audioContext.destination);
      
      osc.frequency.value = freq;
      osc.type = 'sine';
      
      const startTime = audioContext.currentTime + (i * noteDuration);
      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + noteDuration);
      
      osc.start(startTime);
      osc.stop(startTime + noteDuration);
    });
  } catch (error) {
    // Silent fail
  }
}

/**
 * Play error/incorrect sound (gentle)
 */
export function playErrorSound() {
  if (!areSoundsEnabled()) return;
  
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Resume if suspended (handles autoplay policy)
    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {});
    }
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 200; // Low tone
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch (error) {
    // Silent fail
  }
}

/**
 * Play button click sound (subtle)
 */
export function playClickSound() {
  if (!areSoundsEnabled()) return;
  
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Resume if suspended (handles autoplay policy)
    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {});
    }
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.05);
  } catch (error) {
    // Silent fail
  }
}
