# Obsolete game PNG cleanup — 2026-10-03

Production WebP migration is live and was manually smoke-tested successfully before this cleanup.

## Removal scope

This cleanup removes only the two obsolete top-level PNG copies that were superseded by the canonical WebP library:

- `public/games/maw/*.png`: 37 files
- `public/games/phonics/sound-detective/*.png`: 37 files

Total removed: **74 PNG files / 6.88 MiB**.

Canonical replacements retained:

- `public/games/phonics/shared/images/*.webp`: 37 files / 0.65 MiB

The nested Make-A-Word assets under `public/games/maw/at/` and `public/games/maw/in/` are intentionally untouched.

## Safety evidence

Before deletion:

- production deploy for current `main` completed successfully;
- live deployment verification passed;
- all 37 canonical WebPs were present on `main`;
- the user manually verified Sound Detective, Letter Tracing, and Letter Tracing + Sounds in production;
- repository search found no active `/games/phonics/sound-detective/*.png` source references;
- Make-A-Word source references use nested `/games/maw/at/*.png` and `/games/maw/in/*.png`, not the removed top-level PNGs.

A regression test protects the canonical WebP set and the nested Make-A-Word assets.
