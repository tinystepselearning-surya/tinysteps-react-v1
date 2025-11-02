// Shared types for Balloon Pop IPA engine with phases and adaptivity

export type PromptType =
  | 'audioOnly'
  | 'letterToIPA'
  | 'graphemeToIPA'
  | 'ipaToGrapheme'
  | 'trickyRhyme'
  | 'minimalPair';

export type Phase = 1 | 2 | 3 | 4 | 5 | 6;

export type RoundSpec = {
  promptType: PromptType;
  prompt: {
    letter?: string;
    ipa?: string; // slashed IPA e.g. '/æ/'
    grapheme?: string; // e.g. 'sh', 'a_e'
    audioKey?: string; // placeholder for audio cue id
    image?: string;
    targetId: string; // phoneme id (e.g., 'æ', 'tʃ', 'eɪ')
  };
  choices: string[]; // IPA strings (slashed) or grapheme strings depending on promptType
  correctIds: string[]; // the exact values present in choices that are correct
};

export type LearnerResult = {
  phase: Phase;
  isCorrect: boolean;
  responseMs: number;
  targetId: string; // phoneme id
  timestamp: number;
};

export type LearnerState = {
  phase: Phase;
  level: number; // difficulty tier for game physics
  mastery: Record<string, number>; // phonemeId -> [0..1]
  confusionMatrix: Record<string, Record<string, number>>; // targetId -> confusedWithId -> count
  avgResponseMs: number;
  recent: LearnerResult[]; // ring buffer of last N attempts
};
