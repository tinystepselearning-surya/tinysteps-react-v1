
export type ReadingPack = {
  id: string;
  title: string;
  level: 1 | 2 | 3; // Simple leveling system to start
  passage: string; // Full text for simple reading
  sentences?: string[]; // Optional: pre-split sentences for fluency practice
  vocabulary?: { word: string; definition: string }[]; // For "New Words" game
  questions?: {
    id: string;
    question: string;
    options: string[];
    correctOptionIndex: number;
  }[]; // For "Comprehension Questions"
  summaryPrompt?: string; // For "Summarize Simply" game
};

export const READING_PACKS: ReadingPack[] = [
  {
    id: "pack-1",
    title: "The Bear's Balloon",
    level: 1,
    passage: "A little bear went to the market. He bought a red balloon. The balloon was big and round. The bear was very happy. He held the balloon tightly and went home.",
    questions: [
      {
        id: "q1",
        question: "Where did the little bear go?",
        options: ["To the park", "To the market", "To the school"],
        correctOptionIndex: 1,
      },
      {
        id: "q2",
        question: "What did the bear buy?",
        options: ["A blue car", "A red balloon", "A yellow hat"],
        correctOptionIndex: 1,
      },
      {
        id: "q3",
        question: "How did the bear feel?",
        options: ["Sad", "Happy", "Angry"],
        correctOptionIndex: 1,
      },
    ],
    vocabulary: [
        {word: "market", definition: "A place where people buy and sell things."},
        {word: "balloon", definition: "A small bag made of thin rubber that is filled with air."}
    ]
  },
  {
    id: "pack-2",
    title: "The Cat and the Dog",
    level: 1,
    passage: "A cat sat on a mat. A dog saw the cat. The dog wagged its tail. The cat and the dog played together. They had a lot of fun.",
    questions: [
      {
        id: "q1",
        question: "Who sat on the mat?",
        options: ["A dog", "A cat", "A mouse"],
        correctOptionIndex: 1,
      },
      {
        id: "q2",
        question: "What did the dog do?",
        options: ["It barked", "It wagged its tail", "It ran away"],
        correctOptionIndex: 1,
      },
      {
        id: "q3",
        question: "Did the cat and dog have fun?",
        options: ["Yes", "No", "Maybe"],
        correctOptionIndex: 0,
      }
    ],
    vocabulary: [
        {word: "mat", definition: "A piece of material placed on a floor."},
        {word: "wagged", definition: "To move from side to side or up and down."}
    ]
  },
  {
    id: "pack-3",
    title: "The Helpful Ant",
    level: 2,
    passage: "An ant was thirsty. He went to a river to drink. He fell in and was carried away. A dove saw the ant. The dove dropped a leaf into the water. The ant climbed on the leaf and was safe.",
    questions: [
        {
            id: "q1",
            question: "Why did the ant go to the river?",
            options: ["To play", "To drink", "To swim"],
            correctOptionIndex: 1
        },
        {
            id: "q2",
            question: "Who helped the ant?",
            options: ["A fish", "A dove", "A frog"],
            correctOptionIndex: 1
        }
    ],
    vocabulary: [
        {word: "thirsty", definition: "Feeling a need to drink."},
        {word: "river", definition: "A large natural stream of water."},
        {word: "leaf", definition: "A flat green part of a plant."}
    ],
    summaryPrompt: "What is the main idea of this story?"
  }
];
