// Comprehensive performance tracking and predictive learning helpers.
export type AttemptRecord = {
  correct: boolean;
  timeMs?: number;
  hesitationMs?: number;
  typingSpeedWpm?: number;
  retries?: number;
  word?: string;
  mistakeType?: 'careless' | 'knowledge_gap' | 'misunderstanding';
};

function average(nums: number[]) {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function trend(values: number[]) {
  if (values.length < 2) return 'stable';
  const first = average(values.slice(0, Math.ceil(values.length / 2)));
  const last = average(values.slice(Math.floor(values.length / 2)));
  if (last > first + 0.05) return 'improving';
  if (last < first - 0.05) return 'declining';
  return 'stable';
}

function freqMap(items: (string | undefined)[]) {
  return items.reduce<Record<string, number>>((map, item) => {
    if (!item) return map;
    map[item] = (map[item] || 0) + 1;
    return map;
  }, {});
}

export class AdvancedPerformanceEngine {
  trackDetailedMetrics(attemptData: {
    correct: number;
    total: number;
    history: AttemptRecord[];
    time?: number;
    timeHistory?: number[];
    hesitationDuration?: number;
    typingSpeed?: number;
    retries?: number;
  }) {
    const accuracy = attemptData.total ? attemptData.correct / attemptData.total : 0;
    const accuracyTrend = trend(attemptData.history.map((h) => (h.correct ? 1 : 0)));
    const responseTimeTrend = trend(attemptData.timeHistory || []);

    const mistakeTypes = freqMap(attemptData.history.map((h) => h.mistakeType));
    const frequentErrors = freqMap(attemptData.history.map((h) => h.word));

    const confidenceScore = this.calculateConfidence({
      hesitationDuration: attemptData.hesitationDuration,
      typingSpeed: attemptData.typingSpeed,
      retries: attemptData.retries,
    });

    return {
      accuracy,
      accuracyTrend,
      responseTime: attemptData.time,
      responseTimeTrend,
      errorPatterns: {
        mistakeType: this.analyzeMistakeType(attemptData.history),
        frequentErrors,
        errorProgression: trend(attemptData.history.map((h) => (h.correct ? 0 : 1))),
      },
      confidence: {
        hesitationTime: attemptData.hesitationDuration,
        typingSpeed: attemptData.typingSpeed,
        retryBehavior: attemptData.retries,
        confidenceScore,
      },
      cognitiveDifficulty: {
        forgetfulnessRate: this.calculateForgetfulness(attemptData.history),
        reviewNeeded: this.isReviewNeeded(attemptData.history),
        nextOptimalDifficulty: this.predictOptimalDifficulty(attemptData.history),
      },
    };
  }

  analyzeMistakeType(history: AttemptRecord[]) {
    if (!history.length) return 'knowledge_gap';
    const recent = history.slice(-1)[0];
    if (recent.correct) return 'none';
    const hadCorrect = history.some((h) => h.word === recent.word && h.correct);
    if (hadCorrect) return 'careless';
    return 'knowledge_gap';
  }

  calculateConfidence(input: { hesitationDuration?: number; typingSpeed?: number; retries?: number }) {
    let score = 0.5;
    if (input.hesitationDuration != null) {
      score -= Math.min(input.hesitationDuration / 5000, 0.3);
    }
    if (input.typingSpeed != null) {
      score += Math.min(input.typingSpeed / 60, 0.3);
    }
    if (input.retries != null) {
      score -= Math.min(input.retries * 0.05, 0.2);
    }
    return Math.max(0, Math.min(1, score));
  }

  calculateForgetfulness(history: AttemptRecord[]) {
    const incorrect = history.filter((h) => !h.correct).length;
    return history.length ? incorrect / history.length : 0;
  }

  isReviewNeeded(history: AttemptRecord[]) {
    return this.calculateForgetfulness(history) > 0.4;
  }

  predictOptimalDifficulty(history: AttemptRecord[]) {
    const acc = history.length
      ? history.reduce((a, h) => a + (h.correct ? 1 : 0), 0) / history.length
      : 0;
    if (acc > 0.85) return 'increase';
    if (acc < 0.7) return 'decrease';
    return 'maintain';
  }
}

export class PredictiveAdaptiveEngine {
  predictMasteryDate(skillId: string, currentPerformance: { avgAccuracy: number; weeklyImprovement: number }) {
    const currentAccuracy = currentPerformance.avgAccuracy || 0;
    const improvementRate = currentPerformance.weeklyImprovement || 0.05;
    const remaining = Math.max(0, 0.9 - currentAccuracy);
    const weeksToMastery = improvementRate > 0 ? remaining / improvementRate : Infinity;
    return {
      masteryDate: new Date(Date.now() + weeksToMastery * 7 * 24 * 60 * 60 * 1000),
      confidence: this.calculatePredictionConfidence(weeksToMastery),
      recommendation: this.generateRecommendation(weeksToMastery),
    };
  }

  calculatePredictionConfidence(weeksToMastery: number) {
    if (!isFinite(weeksToMastery)) return 0.2;
    if (weeksToMastery < 1) return 0.9;
    if (weeksToMastery < 4) return 0.7;
    if (weeksToMastery < 8) return 0.5;
    return 0.3;
  }

  generateRecommendation(weeksToMastery: number) {
    if (weeksToMastery < 1) {
      return { action: 'advance', reason: 'Mastering quickly' };
    }
    if (weeksToMastery > 8) {
      return { action: 'additional_support', reason: 'Needs more practice' };
    }
    return { action: 'maintain', reason: 'On track' };
  }
}
