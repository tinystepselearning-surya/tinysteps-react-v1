import { recordLevelResult } from '../../../../games/engine/recordLevelResult';

export const BBS_STAGE_1A = 'bbs-1a-reorder';
export const BBS_STAGE_1B = 'bbs-1b-fill-missing-word';
export const BBS_STAGE_1C = 'bbs-1c-choose-better-sentence';
export const BBS_STAGE_1D = 'bbs-1d-expand-sentence';

const CANONICAL_GAME_ID = 'build-better-sentences';
const CANONICAL_PROGRESS_DOC_ID = 'build-better-sentences';

export type StageProgress = {
  unlocked: boolean;
  completed: boolean;
  mastered: boolean;
  accuracyPct: number;
  hintCount: number;
  retryCount: number;
  completedAt: number | null;
};

export type BuildBetterSentencesProgress = {
  [BBS_STAGE_1A]: StageProgress;
  [BBS_STAGE_1B]: StageProgress;
  [BBS_STAGE_1C]: StageProgress;
  [BBS_STAGE_1D]: StageProgress;
  gameCompleted: boolean;
};

const STORAGE_PREFIX = 'ts_bbs_progress_v1';

export const createDefaultBbsProgress = (): BuildBetterSentencesProgress => ({
  [BBS_STAGE_1A]: {
    unlocked: true,
    completed: false,
    mastered: false,
    accuracyPct: 0,
    hintCount: 0,
    retryCount: 0,
    completedAt: null,
  },
  [BBS_STAGE_1B]: {
    unlocked: false,
    completed: false,
    mastered: false,
    accuracyPct: 0,
    hintCount: 0,
    retryCount: 0,
    completedAt: null,
  },
  [BBS_STAGE_1C]: {
    unlocked: false,
    completed: false,
    mastered: false,
    accuracyPct: 0,
    hintCount: 0,
    retryCount: 0,
    completedAt: null,
  },
  [BBS_STAGE_1D]: {
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

export const loadBbsProgress = (kidId: string): BuildBetterSentencesProgress => {
  try {
    const raw = sessionStorage.getItem(getStorageKey(kidId));
    if (!raw) return createDefaultBbsProgress();
    const parsed = JSON.parse(raw) as Partial<BuildBetterSentencesProgress>;
    const merged = createDefaultBbsProgress();
    return {
      [BBS_STAGE_1A]: { ...merged[BBS_STAGE_1A], ...(parsed[BBS_STAGE_1A] || {}) },
      [BBS_STAGE_1B]: { ...merged[BBS_STAGE_1B], ...(parsed[BBS_STAGE_1B] || {}) },
      [BBS_STAGE_1C]: { ...merged[BBS_STAGE_1C], ...(parsed[BBS_STAGE_1C] || {}) },
      [BBS_STAGE_1D]: { ...merged[BBS_STAGE_1D], ...(parsed[BBS_STAGE_1D] || {}) },
      gameCompleted: typeof parsed.gameCompleted === 'boolean' ? parsed.gameCompleted : merged.gameCompleted,
    };
  } catch {
    return createDefaultBbsProgress();
  }
};

export const saveBbsProgress = (kidId: string, progress: BuildBetterSentencesProgress) => {
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

function recordBbsStageCompletion({
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
      'subtopic:build_better_sentences',
      `stage:${stageTag}`,
      mastered ? 'outcome:mastery' : 'outcome:practice',
    ],
    completedAt: Date.now(),
  } as any).catch((err) => {
    console.error('[buildBetterSentencesProgress] recordLevelResult failed:', err);
  });
}

export const applyStage1AResult = (
  kidId: string,
  result: StageResultInput,
): BuildBetterSentencesProgress => {
  const current = loadBbsProgress(kidId);
  const mastered = result.accuracyPct >= 80 && result.hintCount <= 2;

  const next: BuildBetterSentencesProgress = {
    ...current,
    [BBS_STAGE_1A]: {
      unlocked: true,
      completed: true,
      mastered,
      accuracyPct: result.accuracyPct,
      hintCount: result.hintCount,
      retryCount: result.retryCount,
      completedAt: Date.now(),
    },
    [BBS_STAGE_1B]: {
      ...current[BBS_STAGE_1B],
      unlocked: mastered,
    },
  };

  saveBbsProgress(kidId, next);
  recordBbsStageCompletion({
    kidId,
    levelId: 1,
    stageTag: BBS_STAGE_1A,
    result,
    mastered,
  });
  return next;
};

export const applyStage1BResult = (
  kidId: string,
  result: StageResultInput,
): BuildBetterSentencesProgress => {
  const current = loadBbsProgress(kidId);
  const mastered = result.accuracyPct >= 80 && result.hintCount <= 2;

  const next: BuildBetterSentencesProgress = {
    ...current,
    [BBS_STAGE_1B]: {
      unlocked: current[BBS_STAGE_1B].unlocked || current[BBS_STAGE_1A].mastered,
      completed: true,
      mastered,
      accuracyPct: result.accuracyPct,
      hintCount: result.hintCount,
      retryCount: result.retryCount,
      completedAt: Date.now(),
    },
    [BBS_STAGE_1C]: {
      ...current[BBS_STAGE_1C],
      unlocked: mastered,
    },
  };

  saveBbsProgress(kidId, next);
  recordBbsStageCompletion({
    kidId,
    levelId: 2,
    stageTag: BBS_STAGE_1B,
    result,
    mastered,
  });
  return next;
};

export const applyStage1CResult = (
  kidId: string,
  result: StageResultInput,
): BuildBetterSentencesProgress => {
  const current = loadBbsProgress(kidId);
  const mastered = result.accuracyPct >= 80 && result.hintCount <= 2;

  const next: BuildBetterSentencesProgress = {
    ...current,
    [BBS_STAGE_1C]: {
      unlocked: current[BBS_STAGE_1C].unlocked || current[BBS_STAGE_1B].mastered,
      completed: true,
      mastered,
      accuracyPct: result.accuracyPct,
      hintCount: result.hintCount,
      retryCount: result.retryCount,
      completedAt: Date.now(),
    },
    [BBS_STAGE_1D]: {
      ...current[BBS_STAGE_1D],
      unlocked: mastered,
    },
  };

  saveBbsProgress(kidId, next);
  recordBbsStageCompletion({
    kidId,
    levelId: 3,
    stageTag: BBS_STAGE_1C,
    result,
    mastered,
  });
  return next;
};

export const applyStage1DResult = (
  kidId: string,
  result: StageResultInput,
): BuildBetterSentencesProgress => {
  const current = loadBbsProgress(kidId);
  const mastered = result.accuracyPct >= 80 && result.hintCount <= 2;

  const next: BuildBetterSentencesProgress = {
    ...current,
    [BBS_STAGE_1D]: {
      unlocked: current[BBS_STAGE_1D].unlocked || current[BBS_STAGE_1C].mastered,
      completed: true,
      mastered,
      accuracyPct: result.accuracyPct,
      hintCount: result.hintCount,
      retryCount: result.retryCount,
      completedAt: Date.now(),
    },
    gameCompleted: true,
  };

  saveBbsProgress(kidId, next);
  recordBbsStageCompletion({
    kidId,
    levelId: 4,
    stageTag: BBS_STAGE_1D,
    result,
    mastered,
  });
  return next;
};

export const canAccessStage1B = (kidId: string) => loadBbsProgress(kidId)[BBS_STAGE_1B].unlocked;
export const canAccessStage1C = (kidId: string) => loadBbsProgress(kidId)[BBS_STAGE_1C].unlocked;
export const canAccessStage1D = (kidId: string) => loadBbsProgress(kidId)[BBS_STAGE_1D].unlocked;
