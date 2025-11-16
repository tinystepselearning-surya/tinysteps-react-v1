// Speaking rubric, prompts, and gentler fallback feedback.
export const speakingRubric = {
  clarity: {
    score5: 'Speaks very clearly; easy to understand',
    score4: 'Speaks clearly with occasional unclear parts',
    score3: 'Mostly clear; listener needs concentration',
    score2: 'Unclear; listener struggles to understand',
    score1: 'Barely understandable',
  },
  pace: {
    score5: 'Perfect pace; natural rhythm',
    score4: 'Good pace; mostly natural',
    score3: 'Acceptable pace; sometimes too fast/slow',
    score2: 'Pace too fast or too slow',
    score1: 'Pace makes speech hard to follow',
  },
  pronunciation: {
    score5: 'Correct pronunciation throughout',
    score4: 'Mostly correct; minor errors',
    score3: "Some pronunciation errors; doesn't block understanding",
    score2: 'Frequent errors; sometimes hard to understand',
    score1: 'Major errors; hard to understand',
  },
  confidence: {
    score5: 'Very confident; engaging delivery',
    score4: 'Confident; good engagement',
    score3: 'Somewhat confident; hesitant at times',
    score2: 'Nervous; struggles with delivery',
    score1: 'Very nervous; lacks confidence',
  },
};

export const speakingPrompts = {
  age5_6: {
    level: 'beginner',
    topics: [
      {
        prompt: 'Tell me about your favorite animal. Why do you like it?',
        timeLimit: 20,
        targetStructure: 'I like ___ because ___',
        vocabulary: 15,
        examples: ['I like dogs because they are friendly.', 'I like cats because they are soft.'],
      },
      {
        prompt: 'What did you do today?',
        timeLimit: 20,
        targetStructure: 'I ___ with ___',
        vocabulary: 15,
        examples: ['I played with my friends.', 'I ate lunch at school.'],
      },
      {
        prompt: 'Tell me about your family.',
        timeLimit: 20,
        targetStructure: 'My ___ is ___',
        vocabulary: 15,
      },
      {
        prompt: 'What is your favorite food?',
        timeLimit: 15,
        targetStructure: 'I like ___ because ___',
        vocabulary: 10,
      },
    ],
  },
  age7_8: {
    level: 'intermediate',
    topics: [
      {
        prompt: 'Describe your best friend. What do you like about them?',
        timeLimit: 30,
        targetStructure: 'My friend ___ is ___ because ___',
        vocabulary: 30,
        examples: ['My friend Sarah is funny because she makes jokes.', 'My best friend is kind because he shares with everyone.'],
      },
      {
        prompt: 'Tell a story about an adventure you had.',
        timeLimit: 40,
        targetStructure: 'First ___, then ___, finally ___',
        vocabulary: 50,
        examples: ['First, we went to the park. Then we played on the swings. Finally, we got ice cream.'],
      },
      {
        prompt: 'Explain how to make a sandwich.',
        timeLimit: 30,
        targetStructure: 'First ___, next ___, then ___',
        vocabulary: 30,
        steps: ['Get bread', 'Add butter', 'Add filling', 'Put together'],
      },
      {
        prompt: 'What is your favorite book? Why do you like it?',
        timeLimit: 30,
        targetStructure: 'My favorite book is ___ by ___. I like it because ___',
        vocabulary: 30,
      },
    ],
  },
  age9_10: {
    level: 'advanced',
    topics: [
      {
        prompt: 'Give directions from school to your home.',
        timeLimit: 45,
        targetStructure: 'Go ___, turn ___, continue until ___',
        vocabulary: 50,
        landmarkVocabulary: ['corner', 'traffic light', 'building', 'street'],
      },
      {
        prompt: 'Present your favorite hobby. What do you do? Why is it fun?',
        timeLimit: 60,
        targetStructure: 'My hobby is ___. I do this because ___. My favorite part is ___',
        vocabulary: 60,
      },
      {
        prompt: 'Explain a scientific concept (water cycle, photosynthesis, etc).',
        timeLimit: 60,
        targetStructure: 'First ___ happens. Then ___. This creates ___.',
        vocabulary: 80,
        concepts: ['water cycle', 'photosynthesis', 'seasons', 'weather'],
      },
      {
        prompt: 'Persuade others to try your favorite activity.',
        timeLimit: 60,
        targetStructure: 'You should try ___ because ___. It is ___ because ___.',
        vocabulary: 70,
      },
    ],
  },
};

function choosePromptByAge(age = 8) {
  if (age <= 6) return speakingPrompts.age5_6.topics;
  if (age <= 8) return speakingPrompts.age7_8.topics;
  return speakingPrompts.age9_10.topics;
}

export function getLocalPrompt(age = 8) {
  const pool = choosePromptByAge(age) || [];
  const picked = pool[Math.floor(Math.random() * pool.length)];
  if (picked) return { prompt: picked.prompt, targetStructure: picked.targetStructure, duration: picked.timeLimit, context: 'Speaking' };
  return { prompt: 'Talk about your day.', duration: 20, context: 'Personal' };
}

export function buildLocalFeedback({ prompt, age = 8 }) {
  // Simple non-AI fallback feedback
  return {
    clarity: 4,
    speed: 3,
    pronunciation: 4,
    confidence: 3,
    overall: `Great effort on "${prompt}". Try a slower pace and clear endings. You're building strong speaking skills!`,
    age,
  };
}
