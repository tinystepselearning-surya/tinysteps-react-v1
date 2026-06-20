import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import AboutAuthor from '../../components/AboutAuthor';
import ClusterSeoNav from '../../components/programs/ClusterSeoNav';
import ContentTrustNote from '../../components/seo/ContentTrustNote';
import TestimonialsSection from '../../components/seo/TestimonialsSection';
import { ONE_TO_ONE_MONTHLY_PACKAGES, PER_CLASS_PRICE, formatINR } from '../../config/pricing';
import { applySeo, getRouteConfig } from '../../lib/seo';
import { createFAQPageSchema, createWebPageSchema, PUBLIC_FACTS } from '../../lib/schemas';

const quickAnswerBlocks = [
  {
    title: 'What makes a phonics class "best"?',
    answer:
      'The best online phonics class for kids in India checks the child’s current level first, teaches sounds and blending step by step, corrects mistakes live, and shows parents clear progress instead of vague promises.',
  },
  {
    title: 'Who is Tiny Steps best for?',
    answer:
      'Tiny Steps is best for children who need personal attention, structured phonics, and a consistent mentor instead of large rotating batches or app-only practice.',
  },
  {
    title: 'What happens before enrollment?',
    answer:
      'Parents start with a free assessment, understand the child’s reading stage, and then choose the right class frequency and plan with a clear recommendation.',
  },
];

const heroChips = [
  {
    label: 'Ages 3–7 + catch-up to 12',
    className: 'border-[#F4D7B2] bg-[#FFF7EA] text-[#7A4A10]',
    dotClassName: 'bg-[#E78D3C]',
  },
  {
    label: 'Live 1:1 guidance',
    className: 'border-[#D8E7F6] bg-[#F6FBFF] text-[#214667]',
    dotClassName: 'bg-[#67A8E3]',
  },
  {
    label: 'Structured phonics path',
    className: 'border-[#E3DCF8] bg-[#FBF8FF] text-[#4D417E]',
    dotClassName: 'bg-[#9A86E5]',
  },
  {
    label: 'Parent progress updates',
    className: 'border-[#D4EDD9] bg-[#F4FFF7] text-[#236048]',
    dotClassName: 'bg-[#55B784]',
  },
];

const parentQuestionRows = [
  {
    question: 'Is this 1:1 or group?',
    answer: 'Live 1:1 online phonics classes are the core path. Small-group options may be available for some schedules or program fits.',
  },
  {
    question: 'What age group is this for?',
    answer:
      'Tiny Steps serves ages 3–12. Most early phonics learners start around ages 3–7, while older children can join for decoding gaps, reading catch-up, or fluency support.',
  },
  {
    question: 'What is teacher quality like?',
    answer:
      'Classes are guided by trained mentors using structured lesson flow, live correction, child-friendly pacing, and parent-visible next steps.',
  },
  {
    question: 'What curriculum is used?',
    answer:
      'Tiny Steps follows a structured synthetic phonics path: sounds, blending, CVC words, digraphs, vowel teams, spelling patterns, sentence reading, and fluency.',
  },
  {
    question: 'How long is each class?',
    answer: `Each live class runs for ${PUBLIC_FACTS.sessionDuration}.`,
  },
  {
    question: 'What platform is used?',
    answer: 'Classes run live on Zoom, so families in India and abroad can join from home with a simple browser link.',
  },
  {
    question: 'Do parents get support?',
    answer:
      'Yes. Parents receive progress updates, milestone visibility, and next-step guidance so home practice stays simple and targeted.',
  },
  {
    question: 'What is the current pricing reference?',
    answer:
      'Current standard reference pricing is ₹400 per class, with the starter 12-class plan at ₹4,800 after the free assessment confirms fit.',
  },
  {
    question: 'Is there a trial?',
    answer:
      'Tiny Steps uses a free assessment-first approach instead of asking parents to commit without knowing the child’s starting level.',
  },
  {
    question: 'Why do parents shortlist Tiny Steps?',
    answer:
      'Founder-led curriculum direction, live 1:1 correction, structured phonics progression, parent-visible progress, and practical home reinforcement.',
  },
];

