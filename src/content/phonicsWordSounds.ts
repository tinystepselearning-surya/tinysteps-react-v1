import type { PhonicsSoundId } from '../lib/phonicsAudioFoundation';

export type PhonicsWordSoundSegment = {
  /** Letters shown to the learner for this sound unit. */
  readonly grapheme: string;
  /** Explicit canonical audio target; never inferred from grapheme spelling. */
  readonly soundId: PhonicsSoundId;
  /** Optional teacher/editor note for unusual mappings. */
  readonly note?: string;
};

export type PhonicsWordSoundMap = {
  readonly word: string;
  readonly slug: string;
  readonly segments: readonly PhonicsWordSoundSegment[];
  /**
   * These seed entries prove the component/data contract only. They are not a
   * publication gate and must not be auto-promoted into SEO word pages.
   */
  readonly editorialState: 'framework-example';
};

/**
 * Small non-public seed bank used to exercise the future word-page sound-box
 * architecture. Every segmentation is explicit. No arbitrary word is ever
 * split automatically from spelling.
 */
export const PHONICS_WORD_SOUND_FRAMEWORK_EXAMPLES = [
  {
    word: 'ship',
    slug: 'ship',
    editorialState: 'framework-example',
    segments: [
      { grapheme: 'sh', soundId: 'sh' },
      { grapheme: 'i', soundId: 'i' },
      { grapheme: 'p', soundId: 'p' },
    ],
  },
  {
    word: 'chat',
    slug: 'chat',
    editorialState: 'framework-example',
    segments: [
      { grapheme: 'ch', soundId: 'ch' },
      { grapheme: 'a', soundId: 'a' },
      { grapheme: 't', soundId: 't' },
    ],
  },
  {
    word: 'thin',
    slug: 'thin',
    editorialState: 'framework-example',
    segments: [
      { grapheme: 'th', soundId: 'th-voiceless' },
      { grapheme: 'i', soundId: 'i' },
      { grapheme: 'n', soundId: 'n' },
    ],
  },
  {
    word: 'this',
    slug: 'this',
    editorialState: 'framework-example',
    segments: [
      { grapheme: 'th', soundId: 'th-voiced' },
      { grapheme: 'i', soundId: 'i' },
      { grapheme: 's', soundId: 's' },
    ],
  },
  {
    word: 'sing',
    slug: 'sing',
    editorialState: 'framework-example',
    segments: [
      { grapheme: 's', soundId: 's' },
      { grapheme: 'i', soundId: 'i' },
      { grapheme: 'ng', soundId: 'ng' },
    ],
  },
  {
    word: 'rain',
    slug: 'rain',
    editorialState: 'framework-example',
    segments: [
      { grapheme: 'r', soundId: 'r' },
      { grapheme: 'ai', soundId: 'long-a' },
      { grapheme: 'n', soundId: 'n' },
    ],
  },
  {
    word: 'boat',
    slug: 'boat',
    editorialState: 'framework-example',
    segments: [
      { grapheme: 'b', soundId: 'b' },
      { grapheme: 'oa', soundId: 'long-o' },
      { grapheme: 't', soundId: 't' },
    ],
  },
  {
    word: 'night',
    slug: 'night',
    editorialState: 'framework-example',
    segments: [
      { grapheme: 'n', soundId: 'n' },
      { grapheme: 'igh', soundId: 'long-i' },
      { grapheme: 't', soundId: 't' },
    ],
  },
  {
    word: 'moon',
    slug: 'moon',
    editorialState: 'framework-example',
    segments: [
      { grapheme: 'm', soundId: 'm' },
      { grapheme: 'oo', soundId: 'oo-long' },
      { grapheme: 'n', soundId: 'n' },
    ],
  },
  {
    word: 'book',
    slug: 'book',
    editorialState: 'framework-example',
    segments: [
      { grapheme: 'b', soundId: 'b' },
      { grapheme: 'oo', soundId: 'oo-short' },
      { grapheme: 'k', soundId: 'k' },
    ],
  },
  {
    word: 'coin',
    slug: 'coin',
    editorialState: 'framework-example',
    segments: [
      { grapheme: 'c', soundId: 'c' },
      { grapheme: 'oi', soundId: 'oi' },
      { grapheme: 'n', soundId: 'n' },
    ],
  },
  {
    word: 'cow',
    slug: 'cow',
    editorialState: 'framework-example',
    segments: [
      { grapheme: 'c', soundId: 'c' },
      { grapheme: 'ow', soundId: 'ou' },
    ],
  },
  {
    word: 'car',
    slug: 'car',
    editorialState: 'framework-example',
    segments: [
      { grapheme: 'c', soundId: 'c' },
      { grapheme: 'ar', soundId: 'ar' },
    ],
  },
  {
    word: 'fork',
    slug: 'fork',
    editorialState: 'framework-example',
    segments: [
      { grapheme: 'f', soundId: 'f' },
      { grapheme: 'or', soundId: 'or' },
      { grapheme: 'k', soundId: 'k' },
    ],
  },
  {
    word: 'bird',
    slug: 'bird',
    editorialState: 'framework-example',
    segments: [
      { grapheme: 'b', soundId: 'b' },
      { grapheme: 'ir', soundId: 'ir' },
      { grapheme: 'd', soundId: 'd' },
    ],
  },
  {
    word: 'turn',
    slug: 'turn',
    editorialState: 'framework-example',
    segments: [
      { grapheme: 't', soundId: 't' },
      { grapheme: 'ur', soundId: 'ur' },
      { grapheme: 'n', soundId: 'n' },
    ],
  },
] as const satisfies readonly PhonicsWordSoundMap[];

const WORD_BY_SLUG: ReadonlyMap<string, PhonicsWordSoundMap> = new Map(
  PHONICS_WORD_SOUND_FRAMEWORK_EXAMPLES.map(
    (entry): readonly [string, PhonicsWordSoundMap] => [entry.slug, entry],
  ),
);

export function getPhonicsWordSoundFrameworkExample(slug: string): PhonicsWordSoundMap | null {
  return WORD_BY_SLUG.get(slug) ?? null;
}
