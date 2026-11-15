/**
 * Editor-curated second and third rounds for the sound-free spelling lab.
 * Each stage has 16 extra tasks (4 of each mode) and keeps its original
 * eight-item introductory round. Words/notes are explicit, not generated
 * through phoneme guesses or dictionary APIs.
 */
import type { VisualSpellingPuzzle, VisualSpellingStage } from './visualSpellingPuzzles';

type Stage = VisualSpellingStage;
type ArrangeRow = [Stage, string, string, string, string, string];
type ChoiceRow = [Stage, string, string, string, string, string, string, string];
type MissingRow = [Stage, string, string, number, string, string, string];
type SortRow = [Stage, string, string, string, string, string, string, string];

const arrangeRows: ArrangeRow[] = [
  ['explorer','window','You can look outside through this part of a wall.','win|dow','It begins with win-.','Window has two written parts: win + dow.'],
  ['explorer','garden','A place where flowers and vegetables can grow.','gar|den','It begins with gar-.','Garden is written gar + den.'],
  ['explorer','blanket','Something soft that keeps you warm in bed.','blan|ket','The first part has the blend bl.','Blanket starts with bl and has seven letters.'],
  ['explorer','playground','A place where children can climb, swing and play.','play|ground','It is a compound word.','Playground joins play + ground into one word.'],
  ['builder','replay','To play a game or video again.','re|play','The prefix means again.','The prefix re- means again: re + play.'],
  ['builder','helpful','Ready to give help to someone.','help|ful','It ends with the suffix -ful.','Helpful is help + ful; the suffix has one final l.'],
  ['builder','quietly','Without making much noise.','quiet|ly','Add an adverb ending.','Quietly is quiet + ly; -ly can tell us how an action happens.'],
  ['builder','powerful','Having a lot of strength or force.','power|ful','The ending has one l.','Powerful combines power + ful.'],
  ['expert','dishonest','Not telling the truth.','dis|honest','A prefix means not or the opposite.','Dishonest is dis + honest; dis- reverses the meaning.'],
  ['expert','misspelling','A word written with incorrect letters.','mis|spell|ing','Notice the two s letters at the join.','Misspelling is mis + spell + ing; the prefix and root meet at ss.'],
  ['expert','encouragement','Kind words that give someone confidence.','en|courage|ment','Look for the ending -ment.','Encouragement is en + courage + ment.'],
  ['expert','incomplete','Not finished or missing a part.','in|complete','A prefix means not.','Incomplete is in + complete.'],
  ['master','photosynthesis','The process plants use to make food with light.','photo|synthesis','It has a part related to light.','Photo- relates to light; photosynthesis is photo + synthesis.'],
  ['master','autobiography','A story someone writes about their own life.','auto|bio|graphy','It has parts meaning self, life and writing.','Auto means self, bio means life, and graphy refers to writing.'],
  ['master','interconnection','A link between two or more things.','inter|connect|ion','Start with the prefix inter-.','Interconnection is inter + connect + ion.'],
  ['master','miscommunication','A failure to share information clearly.','mis|communication','The prefix mis- means wrongly.','Miscommunication combines mis- with communication.'],
];

