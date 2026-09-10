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
new = '''text = replace_once(
    text,
    "              description=\\\"Tiny Steps uses one system across the main learning needs parents usually search for first.\\\"\\n        />\\n        <div className=\\\"mt-6 grid gap-4 md:grid-cols-2\\\">\\n          {programmeTracks.map((track) => (",
    "              description=\\\"Tiny Steps uses one system across the main learning needs parents usually search for first.\\\"\\n        />\\n        <div className=\\\"mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3\\\">\\n          {programmeTracks.map((track) => (",
    'programme grid',
)
'''
if old not in text:
    raise SystemExit('Expected Page 11 helper grid matcher not found')
path.write_text(text.replace(old, new, 1))
