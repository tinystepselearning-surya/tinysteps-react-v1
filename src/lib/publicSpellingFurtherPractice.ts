/**
 * Additional editor-curated, meaning-linked written spelling practice.
 * Twelve new tasks for each of the six existing activity types.
 * Do not infer pictures, pronunciations, or syllable structures from letters.
 */
import type { PublicSpellingChallenge } from './publicSpellingContent';
type Build = [string,string,string,string?]; // word, meaning, focus, directly relevant symbol
type Family = [string,string,string,string,string,string?]; // word, meaning, onset, 3 distractors, ending, symbol
type Missing = [string,string,number,string,string,string?]; // word, meaning, missing index, 3 distractors, focus, symbol
type Choice = [string,string,string,string,string,string,string?]; // word, clue, 3 errors, focus, symbol
type Fix = [string,string,string,string,string?]; // word, clue, incorrect, focus, symbol
type Spell = [string,string,string,string?]; // word, meaning, focus, symbol

const builds: Build[] = [
  ['ant','A tiny insect that lives in a colony.','short a','🐜'],
  ['cup','A small container for drinking.','short u','🥤'],
  ['bus','A large vehicle that carries many passengers.','short u','🚌'],
  ['red','A colour like a ripe tomato.','short e','🔴'],
  ['duck','A water bird with a wide, flat beak.','ck ending','🦆'],
  ['crab','A sea animal with a hard shell and claws.','cr blend','🦀'],
  ['desk','A table used for writing or studying.','final sk'],
  ['star','A bright object visible in the night sky.','st blend and ar','⭐'],
  ['skate','A boot with wheels or a blade underneath.','sk blend and a_e','🛼'],
  ['lunch','The meal eaten near the middle of the day.','ch ending','🍱'],
  ['brush','A tool with bristles used for cleaning or brushing hair.','br blend and sh','🪮'],
  ['sheep','A farm animal covered in wool.','sh and ee','🐑'],
];
const families: Family[] = [
  ['net','A mesh used to catch or hold something.','n','bpt','-et','🥅'],
  ['jet','A fast aircraft powered by jet engines.','j','bpt','-et','✈️'],
  ['pen','An object containing ink used for writing.','p','bht','-en','🖊️'],
  ['ten','The number after nine.','t','bhn','-en','🔟'],
  ['dad','Another word for father.','d','bps','-ad','👨'],
  ['pad','Several sheets of paper joined for writing.','p','dms','-ad','📝'],
  ['bag','Something used to carry your belongings.','b','rtg','-ag','🎒'],
  ['tag','A small label attached to an object.','t','brg','-ag','🏷️'],
  ['lip','A soft edge of your mouth.','l','dsw','-ip','👄'],
  ['sip','To take a small drink.','s','ldw','-ip','🥤'],
  ['hop','To jump on one foot.','h','mpt','-op','🐇'],
  ['top','The highest part of something.','t','mhp','-op','🔝'],
];
const missing: Missing[] = [
  ['ant','A tiny insect that often walks in groups.',0,'eio','short a','🐜'],
  ['crab','An animal with claws that lives near the sea.',2,'eio','short a','🦀'],
  ['brush','A tool for brushing hair.',2,'aeo','short u','🪮'],
  ['glass','A clear material used in windows.',2,'eio','short a'],
  ['seed','A tiny part of a plant that can grow.',1,'aio','ee spelling','🌱'],
  ['tree','A tall plant with branches and leaves.',2,'aio','ee spelling','🌳'],
  ['foot','The part of your body below your ankle.',1,'aie','oo spelling','🦶'],
  ['bread','Food baked from flour.',2,'aio','ea spelling','🍞'],
  ['stone','A hard natural piece of rock.',2,'aue','long o with silent e','🪨'],
  ['smile','A happy expression on your face.',2,'aeo','i_e spelling','😊'],
  ['sleep','What you do at night when you are resting.',2,'aio','ee spelling','😴'],
  ['train','A vehicle that travels along railway tracks.',2,'eio','ai spelling','🚆'],
];
const choices: Choice[] = [
  ['school','A place where children learn.','scool','schol','shcool','sch beginning','🏫'],
  ['because','A word used to give a reason.','becaus','becuase','becose','-ause spelling'],
  ['friend','Someone you like and trust.','frend','freind','friand','ie spelling'],
  ['people','More than one person.','peple','peeple','pepole','eo spelling'],
  ['pencil','A writing tool with graphite inside.','pensil','pencel','pensel','c sound in pencil','✏️'],
  ['garden','A space where people grow plants.','gardin','garten','gardan','-den ending'],
  ['purple','A colour made from red and blue.','purpel','pirple','purpil','-ple ending','🟣'],
  ['orange','A round citrus fruit.','orenge','orrange','oranje','-ange ending','🍊'],
  ['bottle','A container for water or other liquids.','botle','bottel','botttle','-tle ending'],
  ['little','Small in size.','litle','littel','littlle','double t'],
  ['kitchen','A room where food is prepared.','kichen','kitcken','kitchin','tch spelling','🍳'],
  ['teacher','A person who helps children learn.','techer','teachar','teecher','ea spelling','👩‍🏫'],
];
const fixes: Fix[] = [
  ['receive','To get something that someone sends or gives.','recieve','ei after c'],
  ['believe','To accept that something is true.','beleive','ie spelling'],
  ['separate','To keep things apart.','seperate','-ar- spelling'],
  ['calendar','A chart that shows days and months.','calender','-dar ending','📅'],
  ['business','The work of buying or selling goods and services.','buisness','bus-i-ness spelling'],
  ['answer','A reply to a question.','anser','silent w'],
  ['writing','Making letters or words on paper.','writting','one t'],
  ['running','Moving quickly on your feet.','runing','double n','🏃'],
  ['trouble','A problem or difficulty.','truble','ou spelling'],
  ['mountain','A very high area of land.','mountan','-ain ending','🏔️'],
  ['tomorrow','The day after today.','tommorow','one m, two r'],
  ['beautiful','Very lovely to look at.','beautifull','-ful with one l'],
];
const spells: Spell[] = [
  ['chair','A piece of furniture you sit on.','ch and air','🪑'],
  ['kettle','A container used to boil water.','double t and -le','🫖'],
  ['bicycle','A two-wheeled vehicle you move by pedalling.','bi- and cycle','🚲'],
  ['picture','An image or drawing.','-ture ending','🖼️'],
  ['garden','A place where flowers and plants grow.','-den ending'],
  ['river','A long natural stream of flowing water.','-er ending','🏞️'],
  ['planet','A large world that travels around a star.','pl blend','🪐'],
  ['bottle','Something that holds drinks.','double t and -le'],
  ['summer','The warmest season of the year in many places.','double m'],
  ['school','A place for teaching and learning.','sch and oo','🏫'],
  ['orange','A round fruit with a thick coloured peel.','-ange ending','🍊'],
  ['sister','A female sibling.','-ter ending'],
];

