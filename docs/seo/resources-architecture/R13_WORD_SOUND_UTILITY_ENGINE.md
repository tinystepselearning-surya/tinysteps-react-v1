# Resources R13 — Phonics Sound & Word Utility Engine

**Revision:** `2026-09-09-r13`  
**Parent:** R12 controlled programmatic expansion  
**Public surface:** existing `/resources/phonics` hub only

## Goal

R13 turns the phonics resource hub into a real educational utility without publishing guessed word analyses or creating thousands of thin URLs.

The engine has four layers:

1. a semantic sound registry;
2. exact recording-file mappings;
3. explicit word-by-word grapheme/sound segmentation;
4. a reusable interactive sound-box interface embedded in the existing phonics hub.

R13 deliberately does **not** create individual word pages. That is a later publication decision for Brick 14 after the data, review process, browse architecture, and word-page value are ready.

## Governing principles

- A filename is an asset reference, not the phonics fact itself.
- A word is never segmented by a generic spelling algorithm at runtime.
- Ambiguous spellings are selected explicitly per word. For example, `cow` stores `ow → ou-ow`, while `snow` stores `ow → long-o`.
- A sound-spelling chunk is not automatically one phoneme. `qu` commonly represents `/k/ + /w/`; `x` commonly represents `/k/ + /s/`. R13 records both chunk count and phoneme count.
- Isolated sound recordings are not concatenated and presented as natural whole-word blending audio.
- Human-review truth is preserved. Every starter word remains `pending`; R13 emits no reviewer name, review date, reviewed revision, or review schema for these word maps.
- Unknown words return a clear “not in the starter bank” state. The utility does not guess.

## Sound families supplied by Tiny Steps

The canonical registry preserves the eight supplied teaching families:

1. Schwa
2. Consonant
3. Short Vowel
4. Digraph
5. Long Vowel
6. Vowels and r
7. Soft and Silent Consonant(s)
8. Other Vowel Teams

The semantic registry currently contains **56 sound identities/assets**. Basic consonants and short vowels may fall back to the existing `/games/phonics/<letter>.mp3` assets until the newer teacher recordings are committed.

## Recording upload contract

Teacher recordings should be committed under:

`public/games/phonics/sounds/`

R13 expects the following exact filenames. The supplied names are preserved exactly so uploading the files does not require a code change.

### Schwa

- `Schwa-What.mp3`

### Consonant

- `b-bat.mp3`
- `c-cut.mp3`
- `d-dip.mp3`
- `f-fun.mp3`
- `g-get.mp3`
- `h-hat.mp3`
- `j-jog.mp3`
- `k-kit.mp3`
- `l-lip.mp3`
- `m-mug.mp3`
- `n-nap.mp3`
- `p-pick.mp3`
- `r-rid.mp3`
- `s-sit-mess.mp3`
- `t-tuck.mp3`
- `v-van.mp3`
- `w-will.mp3`
- `x-mix-rocks.mp3`
- `y-yes.mp3`
- `z-zip-buzz.mp3`

### Short Vowel

- `a-apple.mp3`
- `e-elephant.mp3`
- `i-igloo.mp3`
- `o-octopus.mp3`
- `u-up.mp3`

### Digraph

- `sh-ship.mp3`
- `ch-chick.mp3`
- `th-thin.mp3`
- `th-the.mp3`
- `ng-ring.mp3`
- `qu-quest.mp3`
- `hw-whip.mp3`

### Long Vowel

- `a-cake.mp3`
- `e-team.mp3`
- `i-kite.mp3`
- `o-rope.mp3`
- `u-use-cue.mp3`
- `u-lute-glue.mp3`

### Vowels and r

- `ar-jar.mp3`
- `or-fork.mp3`
- `er-herd-bird-turn.mp3`
- `air-pair-share.mp3`
- `ear-hear.mp3`
- `ure-lure.mp3`

### Soft and Silent Consonant(s)

- `s-cent-cirus-cycle.mp3`
- `j-gem-giant-gym.mp3`
- `s-his.mp3`
- `n-knife.mp3`
- `n-gnome.mp3`
- `wr-wrist.mp3`

The `cirus` spelling in `s-cent-cirus-cycle.mp3` is preserved because it is the supplied filename. The semantic record is `soft-c`, so the filename does not become the educational label.

### Other Vowel Teams

- `oo-book-bush.mp3`
- `oo-boot-new.mp3`
- `oi-soil-toy.mp3`
- `ou-how-out.mp3`
- `aw-haul-hawk-ball.mp3`

## Starter word data

`src/lib/phonicsWordUtilityRegistry.js` contains more than 70 explicit starter word maps. Every record stores:

- the word;
- ordered grapheme chunks;
- the semantic sound ID for every chunk;
- derived sound-chunk count;
- derived phoneme count;
- a short meaning;
- an example sentence;
- a phonics/tricky-part note;
- links to already-published R12 concept IDs where the relationship is direct;
- related-word suggestions;
- `utilityState: starter-curated`;
- `humanReviewState: pending`.

Examples:

- `ship → sh | i | p`
- `rain → r | ai | n`
- `night → n | igh | t`
- `book → b | oo | k` using `oo-short`
- `moon → m | oo | n` using `oo-long`
- `cow → c | ow` using the `/ow/` reading
- `snow → s | n | ow` using long o
- `about → a(schwa) | b | ou | t`
- `fruit → f | r | ui | t`
- `knot → kn | o | t`
- `badge → b | a | dge`

These are stored analyses, not runtime guesses.

## Runtime UI

The phonics hub embeds `PhonicsWordSoundUtility` above the existing 31-guide discovery graph.

The user can:

- type a stored word;
- choose from matching stored words;
- see the word split into sound-spelling boxes;
- see chunk count and phoneme count separately;
- play the corresponding recording for each chunk;
- see a short meaning, example sentence, and phonics note;
- follow relevant links into the governed 31-page phonics concept library.

If a new recording has not yet been committed, the play control fails gracefully to **Audio coming soon**. For basic letter sounds, the current letter-audio files are used as fallbacks where available.

## SEO / AEO boundary

R13 does not add a new canonical route and does not add individual word URLs to the sitemap. The utility is part of `/resources/phonics`, whose role remains phonics-resource discovery.

This prevents a premature programmatic word-indexation wave. Brick 14 can later decide which word pages deserve publication, what browse hubs are needed, and what human-review gate applies.

## Audio strictness

Run:

`node scripts/audit-resources-r13-word-sound-utility.mjs --report`

before the recordings are committed. Missing expected MP3s are reported as warnings, because the code skeleton and fallback behavior are intentionally deployable first.

After all files are uploaded, run:

`node scripts/audit-resources-r13-word-sound-utility.mjs --require-audio --report`

The strict command fails if any expected recording filename is missing.

## R12 regression boundary

R13 must preserve:

- 16 frozen Wave-1 pages;
- 15 Wave-2 pages;
- 31 total governed phonics resource pages;
- 31 pending human-review records;
- no new reviewer claim;
- no change to `/phonics` commercial ownership;
- no individual word-page publication.