const comparisonFactors = [
  {
    factor: 'Class type',
    parentCheck: 'Is it 1:1, small group, or mostly self-practice?',
    tinySteps: 'Live 1:1 guidance is the main pathway, with personal correction in each class.',
  },
  {
    factor: 'Teacher attention',
    parentCheck: 'Will the child get direct correction, or mostly listen and follow?',
    tinySteps: 'The mentor corrects blending, sound confusion, and reading attempts live.',
  },
  {
    factor: 'Curriculum structure',
    parentCheck: 'Is the path random worksheets, or a clear sound-to-reading sequence?',
    tinySteps: 'Structured synthetic phonics: sounds to blending to reading and spelling transfer.',
  },
  {
    factor: 'Child placement',
    parentCheck: 'Does every child get the same material, or level-based placement?',
    tinySteps: 'Assessment-first placement based on current reading level and decoding gaps.',
  },
  {
    factor: 'Reading goal',
    parentCheck: 'Does the program stop at sounds, or move into real reading?',
    tinySteps: 'Sounds to blending to words to sentences to fluency, not isolated sound drills.',
  },
  {
    factor: 'Parent updates',
    parentCheck: 'Will you know what improved, what still needs work, and what comes next?',
    tinySteps: 'Parents get clear progress visibility and next-step guidance.',
  },
];

const proofCards = [
  {
    title: '5000+ students',
    detail: 'Tiny Steps already supports learners across India and 15+ countries through live online classes.',
  },
  {
    title: '10+ years founder experience',
    detail: 'Priya leads academic direction with long-form early childhood English teaching experience.',
  },
  {
    title: '35–40 minute live sessions',
    detail: 'Short, focused sessions match attention span, guided practice, and live correction better than long passive lessons.',
  },
  {
    title: 'Real trust assets',
    detail: 'Parents can review class samples, testimonials, pricing, and a free assessment path before deciding.',
  },
];

const whyTinyStepsPoints = [
  'Live 1:1 correction instead of only videos or worksheets',
  'Structured synthetic phonics progression',
  'Founder-led curriculum direction',
  'Zoom-based live classes for India and global families',
  'Progress updates and next-step guidance for parents',
  'Free assessment before package selection',
];

const fitCards = [
  'Child knows letters but cannot blend sounds into words',
  'Child guesses words instead of decoding them',
  'Child reads slowly and loses confidence quickly',
  'Child needs reading plus spelling support, not only flashcards',
  'Parent wants a clear starting level before paying for classes',
  'Family prefers mentor-led teaching over app-only practice',
];

const progressExamples = [
  {
    title: 'From letter names to blending',
    before: 'Child can say letters but freezes on c-a-t.',
    after: 'Child hears /c/ /a/ /t/, blends the sounds, and reads short CVC words with less guessing.',
  },
  {
    title: 'From guessing to decoding',
    before: 'Child looks at the picture and guesses the word.',
    after: 'Child starts decoding unfamiliar words through sound-by-sound reading before asking for help.',
  },
  {
    title: 'From word reading to sentence reading',
    before: 'Child can read some words alone but breaks down inside short sentences.',
    after: 'Child moves from isolated words to short sentence reading with smoother pacing and better confidence.',
  },
];

const learningCards = [
  'Letter sounds',
  'Blending',
  'CVC words',
  'Digraphs',
  'Magic-e',
  'Vowel teams',
  'Spelling patterns',
  'Sentence reading',
  'Reading fluency',
];

const learningCardStyles = [
  { icon: '🔤', bg: 'bg-[#FFEFF5]', border: 'border-[#F8CFE0]' },
  { icon: '🧩', bg: 'bg-[#EEF4FF]', border: 'border-[#D5E2FF]' },
  { icon: '📘', bg: 'bg-[#FFF4E7]', border: 'border-[#F9D8B3]' },
  { icon: '🔍', bg: 'bg-[#ECFAF4]', border: 'border-[#CBEEDA]' },
  { icon: '✨', bg: 'bg-[#F7EEFF]', border: 'border-[#E5D0FF]' },
  { icon: '🌈', bg: 'bg-[#FFF8DC]', border: 'border-[#F7E7AA]' },
  { icon: '📝', bg: 'bg-[#FFEFE6]', border: 'border-[#F9D1BF]' },
  { icon: '📖', bg: 'bg-[#EAF8FF]', border: 'border-[#C8E8F8]' },
  { icon: '🚀', bg: 'bg-[#EEF7FF]', border: 'border-[#CFE5F8]' },
];

const practiceFeatures = [
  { title: 'Fun phonics games', icon: '🎮' },
  { title: 'Digital worksheets', icon: '🗂️' },
  { title: 'Progress tracking', icon: '📈' },
  { title: 'Learn from anywhere', icon: '🌍' },
];