function rotateLetters(word: string) { return [...word.slice(1), word.charAt(0)]; }
function tiles(onset: string, others: string) {
  if (onset.length !== 1 || others.length !== 3 || others.includes(onset) ||
    new Set(others).size !== 3) throw new Error('Invalid distractor letters for ' + onset);
  return [others.charAt(0), onset, others.charAt(1), others.charAt(2)];
}
export const PUBLIC_SPELLING_FURTHER_CHALLENGES: readonly PublicSpellingChallenge[] = [
  ...builds.map(([word,clue,spellingPattern,emojiFallback]): PublicSpellingChallenge => ({
    id: 'further-build-' + word,mode:'build',word,clue,clueType:'meaning',spellingPattern,emojiFallback,
    tiles:rotateLetters(word),
  })),
  ...families.map(([word,clue,onset,others,spellingPattern,emojiFallback]): PublicSpellingChallenge => ({
    id: 'further-family-' + word,mode:'family',word,clue,clueType:'meaning',spellingPattern,emojiFallback,
    onset,rime:word.slice(1),tiles:tiles(onset,others),
  })),
  ...missing.map(([word,clue,position,others,spellingPattern,emojiFallback]): PublicSpellingChallenge => ({
    id: 'further-missing-' + word,mode:'missing',word,clue,clueType:'meaning',spellingPattern,emojiFallback,
    onset:word.charAt(position),
    pattern:word.slice(0,position)+' _ '+word.slice(position+1),
    tiles:tiles(word.charAt(position),others),
  })),
  ...choices.map(([word,clue,error1,error2,error3,spellingPattern,emojiFallback]): PublicSpellingChallenge => ({
    id: 'further-choice-' + word,mode:'choice',word,clue,clueType:'meaning',spellingPattern,emojiFallback,
    choices:[error1,word,error2,error3],
  })),
  ...fixes.map(([word,clue,incorrectSpelling,spellingPattern,emojiFallback]): PublicSpellingChallenge => ({
    id:'further-fix-'+word,mode:'fix',word,clue,clueType:'meaning',spellingPattern,emojiFallback,incorrectSpelling,
  })),
  ...spells.map(([word,clue,spellingPattern,emojiFallback]): PublicSpellingChallenge => ({
    id:'further-spell-'+word,mode:'spell',word,clue,clueType:'meaning',spellingPattern,emojiFallback,
  })),
];
