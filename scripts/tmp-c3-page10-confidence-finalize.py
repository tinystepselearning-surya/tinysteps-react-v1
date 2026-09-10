from pathlib import Path

page = Path('src/pages/public/ConfidenceBuildingProgramKidsPage.tsx')
text = page.read_text()

# JSX text must not expose Markdown emphasis markers.
text = text.replace('**', '')
text = text.replace(
    'clearer voice and eye-level engagement where appropriate, and greater willingness to attempt unfamiliar topics.',
    'steadier delivery, and greater willingness to attempt unfamiliar topics.',
)

required_page = [
    "const seoTitle = 'Confidence Building Classes for Kids | Live 1:1 | Tiny Steps';",
    "'confidence building classes for kids'",
    "areaServed: ['India', 'Worldwide']",
    'Confidence Building vs other Tiny Steps programmes',
    'Searching about a shy child, or looking for classes?',
    'Is this programme a treatment for anxiety or a speech or language disorder?',
]
for marker in required_page:
    if marker not in text:
        raise SystemExit(f'Missing Page 10 marker: {marker}')
if '**' in text:
    raise SystemExit('Markdown emphasis markers remain in Page 10 JSX')
page.write_text(text)

registry = Path('src/lib/routeSeoRegistry.js')
rtext = registry.read_text()
old = """  '/confidence-building-program-kids': {
    title: 'Confidence Building Program for Kids | Tiny Steps',
    description:
      'Structured communication pathway for children needing stronger vocabulary, sentence formation, guided speaking, storytelling, expression, and confidence.',
    canonicalPath: '/confidence-building-program-kids',
    ogType: 'website',
  },"""
new = """  '/confidence-building-program-kids': {
    title: 'Confidence Building Classes for Kids | Live 1:1 | Tiny Steps',
    description:
      'Live 1:1 confidence-building classes for kids in India and worldwide. Build speaking comfort, participation confidence and independent expression in 35-minute classes.',
    canonicalPath: '/confidence-building-program-kids',
    ogType: 'website',
    keywords:
      'confidence building classes for kids,confidence building program for kids,online confidence building classes for kids,1 to 1 confidence building classes for kids,speaking confidence classes for kids,confidence classes for shy children,live confidence building classes for kids,online confidence program for kids,confidence building classes for children,confidence building classes for kids worldwide',
  },"""
if old not in rtext:
    raise SystemExit('Missing expected Page 10 prerender registry block')
registry.write_text(rtext.replace(old, new, 1))
