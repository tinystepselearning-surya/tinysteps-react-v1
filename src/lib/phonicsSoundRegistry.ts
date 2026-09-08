export type PhonicsSoundAssetOrigin = 'existing-letter' | 'teacher-upload';

export type PhonicsSoundDefinition = {
  readonly id: string;
  readonly label: string;
  readonly assetPath: string;
  readonly assetOrigin: PhonicsSoundAssetOrigin;
  readonly graphemeExamples: readonly string[];
  readonly exampleWords: readonly string[];
  readonly recordingCue?: string;
  readonly note?: string;
};

const LETTER_AUDIO_ROOT = '/games/phonics';
export const PHONICS_PATTERN_AUDIO_ROOT = '/games/phonics/sounds';

function letterSound(
  id: string,
  graphemeExamples: readonly string[],
  exampleWords: readonly string[],
): PhonicsSoundDefinition {
  return {
    id,
    label: `Existing ${id.toUpperCase()} phonics sound`,
    assetPath: `${LETTER_AUDIO_ROOT}/${id}.mp3`,
    assetOrigin: 'existing-letter',
    graphemeExamples,
    exampleWords,
  };
}

function teacherSound(
  id: string,
  label: string,
  graphemeExamples: readonly string[],
  exampleWords: readonly string[],
  recordingCue: string,
  note?: string,
): PhonicsSoundDefinition {
  return {
    id,
    label,
    assetPath: `${PHONICS_PATTERN_AUDIO_ROOT}/${id}.mp3`,
    assetOrigin: 'teacher-upload',
    graphemeExamples,
    exampleWords,
    recordingCue,
    note,
  };
}

/**
 * Canonical reusable phonics sounds.
 *
 * A registered `teacher-upload` path is allowed to exist before the MP3 does.
 * Runtime playback fails gracefully until the teacher file is uploaded at the
 * exact path, after which the same button starts working without a code change.
 *
 * IMPORTANT: a grapheme is not a sound. Ambiguous graphemes are mapped to the
 * intended sound explicitly in reviewed word data; this registry never guesses.
 */
