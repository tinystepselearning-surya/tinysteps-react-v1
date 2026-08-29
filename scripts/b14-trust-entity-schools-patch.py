from pathlib import Path


def replace_once(path: str, old: str, new: str, label: str) -> None:
    file_path = Path(path)
    source = file_path.read_text()
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f'{label}: expected exactly 1 match in {path}, found {count}')
    file_path.write_text(source.replace(old, new, 1))


def replace_all(path: str, old: str, new: str, expected: int, label: str) -> None:
    file_path = Path(path)
    source = file_path.read_text()
    count = source.count(old)
    if count != expected:
        raise RuntimeError(f'{label}: expected {expected} matches in {path}, found {count}')
    file_path.write_text(source.replace(old, new))


# 1) Connect the canonical founder entity to the visible /team founder section.
replace_once(
    'src/pages/TeamPage.tsx',
    """          jobTitle: 'Founder',\n          image: `${SITE_ORIGIN}/priya-founder-tiny-steps-learning.webp`,\n          worksFor: { '@id': ORGANIZATION_ID, name: PUBLIC_FACTS.brandName },\n""",
    """          jobTitle: 'Founder',\n          url: `${SITE_ORIGIN}/team#founder`,\n          mainEntityOfPage: { '@id': `${SITE_ORIGIN}/team#webpage` },\n          image: `${SITE_ORIGIN}/priya-founder-tiny-steps-learning.webp`,\n          worksFor: { '@id': ORGANIZATION_ID, name: PUBLIC_FACTS.brandName },\n""",
    'founder visible entity relationship',
)

# 2) Make the visible founder section use the canonical identity while retaining the familiar name.
replace_once(
    'src/pages/team/TeamPageSections.tsx',
    """import { trackEvent } from '../../lib/analytics';\nimport {\n""",
    """import { trackEvent } from '../../lib/analytics';\nimport { PUBLIC_FACTS } from '../../lib/schemas';\nimport {\n""",
    'Team PUBLIC_FACTS import',
)
replace_once(
    'src/pages/team/TeamPageSections.tsx',
    'export function FounderSection() {\n  return (\n    <section className="bg-white px-4 py-20 sm:px-6 sm:py-24 lg:px-8">',
    'export function FounderSection() {\n  return (\n    <section id="founder" className="bg-white px-4 py-20 sm:px-6 sm:py-24 lg:px-8">',
    'founder anchor',
)
replace_once(
    'src/pages/team/TeamPageSections.tsx',
    '<h3 className="font-heading text-2xl font-bold text-slate-950">Priya</h3>\n            <p className="mt-1 font-semibold text-orange-700">Founder, Tiny Steps Learning</p>',
    '<h3 className="font-heading text-2xl font-bold text-slate-950">{PUBLIC_FACTS.founder.fullName}</h3>\n            <p className="mt-1 font-semibold text-orange-700">\n              Founder, Tiny Steps Learning • known to families as {PUBLIC_FACTS.founder.displayName}\n            </p>',
    'visible founder full identity',
)
replace_once(
    'src/pages/team/TeamPageSections.tsx',
    '<p>The goal is not simply to help children complete lessons. It is to help them demonstrate visible progress in reading accuracy, language confidence, sentence formation and independent communication.</p>',
    '<p>The goal is not simply to help children complete lessons. It is to keep learning progress observable through evidence such as reading accuracy, sentence formation, language use and increasingly independent communication.</p>',
    'trust-safe founder outcome wording',
)

# 3) Strengthen /for-schools evidence provenance and independent-provider clarity.
replace_once(
    'src/pages/ForSchoolsPage.tsx',
    """import { trackCoursePageCtaClick } from '../lib/conversionTracking';\n""",
    """import { trackCoursePageCtaClick } from '../lib/conversionTracking';\nimport { ORGANIZATION_ID } from '../lib/schemas';\n""",
    'schools canonical organization import',
)

old_business_outcomes = """const enrollmentBusinessOutcomes = [\n  {\n    title: 'Parent confidence',\n    detail: 'Clear, observable progress helps families understand the value being created in the classroom.',\n  },\n  {\n    title: 'Continued enrolment',\n    detail: 'When parents can see their child becoming a more confident reader, they have stronger reasons to continue their relationship with the school.',\n  },\n  {\n    title: 'Reputation and referrals',\n    detail: 'Consistent literacy development contributes to a stronger academic reputation and more credible parent-to-parent advocacy.',\n  },\n  {\n    title: 'Leadership visibility',\n    detail: 'A structured review process gives school leaders clearer insight into programme delivery, teacher readiness, and learner progression.',\n  },\n];\n"""
new_implementation_value = """const schoolImplementationValue = [\n  {\n    title: 'Parent communication',\n    detail: 'Shared learning goals and review language help schools explain what children are practising, what is becoming secure, and what needs reinforcement.',\n  },\n  {\n    title: 'Implementation consistency',\n    detail: 'A common sequence, lesson resources, correction routines, and review points help classrooms work from the same phonics implementation model.',\n  },\n  {\n    title: 'Teacher readiness',\n    detail: 'Training, rehearsal, guidance, and follow-up support help teachers understand the agreed routines and progression before and during delivery.',\n  },\n  {\n    title: 'Leadership visibility',\n    detail: 'Baseline checks, checkpoints, and implementation reviews give school leaders clearer evidence of what is being taught and where additional support is needed.',\n  },\n];\n"""
replace_once(
    'src/pages/ForSchoolsPage.tsx',
    old_business_outcomes,
    new_implementation_value,
    'school implementation value framing',
)
replace_all(
    'src/pages/ForSchoolsPage.tsx',
    'enrollmentBusinessOutcomes',
    'schoolImplementationValue',
    1,
    'school implementation value render',
)
replace_once(
    'src/pages/ForSchoolsPage.tsx',
    '<h3 className="text-xl font-black tracking-tight text-white">How visible progress supports school leadership</h3>',
    '<h3 className="text-xl font-black tracking-tight text-white">How structured implementation supports school leadership</h3>',
    'school leadership heading',
)

