export const CB_STAGE_3A = 'cb-3a-match-pairs';
export const CB_STAGE_3B = 'cb-3b-choose-natural-pair';
export const CB_STAGE_3C = 'cb-3c-fill-sentence';

export type CollocationStageProgress = {
  unlocked: boolean;
  completed: boolean;
  mastered: boolean;
  accuracyPct: number;
  hintCount: number;
  retryCount: number;
  completedAt: number | null;
};

export type CollocationBuilderProgress = {
  [CB_STAGE_3A]: CollocationStageProgress;
  [CB_STAGE_3B]: CollocationStageProgress;
  [CB_STAGE_3C]: CollocationStageProgress;
  gameCompleted: boolean;
};

const STORAGE_PREFIX = 'ts_collocation_builder_progress_v1';

const defaultProgress = (): CollocationBuilderProgress => ({
  [CB_STAGE_3A]: {
    unlocked: true,
    completed: false,
    mastered: false,
    accuracyPct: 0,
    hintCount: 0,
    retryCount: 0,
    completedAt: null,
  },
  [CB_STAGE_3B]: {
    unlocked: false,
    completed: false,
    mastered: false,
    accuracyPct: 0,
    hintCount: 0,
    retryCount: 0,
    completedAt: null,
  },
  [CB_STAGE_3C]: {
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

export const loadCollocationBuilderProgress = (kidId: string): CollocationBuilderProgress => {
  try {
    const raw = sessionStorage.getItem(getStorageKey(kidId));
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw) as Partial<CollocationBuilderProgress>;
    const merged = defaultProgress();
    return {
      [CB_STAGE_3A]: { ...merged[CB_STAGE_3A], ...(parsed[CB_STAGE_3A] || {}) },
      [CB_STAGE_3B]: { ...merged[CB_STAGE_3B], ...(parsed[CB_STAGE_3B] || {}) },
      [CB_STAGE_3C]: { ...merged[CB_STAGE_3C], ...(parsed[CB_STAGE_3C] || {}) },
      gameCompleted: typeof parsed.gameCompleted === 'boolean' ? parsed.gameCompleted : merged.gameCompleted,
    };
  } catch {
    return defaultProgress();
  }
};

export const saveCollocationBuilderProgress = (kidId: string, progress: CollocationBuilderProgress) => {
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

export const applyCollocationStage3AResult = (
  kidId: string,
  result: StageResultInput,
): CollocationBuilderProgress => {
  const current = loadCollocationBuilderProgress(kidId);
  const mastered = result.accuracyPct >= 80 && result.hintCount <= 2;

  const next: CollocationBuilderProgress = {
    ...current,
    [CB_STAGE_3A]: {
      unlocked: true,
      completed: true,
      mastered,
      accuracyPct: result.accuracyPct,
      hintCount: result.hintCount,
      retryCount: result.retryCount,
      completedAt: Date.now(),
    },
    [CB_STAGE_3B]: {
      ...current[CB_STAGE_3B],
      unlocked: mastered,
    },
  };

  saveCollocationBuilderProgress(kidId, next);
  return next;
};

export const applyCollocationStage3BResult = (
  kidId: string,
  result: StageResultInput,
): CollocationBuilderProgress => {
  const current = loadCollocationBuilderProgress(kidId);
  const mastered = result.accuracyPct >= 80 && result.hintCount <= 2;

  const next: CollocationBuilderProgress = {
    ...current,
    [CB_STAGE_3B]: {
      unlocked: current[CB_STAGE_3B].unlocked || current[CB_STAGE_3A].mastered,
      completed: true,
      mastered,
      accuracyPct: result.accuracyPct,
      hintCount: result.hintCount,
      retryCount: result.retryCount,
      completedAt: Date.now(),
    },
    [CB_STAGE_3C]: {
      ...current[CB_STAGE_3C],
      unlocked: mastered,
    },
  };

  saveCollocationBuilderProgress(kidId, next);
  return next;
};

export const canAccessCollocationStage3B = (kidId: string) =>
  loadCollocationBuilderProgress(kidId)[CB_STAGE_3B].unlocked;

export const applyCollocationStage3CResult = (
  kidId: string,
  result: StageResultInput,
): CollocationBuilderProgress => {
  const current = loadCollocationBuilderProgress(kidId);
  const mastered = result.accuracyPct >= 80 && result.hintCount <= 2;

  const next: CollocationBuilderProgress = {
    ...current,
    [CB_STAGE_3C]: {
      unlocked: current[CB_STAGE_3C].unlocked || current[CB_STAGE_3B].mastered,
      completed: true,
      mastered,
      accuracyPct: result.accuracyPct,
      hintCount: result.hintCount,
      retryCount: result.retryCount,
      completedAt: Date.now(),
    },
    gameCompleted: true,
  };

  saveCollocationBuilderProgress(kidId, next);
  return next;
};

export const canAccessCollocationStage3C = (kidId: string) =>
  loadCollocationBuilderProgress(kidId)[CB_STAGE_3C].unlocked;
