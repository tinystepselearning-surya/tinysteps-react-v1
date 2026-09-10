from pathlib import Path

path = Path('scripts/tmp-c3-page11-broad-english.py')
text = path.read_text()
old = '''text = replace_once(
    text,
    "          <div className=\\\"mt-6 grid gap-4 md:grid-cols-2\\\">\\n          {programmeTracks.map((track) => (",
    "          <div className=\\\"mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3\\\">\\n          {programmeTracks.map((track) => (",
    'programme grid',
)
'''
if old not in text:
    raise SystemExit('Expected cosmetic programme-grid patch not found')
path.write_text(text.replace(old, '', 1))
