# Obsolete game PNG cleanup — 2026-10-03

Production WebP migration is live and was manually smoke-tested successfully before this cleanup.

## Removal scope

This cleanup removes only the two obsolete top-level PNG copies that were superseded by the canonical WebP library:

- `public/games/maw/*.png`: 37 files
- `public/games/phonics/sound-detective/*.png`: 37 files

Total removed: **74 PNG files / 6.88 MiB**.

Canonical replacements retained:

- `public/games/phonics/shared/images/*.webp`: 37 files / about 0.65 MiB

## Make-A-Word boundary

Current source still contains nested Make-A-Word URL references under `/games/maw/at/` and `/games/maw/in/`.

The current `main` tree does **not** contain corresponding nested asset files under `public/games/maw/at/` or `public/games/maw/in/`. That is pre-existing repository state and is not introduced by this cleanup.

This cleanup deletes only direct top-level `public/games/maw/*.png` files and does not rewrite those nested source references.

## Safety evidence

Before deletion:

- production deploy for current `main` completed successfully;
- live deployment verification passed;
- all 37 canonical WebPs were present on `main`;
- the user manually verified Sound Detective, Letter Tracing, and Letter Tracing + Sounds in production;
- repository search found no active `/games/phonics/sound-detective/*.png` source references;
- Make-A-Word source references remain nested under `/games/maw/at/` and `/games/maw/in/`, not the deleted direct top-level PNG paths.

A regression test protects the canonical WebP set and verifies that Make-A-Word source references are not redirected to the deleted top-level PNG paths.