export const PHONICS_SOUND_REGISTRY = [
  // Existing Tiny Steps A-Z recordings. For vowels these are the current
  // primary letter-sound recordings already used by the tracing experience.
  letterSound('a', ['a'], ['cat', 'map']),
  letterSound('b', ['b'], ['bat', 'rib']),
  letterSound('c', ['c'], ['cat', 'cup']),
  letterSound('d', ['d'], ['dog', 'red']),
  letterSound('e', ['e'], ['bed', 'hen']),
  letterSound('f', ['f', 'ph'], ['fish', 'phone']),
  letterSound('g', ['g'], ['go', 'bag']),
  letterSound('h', ['h'], ['hat', 'hop']),
  letterSound('i', ['i'], ['sit', 'pin']),
  letterSound('j', ['j', 'dge'], ['jam', 'bridge']),
  letterSound('k', ['k', 'ck'], ['kit', 'duck']),
  letterSound('l', ['l'], ['leg', 'bell']),
  letterSound('m', ['m', 'mb'], ['map', 'lamb']),
  letterSound('n', ['n', 'kn'], ['net', 'knee']),
  letterSound('o', ['o'], ['hot', 'log']),
  letterSound('p', ['p'], ['pig', 'cap']),
  letterSound('q', ['q'], ['quiz']),
  letterSound('r', ['r', 'wr'], ['red', 'write']),
  letterSound('s', ['s', 'c'], ['sun', 'city']),
  letterSound('t', ['t'], ['tap', 'sit']),
  letterSound('u', ['u'], ['sun', 'cup']),
  letterSound('v', ['v'], ['van', 'give']),
  letterSound('w', ['w'], ['wet', 'win']),
  letterSound('x', ['x'], ['box', 'fox']),
  letterSound('y', ['y'], ['yes', 'yam']),
  letterSound('z', ['z'], ['zip', 'buzz']),

  // Consonant patterns that need their own reusable recordings.
  teacherSound('sh', 'SH sound', ['sh'], ['ship', 'fish'], 'Record only the clean SH sound as heard at the start of “ship”.'),
  teacherSound('ch', 'CH sound', ['ch', 'tch'], ['chip', 'match'], 'Record only the clean CH sound as heard at the start of “chip”.'),
  teacherSound('th-voiceless', 'TH sound — voiceless', ['th'], ['thin', 'bath'], 'Record the unvoiced TH sound as in “thin”, without adding a vowel.'),
  teacherSound('th-voiced', 'TH sound — voiced', ['th'], ['this', 'mother'], 'Record the voiced TH sound as in “this”, without adding a vowel.'),
  teacherSound('ng', 'NG sound', ['ng'], ['sing', 'ring'], 'Record only the NG sound at the end of “sing”.'),
  teacherSound('wh', 'WH sound', ['wh'], ['when', 'whip'], 'Record the Tiny Steps classroom WH sound used in “when”.', 'Many accents merge WH with W; keep the recording aligned to Tiny Steps teaching practice.'),
  teacherSound('qu', 'QU classroom sound', ['qu'], ['queen', 'quick'], 'Record the Tiny Steps classroom QU cue used in “queen”.', 'QU commonly represents /kw/. Reviewed word maps may later split K + W where phoneme-level analysis requires it.'),

  // Long vowels. Common vowel teams point to these canonical recordings.
  teacherSound('long-a', 'Long A sound', ['a_e', 'ai', 'ay', 'eigh', 'ey'], ['cake', 'rain', 'play', 'eight'], 'Record only the long A vowel sound as in “rain”.'),
  teacherSound('long-e', 'Long E sound', ['e_e', 'ee', 'ea', 'ie', 'y'], ['these', 'see', 'team', 'happy'], 'Record only the long E vowel sound as in “see”.'),
  teacherSound('long-i', 'Long I sound', ['i_e', 'igh', 'ie', 'y'], ['time', 'night', 'pie', 'my'], 'Record only the long I vowel sound as in “night”.'),
  teacherSound('long-o', 'Long O sound', ['o_e', 'oa', 'ow', 'oe'], ['home', 'boat', 'snow', 'toe'], 'Record only the long O vowel sound as in “boat”.'),
  teacherSound('long-u', 'Long U /yoo/ sound', ['u_e', 'ue', 'ew'], ['cube', 'rescue', 'few'], 'Record the long U “yoo” sound as in “cube”.'),

  // Other common vowel/diphthong sounds.
  teacherSound('oo-long', 'Long OO sound', ['oo', 'ue', 'ew', 'u_e', 'ou'], ['moon', 'blue', 'chew', 'rule', 'soup'], 'Record only the long OO vowel sound as in “moon”.'),
  teacherSound('oo-short', 'Short OO sound', ['oo', 'ou'], ['book', 'could'], 'Record only the short OO vowel sound as in “book”.'),
  teacherSound('oi', 'OI/OY sound', ['oi', 'oy'], ['coin', 'boy'], 'Record only the OI/OY sound as in “coin”.'),
  teacherSound('ou', 'OU/OW sound', ['ou', 'ow'], ['out', 'cow'], 'Record only the vowel sound shared by “out” and “cow”.'),
  teacherSound('aw', 'AW/AU sound', ['aw', 'au', 'augh'], ['saw', 'author', 'caught'], 'Record the AW vowel sound used by Tiny Steps in “saw”.'),

  // R-controlled sounds taught as explicit pattern families.
  teacherSound('ar', 'AR sound', ['ar'], ['car', 'star'], 'Record only the AR sound as in “car”.'),
  teacherSound('or', 'OR sound', ['or', 'ore', 'oar'], ['fork', 'more', 'board'], 'Record only the OR sound as in “fork”.'),
  teacherSound('er', 'ER sound', ['er'], ['her', 'term'], 'Record only the ER sound as in “her”.'),
  teacherSound('ir', 'IR sound', ['ir'], ['bird', 'girl'], 'Record only the IR sound as in “bird”.'),
  teacherSound('ur', 'UR sound', ['ur'], ['turn', 'fur'], 'Record only the UR sound as in “turn”.'),

  // Advanced weak-vowel support.
  teacherSound('schwa', 'Schwa sound', ['a', 'e', 'i', 'o', 'u'], ['about', 'taken'], 'Record a neutral schwa /uh/ sound as used in an unstressed syllable such as the first sound in “about”.'),
] as const satisfies readonly PhonicsSoundDefinition[];

