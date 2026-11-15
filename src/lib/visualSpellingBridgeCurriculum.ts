/**
 * Two additional silent spelling levels bridge everyday spelling patterns
 * and very long academic words. Every entry supplies a concrete meaning,
 * reviewed visible spelling, a specific hint and a short teaching note.
 *
 * Six challenges per activity kind per level = 24 per level.
 * The game serves these in three independent eight-puzzle mini-rounds.
 */
import type { VisualSpellingPuzzle, VisualSpellingStage } from './visualSpellingPuzzles';

type Stage = Extract<VisualSpellingStage, 'syllables' | 'morphology'>;
type ArrangeRow = [Stage, string, string, string, string, string];
type ChoiceRow = [Stage, string, string, string, string, string, string, string];
type MissingRow = [Stage, string, string, string, string, string, string, string];
type SortRow = [Stage, string, string, string, string, string, string, string];

const arrange: ArrangeRow[] = [
  ['syllables','sunflower','A tall flower with a large yellow head.','sun|flower','Two everyday words join together.','Sunflower is sun + flower, written as one compound word.'],
  ['syllables','backpack','A bag carried on your back.','back|pack','The first part tells you where you carry it.','Backpack is back + pack, written as one word.'],
  ['syllables','basketball','A game where players throw a ball through a hoop.','basket|ball','Think of a basket and a ball.','Basketball joins basket + ball.'],
  ['syllables','notebook','A book with pages for writing notes.','note|book','The second part is something you can read.','Notebook is note + book.'],
  ['syllables','watermelon','A large juicy fruit with green skin.','water|melon','The last part is melon.','Watermelon combines water + melon in its written form.'],
  ['syllables','playground','An outdoor place where children play.','play|ground','The first part is play.','Playground is play + ground.'],
  ['morphology','unhappiness','The feeling of not being happy.','un|happi|ness','Look for un- and -ness, and notice the changed middle.','Unhappiness comes from un- + happy + -ness; y changes to i before -ness.'],
  ['morphology','disapproval','Not agreeing with or accepting something.','dis|approval','The first part reverses approval.','Disapproval is dis- + approval; dis- can mean the opposite.'],
  ['morphology','rearrangement','A new way of putting things in order.','re|arrange|ment','The first part means again.','Rearrangement is re- + arrange + -ment.'],
  ['morphology','overconfident','Feeling too sure that you will succeed.','over|confident','The first part means too much.','Overconfident is over- + confident.'],
  ['morphology','miscalculation','A mistake when working something out.','mis|calculation','The first part means wrongly.','Miscalculation is mis- + calculation.'],
  ['morphology','interrelationship','A connection between people or things.','inter|relationship','Start with inter-, meaning between or among.','Interrelationship is inter- + relationship.'],
];

const choice: ChoiceRow[] = [
  ['syllables','butterfly','An insect with large colourful wings.','buterfly','butterflie','butterfli','Look for double t before -er.','Butterfly has double t, followed by er and fly.'],
  ['syllables','umbrella','Something you hold to keep dry in the rain.','umbrela','umberella','umbrellla','It contains double l.','Umbrella contains ll before the final a.'],
  ['syllables','pineapple','A spiky tropical fruit with yellow flesh.','pinapple','pineaple','pineapel','Keep pine and apple together.','Pineapple is written pine + apple, with double p.'],
  ['syllables','cucumber','A long green vegetable eaten in salads.','cucmber','cucumberr','cuccumber','The first part is cucu-.','Cucumber is c-u-c-u-m-b-e-r.'],
  ['syllables','yesterday','The day before today.','yesturday','yesterdayy','yesterdey','The middle is -ter-.','Yesterday is spelled y-e-s-t-e-r-d-a-y.'],
  ['syllables','bicycle','A two-wheeled vehicle you can pedal.','bicicle','bicycel','bicycl','Look for the beginning bi- and the ending -cycle.','Bicycle is spelled b-i-c-y-c-l-e.'],
  ['morphology','availability','The state of being ready or free to use.','availibility','availablity','availabilty','The ending is -ability.','Availability is a-v-a-i-l-a-b-i-l-i-t-y.'],
  ['morphology','unnecessary','Not needed.','unecessary','unneccessary','unnecesary','The base word necessary has one c and two s letters.','Unnecessary is un- + necessary, with one c and two s letters.'],
  ['morphology','independent','Able to do something without other people’s help.','independant','indepandent','indepedent','The ending contains -dent.','Independent ends in -dent, not -dant.'],
  ['morphology','immediately','Without waiting.','imediately','immediatly','immediatelly','Notice the double m at the beginning.','Immediately begins imm- and ends -ately.'],
  ['morphology','description','A statement explaining what something is like.','discription','descrption','descripsion','Look for the written ending -scription.','Description is d-e-s-c-r-i-p-t-i-o-n.'],
  ['morphology','maintenance','Work done to keep something in good condition.','maintainance','maintenence','maintance','Look for the middle -ten-.','Maintenance is spelled m-a-i-n-t-e-n-a-n-c-e.'],
];

