/**
 * Phase 2: Phoneme → Grapheme Configuration
 * Query param based config for adaptive learning
 */

export interface Phase2Config {
  phase: number;
  set: string;
  n: number;
  speed: 'slow' | 'med' | 'fast';
  adaptive: boolean;
  debug: boolean;
  levelId: string;
}

export interface GraphemeSet {
  id: string;
  name: string;
  graphemes: string[];
  levelId: string;
}

export const GRAPHEME_SETS: Record<string, GraphemeSet> = {
  // Phase 2: Single letters
  sat: {
    id: 'sat',
    name: 's/a/t',
    graphemes: ['s', 'a', 't'],
    levelId: 'p2-bp-01',
  },
  pin: {
    id: 'pin',
    name: 'p/i/n',
    graphemes: ['p', 'i', 'n'],
    levelId: 'p2-bp-02',
  },
  satpin: {
    id: 'satpin',
    name: 'SATPIN',
    graphemes: ['s', 'a', 't', 'p', 'i', 'n'],
    levelId: 'p2-bp-satpin',
  },
  mixed: {
    id: 'mixed',
    name: 'Mixed',
    graphemes: ['s', 'a', 't', 'p', 'i', 'n'],
    levelId: 'p2-bp-mixed',
  },
  
  // Phase 3-4: Digraphs
  sh: {
    id: 'sh',
    name: 'sh',
    graphemes: ['sh'],
    levelId: 'p3-bp-sh',
  },
  ch: {
    id: 'ch',
    name: 'ch',
    graphemes: ['ch'],
    levelId: 'p3-bp-ch',
  },
  'th-voiceless': {
    id: 'th-voiceless',
    name: 'th (thin)',
    graphemes: ['th'],
    levelId: 'p3-bp-th-voiceless',
  },
  'th-voiced': {
    id: 'th-voiced',
    name: 'th (this)',
    graphemes: ['th'],
    levelId: 'p3-bp-th-voiced',
  },
  ng: {
    id: 'ng',
    name: 'ng',
    graphemes: ['ng'],
    levelId: 'p3-bp-ng',
  },
  ck: {
    id: 'ck',
    name: 'ck',
    graphemes: ['ck'],
    levelId: 'p3-bp-ck',
  },
  wh: {
    id: 'wh',
    name: 'wh',
    graphemes: ['wh'],
    levelId: 'p3-bp-wh',
  },
  ph: {
    id: 'ph',
    name: 'ph',
    graphemes: ['ph'],
    levelId: 'p3-bp-ph',
  },
  'sh-ch-th': {
    id: 'sh-ch-th',
    name: 'sh/ch/th',
    graphemes: ['sh', 'ch', 'th'],
    levelId: 'p3-bp-01',
  },
};

export const PHONEME_SOUNDS: Record<string, string> = {
  // Phase 2: Single letters
  s: 'ssss',
  a: 'a as in sat',
  t: 't',
  p: 'p',
  i: 'i as in pin',
  n: 'n',
  
  // Phase 3-4: Digraphs
  sh: 'shh',
  ch: 'ch',
  'th-voiceless': 'th as in thin',
  'th-voiced': 'th as in this',
  th: 'th as in thin', // Default for 'th'
  ng: 'ng',
  ck: 'k',
  wh: 'wh',
  ph: 'f',
};

// Confusable distractors for difficulty scaling
export const CONFUSABLES: Record<string, string[]> = {
  sh: ['s', 'ch'],
  ch: ['sh', 't'],
  'th-voiceless': ['f', 's', 't'],
  'th-voiced': ['d', 'z', 'v'],
  th: ['f', 's', 't'], // Default for 'th'
  ng: ['n', 'g'],
  ck: ['k', 'c'],
  wh: ['w', 'h'],
  ph: ['f', 'p'],
};

export function parsePhase2Config(searchParams: URLSearchParams): Phase2Config {
  const phaseParam = parseInt(searchParams.get('phase') || '2', 10);
  const phase = Math.max(2, Math.min(5, phaseParam)); // Clamp to 2-5
  
  const setId = searchParams.get('set') || 'sat';
  const set = GRAPHEME_SETS[setId] || GRAPHEME_SETS.sat;
  
  const nParam = parseInt(searchParams.get('n') || '3', 10);
  const n = Math.max(3, Math.min(6, nParam));
  
  const speedParam = searchParams.get('speed') || 'slow';
  const speed = (['slow', 'med', 'fast'].includes(speedParam) ? speedParam : 'slow') as 'slow' | 'med' | 'fast';
  
  const adaptive = searchParams.get('adaptive') !== '0';
  const debug = searchParams.get('debug') === '1';
  
  return {
    phase,
    set: set.id,
    n,
    speed,
    adaptive,
    debug,
    levelId: set.levelId,
  };
}

export function speedToMs(speed: 'slow' | 'med' | 'fast'): number {
  const speeds = {
    slow: 8000,  // 8 seconds to rise
    med: 6000,   // 6 seconds
    fast: 4000,  // 4 seconds
  };
  return speeds[speed];
}

export function speakPhoneme(grapheme: string): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.warn('Web Speech API not available');
    return;
  }

  const text = PHONEME_SOUNDS[grapheme.toLowerCase()] || grapheme;
  
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-GB';
  utterance.rate = 0.8;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  
  window.speechSynthesis.speak(utterance);
}

export function starsFromErrors(errors: number): number {
  if (errors <= 1) return 3;
  if (errors <= 3) return 2;
  return 1;
}
