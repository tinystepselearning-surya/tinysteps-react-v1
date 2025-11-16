// Gamification system: achievements, badges, points, daily/weekly challenges, seasonal content.
export const gamificationSystem = {
  achievements: {
    speed: {
      lightning: { threshold: '< 2 sec response', reward: 50, icon: '⚡' },
      quick_thinker: { threshold: '< 3 sec avg', reward: 100, icon: '🚀' },
      speed_demon: { threshold: 'top 5% speed', reward: 200, icon: '🏃' },
    },
    accuracy: {
      perfect_10: { threshold: '10/10 correct', reward: 50, icon: '✨' },
      perfect_50: { threshold: '50 perfect rounds', reward: 250, icon: '🌟' },
      flawless: { threshold: '0 mistakes in session', reward: 100, icon: '💎' },
    },
    consistency: {
      '3_day_streak': { threshold: '3 days consecutive', reward: 75, icon: '🔥' },
      '7_day_streak': { threshold: '7 days consecutive', reward: 150, icon: '🔥🔥' },
      '30_day_challenge': { threshold: '30 days consecutive', reward: 500, icon: '🏆' },
    },
    learning: {
      skill_master: { threshold: '90% accuracy on skill', reward: 200, icon: '📚' },
      level_up: { threshold: 'Advance to next level', reward: 150, icon: '📈' },
      polyglot: { threshold: 'Master 5 different skills', reward: 500, icon: '🧠' },
    },
    social: {
      leaderboard_top_10: { threshold: 'Top 10 weekly', reward: 100, icon: '🏅' },
      top_scorer: { threshold: '#1 on leaderboard', reward: 300, icon: '👑' },
      friend_challenge_win: { threshold: 'Beat friend', reward: 50, icon: '🤝' },
    },
  },
  badges: {
    beginner: { condition: 'Complete tutorial', icon: '🎓' },
    practitioner: { condition: '100+ correct answers', icon: '📖' },
    expert: { condition: '1000+ correct answers', icon: '🏆' },
    master: { condition: '5000+ correct answers', icon: '👑' },
  },
  pointSystem: {
    easyCorrect: 10,
    mediumCorrect: 25,
    hardCorrect: 50,
    perfectStreak: (streakCount: number) => 5 * streakCount,
    speedBonus: (responseTime: number) => (responseTime < 2 ? 10 : 0),
  },
};

export const dailyChallengeSystem = {
  challenges: {
    daily: {
      morning_spelling_rush: {
        game: 'SpellBee',
        dailyAt: '6:00 AM',
        duration: 300,
        reward: 100,
        description: 'Spell 10 words in 5 minutes!',
      },
      afternoon_maze_master: {
        game: 'Maze',
        dailyAt: '3:00 PM',
        duration: 600,
        reward: 150,
        description: 'Complete 3 mazes without mistakes',
      },
      evening_reading_adventure: {
        game: 'Reading',
        dailyAt: '7:00 PM',
        duration: 900,
        reward: 200,
        description: 'Read a chapter and answer comprehension questions',
      },
    },
    weekly: {
      phonics_week: {
        theme: 'Master Phonics',
        games: ['SpellBee', 'Maze', 'Bingo'],
        goal: '500 points total',
        reward: 500,
        startDay: 'Monday',
      },
      grammar_week: {
        theme: 'Grammar Master',
        games: ['Grammar Builder'],
        goal: '4 grammar topics mastered',
        reward: 600,
        startDay: 'Monday',
      },
    },
  },
  seasonalContent: {
    halloween_special: { month: 'October', content: 'Spooky word themes' },
    holiday_marathon: { month: 'December', content: 'Extended challenges' },
    spring_renewal: { month: 'March', content: 'New levels unlock' },
  },
};
