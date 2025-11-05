export type UID = string;
export type Phase = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type SkillArea = "phonics" | "grammar" | "speaking" | "spellbee";

export interface SkillNode {
  id: string;                 // e.g., "phonics.sat.s"
  area: SkillArea;            // "phonics"
  phase: Phase;               // 1..10
  label: string;              // "s"
  prereqIds?: string[];       // for dependency-aware progression
  confusionWith?: string[];   // e.g., ["sh","z","c(k)"]
}

export interface Item {
  id: string;                 // e.g., "item.s-audio-01"
  skillId: string;            // links to SkillNode
  kind: "audio" | "image" | "text";
  prompt: string;             // url or text
  choices: string[];          // graphemes/words
  answerIndex: number;        // correct choice index
  meta?: Record<string, any>; // e.g., ipa, difficulty, tags
  difficulty: "easy" | "med" | "hard";
}

export interface Attempt {
  itemId: string;
  correct: boolean;
  firstTry: boolean;
  timeMs: number;
  assistanceUsed?: boolean;
  ts: number;
}

export interface Session {
  id: string;                 // session doc id
  uid: UID;
  gameId: string;             // e.g., "p2-ph-01"
  phase: Phase;
  startedAt: number;
  endedAt?: number;
  itemsServed: string[];      // order presented
  attempts: Attempt[];
  scorePct?: number;
  masteryDelta?: number;      // +/-
}

export interface Progress {
  mastery: "not_started" | "emerging" | "developing" | "proficient" | "mastered";
  streak: number;
  lastPlayedAt: number;
  scoreBand: "0-20" | "21-40" | "41-60" | "61-80" | "81-100";
}

export interface UserSummary {
  lastUpdated: number;
  masteryPct: { phonics: number; grammar: number; speaking: number; spellbee: number };
  weakestSkills: string[]; // skillIds needing practice
}
