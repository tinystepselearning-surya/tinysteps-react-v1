from pathlib import Path

path = Path('src/lib/routeSeoRegistry.js')
text = path.read_text()
old = """  '/writing-classes-for-kids': {
    title: 'English Writing Classes for Kids | Tiny Steps Learning',
    description:
      'English writing classes for kids focused on sentence writing, paragraph writing, grammar in use, and clearer idea expression with live guidance.',
    canonicalPath: '/writing-classes-for-kids',
    ogType: 'website',
  },"""
new = """  '/writing-classes-for-kids': {
    title: 'Creative Writing Classes for Kids Online | Live 1:1 | Tiny Steps',
    description:
      'Live 1:1 creative and English writing classes for kids in India and worldwide. Build ideas, paragraphs, school answers, editing skills and independent writing with personalised feedback.',
    canonicalPath: '/writing-classes-for-kids',
    ogType: 'website',
    keywords:
      'creative writing classes for kids online,online writing classes for kids,writing classes for kids,English writing classes for kids,1 to 1 writing classes online,paragraph writing classes for kids,story writing classes for kids,school writing support for kids,writing tutor for kids online,writing improvement classes for kids,creative writing tutor for kids,online writing classes for kids worldwide',
  },"""
if old not in text:
    raise SystemExit('Expected writing route SEO block not found')
path.write_text(text.replace(old, new, 1))
