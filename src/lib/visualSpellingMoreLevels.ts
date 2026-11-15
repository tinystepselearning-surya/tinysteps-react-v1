/**
 * Editor-authored word sets for four bridging stages. No dictionary synthesis,
 * speech segmentation or algorithmically invented spellings.
 * Each stage has 6 each of build, choose, missing and compare/sort: 24 tasks.
 * The phonics-free path is written-word practice, not an audio phonics lesson.
 */
import type { VisualSpellingPuzzle, VisualSpellingStage } from './visualSpellingPuzzles';

type Stage = Extract<VisualSpellingStage, 'vowels' | 'syllable-spelling' | 'inflections' | 'roots'>;
type Build = [Stage,string,string,string,string,string];
type Choice = [Stage,string,string,string,string,string,string,string];
type Missing = [Stage,string,string,string,string,string,string,string];
type Sort = [Stage,string,string,string,string,string,string,string,string];

const builds: Build[] = [
  ['vowels','raincoat','A coat worn to stay dry in the rain.','rain|coat','Look for two vowel teams: ai and oa.','Raincoat joins rain and coat; ai and oa are vowel teams.'],
  ['vowels','seaweed','A plant-like organism growing in the sea.','sea|weed','Both parts have a vowel team.','Seaweed joins sea (ea) and weed (ee).'],
  ['vowels','toothbrush','Something used to clean your teeth.','tooth|brush','The first part contains oo.','Toothbrush joins tooth and brush; oo appears in tooth.'],
  ['vowels','daydream','Thoughts you imagine while you are awake.','day|dream','Notice the endings -ay and -eam.','Daydream combines day (ay) and dream (ea).'],
  ['vowels','snowflake','A small piece of falling snow.','snow|flake','The first part contains ow.','Snowflake joins snow and flake; ow spells a long o sound in snow.'],
  ['vowels','playtime','A period when children can play.','play|time','Look for the ay spelling.','Playtime combines play and time; play contains ay.'],
  ['syllable-spelling','picnic','A meal eaten outdoors.','pic|nic','This word has two spoken syllables.','Picnic has two syllables: pic-nic.'],
  ['syllable-spelling','fantastic','Really good or exciting.','fan|tas|tic','This word has three spoken syllables.','Fantastic can be divided into fan-tas-tic.'],
  ['syllable-spelling','animal','A living creature such as a cat or bird.','an|i|mal','Say the three syllables slowly.','Animal has three syllables: an-i-mal.'],
  ['syllable-spelling','banana','A long yellow fruit.','ba|nan|a','Notice the three spoken beats.','Banana is spoken with three syllables: ba-nan-a.'],
  ['syllable-spelling','computer','An electronic machine used to work and learn.','com|pu|ter','This word has three syllables.','Computer has three syllables: com-pu-ter.'],
  ['syllable-spelling','elephant','A huge grey animal with a trunk.','el|e|phant','Notice three spoken syllables.','Elephant is divided el-e-phant.'],
  ['inflections','jumped','Moved off the ground using your legs in the past.','jump|ed','The ending tells you an action happened before now.','Jumped is jump + -ed, a past-tense ending.'],
  ['inflections','running','Moving quickly on foot right now.','run|n|ing','The consonant doubles when -ing is added.','Run + n + ing forms running; the final n doubles.'],
  ['inflections','hopping','Making small jumps on one foot.','hop|p|ing','The consonant doubles before -ing.','Hop + p + ing forms hopping, with double p.'],
  ['inflections','carried','Transported something in the past.','carr|ied','The base word is carry; the ending changes.','Carry changes y to i before -ed: carried.'],
  ['inflections','making','Creating or producing something.','mak|ing','The base word make loses final e.','Make drops silent e before -ing: making.'],
  ['inflections','boxes','More than one box.','box|es','Words ending in x often take -es.','Box + -es forms boxes.'],
  ['roots','telephone','A device used to talk to someone far away.','tele|phone','Tele- relates to distance.','Tele- can mean far; phone relates to sound.'],
  ['roots','photograph','An image made using a camera.','photo|graph','Photo- relates to light.','Photo- relates to light; graph relates to writing or recording.'],
  ['roots','microscope','A tool used to see very small things.','micro|scope','Micro- means small.','Micro- means small; scope relates to looking.'],
  ['roots','geography','The study of places and the Earth.','geo|graphy','Geo- refers to Earth.','Geo- means Earth; graphy relates to describing or recording.'],
  ['roots','autograph','A signature written by a person.','auto|graph','Auto- can mean self.','Autograph has auto- (self) and graph (write).'],
  ['roots','thermometer','A tool for measuring temperature.','thermo|meter','Thermo- relates to heat.','Thermo- relates to heat; meter relates to measurement.'],
];

