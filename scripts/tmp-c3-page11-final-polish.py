from pathlib import Path

path = Path('src/pages/public/OnlineEnglishClassesForKidsPage.tsx')
text = path.read_text()

replacements = {
    "        'reading fluency',": "        'reading',",
    "              'Children who need phonics, reading, grammar, writing, or spoken-English support inside one structured learning system.',": "              'Children who need phonics, reading, grammar, writing, spoken-English, or public-speaking and communication support inside one structured learning system.',",
    "                '5000+ students served',\n                'Families in 15+ countries',": "                PUBLIC_LEARNER_REACH_LABEL,\n                'India + worldwide online access',",
    "              <li>2. Tiny Steps checks the relevant phonics, reading, grammar, writing, sentence-formation, or speaking skills.</li>": "              <li>2. Tiny Steps checks the relevant phonics, reading, grammar, writing, spoken-English, public-speaking, communication, or confidence need.</li>",
    "              ['/speaking', 'Public speaking & communication'],\n              ['/pricing', 'Pricing'],": "              ['/speaking', 'Public speaking & communication'],\n              ['/confidence-building-program-kids', 'Confidence building'],\n              ['/pricing', 'Pricing'],",
}

for old, new in replacements.items():
    if old not in text:
        raise SystemExit(f'Missing final Page 11 polish pattern: {old[:90]}')
    text = text.replace(old, new, 1)

path.write_text(text)