const choiceRows: ChoiceRow[] = [
  ['explorer','animal','A living creature such as a dog, bird or elephant.','animel','anamal','annimal','Look for a-n-i at the beginning.','Animal is spelled a-n-i-m-a-l.'],
  ['explorer','library','A place where people can borrow and read books.','libary','liberry','librery','There are two r letters.','Library is spelled l-i-b-r-a-r-y.'],
  ['explorer','tomorrow','The day after today.','tommorow','tommorrow','tomorow','There is one m and two r letters.','Tomorrow has one m and two r letters.'],
  ['explorer','weather','What it is like outside: sunny, rainy or windy.','wether','weither','wheather','It begins wea-.','Weather is w-e-a-t-h-e-r, not whether.'],
  ['builder','reusable','Able to be used again.','reuseable','reusible','reusabel','The final e of reuse is dropped before -able.','Reusable uses reuse + able with the silent e dropped.'],
  ['builder','hopeless','Having little or no hope.','hopless','hoapless','hopeles','Look for hope + less.','Hopeless keeps the e in hope before -less.'],
  ['builder','enjoyable','Pleasant or fun.','enjoyible','enjoyabel','enjoyeable','It ends in -able.','Enjoyable is enjoy + able.'],
  ['builder','running','Moving fast on your feet.','runing','runnning','runinng','The n doubles before -ing.','Running doubles the final n of run before -ing.'],
  ['expert','rhythm','A regular pattern of beats in music.','rythm','rhythym','rhythem','Look carefully at rh- and -thm.','Rhythm starts with rh and ends in thm.'],
  ['expert','recommend','To suggest something as a good choice.','recomend','reccomend','recommmend','It has one c and two m letters.','Recommend has one c and two m letters.'],
  ['expert','embarrass','To make someone feel uncomfortable or shy.','embarass','embarras','embarrasss','It has double r and double s.','Embarrass has two r letters and two s letters.'],
  ['expert','restaurant','A place where meals are prepared and served.','restraunt','restuarant','resturant','Notice the -au- near the middle.','Restaurant is r-e-s-t-a-u-r-a-n-t.'],
  ['master','entrepreneurship','The work of starting and running a business.','entreprenurship','entrepreneurshipp','enterpreneurship','Look for entrepreneur + ship.','Entrepreneurship builds on entrepreneur with the suffix -ship.'],
  ['master','responsibility','A duty you are expected to take care of.','responsability','responsibilty','responcibility','It ends in -ibility.','Responsibility is spelled with -sibility, not -sability.'],
  ['master','collaboration','Working together on a shared task.','colaboration','collaberation','collabration','It has double l and -oration.','Collaboration begins collab- and ends -oration.'],
  ['master','pronunciation','The way a word is spoken.','pronounciation','pronuncation','pronunsiation','The middle part is -nunci-, not -nounci-.','Pronunciation is spelled p-r-o-n-u-n-c-i-a-t-i-o-n.'],
];

const missingRows: MissingRow[] = [
  ['explorer','umbrella','Something you hold over your head in the rain.',5,'nrs','Look for the double l near the end.','Umbrella has two l letters before a.'],
  ['explorer','sandwich','Bread with a filling between slices.',4,'nat','The word begins sandw-.','Sandwich is s-a-n-d-w-i-c-h.'],
  ['explorer','breakfast','The first meal of the day.',3,'iou','The first part is break-.','Breakfast starts with break and ends in fast.'],
  ['explorer','mountain','A very high natural hill.',2,'aio','It starts mou-.','Mountain begins m-o-u.'],
  ['builder','beginning','The start of something.',4,'mpt','The middle n is doubled.','Beginning doubles n before -ing.'],
  ['builder','happily','In a cheerful or joyful way.',4,'eou','Happy changes y to i before -ly.','Happily is happy with y changed to i before -ly.'],
  ['builder','disappear','To go out of sight.',3,'iou','It has the prefix dis-.','Disappear is dis + appear.'],
  ['builder','peaceful','Calm and without trouble.',2,'iow','It begins pea-.','Peaceful is peace + ful.'],
  ['expert','successful','Achieving what you hoped to do.',3,'xsk','Look for the doubled c and s.','Successful has double c and double s.'],
  ['expert','experience','Knowledge gained by doing or seeing things.',3,'aou','It begins expe-.','Experience is e-x-p-e-r-i-e-n-c-e.'],
  ['expert','knowledge','Information and understanding you have learned.',0,'cnr','A silent k comes first.','Knowledge begins with kn, although k is silent.'],
  ['expert','occurrence','An event or something that happens.',2,'xsu','It has double c and double r.','Occurrence has two c letters and two r letters.'],
  ['master','environmentally','In a way that affects the natural world.',6,'aiu','Keep the n in environ-.','Environmentally builds from environmental + ly.'],
  ['master','simultaneously','Happening at the same time.',4,'eou','Look for simultan-.','Simultaneously is spelled with simultan- and -eously.'],
  ['master','indispensable','So useful that it cannot be done without.',5,'ait','It has the word dispense inside the root.','Indispensable is in + dispens + able.'],
  ['master','accomplishment','Something you worked hard and succeeded in doing.',2,'bkq','The first part has double c.','Accomplishment begins acc- and ends -ment.'],
];

