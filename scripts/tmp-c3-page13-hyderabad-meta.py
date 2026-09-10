from pathlib import Path

path = Path('src/lib/routeSeoRegistry.js')
text = path.read_text()
old = """  '/online-english-classes-hyderabad': {
    title: 'Online English Classes for Kids in Hyderabad | Tiny Steps Learning',
    description:
      'Live online English classes for kids in Hyderabad covering phonics, reading, grammar, sentence formation, and communication confidence. Book one free 35-minute 1:1 demo assessment class.',
    canonicalPath: '/online-english-classes-hyderabad',
    ogType: 'website',
  },"""
new = """  '/online-english-classes-hyderabad': {
    title: 'Online English Classes for Kids in Hyderabad | Tiny Steps',
    description:
      'Live online English classes for kids ages 3–12 in Hyderabad. Start with a free 35-minute 1:1 assessment, then choose the right phonics, reading, grammar, writing or speaking path.',
    canonicalPath: '/online-english-classes-hyderabad',
    ogType: 'website',
    keywords:
      'online English classes for kids in Hyderabad,online English classes Hyderabad kids,English classes for kids Hyderabad,English classes for children in Hyderabad,live online English classes for kids Hyderabad,1 to 1 English classes for kids Hyderabad,online English learning for kids Hyderabad',
  },"""
if text.count(old) != 1:
    raise SystemExit(f'Expected 1 Hyderabad registry block, found {text.count(old)}')
path.write_text(text.replace(old, new, 1))
