# R13 teacher audio upload checklist

Upload the supplied MP3 recordings to:

`public/games/phonics/sounds/`

Do not rename them. The semantic registry intentionally maps phonics identities above the supplied filenames.

After upload, run:

`node scripts/audit-resources-r13-word-sound-utility.mjs --require-audio --report`

A successful strict audit means all expected primary recording filenames are present. This checks file presence only; the listening/phonics-quality review remains a human task.
