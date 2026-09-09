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

function letterSound<const Id extends string>(
  id: Id,
  graphemeExamples: readonly string[],
  exampleWords: readonly string[],
): PhonicsSoundDefinition & { readonly id: Id; readonly assetOrigin: 'existing-letter' } {
  return {
    id,
    label: `Existing ${id.toUpperCase()} phonics sound`,
    assetPath: `${LETTER_AUDIO_ROOT}/${id}.mp3`,
    assetOrigin: 'existing-letter',
    graphemeExamples,
    exampleWords,
  };
}

function teacherSound<const Id extends string>(
  id: Id,
  label: string,
  audioFile: string,
  graphemeExamples: readonly string[],
  exampleWords: readonly string[],
  recordingCue: string,
  note?: string,
): PhonicsSoundDefinition & { readonly id: Id; readonly assetOrigin: 'teacher-upload' } {
  return {
    id,
    label,
    assetPath: `${PHONICS_PATTERN_AUDIO_ROOT}/${audioFile}`,
    assetOrigin: 'teacher-upload',
    graphemeExamples,
    exampleWords,
    recordingCue,
    note,
  };
}

/**
 * R10.1 audio-foundation registry.
 *
 * This intentionally lives in a foundation-specific module so the later R13
 * semantic sound registry can evolve independently without TypeScript/JS module
 * shadowing. A grapheme is not a sound: word data chooses an explicit sound ID.
 */
export const PHONICS_SOUND_REGISTRY = [
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

  teacherSound('sh', 'SH sound', 'sh-ship.mp3', ['sh'], ['ship', 'fish'], 'Use the supplied SH recording represented by “ship”.'),
  teacherSound('ch', 'CH sound', 'ch-chick.mp3', ['ch', 'tch'], ['chick', 'match'], 'Use the supplied CH recording represented by “chick”.'),
  teacherSound('th-voiceless', 'TH sound — voiceless', 'th-thin.mp3', ['th'], ['thin', 'bath'], 'Use the supplied unvoiced TH recording represented by “thin”.'),
  teacherSound('th-voiced', 'TH sound — voiced', 'th-the.mp3', ['th'], ['the', 'mother'], 'Use the supplied voiced TH recording represented by “the”.'),
  teacherSound('ng', 'NG sound', 'ng-ring.mp3', ['ng'], ['ring', 'sing'], 'Use the supplied NG recording represented by “ring”.'),
  teacherSound('wh', 'WH sound', 'wh-whip.mp3', ['wh'], ['whip', 'when'], 'Use the supplied WH classroom recording represented by “whip”.', 'Accent handling is explicit; many accents merge WH with W.'),
  teacherSound('qu', 'QU classroom sound', 'qu-quest.mp3', ['qu'], ['quest', 'quick'], 'Use the supplied QU classroom recording represented by “quest”.', 'QU commonly represents /k/ + /w/; this R10.1 layer stores the classroom chunk explicitly.'),

  teacherSound('long-a', 'Long A sound', 'a-cake.mp3', ['a_e', 'ai', 'ay', 'eigh', 'ey'], ['cake', 'rain', 'play', 'eight'], 'Use the supplied long-A recording represented by “cake”.'),
  teacherSound('long-e', 'Long E sound', 'e-team.mp3', ['e_e', 'ee', 'ea', 'ie', 'y'], ['team', 'see', 'happy'], 'Use the supplied long-E recording represented by “team”.'),
  teacherSound('long-i', 'Long I sound', 'i-kite.mp3', ['i_e', 'igh', 'ie', 'y'], ['kite', 'night', 'pie'], 'Use the supplied long-I recording represented by “kite”.'),
  teacherSound('long-o', 'Long O sound', 'o-rope.mp3', ['o_e', 'oa', 'ow', 'oe'], ['rope', 'boat', 'snow'], 'Use the supplied long-O recording represented by “rope”.'),
  teacherSound('long-u', 'Long U /yoo/ sound', 'u-use-cue.mp3', ['u_e', 'ue', 'ew'], ['use', 'cue', 'rescue'], 'Use the supplied long-U /yoo/ recording represented by “use/cue”.'),

  teacherSound('oo-long', 'Long OO sound', 'oo-boot-new.mp3', ['oo', 'ue', 'ew', 'u_e', 'ou'], ['boot', 'moon', 'new'], 'Use the supplied long-OO recording represented by “boot/new”.'),
  teacherSound('oo-short', 'Short OO sound', 'oo-book-bush.mp3', ['oo', 'ou'], ['book', 'bush'], 'Use the supplied short-OO recording represented by “book/bush”.'),
  teacherSound('oi', 'OI/OY sound', 'oi-soil-toy.mp3', ['oi', 'oy'], ['soil', 'toy'], 'Use the supplied OI/OY recording represented by “soil/toy”.'),
  teacherSound('ou', 'OU/OW sound', 'ou-how-out.mp3', ['ou', 'ow'], ['out', 'how', 'cow'], 'Use the supplied OU/OW recording represented by “how/out”.'),
  teacherSound('aw', 'AW/AU sound', 'aw-haul-hawk-ball.mp3', ['aw', 'au', 'al', 'augh'], ['haul', 'hawk', 'ball'], 'Use the supplied AW/AU recording represented by “haul/hawk/ball”.'),

  teacherSound('ar', 'AR sound', 'ar-jar.mp3', ['ar'], ['jar', 'car'], 'Use the supplied AR recording represented by “jar”.'),
  teacherSound('or', 'OR sound', 'or-fork.mp3', ['or', 'ore', 'oar'], ['fork', 'more'], 'Use the supplied OR recording represented by “fork”.'),
  teacherSound('er', 'ER classroom sound', 'er-herd-bird-turn.mp3', ['er'], ['herd', 'her'], 'Use the supplied shared ER/IR/UR classroom recording.'),
  teacherSound('ir', 'IR classroom sound', 'er-herd-bird-turn.mp3', ['ir'], ['bird', 'girl'], 'Use the supplied shared ER/IR/UR classroom recording.'),
  teacherSound('ur', 'UR classroom sound', 'er-herd-bird-turn.mp3', ['ur'], ['turn', 'fur'], 'Use the supplied shared ER/IR/UR classroom recording.'),

  teacherSound('schwa', 'Schwa sound', 'Schwa-What.mp3', ['a', 'e', 'i', 'o', 'u'], ['about', 'taken'], 'Use the supplied schwa recording. Word-level schwa mapping still requires explicit segmentation.', 'Schwa is stress- and accent-sensitive.'),
] as const satisfies readonly PhonicsSoundDefinition[];

export type PhonicsSoundId = (typeof PHONICS_SOUND_REGISTRY)[number]['id'];

const SOUND_BY_ID = new Map<PhonicsSoundId, (typeof PHONICS_SOUND_REGISTRY)[number]>(
  PHONICS_SOUND_REGISTRY.map((sound) => [sound.id, sound] as const),
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
  filename: sound.assetPath.split('/').pop() ?? '',
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
 * Common grapheme-to-sound possibilities. This is not a pronunciation engine;
 * explicit word data must choose one sound ID for each stored mapping.
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
