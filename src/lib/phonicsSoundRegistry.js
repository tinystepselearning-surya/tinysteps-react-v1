const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);

export const PHONICS_SOUND_REGISTRY_REVISION = '2026-09-10-ph2';
export const PHONICS_SOUND_AUDIO_BASE = '/games/phonics/sounds';
export const PHONICS_SOUND_ASSET_STATES = freezeList(['approved', 'pending', 'not-required']);

export const PHONICS_SOUND_CATEGORIES = freezeList([
  'Schwa',
  'Consonant',
  'Short Vowel',
  'Digraph',
  'Long Vowel',
  'Vowels and r',
  'Soft and Silent Consonant(s)',
  'Other Vowel Teams',
]);

const legacyLetter = (letter) => `/games/phonics/${letter}.mp3`;
const sound = (id, config) => freeze({
  id,
  label: config.label,
  category: config.category,
  phonemeLabel: config.phonemeLabel,
  phonemeCount: config.phonemeCount ?? 1,
  audioFile: config.audioFile,
  audioPath: `${PHONICS_SOUND_AUDIO_BASE}/${config.audioFile}`,
  fallbackAudioPaths: freezeList(config.fallbackAudioPaths),
  spellings: freezeList(config.spellings),
  example: config.example,
  accentSensitive: Boolean(config.accentSensitive),
  note: config.note ?? null,
  assetState: config.assetState ?? 'pending',
});

