export type SkillArea = "phonics" | "grammar" | "speaking" | "spellbee";
export type Phase = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface GameMeta {
  id: string;
  slug: string;
  title: string;
  phase: Phase;
  area: SkillArea;
  ageMin: number;
  ageMax: number;
  durationMin: number;
  difficulty: "easy" | "med" | "hard";
  thumbnailUrl: string;
  badges: string[];
  status: "live" | "beta" | "coming_soon";
  featured?: boolean;
}

export interface Progress {
  uid: string;
  gameId: string;
  mastery: "not_started" | "emerging" | "developing" | "proficient" | "mastered";
  lastPlayedAt: number;
  streak: number;
  scoreBand: "0-20" | "21-40" | "41-60" | "61-80" | "81-100";
}
