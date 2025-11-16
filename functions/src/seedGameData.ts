import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

// Import the enhanced datasets using require since it's a JS file
const { enhancedSpellbeeData } = require('../enhancedSpellbeeData.js');

// Static maze data (simplified version)
const staticMazeData = {
  easy: {
    rows: 10,
    cols: 10,
    junctions: [
      {
        position: [1, 2],
        question: "Which is /bæt/?",
        options: [
          { text: "bat", sound: "/bæt/", correct: true },
          { text: "bit", sound: "/bɪt/", correct: false },
          { text: "but", sound: "/bʌt/", correct: false }
        ],
        topic: "CVC"
      },
      {
        position: [2, 4],
        question: "Which is /kæt/?",
        options: [
          { text: "cat", sound: "/kæt/", correct: true },
          { text: "kit", sound: "/kɪt/", correct: false },
          { text: "cut", sound: "/kʌt/", correct: false }
        ],
        topic: "CVC"
      }
    ],
    correctPath: [[1,1],[1,2],[2,2],[2,4],[3,4]]
  },
  medium: {
    rows: 12,
    cols: 12,
    junctions: [
      {
        position: [1, 3],
        question: "Which is /dɒg/?",
        options: [
          { text: "dog", sound: "/dɒg/", correct: true },
          { text: "dig", sound: "/dɪg/", correct: false },
          { text: "dug", sound: "/dʌg/", correct: false }
        ],
        topic: "CVC"
      }
    ],
    correctPath: [[1,1],[1,3],[2,3]]
  }
};

// Static bingo data
const staticBingoData = {
  easy: {
    words: ['the', 'and', 'is', 'in', 'a', 'to', 'for', 'you', 'it', 'of'],
    clues: [
      'A small word that comes before other words',
      'Two things joined together',
      'To be or exist',
      'Inside something',
      'One thing',
      'Going towards',
      'Made for someone',
      'Person being spoken to',
      'That thing',
      'Belonging to'
    ],
    card: [
      ['the', 'and', 'is', 'in', 'a'],
      ['to', 'for', 'you', 'it', 'of'],
      ['on', 'we', 'he', 'she', 'me'],
      ['be', 'can', 'go', 'so', 'no'],
      ['up', 'down', 'look', 'see', 'like']
    ]
  },
  medium: {
    words: ['there', 'because', 'could', 'should', 'would'],
    clues: [
      'In that place',
      'For this reason',
      'Was able to',
      'Ought to',
      'Wanted to'
    ],
    card: [
      ['there', 'because', 'could', 'should', 'would'],
      ['where', 'what', 'when', 'who', 'why'],
      ['about', 'after', 'before', 'every', 'many'],
      ['some', 'come', 'here', 'they', 'these'],
      ['those', 'once', 'people', 'laugh', 'again']
    ]
  }
};

// Static grammar data
const staticGrammarData = {
  'singular/plural nouns': {
    exercises: [
      {
        question: "What is the plural of 'cat'?",
        options: ["cats", "cat's", "catting"],
        correctAnswer: "cats",
        explanation: "Add 's' to make nouns plural."
      },
      {
        question: "Which is correct: 'One dog' or 'One dogs'?",
        options: ["One dog", "One dogs"],
        correctAnswer: "One dog",
        explanation: "'Dog' is singular with 'one'."
      }
    ]
  },
  tenses: {
    exercises: [
      {
        question: "What tense is 'I walked'?",
        options: ["Present", "Past", "Future"],
        correctAnswer: "Past",
        explanation: "Past tense shows completed action."
      }
    ]
  }
};

// Static speaking data
const staticSpeakingData = {
  '6-10': {
    easy: {
      prompts: [
        {
          prompt: "Tell me about your favorite animal. Why do you like it?",
          targetTime: 30,
          evaluationCriteria: [
            "Speaks clearly",
            "Stays on topic",
            "Speaks at good pace"
          ]
        },
        {
          prompt: "Describe your best friend. What do you like to do together?",
          targetTime: 45,
          evaluationCriteria: [
            "Uses descriptive words",
            "Speaks confidently",
            "Makes eye contact"
          ]
        }
      ]
    }
  }
};

// Static reading data
const staticReadingData = {
  levels: [
    {
      level: "Early Primary",
      chapters: [
        {
          chapter: "The Little Red Hen worked hard in the farm. She planted seeds and watered them. The other animals watched but did not help. When the wheat grew, the hen asked for help. 'Who will help me cut the wheat?' she asked. The duck said, 'Not I.' The cat said, 'Not I.' The dog said, 'Not I.' So the hen cut the wheat alone.",
          question: "Who helped the Little Red Hen cut the wheat?",
          options: ["The duck", "The cat", "No one", "The dog"],
          correctAnswer: "No one"
        }
      ]
    }
  ]
};

export const seedGameData = onCall(
  {
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async (data: any, context: any) => {
    if (!context.auth || !context.auth.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const db = admin.firestore();
    const batch = db.batch();

    try {
      // Seed SpellBee data
      const spellbeeRef = db.collection('gameData').doc('spellbee');
      batch.set(spellbeeRef, {
        ...enhancedSpellbeeData,
        lastUpdated: admin.firestore.Timestamp.now(),
        version: '1.0'
      });

      // Seed Maze data
      const mazeRef = db.collection('gameData').doc('maze');
      batch.set(mazeRef, {
        mazes: staticMazeData,
        lastUpdated: admin.firestore.Timestamp.now(),
        version: '1.0'
      });

      // Seed Bingo data
      const bingoRef = db.collection('gameData').doc('bingo');
      batch.set(bingoRef, {
        bingoCards: staticBingoData,
        lastUpdated: admin.firestore.Timestamp.now(),
        version: '1.0'
      });

      // Seed Grammar data
      const grammarRef = db.collection('gameData').doc('grammar');
      batch.set(grammarRef, {
        topics: staticGrammarData,
        lastUpdated: admin.firestore.Timestamp.now(),
        version: '1.0'
      });

      // Seed Speaking data
      const speakingRef = db.collection('gameData').doc('speaking');
      batch.set(speakingRef, {
        ...staticSpeakingData,
        lastUpdated: admin.firestore.Timestamp.now(),
        version: '1.0'
      });

      // Seed Reading data
      const readingRef = db.collection('gameData').doc('reading');
      batch.set(readingRef, {
        ...staticReadingData,
        lastUpdated: admin.firestore.Timestamp.now(),
        version: '1.0'
      });

      await batch.commit();

      return { success: true, message: 'Game data seeded successfully' };
    } catch (error) {
      console.error('Error seeding game data:', error);
      throw new HttpsError('internal', 'Failed to seed game data');
    }
  }
);