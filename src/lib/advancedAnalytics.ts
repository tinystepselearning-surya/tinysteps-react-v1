// Advanced learner analytics event schema and predictive hooks.
export const advancedAnalytics = {
  eventTracking: {
    gameStarted: { game: '', timestamp: '', level: '' },
    answerSubmitted: { game: '', isCorrect: false, responseTime: 0, attemptNumber: 0 },
    hintUsed: { game: '', hintLevel: '', timestamp: '' },
    levelAdvanced: { game: '', fromLevel: '', toLevel: '', accuracy: 0 },
    streakBroken: { game: '', streakLength: 0 },
    achievementUnlocked: { achievementName: '', timestamp: '' },
  },
  learnerMetrics: {
    responseTime: 'Average time to answer',
    hintDependence: '% of questions using hints',
    retryRate: '% of questions retried',
    confidenceLevel: 'Calculated from hesitation time',
    engagementScore: 'Time spent vs achievements',
    learningVelocity: 'Improvement rate per week',
  },
  predictiveModels: {
    chanceOfMastery: 'Calculate 90% probability date',
    riskOfDropout: 'Student disengagement risk',
    optimalDifficulty: 'Best next challenge level',
    recommendedIntervention: 'What help does student need?',
    similarPeers: 'Find students with similar patterns',
  },
};
