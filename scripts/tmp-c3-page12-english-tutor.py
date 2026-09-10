from pathlib import Path

PAGE = Path('src/pages/public/OnlineEnglishClassesForKidsPage.tsx')
REGISTRY = Path('src/lib/routeSeoRegistry.js')

page = PAGE.read_text()
registry = REGISTRY.read_text()


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected 1 match, found {count}')
    return text.replace(old, new, 1)

page = replace_once(
    page,
    "  'online English tutor for kids',\n  'online English classes for kids ages 3 to 12',",
    "  'online English tutor for kids',\n  '1 to 1 English tutor for kids online',\n  'online English classes for kids ages 3 to 12',",
    'page tutor keyword',
)

programme_end = """const programmeTracks = [
  {
    title: 'Phonics',
"""
if programme_end not in page:
    raise SystemExit('programmeTracks start anchor missing')

outcome_anchor = """const outcomeStages = [
"""
tutor_points = """const tutorDecisionPoints = [
  {
    title: 'Individual teacher attention',
    detail: 'A live 1:1 class gives one child the teacher’s attention for the session, so pacing, prompts and guided practice can respond to the child in real time.',
  },
  {
    title: 'Assessment-led starting point',
    detail: 'The first recommendation follows the child’s current English need instead of assuming every learner should begin with the same topic or level.',
  },
  {
    title: 'Live correction and guided retries',
    detail: 'The teacher can notice errors while the child is reading, speaking, building sentences or writing and guide another attempt during the class.',
  },
  {
    title: 'Parent-visible progress',
    detail: 'Parents can follow the recommended programme and progress updates rather than relying only on completed worksheets or app activity.',
  },
];

"""
page = replace_once(page, outcome_anchor, tutor_points + outcome_anchor, 'insert tutor decision points')

programme_section_anchor = """      <LeadSection>
        <LeadSectionHeading
          eyebrow=\"Programme tracks\"
"""
tutor_section = """      <LeadSection>
        <LeadCard className=\"bg-[linear-gradient(150deg,#eef8ff_0%,#ffffff_48%,#fff8ef_100%)]\">
          <LeadSectionHeading
            eyebrow=\"Live 1:1 English tutoring\"
            title=\"What parents get from an online English tutor for kids\"
            description=\"For parents using tutor-style searches, Tiny Steps treats tutoring as live 1:1 teacher-led support inside the same assessment-first English programme system.\"
          />
          <div className=\"mt-6 grid gap-4 md:grid-cols-2\">
            {tutorDecisionPoints.map((item) => (
              <div key={item.title} className=\"rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm\">
                <h3 className=\"text-lg font-semibold text-slate-900\">{item.title}</h3>
                <p className=\"mt-2 text-sm leading-7 text-slate-700\">{item.detail}</p>
              </div>
            ))}
          </div>
          <div className=\"mt-5 rounded-2xl border border-slate-200 bg-white/90 p-5\">
            <h3 className=\"text-lg font-semibold text-slate-900\">General English tutor or subject-specific support?</h3>
            <p className=\"mt-2 text-sm leading-7 text-slate-700\">
              Use this broad English page when you want a live 1:1 English tutor but are not yet sure whether the main gap is phonics, reading, grammar, writing, spoken English, or public speaking and communication. If the need is already clear, the subject programme should remain the primary page rather than competing with this generic tutor owner.
            </p>
            <div className=\"mt-4 flex flex-wrap gap-3 text-sm font-semibold text-slate-900\">
              <Link to=\"/phonics\" className=\"underline underline-offset-4\">Phonics support</Link>
              <Link to=\"/reading-classes-for-kids\" className=\"underline underline-offset-4\">Reading support</Link>
              <Link to=\"/grammar\" className=\"underline underline-offset-4\">Grammar support</Link>
              <Link to=\"/writing-classes-for-kids\" className=\"underline underline-offset-4\">Writing support</Link>
              <Link to=\"/spoken-english-classes-for-kids-online\" className=\"underline underline-offset-4\">Spoken English support</Link>
              <Link to=\"/speaking\" className=\"underline underline-offset-4\">Speaking & communication</Link>
            </div>
          </div>
          <p className=\"mt-5 text-sm leading-7 text-slate-600\">
            A 1:1 format is especially useful when a child needs more individual speaking time, immediate correction, a pace matched to their current level, or a clearer starting recommendation. Small-group classes remain an option for selected fits.
          </p>
        </LeadCard>
      </LeadSection>

"""
page = replace_once(page, programme_section_anchor, tutor_section + programme_section_anchor, 'insert tutor section')

old_faq = """  {
    question: 'Do you offer one-on-one English classes or an online English tutor for kids?',
    answer:
      `Yes. Tiny Steps offers live 1:1 online English learning and may also offer small-group options. Standard 1:1 classes are ${PUBLIC_SESSION_DURATION_LABEL}; small-group duration varies with group size. The learning path is chosen after assessment.`,
  },
"""
new_faq = """  {
    question: 'Do you offer one-on-one English classes or an online English tutor for kids?',
    answer:
      `Yes. Tiny Steps offers live 1:1 online English learning and may also offer small-group options. In a 1:1 class, one child works live with the teacher, who can focus the session on the child’s assessed starting point and current skill goal. Standard 1:1 classes are ${PUBLIC_SESSION_DURATION_LABEL}; small-group duration varies with group size.`,
  },
  {
    question: 'What is the difference between an online English tutor and an online English class at Tiny Steps?',
    answer:
      'On this page, “online English tutor” describes the live 1:1 teaching format, while the programme describes what the child needs to learn. The assessment identifies whether the best starting path is phonics, reading, grammar, writing, spoken English, or public speaking and communication.',
  },
  {
    question: 'Should I choose a general English tutor or a subject-specific English programme?',
    answer:
      'Choose the broad English starting point when you want individual English support but the main gap is not yet clear. If you already know the child specifically needs phonics, reading, grammar, writing, spoken English, or speaking and communication support, use that specialist programme so the learning goal stays clear.',
  },
"""
page = replace_once(page, old_faq, new_faq, 'expand tutor FAQs')

registry = replace_once(
    registry,
    "online English tutor for kids,online English classes for kids ages 3 to 12",
    "online English tutor for kids,1 to 1 English tutor for kids online,online English classes for kids ages 3 to 12",
    'registry tutor keyword',
)

PAGE.write_text(page)
REGISTRY.write_text(registry)
