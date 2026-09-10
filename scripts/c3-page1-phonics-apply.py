from pathlib import Path
import re

PAGE = Path('src/pages/phonics.tsx')
REGISTRY = Path('src/lib/routeSeoRegistry.js')

page = PAGE.read_text()
registry = REGISTRY.read_text()


def required(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise SystemExit(f'Missing expected source: {label}')
    return text.replace(old, new, 1)


# Core metadata and hero: /phonics owns generic live phonics-provider intent.
page = required(
    page,
    '"Online Phonics Classes for Kids in India | Tiny Steps"',
    '"Online Phonics Classes for Kids | Live 1:1 | Tiny Steps"',
    'phonics fallback title',
)
page = required(
    page,
    '"Live 1:1 online phonics classes for kids in India. Build letter sounds, blending, CVC words, digraphs, reading fluency and spelling. Book one free 35-minute 1:1 online demo assessment class.";',
    '"Live 1:1 online phonics classes for kids ages 3–12 in India and worldwide. Build blending, decoding, spelling and reading fluency with assessment-first placement.";',
    'phonics fallback description',
)
page = required(
    page,
    'const heroTitle = heroTitleOverride ?? "Online Phonics Classes for Kids in India";',
    'const heroTitle = heroTitleOverride ?? "Online Phonics Classes for Kids";',
    'phonics H1',
)
page = required(
    page,
    '"Premium phonics for kids in India through live 1:1 online phonics classes. We guide children from letter sounds to blending and reading, with structured spelling support and parent-visible progress. Start with a free phonics assessment to choose the right level.";',
    '"Live 1:1 online phonics classes for children ages 3–12 in India and worldwide. We teach letter sounds, blending, decoding, spelling patterns and reading fluency through a structured level-based pathway with parent-visible progress.";',
    'phonics hero subtitle',
)

# Meta-keyword registry: commercial/provider terms only. Comparison, fees, demo and informational terms have other owners.
keyword_block = """const PHONICS_SEO_KEYWORDS = [
  'online phonics classes',
  'online phonics classes for kids',
  'phonics classes for kids',
  'phonics classes in India',
  'live 1:1 phonics classes',
  '1 to 1 phonics classes online',
  'personalised phonics classes for kids',
  'live online phonics classes',
  'structured phonics classes for kids',
  'synthetic phonics classes',
  'phonics classes for struggling readers',
  'phonics tutor online for kids',
  'phonics classes for blending',
  'phonics classes for decoding',
  'phonics classes for ages 3 to 12',
];"""
page, count = re.subn(r"const PHONICS_SEO_KEYWORDS = \[[\s\S]*?\n\];", keyword_block, page, count=1)
if count != 1:
    raise SystemExit('Failed to replace PHONICS_SEO_KEYWORDS')

# FAQs: answer provider-fit questions without trying to own the dedicated comparison cluster.
page = required(
    page,
    'What should parents look for in the best online phonics classes?',
    'How should parents choose an online phonics class for their child?',
    'phonics choice FAQ',
)
page = required(
    page,
    'Look for assessment-first placement, explicit sound teaching, systematic progression, blending and segmenting practice, live correction, decoding instead of guessing, reading and spelling transfer, and clear progress updates for parents. The strongest fit depends on the child’s current level rather than a marketing claim alone.',
    'Look for assessment-first placement, explicit sound teaching, systematic progression, blending and segmenting practice, live correction, reading and spelling transfer, and clear progress visibility. The right class should match the child’s current decoding level and adapt when a prerequisite skill is not secure.',
    'phonics choice FAQ answer',
)
page = required(
    page,
    'Are 1:1 phonics classes better than group phonics classes?',
    'When is live 1:1 phonics support useful?',
    'phonics 1:1 FAQ',
)
page = required(
    page,
    'Both formats can work. Live 1:1 phonics classes are especially useful when a child needs individual pacing, immediate correction, or support for a specific blending, decoding, spelling, or fluency gap. Group classes can suit children who are progressing comfortably at a shared pace.',
    'Live 1:1 phonics support is especially useful when a child needs individual pacing, immediate correction, or focused help with a specific blending, decoding, spelling or fluency gap. The teacher can observe each attempt and adjust the next practice step immediately.',
    'phonics 1:1 FAQ answer',
)
page = required(
    page,
    'Many children show early blending progress in about 4–6 guided lessons. Timelines vary by starting level, attendance consistency, and home reinforcement. Progress is usually step-by-step rather than instant.',
    'Blending progress depends on the child’s starting point. We look for increasing accuracy, less prompting, retention across lessons and successful blending of fresh words at the child’s current stage rather than promising a fixed number of lessons.',
    'phonics progress FAQ',
)
faq_tail = """  {
    question: 'Do parents get progress updates?',
    answer:
      'Yes. Parents receive practical updates on milestones, current gaps, and the next steps in the child’s phonics learning path.',
  },
];"""
faq_tail_new = """  {
    question: 'Do parents get progress updates?',
    answer:
      'Yes. Parents receive practical updates on milestones, current gaps, and the next steps in the child’s phonics learning path.',
  },
  {
    question: 'How long is each Tiny Steps 1:1 phonics class?',
    answer:
      'A standard Tiny Steps live 1:1 phonics class is 35 minutes.',
  },
  {
    question: 'Can families outside India join Tiny Steps phonics classes?',
    answer:
      'Yes. Tiny Steps supports families in India and worldwide through live online phonics classes, subject to compatible teacher and class timings.',
  },
];"""
page = required(page, faq_tail, faq_tail_new, 'phonics duration and worldwide FAQs')

# Keep only concise class-fit guidance on the generic owner; provider-comparison depth belongs to page 2.
fit_block = """const classFitCriteria = [
  {
    title: 'Start from the child’s current level',
    detail: 'Placement should check what the child can already hear, decode, blend, read and spell before selecting the starting point.',
  },
  {
    title: 'Follow a cumulative sequence',
    detail: 'Sound–spelling links should build in a planned order so new patterns depend on skills the child has already secured.',
  },
  {
    title: 'Correct errors while they happen',
    detail: 'The teacher should hear the child read, identify the exact decoding error, model the correction and give another attempt.',
  },
  {
    title: 'Check transfer into real reading',
    detail: 'Progress should appear in fresh word reading, sentence reading and spelling—not only in memorised sound drills.',
  },
];
const intentSupportChips"""
page, count = re.subn(
    r"const bestClassCriteria = \[[\s\S]*?\n\];\nconst intentSupportChips",
    fit_block,
    page,
    count=1,
)
if count != 1:
    raise SystemExit('Failed to replace class-fit criteria')
page = page.replace('bestClassCriteria.map', 'classFitCriteria.map')
page = required(
    page,
    "name: 'What parents should look for in online phonics classes',",
    "name: 'How parents can evaluate online phonics classes',",
    'phonics criteria schema name',
)

# Explicit comparison handoff in hero and quick-answer section.
page = required(
    page,
    """Parents comparing providers often start with our{' '}
              <Link to=\"/best-online-phonics-classes-for-kids-in-india\" className=\"font-semibold text-slate-900 underline underline-offset-4 hover:text-sky-700\">
                best online phonics classes for kids in India
              </Link>{' '}
              guide before booking a free 35-minute 1:1 online demo assessment class.""",
    """If you want a provider-by-provider decision framework, use our{' '}
              <Link to=\"/best-online-phonics-classes-for-kids-in-india\" className=\"font-semibold text-slate-900 underline underline-offset-4 hover:text-sky-700\">
                phonics class comparison guide
              </Link>{' '}
              before booking a free 35-minute 1:1 online demo assessment class.""",
    'phonics hero comparison handoff',
)
page = required(
    page,
    """Compare options in our{' '}
              <Link to=\"/best-online-phonics-classes-for-kids-in-india\" className=\"font-semibold text-slate-900 underline underline-offset-4 hover:text-sky-700\">
                best online phonics classes for kids in India
              </Link>{' '}
              guide or book one free 35-minute 1:1 online demo assessment class to choose the right starting level.""",
    """Need to compare providers, formats or value? Use our{' '}
              <Link to=\"/best-online-phonics-classes-for-kids-in-india\" className=\"font-semibold text-slate-900 underline underline-offset-4 hover:text-sky-700\">
                dedicated phonics comparison guide
              </Link>{' '}
              or book one free 35-minute 1:1 online demo assessment class to check the right starting level.""",
    'phonics overview comparison handoff',
)

# Replace the long provider-comparison section with concise class-fit guidance and a clean handoff.
start_marker = '      <SectionShell id="best-phonics-classes">'
end_marker = '      <SectionShell className="py-7 sm:py-8">'
if start_marker not in page or end_marker not in page:
    raise SystemExit('Missing phonics comparison section markers')
start = page.index(start_marker)
end = page.index(end_marker, start)
replacement = """      <SectionShell id=\"choosing-phonics-support\">
        <div className=\"rounded-[2rem] border border-orange-100 bg-gradient-to-br from-[#FFF9F1] via-white to-[#F2FAFF] p-6 shadow-xl sm:p-8\">
          <SectionHeader
            eyebrow=\"Choosing the right support\"
            title=\"How to evaluate an online phonics class for your child\"
            subtitle=\"A useful phonics class should begin at the child’s actual reading level, teach skills cumulatively, correct errors live, and check whether learning transfers into fresh words and connected reading.\"
          />
          <div className=\"mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4\">
            {classFitCriteria.map((criterion, index) => (
              <PremiumCard key={criterion.title} className=\"h-full p-5 transition hover:-translate-y-0.5 hover:shadow-lg\">
                <div className=\"flex items-center gap-3\">
                  <NumberBadge value={index + 1} />
                  <h3 className=\"text-base font-semibold text-slate-900\">{criterion.title}</h3>
                </div>
                <p className=\"mt-3 text-sm leading-relaxed text-slate-700\">{criterion.detail}</p>
              </PremiumCard>
            ))}
          </div>
          <div className=\"mt-7 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 lg:flex-row lg:items-center lg:justify-between\">
            <div className=\"max-w-3xl\">
              <h3 className=\"text-lg font-semibold text-slate-900\">Want a deeper provider comparison?</h3>
              <p className=\"mt-2 text-sm leading-6 text-slate-700\">
                The dedicated comparison guide covers 1:1 versus group format, curriculum structure, teacher attention, pricing, placement and parent support. This programme page stays focused on how Tiny Steps phonics works.
              </p>
            </div>
            <div className=\"flex flex-wrap gap-2\">
              <Link to=\"/best-online-phonics-classes-for-kids-in-india\" className=\"rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800\">
                Open comparison guide
              </Link>
              <Link to=\"/curriculum?tab=phonics\" className=\"rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50\">
                Review curriculum
              </Link>
            </div>
          </div>
        </div>
      </SectionShell>

"""
page = page[:start] + replacement + page[end:]
page = page.replace("['How to Choose', '#best-phonics-classes']", "['How to Choose', '#choosing-phonics-support']", 1)

# Canonical class duration and evidence-led progress language.
page = required(
    page,
    'duration="35–40 minutes, 2–3x per week"',
    'duration="35 minutes per live 1:1 class"',
    'phonics ProgramFacts duration',
)
page = required(
    page,
    "{ value: '4–6', label: 'Lessons to begin first blending, depending on readiness' },",
    "{ value: 'Fresh-word transfer', label: 'Blending checked on unfamiliar words at the child’s current stage' },",
    'phonics progress metric one',
)
page = required(
    page,
    "{ value: '30–40', label: 'Lessons to cover core phonics foundations' },",
    "{ value: 'Individual pace', label: 'Progression depends on starting level, retention, accuracy and transfer' },",
    'phonics progress metric two',
)
page = required(
    page,
    "{ value: 'Live guidance', label: 'Correction, pacing, and confidence support' },",
    "{ value: 'Live 1:1', label: 'Immediate correction, pacing and guided retries' },",
    'phonics progress metric four',
)

# Global eligibility belongs on the core owner; no new country pages are created.
page = required(page, 'eyebrow="Available across India"', 'eyebrow="India and worldwide"', 'phonics location eyebrow')
page = required(
    page,
    'title="Online phonics classes for kids across India"',
    'title="Live online phonics classes for families in India and worldwide"',
    'phonics location heading',
)
page = required(
    page,
    'subtitle="Live online support without location barriers."',
    'subtitle="One structured live 1:1 pathway, with class timings matched where teacher availability allows."',
    'phonics location subtitle',
)
page = required(
    page,
    'Tiny Steps supports children across India through live online classes. Parents from cities such as Hyderabad, Bengaluru, Chennai, Mumbai, Delhi, Pune, Kolkata, and other locations can book one free 35-minute 1:1 online demo assessment class and receive a level-based phonics path.',
    'Tiny Steps supports children in India and worldwide through live online classes. Families in India, the UAE, United States, United Kingdom, Australia, Singapore and other locations—including NRI families—can request a free 35-minute 1:1 demo assessment, subject to compatible teacher and class timings.',
    'phonics worldwide paragraph',
)
page = page.replace('online English classes for kids in India', 'online English classes for kids', 1)

# Prerender and runtime SEO must agree.
route_pattern = re.compile(r"  '/phonics': \{[\s\S]*?\n  \},")
route_block = """  '/phonics': {
    title: 'Online Phonics Classes for Kids | Live 1:1 | Tiny Steps',
    description:
      'Live 1:1 online phonics classes for kids ages 3–12 in India and worldwide. Build blending, decoding, spelling and reading fluency with assessment-first placement.',
    canonicalPath: '/phonics',
    ogType: 'website',
    keywords:
      'online phonics classes,online phonics classes for kids,phonics classes for kids,phonics classes in India,live 1:1 phonics classes,1 to 1 phonics classes online,personalised phonics classes for kids,live online phonics classes,structured phonics classes for kids,synthetic phonics classes,phonics classes for struggling readers,phonics tutor online for kids,phonics classes for blending,phonics classes for decoding,phonics classes for ages 3 to 12',
  },"""
registry, count = route_pattern.subn(route_block, registry, count=1)
if count != 1:
    raise SystemExit('Failed to replace /phonics route SEO block')

# Page-1-only assertions. Full repository CI is intentionally deferred until all 15 reviews are complete.
for token in [
    "'best online phonics classes'",
    "'best online phonics classes in India'",
    "'best phonics classes for kids'",
    'duration="35–40 minutes',
    'Lessons to begin first blending',
    'Lessons to cover core phonics foundations',
]:
    if token in page:
        raise SystemExit(f'Forbidden stale Page 1 token remains: {token}')

for token in [
    'Online Phonics Classes for Kids | Live 1:1 | Tiny Steps',
    'India and worldwide',
    '35 minutes per live 1:1 class',
    'phonics class comparison guide',
    'const classFitCriteria',
    "areaServed: ['India', 'Worldwide']",
]:
    if token not in page:
        raise SystemExit(f'Required Page 1 token missing: {token}')

PAGE.write_text(page)
REGISTRY.write_text(registry)
print('Page 1 /phonics reconciliation applied successfully.')
