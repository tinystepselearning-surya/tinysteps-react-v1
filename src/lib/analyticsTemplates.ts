// Templates for teacher analytics and parent insights/recommendations.
export const teacherAnalyticsDashboard = {
  classOverview: {
    averageAccuracy: '78%',
    improvementRate: '+5% per week',
    skillsNeedingWork: ['Blending', 'Subject-Verb Agreement'],
    atRiskStudents: ['John (45% accuracy)', 'Sarah (52% accuracy)'],
    topPerformers: ['Alex (95%)', 'Emily (92%)'],
  },
  individualStudentView: {
    name: 'John',
    overallAccuracy: '45%',
    skillBreakdown: {
      'CVC Words': '78% - On track',
      Blending: '32% - Needs support',
      'Sight Words': '92% - Advanced',
    },
    errorPatterns: {
      'Confuses /b/ and /p/ sounds': '8 errors',
      'Struggles with /r/ sound': '12 errors',
      'Reverses letter order': '6 errors',
    },
    recommendedIntervention: 'Focus on consonant sounds, increase practice frequency',
    nextMilestone: 'Master blending in 2-3 weeks',
    parentUpdate: 'Ready to send',
  },
  skillAnalysis: {
    topStruggles: [
      { skill: 'Blending', avgAccuracy: '45%', affectedStudents: 8 },
      { skill: 'Digraphs', avgAccuracy: '52%', affectedStudents: 6 },
      { skill: 'Subject-Verb Agreement', avgAccuracy: '61%', affectedStudents: 5 },
    ],
    skillProgression: 'Blending: Week 1 (10%) → Week 2 (25%) → Week 3 (45%)',
    benchmarks: '90% should reach 80% accuracy by Week 4',
  },
  reportGeneration: {
    weeklyClassReport: 'Generate PDF',
    parentProgressReport: "Send to John's parents",
    interventionPlan: 'Generate for at-risk students',
    customReport: 'Filter by skill, student, date range',
  },
};

export const parentInsights = {
  weeklyParentEmail: {
    subject: "John's Learning Progress - Week 3",
    content: {
      topAchievement:
        '🎉 Mastered CVC Words! John can now spell cat, dog, sit, run, pig with 95% accuracy!',
      skillFocus:
        "This week: Blending sounds\nJohn is learning to blend sounds together (/c/ /a/ /t/ = 'cat'). This is important for reading!",
      homeActivitySuggestion: `Here's what you can do at home:
1. Blend game: Say individual sounds and have John blend them
2. Sound walk: Go for a walk and identify sounds in words
3. Rhyming games: cat, bat, mat, hat

Duration: 5-10 minutes daily
When: After dinner or before bed
Why: Spaced practice helps brain remember better!`,
      areasToWork:
        'John is still working on pronunciation of /r/ sound. Practice "r" words: red, run, rain, roof',
      encouragement: "Great job supporting John's learning! Parents who practice at home see 50% faster progress.",
      nextMilestone: 'By next week, John should be able to blend any CVC word!',
    },
  },
  homeActivityLibrary: {
    blending: [
      'Sound blending game (Say sounds, kid blends)',
      'Rhyme time (Find words that rhyme)',
      'Sound sorting (Group words by sound)',
    ],
    sightWords: ['Sight word flashcards (5 min daily)', 'Word hunt around house', 'Read-aloud books with sight words'],
    speaking: ['Tell me your day (Speak for 2 minutes)', 'Read aloud to me (20 min)', 'Story time (Tell original story)'],
  },
  celebrationMoments: {
    '2024-11-17': '🎉 John reached 10-day practice streak!',
    '2024-11-15': '⭐ Sarah mastered all sight words for kindergarten!',
    '2024-11-10': '🏆 Alex scored 100% on grammar quiz!',
  },
};
