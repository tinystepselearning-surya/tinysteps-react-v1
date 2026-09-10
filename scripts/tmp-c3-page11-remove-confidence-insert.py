from pathlib import Path

path = Path('scripts/tmp-c3-page11-broad-english.py')
text = path.read_text()
old = '''text = replace_once(
    text,
    "          </div>\\n        </LeadSection>\\n\\n      <LeadSection>\\n        <div className=\\\"grid gap-5 lg:grid-cols-[1.1fr_0.9fr]\\\">",
    "          </div>\\n          <p className=\\\"mt-5 text-sm leading-7 text-slate-600\\\">\\n            If the child&apos;s main barrier is willingness to participate or speaking comfort rather than an English-skill gap, review the{' '}\\n            <Link to=\\\"/confidence-building-program-kids\\\" className=\\\"font-semibold underline underline-offset-4\\\">\\n              specialist Confidence Building programme\\n            </Link>.\\n          </p>\\n        </LeadSection>\\n\\n      <LeadSection>\\n        <div className=\\\"grid gap-5 lg:grid-cols-[1.1fr_0.9fr]\\\">",
    'confidence specialist handoff',
)
'''
if old not in text:
    raise SystemExit('Expected Page 11 confidence insertion patch not found')
path.write_text(text.replace(old, '', 1))
