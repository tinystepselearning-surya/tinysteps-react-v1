import { recordLevelResult } from '../../../../games/engine/recordLevelResult';

export const CB_STAGE_3A = 'cb-3a-match-pairs';
export const CB_STAGE_3B = 'cb-3b-choose-natural-pair';
export const CB_STAGE_3C = 'cb-3c-fill-sentence';

const CANONICAL_GAME_ID = 'collocation-builder';
const CANONICAL_PROGRESS_DOC_ID = 'collocation-builder';

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

function recordCollocationStageCompletion({
  kidId,
  levelId,
  stageTag,
  result,
  mastered,
}: {
  kidId: string;
  levelId: number;
  stageTag: string;
  result: StageResultInput;
  mastered: boolean;
}) {
  if (!kidId) return;

  void recordLevelResult({
    kidId,
    gameId: CANONICAL_GAME_ID,
    progressDocId: CANONICAL_PROGRESS_DOC_ID,
    levelId,
    completed: true,
    accuracyPct: result.accuracyPct,
    skillTags: [
      'area:grammar',
      'subtopic:collocation_builder',
      `stage:${stageTag}`,
      mastered ? 'outcome:mastery' : 'outcome:practice',
    ],
    completedAt: Date.now(),
  } as any).catch((err) => {
    console.error('[collocationBuilderProgress] recordLevelResult failed:', err);
  });
}

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
  recordCollocationStageCompletion({
    kidId,
    levelId: 1,
    stageTag: CB_STAGE_3A,
    result,
    mastered,
  });
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
  recordCollocationStageCompletion({
    kidId,
    levelId: 2,
    stageTag: CB_STAGE_3B,
    result,
    mastered,
  });
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
  recordCollocationStageCompletion({
    kidId,
    levelId: 3,
    stageTag: CB_STAGE_3C,
    result,
    mastered,
  });
  return next;
};

export const canAccessCollocationStage3C = (kidId: string) =>
  loadCollocationBuilderProgress(kidId)[CB_STAGE_3C].unlocked;
