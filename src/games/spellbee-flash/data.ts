/**
 * SpellBee Words Database
 * Enhanced with visual icons, simplified meanings, and phoneme highlights
 */

export interface Word {
  word: string;
  ipa: string;
  meaning: string; // Original meaning
  forms: string;
  example: string;
  icon: string; // Visual emoji for memory hook
  simpleMeaning: string; // Kid-friendly ≤6 words
  phonemeHighlight?: string; // Which part to emphasize
}

export const WORDS: Word[] = [
  // E-words
  {
    word: "Enjoy",
    ipa: "/ɪnˈdʒɔɪ/",
    meaning: "to get happiness out of something",
    simpleMeaning: "to have fun doing something",
    icon: "😊",
    forms: "enjoys, enjoying, enjoyed, enjoyment",
    example: "I enjoy reading books every night.",
    phonemeHighlight: "joy"
  },
  {
    word: "Enough",
    ipa: "/ɪˈnʌf/",
    meaning: "as much as needed",
    simpleMeaning: "all you need",
    icon: "✅",
    forms: "—",
    example: "We have enough food for everyone.",
    phonemeHighlight: "nough"
  },
  {
    word: "Enter",
    ipa: "/ˈɛntər/",
    meaning: "to go into a place",
    simpleMeaning: "to go inside",
    icon: "🚪",
    forms: "enters, entering, entered",
    example: "Please enter the room quietly.",
    phonemeHighlight: "en"
  },
  {
    word: "Entry",
    ipa: "/ˈɛntri/",
    meaning: "a point through which one enters",
    simpleMeaning: "a way to go in",
    icon: "🚪",
    forms: "entries",
    example: "The entry to the building is on the left.",
    phonemeHighlight: "en"
  },
  {
    word: "Equal",
    ipa: "/ˈiːkwəl/",
    meaning: "same in size, value, or amount",
    simpleMeaning: "the same size",
    icon: "⚖️",
    forms: "equals, equalling, equalled, equality",
    example: "Both teams have an equal chance to win.",
    phonemeHighlight: "e"
  },
  {
    word: "Equip",
    ipa: "/ɪˈkwɪp/",
    meaning: "to provide with needed items or skills",
    simpleMeaning: "to give what's needed",
    icon: "🎒",
    forms: "equips, equipping, equipped, equipment",
    example: "The school will equip students with new tablets.",
    phonemeHighlight: "quip"
  },
  {
    word: "Err",
    ipa: "/ɜːr/",
    meaning: "to make a mistake",
    simpleMeaning: "to make a mistake",
    icon: "❌",
    forms: "errs, erred, erring, error",
    example: "To err is human, to forgive divine.",
    phonemeHighlight: "err"
  },
  {
    word: "Ever",
    ipa: "/ˈɛvər/",
    meaning: "at all times, always",
    simpleMeaning: "always, any time",
    icon: "♾️",
    forms: "—",
    example: "Have you ever been to the zoo?",
    phonemeHighlight: "ev"
  },
  {
    word: "Everybody",
    ipa: "/ˈevribɒdi/",
    meaning: "every single person",
    simpleMeaning: "all people",
    icon: "👥",
    forms: "—",
    example: "Everybody loves a good story.",
    phonemeHighlight: "body"
  },
  {
    word: "Evict",
    ipa: "/ɪˈvɪkt/",
    meaning: "to force someone to leave a place",
    simpleMeaning: "to make someone leave",
    icon: "🚫",
    forms: "evicts, evicting, evicted, eviction",
    example: "The landlord had to evict the tenant.",
    phonemeHighlight: "vict"
  },
  {
    word: "Eyeball",
    ipa: "/ˈaɪbɔːl/",
    meaning: "the round part of your eye",
    simpleMeaning: "the round part of eye",
    icon: "👁️",
    forms: "eyeballs",
    example: "The doctor checked my eyeball with a light.",
    phonemeHighlight: "eye"
  },
  {
    word: "Extra",
    ipa: "/ˈɛkstrə/",
    meaning: "more than usual",
    simpleMeaning: "more than usual",
    icon: "➕",
    forms: "extras",
    example: "I ordered extra cheese on my pizza.",
    phonemeHighlight: "ex"
  },
  {
    word: "Ewe",
    ipa: "/juː/",
    meaning: "a female sheep",
    simpleMeaning: "a girl sheep",
    icon: "🐑",
    forms: "ewes",
    example: "The ewe was grazing in the field.",
    phonemeHighlight: "ewe"
  },

  // F-words
  {
    word: "Face",
    ipa: "/feɪs/",
    meaning: "the front of your head",
    simpleMeaning: "front of your head",
    icon: "😀",
    forms: "faces, facing, faced",
    example: "She has a beautiful smiling face.",
    phonemeHighlight: "face"
  },
  {
    word: "Fact",
    ipa: "/fækt/",
    meaning: "something that is true",
    simpleMeaning: "something that is true",
    icon: "📌",
    forms: "—",
    example: "It's a fact that the Earth is round.",
    phonemeHighlight: "fact"
  },
  {
    word: "Fail",
    ipa: "/feɪl/",
    meaning: "to not succeed",
    simpleMeaning: "to not succeed",
    icon: "😔",
    forms: "fails, failing, failed, failure",
    example: "Don't be afraid to fail; it helps you learn.",
    phonemeHighlight: "fail"
  },
  {
    word: "Fair",
    ipa: "/feə(r)/",
    meaning: "treating everyone equally; (n) big fun event",
    simpleMeaning: "being nice to everyone",
    icon: "🎪",
    forms: "fairs, fairer, fairest, fairness",
    example: "The teacher is always fair to all students.",
    phonemeHighlight: "fair"
  },
  {
    word: "Fable",
    ipa: "/ˈfeɪbəl/",
    meaning: "a short story with a moral",
    simpleMeaning: "a teaching story",
    icon: "📖",
    forms: "fables, fabled",
    example: "We read a fable about a clever fox.",
    phonemeHighlight: "fa"
  },

  // Fl-words
  {
    word: "Flame",
    ipa: "/fleɪm/",
    meaning: "the hot, glowing part of fire",
    simpleMeaning: "bright hot fire",
    icon: "🔥",
    forms: "flames, flaming, flamed, flammable",
    example: "The candle flame flickered in the wind.",
    phonemeHighlight: "flame"
  },
  {
    word: "Flap",
    ipa: "/flæp/",
    meaning: "to move up and down like wings",
    simpleMeaning: "to move like wings",
    icon: "🦅",
    forms: "flaps, flapping, flapped",
    example: "The bird began to flap its wings.",
    phonemeHighlight: "flap"
  },
  {
    word: "Flat",
    ipa: "/flæt/",
    meaning: "having a smooth even surface",
    simpleMeaning: "smooth and even",
    icon: "📏",
    forms: "flatter, flattest, flatly, flatness",
    example: "The table has a flat surface.",
    phonemeHighlight: "flat"
  },
  {
    word: "Flaw",
    ipa: "/flɔː/",
    meaning: "a mistake or weakness",
    simpleMeaning: "a mistake or problem",
    icon: "❗",
    forms: "flaws, flawed",
    example: "The plan has one major flaw.",
    phonemeHighlight: "flaw"
  },
  {
    word: "Flight",
    ipa: "/flaɪt/",
    meaning: "a journey in an aircraft",
    simpleMeaning: "a trip on plane",
    icon: "✈️",
    forms: "flights, flighted, flighting",
    example: "Our flight to Paris leaves at noon.",
    phonemeHighlight: "flight"
  },
  {
    word: "Float",
    ipa: "/floʊt/",
    meaning: "to move on water without sinking",
    simpleMeaning: "to stay on water",
    icon: "🛟",
    forms: "floats, floating, floated, floatable",
    example: "The boat will float on the lake.",
    phonemeHighlight: "float"
  },
  {
    word: "Flock",
    ipa: "/flɒk/",
    meaning: "group of birds, sheep or goats",
    simpleMeaning: "a group of birds",
    icon: "🐦",
    forms: "flocks, flocking, flocked",
    example: "A flock of birds flew across the sky.",
    phonemeHighlight: "flock"
  },
  {
    word: "Flood",
    ipa: "/flʌd/",
    meaning: "overflow of large amounts of water",
    simpleMeaning: "too much water everywhere",
    icon: "🌊",
    forms: "floods, flooding, flooded, floodable",
    example: "Heavy rain caused a flood in the town.",
    phonemeHighlight: "flood"
  },
  {
    word: "Floor",
    ipa: "/flɔːr/",
    meaning: "ground surface of a room",
    simpleMeaning: "ground you walk on",
    icon: "🏠",
    forms: "floors, flooring, floored",
    example: "Please don't walk on the wet floor.",
    phonemeHighlight: "floor"
  },
  {
    word: "Flop",
    ipa: "/flɒp/",
    meaning: "a complete failure",
    simpleMeaning: "a big failure",
    icon: "💔",
    forms: "flops, flopping, flopped",
    example: "The movie was a total flop.",
    phonemeHighlight: "flop"
  },

  // Fo-words
  {
    word: "Folder",
    ipa: "/ˈfoʊldər/",
    meaning: "a file for keeping sheets of paper",
    simpleMeaning: "a paper holder",
    icon: "📁",
    forms: "folders",
    example: "Keep your homework in this folder.",
    phonemeHighlight: "fold"
  },
  {
    word: "Folk",
    ipa: "/foʊk/",
    meaning: "people in general or of a group",
    simpleMeaning: "people, a group",
    icon: "👨‍👩‍👧‍👦",
    forms: "folks, folksy, folklore",
    example: "The folk in this village are very friendly.",
    phonemeHighlight: "folk"
  },

  // Foo-words
  {
    word: "Food",
    ipa: "/fuːd/",
    meaning: "anything nutritious that people/animals eat",
    simpleMeaning: "things we eat",
    icon: "🍎",
    forms: "foods",
    example: "We need food and water to survive.",
    phonemeHighlight: "food"
  },
  {
    word: "Footpath",
    ipa: "/ˈfʊtpɑːθ/",
    meaning: "a path used mainly for walking",
    simpleMeaning: "a path for walking",
    icon: "🚶",
    forms: "footpaths",
    example: "Let's walk along the footpath in the park.",
    phonemeHighlight: "foot"
  },
  {
    word: "Forearm",
    ipa: "/ˈfɔːr.ɑːrm/",
    meaning: "part of the arm from elbow to wrist",
    simpleMeaning: "arm from elbow to wrist",
    icon: "💪",
    forms: "forearms",
    example: "He has a tattoo on his forearm.",
    phonemeHighlight: "fore"
  },
  {
    word: "Forehead",
    ipa: "/ˈfɔːrhed/",
    meaning: "upper face between eyebrows and hair",
    simpleMeaning: "top part of face",
    icon: "🧑",
    forms: "foreheads",
    example: "She wiped the sweat from her forehead.",
    phonemeHighlight: "fore"
  },

  // Fun/Fu-words
  {
    word: "Fun",
    ipa: "/fʌn/",
    meaning: "pleasure or enjoyment",
    simpleMeaning: "joy and play",
    icon: "🎉",
    forms: "funny, funniest, funnier",
    example: "We had so much fun at the party.",
    phonemeHighlight: "fun"
  },
  {
    word: "Fund",
    ipa: "/fʌnd/",
    meaning: "a sum of money",
    simpleMeaning: "some money saved",
    icon: "💰",
    forms: "funds, funding, funded",
    example: "They need to raise funds for the trip.",
    phonemeHighlight: "fund"
  },
  {
    word: "Fur",
    ipa: "/fɜːr/",
    meaning: "thick hair covering animals",
    simpleMeaning: "animal's thick hair",
    icon: "🐻",
    forms: "furs, furred, furry",
    example: "The cat's fur is soft and fluffy.",
    phonemeHighlight: "fur"
  },

  // Fr-words
  {
    word: "Friend",
    ipa: "/frɛnd/",
    meaning: "person one likes and enjoys being with",
    simpleMeaning: "someone you like",
    icon: "🤝",
    forms: "friends, friendly, friendliest",
    example: "She is my best friend from school.",
    phonemeHighlight: "friend"
  },
  {
    word: "Frill",
    ipa: "/frɪl/",
    meaning: "decoration with small folds of cloth",
    simpleMeaning: "fancy cloth decoration",
    icon: "🎀",
    forms: "frills, frilly",
    example: "The dress has frills around the collar.",
    phonemeHighlight: "frill"
  },
  {
    word: "Frock",
    ipa: "/frɒk/",
    meaning: "dress worn by girls",
    simpleMeaning: "a girl's dress",
    icon: "👗",
    forms: "frocks, frocking, frocked",
    example: "She wore a pretty pink frock to the party.",
    phonemeHighlight: "frock"
  },
  {
    word: "Front",
    ipa: "/frʌnt/",
    meaning: "the surface facing forward",
    simpleMeaning: "the part facing you",
    icon: "⬆️",
    forms: "fronts, fronting, fronted",
    example: "Please sit at the front of the class.",
    phonemeHighlight: "front"
  },

  // Fruit
  {
    word: "Fruit",
    ipa: "/fruːt/",
    meaning: "seed-bearing fleshy part of a plant",
    simpleMeaning: "sweet food from plants",
    icon: "🍓",
    forms: "fruits, fruity, fruited",
    example: "Apples and oranges are my favorite fruits.",
    phonemeHighlight: "fruit"
  },

  // Fry
  {
    word: "Fry",
    ipa: "/fraɪ/",
    meaning: "to cook in hot oil",
    simpleMeaning: "to cook in oil",
    icon: "🍳",
    forms: "fries, frying, fried",
    example: "Mom will fry some eggs for breakfast.",
    phonemeHighlight: "fry"
  },
  {
    word: "Fuel",
    ipa: "/fjuːəl/",
    meaning: "substance used for heat/energy",
    simpleMeaning: "stuff that makes energy",
    icon: "⛽",
    forms: "fuels, fueling, fueled",
    example: "Cars need fuel to run.",
    phonemeHighlight: "fuel"
  },
  {
    word: "Few",
    ipa: "/fjuː/",
    meaning: "a small number",
    simpleMeaning: "not many",
    icon: "🔢",
    forms: "fewer, fewest, fewness",
    example: "Only a few people came to the meeting.",
    phonemeHighlight: "few"
  },
  {
    word: "Fence",
    ipa: "/fɛns/",
    meaning: "a wall that encloses an area",
    simpleMeaning: "a wall around area",
    icon: "🚧",
    forms: "fences, fencing, fenced",
    example: "There's a wooden fence around our garden.",
    phonemeHighlight: "fence"
  },
  {
    word: "Feet",
    ipa: "/fiːt/",
    meaning: "plural of foot",
    simpleMeaning: "more than one foot",
    icon: "👣",
    forms: "—",
    example: "I can stand on my own two feet.",
    phonemeHighlight: "feet"
  },
  {
    word: "Feel",
    ipa: "/fiːl/",
    meaning: "to touch/experience emotion",
    simpleMeaning: "to touch or sense",
    icon: "✋",
    forms: "feels, feeling, felt",
    example: "I feel happy when I play with friends.",
    phonemeHighlight: "feel"
  },
  {
    word: "Feed",
    ipa: "/fiːd/",
    meaning: "to give food",
    simpleMeaning: "to give food",
    icon: "🍽️",
    forms: "feeds, feeding, fed",
    example: "Don't forget to feed the dog.",
    phonemeHighlight: "feed"
  },
  {
    word: "Feast",
    ipa: "/fiːst/",
    meaning: "a large special meal",
    simpleMeaning: "a big special meal",
    icon: "🍗",
    forms: "feasts, feasting, feasted",
    example: "We had a feast on Thanksgiving Day.",
    phonemeHighlight: "feast"
  },
  {
    word: "Fever",
    ipa: "/ˈfiːvər/",
    meaning: "illness with high temperature",
    simpleMeaning: "being very hot sick",
    icon: "🤒",
    forms: "fevers, feverish, feverishly",
    example: "He stayed home because he had a fever.",
    phonemeHighlight: "fev"
  },
  {
    word: "Fig",
    ipa: "/fɪɡ/",
    meaning: "soft fruit with seeds",
    simpleMeaning: "a sweet soft fruit",
    icon: "🫐",
    forms: "figs",
    example: "Fresh figs are sweet and delicious.",
    phonemeHighlight: "fig"
  },
  {
    word: "Fight",
    ipa: "/faɪt/",
    meaning: "attack between individuals/groups",
    simpleMeaning: "when people hurt each other",
    icon: "🥊",
    forms: "fights, fighting, fought, fighter",
    example: "The two boys had a fight over a toy.",
    phonemeHighlight: "fight"
  },
];
