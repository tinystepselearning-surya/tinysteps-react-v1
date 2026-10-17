# Public media deduplication audit — 2026-10-03

Baseline: `eb681ba21a4c0e722a805398f7451a38a618a89f`.

## Inventory
- MP3: **117**
- PNG: **106**
- Audited public files: **223**
- Byte-identical duplicate groups: **71**
- Redundant duplicate files: **74**
- Redundant bytes: **7.54 MiB**

Full inventory and Git blob hashes: `docs/audits/public-media-inventory-2026-10-03.csv`.

## Reference findings
- Balloon Pop and Letter Sound Match each actively reference their own A–Z MP3 directory. The 26 pairs are byte-identical.
- `/confetti.mp3` is already a shared active asset. Balloon Pop still used a local duplicate before this patch.
- The 37 top-level `public/games/maw/*.png` duplicates have no active source references; current Make-A-Word code uses `/games/maw/at/*` and `/games/maw/in/*`.
- The matching Sound Detective PNG directory is actively used by Sound Detective and tracing reward/next-arrow flows.
- Seven Christmas numbered pairs are byte-identical but both logical decoration IDs are active.

## Phase 1 implemented
1. Added one canonical A–Z set under `/games/phonics/shared/letter-sounds/` using the exact existing Balloon Pop blobs.
2. Switched Balloon Pop and Letter Sound Match to the canonical set.
3. Switched Balloon Pop confetti to `/confetti.mp3`.
4. Remapped the seven byte-identical Christmas decoration IDs to canonical files while preserving 16 logical IDs.
5. Added regression coverage and a repeatable hash-audit script.

**No legacy media files are deleted in Phase 1.** This prevents older cached JS or open tabs from breaking during rollout.

## Phase 2 cleanup gate
After production verification of Balloon Pop, Letter Sound Match, Sound Detective, Letter Tracing, Letter Tracing + Sounds, public wrappers, and the Christmas game, remove only proven obsolete copies.

Baseline maximum removable duplicate payload: **7.54 MiB**.