const choices: Choice[] = [
  ['vowels','rain','Water that falls from clouds.','raen','rayn','ran','The long a sound uses ai.','Rain is spelled r-a-i-n with ai.'],
  ['vowels','boat','A small vessel used to travel on water.','bote','boet','bowt','The long o spelling uses oa.','Boat is spelled b-o-a-t with oa.'],
  ['vowels','seed','The small part of a plant from which a new plant may grow.','sed','sead','seede','It has double e.','Seed is spelled s-e-e-d with ee.'],
  ['vowels','night','The time between evening and morning.','nite','nigt','nigth','Look for igh.','Night uses igh to represent its long i sound.'],
  ['vowels','bright','Giving or reflecting a lot of light.','brite','brigt','brighte','Notice the written ending -ight.','Bright uses igh followed by t.'],
  ['vowels','cloud','A visible mass of tiny water drops in the sky.','clowd','cluod','clod','The middle uses ou.','Cloud is written with ou.'],
  ['syllable-spelling','calendar','A chart showing the days and months of a year.','calender','calandar','calandarrr','The end contains -dar.','Calendar is spelled c-a-l-e-n-d-a-r.'],
  ['syllable-spelling','hospital','A place where doctors care for people.','hospitel','hosptial','hospitall','The ending is -tal.','Hospital ends with -tal, not -tel.'],
  ['syllable-spelling','chocolate','A sweet food made from cocoa.','choclate','chocolat','chockolate','The written word has cho-co-late.','Chocolate is spelled c-h-o-c-o-l-a-t-e.'],
  ['syllable-spelling','tomorrow','The day after today.','tommorow','tommorrow','tomorow','The word has one m and two r letters.','Tomorrow is t-o-m-o-r-r-o-w.'],
  ['syllable-spelling','different','Not the same.','diffrent','diferent','differant','Look for double f and -ent.','Different contains ff and ends with -ent.'],
  ['syllable-spelling','important','Having a great effect or value.','importent','imporant','impotant','The ending contains -tant.','Important has the written pattern -tant.'],
  ['inflections','studies','Learns or examines something carefully.','studys','studyies','studeys','Change the y of study to i before -es.','Study changes y to i, then takes -es: studies.'],
  ['inflections','babies','More than one baby.','babys','babyies','babyes','The y changes to i.','Baby changes y to i, then takes -es: babies.'],
  ['inflections','stopped','Came to a halt in the past.','stoped','stoppped','stopt','The final p doubles before -ed.','Stop doubles p before -ed: stopped.'],
  ['inflections','running','Moving quickly on foot.','runing','runnning','runinng','The final n is doubled.','Run doubles n before -ing: running.'],
  ['inflections','happier','Feeling more happy.','happyer','hapier','happierre','Change y to i before -er.','Happy changes y to i before -er: happier.'],
  ['inflections','biggest','Largest in size.','bigest','biggst','biggeste','Double the final g before -est.','Big doubles g before -est: biggest.'],
  ['roots','biology','The study of living things.','bioligy','biollogy','biolegy','Bio- relates to life.','Biology begins with bio- (life), then -logy (study).'],
  ['roots','microscope','A tool that magnifies tiny objects.','microskope','microscop','microscobe','The ending is -scope.','Microscope is spelled micro + scope.'],
  ['roots','transport','To carry someone or something from one place to another.','transsport','transpot','tranport','The prefix is trans-.','Transport contains trans- (across) and port (carry).'],
  ['roots','photograph','A picture taken by a camera.','fotograph','photograf','photograff','Photo- is written with ph.','Photograph has photo- (light) and graph (record).'],
  ['roots','geography','The study of physical places on Earth.','geografy','geograpy','geogrophy','Look for -graphy.','Geography combines geo- (Earth) with -graphy.'],
  ['roots','telephone','A device used to speak with people far away.','telefone','telephon','telephoen','The ph in phone is important.','Telephone is tele- + phone, with ph.'],
];

