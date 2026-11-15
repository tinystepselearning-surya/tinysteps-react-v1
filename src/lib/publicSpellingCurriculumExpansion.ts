/**
 * Reviewed extra word practice for the free 5–8 spelling adventure.
 * Twelve extra items per activity make 18 available per activity, played in
 * six-question mini-rounds. No backend, localStorage or child account.
 */
import type { PublicSpellingChallenge, PublicSpellingMode } from './publicSpellingContent';

type Mode = PublicSpellingMode;
type Basic = [string, string, string, string, string?]; // word, clue, pattern, emoji, note
type LetterRow = [string, string, string, string, string, string]; // word, clue, blank/onset, distractors, pattern, emoji
type ChoiceRow = [string, string, string, string, string, string, string]; // word, clue, three errors, pattern, emoji
type FixRow = [string, string, string, string, string]; // word, clue, incorrect, pattern, emoji

const buildRows: Basic[] = [
  ['hat','You wear it on your head.','CVC','🎩'],
  ['hen','A farm bird that lays eggs.','CVC','🐔'],
  ['pen','You can write with this.','CVC','🖊️'],
  ['map','A drawing that helps you find places.','CVC','🗺️'],
  ['book','You read stories in this.','oo vowel team','📖'],
  ['ship','A large boat that travels on water.','sh digraph','🚢'],
  ['frog','A green animal that can jump and croak.','initial blend fr','🐸'],
  ['milk','A white drink that comes from cows.','CVCC','🥛'],
  ['tree','A tall plant with a trunk and leaves.','ee vowel team','🌳'],
  ['clock','It tells you the time.','cl blend','🕒'],
  ['plant','A living thing that grows in soil.','pl blend','🌱'],
  ['smile','What your mouth does when you feel happy.','split digraph i_e','😊'],
];

const familyRows: LetterRow[] = [
  ['bat','An animal that flies at night.','b','cmrs','-at','🦇'],
  ['rat','A small animal with a long tail.','r','bcmt','-at','🐀'],
  ['cap','A soft hat with a front brim.','c','mtnb','-ap','🧢'],
  ['tap','You turn it to get water.','t','cmnp','-ap','🚰'],
  ['log','A thick piece of a tree trunk.','l','dfhg','-og','🪵'],
  ['fog','A thick cloud near the ground.','f','dhlg','-og','🌫️'],
  ['run','To move quickly on your feet.','r','bsfn','-un','🏃'],
  ['bun','A small round bread roll.','b','rsfn','-un','🍞'],
  ['big','Not small.','b','dfpw','-ig','🐘'],
  ['wig','Hair that someone wears on their head.','w','dfpb','-ig','👩'],
  ['king','A man who rules a kingdom.','k','rswp','-ing','👑'],
  ['sing','To make music with your voice.','s','rkwp','-ing','🎵'],
];

const missingRows: LetterRow[] = [
  ['bed','Something you sleep in.','1','aiou','short e','🛏️'],
  ['box','A container that holds things.','1','aiue','short o','📦'],
  ['hill','A raised piece of land, smaller than a mountain.','1','aeou','short i','⛰️'],
  ['lake','A large area of water surrounded by land.','1','ioue','split digraph a_e','🏞️'],
  ['rain','Water falling from clouds.','1','oiue','ai vowel team','🌧️'],
  ['boat','A small vessel that travels on water.','1','aieu','oa vowel team','⛵'],
  ['ship','A large boat that travels over water.','1','aeou','sh digraph','🚢'],
  ['chair','You sit on this.','2','eiou','air spelling','🪑'],
  ['light','It helps you see in a dark room.','1','aeou','igh spelling','💡'],
  ['cloud','A white or grey shape high in the sky.','2','aieo','ou spelling','☁️'],
  ['spoon','You use this to eat soup.','2','aiue','oo vowel team','🥄'],
  ['moon','You can see it shining in the night sky.','1','aiue','oo vowel team','🌙'],
];

const choiceRows: ChoiceRow[] = [
  ['apple','A round fruit that can be red or green.','aple','appel','appell','double p','🍎'],
  ['rabbit','A small animal with long ears.','rabit','rabitt','rabbitt','double b','🐇'],
  ['chair','Something you sit on.','chare','chiar','chari','air spelling','🪑'],
  ['flower','The colourful part of a plant.','flouer','flowar','flwer','ow and er','🌸'],
  ['yellow','The colour of a ripe banana.','yelow','yello','yelloe','double l','💛'],
  ['turtle','An animal with a hard shell on its back.','turtel','turtlle','turtl','-le ending','🐢'],
  ['bread','Food baked from flour.','bred','braed','bredd','ea spelling','🍞'],
  ['brush','You use it to tidy your hair.','brash','bruss','brussh','sh digraph','🪮'],
  ['window','You look outside through this.','windo','windoe','windaw','ow ending','🪟'],
  ['beach','A sandy place next to the sea.','beech','bech','beecha','ea and ch','🏖️'],
  ['smile','A happy expression on your face.','smil','smaile','smileh','split digraph i_e','😊'],
  ['night','The time when it is dark outside.','nite','nigt','nigth','igh spelling','🌃'],
];

