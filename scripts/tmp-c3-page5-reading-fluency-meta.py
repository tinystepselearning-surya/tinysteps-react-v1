from pathlib import Path

path = Path('src/lib/routeSeoRegistry.js')
text = path.read_text()

old = """  '/reading-fluency-program': {
    title: 'Reading Fluency Program for Kids Who Read Slowly | Tiny Steps',
    description:
      'Reading fluency support for children who read slowly, pause often, or lose meaning, with a clear path from decoding and blending to fluency and comprehension.',
    canonicalPath: '/reading-fluency-program',
    ogType: 'website',
  },"""

new = """  '/reading-fluency-program': {
    title: 'Reading Fluency Classes for Kids Online | Tiny Steps Learning',
    description:
      'Live 1:1 reading fluency classes for kids in India and worldwide. Build smoother connected reading, phrasing, accuracy and expression after decoding is stable.',
    canonicalPath: '/reading-fluency-program',
    ogType: 'website',
    keywords:
      'reading fluency program for kids,reading fluency programme for kids,reading fluency classes for kids online,online reading fluency classes,reading fluency tutor for kids,1 to 1 reading fluency classes,live reading fluency classes for kids,reading fluency course for kids',
  },"""

if old not in text:
    raise SystemExit('Expected reading-fluency registry block not found')

path.write_text(text.replace(old, new, 1))
