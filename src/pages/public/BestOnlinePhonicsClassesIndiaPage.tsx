import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import ClusterSeoNav from '../../components/programs/ClusterSeoNav';
import { applySeo, getRouteConfig } from '../../lib/seo';
import { createFAQPageSchema, PUBLIC_FACTS } from '../../lib/schemas';
import { formatINR, ONE_TO_ONE_MONTHLY_PACKAGES } from '../../config/pricing';

const parentProblems = [
  {
    title: 'My child knows letters but cannot read words',
    solution: 'Look for: step-by-step blending routines with live teacher correction.',
  },
  {
    title: 'My child guesses words while reading',
    solution: 'Look for: structured decoding practice using sounds, not memorisation or guessing.',
  },
  {
    title: 'My child reads slowly',
    solution: 'Look for: guided CVC and sentence reading with repeated fluency practice.',
  },
  {
    title: 'My child struggles with spelling',
    solution: 'Look for: explicit spelling patterns, digraphs, and vowel team reinforcement.',
  },
  {
    title: 'My child loses confidence while reading',
    solution: 'Look for: level-based goals, quick wins, and parent-visible progress milestones.',
  },
];

const checklistPoints = [
  'Current level assessment before enrollment',
  'Live teacher correction',
  'Structured synthetic phonics pathway',
  'Blending and CVC word practice',
  'Digraphs, vowel teams, magic-e, and spelling patterns',
  'Reading fluency practice',
  'Parent progress updates',
  'Practice games or home reinforcement',
  'Flexible scheduling',
  'Lesson quality review or recordings',
];

const comparisonRows = [
  {
    option: '1:1 online phonics class',
    bestFor: 'Children who need personalised correction and faster reading catch-up',
    limitation: 'Higher fee than group or app-only options',
    check: 'Mentor quality, structured roadmap, and regular parent progress updates',
  },
  {
    option: 'Small group phonics class',
    bestFor: 'Children comfortable learning with peers at shared pace',
    limitation: 'Limited individual speaking and correction time',
    check: 'Batch size, teacher feedback frequency, and makeup class policy',
  },
  {
    option: 'App-only phonics practice',
    bestFor: 'Daily reinforcement after guided teaching',
    limitation: 'No live correction for blending or pronunciation mistakes',
    check: 'Clear progression, age-fit content, and parent dashboard visibility',
  },
  {
    option: 'School reading practice',
    bestFor: 'General classroom exposure and routine reading',
    limitation: 'Not always personalised for specific phonics gaps',
    check: 'Whether school practice includes explicit sound-to-word routines',
  },
  {
    option: 'Local worksheet/coaching center',
    bestFor: 'Families preferring in-person local support',
    limitation: 'Quality and phonics structure can vary significantly',
    check: 'Teacher phonics training, structured pathway, and outcome tracking',
  },
];

const whyTinyStepsPoints = [
  'Live 1:1 correction',
  'Structured synthetic phonics path',
  'Reading + spelling support',
  'Parent-visible progress',
  'Interactive worksheets and games',
  'Free assessment before enrollment',
];

const methodSteps = [
  'Free assessment',
  'Sound recognition',
  'Blending routine',
  'CVC word reading',
  'Digraphs and vowel teams',
  'Spelling patterns',
  'Reading fluency',
  'Parent progress update',
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
  { title: 'Learn anytime, anywhere', icon: '🌍' },
];