const missing: Missing[] = [
  ['vowels','paint','To put colour on something.','pa','i','nt','eou','Paint has ai in the middle.'],
  ['vowels','beach','Sand beside the sea.','b','e','ach','aoi','Beach has ea near the beginning.'],
  ['vowels','toast','Browned bread.','t','o','ast','eiu','Toast uses oa to spell the long o.'],
  ['vowels','light','Something that helps you see.','l','i','ght','eou','Light contains igh.'],
  ['vowels','cloud','A mass of water droplets in the sky.','cl','o','ud','eai','Cloud contains ou.'],
  ['vowels','spoil','To damage something or make it unusable.','sp','o','il','aeu','Spoil uses oi.'],
  ['syllable-spelling','rabbit','A small animal with long ears.','rab','b','it','pdt','Rabbit has double b.'],
  ['syllable-spelling','pencil','Something used for writing that can be erased.','pen','c','il','dtr','Pencil is written pen + cil.'],
  ['syllable-spelling','summer','The warmest season of the year in many places.','sum','m','er','bnr','Summer has double m.'],
  ['syllable-spelling','winter','The coldest season of the year in many places.','win','t','er','bdr','Winter is written win + ter.'],
  ['syllable-spelling','fantastic','Really wonderful.','fan','t','astic','psd','Fantastic includes the written middle t.'],
  ['syllable-spelling','animal','A living creature.','ani','m','al','pdt','Animal includes the letter m.'],
  ['inflections','played','Joined a game in the past.','play','e','d','aio','Played adds -ed to play.'],
  ['inflections','boxes','More than one box.','box','e','s','aio','Boxes adds -es to box.'],
  ['inflections','running','Moving quickly on your feet.','runn','i','ng','aeo','Running contains double n before -ing.'],
  ['inflections','making','Creating something.','mak','i','ng','aeo','Making drops the e from make.'],
  ['inflections','carried','Moved something from one place to another in the past.','carr','i','ed','aeo','Carry changes y to i before -ed.'],
  ['inflections','stopped','Came to a halt in the past.','stop','p','ed','brt','Stopped has double p before -ed.'],
  ['roots','photograph','A picture made with a camera.','photo','g','raph','pdt','Photograph contains photo + graph.'],
  ['roots','biology','The science of living things.','bi','o','logy','aeu','Biology has bio- followed by -logy.'],
  ['roots','transport','To carry something across a distance.','trans','p','ort','brt','Transport contains port, meaning carry.'],
  ['roots','telescope','A tool for looking at faraway objects.','tele','s','cope','pbt','Telescope contains tele- and -scope.'],
  ['roots','thermometer','An instrument that measures temperature.','thermo','m','eter','pbt','Thermometer includes thermo- and meter.'],
  ['roots','autograph','A handwritten signature.','auto','g','raph','pdt','Autograph includes auto- and graph.'],
];

