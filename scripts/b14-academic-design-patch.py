from pathlib import Path


def replace_once(path: str, old: str, new: str, label: str) -> None:
    file_path = Path(path)
    source = file_path.read_text()
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f'{label}: expected exactly 1 match in {path}, found {count}')
    file_path.write_text(source.replace(old, new, 1))


# 1) Put the academic-design trust layer on /team, where the organisation explains
#    how curriculum decisions move from research and pedagogy into live teaching.
research_to_classroom_section = r'''export function ResearchToClassroomSection() {
  const designInputs = [
    {
      title: 'Child development',
      detail: 'Age, readiness, attention, language growth and the amount of support a child can use productively shape how a lesson is designed and paced.',
    },
    {
      title: 'Learning science',
      detail: 'New learning is sequenced around prerequisites, guided practice, retrieval, cumulative review and gradual reduction of support rather than one-off exposure.',
    },
    {
      title: 'Early-literacy pedagogy',
      detail: 'Phonological awareness, sound-to-print connection, blending, decoding, spelling patterns, fluency and connected reading are organised as related skills rather than isolated activities.',
    },
    {
      title: 'Language development',
      detail: 'Grammar, sentence building, vocabulary and speaking tasks are planned so children practise using language, not only naming rules or completing worksheets.',
    },
  ];

  const researchToClassroom = [
    'Review child-development and subject-pedagogy evidence',
    'Map the prerequisite skills for the learning goal',
    'Build the curriculum progression',
    'Design the lesson plan, examples and practice',
    'Prepare teachers around the shared teaching method',
    'Observe the child’s response during class',
    'Adjust modelling, prompts, repetition and practice time',
    'Review progress and decide the next teaching focus',
  ];

  const responsiveTeaching = [
    'Use short, age-appropriate tasks and predictable lesson routines.',
    'Model clearly before expecting independent performance.',
    'Change the example, prompt or amount of repetition when a child is not yet secure.',
    'Give guided retries and specific, encouraging feedback instead of rushing to the next activity.',
    'Reduce support deliberately as accuracy and independence become more secure.',
    'Move forward because the child is ready for the next step—not simply because a lesson number is complete.',
  ];

  return (
    <section className="bg-white px-4 py-20 sm:px-6 sm:py-24 lg:px-8" aria-labelledby="academic-design-heading">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="How Tiny Steps designs learning"
          title="Research-informed planning. Child-responsive teaching."
          description="Tiny Steps courses are not assembled as a list of worksheets. Academic planning draws on child development, learning science, early-literacy pedagogy, language development and recurring learner difficulties seen through teaching and assessment. Those inputs are translated into skill prerequisites, curriculum progression, lesson plans, teacher guidance and review points."
        />

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {designInputs.map((item, index) => (
            <article key={item.title} className="rounded-[24px] border border-slate-200 bg-[#fffaf3] p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
              <span className="text-xs font-black tracking-[0.16em] text-orange-600">0{index + 1}</span>
              <h3 className="mt-4 font-heading text-xl font-bold text-slate-950">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.detail}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="rounded-[28px] bg-[#10243e] p-6 text-white shadow-[0_22px_60px_rgba(15,23,42,0.16)] sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-300">From research to classroom practice</p>
            <ol className="mt-6 grid gap-3 sm:grid-cols-2">
              {researchToClassroom.map((step, index) => (
                <li key={step} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-300 text-xs font-black text-slate-950">{index + 1}</span>
                  <span className="text-sm font-semibold leading-6 text-white/85">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-[28px] border border-emerald-200 bg-emerald-50/70 p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">Structured curriculum. Responsive teaching.</p>
            <h3 className="mt-3 font-heading text-2xl font-bold leading-tight text-slate-950">The sequence is structured. The child is not forced through it at a fixed speed.</h3>
            <p className="mt-4 text-sm leading-7 text-slate-700">
              Teachers work toward the same lesson objective and instructional principles, while responding to the child in front of them. They watch accuracy, independence, recurring errors and readiness, then adapt how much modelling, prompting, repetition and practice is needed before moving on.
            </p>
            <ul className="mt-6 space-y-3">
              {responsiveTeaching.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 rounded-2xl border border-emerald-200 bg-white/80 p-4 text-xs leading-5 text-slate-600">
              This describes Tiny Steps instructional design and teaching practice. It is evidence-informed education work, not clinical psychology, a learning-style label, or a promise that every child will progress at the same rate.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

'''

