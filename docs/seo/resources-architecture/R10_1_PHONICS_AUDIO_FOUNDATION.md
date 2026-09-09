# Resources R10.1 — Phonics Audio Foundation

Date: 2026-09-09

## Goal

Create a reusable phonics-audio foundation that can power explicit sound boxes without recording every word sound-by-sound and without guessing pronunciation from spelling.

This is a parallel capability layer. It does not publish new SEO URLs and it does not replace Brick 11 measurement work.

## Compatibility boundary

R10.1 keeps its implementation in `src/lib/phonicsAudioFoundation.ts` rather than `phonicsSoundRegistry.ts`.

That is deliberate: the later R13 utility engine owns the broader semantic `phonicsSoundRegistry` contract. Keeping the R10.1 module foundation-specific prevents TypeScript/JavaScript module shadowing when the later brick is merged.

## Existing assets

Tiny Steps already has one MP3 per base letter at:

`/public/games/phonics/a.mp3` through `/public/games/phonics/z.mp3`.

Those remain available as the existing single-letter layer.

## Supplied teacher recordings

Pattern audio uses:

`/public/games/phonics/sounds/<supplied-filename>.mp3`

The sound ID and the asset filename are separate concepts. R10.1 points to the actual supplied filenames such as:

- `sh-ship.mp3`
- `th-thin.mp3` / `th-the.mp3`
- `a-cake.mp3`
- `oo-book-bush.mp3` / `oo-boot-new.mp3`
- `er-herd-bird-turn.mp3`
- `Schwa-What.mp3`

The full foundation upload list is documented in `PHONICS_AUDIO_TEACHER_UPLOAD_LIST.md`.

## Missing-audio behaviour

A sound can be registered before the MP3 exists in the repository.

The UI attempts only the explicit registered asset path. If the file is missing or cannot be decoded, the component reports `Audio coming soon`. It does not substitute browser TTS or silently choose another phonics sound.

## Why sound IDs are reading-specific

A grapheme is not always one sound. The foundation keeps reading-specific choices for ambiguous spellings, for example:

- `th-voiceless` vs `th-voiced`
- `oo-long` vs `oo-short`
- long-O `ow` vs /ow/ `ow`

Word segmentation must select the intended sound ID explicitly. The system must never infer a phoneme only from spelling.

## Word sound-map contract

The R10.1 examples are framework records only. They are explicitly stored mappings; they are **not** claimed to be human-reviewed publication records.

```ts
{
  word: 'ship',
  editorialState: 'framework-example',
  segments: [
    { grapheme: 'sh', soundId: 'sh' },
    { grapheme: 'i', soundId: 'i' },
    { grapheme: 'p', soundId: 'p' },
  ]
}
```

The reusable sound-box component renders one control per stored segment and resolves audio through the R10.1 foundation registry.

## Safety rules

1. Do not auto-segment arbitrary words from spelling alone.
2. Do not use browser TTS as a phoneme-fact source.
3. Do not silently substitute a different sound when an asset is missing.
4. Every framework word map must reference registered sound IDs.
5. Ambiguous graphemes must use explicit reading-specific IDs.
6. Whole-word audio is separate from isolated sound-box audio.
7. Framework examples must not emit reviewer claims, review dates, or review schema.
8. R10.1 must not shadow the later R13 `phonicsSoundRegistry` module.

## Scaling path

`existing A-Z recordings -> supplied pattern recordings -> explicit framework mappings -> reusable sound boxes -> R13 governed semantic sound/word utility`

R10.1 is therefore a safe foundation layer, while R13 remains the place for the broader 56-sound registry, larger starter word bank, and public phonics-hub utility.