export type PhonicsSoundId = (typeof PHONICS_SOUND_REGISTRY)[number]['id'];

const SOUND_BY_ID = new Map<PhonicsSoundId, (typeof PHONICS_SOUND_REGISTRY)[number]>(
  PHONICS_SOUND_REGISTRY.map((sound) => [sound.id, sound]),
);

export function getPhonicsSoundDefinition(soundId: PhonicsSoundId) {
  return SOUND_BY_ID.get(soundId) ?? null;
}

export function getPhonicsSoundAssetPath(soundId: PhonicsSoundId): string | null {
  return getPhonicsSoundDefinition(soundId)?.assetPath ?? null;
}

export const PHONICS_SOUND_UPLOAD_MANIFEST = PHONICS_SOUND_REGISTRY.filter(
  (sound) => sound.assetOrigin === 'teacher-upload',
).map((sound) => ({
  id: sound.id,
  filename: `${sound.id}.mp3`,
  uploadPath: `public${sound.assetPath}`,
  label: sound.label,
  recordingCue: sound.recordingCue ?? '',
  exampleWords: sound.exampleWords,
})) as readonly {
  readonly id: PhonicsSoundId;
  readonly filename: string;
  readonly uploadPath: string;
  readonly label: string;
  readonly recordingCue: string;
  readonly exampleWords: readonly string[];
}[];

/**
 * Common grapheme-to-sound options. These are possibilities, not an automatic
 * pronunciation engine. Reviewed word data must choose one explicit sound ID.
 */
export const PHONICS_GRAPHEME_SOUND_OPTIONS: Readonly<Record<string, readonly PhonicsSoundId[]>> = {
  a: ['a', 'long-a', 'schwa'],
  b: ['b'],
  c: ['c', 's'],
  d: ['d'],
  e: ['e', 'long-e', 'schwa'],
  f: ['f'],
  g: ['g', 'j'],
  h: ['h'],
  i: ['i', 'long-i', 'schwa'],
  j: ['j'],
  k: ['k'],
  l: ['l'],
  m: ['m'],
  n: ['n'],
  o: ['o', 'long-o', 'schwa'],
  p: ['p'],
  q: ['q'],
  r: ['r'],
  s: ['s', 'z'],
  t: ['t'],
  u: ['u', 'long-u', 'oo-long', 'schwa'],
  v: ['v'],
  w: ['w'],
  x: ['x'],
  y: ['y', 'long-e', 'long-i'],
  z: ['z'],
  sh: ['sh'],
  ch: ['ch'],
  tch: ['ch'],
  th: ['th-voiceless', 'th-voiced'],
  ng: ['ng'],
  wh: ['wh', 'w'],
  ph: ['f'],
  ck: ['k'],
  qu: ['qu'],
  dge: ['j'],
  kn: ['n'],
  wr: ['r'],
  mb: ['m'],
  'a_e': ['long-a'],
  ai: ['long-a'],
  ay: ['long-a'],
  eigh: ['long-a'],
  'e_e': ['long-e'],
  ee: ['long-e'],
  ea: ['long-e', 'e', 'long-a'],
  'i_e': ['long-i'],
  igh: ['long-i'],
  ie: ['long-i', 'long-e'],
  'o_e': ['long-o'],
  oa: ['long-o'],
  ow: ['long-o', 'ou'],
  oe: ['long-o'],
  'u_e': ['long-u', 'oo-long'],
  ue: ['long-u', 'oo-long'],
  ew: ['long-u', 'oo-long'],
  oo: ['oo-long', 'oo-short'],
  oi: ['oi'],
  oy: ['oi'],
  ou: ['ou', 'oo-long', 'oo-short', 'long-o', 'u'],
  aw: ['aw'],
  au: ['aw'],
  augh: ['aw'],
  ar: ['ar'],
  or: ['or'],
  ore: ['or'],
  oar: ['or'],
  er: ['er', 'schwa'],
  ir: ['ir'],
  ur: ['ur'],
};
