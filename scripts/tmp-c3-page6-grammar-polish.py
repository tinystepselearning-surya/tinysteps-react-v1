from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise SystemExit(f'Expected pattern not found: {label}')
    return text.replace(old, new, 1)

path = Path('src/pages/grammar.tsx')
text = path.read_text()

# Remove the duplicate visible FAQ rendering. The later #faq section remains canonical.
duplicate_faq = """      <section className=\"bg-[#fffaf3] px-4 py-8 sm:px-5 md:py-12 lg:px-6 lg:py-14\">
        <div className=\"mx-auto max-w-6xl rounded-2xl border border-[#F1D8A8] bg-white/95 p-5 shadow-sm md:rounded-3xl md:p-7\">
          <h2 className=\"text-2xl font-bold text-slate-900 sm:text-3xl\">Grammar questions parents ask</h2>
          <div className=\"mt-5 grid gap-4 md:grid-cols-2\">
            {faqItems.map((item) => (
              <article key={item.question} className=\"rounded-2xl border border-slate-200 bg-white p-5\">
                <h3 className=\"text-base font-semibold text-slate-900\">{item.question}</h3>
                <p className=\"mt-2 text-sm leading-6 text-slate-700\">{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

"""
text = replace_once(text, duplicate_faq, '', 'duplicate FAQ section')

text = replace_once(
    text,
    """            Tiny Steps supports families across India and internationally through the same live online grammar programme. Children in India and NRI/international families can <Link to=\"/book-demo\" className=\"font-semibold text-slate-900 underline underline-offset-2\">book one free {demoMinutes}-minute 1:1 online demo assessment class</Link>; suitable class timings and the correct grammar level are confirmed before enrolment.""",
    """            Tiny Steps supports families across India and internationally through the same live online grammar programme. Families in the UAE, United States, United Kingdom, Australia, Singapore and other countries—including NRI families—can <Link to=\"/book-demo\" className=\"font-semibold text-slate-900 underline underline-offset-2\">book one free {demoMinutes}-minute 1:1 online demo assessment class</Link>; suitable class timings and the correct grammar level are confirmed before enrolment.""",
    'international market clarity',
)

# Ensure only one visible FAQ map remains.
if text.count('{faqItems.map((item) => (') != 1:
    raise SystemExit(f'Expected exactly one visible FAQ rendering, found {text.count("{faqItems.map((item) => (")}')

for token in [
    'UAE, United States, United Kingdom, Australia, Singapore',
    'Frequently asked questions',
    'Online Grammar Classes for Kids',
]:
    if token not in text:
        raise SystemExit(f'Grammar polish missing {token!r}')

path.write_text(text)
print('Page 6 grammar polish applied successfully.')