replace_once(
    'src/pages/team/TeamPageSections.tsx',
    'export function TeacherDevelopmentSection() {',
    research_to_classroom_section + 'export function TeacherDevelopmentSection() {',
    'team research-to-classroom section',
)

replace_once(
    'src/pages/TeamPage.tsx',
    '  QualitySystemSection,\n  SchoolPartnershipSection,',
    '  QualitySystemSection,\n  ResearchToClassroomSection,\n  SchoolPartnershipSection,',
    'team academic design import',
)
replace_once(
    'src/pages/TeamPage.tsx',
    '      <AcademicSystemSection />\n      <TeacherDevelopmentSection />',
    '      <AcademicSystemSection />\n      <ResearchToClassroomSection />\n      <TeacherDevelopmentSection />',
    'team academic design render',
)

# 2) Give school leaders a concise version of the same academic-design contract.
schools_academic_design = r'''      <LeadSection id="academic-design">
        <LeadCard className="overflow-hidden border-emerald-100 bg-gradient-to-br from-white via-emerald-50/45 to-sky-50/55">
          <LeadSectionHeading
            eyebrow="How academic design becomes classroom practice"
            title="A protected teaching method, with room to respond to the learner"
            description="The programme is more than lesson files. Curriculum progression, lesson plans, teacher preparation, observation and review are designed as one connected implementation system."
          />

          <div className="mt-8 grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">Academic design inputs</p>
              <div className="mt-5 space-y-4 text-sm leading-7 text-slate-700">
                <p>
                  Tiny Steps planning draws on child development, learning science, early-literacy pedagogy,
                  language development and recurring learner difficulties identified through teaching and assessment.
                </p>
                <p>
                  Those inputs are translated into prerequisite skills, a protected progression, lesson objectives,
                  examples, guided practice, correction routines, cumulative review and checkpoints that teachers can
                  use consistently across classrooms.
                </p>
              </div>
              <div className="mt-6 rounded-2xl bg-slate-950 p-5 text-white">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-300">Shared teaching principle</p>
                <p className="mt-2 text-lg font-black">Model → guided practice → observe → correct → retry → reduce support</p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50/70 p-6">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">Structured curriculum. Responsive teaching.</p>
              <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950">Consistency does not mean forcing every child through the same pace.</h3>
              <p className="mt-4 text-sm leading-7 text-slate-700">
                Teachers keep the agreed learning objective and progression, while adjusting modelling, prompts,
                examples, repetition and practice time in response to learner accuracy, independence and recurring
                errors. Support is reduced as the child becomes more secure.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  'Short, age-appropriate tasks',
                  'Predictable teaching routines',
                  'Guided retries before moving on',
                  'Specific, encouraging feedback',
                  'Extra practice when a prerequisite is weak',
                  'Progression based on readiness, not lesson-number pressure',
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-emerald-200 bg-white/85 p-4 text-sm font-bold leading-6 text-slate-800">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="mt-6 text-xs leading-5 text-slate-600">
            These are Tiny Steps instructional-design and implementation principles. They do not represent clinical
            psychology services, learner-type labels, or a guarantee that children progress at a fixed or accelerated rate.
          </p>
        </LeadCard>
      </LeadSection>

'''
replace_once(
    'src/pages/ForSchoolsPage.tsx',
    '      <LeadSection id="implementation-pathway">',
    schools_academic_design + '      <LeadSection id="implementation-pathway">',
    'schools academic design section',
)
