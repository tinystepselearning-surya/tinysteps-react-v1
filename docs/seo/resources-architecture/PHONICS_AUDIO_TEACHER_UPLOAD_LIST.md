# Tiny Steps Phonics Audio — R10.1 Foundation Upload List

Upload the supplied recordings to:

`public/games/phonics/sounds/`

R10.1 now points to the real filenames already supplied by Tiny Steps. Do not rename them. The semantic sound ID is kept in code separately from the asset filename.

| # | Filename | Foundation sound ID(s) | Example |
|---:|---|---|---|
| 1 | `sh-ship.mp3` | `sh` | ship |
| 2 | `ch-chick.mp3` | `ch` | chick |
| 3 | `th-thin.mp3` | `th-voiceless` | thin |
| 4 | `th-the.mp3` | `th-voiced` | the |
| 5 | `ng-ring.mp3` | `ng` | ring |
| 6 | `wh-whip.mp3` | `wh` | whip |
| 7 | `qu-quest.mp3` | `qu` | quest |
| 8 | `a-cake.mp3` | `long-a` | cake |
| 9 | `e-team.mp3` | `long-e` | team |
| 10 | `i-kite.mp3` | `long-i` | kite |
| 11 | `o-rope.mp3` | `long-o` | rope |
| 12 | `u-use-cue.mp3` | `long-u` | use / cue |
| 13 | `oo-boot-new.mp3` | `oo-long` | boot / new |
| 14 | `oo-book-bush.mp3` | `oo-short` | book / bush |
| 15 | `oi-soil-toy.mp3` | `oi` | soil / toy |
| 16 | `ou-how-out.mp3` | `ou` | how / out |
| 17 | `aw-haul-hawk-ball.mp3` | `aw` | haul / hawk / ball |
| 18 | `ar-jar.mp3` | `ar` | jar |
| 19 | `or-fork.mp3` | `or` | fork |
| 20 | `er-herd-bird-turn.mp3` | `er`, `ir`, `ur` | herd / bird / turn |
| 21 | `Schwa-What.mp3` | `schwa` | unstressed vowel support |

## Reused recordings

R10.1 deliberately reuses canonical sound assets where the phoneme is the same:

- `ph` -> existing `f.mp3`
- `ck` -> existing `k.mp3`
- `tch` -> `ch-chick.mp3`
- `dge` -> existing `j.mp3`
- `kn` -> existing `n.mp3`
- `wr` -> existing `r.mp3`
- `mb` -> existing `m.mp3`
- `ai`, `ay`, `eigh` -> `a-cake.mp3`
- `ee` and long-E `ea` -> `e-team.mp3`
- `igh` and long-I `ie` -> `i-kite.mp3`
- `oa` and long-O `ow` -> `o-rope.mp3`
- `oi`, `oy` -> `oi-soil-toy.mp3`
- `ou` and /ow/ reading of `ow` -> `ou-how-out.mp3`
- `aw`, `au`, common `augh` /aw/ reading -> `aw-haul-hawk-ball.mp3`
- `er`, `ir`, `ur` share `er-herd-bird-turn.mp3` in the current classroom asset set

Ambiguous spellings such as `th`, `ea`, `ow`, `oo`, and `ou` are never assigned automatically. Each stored framework word map chooses the intended registered sound explicitly.

## Existing A-Z layer

Existing single-letter recordings remain available at:

`public/games/phonics/a.mp3` through `public/games/phonics/z.mp3`.

R10.1 is only the foundation subset. The later R13 utility layer expands the semantic registry to the broader supplied categories and keeps the full exact-file contract.
