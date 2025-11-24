export declare const teacherAnalyticsDashboard: {
    classOverview: {
        averageAccuracy: string;
        improvementRate: string;
        skillsNeedingWork: string[];
        atRiskStudents: string[];
        topPerformers: string[];
    };
    individualStudentView: {
        name: string;
        overallAccuracy: string;
        skillBreakdown: {
            'CVC Words': string;
            Blending: string;
            'Sight Words': string;
        };
        errorPatterns: {
            'Confuses /b/ and /p/ sounds': string;
            'Struggles with /r/ sound': string;
            'Reverses letter order': string;
        };
        recommendedIntervention: string;
        nextMilestone: string;
        parentUpdate: string;
    };
    skillAnalysis: {
        topStruggles: {
            skill: string;
            avgAccuracy: string;
            affectedStudents: number;
        }[];
        skillProgression: string;
        benchmarks: string;
    };
    reportGeneration: {
        weeklyClassReport: string;
        parentProgressReport: string;
        interventionPlan: string;
        customReport: string;
    };
};
export declare const parentInsights: {
    weeklyParentEmail: {
        subject: string;
        content: {
            topAchievement: string;
            skillFocus: string;
            homeActivitySuggestion: string;
            areasToWork: string;
            encouragement: string;
            nextMilestone: string;
        };
    };
    homeActivityLibrary: {
        blending: string[];
        sightWords: string[];
        speaking: string[];
    };
    celebrationMoments: {
        '2024-11-17': string;
        '2024-11-15': string;
        '2024-11-10': string;
    };
};