const supportLinks = [
  {
    title: 'See class samples',
    href: '/class-samples',
    description: 'Review how teacher pacing, correction, and child participation look in real Tiny Steps classes.',
    accent: 'border-[#F2D8B2] hover:bg-[#FFF8EC]',
  },
  {
    title: 'Read parent testimonials',
    href: '/testimonials',
    description: 'See what families say about reading confidence, blending, and mentor support.',
    accent: 'border-[#E2D5FB] hover:bg-[#FAF7FF]',
  },
  {
    title: 'Review pricing',
    href: '/pricing',
    description: 'Compare current packages after the free assessment confirms the right starting point.',
    accent: 'border-[#CFE6FA] hover:bg-[#F4FAFF]',
  },
  {
    title: 'Explore the full phonics program',
    href: '/phonics',
    description: 'Go deeper into the complete phonics roadmap, learning levels, and placement guidance.',
    accent: 'border-[#D6F0DE] hover:bg-[#F4FDF7]',
  },
];

const clusterLinks = [
  {
    title: 'Online phonics classes for kids',
    href: '/phonics',
    description: 'Main program page with levels, placement logic, and learning path details.',
  },
  {
    title: 'Reading classes for kids',
    href: '/reading-classes-for-kids',
    description: 'Useful when decoding is only one part of the reading problem and fluency support is also needed.',
  },
  {
    title: 'Phonics apps for preschoolers in India',
    href: '/phonics-apps-for-preschoolers-india',
    description: 'Good for parents comparing live classes with app-only reinforcement.',
  },
  {
    title: 'Parent comparison blog guide',
    href: '/blog/best-online-phonics-classes-for-kids',
    description: 'A non-sales checklist page for parents who want a wider comparison before choosing a provider.',
  },
];

const faqItems = [
  {
    question: 'What is the best age to start phonics?',
    answer:
      'Many children begin phonics around ages 3 to 7, but older children can also benefit when decoding gaps still affect reading confidence.',
  },
  {
    question: 'Are online phonics classes effective for kids?',
    answer:
      'Yes, when classes include live correction, structured blending routines, real reading practice, and consistent home reinforcement instead of passive watching alone.',
  },
  {
    question: 'Is Tiny Steps 1:1 or group?',
    answer:
      'The main Tiny Steps phonics path is live 1:1. Some families may also explore small-group options depending on fit, schedule, and program availability.',
  },
  {
    question: 'How long does it take for a child to start reading?',
    answer:
      'Some children show early blending progress within weeks, while stronger sentence reading and fluency usually need consistent guided practice over a longer period.',
  },
  {
    question: 'What is included in the Tiny Steps phonics course?',
    answer:
      'The phonics pathway covers sound recognition, blending, CVC words, digraphs, vowel teams, spelling patterns, sentence reading, and fluency support with live mentor guidance.',
  },
  {
    question: 'Is this suitable for Indian kids living abroad?',
    answer:
      'Yes. Classes are online, so Indian families abroad can join based on available schedule slots and Zoom access.',
  },
  {
    question: 'How much do online phonics classes cost?',
    answer:
      'Current standard reference pricing is ₹400 per class, with a 12-class starter plan at ₹4,800. Families should confirm the right package after the free assessment.',
  },
  {
    question: 'Do parents get progress updates?',
    answer:
      'Yes. Parents receive clear updates on what the child is learning, what improved, and what the next practice goal should be.',
  },
  {
    question: 'What platform do you use for online classes?',
    answer: 'Tiny Steps uses Zoom for live sessions so families can join from India or abroad with a simple browser link.',
  },
];

