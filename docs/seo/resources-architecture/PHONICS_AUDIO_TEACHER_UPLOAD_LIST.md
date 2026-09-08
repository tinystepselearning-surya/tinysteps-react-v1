# Tiny Steps Phonics Audio — Teacher Upload List

Upload every new recording to:

`public/games/phonics/sounds/`

Use the filename exactly as written. Record the sound cleanly with no spoken label such as “SH says…” and no extra vowel added after consonants. The code already points to these paths; when a file appears there, the existing play control can use it without a code change.

| # | Filename | Record | Example |
|---:|---|---|---|
| 1 | `sh.mp3` | clean SH sound | ship |
| 2 | `ch.mp3` | clean CH sound | chip |
| 3 | `th-voiceless.mp3` | unvoiced TH | thin |
| 4 | `th-voiced.mp3` | voiced TH | this |
| 5 | `ng.mp3` | NG sound | sing |
| 6 | `wh.mp3` | Tiny Steps WH classroom sound | when |
| 7 | `qu.mp3` | Tiny Steps QU classroom cue | queen |
| 8 | `long-a.mp3` | long A | rain |
| 9 | `long-e.mp3` | long E | see |
| 10 | `long-i.mp3` | long I | night |
| 11 | `long-o.mp3` | long O | boat |
| 12 | `long-u.mp3` | long U /yoo/ | cube |
| 13 | `oo-long.mp3` | long OO | moon |
| 14 | `oo-short.mp3` | short OO | book |
| 15 | `oi.mp3` | OI/OY sound | coin |
| 16 | `ou.mp3` | OU/OW sound | out / cow |
| 17 | `aw.mp3` | AW/AU sound | saw |
| 18 | `ar.mp3` | AR sound | car |
| 19 | `or.mp3` | OR sound | fork |
| 20 | `er.mp3` | ER sound | her |
| 21 | `ir.mp3` | IR sound | bird |
| 22 | `ur.mp3` | UR sound | turn |
| 23 | `schwa.mp3` | neutral unstressed schwa | about |

## Do not record duplicates for these

The framework deliberately reuses canonical sounds:

- `ph` -> existing `f.mp3`
- `ck` -> existing `k.mp3`
- `tch` -> new `ch.mp3`
- `dge` -> existing `j.mp3`
- `kn` -> existing `n.mp3`
- `wr` -> existing `r.mp3`
- `mb` -> existing `m.mp3`
- `ai`, `ay`, `eigh` -> `long-a.mp3`
- `ee` and long-E `ea` -> `long-e.mp3`
- `igh` and long-I `ie` -> `long-i.mp3`
- `oa` and long-O `ow` -> `long-o.mp3`
- `oi`, `oy` -> `oi.mp3`
- `ou` and /ow/ reading of `ow` -> `ou.mp3`
- `aw`, `au`, common `augh` /aw/ reading -> `aw.mp3`

Ambiguous spellings such as `th`, `ea`, `ow`, `oo`, and `ou` are never assigned automatically. Each reviewed word map chooses the correct registered sound explicitly.

## Existing files already used

No re-recording is required for the current base A-Z layer unless Tiny Steps later chooses to replace a recording. Existing paths remain:

`public/games/phonics/a.mp3` through `public/games/phonics/z.mp3`.
