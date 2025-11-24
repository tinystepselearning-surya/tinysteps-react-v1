export type AttemptRecord = {
    correct: boolean;
    timeMs?: number;
    hesitationMs?: number;
    typingSpeedWpm?: number;
    retries?: number;
    word?: string;
    mistakeType?: 'careless' | 'knowledge_gap' | 'misunderstanding';
};
export declare class AdvancedPerformanceEngine {
    trackDetailedMetrics(attemptData: {
        correct: number;
        total: number;
        history: AttemptRecord[];
        time?: number;
        timeHistory?: number[];
        hesitationDuration?: number;
        typingSpeed?: number;
        retries?: number;
    }): {
        accuracy: number;
        accuracyTrend: string;
        responseTime: number | undefined;
        responseTimeTrend: string;
        errorPatterns: {
            mistakeType: string;
            frequentErrors: Record<string, number>;
            errorProgression: string;
        };
        confidence: {
            hesitationTime: number | undefined;
            typingSpeed: number | undefined;
            retryBehavior: number | undefined;
            confidenceScore: number;
        };
        cognitiveDifficulty: {
            forgetfulnessRate: number;
            reviewNeeded: boolean;
            nextOptimalDifficulty: string;
        };
    };
    analyzeMistakeType(history: AttemptRecord[]): "none" | "careless" | "knowledge_gap";
    calculateConfidence(input: {
        hesitationDuration?: number;
        typingSpeed?: number;
        retries?: number;
    }): number;
    calculateForgetfulness(history: AttemptRecord[]): number;
    isReviewNeeded(history: AttemptRecord[]): boolean;
    predictOptimalDifficulty(history: AttemptRecord[]): "increase" | "decrease" | "maintain";
}
export declare class PredictiveAdaptiveEngine {
    predictMasteryDate(skillId: string, currentPerformance: {
        avgAccuracy: number;
        weeklyImprovement: number;
    }): {
        masteryDate: Date;
        confidence: number;
        recommendation: {
            action: string;
            reason: string;
        };
    };
    calculatePredictionConfidence(weeksToMastery: number): 0.2 | 0.3 | 0.5 | 0.7 | 0.9;
    generateRecommendation(weeksToMastery: number): {
        action: string;
        reason: string;
    };
}
