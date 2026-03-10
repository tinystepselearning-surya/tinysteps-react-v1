
export type ReadingPack = {
  id: string;
  title: string;
  level: 1 | 2 | 3; // Simple leveling system
  passage: string; // Full text
  sentences?: string[]; // Optional: sentence-split version for fluency practice
  tags?: string[]; // e.g., ['animals', 'friends']
  // Vocabulary entries used by Stage 4 "New Words from Reading"
  vocabulary?: {
    word: string;
    definition: string;
    partOfSpeech?: string;
    example?: string; // optional example sentence showing the word in context
  }[];
  // Comprehension questions used by Stage 4 Comprehension game
  questions?: {
    id: string;
    question: string;
    options: string[];
    correctOptionIndex: number;
    rationale?: string; // short explanation for teacher-facing notes (optional)
  }[];
  // Short prompt for summary or 'tell me in your own words' activities
  summaryPrompt?: string;
  // Lightweight practice exercises (optional) — keeps model extensible
  practiceExercises?: {
    id: string;
    type: 'sentence-context' | 'match' | 'fill-blank';
    prompt: string;
    options?: string[]; // for match/fill
    answerIndex?: number;
  }[];
};

export const READING_PACKS: ReadingPack[] = [
  {
    id: 'pack-1',
    title: "The Bear's Balloon",
    level: 1,
    tags: ['animals', 'feelings'],
    passage:
      'A little bear went to the market. He bought a red balloon. The balloon was big and round. The bear was very happy. He held the balloon tightly and went home.',
    sentences: [
      'A little bear went to the market.',
      'He bought a red balloon.',
      'The balloon was big and round.',
      'The bear was very happy.',
      'He held the balloon tightly and went home.',
    ],
    questions: [
      {
        id: 'p1-q1',
        question: 'Where did the little bear go?',
        options: ['To the park', 'To the market', 'To school'],
        correctOptionIndex: 1,
        rationale: 'The story starts with the bear going to the market.',
      },
      {
        id: 'p1-q2',
        question: 'What did the bear buy?',
        options: ['A blue car', 'A red balloon', 'A yellow hat'],
        correctOptionIndex: 1,
      },
      {
        id: 'p1-q3',
        question: 'How did the bear feel at the end?',
        options: ['Sad', 'Angry', 'Happy'],
        correctOptionIndex: 2,
      },
      {
        id: 'p1-q4',
        question: 'Which word means "held tightly"?',
        options: ['released', 'grasped', 'let go'],
        correctOptionIndex: 1,
      },
    ],
    vocabulary: [
      { word: 'market', definition: 'A place where people buy and sell things.', partOfSpeech: 'noun', example: 'We walked to the market to buy fruit.' },
      { word: 'balloon', definition: 'A bag made of thin rubber that can be filled with air.', partOfSpeech: 'noun', example: 'The balloon flew up into the sky.' },
      { word: 'tightly', definition: 'Firmly so something does not come loose.', partOfSpeech: 'adverb', example: 'She held the rope tightly.' },
    ],
    summaryPrompt: 'Tell the story of the bear and his balloon in one sentence.',
    practiceExercises: [
      { id: 'p1-ex1', type: 'match', prompt: 'Match the word to its meaning.', options: ['market', 'balloon', 'tightly'], answerIndex: 0 },
    ],
  },

  {
    id: 'pack-2',
    title: 'The Cat and the Dog',
    level: 1,
    tags: ['animals', 'play'],
    passage:
      'A cat sat on a mat. A dog saw the cat and wagged its tail. The cat and the dog played together and had a lot of fun.',
    sentences: ['A cat sat on a mat.', 'A dog saw the cat.', 'They played together and had fun.'],
    questions: [
      { id: 'p2-q1', question: 'Who sat on the mat?', options: ['A dog', 'A cat', 'A mouse'], correctOptionIndex: 1 },
      { id: 'p2-q2', question: 'What did the dog do?', options: ['It wagged its tail', 'It slept', 'It ran away'], correctOptionIndex: 0 },
      { id: 'p2-q3', question: 'Did the cat and dog have fun?', options: ['Yes', 'No', 'Maybe'], correctOptionIndex: 0 },
    ],
    vocabulary: [
      { word: 'mat', definition: 'A small piece of material placed on the floor.', partOfSpeech: 'noun', example: 'She wiped her feet on the mat.' },
      { word: 'wagged', definition: 'Moved back and forth (usually a tail).', partOfSpeech: 'verb', example: 'The dog wagged its tail happily.' },
      { word: 'played', definition: 'Had fun doing games or activities.', partOfSpeech: 'verb', example: 'They played in the yard.' },
    ],
  },

  {
    id: 'pack-3',
    title: 'The Helpful Ant',
    level: 2,
    tags: ['animals', 'kindness'],
    passage:
      'An ant was thirsty and went to a river to drink. He slipped and fell into the water. A dove saw the ant and dropped a leaf into the water. The ant climbed onto the leaf and floated to the shore. The ant was safe thanks to the dove.',
    sentences: [
      'An ant was thirsty.',
      'He slipped and fell into the water.',
      'A dove dropped a leaf into the water.',
      'The ant climbed onto the leaf and was safe.',
    ],
    questions: [
      { id: 'p3-q1', question: 'Why did the ant go to the river?', options: ['To play', 'To drink', 'To swim'], correctOptionIndex: 1 },
      { id: 'p3-q2', question: 'Who helped the ant?', options: ['A fish', 'A dove', 'A frog'], correctOptionIndex: 1 },
      { id: 'p3-q3', question: 'What did the dove drop?', options: ['A leaf', 'A stone', 'A stick'], correctOptionIndex: 0 },
      { id: 'p3-q4', question: 'What is the main idea?', options: ['Ants are loud', 'Kindness helps others', 'Doves fly fast'], correctOptionIndex: 1 },
    ],
    vocabulary: [
      { word: 'thirsty', definition: 'Needing or wanting to drink.', partOfSpeech: 'adjective', example: 'After running, she felt thirsty.' },
      { word: 'river', definition: 'A large natural stream of water.', partOfSpeech: 'noun', example: 'The river was wide and fast.' },
      { word: 'leaf', definition: 'A flat green part of a plant.', partOfSpeech: 'noun', example: 'A leaf fell from the tree.' },
    ],
    summaryPrompt: 'What happened to the ant and who helped?',
  },

  {
    id: 'pack-4',
    title: 'Mina and the Moonlight',
    level: 2,
    tags: ['night', 'adventure'],
    passage:
      'Mina walked home under the bright moon. She saw fireflies dancing in the garden. The moonlight made the pond shine. Mina sat and watched the lights until it was time to sleep.',
    sentences: ['Mina walked home under the moon.', 'She saw fireflies.', 'The pond shone with moonlight.', 'Mina watched the lights.'],
    questions: [
      { id: 'p4-q1', question: 'What did Mina see in the garden?', options: ['Stars', 'Fireflies', 'Cars'], correctOptionIndex: 1 },
      { id: 'p4-q2', question: 'What made the pond shine?', options: ['Sunlight', 'Moonlight', 'Lamp light'], correctOptionIndex: 1 },
    ],
    vocabulary: [
      { word: 'moonlight', definition: 'Light that comes from the moon.', partOfSpeech: 'noun', example: 'Moonlight lit the path.' },
      { word: 'firefly', definition: 'A small insect that lights up at night.', partOfSpeech: 'noun', example: 'A firefly blinked near the flower.' },
    ],
  },

  {
    id: 'pack-5',
    title: 'The Little Garden',
    level: 1,
    tags: ['plants', 'care'],
    passage:
      'Tia planted seeds in a small garden. Every day she watered them and watched for sprouts. Soon green shoots appeared and little flowers opened. Tia was proud of her garden.',
    sentences: ['Tia planted seeds.', 'She watered them every day.', 'Green shoots appeared.', 'Flowers opened.'],
    questions: [
      { id: 'p5-q1', question: 'What did Tia plant?', options: ['Seeds', 'Stones', 'Toys'], correctOptionIndex: 0 },
      { id: 'p5-q2', question: 'What did she do every day?', options: ['Played games', 'Watered the plants', 'Slept'], correctOptionIndex: 1 },
    ],
    vocabulary: [
      { word: 'seed', definition: 'A small thing planted to grow a plant.', partOfSpeech: 'noun', example: 'The seed will grow into a plant.' },
      { word: 'sprout', definition: 'A young shoot that grows from a seed.', partOfSpeech: 'noun', example: 'A sprout poked out of the soil.' },
      { word: 'garden', definition: 'A place where plants are grown.', partOfSpeech: 'noun', example: 'They planted flowers in the garden.' },
    ],
  },

  {
    id: 'pack-6',
    title: 'The Rainy Day Surprise',
    level: 2,
    tags: ['weather', 'friends'],
    passage:
      'On a rainy day, the children stayed inside and told stories. They looked out the window and saw big puddles on the road. After the rain, a bright rainbow appeared and they all smiled.',
    sentences: ['It was a rainy day.', 'Children stayed inside and told stories.', 'A rainbow appeared after the rain.'],
    questions: [
      { id: 'p6-q1', question: 'What did the children see after the rain?', options: ['A rainbow', 'A storm', 'Snow'], correctOptionIndex: 0 },
      { id: 'p6-q2', question: 'Where were the puddles?', options: ['In the sky', 'On the road', 'On the roof'], correctOptionIndex: 1 },
    ],
    vocabulary: [
      { word: 'puddle', definition: 'A small pool of water on the ground.', partOfSpeech: 'noun', example: 'She jumped in the puddle.' },
      { word: 'rainbow', definition: 'A curved band of colored light in the sky after rain.', partOfSpeech: 'noun', example: 'They saw a rainbow after the storm.' },
      { word: 'surprise', definition: 'Something that is not expected.', partOfSpeech: 'noun', example: 'They had a surprise party.' },
    ],
    summaryPrompt: 'Describe the surprise the children saw after the rain.',
  },

  {
    id: 'pack-7',
    title: 'The Busy Bee',
    level: 3,
    tags: ['nature', 'work'],
    passage:
      'A bee flew from flower to flower collecting nectar. It worked hard all day and returned to the hive with sweet food. The bee helped the flowers by moving pollen as it moved.',
    sentences: ['A bee flew from flower to flower.', 'It collected nectar and returned to the hive.', 'The bee helped flowers by moving pollen.'],
    questions: [
      { id: 'p7-q1', question: 'What does the bee collect?', options: ['Water', 'Nectar', 'Leaves'], correctOptionIndex: 1 },
      { id: 'p7-q2', question: 'Where does the bee return to?', options: ['The tree', 'The hive', 'The pond'], correctOptionIndex: 1 },
      { id: 'p7-q3', question: 'How does the bee help flowers?', options: ['By watering them', 'By moving pollen', 'By cutting leaves'], correctOptionIndex: 1 },
    ],
    vocabulary: [
      { word: 'nectar', definition: 'A sweet liquid found in flowers.', partOfSpeech: 'noun', example: 'Bees drink nectar from flowers.' },
      { word: 'hive', definition: 'The place where bees live.', partOfSpeech: 'noun', example: 'The bee flew back to the hive.' },
      { word: 'pollen', definition: 'A fine dust from flowers used to help plants make seeds.', partOfSpeech: 'noun', example: 'Pollen moved from one flower to another.' },
    ],
    summaryPrompt: 'Explain how bees help flowers in one sentence.',
  },

  {
    id: 'pack-8',
    title: 'A Day at the Pond',
    level: 2,
    tags: ['animals', 'water'],
    passage:
      'The children went to the pond to feed the ducks. The ducks quacked and swam in circles. A frog jumped on a rock and croaked. The children laughed and shared their bread with the birds.',
    sentences: ['Children went to the pond.', 'They fed the ducks.', 'A frog jumped and croaked.'],
    questions: [
      { id: 'p8-q1', question: 'Who did the children feed?', options: ['Ducks', 'Cats', 'Cows'], correctOptionIndex: 0 },
      { id: 'p8-q2', question: 'What did the frog do?', options: ['Sang', 'Jumped on a rock', 'Flew away'], correctOptionIndex: 1 },
    ],
    vocabulary: [
      { word: 'duck', definition: 'A water bird with a short beak.', partOfSpeech: 'noun', example: 'The duck swam in the pond.' },
      { word: 'croak', definition: 'The sound a frog makes.', partOfSpeech: 'verb', example: 'The frog croaked loudly.' },
      { word: 'bread', definition: 'A common food made from flour and water.', partOfSpeech: 'noun', example: 'They shared their bread.' },
    ],
  },
];
