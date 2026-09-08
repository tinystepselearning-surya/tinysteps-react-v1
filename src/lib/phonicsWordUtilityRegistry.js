import { getPhonicsSound } from './phonicsSoundRegistry.js';
import { getPublishedPhonicsResourcePageByConceptId } from './phonicsPublicationRegistry.js';

const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);

export const PHONICS_WORD_UTILITY_REVISION = '2026-09-09-r13';
export const PHONICS_WORD_UTILITY_STATE = 'starter-curated';
export const PHONICS_WORD_HUMAN_REVIEW_STATE = 'pending';

const segment = (grapheme, soundId) => freeze({ grapheme, soundId });

function defineWord(config) {
  const word = String(config.word || '').trim().toLowerCase();
  const segments = freezeList(config.segments);
  const joined = segments.map((entry) => entry.grapheme.toLowerCase().replace(/[^a-z]/g, '')).join('');
  if (!word || joined !== word.replace(/[^a-z]/g, '')) {
    throw new Error(`R13 word segmentation does not reconstruct “${config.word}”: ${joined}`);
  }

  let phonemeCount = 0;
  for (const entry of segments) {
    const sound = getPhonicsSound(entry.soundId);
    if (!sound) throw new Error(`R13 word ${word} references unknown sound: ${entry.soundId}`);
    const spelling = entry.grapheme.toLowerCase();
    if (!sound.spellings.includes(spelling)) {
      throw new Error(`R13 word ${word} uses spelling “${spelling}” outside sound ${entry.soundId}.`);
    }
    phonemeCount += sound.phonemeCount;
  }

  const conceptIds = freezeList(config.conceptIds);
  for (const conceptId of conceptIds) {
    if (!getPublishedPhonicsResourcePageByConceptId(conceptId)) {
      throw new Error(`R13 word ${word} references an unpublished phonics concept: ${conceptId}`);
    }
  }

  return freeze({
    word,
    segments,
    soundChunkCount: segments.length,
    phonemeCount,
    meaning: config.meaning,
    exampleSentence: config.exampleSentence,
    trickyPart: config.trickyPart,
    conceptIds,
    relatedWords: freezeList(config.relatedWords),
    utilityState: PHONICS_WORD_UTILITY_STATE,
    humanReviewState: PHONICS_WORD_HUMAN_REVIEW_STATE,
    note: config.note ?? null,
  });
}