const fixRows: FixRow[] = [
  ['again','One more time.','agen','ai spelling','🔁'],
  ['little','Small in size.','litle','double t','🤏'],
  ['happy','Feeling pleased or cheerful.','hapy','double p','😊'],
  ['rabbit','An animal with long ears and a short tail.','rabit','double b','🐇'],
  ['yellow','The colour of a sunflower.','yelow','double l','💛'],
  ['pillow','A soft thing under your head when sleeping.','pilo','double l and ow','🛏️'],
  ['flower','A colourful part of a plant.','flouer','ow vowel pattern','🌼'],
  ['chair','Something you sit on.','chare','air spelling','🪑'],
  ['night','The time between evening and morning.','nite','igh spelling','🌙'],
  ['white','The colour of snow.','wite','wh and i_e','⚪'],
  ['birthday','The day you celebrate when you were born.','brithday','ir spelling','🎂'],
  ['sandwich','Bread with food in the middle.','sandwish','ch ending','🥪'],
];

const spellRows: Basic[] = [
  ['pen','You write with this and it uses ink.','CVC','🖊️'],
  ['hat','You put this on your head outdoors.','CVC','🎩'],
  ['spoon','You use this to eat soup.','oo spelling','🥄'],
  ['night','The time of day when the sky is dark.','igh spelling','🌙'],
  ['apple','A crisp fruit that can be red or green.','double p','🍎'],
  ['rabbit','An animal with two long ears that hops.','double b','🐇'],
  ['window','You can see the world outside through this.','ow ending','🪟'],
  ['rainbow','An arc of colours that appears after rain.','compound word','🌈'],
  ['blanket','A soft covering that keeps you warm.','consonant blends','🛏️'],
  ['teacher','A person who helps people learn new things.','-er ending','👩‍🏫'],
  ['birthday','The special day that comes once a year on the date you were born.','ir and th','🎂'],
  ['sandwich','Bread with a filling between two slices.','ch ending','🥪'],
];

function mixedLetters(word: string): string[] {
  const letters = word.split('');
  // Moving the first tile ensures the reviewed word is not already assembled.
  return [...letters.slice(1), letters[0]];
}

function choiceTiles(correct: string, distractors: string): string[] {
  const otherLetters = [...new Set(distractors.split(''))].filter(letter => letter !== correct);
  if (correct.length !== 1 || otherLetters.length < 3) {
    throw new Error('Invalid curated choice tiles for ' + correct);
  }
  return [otherLetters[0], correct, otherLetters[1], otherLetters[2]];
}

export const PUBLIC_SPELLING_EXTRA_CHALLENGES: readonly PublicSpellingChallenge[] = [
  ...buildRows.map(([word, clue, spellingPattern, emojiFallback]): PublicSpellingChallenge => ({
    id: 'extra-build-' + word, mode: 'build', word, clue, clueType: 'meaning',
    emojiFallback, spellingPattern, tiles: mixedLetters(word),
  })),
  ...familyRows.map(([word, clue, onset, distractors, spellingPattern, emojiFallback]): PublicSpellingChallenge => ({
    id: 'extra-family-' + word, mode: 'family', word, clue, clueType: 'meaning',
    emojiFallback, spellingPattern, rime: word.slice(1), onset,
    tiles: choiceTiles(onset, distractors),
  })),
  ...missingRows.map(([word, clue, position, distractors, spellingPattern, emojiFallback]): PublicSpellingChallenge => {
    const index = Number(position);
    const onset = word.charAt(index);
    const otherLetters = distractors.slice(0, 3);
    if (!onset || otherLetters.includes(onset) || new Set(otherLetters).size !== 3) throw Error('Invalid missing vowel in ' + word);
    return {
      id: 'extra-missing-' + word, mode: 'missing', word, clue, clueType: 'meaning',
      emojiFallback, spellingPattern, pattern: word.slice(0, index) + ' _ ' + word.slice(index + 1),
      onset, tiles: [otherLetters[0], onset, otherLetters[1], otherLetters[2]],
    };
  }),
  ...choiceRows.map(([word, clue, error1, error2, error3, spellingPattern, emojiFallback]): PublicSpellingChallenge => ({
    id: 'extra-choice-' + word, mode: 'choice', word, clue, clueType: 'meaning', emojiFallback,
    spellingPattern, choices: [error1, word, error2, error3],
  })),
  ...fixRows.map(([word, clue, incorrectSpelling, spellingPattern, emojiFallback]): PublicSpellingChallenge => ({
    id: 'extra-fix-' + word, mode: 'fix', word, clue, clueType: 'meaning', emojiFallback,
    spellingPattern, incorrectSpelling,
  })),
  ...spellRows.map(([word, clue, spellingPattern, emojiFallback]): PublicSpellingChallenge => ({
    id: 'extra-spell-' + word, mode: 'spell', word, clue, clueType: 'meaning', emojiFallback, spellingPattern,
  })),
];

export const PUBLIC_SPELLING_EXTRA_MODES: readonly Mode[] = ['build','family','missing','choice','fix','spell'];
