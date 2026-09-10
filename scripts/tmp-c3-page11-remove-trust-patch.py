from pathlib import Path

path = Path('scripts/tmp-c3-page11-broad-english.py')
text = path.read_text()
old = '''text = replace_once(
    text,
    "                '5000+ students served',\\n                'Families in 15+ countries',\\n                'Live teacher-led learning',\\n                'Class samples available before parents decide',\\n                'Weekly parent updates after classes begin',",
    "                PUBLIC_LEARNER_REACH_LABEL,\\n                'India + worldwide online access',\\n                'Live teacher-led learning',\\n                'Class samples available before parents decide',\\n                'Parent-visible progress updates after classes begin',",
    'trust proof list',
)
'''
if old not in text:
    raise SystemExit('Expected Page 11 trust-list patch not found')
path.write_text(text.replace(old, '', 1))
