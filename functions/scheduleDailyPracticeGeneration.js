// Convenience re-export so deployment can target this function name explicitly.
const { scheduleDailyPracticeGeneration } = require('./generateDailyPractice');
exports.scheduleDailyPracticeGeneration = scheduleDailyPracticeGeneration;
