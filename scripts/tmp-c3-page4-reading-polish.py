from pathlib import Path

path = Path('src/pages/public/ReadingClassesForKidsPage.tsx')
text = path.read_text()

old_price = "Current standard 1:1 pricing is {oneToOnePrice} per class; confirm current options on the <Link to=\"/pricing\" className=\"font-semibold underline underline-offset-2\">pricing page</Link>."
new_price = "Current standard 1:1 pricing is ₹{oneToOnePrice} per class; confirm current options on the <Link to=\"/pricing\" className=\"font-semibold underline underline-offset-2\">pricing page</Link>."
if old_price not in text:
    raise SystemExit('Expected price sentence not found')
text = text.replace(old_price, new_price, 1)

anchor = """          <p className=\"mt-6 text-sm leading-6 text-slate-600\">
            No reading provider is the best fit for every child. Tiny Steps explains its approach and shows supporting evidence so parents can decide whether the programme matches their child’s reading gap.
          </p>"""
addition = anchor + """
          <p className=\"mt-3 text-sm leading-6 text-slate-600\">
            Searching for reading and writing classes for kids together? This page focuses on reading. For sentence, paragraph, and creative-writing support, use the dedicated{' '}
            <Link to=\"/writing-classes-for-kids\" className=\"font-semibold text-sky-800 underline underline-offset-2\">Writing Classes for Kids</Link> page.
          </p>"""
if anchor not in text:
    raise SystemExit('Expected reading/writing boundary anchor not found')
text = text.replace(anchor, addition, 1)

path.write_text(text)