const faqItems = [
  {
    question: 'What age is best for online phonics classes?',
    answer:
      'Most children begin phonics between ages 3 and 8, but older children can also benefit when decoding gaps affect reading confidence.',
  },
  {
    question: 'Are 1:1 phonics classes better than group classes?',
    answer:
      '1:1 classes usually provide faster correction and personalised pacing, while group classes can be useful for children who learn well with peers.',
  },
  {
    question: 'How do I know if my child needs phonics support?',
    answer:
      'If your child knows letters but struggles with blending, guesses words, reads slowly, or avoids reading aloud, a phonics assessment is helpful.',
  },
  {
    question: 'How long does it take to see improvement?',
    answer:
      'Many children show early blending and decoding improvement within a few weeks, while fluency gains usually need consistent guided practice over a longer period.',
  },
  {
    question: 'Do phonics classes help with spelling?',
    answer:
      'Yes. Structured phonics classes improve spelling by teaching sound patterns, digraphs, vowel teams, and rule-based word building.',
  },
  {
    question: 'Are phonics apps enough?',
    answer:
      'Apps can reinforce practice, but most children still need live correction and guided feedback to fix blending and reading mistakes.',
  },
  {
    question: 'What does Tiny Steps check in the free assessment?',
    answer:
      'Tiny Steps checks current sound recognition, blending ability, word reading, early fluency, and confidence to recommend the right starting point.',
  },
  {
    question: 'Can children outside India join Tiny Steps?',
    answer:
      'Yes. Classes are online, and families outside India can join based on available schedule slots.',
  },
  {
    question: 'What materials are needed for online phonics classes?',
    answer:
      'A stable internet connection, laptop or tablet, and a quiet learning space are usually enough. Digital worksheets and guided practice resources are provided.',
  },
];