export const PHONICS_SOUND_REGISTRY = freezeList([
  sound('schwa', { label: 'Schwa', category: 'Schwa', phonemeLabel: '/ə/', audioFile: 'Schwa-What.mp3', spellings: ['a', 'e', 'i', 'o', 'u'], example: 'about', accentSensitive: true, note: 'Schwa is an unstressed vowel sound; the written vowel varies by word and accent.' }),

  sound('b', { label: 'B', category: 'Consonant', phonemeLabel: '/b/', audioFile: 'b-bat.mp3', fallbackAudioPaths: [legacyLetter('b')], spellings: ['b'], example: 'bat' }),
  sound('c-hard', { label: 'Hard C', category: 'Consonant', phonemeLabel: '/k/', audioFile: 'c-cut.mp3', fallbackAudioPaths: [legacyLetter('c')], spellings: ['c'], example: 'cut' }),
  sound('d', { label: 'D', category: 'Consonant', phonemeLabel: '/d/', audioFile: 'd-dip.mp3', fallbackAudioPaths: [legacyLetter('d')], spellings: ['d'], example: 'dip' }),
  sound('f', { label: 'F', category: 'Consonant', phonemeLabel: '/f/', audioFile: 'f-fun.mp3', fallbackAudioPaths: [legacyLetter('f')], spellings: ['f', 'ph'], example: 'fun' }),
  sound('g-hard', { label: 'Hard G', category: 'Consonant', phonemeLabel: '/g/', audioFile: 'g-get.mp3', fallbackAudioPaths: [legacyLetter('g')], spellings: ['g'], example: 'get' }),
  sound('h', { label: 'H', category: 'Consonant', phonemeLabel: '/h/', audioFile: 'h-hat.mp3', fallbackAudioPaths: [legacyLetter('h')], spellings: ['h'], example: 'hat' }),
  sound('j', { label: 'J', category: 'Consonant', phonemeLabel: '/j/', audioFile: 'j-jog.mp3', fallbackAudioPaths: [legacyLetter('j')], spellings: ['j', 'dge'], example: 'jog' }),
  sound('k', { label: 'K', category: 'Consonant', phonemeLabel: '/k/', audioFile: 'k-kit.mp3', fallbackAudioPaths: [legacyLetter('k')], spellings: ['k', 'ck'], example: 'kit' }),
  sound('l', { label: 'L', category: 'Consonant', phonemeLabel: '/l/', audioFile: 'l-lip.mp3', fallbackAudioPaths: [legacyLetter('l')], spellings: ['l'], example: 'lip' }),
  sound('m', { label: 'M', category: 'Consonant', phonemeLabel: '/m/', audioFile: 'm-mug.mp3', fallbackAudioPaths: [legacyLetter('m')], spellings: ['m', 'mb'], example: 'mug' }),
  sound('n', { label: 'N', category: 'Consonant', phonemeLabel: '/n/', audioFile: 'n-nap.mp3', fallbackAudioPaths: [legacyLetter('n')], spellings: ['n'], example: 'nap' }),
  sound('p', { label: 'P', category: 'Consonant', phonemeLabel: '/p/', audioFile: 'p-pick.mp3', fallbackAudioPaths: [legacyLetter('p')], spellings: ['p'], example: 'pick' }),
  sound('r', { label: 'R', category: 'Consonant', phonemeLabel: '/r/', audioFile: 'r-rid.mp3', fallbackAudioPaths: [legacyLetter('r')], spellings: ['r'], example: 'rid', accentSensitive: true }),
  sound('s', { label: 'S', category: 'Consonant', phonemeLabel: '/s/', audioFile: 's-sit-mess.mp3', fallbackAudioPaths: [legacyLetter('s')], spellings: ['s', 'ss'], example: 'sit' }),
  sound('t', { label: 'T', category: 'Consonant', phonemeLabel: '/t/', audioFile: 't-tuck.mp3', fallbackAudioPaths: [legacyLetter('t')], spellings: ['t'], example: 'tuck' }),
  sound('v', { label: 'V', category: 'Consonant', phonemeLabel: '/v/', audioFile: 'v-van.mp3', fallbackAudioPaths: [legacyLetter('v')], spellings: ['v'], example: 'van' }),
  sound('w', { label: 'W', category: 'Consonant', phonemeLabel: '/w/', audioFile: 'w-will.mp3', fallbackAudioPaths: [legacyLetter('w')], spellings: ['w', 'wh'], example: 'will', accentSensitive: true }),
  sound('x', { label: 'X', category: 'Consonant', phonemeLabel: '/k/ + /s/', phonemeCount: 2, audioFile: 'x-mix-rocks.mp3', fallbackAudioPaths: [legacyLetter('x')], spellings: ['x'], example: 'mix', note: 'X commonly represents two phonemes /k/ and /s/ in words such as box and mix.' }),
  sound('y', { label: 'Y', category: 'Consonant', phonemeLabel: '/y/', audioFile: 'y-yes.mp3', fallbackAudioPaths: [legacyLetter('y')], spellings: ['y'], example: 'yes' }),
  sound('z', { label: 'Z', category: 'Consonant', phonemeLabel: '/z/', audioFile: 'z-zip-buzz.mp3', fallbackAudioPaths: [legacyLetter('z')], spellings: ['z', 'zz'], example: 'zip' }),

  sound('short-a', { label: 'Short A', category: 'Short Vowel', phonemeLabel: '/a/', audioFile: 'a-apple.mp3', fallbackAudioPaths: [legacyLetter('a')], spellings: ['a'], example: 'apple' }),
  sound('short-e', { label: 'Short E', category: 'Short Vowel', phonemeLabel: '/e/', audioFile: 'e-elephant.mp3', fallbackAudioPaths: [legacyLetter('e')], spellings: ['e'], example: 'elephant' }),
  sound('short-i', { label: 'Short I', category: 'Short Vowel', phonemeLabel: '/i/', audioFile: 'i-igloo.mp3', fallbackAudioPaths: [legacyLetter('i')], spellings: ['i', 'y'], example: 'igloo' }),
  sound('short-o', { label: 'Short O', category: 'Short Vowel', phonemeLabel: '/o/', audioFile: 'o-octopus.mp3', fallbackAudioPaths: [legacyLetter('o')], spellings: ['o'], example: 'octopus' }),
  sound('short-u', { label: 'Short U', category: 'Short Vowel', phonemeLabel: '/u/', audioFile: 'u-up.mp3', fallbackAudioPaths: [legacyLetter('u')], spellings: ['u'], example: 'up' }),

  sound('sh', { label: 'SH', category: 'Digraph', phonemeLabel: '/sh/', audioFile: 'sh-ship.mp3', spellings: ['sh'], example: 'ship' }),
  sound('ch', { label: 'CH', category: 'Digraph', phonemeLabel: '/ch/', audioFile: 'ch-chick.mp3', spellings: ['ch', 'tch'], example: 'chick' }),
  sound('th-unvoiced', { label: 'TH (unvoiced)', category: 'Digraph', phonemeLabel: '/th/', audioFile: 'th-thin.mp3', spellings: ['th'], example: 'thin' }),
  sound('th-voiced', { label: 'TH (voiced)', category: 'Digraph', phonemeLabel: '/th/ voiced', audioFile: 'th-the.mp3', spellings: ['th'], example: 'the' }),
  sound('ng', { label: 'NG', category: 'Digraph', phonemeLabel: '/ng/', audioFile: 'ng-ring.mp3', spellings: ['ng'], example: 'ring' }),
  sound('qu', { label: 'QU', category: 'Digraph', phonemeLabel: '/k/ + /w/', phonemeCount: 2, audioFile: 'qu-quest.mp3', spellings: ['qu'], example: 'quest', note: 'QU is kept as a classroom spelling chunk here, but it commonly represents two phonemes /k/ and /w/.' }),
  sound('wh-hw', { label: 'WH', category: 'Digraph', phonemeLabel: '/hw/', audioFile: 'hw-whip.mp3', spellings: ['wh'], example: 'whip', accentSensitive: true, note: 'Some accents distinguish /hw/ from /w/; many do not.' }),

  sound('long-a', { label: 'Long A', category: 'Long Vowel', phonemeLabel: '/ay/', audioFile: 'a-cake.mp3', spellings: ['a_e', 'ai', 'ay', 'eigh'], example: 'cake' }),
  sound('long-e', { label: 'Long E', category: 'Long Vowel', phonemeLabel: '/ee/', audioFile: 'e-team.mp3', spellings: ['e', 'ee', 'ea', 'y'], example: 'team' }),
  sound('long-i', { label: 'Long I', category: 'Long Vowel', phonemeLabel: '/igh/', audioFile: 'i-kite.mp3', spellings: ['i_e', 'igh', 'ie', 'y'], example: 'kite' }),
  sound('long-o', { label: 'Long O', category: 'Long Vowel', phonemeLabel: '/oh/', audioFile: 'o-rope.mp3', spellings: ['o_e', 'oa', 'ow', 'o'], example: 'rope' }),
  sound('long-u-yoo', { label: 'Long U /yoo/', category: 'Long Vowel', phonemeLabel: '/yoo/', audioFile: 'u-use-cue.mp3', spellings: ['u_e', 'u', 'ue', 'ew'], example: 'use' }),
  sound('long-u-oo', { label: 'Long U /oo/', category: 'Long Vowel', phonemeLabel: '/oo/', audioFile: 'u-lute-glue.mp3', spellings: ['u_e', 'ue', 'ui', 'ew', 'u'], example: 'glue' }),

  sound('ar', { label: 'AR', category: 'Vowels and r', phonemeLabel: '/ar/', audioFile: 'ar-jar.mp3', spellings: ['ar'], example: 'jar', accentSensitive: true }),
  sound('or', { label: 'OR', category: 'Vowels and r', phonemeLabel: '/or/', audioFile: 'or-fork.mp3', spellings: ['or'], example: 'fork', accentSensitive: true }),
  sound('er-ir-ur', { label: 'ER / IR / UR', category: 'Vowels and r', phonemeLabel: '/er/', audioFile: 'er-herd-bird-turn.mp3', spellings: ['er', 'ir', 'ur'], example: 'herd', accentSensitive: true }),
  sound('air', { label: 'AIR', category: 'Vowels and r', phonemeLabel: '/air/', audioFile: 'air-pair-share.mp3', spellings: ['air', 'are'], example: 'pair', accentSensitive: true }),
  sound('ear', { label: 'EAR', category: 'Vowels and r', phonemeLabel: '/ear/', audioFile: 'ear-hear.mp3', spellings: ['ear'], example: 'hear', accentSensitive: true }),
  sound('ure', { label: 'URE', category: 'Vowels and r', phonemeLabel: '/ure/', audioFile: 'ure-lure.mp3', spellings: ['ure'], example: 'lure', accentSensitive: true }),

  sound('soft-c', { label: 'Soft C', category: 'Soft and Silent Consonant(s)', phonemeLabel: '/s/', audioFile: 's-cent-cirus-cycle.mp3', spellings: ['c'], example: 'cent', note: 'Filename preserves the supplied recording name exactly, including “cirus”.' }),
  sound('soft-g', { label: 'Soft G', category: 'Soft and Silent Consonant(s)', phonemeLabel: '/j/', audioFile: 'j-gem-giant-gym.mp3', spellings: ['g'], example: 'gem' }),
  sound('z-spelled-s', { label: 'S spelling /z/', category: 'Soft and Silent Consonant(s)', phonemeLabel: '/z/', audioFile: 's-his.mp3', spellings: ['s'], example: 'his' }),
  sound('kn-n', { label: 'KN with silent K', category: 'Soft and Silent Consonant(s)', phonemeLabel: '/n/', audioFile: 'n-knife.mp3', spellings: ['kn'], example: 'knife' }),
  sound('gn-n', { label: 'GN with silent G', category: 'Soft and Silent Consonant(s)', phonemeLabel: '/n/', audioFile: 'n-gnome.mp3', spellings: ['gn'], example: 'gnome' }),
  sound('wr-r', { label: 'WR with silent W', category: 'Soft and Silent Consonant(s)', phonemeLabel: '/r/', audioFile: 'wr-wrist.mp3', spellings: ['wr'], example: 'wrist', accentSensitive: true }),

  sound('oo-short', { label: 'OO (book)', category: 'Other Vowel Teams', phonemeLabel: '/oo/ short', audioFile: 'oo-book-bush.mp3', spellings: ['oo', 'u'], example: 'book' }),
  sound('oo-long', { label: 'OO (boot)', category: 'Other Vowel Teams', phonemeLabel: '/oo/', audioFile: 'oo-boot-new.mp3', spellings: ['oo', 'ue', 'ew'], example: 'boot' }),
  sound('oi-oy', { label: 'OI / OY', category: 'Other Vowel Teams', phonemeLabel: '/oy/', audioFile: 'oi-soil-toy.mp3', spellings: ['oi', 'oy'], example: 'soil' }),
  sound('ou-ow', { label: 'OU / OW', category: 'Other Vowel Teams', phonemeLabel: '/ow/', audioFile: 'ou-how-out.mp3', spellings: ['ou', 'ow'], example: 'out' }),
  sound('aw-au', { label: 'AW / AU', category: 'Other Vowel Teams', phonemeLabel: '/aw/', audioFile: 'aw-haul-hawk-ball.mp3', spellings: ['aw', 'au', 'al'], example: 'haul', accentSensitive: true }),
]);