export default function BestOnlinePhonicsClassesIndiaPage() {
  const routeConfig = getRouteConfig('/best-online-phonics-classes-for-kids-in-india');
  const canonicalPath = routeConfig?.canonicalPath ?? '/best-online-phonics-classes-for-kids-in-india';
  const canonicalUrl = `${PUBLIC_FACTS.primaryWebsite}${canonicalPath}`;
  const seoTitle =
    routeConfig?.title ?? 'Best Online Phonics Classes for Kids in India | Tiny Steps Learning';
  const seoDescription =
    routeConfig?.description ??
    'Compare the best online phonics classes for kids in India. Review 1:1 vs group format, curriculum, pricing, progress updates, and why parents choose Tiny Steps Learning.';

  const starterPlan = ONE_TO_ONE_MONTHLY_PACKAGES.find((pkg) => pkg.id === 'starter');

  useEffect(() => {
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
        { '@type': 'ListItem', position: 2, name: 'Phonics', item: 'https://tinystepslearning.com/phonics' },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Best Online Phonics Classes for Kids in India',
          item: canonicalUrl,
        },
      ],
    };

    const comparisonSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      '@id': `${canonicalUrl}#comparison-factors`,
      name: 'How parents compare online phonics classes for kids in India',
      itemListElement: comparisonFactors.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.factor,
      })),
    };

    const faqSchema = {
      ...createFAQPageSchema(faqItems),
      '@id': `${canonicalUrl}#faq`,
    };

    const webpageSchema = createWebPageSchema({
      name: 'Best Online Phonics Classes for Kids in India',
      description: seoDescription,
      url: canonicalUrl,
    });

    applySeo({
      title: seoTitle,
      description: seoDescription,
      canonicalPath,
      ogType: routeConfig?.ogType ?? 'website',
      keywords: [
        'best online phonics classes for kids in India',
        'online phonics classes for kids in India',
        '1:1 phonics classes for kids',
        'best phonics classes for kids',
        'live online phonics classes',
      ],
      jsonLd: [breadcrumbSchema, comparisonSchema, faqSchema, webpageSchema],
    });
  }, [canonicalPath, canonicalUrl, routeConfig?.ogType, seoDescription, seoTitle]);

  return (
    <div className="bg-gradient-to-b from-[#FFF7FA] via-[#FDFEFF] to-[#EDF6FF] pb-16">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#FFF7FA] via-[#FFFDF8] to-[#EEF7FF] px-4 py-8 sm:px-5 md:py-12 lg:px-8 lg:py-14">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(255,192,142,0.22),transparent_30%),radial-gradient(circle_at_88%_10%,rgba(167,210,251,0.24),transparent_34%),radial-gradient(circle_at_70%_78%,rgba(208,191,250,0.14),transparent_24%)]" />
        <div className="pointer-events-none absolute -left-16 top-8 h-44 w-44 rounded-full bg-[#FFD8B3]/45 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 rounded-full bg-[#CFE5FF]/45 blur-3xl" />
        <div className="pointer-events-none absolute bottom-2 right-1/3 h-36 w-36 rounded-full bg-[#E9D8FF]/30 blur-3xl" />
        <div className="mx-auto max-w-7xl">
          <div className="relative grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="relative">
              <p className="inline-flex items-center rounded-full border border-orange-200/80 bg-white/88 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-700 shadow-sm backdrop-blur">
                Parent Comparison Guide 2026
              </p>
              <h1 className="mt-4 max-w-full text-[34px] font-bold leading-[1.05] tracking-[-0.035em] text-slate-900 sm:text-[38px] md:max-w-[760px] md:text-[46px] lg:text-[52px]">
                Best Online Phonics Classes for Kids in India
              </h1>
              <p className="mt-4 max-w-full text-base leading-7 text-slate-700 md:mt-5 md:max-w-[700px] md:text-lg md:leading-8">
                Compare class format, teacher attention, phonics curriculum, parent progress visibility, and pricing before choosing the right reading foundation for your child.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to="/book-demo"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-gradient-to-r from-[#FF7B66] to-[#FF9E7A] px-6 py-3.5 text-base font-bold text-white shadow-[0_12px_26px_rgba(255,126,99,0.35)] transition hover:from-[#FF715B] hover:to-[#FF9570]"
                >
                  Book Free Assessment
                </Link>
                <Link
                  to="/phonics"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-[#E9DDF9] bg-white/92 px-6 py-3.5 text-base font-semibold text-slate-900 shadow-[0_10px_24px_rgba(148,163,184,0.12)] transition hover:bg-white"
                >
                  Explore Phonics Program
                </Link>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {heroChips.map((chip) => (
                  <span
                    key={chip.label}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm backdrop-blur sm:px-3.5 sm:text-sm ${chip.className}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${chip.dotClassName}`} aria-hidden="true" />
                    {chip.label}
                  </span>
                ))}
              </div>
            </div>

            <aside className="relative w-full overflow-hidden rounded-[30px] border border-[#E7DCF8] bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(251,248,255,0.94))] p-5 shadow-[0_18px_45px_rgba(62,38,92,0.12)] md:p-6 lg:ml-auto lg:max-w-[560px]">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#FFB878] via-[#A9CFFF] to-[#D4B9FF]" />
              <div className="pointer-events-none absolute -right-10 top-8 h-28 w-28 rounded-full bg-[#E8DCFF]/50 blur-3xl" />
              <h2 className="text-xl font-bold text-slate-900">Quick snapshot</h2>
              <p className="mt-3 max-w-[34rem] text-slate-700">
                Tiny Steps offers live 1:1 online phonics classes for children who need structured reading support, live correction, and a clear sound-to-reading path.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[22px] border border-[#E3DCF8] bg-[linear-gradient(145deg,rgba(251,248,255,0.96),rgba(255,255,255,0.98))] p-4 text-sm text-slate-700 shadow-[0_10px_24px_rgba(125,96,181,0.08)] sm:col-span-2">
                  <span className="inline-flex rounded-full border border-[#E3DCF8] bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#5E4E8C]">
                    Best for
                  </span>
                  <p className="mt-1">Children who need blending help, decoding support, and a structured reading foundation.</p>
                </div>
                <div className="rounded-[22px] border border-[#F6D6AF] bg-[linear-gradient(145deg,rgba(255,247,232,0.96),rgba(255,252,246,0.98))] p-4 text-sm text-slate-700 shadow-[0_10px_24px_rgba(176,118,41,0.08)]">
                  <span className="inline-flex rounded-full border border-[#F6D6AF] bg-white/75 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8C5316]">
                    Current reference pricing
                  </span>
                  <p className="mt-2 text-lg font-bold text-slate-900">{formatINR(PER_CLASS_PRICE)} per class</p>
                  {starterPlan ? <p className="mt-1 font-semibold text-slate-800">{formatINR(starterPlan.monthlyFee)} for {starterPlan.classes} classes</p> : null}
                </div>
                <div className="rounded-[22px] border border-[#DDE6F4] bg-[linear-gradient(145deg,rgba(247,251,255,0.96),rgba(255,255,255,0.98))] p-4 text-sm text-slate-700 shadow-[0_10px_24px_rgba(91,131,178,0.08)]">
                  <span className="inline-flex rounded-full border border-[#DDE6F4] bg-white/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#345B84]">
                    Best first step
                  </span>
                  <p className="mt-1">Book the free assessment to confirm the child&apos;s current level, fit, and recommended starting plan.</p>
                </div>
              </div>
              <p className="mt-3 text-xs leading-6 text-slate-500 sm:text-sm">
                If your child is still stuck despite practice, also review{' '}
                <Link to="/child-not-reading-properly" className="font-semibold underline underline-offset-2">
                  why a child is not reading properly
                </Link>
                .
              </p>
            </aside>
          </div>
        </div>
      </section>

      <section className="bg-[#fffaf3] px-4 py-8 sm:px-5 md:py-12 lg:px-6 lg:py-14">
        <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-3">
          {quickAnswerBlocks.map((item, index) => (
            <article
              key={item.title}
              className={`rounded-3xl border p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)] md:p-6 ${
                index === 0
                  ? 'border-[#F1D8A8] bg-white'
                  : index === 1
                    ? 'border-[#D7ECFA] bg-[#F5FBFF]'
                    : 'border-[#E6D8FA] bg-[#FCF9FF]'
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Answer block</p>
              <h2 className="mt-2 text-xl font-bold text-slate-900">{item.title}</h2>
              <p className="mt-3 text-[15px] leading-7 text-slate-700">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-4 py-8 sm:px-5 md:py-12 lg:px-6 lg:py-14">
        <div className="mx-auto max-w-6xl rounded-3xl border border-[#DDE8F8] bg-white/95 p-5 shadow-[0_12px_30px_rgba(55,97,143,0.12)] md:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Parent Questions</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Tiny Steps at a glance</h2>
            </div>
            <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
              This section answers the practical questions parents ask when searching for the best online phonics classes for kids in India.
            </p>
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-[#DFE5F0] shadow-sm">
            <table className="min-w-[760px] w-full border-collapse text-left text-sm md:text-base">
              <thead>
                <tr>
                  <th className="border border-slate-200 bg-slate-900 px-4 py-3 font-semibold text-white">Parent question</th>
                  <th className="border border-slate-200 bg-slate-900 px-4 py-3 font-semibold text-white">Tiny Steps answer</th>
                </tr>
              </thead>
              <tbody>
                {parentQuestionRows.map((row, index) => (
                  <tr key={row.question} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                    <td className="border border-slate-200 px-4 py-3.5 font-semibold text-slate-900">{row.question}</td>
                    <td className="border border-slate-200 px-4 py-3.5 text-slate-700">{row.answer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="bg-[#eef7ff] px-4 py-8 sm:px-5 md:py-12 lg:px-6 lg:py-14">
        <div className="mx-auto max-w-6xl rounded-3xl border border-[#DCE9F8] bg-gradient-to-br from-[#F5FBFF] via-white to-[#FFF8EF] p-5 shadow-[0_14px_34px_rgba(69,90,123,0.12)] md:p-8">
          <h2 className="mb-4 text-2xl font-bold text-slate-900 sm:text-3xl">
            How to choose the best online phonics class for your child
          </h2>
          <p className="max-w-4xl text-slate-700">
            Parents searching for "best" usually want more than marketing claims. The shortlist should help you compare class format, teacher attention, curriculum structure, reading outcomes, and visibility into progress.
          </p>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-[#DFE5F0] shadow-sm">
            <table className="min-w-[760px] w-full border-collapse text-left text-sm md:text-base">
              <thead>
                <tr>
                  <th className="border border-slate-200 bg-slate-900 px-4 py-3 font-semibold text-white">Factor</th>
                  <th className="border border-slate-200 bg-slate-900 px-4 py-3 font-semibold text-white">What parents should check</th>
                  <th className="border border-slate-200 bg-slate-900 px-4 py-3 font-semibold text-white">Tiny Steps approach</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFactors.map((row, index) => (
                  <tr key={row.factor} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                    <td className="border border-slate-200 px-4 py-3.5 font-semibold text-slate-900">{row.factor}</td>
                    <td className="border border-slate-200 px-4 py-3.5 text-slate-700">{row.parentCheck}</td>
                    <td className="border border-slate-200 px-4 py-3.5 text-slate-700">{row.tinySteps}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-5 md:py-12 lg:px-6 lg:py-14">
        <div className="mx-auto max-w-6xl rounded-3xl border border-[#E6D8FA] bg-white/95 p-5 shadow-[0_16px_36px_rgba(86,58,121,0.1)] md:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Program Fit</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Who this phonics program fits best</h2>
            </div>
            <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
              This page is most useful for parents comparing 1:1 online phonics classes for children who need structured, live reading support.
            </p>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {fitCards.map((item) => (
              <article
                key={item}
                className="rounded-2xl border border-[#E6DFF7] bg-gradient-to-br from-white to-[#FBF8FF] px-4 py-4 text-slate-700 shadow-sm"
              >
                <h3 className="font-semibold text-slate-900">{item}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#fff6ec] px-4 py-8 sm:px-5 md:py-12 lg:px-6 lg:py-14">
        <div className="mx-auto max-w-6xl rounded-3xl border border-[#F3D8B6] bg-white/95 p-5 shadow-[0_14px_34px_rgba(143,95,35,0.1)] md:p-8">
          <h2 className="mb-5 text-2xl font-bold text-slate-900 sm:text-3xl">Why parents shortlist Tiny Steps for phonics</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {whyTinyStepsPoints.map((item) => (
              <article
                key={item}
                className="rounded-2xl border border-[#E6DFF7] bg-gradient-to-br from-white to-[#FBF8FF] px-4 py-4 text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <h3 className="font-semibold text-slate-900">{item}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-5 md:py-12 lg:px-6 lg:py-14">
        <div className="mx-auto max-w-6xl rounded-3xl border border-[#DDE8F8] bg-white/95 p-5 shadow-[0_12px_30px_rgba(55,97,143,0.12)] md:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Trust Signals</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Proof before promises</h2>
            </div>
            <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
              This page is built to help parents compare clearly, not just hear "we are the best."
            </p>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {proofCards.map((item, index) => (
              <article
                key={item.title}
                className={`rounded-2xl border p-5 shadow-sm ${
                  index === 0
                    ? 'border-[#F6D6AF] bg-[#FFF7E8]'
                    : index === 1
                      ? 'border-[#DDE6F4] bg-[#F7FBFF]'
                      : index === 2
                        ? 'border-[#E6D8FA] bg-[#FCF9FF]'
                        : 'border-[#D8EEDC] bg-[#F6FFF7]'
                }`}
              >
                <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">{item.detail}</p>
              </article>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/class-samples"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              See Class Samples
            </Link>
            <Link
              to="/testimonials"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              Read Parent Testimonials
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-[#F4EEFF] via-[#FFF7F1] to-[#EEF7FF] px-4 py-8 sm:px-5 md:py-12 lg:px-6 lg:py-14">
        <div className="mx-auto max-w-6xl rounded-3xl border border-[#E6D8FA] bg-gradient-to-br from-[#FFFDFE] via-[#FFF7FB] to-[#F4F8FF] p-5 shadow-[0_16px_36px_rgba(86,58,121,0.12)] md:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">What progress can look like</h2>
              <p className="mt-2 max-w-3xl text-slate-700">
                These are example reading shifts parents want to see. They are not guaranteed timelines, but they show the kind of movement a structured phonics path aims for.
              </p>
            </div>
            <Link to="/reading-classes-for-kids" className="text-sm font-semibold text-slate-900 underline underline-offset-4">
              Need fluency support too?
            </Link>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {progressExamples.map((item, index) => (
              <article
                key={item.title}
                className={`rounded-3xl border p-5 shadow-sm ${
                  index === 0
                    ? 'border-[#F5D2E1] bg-[#FFF3F8]'
                    : index === 1
                      ? 'border-[#D4E8FA] bg-[#F1F9FF]'
                      : 'border-[#F3D8B6] bg-[#FFF8EC]'
                }`}
              >
                <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                <div className="mt-4 rounded-2xl border border-white/80 bg-white/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Before</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{item.before}</p>
                </div>
                <div className="mt-3 rounded-2xl border border-white/80 bg-white/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">After</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{item.after}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-5 md:py-12 lg:px-6 lg:py-14">
        <div className="mx-auto max-w-6xl rounded-3xl border border-[#DDE8F8] bg-white/95 p-5 shadow-[0_12px_30px_rgba(55,97,143,0.12)] md:p-8">
          <h2 className="mb-3 text-2xl font-bold text-slate-900 sm:text-3xl">What your child learns in the phonics path</h2>
          <p className="max-w-3xl text-slate-700">
            The goal is not only knowing sounds. The goal is moving from sound recognition into real reading, spelling patterns, and more confident decoding.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {learningCards.map((item, index) => {
              const style = learningCardStyles[index % learningCardStyles.length];
              return (
                <article
                  key={item}
                  className={`rounded-2xl border px-4 py-4 text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${style.bg} ${style.border}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-sm shadow-sm">
                      {style.icon}
                    </span>
                    <h3 className="font-semibold text-slate-900">{item}</h3>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-5 md:py-12 lg:px-6 lg:py-14">
        <div className="mx-auto max-w-6xl rounded-3xl border border-[#E9D8FB] bg-gradient-to-br from-white via-[#FFF9FD] to-[#F2F8FF] p-5 shadow-[0_16px_38px_rgba(90,58,130,0.11)] md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div>
              <h2 className="mb-4 text-2xl font-bold text-slate-900 sm:text-3xl">Practice support beyond the live class</h2>
              <p className="max-w-[980px] text-slate-700">
                Children learn better when live teaching is supported by playful practice. Tiny Steps gives children reinforcement through games, digital worksheets, and progress visibility so home review stays realistic.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {practiceFeatures.map((feature, index) => (
                  <article
                    key={feature.title}
                    className={`rounded-2xl border px-4 py-4 text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                      index % 2 === 0 ? 'border-[#F5D2E1] bg-[#FFF3F8]' : 'border-[#D4E8FA] bg-[#F1F9FF]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm shadow-sm">{feature.icon}</span>
                      <h3 className="font-semibold text-slate-900">{feature.title}</h3>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[#F2D8B2] bg-gradient-to-br from-[#FFF8EC] via-[#FFFDF8] to-[#F3F8FF] p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8A5A1F]">Parent proof pack</p>
              <p className="mt-2 text-slate-700">Use these pages to validate fit before you enroll.</p>
              <div className="mt-4 grid gap-3">
                {supportLinks.map((item) => (
                  <Link
                    key={item.title}
                    to={item.href}
                    className={`rounded-xl border bg-white px-4 py-3 transition ${item.accent}`}
                  >
                    <p className="font-medium text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#fffaf3] px-4 py-8 sm:px-5 md:py-12 lg:px-6 lg:py-14">
        <div className="mx-auto max-w-6xl rounded-3xl border border-[#F1D8A8] bg-white p-5 shadow-[0_12px_30px_rgba(122,74,16,0.08)] md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Related guides in the phonics topic cluster</h2>
          <p className="mt-3 max-w-[940px] text-slate-700">
            Parents often compare this page with the broader phonics program, reading support, app-based reinforcement, and a non-commercial comparison guide.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {clusterLinks.map((item) => (
              <Link
                key={item.title}
                to={item.href}
                className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
              >
                <h3 className="font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-5 md:py-12 lg:px-6 lg:py-14">
        <div className="mx-auto max-w-6xl rounded-3xl border border-[#DDE8F8] bg-white/95 p-5 shadow-[0_12px_30px_rgba(55,97,143,0.12)] md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Pricing and next step</h2>
          <p className="mt-3 max-w-[940px] text-slate-700">
            Start with the free assessment first. After the assessment, Tiny Steps recommends the right class frequency and package based on the child&apos;s current reading level.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Current reference</p>
              <p className="mt-2 text-lg font-bold text-slate-900">
                {formatINR(PER_CLASS_PRICE)} per class
                {starterPlan ? ` • ${formatINR(starterPlan.monthlyFee)} for ${starterPlan.classes} classes` : ''}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Final recommendation depends on the child’s stage, pace, and schedule after assessment.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Assessment outcome</p>
              <p className="mt-2 text-lg font-bold text-slate-900">You receive a clearer starting point</p>
              <p className="mt-2 text-sm text-slate-600">
                Families leave the assessment with level clarity, recommended next steps, and package options that fit the child.
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/pricing"
              className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-[#E4D8F7] bg-white px-6 py-3 font-semibold text-slate-900 hover:bg-[#FAF7FF]"
            >
              View Pricing
            </Link>
            <Link
              to="/book-demo"
              className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-gradient-to-r from-[#FF7B66] to-[#FF9E7A] px-6 py-3 font-semibold text-white shadow-[0_12px_26px_rgba(255,126,99,0.35)] hover:from-[#FF715B] hover:to-[#FF9570]"
            >
              Book Free Assessment
            </Link>
          </div>
        </div>
      </section>

      <ContentTrustNote
        text="This page is created by the Tiny Steps academic team and reviewed by the founder to help parents compare phonics options with clearer criteria, realistic expectations, and practical next steps."
      />

      <AboutAuthor
        title="About the Founder Review"
        intro="This landing page is written to help parents compare online phonics classes using practical factors such as teacher attention, curriculum structure, live correction, and parent visibility."
        note="The goal is to reduce guesswork for families searching for the best online phonics classes for kids in India and to explain where Tiny Steps fits clearly."
        highlights={[
          { label: 'Experience', value: '10+ years in early childhood English education' },
          { label: 'Focus', value: 'Phonics, reading confidence, grammar, and communication growth' },
          { label: 'Why parents use this page', value: 'To compare fit before booking a free assessment' },
        ]}
        badges={['Founder reviewed', 'Parent comparison page']}
        ctas={[
          { label: 'Book a free assessment', to: '/book-demo', variant: 'primary' },
          { label: 'Explore class samples', to: '/class-samples', variant: 'secondary' },
        ]}
      />

      <TestimonialsSection
        title="What parents say after starting phonics support"
        subtitle="Selected parent feedback from phonics pathways. Use these reviews together with class samples and pricing to judge fit more clearly."
        courseTag="phonics"
        limit={6}
        compact
        viewAllHref="/testimonials"
        viewAllLabel="View all parent reviews"
      />

      <section id="faq" className="px-4 py-8 sm:px-5 md:py-12 lg:px-6 lg:py-14">
        <div className="mx-auto max-w-6xl rounded-3xl border border-[#E2D9F7] bg-white/95 p-5 shadow-[0_12px_30px_rgba(79,61,122,0.1)] md:p-8">
          <h2 className="mb-5 text-2xl font-bold text-slate-900 sm:text-3xl">Frequently asked questions</h2>
          <div className="space-y-3 md:space-y-4">
            {faqItems.map((item) => (
              <article
                key={item.question}
                className="rounded-2xl border border-[#DDE6F4] bg-gradient-to-r from-white to-[#FAFCFF] p-5 shadow-sm"
              >
                <h3 className="text-[17px] font-semibold text-slate-900 md:text-lg">{item.question}</h3>
                <p className="mt-2 text-[15px] leading-6 text-slate-700 md:text-base">{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-10 pt-6 sm:px-5 md:pb-12 lg:px-6">
        <div className="mx-auto max-w-6xl rounded-3xl bg-gradient-to-r from-slate-900 via-[#1f2a44] to-slate-900 p-6 text-center text-white shadow-[0_20px_50px_rgba(15,23,42,0.18)] sm:p-8 md:p-10">
          <h2 className="text-2xl font-bold md:text-3xl">Ready to choose the right phonics path for your child?</h2>
          <p className="mx-auto mt-3 max-w-3xl text-base leading-7 text-slate-200">
            Book a free assessment and get a clear starting level, recommended path, current package guidance, and a practical next step for reading growth.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/book-demo"
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-gradient-to-r from-[#FFB89E] to-white px-8 py-3 font-semibold text-slate-900 transition hover:from-[#FFAD90] hover:to-[#FFF7F2] sm:w-auto"
            >
              Book Free Assessment
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-300">
            <Link to="/phonics" className="underline underline-offset-2 hover:text-white">
              Explore the full phonics program
            </Link>
          </p>
        </div>
      </section>

      <ClusterSeoNav cluster="phonics" />
    </div>
  );
}
