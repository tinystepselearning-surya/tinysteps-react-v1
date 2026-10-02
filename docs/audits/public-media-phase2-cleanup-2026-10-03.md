# Public media deduplication — Phase 2 deletion plan

Parent branch: `cost/public-media-dedup-phase1` at `4f299f7977ecbca24e8f403ea2c9428f7afe1561`.

## Deletion set

This phase removes **100 obsolete duplicate files** totaling **9.97 MiB** from the Phase 1 tree:

- 52 legacy A–Z MP3s from Balloon Pop and Letter Sound Match; the canonical 26-file set remains under `public/games/phonics/shared/letter-sounds/`.
- 4 redundant local `confetti.mp3` copies; `public/confetti.mp3` remains canonical.
- 37 dead top-level `public/games/maw/*.png` copies; byte-identical Sound Detective copies remain.
- 7 redundant Christmas numbered PNGs; the game keeps 16 logical decoration IDs through the Phase 1 mapping.

## Safety

No active source path is intentionally removed.

Regression tests verify:
- both active letter-sound games use the canonical A–Z path;
- the shared confetti path remains;
- every removed top-level MAW PNG has a retained Sound Detective counterpart and no direct source reference;
- every removed Christmas file has a retained canonical file and an explicit logical-ID mapping.

## Merge gate

This PR is intentionally stacked on Phase 1 and should stay **draft/unmerged** until:

1. Phase 1 is merged to `main`;
2. Phase 1 Hosting deployment succeeds;
3. production smoke checks pass for Balloon Pop, Letter Sound Match, Sound Detective, Letter Tracing, Letter Tracing + Sounds, their public wrappers, and Christmas Tree Decorator.

After that, retarget this PR to `main`, sync to zero commits behind, rerun CI, and merge.

## Net effect

Phase 1 temporarily adds a 26-file canonical A–Z copy so legacy URLs remain available during rollout. Phase 2 removes both legacy A–Z copies plus the other proven duplicates.

Relative to the original pre-Phase-1 baseline, the final public-media corpus removes approximately **7.54 MiB** of duplicate bytes without re-encoding audio or changing image/audio content.