const ids = PHONICS_SOUND_REGISTRY.map((entry) => entry.id);
const files = PHONICS_SOUND_REGISTRY.map((entry) => entry.audioFile);
if (new Set(ids).size !== ids.length) throw new Error('PH2/R13 phonics sound registry contains duplicate sound IDs.');
if (new Set(files).size !== files.length) throw new Error('PH2/R13 phonics sound registry contains duplicate primary audio filenames.');
for (const entry of PHONICS_SOUND_REGISTRY) {
  if (!PHONICS_SOUND_CATEGORIES.includes(entry.category)) throw new Error(`PH2/R13 sound has unsupported category: ${entry.id}`);
  if (!PHONICS_SOUND_ASSET_STATES.includes(entry.assetState)) throw new Error(`PH2/R13 sound has unsupported asset state: ${entry.id}`);
  if (!entry.audioFile.endsWith('.mp3') || entry.audioPath !== `${PHONICS_SOUND_AUDIO_BASE}/${entry.audioFile}`) throw new Error(`PH2/R13 sound has invalid audio path: ${entry.id}`);
  if (!entry.spellings.length || entry.phonemeCount < 1) throw new Error(`PH2/R13 sound is missing spelling/phoneme metadata: ${entry.id}`);
}

export const PHONICS_EXPECTED_AUDIO_FILES = freezeList(PHONICS_SOUND_REGISTRY.filter((entry) => entry.assetState === 'pending').map((entry) => entry.audioFile));
export const PHONICS_EXPECTED_AUDIO_PATHS = freezeList(PHONICS_SOUND_REGISTRY.filter((entry) => entry.assetState === 'pending').map((entry) => entry.audioPath));
const byId = new Map(PHONICS_SOUND_REGISTRY.map((entry) => [entry.id, entry]));

export function getPhonicsSound(soundId) {
  return byId.get(String(soundId || '')) ?? null;
}

export function getPhonicsSoundsByCategory(category) {
  return freezeList(PHONICS_SOUND_REGISTRY.filter((entry) => entry.category === category));
}

export function getPhonicsSoundsByAssetState(assetState) {
  return freezeList(PHONICS_SOUND_REGISTRY.filter((entry) => entry.assetState === assetState));
}

export function getPhonicsSoundAudioCandidates(soundId) {
  const entry = getPhonicsSound(soundId);
  if (!entry) return freezeList([]);
  return freezeList([entry.audioPath, ...entry.fallbackAudioPaths]);
}
