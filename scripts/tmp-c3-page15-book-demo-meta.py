from pathlib import Path

path = Path('src/lib/routeSeoRegistry.js')
text = path.read_text()
old = """  '/book-demo': {
    title: 'Book a Free 35-Minute Demo Assessment Class | Tiny Steps Learning',
    description:
      'Book a free 1:1 online English assessment for your child. Understand their level in phonics, reading, grammar, sentence formation, and speaking confidence.',
    canonicalPath: '/book-demo',
    ogType: 'website',
  },"""
new = """  '/book-demo': {
    title: 'Free 35-Minute 1:1 English Assessment | Tiny Steps',
    description:
      'Book one free 35-minute live 1:1 online English assessment for your child. Identify the right phonics, reading, grammar, writing or speaking path before enrolment.',
    canonicalPath: '/book-demo',
    ogType: 'website',
    keywords:
      'free English assessment for kids online,free online English assessment for kids,free English demo class for kids,free online English demo class,free 1 to 1 English demo class,English level assessment for kids,online English assessment for child,free English trial class for kids,book English demo class for kids,free phonics assessment online,free reading assessment for kids,free grammar assessment for kids,free speaking assessment for kids',
  },"""
if old not in text:
    raise SystemExit('Expected /book-demo registry block not found')
path.write_text(text.replace(old, new, 1))
