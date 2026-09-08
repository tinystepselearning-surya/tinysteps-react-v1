# Resources R10.1 — Phonics Audio Foundation

Date: 2026-09-09

## Goal

Create a reusable, reviewable phonics-audio contract that can power interactive sound boxes on future word/reference pages without recording every word sound-by-sound.

This is a parallel capability layer. It does not publish new SEO URLs and it does not replace Brick 11 measurement work.

## Existing assets

Tiny Steps already has one MP3 per base letter at:

`/public/games/phonics/a.mp3` through `/public/games/phonics/z.mp3`.

Those files remain the canonical source for the current single-letter recordings.

## New asset convention

New reusable phonics sounds use:

`/public/games/phonics/sounds/<sound-id>.mp3`

The code registry owns the exact `sound-id` values. Teachers can record files independently and upload them later using those exact filenames.

## Missing-audio behaviour

A sound can be registered before the MP3 exists.

The UI still renders the play control. On click it attempts the registered asset path. If the file is not present or cannot be decoded, the component reports `Audio coming soon` and does not substitute browser TTS or an incorrect letter sound.

Therefore, once the correct MP3 is uploaded to the registered path, the existing control starts playing it without a code change.

## Why sound IDs are reading-specific

A grapheme is not always one sound. The registry therefore uses reading-specific IDs for ambiguous spellings, for example:

- `th-voiceless` vs `th-voiced`
- `oo-long` vs `oo-short`
- `ow-long-o` vs `ow-ou`
- `ea-long-e` vs `ea-short-e` vs `ea-long-a`

Word segmentation must select the intended sound ID explicitly. The system must never infer a phoneme only from spelling.

## Word sound-map contract

Future word pages use reviewed segments:

```ts
{
  word: 'ship',
  segments: [
    { grapheme: 'sh', soundId: 'sh' },
    { grapheme: 'i', soundId: 'i-short' },
    { grapheme: 'p', soundId: 'p' },
  ]
}
```

The reusable sound-box component renders one button per segment. Each button resolves audio through the canonical sound registry.

## Safety rules

1. Do not auto-segment arbitrary words from spelling alone.
2. Do not use browser TTS as a phoneme-fact source.
3. Do not silently substitute a different sound when an asset is missing.
4. Every word map must reference registered sound IDs.
5. Ambiguous graphemes must use reading-specific IDs.
6. Uploading audio must not require editing word data.
7. Whole-word audio is a separate future layer from phoneme-box audio.

## Scaling path

`existing A-Z recordings -> canonical reusable sound registry -> teacher uploads -> reviewed word segmentation -> interactive sound boxes -> programmatic word/reference pages`

This keeps audio production small and reusable even when the word library grows to thousands of pages.