replace_once(
    'src/pages/ForSchoolsPage.tsx',
    """  dateModified: '2026-08-10',\n  speakable: {\n""",
    """  dateModified: '2026-08-29',\n  citation: [ncfUrl, cbseHpcUrl, dfePhonicsUrl],\n  speakable: {\n""",
    'schools evidence citations',
)
replace_once(
    'src/pages/ForSchoolsPage.tsx',
    """    '@id': 'https://tinystepslearning.com/#organization',\n""",
    """    '@id': ORGANIZATION_ID,\n""",
    'schools canonical provider id',
)

replace_once(
    'src/pages/ForSchoolsPage.tsx',
    """  {\n    question: 'How can visible reading progress support enrolment and reputation?',\n    answer:\n      'Schools can strengthen parent confidence by making learner progress easier to understand. In Early Years, Pre-Primary and Lower Primary, observable development in reading, blending, spelling and writing gives families clearer evidence of classroom learning. A structured phonics programme, supported by teacher training and regular academic review, can support continued enrolment and contribute to a strong school reputation and credible parent recommendations.',\n  },\n""",
    """  {\n    question: 'How can schools communicate reading progress clearly to families?',\n    answer:\n      'Schools can make phonics progress easier for families to understand by reporting the specific skills being practised, what is becoming secure, what still needs reinforcement, and the next teaching focus. Baseline checks, checkpoints, and consistent teacher language can make those conversations more concrete without turning progress reporting into a promise about enrolment or school reputation.',\n  },\n""",
    'school family communication FAQ',
)

replace_once(
    'src/pages/ForSchoolsPage.tsx',
    """                </a>\n              </div>\n            </div>\n\n            <div className=\"grid gap-4\">\n""",
    """                </a>\n              </div>\n              <p className=\"mt-4 max-w-2xl text-xs leading-5 text-slate-600\">\n                Tiny Steps Learning is an independent education provider. Referencing NCF, CBSE, or international\n                phonics criteria explains the evidence and implementation context; it does not imply endorsement,\n                approval, certification or affiliation.\n              </p>\n            </div>\n\n            <div className=\"grid gap-4\">\n""",
    'visible independent provider disclosure',
)

# 4) Remove unsupported enrolment/referral causality from the visible school-value section.
replace_once(
    'src/pages/ForSchoolsPage.tsx',
    '<p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-700">The enrolment business case</p>',
    '<p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-700">Implementation visibility</p>',
    'school value eyebrow',
)
replace_once(
    'src/pages/ForSchoolsPage.tsx',
    '<h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-950 md:text-4xl">\n                Visible reading progress strengthens parent confidence\n              </h2>',
    '<h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-950 md:text-4xl">\n                Make phonics progress easier for families and leaders to understand\n              </h2>',
    'school value heading',
)
replace_once(
    'src/pages/ForSchoolsPage.tsx',
    """                <p>\n                  In the Early Years, Pre-Primary and Lower Primary stages, families often evaluate the quality of\n                  schooling through the progress they can observe in their child’s reading, blending, spelling, and\n                  writing. Report-card scores matter, but visible literacy development gives parents clearer evidence\n                  that classroom learning is becoming lasting capability.\n                </p>\n                <p>\n                  Demonstrable reading progress can strengthen parent trust, support continued enrolment, and\n                  encourage positive recommendations within the school community.\n                </p>\n""",
    """                <p>\n                  In Early Years, Pre-Primary and Lower Primary, families often need clear language for understanding\n                  what children are practising in reading, blending, spelling, and writing. Skill-specific reporting can\n                  make classroom learning easier to discuss than a broad score alone.\n                </p>\n                <p>\n                  A shared implementation sequence, baseline checks, checkpoints, and consistent teacher language give\n                  schools a clearer way to explain what is secure, what needs reinforcement, and what comes next.\n                </p>\n""",
    'school value body copy',
)
replace_once(
    'src/pages/ForSchoolsPage.tsx',
    """                Strong early literacy is not only an academic priority. It is part of the trust a school builds with\n                every family.\n""",
    """                Strong early literacy is an academic priority. Clear evidence and communication help families and\n                school leaders understand the work being done.\n""",
    'school value statement',
)