const missing: MissingRow[] = [
  ['syllables','fantastic','Really good or exciting.','fan','t','astic','pqd','Fantastic contains the written middle -tast-.'],
  ['syllables','picnic','A meal eaten outside.','pic','n','ic','mtp','Picnic is spelled p-i-c-n-i-c.'],
  ['syllables','computer','An electronic machine for work and learning.','comp','u','ter','aio','Computer is spelled c-o-m-p-u-t-e-r.'],
  ['syllables','rainbow','An arc of colours sometimes seen after rain.','rain','b','ow','pdg','Rainbow joins rain + bow.'],
  ['syllables','holiday','A day or period free from usual work or school.','hol','i','day','eao','Holiday contains holi + day.'],
  ['syllables','together','With one another, in one place or group.','tog','e','ther','aio','Together contains tog + e + ther.'],
  ['morphology','unbelievable','Very hard to believe.','unbeliev','a','ble','ieo','Unbelievable has -able after unbeliev-.'],
  ['morphology','reconstruction','Building something again.','reconstruc','t','ion','scp','Reconstruction is re- + construction.'],
  ['morphology','misbehaving','Acting in a way that is not acceptable.','misbehav','i','ng','aeo','Misbehaving is mis- + behaving.'],
  ['morphology','disconnection','A break in a connection.','disconnec','t','ion','dsc','Disconnection is dis- + connection.'],
  ['morphology','unforgettable','So special it is hard to forget.','unforg','e','ttable','aio','Unforgettable has double t, and begins un-.'],
  ['morphology','transformation','A major change in shape or appearance.','transfor','m','ation','pnr','Transformation combines trans- with formation.'],
];

const sort: SortRow[] = [
  ['syllables','computer','An electronic machine for working or learning.','bicycle','A two-wheeled vehicle you pedal.','Ends in -er','Ends in -le','Computer ends in -er; bicycle ends in -le.'],
  ['syllables','teacher','A person who helps people learn.','candle','A stick of wax that burns to give light.','Ends in -er','Ends in -le','Teacher ends in -er; candle ends in -le.'],
  ['syllables','number','A value used for counting.','purple','A colour made by mixing red and blue.','Ends in -er','Ends in -le','Number ends in -er; purple ends in -le.'],
  ['syllables','winter','The coldest season of the year in many places.','little','Small in size.','Ends in -er','Ends in -le','Winter ends in -er; little ends in -le.'],
  ['syllables','sister','A female sibling.','table','A piece of furniture with a flat top.','Ends in -er','Ends in -le','Sister ends in -er; table ends in -le.'],
  ['syllables','thunder','A loud rumbling sound during a storm.','turtle','An animal with a hard shell.','Ends in -er','Ends in -le','Thunder ends in -er; turtle ends in -le.'],
  ['morphology','reconsider','To think about a decision again.','unprepared','Not ready for something.','Has prefix re-','Has prefix un-','Re- means again; un- can mean not.'],
  ['morphology','misprint','A mistake in printed writing.','disagree','To have a different opinion.','Has prefix mis-','Has prefix dis-','Misprint begins mis-; disagree begins dis-.'],
  ['morphology','exploration','The act of examining an unfamiliar place.','enjoyment','The pleasure of doing something.','Ends in -tion','Ends in -ment','Exploration ends in -tion; enjoyment ends in -ment.'],
  ['morphology','washable','Able to be washed.','reversible','Able to be turned around or reversed.','Ends in -able','Ends in -ible','Washable ends in -able; reversible ends in -ible.'],
  ['morphology','preschool','Education before primary school.','postgraduate','Someone studying after completing a degree.','Has prefix pre-','Has prefix post-','Pre- means before; post- means after.'],
  ['morphology','brightness','The quality of giving a lot of light.','development','The process of growing or improving.','Ends in -ness','Ends in -ment','Brightness ends in -ness; development ends in -ment.'],
];

const rotate = (parts: string[]) => [...parts.slice(1), parts[0]];

export const VISUAL_SPELLING_BRIDGE_PUZZLES: readonly VisualSpellingPuzzle[] = [
  ...arrange.map(([stage, word, clue, parts, hint, learningNote]): VisualSpellingPuzzle => {
    const fragments = parts.split('|');
    if (fragments.length < 2 || fragments.join('') !== word) throw Error('Invalid written word parts: ' + word);
    return { id: 'bridge-' + stage + '-arrange-' + word, stage, kind: 'arrange', word, clue,
      tiles: rotate(fragments), hint, learningNote };
  }),
  ...choice.map(([stage, word, clue, error1, error2, error3, hint, learningNote]): VisualSpellingPuzzle => ({
    id: 'bridge-' + stage + '-choice-' + word, stage, kind: 'correct', word, clue,
    options: [error1, word, error2, error3], hint, learningNote,
  })),
  ...missing.map(([stage, word, clue, before, letter, after, distractors, learningNote]): VisualSpellingPuzzle => {
    if (before + letter + after !== word || letter.length !== 1 || distractors.length !== 3 ||
        distractors.includes(letter) || new Set(distractors).size !== 3) {
      throw Error('Invalid written word blank: ' + word);
    }
    return { id: 'bridge-' + stage + '-missing-' + word, stage, kind: 'missing', word, clue,
      before, missing: letter, after, choices: [distractors[0], letter, distractors[1], distractors[2]],
      hint: 'Study the letters before and after the blank.', learningNote };
  }),
  ...sort.map(([stage, word, clue, pairWord, pairClue, category, pairCategory, learningNote]): VisualSpellingPuzzle => ({
    id: 'bridge-' + stage + '-sort-' + word, stage, kind: 'sort', word, clue,
    categories: [category, pairCategory], answer: category, hint: 'Compare the written beginnings or endings.',
    pair: { word: pairWord, clue: pairClue, answer: pairCategory, learningNote }, learningNote,
  })),
];
