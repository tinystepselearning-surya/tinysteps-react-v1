export declare const advancedAnalytics: {
    eventTracking: {
        gameStarted: {
            game: string;
            timestamp: string;
            level: string;
        };
        answerSubmitted: {
            game: string;
            isCorrect: boolean;
            responseTime: number;
            attemptNumber: number;
        };
        hintUsed: {
            game: string;
            hintLevel: string;
            timestamp: string;
        };
        levelAdvanced: {
            game: string;
            fromLevel: string;
            toLevel: string;
            accuracy: number;
        };
        streakBroken: {
            game: string;
            streakLength: number;
        };
        achievementUnlocked: {
            achievementName: string;
            timestamp: string;
        };
    };
    learnerMetrics: {
        responseTime: string;
        hintDependence: string;
        retryRate: string;
        confidenceLevel: string;
        engagementScore: string;
        learningVelocity: string;
    };
    predictiveModels: {
        chanceOfMastery: string;
        riskOfDropout: string;
        optimalDifficulty: string;
        recommendedIntervention: string;
        similarPeers: string;
    };
};
