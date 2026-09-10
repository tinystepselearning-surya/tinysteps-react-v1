from pathlib import Path

path = Path('scripts/tmp-c3-page9-speaking.py')
text = path.read_text()
replacements = {
    'bg\\[#fff6ec\\]': 'bg-\\[#fff6ec\\]',
    'bg\\[#fffaf3\\]': 'bg-\\[#fffaf3\\]',
}
for old, new in replacements.items():
    if old not in text:
        raise SystemExit(f'Missing helper pattern: {old}')
    text = text.replace(old, new)
path.write_text(text)
