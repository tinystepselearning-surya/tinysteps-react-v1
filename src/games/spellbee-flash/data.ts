/**
 * SpellBee Words Database
 * Contains words with IPA, meanings, forms, and example sentences
 */

export interface Word {
  word: string;
  ipa: string;
  meaning: string;
  forms: string;
  example: string;
}

export const WORDS: Word[] = [
  // E-words
  {
    word: "Enjoy",
    ipa: "/ɪnˈdʒɔɪ/",
    meaning: "to get happiness out of something",
    forms: "enjoys, enjoying, enjoyed, enjoyment",
    example: "I enjoy reading books every night.",
  },
  {
    word: "Enough",
    ipa: "/ɪˈnʌf/",
    meaning: "as much as needed",
    forms: "—",
    example: "We have enough food for everyone.",
  },
  {
    word: "Enter",
    ipa: "/ˈɛntər/",
    meaning: "to go into a place",
    forms: "enters, entering, entered",
    example: "Please enter the room quietly.",
  },
  {
    word: "Entry",
    ipa: "/ˈɛntri/",
    meaning: "a point through which one enters",
    forms: "entries",
    example: "The entry to the building is on the left.",
  },
  {
    word: "Equal",
    ipa: "/ˈiːkwəl/",
    meaning: "same in size, value, or amount",
    forms: "equals, equalling, equalled, equality",
    example: "Both teams have an equal chance to win.",
  },
  {
    word: "Equip",
    ipa: "/ɪˈkwɪp/",
    meaning: "to provide with needed items or skills",
    forms: "equips, equipping, equipped, equipment",
    example: "The school will equip students with new tablets.",
  },
  {
    word: "Err",
    ipa: "/ɜːr/",
    meaning: "to make a mistake",
    forms: "errs, erred, erring, error",
    example: "To err is human, to forgive divine.",
  },
  {
    word: "Ever",
    ipa: "/ˈɛvər/",
    meaning: "at all times, always",
    forms: "—",
    example: "Have you ever been to the zoo?",
  },
  {
    word: "Everybody",
    ipa: "/ˈevribɒdi/",
    meaning: "every single person",
    forms: "—",
    example: "Everybody loves a good story.",
  },
  {
    word: "Evict",
    ipa: "/ɪˈvɪkt/",
    meaning: "to force someone to leave a place",
    forms: "evicts, evicting, evicted, eviction",
    example: "The landlord had to evict the tenant.",
  },
  {
    word: "Eyeball",
    ipa: "/ˈaɪbɔːl/",
    meaning: "the round part of your eye",
    forms: "eyeballs",
    example: "The doctor checked my eyeball with a light.",
  },
  {
    word: "Extra",
    ipa: "/ˈɛkstrə/",
    meaning: "more than usual",
    forms: "extras",
    example: "I ordered extra cheese on my pizza.",
  },
  {
    word: "Ewe",
    ipa: "/juː/",
    meaning: "a female sheep",
    forms: "ewes",
    example: "The ewe was grazing in the field.",
  },

  // F-words
  {
    word: "Face",
    ipa: "/feɪs/",
    meaning: "the front of your head",
    forms: "faces, facing, faced",
    example: "She has a beautiful smiling face.",
  },
  {
    word: "Fact",
    ipa: "/fækt/",
    meaning: "something that is true",
    forms: "—",
    example: "It's a fact that the Earth is round.",
  },
  {
    word: "Fail",
    ipa: "/feɪl/",
    meaning: "to not succeed",
    forms: "fails, failing, failed, failure",
    example: "Don't be afraid to fail; it helps you learn.",
  },
  {
    word: "Fair",
    ipa: "/feə(r)/",
    meaning: "treating everyone equally; (n) big fun event",
    forms: "fairs, fairer, fairest, fairness",
    example: "The teacher is always fair to all students.",
  },
  {
    word: "Fable",
    ipa: "/ˈfeɪbəl/",
    meaning: "a short story with a moral",
    forms: "fables, fabled",
    example: "We read a fable about a clever fox.",
  },

  // Fl-words
  {
    word: "Flame",
    ipa: "/fleɪm/",
    meaning: "the hot, glowing part of fire",
    forms: "flames, flaming, flamed, flammable",
    example: "The candle flame flickered in the wind.",
  },
  {
    word: "Flap",
    ipa: "/flæp/",
    meaning: "to move up and down like wings",
    forms: "flaps, flapping, flapped",
    example: "The bird began to flap its wings.",
  },
  {
    word: "Flat",
    ipa: "/flæt/",
    meaning: "having a smooth even surface",
    forms: "flatter, flattest, flatly, flatness",
    example: "The table has a flat surface.",
  },
  {
    word: "Flaw",
    ipa: "/flɔː/",
    meaning: "a mistake or weakness",
    forms: "flaws, flawed",
    example: "The plan has one major flaw.",
  },
  {
    word: "Flight",
    ipa: "/flaɪt/",
    meaning: "a journey in an aircraft",
    forms: "flights, flighted, flighting",
    example: "Our flight to Paris leaves at noon.",
  },
  {
    word: "Float",
    ipa: "/floʊt/",
    meaning: "to move on water without sinking",
    forms: "floats, floating, floated, floatable",
    example: "The boat will float on the lake.",
  },
  {
    word: "Flock",
    ipa: "/flɒk/",
    meaning: "group of birds, sheep or goats",
    forms: "flocks, flocking, flocked",
    example: "A flock of birds flew across the sky.",
  },
  {
    word: "Flood",
    ipa: "/flʌd/",
    meaning: "overflow of large amounts of water",
    forms: "floods, flooding, flooded, floodable",
    example: "Heavy rain caused a flood in the town.",
  },
  {
    word: "Floor",
    ipa: "/flɔːr/",
    meaning: "ground surface of a room",
    forms: "floors, flooring, floored",
    example: "Please don't walk on the wet floor.",
  },
  {
    word: "Flop",
    ipa: "/flɒp/",
    meaning: "a complete failure",
    forms: "flops, flopping, flopped",
    example: "The movie was a total flop.",
  },

  // Fo-words
  {
    word: "Folder",
    ipa: "/ˈfoʊldər/",
    meaning: "a file for keeping sheets of paper",
    forms: "folders",
    example: "Keep your homework in this folder.",
  },
  {
    word: "Folk",
    ipa: "/foʊk/",
    meaning: "people in general or of a group",
    forms: "folks, folksy, folklore",
    example: "The folk in this village are very friendly.",
  },

  // Foo-words
  {
    word: "Food",
    ipa: "/fuːd/",
    meaning: "anything nutritious that people/animals eat",
    forms: "foods",
    example: "We need food and water to survive.",
  },
  {
    word: "Footpath",
    ipa: "/ˈfʊtpɑːθ/",
    meaning: "a path used mainly for walking",
    forms: "footpaths",
    example: "Let's walk along the footpath in the park.",
  },
  {
    word: "Forearm",
    ipa: "/ˈfɔːr.ɑːrm/",
    meaning: "part of the arm from elbow to wrist",
    forms: "forearms",
    example: "He has a tattoo on his forearm.",
  },
  {
    word: "Forehead",
    ipa: "/ˈfɔːrhed/",
    meaning: "upper face between eyebrows and hair",
    forms: "foreheads",
    example: "She wiped the sweat from her forehead.",
  },

  // Fun/Fu-words
  {
    word: "Fun",
    ipa: "/fʌn/",
    meaning: "pleasure or enjoyment",
    forms: "funny, funniest, funnier",
    example: "We had so much fun at the party.",
  },
  {
    word: "Fund",
    ipa: "/fʌnd/",
    meaning: "a sum of money",
    forms: "funds, funding, funded",
    example: "They need to raise funds for the trip.",
  },
  {
    word: "Fur",
    ipa: "/fɜːr/",
    meaning: "thick hair covering animals",
    forms: "furs, furred, furry",
    example: "The cat's fur is soft and fluffy.",
  },

  // Fr-words
  {
    word: "Friend",
    ipa: "/frɛnd/",
    meaning: "person one likes and enjoys being with",
    forms: "friends, friendly, friendliest",
    example: "She is my best friend from school.",
  },
  {
    word: "Frill",
    ipa: "/frɪl/",
    meaning: "decoration with small folds of cloth",
    forms: "frills, frilly",
    example: "The dress has frills around the collar.",
  },
  {
    word: "Frock",
    ipa: "/frɒk/",
    meaning: "dress worn by girls",
    forms: "frocks, frocking, frocked",
    example: "She wore a pretty pink frock to the party.",
  },
  {
    word: "Front",
    ipa: "/frʌnt/",
    meaning: "the surface facing forward",
    forms: "fronts, fronting, fronted",
    example: "Please sit at the front of the class.",
  },

  // Fruit
  {
    word: "Fruit",
    ipa: "/fruːt/",
    meaning: "seed-bearing fleshy part of a plant",
    forms: "fruits, fruity, fruited",
    example: "Apples and oranges are my favorite fruits.",
  },

  // Fry
  {
    word: "Fry",
    ipa: "/fraɪ/",
    meaning: "to cook in hot oil",
    forms: "fries, frying, fried",
    example: "Mom will fry some eggs for breakfast.",
  },
  {
    word: "Fuel",
    ipa: "/fjuːəl/",
    meaning: "substance used for heat/energy",
    forms: "fuels, fueling, fueled",
    example: "Cars need fuel to run.",
  },
  {
    word: "Few",
    ipa: "/fjuː/",
    meaning: "a small number",
    forms: "fewer, fewest, fewness",
    example: "Only a few people came to the meeting.",
  },
  {
    word: "Fence",
    ipa: "/fɛns/",
    meaning: "a wall that encloses an area",
    forms: "fences, fencing, fenced",
    example: "There's a wooden fence around our garden.",
  },
  {
    word: "Feet",
    ipa: "/fiːt/",
    meaning: "plural of foot",
    forms: "—",
    example: "I can stand on my own two feet.",
  },
  {
    word: "Feel",
    ipa: "/fiːl/",
    meaning: "to touch/experience emotion",
    forms: "feels, feeling, felt",
    example: "I feel happy when I play with friends.",
  },
  {
    word: "Feed",
    ipa: "/fiːd/",
    meaning: "to give food",
    forms: "feeds, feeding, fed",
    example: "Don't forget to feed the dog.",
  },
  {
    word: "Feast",
    ipa: "/fiːst/",
    meaning: "a large special meal",
    forms: "feasts, feasting, feasted",
    example: "We had a feast on Thanksgiving Day.",
  },
  {
    word: "Fever",
    ipa: "/ˈfiːvər/",
    meaning: "illness with high temperature",
    forms: "fevers, feverish, feverishly",
    example: "He stayed home because he had a fever.",
  },
  {
    word: "Fig",
    ipa: "/fɪɡ/",
    meaning: "soft fruit with seeds",
    forms: "figs",
    example: "Fresh figs are sweet and delicious.",
  },
  {
    word: "Fight",
    ipa: "/faɪt/",
    meaning: "attack between individuals/groups",
    forms: "fights, fighting, fought, fighter",
    example: "The two boys had a fight over a toy.",
  },
];