export default function BestOnlinePhonicsClassesIndiaPage() {
  const routeConfig = getRouteConfig('/best-online-phonics-classes-india');
  const canonicalPath = routeConfig?.canonicalPath ?? '/best-online-phonics-classes-india';
  const canonicalUrl = `${PUBLIC_FACTS.primaryWebsite}${canonicalPath}`;
  const seoTitle = routeConfig?.title ?? 'Best Online Phonics Classes in India | Parent Guide | Tiny Steps';
  const seoDescription =
    routeConfig?.description ??
    'Compare online phonics classes in India, 1:1 vs group vs app practice, reading outcomes, parent progress updates, and free assessment.';

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
          name: 'Best Online Phonics Classes in India',
          item: canonicalUrl,
        },
      ],
    };

    const checklistItemListSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      '@id': `${canonicalUrl}#parent-checklist`,
      name: 'How to choose the best online phonics class',
      itemListElement: checklistPoints.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item,
      })),
    };

    const faqSchema = {
      ...createFAQPageSchema(faqItems),
      '@id': `${canonicalUrl}#faq`,
    };

    applySeo({
      title: seoTitle,
      description: seoDescription,
      canonicalPath,
      ogType: routeConfig?.ogType ?? 'website',
      jsonLd: [breadcrumbSchema, checklistItemListSchema, faqSchema],
    });
  }, [canonicalPath, canonicalUrl, routeConfig?.ogType, seoDescription, seoTitle]);

  return (
    <div className="bg-gradient-to-b from-[#FFF7FA] via-[#FDFEFF] to-[#EDF6FF] pb-16">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#FFF7FA] via-[#FFFDF8] to-[#EEF7FF] px-4 py-8 sm:px-5 md:py-12 lg:px-8 lg:py-14">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="inline-flex items-center rounded-full border border-orange-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-700">
                Parent Decision Guide 2026
              </p>
              <h1 className="mt-4 max-w-full text-[34px] font-bold leading-[1.05] tracking-[-0.035em] text-slate-900 sm:text-[38px] md:max-w-[680px] md:text-[46px] lg:text-[52px]">
                Best Online Phonics Classes in India
              </h1>
              <p className="mt-4 max-w-full text-base leading-7 text-slate-700 md:mt-5 md:max-w-[660px] md:text-lg md:leading-8">
                Compare teaching quality, class format, reading outcomes, parent progress visibility, and practice support before choosing the right phonics class for your child.
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
                  className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-[#E9DDF9] bg-white px-6 py-3.5 text-base font-semibold text-slate-900 transition hover:bg-[#FBF8FF]"
                >
                  Explore Phonics Program
                </Link>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {['Ages 3–12', 'Live 1:1 guidance', 'Structured phonics path', 'Parent progress updates'].map((chip) => (
                  <span key={chip} className="rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm sm:text-sm sm:px-3.5">
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            <aside className="w-full rounded-3xl border border-[#E7DCF8] bg-white/95 p-5 shadow-[0_18px_45px_rgba(62,38,92,0.12)] md:p-6 lg:ml-auto lg:max-w-[560px]">
              <h2 className="text-xl font-bold text-slate-900">Parent comparison snapshot</h2>
              <p className="mt-3 text-slate-700">
                Use this page to compare 1:1, group, app-only, school, and local options before you enroll. If your child is still stuck despite regular practice, review{' '}
                <Link to="/child-not-reading-properly" className="font-semibold underline underline-offset-2">why a child is not reading properly</Link>{' '}
                and then choose a level-based plan.
              </p>
              <div className="mt-5 rounded-2xl border border-[#F6D6AF] bg-[#FFF7E8] p-4 text-sm text-slate-700">
                Strong decision order: assessment first, then pathway fit, then schedule and pricing.
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="bg-[#fffaf3] px-4 py-8 sm:px-5 md:py-12 lg:px-6 lg:py-14">
        <div className="mx-auto max-w-6xl rounded-3xl border border-[#F1D8A8] bg-white/95 p-5 shadow-[0_12px_30px_rgba(122,74,16,0.08)] md:p-7">
          <h2 className="text-2xl font-bold text-slate-900 md:text-[30px]">Which online phonics class is best for my child?</h2>
          <p className="mt-3 max-w-[980px] text-base leading-7 text-slate-700 md:text-[17px]">
            The best online phonics class is one that checks your child&apos;s current reading level first, teaches letter sounds and blending step by step, corrects mistakes live, includes reading and spelling practice, and keeps parents updated with clear progress milestones. Tiny Steps uses live 1:1 phonics guidance, structured synthetic phonics, interactive practice, and parent-visible progress updates.
          </p>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-5 md:py-12 lg:px-6 lg:py-14">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-6 text-2xl font-bold text-slate-900 sm:text-3xl">Parent reading problems to solve first</h2>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {parentProblems.map((item, index) => (
              <article
                key={item.title}
                className={`rounded-2xl border p-5 shadow-[0_10px_28px_rgba(15,23,42,0.05)] transition hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)] md:min-h-[200px] md:rounded-3xl md:p-6 ${
                  index === 0
                    ? 'bg-[#F3FAFF] border-[#D7ECFA]'
                    : index === 1
                      ? 'bg-[#FFF8F0] border-[#F6D9B9]'
                      : index === 2
                        ? 'bg-[#F3FFF6] border-[#CFEFD7]'
                        : index === 3
                          ? 'bg-[#F7F5FF] border-[#E2DBFF]'
                          : 'bg-[#FFFBEA] border-[#F4E2A0]'
                }`}
              >
                <h3 className="text-lg font-bold leading-snug text-slate-950 md:text-xl">{item.title}</h3>
                <p className="mt-3 text-[15px] leading-6 text-slate-700 md:text-base">
                  <span className="font-semibold text-slate-900">Look for:</span> {item.solution.replace('Look for: ', '')}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#eef7ff] px-4 py-8 sm:px-5 md:py-12 lg:px-6 lg:py-14">
        <div className="mx-auto max-w-6xl rounded-3xl border border-[#DCE9F8] bg-gradient-to-br from-[#F5FBFF] via-white to-[#FFF8EF] p-5 shadow-[0_14px_34px_rgba(69,90,123,0.12)] md:p-8">
          <h2 className="mb-5 text-2xl font-bold text-slate-900 sm:text-3xl">How to choose the best online phonics class</h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {checklistPoints.map((point) => (
              <li key={point} className="flex items-start gap-3 rounded-2xl border border-[#DDE6F4] bg-white/95 px-4 py-3 text-[15px] text-slate-700 shadow-sm md:text-base">
                <span className="mt-0.5 font-semibold text-emerald-600">✓</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-5 md:py-12 lg:px-6 lg:py-14">
        <div className="mx-auto max-w-6xl rounded-3xl border border-[#E4DDF7] bg-white/95 p-5 shadow-[0_14px_34px_rgba(76,63,127,0.1)] md:p-8">
          <h2 className="mb-4 text-2xl font-bold text-slate-900 sm:text-3xl">1:1 online phonics vs group class vs app-only practice</h2>
          <div className="overflow-x-auto rounded-2xl border border-[#DFE5F0] shadow-sm">
            <table className="min-w-[760px] border-collapse text-left text-sm md:min-w-full md:text-base">
              <thead>
                <tr>
                  <th className="border border-slate-200 bg-slate-900 px-4 py-3 font-semibold text-white">Option</th>
                  <th className="border border-slate-200 bg-slate-900 px-4 py-3 font-semibold text-white">Best for</th>
                  <th className="border border-slate-200 bg-slate-900 px-4 py-3 font-semibold text-white">Limitation</th>
                  <th className="border border-slate-200 bg-slate-900 px-4 py-3 font-semibold text-white">What parents should check</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, idx) => (
                  <tr key={row.option} className={idx === 0 ? 'bg-emerald-50/60' : idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                    <td className="border border-slate-200 px-4 py-3.5 font-semibold text-slate-900">{row.option}</td>
                    <td className="border border-slate-200 px-4 py-3.5 text-slate-700">{row.bestFor}</td>
                    <td className="border border-slate-200 px-4 py-3.5 text-slate-700">{row.limitation}</td>
                    <td className="border border-slate-200 px-4 py-3.5 text-slate-700">{row.check}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="bg-[#fff6ec] px-4 py-8 sm:px-5 md:py-12 lg:px-6 lg:py-14">
        <div className="mx-auto max-w-6xl rounded-3xl border border-[#F3D8B6] bg-white/95 p-5 shadow-[0_14px_34px_rgba(143,95,35,0.1)] md:p-8">
          <h2 className="mb-5 text-2xl font-bold text-slate-900 sm:text-3xl">Why parents choose Tiny Steps for phonics</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {whyTinyStepsPoints.map((item) => (
              <article key={item} className="rounded-2xl border border-[#E6DFF7] bg-gradient-to-br from-white to-[#FBF8FF] px-4 py-4 text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <h3 className="font-semibold text-slate-900">{item}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-5 md:py-12 lg:px-6 lg:py-14">
        <div className="mx-auto max-w-6xl rounded-3xl border border-[#DDE8F8] bg-white/95 p-5 shadow-[0_12px_30px_rgba(55,97,143,0.12)] md:p-8">
          <h2 className="mb-5 text-2xl font-bold text-slate-900 sm:text-3xl">Tiny Steps method</h2>
          <ol className="grid gap-3 md:grid-cols-2">
            {methodSteps.map((step, index) => (
              <li key={step} className="flex items-center gap-3 rounded-2xl border border-[#DDE6F4] bg-gradient-to-r from-white to-[#F7FBFF] px-4 py-3 text-slate-700 shadow-sm">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-[#7EA5FF] to-[#5D87EB] text-xs font-semibold text-white">{index + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-gradient-to-b from-[#F4EEFF] via-[#FFF7F1] to-[#EEF7FF] px-4 py-8 sm:px-5 md:py-12 lg:px-6 lg:py-14">
        <div className="mx-auto max-w-6xl rounded-3xl border border-[#E6D8FA] bg-gradient-to-br from-[#FFFDFE] via-[#FFF7FB] to-[#F4F8FF] p-5 shadow-[0_16px_36px_rgba(86,58,121,0.12)] md:p-8">
          <h2 className="mb-3 text-2xl font-bold text-slate-900 sm:text-3xl">What your child learns</h2>
          <div className="mb-5 h-1.5 w-20 rounded-full bg-gradient-to-r from-[#FF9CB7] via-[#B7A5FF] to-[#7CC9FF]" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              <h2 className="mb-4 text-2xl font-bold text-slate-900 sm:text-3xl">Practice support beyond live class</h2>
              <p className="max-w-[980px] text-slate-700">
                Children learn better when class teaching is supported by playful practice. Tiny Steps gives children free phonics games and digital practice activities so learning continues beyond the live class.
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
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8A5A1F]">Practice library</p>
              <p className="mt-2 text-slate-700">Access child-friendly game links for daily reinforcement at home.</p>
              <div className="mt-4 grid gap-3">
                <Link to="/free-games-for-kids" className="rounded-xl border border-[#F2D8B2] bg-white px-4 py-3 font-medium text-slate-900 hover:bg-[#FFF8EC]">Free games for kids</Link>
                <Link to="/free-letter-tracing-game-for-kids" className="rounded-xl border border-[#E2D5FB] bg-white px-4 py-3 font-medium text-slate-900 hover:bg-[#FAF7FF]">Free letter tracing game</Link>
                <Link to="/letter-tracing-with-sounds-game" className="rounded-xl border border-[#CFE6FA] bg-white px-4 py-3 font-medium text-slate-900 hover:bg-[#F4FAFF]">Letter tracing with sounds game</Link>
                <Link to="/free-balloon-pop-phonics-game-for-kids" className="rounded-xl border border-[#D6F0DE] bg-white px-4 py-3 font-medium text-slate-900 hover:bg-[#F4FDF7]">Balloon pop phonics game</Link>
                <Link to="/free-games/word-meaning-flashcards" className="rounded-xl border border-[#F9E6B8] bg-white px-4 py-3 font-medium text-slate-900 hover:bg-[#FFFBEF]">Word meaning flashcards</Link>
              </div>
            </div>
          </div>

          <p className="mt-5 text-slate-700">
            Related reading support: <Link to="/reading-classes-for-kids" className="font-semibold underline underline-offset-2">reading classes for kids</Link>.
          </p>
        </div>
      </section>

      <section className="bg-[#fffaf3] px-4 py-8 sm:px-5 md:py-12 lg:px-6 lg:py-14">
        <div className="mx-auto max-w-6xl rounded-3xl border border-[#F1D8A8] bg-white p-5 shadow-[0_12px_30px_rgba(122,74,16,0.08)] md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Pricing and next step</h2>
          <p className="mt-3 max-w-[940px] text-slate-700">
            Start with a free assessment first. After the assessment, we recommend the right class frequency and plan based on your child&apos;s current reading level.
          </p>
          {starterPlan ? (
            <p className="mt-3 text-slate-700">
              Current starter reference: {starterPlan.classes} classes/month from {formatINR(starterPlan.monthlyFee)}.
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/pricing" className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-[#E4D8F7] bg-white px-6 py-3 font-semibold text-slate-900 hover:bg-[#FAF7FF]">
              View Pricing
            </Link>
            <Link to="/book-demo" className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-gradient-to-r from-[#FF7B66] to-[#FF9E7A] px-6 py-3 font-semibold text-white shadow-[0_12px_26px_rgba(255,126,99,0.35)] hover:from-[#FF715B] hover:to-[#FF9570]">
              Book Free Assessment
            </Link>
          </div>
        </div>
      </section>

      <section id="faq" className="px-4 py-8 sm:px-5 md:py-12 lg:px-6 lg:py-14">
        <div className="mx-auto max-w-6xl rounded-3xl border border-[#E2D9F7] bg-white/95 p-5 shadow-[0_12px_30px_rgba(79,61,122,0.1)] md:p-8">
          <h2 className="mb-5 text-2xl font-bold text-slate-900 sm:text-3xl">Frequently asked questions</h2>
          <div className="space-y-3 md:space-y-4">
            {faqItems.map((item) => (
              <article key={item.question} className="rounded-2xl border border-[#DDE6F4] bg-gradient-to-r from-white to-[#FAFCFF] p-5 shadow-sm">
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
            Book a free assessment and get a clear starting level, learning path, and parent-friendly recommendation.
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
            <Link to="/phonics" className="underline underline-offset-2 hover:text-white">Explore Full Phonics Program</Link>
          </p>
        </div>
      </section>

      <ClusterSeoNav cluster="phonics" />
    </div>
  );
}