const WORDS = [
  { word: 'cat', segments: [segment('c', 'c-hard'), segment('a', 'short-a'), segment('t', 't')], meaning: 'a small animal often kept as a pet', exampleSentence: 'The cat sat on the mat.', trickyPart: 'The letter c is using its hard /k/ sound.', conceptIds: ['soft-c-hard-c'], relatedWords: ['cup', 'car', 'back'] },
  { word: 'map', segments: [segment('m', 'm'), segment('a', 'short-a'), segment('p', 'p')], meaning: 'a picture that shows where places are', exampleSentence: 'We looked at the map.', trickyPart: 'Each letter represents one sound in this simple CVC word.', conceptIds: [], relatedWords: ['cat', 'jam', 'back'] },
  { word: 'bed', segments: [segment('b', 'b'), segment('e', 'short-e'), segment('d', 'd')], meaning: 'a place used for sleeping', exampleSentence: 'The book is on the bed.', trickyPart: 'The middle vowel is the short e sound.', conceptIds: [], relatedWords: ['hen', 'cent', 'gem'] },
  { word: 'hen', segments: [segment('h', 'h'), segment('e', 'short-e'), segment('n', 'n')], meaning: 'an adult female chicken', exampleSentence: 'The hen has three chicks.', trickyPart: 'Listen for the short e sound in the middle.', conceptIds: [], relatedWords: ['bed', 'gem', 'quest'] },
  { word: 'sit', segments: [segment('s', 's'), segment('i', 'short-i'), segment('t', 't')], meaning: 'to rest with your body supported by a seat', exampleSentence: 'Please sit beside me.', trickyPart: 'The middle i is the short i sound.', conceptIds: [], relatedWords: ['pin', 'ship', 'thin'] },
  { word: 'pin', segments: [segment('p', 'p'), segment('i', 'short-i'), segment('n', 'n')], meaning: 'a small thin piece of metal with a sharp point', exampleSentence: 'She used a pin on the board.', trickyPart: 'Blend the three sounds without adding extra vowel sounds.', conceptIds: [], relatedWords: ['sit', 'ring', 'thin'] },
  { word: 'hot', segments: [segment('h', 'h'), segment('o', 'short-o'), segment('t', 't')], meaning: 'having a high temperature', exampleSentence: 'The soup is hot.', trickyPart: 'The o is the short o sound.', conceptIds: [], relatedWords: ['log', 'shop', 'knot'] },
  { word: 'log', segments: [segment('l', 'l'), segment('o', 'short-o'), segment('g', 'g-hard')], meaning: 'a thick piece of a tree trunk or branch', exampleSentence: 'The frog sat on a log.', trickyPart: 'The final g uses the hard /g/ sound.', conceptIds: ['soft-g-hard-g'], relatedWords: ['hot', 'song', 'dog'] },
  { word: 'sun', segments: [segment('s', 's'), segment('u', 'short-u'), segment('n', 'n')], meaning: 'the star that gives Earth light and heat', exampleSentence: 'The sun is bright today.', trickyPart: 'The middle u is the short u sound.', conceptIds: [], relatedWords: ['cup', 'turn', 'out'] },
  { word: 'cup', segments: [segment('c', 'c-hard'), segment('u', 'short-u'), segment('p', 'p')], meaning: 'a small container used for drinking', exampleSentence: 'Fill the cup with water.', trickyPart: 'C is hard /k/, and u is the short u sound.', conceptIds: ['soft-c-hard-c'], relatedWords: ['cat', 'sun', 'car'] },
  { word: 'jam', segments: [segment('j', 'j'), segment('a', 'short-a'), segment('m', 'm')], meaning: 'a sweet fruit spread', exampleSentence: 'I put jam on the toast.', trickyPart: 'The first sound /j/ is spelled with j.', conceptIds: ['j-sounds'], relatedWords: ['gem', 'map', 'badge'] },
  { word: 'yes', segments: [segment('y', 'y'), segment('e', 'short-e'), segment('s', 's')], meaning: 'a word used to agree or answer positively', exampleSentence: 'Yes, I can help.', trickyPart: 'Here y is a consonant sound at the beginning of the word.', conceptIds: [], relatedWords: ['gym', 'sit', 'zip'] },
  { word: 'zip', segments: [segment('z', 'z'), segment('i', 'short-i'), segment('p', 'p')], meaning: 'to fasten something with a zipper', exampleSentence: 'Zip up your bag.', trickyPart: 'The first sound is /z/.', conceptIds: [], relatedWords: ['yes', 'sit', 'his'] },
  { word: 'box', segments: [segment('b', 'b'), segment('o', 'short-o'), segment('x', 'x')], meaning: 'a container with flat sides', exampleSentence: 'The toy is in the box.', trickyPart: 'X commonly represents two phonemes, /k/ and /s/.', conceptIds: [], relatedWords: ['hot', 'log', 'cup'] },

  { word: 'back', segments: [segment('b', 'b'), segment('a', 'short-a'), segment('ck', 'k')], meaning: 'the rear part of something', exampleSentence: 'Put the book back on the shelf.', trickyPart: 'After the short a, the final /k/ is spelled ck.', conceptIds: ['ck-rule'], relatedWords: ['neck', 'chick', 'cat'] },
  { word: 'neck', segments: [segment('n', 'n'), segment('e', 'short-e'), segment('ck', 'k')], meaning: 'the part of the body between the head and shoulders', exampleSentence: 'The scarf is around my neck.', trickyPart: 'The final /k/ is spelled ck after a short vowel.', conceptIds: ['ck-rule'], relatedWords: ['back', 'chick', 'hen'] },
  { word: 'ship', segments: [segment('sh', 'sh'), segment('i', 'short-i'), segment('p', 'p')], meaning: 'a large boat that travels on water', exampleSentence: 'The ship sailed across the sea.', trickyPart: 'SH is one grapheme representing one consonant sound.', conceptIds: ['digraph-sh'], relatedWords: ['shop', 'chick', 'thin'] },
  { word: 'shop', segments: [segment('sh', 'sh'), segment('o', 'short-o'), segment('p', 'p')], meaning: 'a place where things are sold', exampleSentence: 'We went to the shop.', trickyPart: 'Keep sh together as one sound-spelling unit.', conceptIds: ['digraph-sh'], relatedWords: ['ship', 'hot', 'chat'] },
  { word: 'chat', segments: [segment('ch', 'ch'), segment('a', 'short-a'), segment('t', 't')], meaning: 'to talk in a friendly informal way', exampleSentence: 'We had a short chat.', trickyPart: 'CH works together for the first sound.', conceptIds: ['digraph-ch'], relatedWords: ['chick', 'ship', 'match'] },
  { word: 'chick', segments: [segment('ch', 'ch'), segment('i', 'short-i'), segment('ck', 'k')], meaning: 'a baby bird, especially a young chicken', exampleSentence: 'The chick followed the hen.', trickyPart: 'The word begins with ch and ends with ck; both are multi-letter spellings.', conceptIds: ['digraph-ch', 'ck-rule'], relatedWords: ['chat', 'back', 'ship'] },
  { word: 'match', segments: [segment('m', 'm'), segment('a', 'short-a'), segment('tch', 'ch')], meaning: 'a small stick used to make a flame, or something that pairs well', exampleSentence: 'The two socks are a match.', trickyPart: 'The final /ch/ is spelled tch after the short vowel.', conceptIds: ['digraph-tch'], relatedWords: ['chat', 'chick', 'back'] },
  { word: 'thin', segments: [segment('th', 'th-unvoiced'), segment('i', 'short-i'), segment('n', 'n')], meaning: 'not thick', exampleSentence: 'The paper is very thin.', trickyPart: 'TH is unvoiced here; feel the airflow without voice.', conceptIds: ['digraph-th'], relatedWords: ['this', 'ship', 'pin'] },
  { word: 'this', segments: [segment('th', 'th-voiced'), segment('i', 'short-i'), segment('s', 's')], meaning: 'a word used to point to something nearby', exampleSentence: 'This is my book.', trickyPart: 'TH is voiced here, unlike the th in thin.', conceptIds: ['digraph-th'], relatedWords: ['thin', 'his', 'sit'] },
  { word: 'ring', segments: [segment('r', 'r'), segment('i', 'short-i'), segment('ng', 'ng')], meaning: 'a small circular band, often worn on a finger', exampleSentence: 'The ring is shiny.', trickyPart: 'NG works together for the final nasal sound.', conceptIds: ['digraph-ng'], relatedWords: ['song', 'pin', 'sing'] },
  { word: 'song', segments: [segment('s', 's'), segment('o', 'short-o'), segment('ng', 'ng')], meaning: 'music with words that are sung', exampleSentence: 'We learned a new song.', trickyPart: 'The final ng is one grapheme for the nasal sound.', conceptIds: ['digraph-ng'], relatedWords: ['ring', 'hot', 'shop'] },
  { word: 'quest', segments: [segment('qu', 'qu'), segment('e', 'short-e'), segment('s', 's'), segment('t', 't')], meaning: 'a search or journey to achieve something', exampleSentence: 'The hero began a quest.', trickyPart: 'QU is one spelling chunk here but commonly represents two phonemes, /k/ + /w/.', conceptIds: ['qu-sound'], relatedWords: ['queen', 'bed', 'wrist'] },
  { word: 'whip', segments: [segment('wh', 'wh-hw'), segment('i', 'short-i'), segment('p', 'p')], meaning: 'a flexible strip used for striking or making a quick movement', exampleSentence: 'The rope can whip in the wind.', trickyPart: 'Some accents distinguish wh from w; others pronounce them the same.', conceptIds: [], relatedWords: ['wrist', 'ship', 'pin'], note: 'Accent-sensitive WH example.' },

  { word: 'rain', segments: [segment('r', 'r'), segment('ai', 'long-a'), segment('n', 'n')], meaning: 'water that falls from clouds', exampleSentence: 'The rain stopped before lunch.', trickyPart: 'AI is the long-a spelling in the middle of the word.', conceptIds: ['vowel-team-ai'], relatedWords: ['train', 'day', 'boat'] },
  { word: 'train', segments: [segment('t', 't'), segment('r', 'r'), segment('ai', 'long-a'), segment('n', 'n')], meaning: 'a group of connected railway vehicles', exampleSentence: 'The train arrived on time.', trickyPart: 'Keep ai together while blending the word.', conceptIds: ['vowel-team-ai'], relatedWords: ['rain', 'road', 'team'] },
  { word: 'day', segments: [segment('d', 'd'), segment('ay', 'long-a')], meaning: 'a period of twenty-four hours, or the light part of it', exampleSentence: 'It is a sunny day.', trickyPart: 'AY represents the long-a sound at the end of this word.', conceptIds: [], relatedWords: ['rain', 'train', 'toy'] },
  { word: 'seed', segments: [segment('s', 's'), segment('ee', 'long-e'), segment('d', 'd')], meaning: 'the part of a plant from which a new plant can grow', exampleSentence: 'We planted a seed.', trickyPart: 'EE is one grapheme for the long-e sound.', conceptIds: ['vowel-team-ee'], relatedWords: ['green', 'team', 'beach'] },
  { word: 'green', segments: [segment('g', 'g-hard'), segment('r', 'r'), segment('ee', 'long-e'), segment('n', 'n')], meaning: 'the colour of fresh grass', exampleSentence: 'The leaf is green.', trickyPart: 'EE stays together as the long-e vowel team.', conceptIds: ['vowel-team-ee'], relatedWords: ['seed', 'team', 'road'] },
  { word: 'team', segments: [segment('t', 't'), segment('ea', 'long-e'), segment('m', 'm')], meaning: 'a group of people working or playing together', exampleSentence: 'Our team played well.', trickyPart: 'EA has the long-e reading in this word; EA can have other readings in other words.', conceptIds: ['vowel-team-ea'], relatedWords: ['beach', 'seed', 'green'] },
  { word: 'beach', segments: [segment('b', 'b'), segment('ea', 'long-e'), segment('ch', 'ch')], meaning: 'a sandy or pebbly shore beside water', exampleSentence: 'We walked along the beach.', trickyPart: 'EA is long e here, and ch is the final consonant digraph.', conceptIds: ['vowel-team-ea', 'digraph-ch'], relatedWords: ['team', 'chick', 'boat'] },
  { word: 'night', segments: [segment('n', 'n'), segment('igh', 'long-i'), segment('t', 't')], meaning: 'the dark part of the day', exampleSentence: 'The stars shine at night.', trickyPart: 'IGH is a three-letter spelling for the long-i sound.', conceptIds: [], relatedWords: ['light', 'rain', 'road'] },
  { word: 'light', segments: [segment('l', 'l'), segment('igh', 'long-i'), segment('t', 't')], meaning: 'brightness that lets us see', exampleSentence: 'Turn on the light.', trickyPart: 'The letters igh stay together for the long-i sound.', conceptIds: [], relatedWords: ['night', 'boat', 'seed'] },
  { word: 'boat', segments: [segment('b', 'b'), segment('oa', 'long-o'), segment('t', 't')], meaning: 'a small vessel used for travelling on water', exampleSentence: 'The boat crossed the lake.', trickyPart: 'OA is one grapheme for long o.', conceptIds: ['vowel-team-oa'], relatedWords: ['road', 'ship', 'rain'] },
  { word: 'road', segments: [segment('r', 'r'), segment('oa', 'long-o'), segment('d', 'd')], meaning: 'a way for vehicles and people to travel', exampleSentence: 'The road curves near the hill.', trickyPart: 'Keep oa together for the long-o sound.', conceptIds: ['vowel-team-oa'], relatedWords: ['boat', 'train', 'sofa'] },
  { word: 'snow', segments: [segment('s', 's'), segment('n', 'n'), segment('ow', 'long-o')], meaning: 'soft white ice crystals that fall from clouds', exampleSentence: 'Fresh snow covered the ground.', trickyPart: 'OW has the long-o reading here; the same spelling has the /ow/ reading in cow.', conceptIds: [], relatedWords: ['cow', 'road', 'boat'] },
  { word: 'cue', segments: [segment('c', 'c-hard'), segment('ue', 'long-u-yoo')], meaning: 'a signal that tells someone when to act', exampleSentence: 'That was my cue to begin.', trickyPart: 'UE carries the /yoo/ long-u reading here.', conceptIds: [], relatedWords: ['glue', 'fruit', 'suit'] },
  { word: 'glue', segments: [segment('g', 'g-hard'), segment('l', 'l'), segment('ue', 'long-u-oo')], meaning: 'a sticky substance used to join things', exampleSentence: 'Use glue to fix the paper.', trickyPart: 'UE has the /oo/ reading here rather than /yoo/.', conceptIds: [], relatedWords: ['cue', 'fruit', 'moon'] },

  { word: 'knot', segments: [segment('kn', 'kn-n'), segment('o', 'short-o'), segment('t', 't')], meaning: 'a fastening made by tying rope, string or another flexible material', exampleSentence: 'Tie a knot in the rope.', trickyPart: 'The k in kn is silent; kn represents the initial /n/ sound.', conceptIds: ['digraph-kn'], relatedWords: ['gnat', 'wrist', 'hot'] },
  { word: 'gnat', segments: [segment('gn', 'gn-n'), segment('a', 'short-a'), segment('t', 't')], meaning: 'a very small flying insect', exampleSentence: 'A gnat flew near the light.', trickyPart: 'The g is silent in the initial gn spelling.', conceptIds: [], relatedWords: ['knot', 'cat', 'wrist'] },
  { word: 'wrist', segments: [segment('wr', 'wr-r'), segment('i', 'short-i'), segment('s', 's'), segment('t', 't')], meaning: 'the joint between the hand and the arm', exampleSentence: 'She wore a band on her wrist.', trickyPart: 'The w is silent in the initial wr spelling.', conceptIds: [], relatedWords: ['knot', 'whip', 'sit'] },
  { word: 'cent', segments: [segment('c', 'soft-c'), segment('e', 'short-e'), segment('n', 'n'), segment('t', 't')], meaning: 'a unit of money equal to one hundredth of a dollar', exampleSentence: 'The coin is worth one cent.', trickyPart: 'C is soft /s/ before e in this word.', conceptIds: ['soft-c-hard-c'], relatedWords: ['cat', 'gem', 'bed'] },
  { word: 'gem', segments: [segment('g', 'soft-g'), segment('e', 'short-e'), segment('m', 'm')], meaning: 'a precious or attractive stone', exampleSentence: 'The blue gem sparkled.', trickyPart: 'G is soft /j/ before e in this word.', conceptIds: ['soft-g-hard-g', 'j-sounds'], relatedWords: ['gym', 'jam', 'cent'] },
  { word: 'gym', segments: [segment('g', 'soft-g'), segment('y', 'short-i'), segment('m', 'm')], meaning: 'a place used for exercise or sports', exampleSentence: 'We played a game in the gym.', trickyPart: 'G is soft /j/, while y is acting as the short-i vowel sound.', conceptIds: ['soft-g-hard-g', 'j-sounds', 'y-secret-vowel'], relatedWords: ['gem', 'yes', 'sit'] },
  { word: 'his', segments: [segment('h', 'h'), segment('i', 'short-i'), segment('s', 'z-spelled-s')], meaning: 'belonging to a male person or animal', exampleSentence: 'That is his hat.', trickyPart: 'The final s is pronounced /z/ in this word.', conceptIds: [], relatedWords: ['this', 'zip', 'sit'] },
  { word: 'badge', segments: [segment('b', 'b'), segment('a', 'short-a'), segment('dge', 'j')], meaning: 'a small sign or emblem worn or displayed to show membership or achievement', exampleSentence: 'She earned a reading badge.', trickyPart: 'The final /j/ sound is spelled dge.', conceptIds: ['j-sounds'], relatedWords: ['jam', 'gem', 'back'] },
  { word: 'graph', segments: [segment('g', 'g-hard'), segment('r', 'r'), segment('a', 'short-a'), segment('ph', 'f')], meaning: 'a diagram that shows information using lines, bars or points', exampleSentence: 'We drew a graph of the results.', trickyPart: 'PH represents the /f/ sound in this word, so the existing /f/ sound unit is reused.', conceptIds: [], relatedWords: ['jam', 'rain', 'book'] },

  { word: 'book', segments: [segment('b', 'b'), segment('oo', 'oo-short'), segment('k', 'k')], meaning: 'a set of written or printed pages fastened together', exampleSentence: 'I chose a new book.', trickyPart: 'OO has the shorter vowel sound heard in book.', conceptIds: ['diphthong-oo'], relatedWords: ['moon', 'bush', 'boot'] },
  { word: 'bush', segments: [segment('b', 'b'), segment('u', 'oo-short'), segment('sh', 'sh')], meaning: 'a low woody plant with many branches', exampleSentence: 'A bird hid in the bush.', trickyPart: 'The u has the same vowel sound family as the oo in book, and sh forms the final sound.', conceptIds: ['diphthong-oo', 'digraph-sh'], relatedWords: ['book', 'ship', 'moon'] },
  { word: 'boot', segments: [segment('b', 'b'), segment('oo', 'oo-long'), segment('t', 't')], meaning: 'a strong shoe that covers the foot and sometimes the ankle', exampleSentence: 'My boot is muddy.', trickyPart: 'OO has the longer /oo/ sound here.', conceptIds: ['diphthong-oo'], relatedWords: ['moon', 'book', 'glue'] },
  { word: 'moon', segments: [segment('m', 'm'), segment('oo', 'oo-long'), segment('n', 'n')], meaning: 'the natural object that moves around Earth', exampleSentence: 'The moon looked bright.', trickyPart: 'This oo is the long /oo/ sound, not the sound in book.', conceptIds: ['diphthong-oo'], relatedWords: ['boot', 'book', 'glue'] },
  { word: 'soil', segments: [segment('s', 's'), segment('oi', 'oi-oy'), segment('l', 'l')], meaning: 'the top layer of earth in which plants grow', exampleSentence: 'The seed grew in the soil.', trickyPart: 'OI represents the /oy/ vowel sound inside the word.', conceptIds: ['diphthong-oi-oy'], relatedWords: ['toy', 'seed', 'rain'] },
  { word: 'toy', segments: [segment('t', 't'), segment('oy', 'oi-oy')], meaning: 'an object made for play', exampleSentence: 'The child picked up the toy.', trickyPart: 'OY represents the /oy/ sound at the end of the word.', conceptIds: ['diphthong-oi-oy'], relatedWords: ['soil', 'day', 'boat'] },
  { word: 'out', segments: [segment('ou', 'ou-ow'), segment('t', 't')], meaning: 'away from the inside of a place or thing', exampleSentence: 'We went out to play.', trickyPart: 'OU represents the /ow/ sound here.', conceptIds: ['diphthong-ou-ow'], relatedWords: ['cow', 'about', 'haul'] },
  { word: 'cow', segments: [segment('c', 'c-hard'), segment('ow', 'ou-ow')], meaning: 'an adult female cattle animal', exampleSentence: 'The cow ate grass.', trickyPart: 'OW represents the /ow/ sound here; it can represent long o in other words.', conceptIds: ['diphthong-ou-ow', 'soft-c-hard-c'], relatedWords: ['out', 'boat', 'cat'] },
  { word: 'haul', segments: [segment('h', 'h'), segment('au', 'aw-au'), segment('l', 'l')], meaning: 'to pull or carry something heavy', exampleSentence: 'They haul the boxes inside.', trickyPart: 'AU is in the /aw/ vowel family in this word.', conceptIds: ['diphthong-au-aw'], relatedWords: ['hawk', 'out', 'car'] },
  { word: 'hawk', segments: [segment('h', 'h'), segment('aw', 'aw-au'), segment('k', 'k')], meaning: 'a bird of prey with sharp eyesight', exampleSentence: 'A hawk flew above the field.', trickyPart: 'AW represents the same broad vowel family as au in haul.', conceptIds: ['diphthong-au-aw'], relatedWords: ['haul', 'fork', 'book'] },

  { word: 'car', segments: [segment('c', 'c-hard'), segment('ar', 'ar')], meaning: 'a road vehicle with four wheels', exampleSentence: 'The car is parked outside.', trickyPart: 'AR forms the r-controlled vowel part of the word.', conceptIds: ['r-controlled-ar', 'soft-c-hard-c'], relatedWords: ['star', 'fork', 'cow'] },
  { word: 'star', segments: [segment('s', 's'), segment('t', 't'), segment('ar', 'ar')], meaning: 'a bright object seen in the night sky', exampleSentence: 'We saw a bright star.', trickyPart: 'AR is kept together as the r-controlled vowel spelling.', conceptIds: ['r-controlled-ar'], relatedWords: ['car', 'night', 'storm'] },
  { word: 'fork', segments: [segment('f', 'f'), segment('or', 'or'), segment('k', 'k')], meaning: 'a tool with prongs used for eating or lifting food', exampleSentence: 'Use a fork for the pasta.', trickyPart: 'OR forms the r-controlled vowel part.', conceptIds: ['r-controlled-or'], relatedWords: ['storm', 'car', 'hawk'] },
  { word: 'storm', segments: [segment('s', 's'), segment('t', 't'), segment('or', 'or'), segment('m', 'm')], meaning: 'severe weather with strong wind, rain, thunder or snow', exampleSentence: 'The storm passed at night.', trickyPart: 'Keep or together while blending the middle of the word.', conceptIds: ['r-controlled-or'], relatedWords: ['fork', 'star', 'rain'] },
  { word: 'herd', segments: [segment('h', 'h'), segment('er', 'er-ir-ur'), segment('d', 'd')], meaning: 'a group of animals of the same kind', exampleSentence: 'A herd of cows crossed the field.', trickyPart: 'ER belongs to the r-controlled er/ir/ur sound family.', conceptIds: ['r-controlled-er-ir-ur'], relatedWords: ['bird', 'turn', 'cow'] },
  { word: 'bird', segments: [segment('b', 'b'), segment('ir', 'er-ir-ur'), segment('d', 'd')], meaning: 'an animal with feathers, wings and a beak', exampleSentence: 'The bird sat on a branch.', trickyPart: 'IR can represent the same r-controlled vowel family as er and ur.', conceptIds: ['r-controlled-er-ir-ur'], relatedWords: ['herd', 'turn', 'bush'] },
  { word: 'turn', segments: [segment('t', 't'), segment('ur', 'er-ir-ur'), segment('n', 'n')], meaning: 'to move so that you face a different direction', exampleSentence: 'Turn to the next page.', trickyPart: 'UR shares the r-controlled sound family with er and ir.', conceptIds: ['r-controlled-er-ir-ur'], relatedWords: ['bird', 'herd', 'sun'] },
  { word: 'pair', segments: [segment('p', 'p'), segment('air', 'air')], meaning: 'two things that belong or are used together', exampleSentence: 'I found a pair of socks.', trickyPart: 'AIR is treated as one stored sound-spelling chunk; pronunciation varies by accent.', conceptIds: [], relatedWords: ['hear', 'car', 'day'], note: 'Accent-sensitive vowel+r example.' },
  { word: 'hear', segments: [segment('h', 'h'), segment('ear', 'ear')], meaning: 'to notice sound with your ears', exampleSentence: 'Can you hear the bell?', trickyPart: 'EAR is one stored vowel+r chunk here; its pronunciation varies by accent and by word.', conceptIds: [], relatedWords: ['pair', 'herd', 'team'], note: 'Accent-sensitive vowel+r example.' },
  { word: 'lure', segments: [segment('l', 'l'), segment('ure', 'ure')], meaning: 'something used to attract a person or animal', exampleSentence: 'The shiny lure attracted the fish.', trickyPart: 'URE is accent-sensitive and can be pronounced differently by speakers.', conceptIds: [], relatedWords: ['cue', 'hear', 'glue'], note: 'Accent-sensitive URE example.' },

  { word: 'fruit', segments: [segment('f', 'f'), segment('r', 'r'), segment('ui', 'long-u-oo'), segment('t', 't')], meaning: 'the part of a plant that contains seeds and is often eaten', exampleSentence: 'We packed fruit for lunch.', trickyPart: 'UI has the /oo/ reading in fruit; UI can have another reading in words such as build.', conceptIds: ['vowel-team-ui'], relatedWords: ['suit', 'glue', 'food'] },
  { word: 'suit', segments: [segment('s', 's'), segment('ui', 'long-u-oo'), segment('t', 't')], meaning: 'a set of matching clothes, usually a jacket and trousers or skirt', exampleSentence: 'He wore a blue suit.', trickyPart: 'UI has the /oo/ reading in this word.', conceptIds: ['vowel-team-ui'], relatedWords: ['fruit', 'glue', 'boot'] },
  { word: 'about', segments: [segment('a', 'schwa'), segment('b', 'b'), segment('ou', 'ou-ow'), segment('t', 't')], meaning: 'on the subject of something, or approximately', exampleSentence: 'We read a book about space.', trickyPart: 'The first a is an unstressed schwa; ou later in the word has the /ow/ reading.', conceptIds: ['schwa-lazy-vowel', 'diphthong-ou-ow'], relatedWords: ['sofa', 'out', 'book'] },
  { word: 'sofa', segments: [segment('s', 's'), segment('o', 'long-o'), segment('f', 'f'), segment('a', 'schwa')], meaning: 'a long comfortable seat for more than one person', exampleSentence: 'The cat slept on the sofa.', trickyPart: 'The final a is unstressed and reduced to schwa.', conceptIds: ['schwa-lazy-vowel'], relatedWords: ['about', 'road', 'cat'] },
];

