/**
 * Boss Level Data
 * 
 * TODO: Wire to shared WORDS from spellbee-flash/data.ts
 * For now using 24 sample entries for development
 */

export interface WordEntry {
  id: string;
  word: string;
  ipa: string;
  meaning: string;
  example: string;
  forms: string[];
}

// Sample dataset for boss level (24 words covering diverse phonemes)
export const WORDS: WordEntry[] = [
  { id: "w1", word: "cat", ipa: "/kæt/", meaning: "A small furry pet animal", example: "The cat sleeps on the mat.", forms: ["cats"] },
  { id: "w2", word: "dog", ipa: "/dɔɡ/", meaning: "A friendly pet that barks", example: "The dog plays in the yard.", forms: ["dogs"] },
  { id: "w3", word: "sun", ipa: "/sʌn/", meaning: "The bright star in the sky", example: "The sun shines during the day.", forms: ["suns"] },
  { id: "w4", word: "tree", ipa: "/triː/", meaning: "A tall plant with branches", example: "Birds nest in the tree.", forms: ["trees"] },
  { id: "w5", word: "fish", ipa: "/fɪʃ/", meaning: "An animal that swims in water", example: "The fish lives in the sea.", forms: ["fish", "fishes"] },
  { id: "w6", word: "ball", ipa: "/bɔːl/", meaning: "A round toy you can throw", example: "Let's play with the ball.", forms: ["balls"] },
  { id: "w7", word: "book", ipa: "/bʊk/", meaning: "Pages with stories or facts", example: "I read a book before bed.", forms: ["books"] },
  { id: "w8", word: "rain", ipa: "/reɪn/", meaning: "Water falling from clouds", example: "The rain makes puddles.", forms: ["rains"] },
  { id: "w9", word: "moon", ipa: "/muːn/", meaning: "The bright circle in the night sky", example: "The moon glows at night.", forms: ["moons"] },
  { id: "w10", word: "ship", ipa: "/ʃɪp/", meaning: "A big boat that sails", example: "The ship crosses the ocean.", forms: ["ships"] },
  { id: "w11", word: "star", ipa: "/stɑːr/", meaning: "A tiny light in the night sky", example: "I see a star twinkling.", forms: ["stars"] },
  { id: "w12", word: "bird", ipa: "/bɜːrd/", meaning: "An animal with wings that flies", example: "The bird sings sweetly.", forms: ["birds"] },
  { id: "w13", word: "frog", ipa: "/frɔɡ/", meaning: "A green animal that jumps and croaks", example: "The frog hops near the pond.", forms: ["frogs"] },
  { id: "w14", word: "cake", ipa: "/keɪk/", meaning: "A sweet dessert for parties", example: "We eat cake on birthdays.", forms: ["cakes"] },
  { id: "w15", word: "shoe", ipa: "/ʃuː/", meaning: "What you wear on your feet", example: "I tie my shoe before walking.", forms: ["shoes"] },
  { id: "w16", word: "chair", ipa: "/tʃeər/", meaning: "Furniture you sit on", example: "Sit on the chair at the table.", forms: ["chairs"] },
  { id: "w17", word: "light", ipa: "/laɪt/", meaning: "Brightness that helps you see", example: "Turn on the light please.", forms: ["lights"] },
  { id: "w18", word: "house", ipa: "/haʊs/", meaning: "A building where people live", example: "My house has a red door.", forms: ["houses"] },
  { id: "w19", word: "flower", ipa: "/ˈflaʊər/", meaning: "A pretty plant with colorful petals", example: "The flower smells nice.", forms: ["flowers"] },
  { id: "w20", word: "cloud", ipa: "/klaʊd/", meaning: "A fluffy white thing in the sky", example: "The cloud looks like a sheep.", forms: ["clouds"] },
  { id: "w21", word: "snake", ipa: "/sneɪk/", meaning: "A long animal with no legs", example: "The snake slithers on the ground.", forms: ["snakes"] },
  { id: "w22", word: "juice", ipa: "/dʒuːs/", meaning: "A sweet drink from fruits", example: "I drink orange juice.", forms: ["juices"] },
  { id: "w23", word: "train", ipa: "/treɪn/", meaning: "A vehicle that runs on tracks", example: "The train goes fast.", forms: ["trains"] },
  { id: "w24", word: "apple", ipa: "/ˈæpəl/", meaning: "A round red or green fruit", example: "An apple a day is healthy.", forms: ["apples"] },
];

// Phoneme groups for minimal pair generation
export const PHONEME_GROUPS: Record<string, string[]> = {
  "æ": ["/kæt/", "/bæt/", "/hæt/", "/mæt/"],
  "eɪ": ["/keɪk/", "/meɪk/", "/leɪk/", "/reɪn/"],
  "iː": ["/triː/", "/siː/", "/biː/", "/kiː/"],
  "ɔː": ["/bɔːl/", "/tɔːl/", "/kɔːl/", "/wɔːl/"],
  "aʊ": ["/haʊs/", "/maʊs/", "/kaʊ/", "/naʊ/"],
  "ʃ": ["/ʃɪp/", "/ʃuː/", "/fɪʃ/", "/dɪʃ/"],
};
