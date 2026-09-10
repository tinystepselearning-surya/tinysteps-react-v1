from pathlib import Path

path = Path('src/pages/speaking.tsx')
text = path.read_text()
replacements = {
    "Then we suggest the right confidence path.": "Then we suggest the right speaking and communication path.",
    'program="Public Speaking"': 'program="Public Speaking & Communication"',
}
for old, new in replacements.items():
    if old not in text:
        raise SystemExit(f'Missing Page 9 final wording pattern: {old}')
    text = text.replace(old, new, 1)
path.write_text(text)
