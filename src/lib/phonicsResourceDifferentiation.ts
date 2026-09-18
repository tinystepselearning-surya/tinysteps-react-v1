export type PhonicsResourceDifferentiation = Readonly<{
  learningOutcome: string;
  readingUse?: string;
  spellingUse?: string;
  boundarySummary: string;
}>;

const item = (value: PhonicsResourceDifferentiation) => Object.freeze(value);

export const PHONICS_RESOURCE_DIFFERENTIATION = Object.freeze({
  'ck-rule': item({
    learningOutcome: 'Read and spell common one-syllable words where /k/ follows a single short vowel and is written ck.',
    readingUse: 'Recognise ck as one grapheme for /k/ when decoding words such as back, neck, sick, rock and duck.',
    spellingUse: 'Use ck after a single short vowel in many one-syllable words, while checking words that use k or another spelling.',
    boundarySummary: 'Do not apply ck after every vowel or to every final /k/ sound. It is a useful short-vowel spelling generalisation, not a universal rule.',
  }),
  'floss-rule': item({
    learningOutcome: 'Recognise and spell many one-syllable short-vowel words that end in doubled ff, ll, ss or zz.',
    readingUse: 'Treat the doubled final letters as one consonant sound while decoding words such as puff, hill, miss and buzz.',
    spellingUse: 'Use the Floss pattern as a spelling clue after one short vowel in many one-syllable words.',
    boundarySummary: 'Do not double f, l, s or z in every word. Common exceptions such as if, gas and yes show that the mnemonic is a generalisation.',
  }),
  'qu-sound': item({
    learningOutcome: 'Read common qu words by recognising the written pair and blending the /k/ + /w/ sequence accurately.',
    readingUse: 'Recognise qu quickly in words such as quit, quiz, queen, quick and quack instead of treating q and u as unrelated letters.',
    spellingUse: 'Remember that q is commonly followed by u in familiar English words when representing the /kw/ pattern.',
    boundarySummary: 'Do not assume every qu word has exactly the same pronunciation. Less common and borrowed-word exceptions belong after the frequent /kw/ pattern is secure.',
  }),
  'digraph-ch': item({
    learningOutcome: 'Recognise ch as one grapheme and decode common /ch/ words without sounding c and h separately.',
    readingUse: 'Blend ch as one sound unit in words such as chat, chip, chop, much and rich.',
    spellingUse: 'Use ch as a common spelling for /ch/, while learning later when tch is the more likely ending.',
    boundarySummary: 'Do not assume ch always represents /ch/. Words such as chemist and chef belong to later alternative-pronunciation sets.',
  }),
  'digraph-sh': item({
    learningOutcome: 'Recognise sh as one grapheme and transfer that knowledge to unfamiliar beginning and ending positions.',
    readingUse: 'Blend sh as one sound in words such as ship, shop, fish, rush and shell.',
    spellingUse: 'Select sh as a common spelling for /sh/ in familiar early words after hearing the target sound.',
    boundarySummary: 'Do not read s and h separately when they form the taught digraph, and do not limit recognition to memorised word lists.',
  }),
  'digraph-th': item({
    learningOutcome: 'Read common th words while distinguishing the voiced and voiceless pronunciations through listening and articulation.',
    readingUse: 'Use tongue position and voicing to distinguish th in words such as thin, bath, this, that and then.',
    boundarySummary: 'Do not teach only one th pronunciation or classify a legitimate voiced/voiceless contrast as an exception. Accent should not be treated as a decoding error.',
  }),
  'digraph-ng': item({
    learningOutcome: 'Recognise ng as one grapheme for the final nasal sound and use it accurately in reading and spelling.',
    readingUse: 'Blend ng as one sound unit in words such as sing, ring, long, song and king.',
    spellingUse: 'Choose ng for the familiar final /ng/ sound rather than spelling the sound as separate n and hard g.',
    boundarySummary: 'Do not pronounce n and hard g separately in a taught ng word, and do not restrict recognition to memorised -ing endings.',
  }),
  'soft-c-hard-c': item({
    learningOutcome: 'Use the following letter as a clue to predict whether c is likely to represent /k/ or /s/ and then verify the word.',
    readingUse: 'Contrast hard c in cat and cup with soft c before e, i or y in words such as cent, city and cycle.',
    spellingUse: 'Use the soft-c/hard-c contrast to support word study, but retain the correct spelling of each known word.',
    boundarySummary: 'The e-i-y clue is useful, not absolute. Children should predict and check rather than assume every c before e, i or y is soft.',
  }),
  'vowel-team-ai': item({
    learningOutcome: 'Recognise ai as one grapheme for long a in common words and compare it with other long-a spellings.',
    readingUse: 'Decode ai as a long-a spelling in words such as rain, train, paint, mail and snail.',
    spellingUse: 'Use word position as a clue when choosing ai, while remembering that other long-a spellings occur in other positions.',
    boundarySummary: 'Do not treat ai and ay as interchangeable everywhere. Position is a useful tendency, not an exception-free rule.',
  }),
  'vowel-team-ee': item({
    learningOutcome: 'Recognise ee as one grapheme for long e and read common ee words automatically enough to compare alternate spellings later.',
    readingUse: 'Decode ee as long e in words such as see, green, feet, sleep and seed.',
    spellingUse: 'Retain ee as one common long-e spelling while learning that long e can also be written in other ways.',
    boundarySummary: 'Do not read the two e letters separately or assume every long-e word must be spelled with ee.',
  }),
  'vowel-team-ea': item({
    learningOutcome: 'Read common ea words by grouping them into controlled pronunciation families instead of forcing one sound onto every ea spelling.',
    readingUse: 'Begin with a secure ea family such as long e in team, seat and leaf, then add high-frequency contrasts such as head and break.',
    spellingUse: 'Keep the written ea spelling attached to each known word because pronunciation alone does not always identify the correct family.',
    boundarySummary: 'EA is variable. Do not teach every ea word as long e or mix several pronunciations before the first family is secure.',
  }),
  'vowel-team-ie': item({
    learningOutcome: 'Recognise ie as one spelling unit and read familiar long-i and long-e word families without assuming one fixed pronunciation.',
    readingUse: 'Group ie words by pronunciation so children can read a controlled family before comparing another accepted family.',
    spellingUse: 'Retain the correct ie spelling in familiar words while contrasting it with other spellings for the same vowel sound.',
    boundarySummary: 'Do not apply one pronunciation to every ie word. Long-i and long-e families should be taught separately before mixed practice.',
  }),
  'vowel-team-oa': item({
    learningOutcome: 'Recognise oa as one grapheme for long o in common words and use it alongside other long-o spelling knowledge.',
    readingUse: 'Decode oa as long o in words such as boat and road instead of sounding o and a separately.',
    spellingUse: 'Use oa as one common long-o spelling, often inside a word, while comparing other long-o spellings later.',
    boundarySummary: 'Do not assume every long-o word uses oa or that adjacent o and a must always represent the target sound.',
  }),
  'magic-e': item({
    learningOutcome: 'Read and compare common VCe words by noticing how final e changes the vowel pattern while remaining silent in the taught set.',
    readingUse: 'Contrast pairs such as cap/cape or kit/kite so the child sees the whole vowel-consonant-e pattern before blending.',
    spellingUse: 'Use the VCe pattern as one spelling option for long vowels in familiar words and compare it with other long-vowel spellings.',
    boundarySummary: 'Do not teach final e as a rule that always makes the first vowel long. English contains words and endings where final e serves a different role.',
  }),
  'rabbit-rule': item({
    learningOutcome: 'Split and read common two-syllable words with a VCCV pattern, using the doubled middle consonant as a syllable-division clue.',
    readingUse: 'Chunk words such as rabbit and kitten into manageable syllables instead of attempting the whole word at once.',
    spellingUse: 'Notice that doubled consonants can preserve a short vowel in the first syllable of many familiar two-syllable words.',
    boundarySummary: 'Do not apply the Rabbit pattern to every two-syllable word. It is one useful syllable structure among several.',
  }),
  'consonant-le': item({
    learningOutcome: 'Recognise a final consonant-le syllable and read it as a stable ending in familiar two-syllable words.',
    readingUse: 'Chunk the final consonant-le syllable rather than treating final e as Magic E in words such as little or table.',
    spellingUse: 'Notice the written consonant + le ending as a stable final syllable pattern in familiar words.',
    boundarySummary: 'Do not apply the Magic-E explanation to every final e. Consonant-le functions as a syllable ending and must be distinguished from VCe words.',
  }),
  'digraph-kn': item({
    learningOutcome: 'Read familiar initial kn words as beginning with /n/ while retaining the silent k in spelling.',
    readingUse: 'Recognise kn as the written pattern for /n/ at the start of words such as knit, knot, knock and knee.',
    spellingUse: 'Keep the k in known kn words even though it is not heard as a separate sound.',
    boundarySummary: 'Do not add a /k/ sound before /n/, and do not remove k from the spelling simply because it is silent.',
  }),
  'digraph-tch': item({
    learningOutcome: 'Choose between ch and tch in familiar one-syllable words by considering the preceding short-vowel context.',
    readingUse: 'Treat both ch and tch as spellings for /ch/ rather than sounding tch as three separate sounds.',
    spellingUse: 'Use tch commonly after a single short vowel in a one-syllable word, then compare ch endings and known exceptions.',
    boundarySummary: 'Do not use tch for every final /ch/. Words such as lunch, much and rich show consonant context and exception boundaries.',
  }),
  'soft-g-hard-g': item({
    learningOutcome: 'Use the following letter as a clue to predict whether g is likely to represent /g/ or /j/ and verify the word.',
    readingUse: 'Contrast hard g in familiar words with soft g before e, i or y in controlled examples.',
    spellingUse: 'Connect soft g with later /j/ spelling choices while retaining the correct written form of each word.',
    boundarySummary: 'The e-i-y clue is not absolute. Words such as get and give show why children must predict and then check the known word.',
  }),
  'r-controlled-ar': item({
    learningOutcome: 'Recognise ar as an r-controlled vowel pattern and decode familiar words without applying the ordinary short-a sound.',
    readingUse: 'Read ar as a unit in words such as car, star and farm, with allowance for accent differences.',
    spellingUse: 'Use ar as the familiar spelling in known /ar/ words while comparing other r-controlled patterns separately.',
    boundarySummary: 'Do not read a in ar as an ordinary short vowel, and do not treat one accent pronunciation as the only acceptable model.',
  }),
  'r-controlled-or': item({
    learningOutcome: 'Recognise or as an r-controlled vowel pattern and distinguish it from related r-controlled spellings.',
    readingUse: 'Read or as a unit in words such as fork, storm and short instead of separating the vowel and r.',
    spellingUse: 'Retain or as the spelling for familiar words while contrasting it with ar and other r-controlled families.',
    boundarySummary: 'Do not assume every written or sequence sounds identical in every word or accent; teach the target family first.',
  }),
  'r-controlled-er-ir-ur': item({
    learningOutcome: 'Read familiar er, ir and ur words as members of a similar r-controlled sound family while remembering their different spellings.',
    readingUse: 'Recognise that her, bird and turn can share a similar r-controlled vowel quality in many accents.',
    spellingUse: 'Learn er, ir and ur as separate spelling families because the sound alone often does not reveal which grapheme a word uses.',
    boundarySummary: 'Do not collapse the three spellings into one written rule. Similar pronunciation does not make er, ir and ur interchangeable in spelling.',
  }),
  'y-secret-vowel': item({
    learningOutcome: 'Recognise when y functions as a vowel and adjust its likely sound according to position and word pattern.',
    readingUse: 'Read y as a vowel in words such as my, happy and gym rather than assuming it always represents the consonant /y/.',
    spellingUse: 'Retain y in known word families and use position as a clue rather than replacing it with i or another vowel automatically.',
    boundarySummary: 'Y does not have one vowel sound in every position. Teach the main positional families separately before mixing them.',
  }),
  'diphthong-oo': item({
    learningOutcome: 'Read common oo words by sorting them into the moon and book pronunciation families.',
    readingUse: 'Recognise oo as one grapheme while distinguishing the common vowel in moon from the shorter vowel in book.',
    spellingUse: 'Keep oo as the written spelling in familiar words even though the pronunciation family can differ.',
    boundarySummary: 'Do not teach one sound for every oo word. The moon and book families should be established as separate common patterns.',
  }),
  'diphthong-oi-oy': item({
    learningOutcome: 'Read and spell familiar /oi/ words by recognising oi and oy as related spellings with useful position tendencies.',
    readingUse: 'Decode oi and oy as the same target vowel sound in familiar words before comparing their positions.',
    spellingUse: 'Use oi commonly inside words and oy commonly at the end as a spelling clue, while retaining known exceptions.',
    boundarySummary: 'Do not present the position clue as an absolute rule or treat oi and oy as freely interchangeable in every word.',
  }),
  'diphthong-au-aw': item({
    learningOutcome: 'Read and compare familiar au and aw words as related vowel spellings within a controlled pronunciation family.',
    readingUse: 'Recognise au and aw as vowel spellings in words such as haul and saw, with awareness that pronunciation varies by accent.',
    spellingUse: 'Use word-specific and positional knowledge to retain au or aw rather than choosing from sound alone.',
    boundarySummary: 'Do not claim one universal pronunciation across accents or assume au and aw can be swapped freely in spelling.',
  }),
  'diphthong-ou-ow': item({
    learningOutcome: 'Read the /ow/ family with ou and ow while keeping other pronunciations of the same spellings separate.',
    readingUse: 'Decode the target /ow/ sound in words such as out and cow, then compare other pronunciation families only after this set is secure.',
    spellingUse: 'Retain ou or ow in familiar words and use position as one clue rather than relying on sound alone.',
    boundarySummary: 'OU and OW each have other pronunciations in English. Do not generalise the out/cow sound to every word containing these graphemes.',
  }),
  'j-sounds': item({
    learningOutcome: 'Read /j/ across j, soft g and dge spellings and make a more informed spelling choice from position and surrounding letters.',
    readingUse: 'Recognise j, soft g and dge as common spellings for /j/ in different word contexts.',
    spellingUse: 'Use position, vowel context and known word families to choose among j, g and dge instead of spelling from sound alone.',
    boundarySummary: 'There is no single spelling for every /j/ sound. DGE, j and soft g belong to different contexts and must not be treated as interchangeable.',
  }),
  'shun-family': item({
    learningOutcome: 'Recognise common /shun/ word endings and connect their spelling to whole words, vocabulary and meaningful word parts.',
    readingUse: 'Read endings such as -tion and -sion as familiar word-ending patterns inside complete words.',
    spellingUse: 'Learn spelling by word family and morphology because the /shun/ sound alone does not determine the correct ending.',
    boundarySummary: 'Do not force one spelling onto every /shun/ ending. Some related endings also have different pronunciations, such as /zhun/ in vision.',
  }),
  'schwa-lazy-vowel': item({
    learningOutcome: 'Notice a weak vowel in an unstressed syllable while preserving the word’s stable written spelling.',
    readingUse: 'Use syllable stress to understand why a written vowel can sound reduced in words such as about, sofa, problem, pencil and support.',
    spellingUse: 'Recall the stored spelling rather than trying to reconstruct the vowel from the reduced sound heard in natural speech.',
    boundarySummary: 'Schwa is not one fixed grapheme-to-sound rule. Do not ask the child to pronounce every unstressed written vowel with a strong short or long sound.',
  }),
  'vowel-team-ui': item({
    learningOutcome: 'Read the target ui /oo/ family and distinguish it from common ui words with a different vowel sound.',
    readingUse: 'Recognise ui as the target vowel spelling in fruit, suit, juice and bruise while comparing build and guilt separately.',
    spellingUse: 'Retain ui in familiar target-family words and connect the sound to related spellings such as oo without assuming identical spelling.',
    boundarySummary: 'Do not apply the fruit/suit pronunciation to every ui word. Build and guilt belong to a different pronunciation family.',
  }),
} as const);

export type PublishedPhonicsDifferentiationConceptId = keyof typeof PHONICS_RESOURCE_DIFFERENTIATION;

export function getPhonicsResourceDifferentiation(conceptId: string): PhonicsResourceDifferentiation | null {
  return PHONICS_RESOURCE_DIFFERENTIATION[conceptId as PublishedPhonicsDifferentiationConceptId] ?? null;
}