export const PHONICS_WORD_UTILITY_RECORDS = freezeList(WORDS.map(defineWord));

const words = PHONICS_WORD_UTILITY_RECORDS.map((record) => record.word);
if (new Set(words).size !== words.length) throw new Error('R13 word utility registry contains duplicate words.');
if (PHONICS_WORD_UTILITY_RECORDS.some((record) => record.humanReviewState !== 'pending')) {
  throw new Error('R13 starter word utility must not manufacture human-review approval.');
}

const byWord = new Map(PHONICS_WORD_UTILITY_RECORDS.map((record) => [record.word, record]));

export function normalizePhonicsWordQuery(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z]/g, '');
}

export function getPhonicsWordUtility(value) {
  return byWord.get(normalizePhonicsWordQuery(value)) ?? null;
}

export function searchPhonicsWordUtilities(value, limit = 8) {
  const query = normalizePhonicsWordQuery(value);
  if (!query) return freezeList(PHONICS_WORD_UTILITY_RECORDS.slice(0, Math.max(1, limit)));
  const matches = PHONICS_WORD_UTILITY_RECORDS
    .filter((record) => record.word.startsWith(query) || record.word.includes(query))
    .sort((a, b) => Number(b.word === query) - Number(a.word === query) || a.word.localeCompare(b.word))
    .slice(0, Math.max(1, limit));
  return freezeList(matches);
}

export function getPhonicsWordUtilitiesByConceptId(conceptId) {
  return freezeList(PHONICS_WORD_UTILITY_RECORDS.filter((record) => record.conceptIds.includes(String(conceptId || ''))));
}

export function getPhonicsWordSoundCategories(record) {
  const categories = record.segments.map((entry) => getPhonicsSound(entry.soundId)?.category).filter(Boolean);
  return freezeList([...new Set(categories)]);
}
