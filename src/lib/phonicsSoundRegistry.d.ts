export type PhonicsSoundCategory =
  | 'Schwa'
  | 'Consonant'
  | 'Short Vowel'
  | 'Digraph'
  | 'Long Vowel'
  | 'Vowels and r'
  | 'Soft and Silent Consonant(s)'
  | 'Other Vowel Teams';

export interface PhonicsSoundEntry {
  readonly id: string;
  readonly label: string;
  readonly category: PhonicsSoundCategory;
  readonly phonemeLabel: string;
  readonly phonemeCount: number;
  readonly audioFile: string;
  readonly audioPath: string;
  readonly fallbackAudioPaths: readonly string[];
  readonly spellings: readonly string[];
  readonly example: string;
  readonly accentSensitive: boolean;
  readonly note: string | null;
  readonly assetState: 'expected-upload';
}

export const PHONICS_SOUND_REGISTRY_REVISION: string;
export const PHONICS_SOUND_AUDIO_BASE: '/games/phonics/sounds';
export const PHONICS_SOUND_CATEGORIES: readonly PhonicsSoundCategory[];
export const PHONICS_SOUND_REGISTRY: readonly PhonicsSoundEntry[];
export const PHONICS_EXPECTED_AUDIO_FILES: readonly string[];
export const PHONICS_EXPECTED_AUDIO_PATHS: readonly string[];
export function getPhonicsSound(soundId: string): PhonicsSoundEntry | null;
export function getPhonicsSoundsByCategory(category: PhonicsSoundCategory): readonly PhonicsSoundEntry[];
export function getPhonicsSoundAudioCandidates(soundId: string): readonly string[];