const sorts: Sort[] = [
  ['vowels','rain','Water falling from the sky.','play','To have fun doing an activity.','Contains ai','Contains ay','Rain contains ai; play contains ay.','Look for vowel letters in the middle or ending.'],
  ['vowels','boat','A vessel on water.','snow','Frozen white water falling from the sky.','Contains oa','Contains ow','Boat contains oa; snow contains ow.','The same long-o sound can have different written patterns.'],
  ['vowels','seed','A small part that grows into a plant.','beach','A sandy area beside the sea.','Contains ee','Contains ea','Seed contains ee; beach contains ea.','Compare the letter groups rather than guessing by meaning.'],
  ['vowels','coin','A piece of money made from metal.','toy','An object for children to play with.','Contains oi','Contains oy','Coin uses oi; toy uses oy.','Both can represent the oy vowel sound in different positions.'],
  ['vowels','cloud','A mass of water droplets in the sky.','brown','A colour like chocolate.','Contains ou','Contains ow','Cloud uses ou; brown uses ow.','Cloud and brown contain different spellings of the same vowel sound.'],
  ['vowels','night','The time when the sky is dark.','pie','Baked food with pastry and a filling.','Contains igh','Contains ie','Night contains igh; pie contains ie.','Compare the complete spelling pattern.'],
  ['syllable-spelling','rabbit','A long-eared small animal.','animal','A living creature.','Two syllables','Three syllables','Rabbit has two spoken syllables; animal has three.','Say each word aloud and count its spoken beats.'],
  ['syllable-spelling','paper','Something we can write on.','banana','A long yellow fruit.','Two syllables','Three syllables','Paper has two syllables; banana has three.','Syllable counts refer to spoken beats, not letter count.'],
  ['syllable-spelling','window','An opening in a wall that lets in light.','computer','An electronic device for work.','Two syllables','Three syllables','Window has two syllables; computer has three.','Speak the word slowly to hear syllables.'],
  ['syllable-spelling','winter','A cold season.','elephant','A large animal with a trunk.','Two syllables','Three syllables','Winter has two syllables; elephant has three.','Write all letters even when some syllables are unstressed.'],
  ['syllable-spelling','pencil','A tool for writing.','holiday','A day or break without usual work.','Two syllables','Three syllables','Pencil has two syllables; holiday has three.','Longer words can be understood in spoken parts.'],
  ['syllable-spelling','garden','An area where plants grow.','tomorrow','The day after today.','Two syllables','Three syllables','Garden has two syllables; tomorrow has three.','Use spoken syllables as a clue, then check written spelling.'],
  ['inflections','cats','More than one cat.','boxes','More than one box.','Plural ends -s','Plural ends -es','Cats adds -s; boxes adds -es.','The ending depends on the base word.'],
  ['inflections','played','Joined a game in the past.','jumping','Moving off the ground repeatedly.','Ends in -ed','Ends in -ing','Played ends -ed; jumping ends -ing.','The two endings describe different time or action forms.'],
  ['inflections','babies','More than one baby.','toys','Things that children play with.','Plural ends -ies','Plural ends -s','Babies changes y to ies; toys adds s.','Consonant+y commonly changes to ies in the plural.'],
  ['inflections','hopped','Made small jumps in the past.','helped','Gave someone help in the past.','Doubles before -ed','No doubling before -ed','Hopped doubles p; helped does not double p.','Check the consonants before the ending.'],
  ['inflections','making','Creating something.','playing','Having fun with a game.','Drops final e','Keeps base spelling','Making drops e from make; playing keeps play.','Compare how the base changes when -ing is added.'],
  ['inflections','happier','More happy than before.','smaller','Less big in size.','Changes y to i','Keeps base spelling','Happier changes happy to happi-; smaller keeps small.','Look for changes in the original base word.'],
  ['roots','telephone','A device to talk to someone far away.','microphone','A device that makes a voice louder or records it.','Starts tele-','Starts micro-','Telephone starts tele-; microphone starts micro-.','Tele- relates to distance; micro- relates to small.'],
  ['roots','photograph','A camera-made image.','geography','The study of Earth and its places.','Starts photo-','Starts geo-','Photograph starts photo-; geography starts geo-.','Photo- relates to light; geo- to Earth.'],
  ['roots','autograph','A signature written by a person.','telephone','A device used for distance communication.','Starts auto-','Starts tele-','Autograph starts auto-; telephone starts tele-.','Auto- means self; tele- relates to distance.'],
  ['roots','microscope','A tool for seeing small objects.','telescope','A tool for seeing distant objects.','Starts micro-','Starts tele-','Microscope starts micro-; telescope starts tele-.','Both share -scope, which relates to looking.'],
  ['roots','transport','To carry people or goods.','submarine','A vessel that travels underwater.','Starts trans-','Starts sub-','Transport starts trans-; submarine starts sub-.','Trans- relates to across; sub- means under.'],
  ['roots','thermometer','A tool to measure temperature.','kilometer','One thousand metres.','Starts thermo-','Starts kilo-','Thermometer starts thermo-; kilometer starts kilo-.','Thermo- relates to heat; kilo- means one thousand.'],
];

const rotate = (parts: string[]) => [...parts.slice(1), parts[0]];
const allIds = new Set<string>();
const checked = (id:string) => { if (allIds.has(id)) throw new Error('Repeated spelling ID: ' + id); allIds.add(id); return id; };
export const VISUAL_SPELLING_MORE_LEVELS: readonly VisualSpellingPuzzle[] = [
  ...builds.map(([stage, word, clue, parts, hint, learningNote]): VisualSpellingPuzzle => {
    const segments = parts.split('|');
    if (segments.length < 2 || segments.join('') !== word) throw new Error('Incorrect parts: ' + word);
    return { id: checked('more-' + stage + '-arrange-' + word), stage, kind: 'arrange', word, clue, tiles: rotate(segments), hint, learningNote };
  }),
  ...choices.map(([stage, word, clue, bad1, bad2, bad3, hint, learningNote]): VisualSpellingPuzzle => ({
    id: checked('more-' + stage + '-choice-' + word), stage, kind: 'correct', word, clue,
    options: [bad1, word, bad2, bad3], hint, learningNote,
  })),
  ...missing.map(([stage, word, clue, before, letter, after, distractors, learningNote]): VisualSpellingPuzzle => {
    if (before + letter + after !== word || distractors.length !== 3 || letter.length !== 1 ||
        distractors.includes(letter) || new Set(distractors).size !== 3) throw new Error('Incorrect blank: ' + word);
    return { id: checked('more-' + stage + '-missing-' + word), stage, kind: 'missing', word, clue,
      before, missing: letter, after, choices: [distractors[0], letter, distractors[1], distractors[2]],
      hint: 'Look closely at the written letters surrounding the blank.', learningNote };
  }),
  ...sorts.map(([stage,word,clue,pairWord,pairClue,category,pairCategory,learningNote,hint]): VisualSpellingPuzzle => ({
    id: checked('more-' + stage + '-sort-' + word), stage, kind: 'sort', word, clue,
    categories: [category,pairCategory], answer: category, learningNote, hint,
    pair: { word: pairWord, clue: pairClue, answer: pairCategory, learningNote },
  })),
];