const sortRows: SortRow[] = [
  ['explorer','playing','Doing something for fun right now.','played','Did something for fun earlier.','Ends in -ing','Ends in -ed','Playing ends in -ing; played ends in -ed.'],
  ['explorer','taller','More tall than someone else.','tallest','The most tall in a group.','Ends in -er','Ends in -est','Taller compares two; tallest compares the whole group.'],
  ['explorer','kindly','In a kind way.','kindness','The quality of being kind.','Ends in -ly','Ends in -ness','Kindly ends in -ly, while kindness ends in -ness.'],
  ['explorer','teacher','Someone who helps children learn.','teaching','The act of helping someone learn.','Ends in -er','Ends in -ing','Teacher ends in -er; teaching ends in -ing.'],
  ['builder','redo','Do something again.','unfair','Not treating people equally.','Has prefix re-','Has prefix un-','Re- means again; un- can mean not.'],
  ['builder','useful','Able to help or serve a purpose.','useless','Having little or no use.','Ends in -ful','Ends in -less','Useful ends in -ful; useless ends in -less.'],
  ['builder','happiness','The feeling of being happy.','enjoyment','Pleasure from something you enjoy.','Ends in -ness','Ends in -ment','Happiness changes happy to happi + ness; enjoyment is enjoy + ment.'],
  ['builder','untidy','Not neat or organised.','rewrite','Write something again.','Has prefix un-','Has prefix re-','Untidy begins un-; rewrite begins re-.'],
  ['expert','discussion','A conversation about a topic.','decision','A choice you make after thinking.','Ends in -ssion','Ends in -sion','Discussion ends in -ssion; decision ends in -sion.'],
  ['expert','important','Something that matters a lot.','independent','Able to act without help.','Ends in -ant','Ends in -ent','Important ends in -ant; independent ends in -ent.'],
  ['expert','disbelief','The feeling that something is not true.','misbehave','To act badly.','Has prefix dis-','Has prefix mis-','Dis- and mis- begin different words and can change meaning.'],
  ['expert','terrible','Very bad or unpleasant.','reliable','Able to be trusted.','Ends in -ible','Ends in -able','Terrible ends in -ible; reliable ends in -able.'],
  ['master','interconnected','Linked together.','transcontinental','Across a continent.','Has prefix inter-','Has prefix trans-','Inter- means between; trans- means across.'],
  ['master','preparation','Getting ready for something.','reconsideration','Thinking about a choice again.','Has prefix pre-','Has prefix re-','Pre- can mean before; re- means again.'],
  ['master','cartography','The art and science of making maps.','biology','The study of living things.','Ends in -graphy','Ends in -logy','Cartography ends in -graphy, while biology ends in -logy.'],
  ['master','representation','Showing or speaking for someone.','development','Growing or improving over time.','Ends in -tion','Ends in -ment','Representation ends in -tion; development ends in -ment.'],
];

export const VISUAL_SPELLING_EXTRA_PUZZLES: readonly VisualSpellingPuzzle[] = [
  ...arrangeRows.map(([stage, word, clue, parts, hint, learningNote]): VisualSpellingPuzzle => {
    const tokens = parts.includes('|') ? parts.split('|') : word.split('');
    if (tokens.join('') !== word || tokens.length < 2) throw Error('Invalid curated word parts: ' + word);
    return {
      id: 'extra-' + stage + '-arrange-' + word, stage, kind: 'arrange', word, clue,
      tiles: [...tokens.slice(1), tokens[0]], hint, learningNote,
    };
  }),
  ...choiceRows.map(([stage, word, clue, error1, error2, error3, hint, learningNote]): VisualSpellingPuzzle => ({
    id: 'extra-' + stage + '-choice-' + word, stage, kind: 'correct', word, clue,
    options: [error1, word, error2, error3], hint, learningNote,
  })),
  ...missingRows.map(([stage, word, clue, index, distractors, hint, learningNote]): VisualSpellingPuzzle => {
    const missing = word.charAt(index);
    if (!missing || distractors.length !== 3 || distractors.includes(missing)) throw Error('Invalid curated blank: ' + word);
    return {
      id: 'extra-' + stage + '-missing-' + word, stage, kind: 'missing', word, clue,
      before: word.slice(0, index), missing, after: word.slice(index + 1),
      choices: [distractors[0], missing, distractors[1], distractors[2]], hint, learningNote,
    };
  }),
  ...sortRows.map(([stage, word, clue, pairWord, pairClue, category, pairCategory, learningNote]): VisualSpellingPuzzle => ({
    id: 'extra-' + stage + '-sort-' + word, stage, kind: 'sort', word, clue,
    categories: [category, pairCategory], answer: category,
    pair: { word: pairWord, clue: pairClue, answer: pairCategory, learningNote },
    hint: 'Look closely at the beginning or ending of each written word.', learningNote,
  })),
];
