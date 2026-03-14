export const GF_STAGE_2A = 'gf-2a-spot-one-error';
export const GF_STAGE_2B = 'gf-2b-fix-one-error';
export const GF_STAGE_2C = 'gf-2c-fix-full-sentence';
export const GF_STAGE_2D = 'gf-2d-timed-correction';

export type GrammarFixStageProgress = {
  unlocked: boolean;
  completed: boolean;
  mastered: boolean;
  accuracyPct: number;
  hintCount: number;
  retryCount: number;
  completedAt: number | null;
};

export type GrammarFixProgress = {
  [GF_STAGE_2A]: GrammarFixStageProgress;
  [GF_STAGE_2B]: GrammarFixStageProgress;
  [GF_STAGE_2C]: GrammarFixStageProgress;
  [GF_STAGE_2D]: GrammarFixStageProgress;
  gameCompleted: boolean;
};

const STORAGE_PREFIX = 'ts_grammar_fix_progress_v1';

const defaultProgress = (): GrammarFixProgress => ({
  [GF_STAGE_2A]: {
    unlocked: true,
    completed: false,
    mastered: false,
    accuracyPct: 0,
    hintCount: 0,
    retryCount: 0,
    completedAt: null,
  },
  [GF_STAGE_2B]: {
    unlocked: false,
    completed: false,
    mastered: false,
    accuracyPct: 0,
    hintCount: 0,
    retryCount: 0,
    completedAt: null,
  },
  [GF_STAGE_2C]: {
    unlocked: false,
    completed: false,
    mastered: false,
    accuracyPct: 0,
    hintCount: 0,
    retryCount: 0,
    completedAt: null,
  },
  [GF_STAGE_2D]: {
    unlocked: false,
    completed: false,
    mastered: false,
    accuracyPct: 0,
    hintCount: 0,
    retryCount: 0,
    completedAt: null,
  },
  gameCompleted: false,
});

const getStorageKey = (kidId: string) => `${STORAGE_PREFIX}:${kidId || 'anonymous'}`;

export const loadGrammarFixProgress = (kidId: string): GrammarFixProgress => {
  try {
    const raw = sessionStorage.getItem(getStorageKey(kidId));
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw) as Partial<GrammarFixProgress>;
    const merged = defaultProgress();
    return {
      [GF_STAGE_2A]: { ...merged[GF_STAGE_2A], ...(parsed[GF_STAGE_2A] || {}) },
      [GF_STAGE_2B]: { ...merged[GF_STAGE_2B], ...(parsed[GF_STAGE_2B] || {}) },
      [GF_STAGE_2C]: { ...merged[GF_STAGE_2C], ...(parsed[GF_STAGE_2C] || {}) },
      [GF_STAGE_2D]: { ...merged[GF_STAGE_2D], ...(parsed[GF_STAGE_2D] || {}) },
      gameCompleted: typeof parsed.gameCompleted === 'boolean' ? parsed.gameCompleted : merged.gameCompleted,
    };
  } catch {
    return defaultProgress();
  }
};

export const saveGrammarFixProgress = (kidId: string, progress: GrammarFixProgress) => {
  try {
    sessionStorage.setItem(getStorageKey(kidId), JSON.stringify(progress));
  } catch {
    // no-op if storage is unavailable
  }
};

type StageResultInput = {
  accuracyPct: number;
  hintCount: number;
  retryCount: number;
};

export const applyGrammarFixStage2AResult = (
  kidId: string,
  result: StageResultInput,
): GrammarFixProgress => {
  const current = loadGrammarFixProgress(kidId);
  const mastered = result.accuracyPct >= 80 && result.hintCount <= 2;

  const next: GrammarFixProgress = {
    ...current,
    [GF_STAGE_2A]: {
      unlocked: true,
      completed: true,
      mastered,
      accuracyPct: result.accuracyPct,
      hintCount: result.hintCount,
      retryCount: result.retryCount,
      completedAt: Date.now(),
    },
    [GF_STAGE_2B]: {
      ...current[GF_STAGE_2B],
      unlocked: mastered,
    },
  };

  saveGrammarFixProgress(kidId, next);
  return next;
};

export const applyGrammarFixStage2BResult = (
  kidId: string,
  result: StageResultInput,
): GrammarFixProgress => {
  const current = loadGrammarFixProgress(kidId);
  const mastered = result.accuracyPct >= 80 && result.hintCount <= 2;

  const next: GrammarFixProgress = {
    ...current,
    [GF_STAGE_2B]: {
      unlocked: current[GF_STAGE_2B].unlocked || current[GF_STAGE_2A].mastered,
      completed: true,
      mastered,
      accuracyPct: result.accuracyPct,
      hintCount: result.hintCount,
      retryCount: result.retryCount,
      completedAt: Date.now(),
    },
    [GF_STAGE_2C]: {
      ...current[GF_STAGE_2C],
      unlocked: mastered,
    },
  };

  saveGrammarFixProgress(kidId, next);
  return next;
};

export const canAccessGrammarFixStage2B = (kidId: string) =>
  loadGrammarFixProgress(kidId)[GF_STAGE_2B].unlocked;

export const applyGrammarFixStage2CResult = (
  kidId: string,
  result: StageResultInput,
): GrammarFixProgress => {
  const current = loadGrammarFixProgress(kidId);
  const mastered = result.accuracyPct >= 80 && result.hintCount <= 2;

  const next: GrammarFixProgress = {
    ...current,
    [GF_STAGE_2C]: {
      unlocked: current[GF_STAGE_2C].unlocked || current[GF_STAGE_2B].mastered,
      completed: true,
      mastered,
      accuracyPct: result.accuracyPct,
      hintCount: result.hintCount,
      retryCount: result.retryCount,
      completedAt: Date.now(),
    },
    [GF_STAGE_2D]: {
      ...current[GF_STAGE_2D],
      unlocked: mastered,
    },
  };

  saveGrammarFixProgress(kidId, next);
  return next;
};

export const canAccessGrammarFixStage2C = (kidId: string) =>
  loadGrammarFixProgress(kidId)[GF_STAGE_2C].unlocked;

export const applyGrammarFixStage2DResult = (
  kidId: string,
  result: StageResultInput,
): GrammarFixProgress => {
  const current = loadGrammarFixProgress(kidId);
  const mastered = result.accuracyPct >= 80 && result.hintCount <= 2;

  const next: GrammarFixProgress = {
    ...current,
    [GF_STAGE_2D]: {
      unlocked: current[GF_STAGE_2D].unlocked || current[GF_STAGE_2C].mastered,
      completed: true,
      mastered,
      accuracyPct: result.accuracyPct,
      hintCount: result.hintCount,
      retryCount: result.retryCount,
      completedAt: Date.now(),
    },
    gameCompleted: true,
  };

  saveGrammarFixProgress(kidId, next);
  return next;
};

export const canAccessGrammarFixStage2D = (kidId: string) =>
  loadGrammarFixProgress(kidId)[GF_STAGE_2D].unlocked;
