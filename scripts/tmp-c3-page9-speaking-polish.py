from pathlib import Path

path = Path('src/pages/speaking.tsx')
text = path.read_text()
replacements = {
    'Tiny Steps begins with a free 35-minute 1:1 online demo assessment class to identify whether the child needs sentence expansion, speaking comfort, storytelling flow, or confidence support.':
        'Tiny Steps begins with a free {demoMinutes}-minute 1:1 online demo assessment class to identify whether the child needs public-speaking structure, communication practice, everyday spoken-English support, grammar support, or specialist confidence-building support.',
    'Book Free 35-Minute Demo': 'Book Free {demoMinutes}-Minute Demo',
}
for old, new in replacements.items():
    if old not in text:
        raise SystemExit(f'Missing Page 9 polish pattern: {old}')
    text = text.replace(old, new, 1)
path.write_text(text)
