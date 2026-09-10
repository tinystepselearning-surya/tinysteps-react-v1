from pathlib import Path

path = Path('src/pages/public/BookDemoPage.tsx')
text = path.read_text()
old = "    url: bookDemoCanonicalUrl,\n    availability: 'https://schema.org/InStock',\n"
new = "    url: bookDemoCanonicalUrl,\n"
if old not in text:
    raise SystemExit('Expected assessment offer availability assertion not found')
path.write_text(text.replace(old, new, 1))
