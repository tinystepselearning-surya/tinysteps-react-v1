import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import ClusterSeoNav from '../components/programs/ClusterSeoNav';
import TestimonialSnippets from '../components/common/TestimonialSnippets';
import { PUBLIC_SESSION_DURATION_LABEL, PUBLIC_SITE_FACTS } from '../config/publicFacts';
import { SEMANTIC_FACTS } from '../config/semanticFacts';
import { applySeo } from '../lib/seo';
import { createCourseSchema, createFAQPageSchema, createWebPageSchema, PUBLIC_FACTS } from '../lib/schemas';
import ResponsiveTeachingSection from '../components/programs/ResponsiveTeachingSection';

const speakingFacts = SEMANTIC_FACTS.programmes.speaking;
const demoMinutes = PUBLIC_SITE_FACTS.standardOffer.demoDurationMinutes;
const seoTitle = 'Public Speaking & Communication Classes for Kids | Tiny Steps';
const seoDescription =
  'Live 1:1 public speaking and communication classes for kids in India and worldwide. Build structured answers, storytelling, presentations and communication confidence in 35-minute classes.';

const SPEAKING_SEO_KEYWORDS = [
  'public speaking classes for kids online',
  'public speaking classes for kids',
  'communication skills classes for kids online',
  'communication classes for kids',
  '1 to 1 public speaking classes for kids',
  'online public speaking classes for kids India',
  'public speaking classes for kids in India',
  'online communication classes for kids',
  'storytelling classes for kids online',
  'presentation skills classes for kids',
  'show and tell practice for kids',
  'public speaking classes for kids worldwide',
];

const faqItems = [
  {
    question: 'What do public speaking and communication classes for kids teach?',
    answer:
      'Tiny Steps focuses on structured answers, storytelling, show-and-tell, presentation skills, audience awareness, clear expression, listening, idea organisation, and communication confidence through guided live speaking practice.',
  },
  {
    question: 'What is the difference between spoken English and public speaking classes?',
    answer:
      'Spoken English focuses mainly on everyday conversation, fuller sentences, response fluency, and comfortable English speaking. Public speaking and communication classes add structured answers, storytelling, presentations, show-and-tell, audience awareness, and school communication. Children whose main need is conversational fluency should use the dedicated Spoken English programme.',
  },
  {
    question: 'Are communication-skills classes included in the Tiny Steps Speaking programme?',
    answer:
      'Yes. General communication-skills work such as organising ideas, answering clearly, listening and responding, storytelling, classroom participation, and presentation confidence is part of the Tiny Steps Speaking & Communication pathway.',
  },
  {
    question: 'When is the confidence-building programme a better fit?',
    answer:
      'If the primary difficulty is hesitation, participation confidence, or speaking comfort across situations rather than public-speaking structure or communication skills, the dedicated Confidence Building programme may be the better starting point. The free assessment helps separate these needs.',
  },
  {
    question: 'What ages are the Tiny Steps Public Speaking levels for?',
    answer:
      `Basic Public Speaking is designed for ${speakingFacts.levels.beginner.ageRange.label} and has ${speakingFacts.levels.beginner.lessonCount} lessons. Advanced Public Speaking is designed for ${speakingFacts.levels.advanced.ageRange.label} and has ${speakingFacts.levels.advanced.lessonCount} lessons. The ranges overlap at age 7, so placement also considers speaking readiness and current skill level.`,
  },
  {
    question: 'Are Tiny Steps public speaking classes live and 1:1?',
    answer:
      `Yes. Standard Tiny Steps 1:1 classes are live online and run for ${PUBLIC_SESSION_DURATION_LABEL}. Small-group options may also be available for selected schedules or programme fits.`,
  },
  {
    question: 'Can families outside India join public speaking classes?',
    answer:
      'Yes. Tiny Steps supports families in India and worldwide, including NRI families and families in the UAE, United States, United Kingdom, Australia, Singapore, and other locations, subject to compatible teacher timings and learning fit.',
  },
  {
    question: 'How can parents see speaking progress?',
    answer:
      'Compare fresh speaking tasks over time. Look for longer and clearer responses, better idea organisation, stronger storytelling or presentation structure, less prompting, more confident delivery, and the ability to transfer the same skill to a new speaking task.',
  },
];

const speakingPathwayCards = [
  {
    name: 'Ideas and listening',
    description: 'Build attention, idea recall, listening, and guided response readiness before speaking.',
  },
  {
    name: 'Complete spoken responses',
    description: 'Help children expand short answers into complete, relevant responses for the task.',
  },
  {
    name: 'Structured answers',
    description: 'Organise ideas clearly so answers have a beginning, useful detail, and a clear ending.',
  },
  {
    name: 'Storytelling',
    description: 'Develop sequencing, relevant detail, expressive delivery, and a natural story flow.',
  },
  {
    name: 'Clear communication',
    description: 'Improve vocabulary choice, explanation clarity, listening-and-response skills, and purposeful delivery.',
  },
  {
    name: 'Presentation confidence',
    description: 'Build readiness for show-and-tell, classroom discussions, presentations, and audience-facing speaking.',
  },
];

const speakingPyramidLevels = [
  'Presentation confidence',
  'Storytelling',
  'Structured answers',
  'Complete sentences',
  'Listening and ideas',
];

export default function SpeakingPage() {
  const canonicalPath = '/speaking';
  const canonicalUrl = `${PUBLIC_FACTS.primaryWebsite}${canonicalPath}`;

  useEffect(() => {
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
        { '@type': 'ListItem', position: 2, name: 'Curriculum', item: 'https://tinystepslearning.com/curriculum' },
        { '@type': 'ListItem', position: 3, name: 'Public Speaking Classes for Kids', item: canonicalUrl },
      ],
    };

    const webpageSchema = {
      ...createWebPageSchema({
        name: 'Public Speaking & Communication Classes for Kids',
        description: seoDescription,
        url: canonicalUrl,
      }),
      '@id': `${canonicalUrl}#webpage`,
    };

    const pathwayItemListSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Tiny Steps speaking and communication pathway',
      url: canonicalUrl,
      numberOfItems: speakingPathwayCards.length,
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      itemListElement: speakingPathwayCards.map((card, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Thing',
          name: card.name,
          description: card.description,
        },
      })),
    };

    const faqSchema = {
      ...createFAQPageSchema(faqItems),
      '@id': `${canonicalUrl}#faq`,
    };

    const courseSchema = createCourseSchema({
      name: 'Public Speaking & Communication Classes for Kids',
      description:
        'Live 1:1 online public speaking and communication classes for kids focused on structured answers, storytelling, show-and-tell, presentations, clear expression, and communication confidence.',
      url: canonicalUrl,
      educationalLevel: `${speakingFacts.levels.beginner.label}: ${speakingFacts.levels.beginner.ageRange.label}; ${speakingFacts.levels.advanced.label}: ${speakingFacts.levels.advanced.ageRange.label}; assessment-first placement`,
      teaches: ['public speaking', 'communication skills', 'structured answers', 'storytelling', 'show and tell', 'presentation skills', 'audience awareness', 'clear expression'],
      areaServed: ['India', 'Worldwide'],
    });

    applySeo({
      title: seoTitle,
      description: seoDescription,
      canonicalPath,
      robots: 'index,follow',
      ogType: 'website',
      keywords: SPEAKING_SEO_KEYWORDS,
      jsonLd: [breadcrumbSchema, webpageSchema, courseSchema, pathwayItemListSchema, faqSchema],
    });
  }, [canonicalPath, canonicalUrl]);

  return (
    <div className="bg-gradient-to-b from-[#FFF8EF] via-white to-[#EEF8FF] pb-16">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#FFF8EF] via-white to-[#EEF8FF] px-4 py-8 sm:px-5 md:py-12 lg:px-8 lg:py-14">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(255,184,120,0.2),transparent_28%),radial-gradient(circle_at_88%_8%,rgba(173,216,255,0.22),transparent_32%),radial-gradient(circle_at_68%_78%,rgba(217,196,255,0.15),transparent_24%)]" />
        <div className="pointer-events-none absolute -left-16 top-10 h-44 w-44 rounded-full bg-[#FFD7AF]/40 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 rounded-full bg-[#CFE5FF]/40 blur-3xl" />
        <div className="mx-auto max-w-7xl">
          <nav aria-label="Breadcrumb" className="mb-4 text-xs text-slate-600 sm:text-sm">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link to="/" className="hover:text-slate-900 hover:underline">Home</Link>
              </li>
              <li aria-hidden="true">&gt;</li>
              <li>
                <Link to="/curriculum" className="hover:text-slate-900 hover:underline">Curriculum</Link>
              </li>
              <li aria-hidden="true">&gt;</li>
              <li className="font-medium text-slate-900">Public Speaking Classes for Kids</li>
            </ol>
          </nav>

          <div className="relative grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="relative">
              <p className="inline-flex items-center rounded-full border border-orange-200 bg-white/84 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-700 shadow-sm backdrop-blur">
                Communication confidence for children
              </p>
              <h1 className="mt-4 max-w-full text-[34px] font-bold leading-[1.05] tracking-[-0.035em] text-slate-900 sm:text-[38px] md:max-w-[680px] md:text-[46px] lg:text-[52px]">
                Public Speaking & Communication Classes for Kids
              </h1>
              <p className="mt-4 max-w-full text-base leading-7 text-slate-700 md:mt-5 md:max-w-[660px] md:text-lg md:leading-8">
                Tiny Steps offers live online public speaking and communication classes for kids who need stronger structured answers, storytelling, show-and-tell, presentations, classroom participation, or clearer communication. Children start with a free speaking assessment, then move into Basic or Advanced Public Speaking based on age, speaking readiness, and current skill level.
              </p>
              <p className="mt-3 max-w-full text-base leading-7 text-slate-700 md:mt-4 md:max-w-[660px] md:text-lg md:leading-8">
                Standard live 1:1 classes are {PUBLIC_SESSION_DURATION_LABEL}. The assessment checks response structure, storytelling, presentation readiness, communication clarity, and speaking confidence before a learning path is recommended. Ready to move forward? <Link to="/book-demo" className="font-semibold text-slate-900 underline underline-offset-2 hover:text-sky-700">book one free {demoMinutes}-minute 1:1 online demo assessment class</Link>.
              </p>

              <div className="mt-7">
                <Link
                  to="/book-demo"
                  className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-gradient-to-r from-[#FF7B66] to-[#FF9B72] px-6 py-3.5 text-base font-bold text-white shadow-[0_14px_30px_rgba(255,126,99,0.3)] transition hover:from-[#FF715B] hover:to-[#FF9267] sm:w-auto sm:min-w-[230px] md:px-8 md:py-4"
                >
                  Book Free {demoMinutes}-Minute Demo
                </Link>
                <Link
                  to="/curriculum?tab=speaking"
                  className="ml-0 mt-3 inline-flex min-h-[44px] items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 sm:ml-3 sm:mt-0"
                >
                  View Full Curriculum Roadmap
                </Link>
                <p className="mt-3 text-sm text-slate-600 md:text-[15px]">Free {demoMinutes}-minute 1:1 online assessment before enrolment</p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  {
                    label: 'Clear expression',
                    className: 'border-[#F5DAB7] bg-[#FFF7EC] text-[#7A4A10]',
                    dotClassName: 'bg-[#E58E41]',
                  },
                  {
                    label: 'Storytelling confidence',
                    className: 'border-[#D9E7F6] bg-[#F6FBFF] text-[#224764]',
                    dotClassName: 'bg-[#65A7E3]',
                  },
                  {
                    label: 'Parent progress visibility',
                    className: 'border-[#E4DCF8] bg-[#FBF8FF] text-[#4E447C]',
                    dotClassName: 'bg-[#9A88E6]',
                  },
                ].map((chip) => (
                  <span key={chip.label} className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm backdrop-blur sm:px-3.5 sm:text-sm ${chip.className}`}>
                    <span className={`h-2 w-2 rounded-full ${chip.dotClassName}`} aria-hidden="true" />
                    {chip.label}
                  </span>
                ))}
              </div>
              <p className="mt-4 max-w-[660px] text-sm leading-7 text-slate-700">
                If the main goal is everyday conversational fluency rather than presentations or communication structure, use <Link to="/spoken-english-classes-for-kids-online" className="font-semibold text-slate-900 underline underline-offset-4 hover:text-sky-700">Spoken English Classes for Kids</Link>. If confidence itself is the primary difficulty across situations, review the <Link to="/confidence-building-program-kids" className="font-semibold text-slate-900 underline underline-offset-4 hover:text-sky-700">Confidence Building Programme</Link>.
              </p>
            </div>

            <aside className="relative mt-7 w-full overflow-hidden rounded-[24px] border border-slate-200/70 bg-[linear-gradient(150deg,rgba(255,255,255,0.98),rgba(248,251,255,0.95),rgba(255,249,241,0.94))] p-4 shadow-[0_12px_30px_rgba(15,23,42,0.07)] sm:mt-8 sm:p-5 md:rounded-[28px] md:p-6 md:shadow-[0_18px_45px_rgba(15,23,42,0.08)] lg:ml-auto lg:mt-0 lg:max-w-[560px] lg:p-7">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#FFB878] via-[#A9CFFF] to-[#D9C0FF]" />
              <p className="mb-4 text-left text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 sm:text-[11px] md:mb-5 md:text-xs md:tracking-[0.22em]">
                SPEAKING JOURNEY PREVIEW
              </p>

              <div className="mx-auto flex w-full max-w-full flex-col items-center md:max-w-[450px]">
                {speakingPyramidLevels.map((title, index) => {
                  const widthClass =
                    index === 0
                      ? 'w-[54%] md:w-[50%]'
                      : index === 1
                        ? 'w-[66%] md:w-[62%]'
                        : index === 2
                          ? 'w-[78%] md:w-[74%]'
                          : index === 3
                            ? 'w-[90%] md:w-[86%]'
                            : 'w-full md:w-[98%]';

                  const bg =
                    index === 0
                      ? '#FFB562'
                      : index === 1
                        ? '#BFE7F2'
                        : index === 2
                          ? '#8ED8E8'
                          : index === 3
                            ? '#58C4DD'
                            : '#2E8FD0';

                  const textColor = index >= 3 ? '#FFFFFF' : '#0A192F';

                  return (
                    <div key={title} className={`${index === 0 ? '' : '-mt-[1px]'} ${widthClass} mx-auto`}>
                      <div
                        className="flex h-[38px] items-center justify-center border border-white/80 px-2 text-center font-bold leading-tight shadow-[0_6px_14px_rgba(15,23,42,0.055)] sm:h-[40px] sm:px-3 md:h-[48px] md:px-4 lg:h-[50px]"
                        style={{
                          clipPath: 'polygon(8% 0%, 92% 0%, 100% 100%, 0% 100%)',
                          background: bg,
                        }}
                      >
                        <span className="text-[12px] font-bold leading-tight sm:text-[13px] md:text-[15px] lg:text-[16px]" style={{ color: textColor }}>
                          {title}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mx-auto mt-4 w-full max-w-full rounded-2xl border border-[#E9C68D] bg-gradient-to-br from-[#FFF8EC] via-[#FFF6E8] to-[#FFF1D8] px-4 py-3.5 text-center shadow-[0_8px_22px_rgba(122,74,16,0.07)] md:mt-5 md:max-w-[450px] md:rounded-[22px] md:px-5 md:py-4">
                <span className="block text-[16px] font-extrabold leading-snug text-[#6B3A0E] md:text-[19px]">We identify the child&apos;s speaking gap first.</span>
                <span className="mt-1 block text-[14px] font-medium leading-snug text-[#7A4A10] md:mt-1.5 md:text-[16px]">Then we suggest the right speaking and communication path.</span>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="bg-[#fffaf3] px-4 pb-8 pt-8 sm:px-5 md:pb-12 md:pt-10 lg:px-6 lg:pb-14">
        <div className="mx-auto max-w-6xl">
          <article className="max-w-6xl rounded-2xl border border-[#F1D8A8] bg-white/95 p-5 shadow-sm md:rounded-3xl md:p-7">
            <p className="inline-flex rounded-full bg-[#FFF2C7] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7A4A10] md:text-[11px] md:tracking-[0.18em]">
              Parent clarity
            </p>
            <h2 className="mb-3 mt-3 text-2xl font-bold leading-tight text-slate-900 md:text-[30px]">Quick Answer: What do public speaking classes for kids include?</h2>
            <p className="max-w-[920px] text-base leading-7 text-slate-700 md:text-[17px]">
              Public speaking classes for kids should help children move from short answers and hesitation to complete sentences, structured responses, storytelling, show-and-tell confidence, reading aloud expression, and presentation readiness. Tiny Steps begins with a free {demoMinutes}-minute 1:1 online demo assessment class to identify whether the child needs public-speaking structure, communication practice, everyday spoken-English support, grammar support, or specialist confidence-building support.
            </p>
          </article>
        </div>
      </section>

      <ResponsiveTeachingSection
        id="teacher-delivery"
        program="Public Speaking & Communication"
        introduction="Teachers provide a predictable speaking routine: model a clear response, offer guided prompts, listen to the child’s attempt and help them retry. Prompts are reduced gradually so confidence grows alongside independent expression."
        steps={[
          { title: 'Model and organise', detail: 'The teacher shows how to form a complete answer, add relevant detail and organise ideas for the task.' },
          { title: 'Prompt and retry', detail: 'The child speaks in short, age-appropriate turns with encouraging, specific feedback and guided retries.' },
          { title: 'Reduce support', detail: 'Topics, examples, wait time and prompts adjust to readiness, then fade as the child speaks more independently.' },
        ]}
        observation="sentence completeness, idea organisation, clarity, response to feedback and how much prompting the child needs before speaking independently."
      />

      <section className="px-4 pb-8 pt-8 sm:px-5 md:pb-12 md:pt-12 lg:px-6 lg:pb-14 lg:pt-14">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-3 text-2xl font-bold text-slate-900 sm:text-3xl">Which speaking programme does your child need?</h2>
          <p className="max-w-4xl text-base leading-7 text-slate-700">The right page depends on the child&apos;s main goal. These programme boundaries keep public speaking, everyday English fluency, grammar accuracy, and specialist confidence support clear.</p>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <article className="rounded-2xl border border-sky-200 bg-sky-50/70 p-5 shadow-sm">
              <h3 className="text-lg font-bold text-slate-950">Public speaking & general communication</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">Choose this page for structured answers, storytelling, show-and-tell, classroom participation, presentations, audience awareness, and general communication skills.</p>
            </article>
            <article className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-sm">
              <h3 className="text-lg font-bold text-slate-950">Everyday spoken English & conversational fluency</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">Choose Spoken English when the main goal is fuller everyday answers, sentence expansion, comfortable conversation, and English fluency.</p>
              <Link to="/spoken-english-classes-for-kids-online" className="mt-3 inline-block text-sm font-semibold underline underline-offset-2">Explore Spoken English Classes</Link>
            </article>
            <article className="rounded-2xl border border-violet-200 bg-violet-50/70 p-5 shadow-sm">
              <h3 className="text-lg font-bold text-slate-950">Grammar accuracy</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">Choose Grammar when tense control, sentence structure, punctuation, articles, prepositions, or correction accuracy is the primary difficulty.</p>
              <Link to="/grammar" className="mt-3 inline-block text-sm font-semibold underline underline-offset-2">Explore Grammar Classes</Link>
            </article>
            <article className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-sm">
              <h3 className="text-lg font-bold text-slate-950">Specialist confidence-building support</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">Choose the specialist programme when hesitation, participation confidence, or speaking comfort across situations is the main need rather than communication structure alone.</p>
              <Link to="/confidence-building-program-kids" className="mt-3 inline-block text-sm font-semibold underline underline-offset-2">Explore Confidence Building</Link>
            </article>
          </div>
        </div>
      </section>

      <section className="px-4 pb-8 sm:px-5 md:pb-12 lg:px-6">
        <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:rounded-3xl md:p-7">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Online public speaking and communication classes in India and worldwide</h2>
          <p className="mt-3 text-base leading-7 text-slate-700">
            Tiny Steps uses one canonical live online Speaking & Communication programme for families in India and internationally. NRI families and families in the UAE, United States, United Kingdom, Australia, Singapore, and other locations can <Link to="/book-demo" className="font-semibold text-slate-900 underline underline-offset-2">book one free {demoMinutes}-minute 1:1 online demo assessment class</Link>; compatible teacher timings and learning fit are confirmed before enrolment.
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            We do not create separate country-specific speaking programmes. International public-speaking and communication searches resolve to this same curriculum and assessment path.
          </p>
        </div>
      </section>

      <section className="bg-[#eff7ff] px-4 py-8 sm:px-5 md:py-12 lg:px-6 lg:py-14">
        <div className="mx-auto max-w-6xl rounded-2xl border border-sky-100 bg-gradient-to-br from-[#F5FBFF] via-white to-[#FFF8EF] p-5 shadow-sm md:rounded-3xl md:p-8">
          <h2 className="mb-4 text-2xl font-bold text-slate-900 sm:text-3xl">Tiny Steps speaking pathway</h2>

          <div className="flex flex-wrap gap-2">
            {['1 Ideas and listening', '2 Complete sentences', '3 Structured answers', '4 Storytelling', '5 Clear expression', '6 Presentation confidence'].map((step) => (
              <span key={step} className="rounded-full border border-sky-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800">
                {step}
              </span>
            ))}
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-700 md:text-base md:leading-7">
            Listening and ideas -&gt; Complete sentences -&gt; Structured answers -&gt; Storytelling -&gt; Clear expression -&gt; Presentation confidence
          </p>
          <p className="mt-3 text-slate-700">
            Children do not all struggle with speaking at the same stage. Some need help forming full sentences, while others need support with structured answers, storytelling, reading aloud, vocabulary, or confidence during school activities.
          </p>
          <p className="mt-3 text-slate-700">
            Tiny Steps uses assessment-first placement to find the exact speaking gap and then helps the child move forward step by step.
          </p>

          <div className="mt-6 grid gap-4 md:gap-5 md:grid-cols-2">
            {speakingPathwayCards.map((card) => (
              <article key={card.name} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-sm transition hover:shadow-md md:p-6">
                <h3 className="text-lg font-semibold text-slate-900">{card.name}</h3>
                <p className="mt-2 text-sm text-slate-700 md:text-base">{card.description}</p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-sky-700">Part of the Tiny Steps Speaking & Communication pathway</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-5 md:py-12 lg:px-6 lg:py-14">
        <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:rounded-[30px] md:p-8">
          <h2 className="mb-4 text-2xl font-bold text-slate-900 sm:text-3xl">Speaking, storytelling, and presentation confidence are connected</h2>
          <div className="grid gap-4 md:grid-cols-3 md:gap-5">
            <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
              <h3 className="text-lg font-semibold text-slate-900">Speaking clarity</h3>
              <p className="mt-2 text-sm text-slate-700 md:text-base">
                Speaking clarity helps children answer questions in complete, meaningful sentences.
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
              <h3 className="text-lg font-semibold text-slate-900">Storytelling</h3>
              <p className="mt-2 text-sm text-slate-700 md:text-base">
                Storytelling helps children organise events, add details, use expression, and speak in a natural flow.
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
              <h3 className="text-lg font-semibold text-slate-900">Presentation confidence</h3>
              <p className="mt-2 text-sm text-slate-700 md:text-base">
                Presentation confidence helps children speak in front of others during show-and-tell, school tasks, discussions, and presentations.
              </p>
            </article>
          </div>
          <p className="mt-4 text-slate-700">
            Tiny Steps connects sentence formation, thinking structure, storytelling, and confidence so children do not only memorise lines; they learn to express ideas clearly. Speaking progress is stronger when combined with <Link to="/grammar" className="font-semibold underline underline-offset-2">grammar and sentence formation support</Link>.
          </p>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-5 md:py-12 lg:px-6 lg:py-14">
        <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:rounded-[30px] md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Why parents choose Tiny Steps speaking support</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              'Assessment-first speaking placement',
              'Guided low-pressure speaking turns',
              'Sentence expansion practice',
              'Storytelling and answer structure',
              'Reading aloud expression',
              'Show-and-tell and school communication practice',
              '1:1 attention',
              'Parent progress visibility',
            ].map((item) => (
              <li key={item} className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-medium text-slate-800">
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm leading-6 text-slate-700">
            Review <Link to="/pricing" className="font-semibold underline underline-offset-2">class pricing</Link> and <Link to="/book-demo" className="font-semibold underline underline-offset-2">book one free 35-minute 1:1 online demo assessment class</Link> when you are ready.
          </p>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-5 md:py-12 lg:px-6 lg:py-14">
        <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:rounded-[30px] md:p-8">
          <h2 className="mb-4 text-2xl font-bold text-slate-900 sm:text-3xl">What parents should compare before choosing public speaking classes</h2>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-[620px] border-collapse text-left text-sm md:min-w-full md:text-base">
              <thead>
                <tr>
                  <th className="border border-slate-200 bg-emerald-100 px-4 py-3 font-semibold text-slate-900">Better choice</th>
                  <th className="border border-slate-200 bg-orange-100 px-4 py-3 font-semibold text-slate-900">Avoid this</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-200 bg-emerald-50/70 px-4 py-3.5 text-slate-700">Guided speaking turns</td>
                  <td className="border border-slate-200 bg-orange-50/70 px-4 py-3.5 text-slate-700">Passive watching or memorising</td>
                </tr>
                <tr>
                  <td className="border border-slate-200 bg-emerald-50/70 px-4 py-3.5 text-slate-700">Sentence expansion practice</td>
                  <td className="border border-slate-200 bg-orange-50/70 px-4 py-3.5 text-slate-700">Only asking the child to talk more</td>
                </tr>
                <tr>
                  <td className="border border-slate-200 bg-emerald-50/70 px-4 py-3.5 text-slate-700">Storytelling and answer structure</td>
                  <td className="border border-slate-200 bg-orange-50/70 px-4 py-3.5 text-slate-700">Random topics without guidance</td>
                </tr>
                <tr>
                  <td className="border border-slate-200 bg-emerald-50/70 px-4 py-3.5 text-slate-700">Confidence-building correction</td>
                  <td className="border border-slate-200 bg-orange-50/70 px-4 py-3.5 text-slate-700">Overcorrecting every mistake</td>
                </tr>
                <tr>
                  <td className="border border-slate-200 bg-emerald-50/70 px-4 py-3.5 text-slate-700">School communication practice</td>
                  <td className="border border-slate-200 bg-orange-50/70 px-4 py-3.5 text-slate-700">Only stage-performance activities</td>
                </tr>
                <tr>
                  <td className="border border-slate-200 bg-emerald-50/70 px-4 py-3.5 text-slate-700">Parent progress visibility</td>
                  <td className="border border-slate-200 bg-orange-50/70 px-4 py-3.5 text-slate-700">No clear speaking progress updates</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-4 max-w-[900px] text-slate-700">
            The best public speaking class should not only give topics. It should help the child think clearly, frame complete answers, speak with confidence, and gradually become comfortable expressing ideas.
          </p>
        </div>
      </section>

      <section className="bg-[#fff6ec] px-4 py-8 sm:px-5 md:py-12 lg:px-6 lg:py-14">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-3 text-2xl font-bold text-slate-900 sm:text-3xl">Tiny Steps Public Speaking levels</h2>
          <p className="max-w-4xl text-base leading-7 text-slate-700">Tiny Steps has two speaking levels. Their age ranges overlap deliberately, so age is a guide and assessment helps decide the better starting point.</p>
          <div className="mt-6 grid gap-4 md:gap-5 md:grid-cols-3">
            <article className="flex h-full flex-col rounded-2xl border border-amber-100 bg-gradient-to-br from-white to-amber-50/70 p-5 shadow-sm md:rounded-3xl md:p-6">
              <span className="inline-flex w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-800">{speakingFacts.levels.beginner.ageRange.label}</span>
              <h3 className="mt-3 text-lg font-bold text-slate-950">{speakingFacts.levels.beginner.label}</h3>
              <p className="mt-2 text-sm text-slate-700">{speakingFacts.levels.beginner.lessonCount} lessons covering early structured responses, picture talk, show-and-tell, storytelling foundations, clear expression, and speaking comfort.</p>
            </article>

            <article className="flex h-full flex-col rounded-2xl border border-sky-100 bg-gradient-to-br from-white to-sky-50/70 p-5 shadow-sm md:rounded-3xl md:p-6">
              <span className="inline-flex w-fit rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-800">{speakingFacts.levels.advanced.ageRange.label}</span>
              <h3 className="mt-3 text-lg font-bold text-slate-950">{speakingFacts.levels.advanced.label}</h3>
              <p className="mt-2 text-sm text-slate-700">{speakingFacts.levels.advanced.lessonCount} lessons building more organised answers, storytelling, opinion sharing, presentations, audience awareness, discussion confidence, and clearer communication.</p>
            </article>

            <article className="flex h-full flex-col rounded-2xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/70 p-5 shadow-sm md:rounded-3xl md:p-6">
              <span className="inline-flex w-fit rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-800">Assessment-led placement</span>
              <h3 className="mt-3 text-lg font-bold text-slate-950">Age 7 sits in both ranges</h3>
              <p className="mt-2 text-sm text-slate-700">Placement considers current response length, organisation, storytelling, presentation readiness, confidence, and how much prompting the child needs—not age alone.</p>
              <Link to="/book-demo" className="mt-4 inline-block text-sm font-semibold underline underline-offset-2">Book the free speaking assessment</Link>
            </article>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-5 md:py-12 lg:px-6 lg:py-14">
        <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:rounded-[30px] md:p-8">
          <h2 className="mb-4 text-2xl font-bold text-slate-900 sm:text-3xl">What happens in the free speaking assessment?</h2>
          <div className="grid gap-6 md:gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-base leading-7 text-slate-700">
                The free speaking assessment helps us understand where your child is currently getting stuck.
              </p>
              <p className="mt-3 text-base leading-7 text-slate-700">
                During the assessment, we may check how your child answers questions, organises ideas, tells a short story, responds to prompts, handles show-and-tell or presentation-style tasks, and speaks with confidence. Based on this, Tiny Steps recommends the right speaking, communication, spoken-English, grammar, or specialist confidence path.
              </p>
              <Link
                to="/book-demo"
                className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-slate-900 px-6 py-3.5 text-base font-semibold text-white shadow-[0_12px_30px_rgba(15,23,42,0.25)] transition hover:bg-slate-800 sm:w-auto sm:px-7 sm:py-3"
              >
                Book Free {demoMinutes}-Minute Demo
              </Link>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 md:p-6">
              <h3 className="text-lg font-semibold text-slate-900">Assessment steps</h3>
              <ol className="mt-3 space-y-2.5 text-slate-700">
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">1</span>
                  <span>Check the child&apos;s current speaking comfort</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">2</span>
                  <span>Identify the speaking or confidence gap</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">3</span>
                  <span>Recommend the right learning path</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">4</span>
                  <span>Explain the next steps to parents</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#eef6ff] px-4 py-8 sm:px-5 md:py-12 lg:px-6 lg:py-14">
        <div className="mx-auto max-w-6xl rounded-2xl border border-sky-100 bg-white/95 p-5 shadow-sm md:rounded-[30px] md:p-8">
          <p className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-800">Parent visibility</p>
          <h2 className="mb-4 mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">How parents see speaking progress</h2>
          <p className="text-slate-700">Parents should not have to guess whether communication confidence is improving.</p>
          <p className="mt-3 text-slate-700">
            Tiny Steps focuses on visible speaking progress through class updates, skill-based feedback, strengths, improvement areas, and next-step guidance.
          </p>
          <ul className="mt-5 grid gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              'Speaking activities practised',
              'Sentence expansion progress',
              'Storytelling and expression growth',
              'Confidence while answering',
              'Skills that need more support',
              'Suggested next speaking practice',
            ].map((item) => (
              <li key={item} className="h-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-700 shadow-sm md:text-base">
                <span className="mr-2 font-semibold text-emerald-600">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-slate-700">
            See <Link to="/parents/tracking-progress" className="font-semibold underline underline-offset-2">how Tiny Steps tracks progress</Link> and review{' '}
            <Link to="/why-tiny-steps" className="font-semibold underline underline-offset-2">why parents choose Tiny Steps</Link> before deciding next steps.
          </p>
        </div>
      </section>

      <section id="faq" className="px-4 py-8 sm:px-5 md:py-12 lg:px-6 lg:py-14">
        <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:rounded-[30px] md:p-8">
          <h2 className="mb-4 text-2xl font-bold text-slate-900 sm:text-3xl">Frequently asked questions</h2>
          <div className="space-y-3 md:space-y-4">
            {faqItems.map((item) => (
              <article key={item.question} className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="faq-question text-[17px] font-semibold text-slate-900 md:text-lg">{item.question}</h3>
                <p className="faq-answer mt-2 text-[15px] leading-6 text-slate-700 md:text-base">{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-10 pt-6 sm:px-5 md:pb-12 lg:px-6">
        <div className="mx-auto max-w-6xl rounded-3xl bg-gradient-to-r from-slate-900 via-[#1f2a44] to-slate-900 p-6 text-center text-white shadow-[0_20px_50px_rgba(15,23,42,0.18)] sm:p-8 md:p-10">
          <h2 className="text-2xl font-bold md:text-3xl">Not sure why your child hesitates while speaking?</h2>
          <p className="mx-auto mt-3 max-w-3xl text-base leading-7 text-slate-200">
            Book one free {demoMinutes}-minute 1:1 online demo assessment class and let Tiny Steps identify whether the best next step is public speaking and communication, everyday spoken English, grammar support, or specialist confidence-building support.
          </p>
          <div className="mt-6 text-left">
            <TestimonialSnippets courseTag="speaking" title="What speaking parents noticed first" />
          </div>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/book-demo"
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-white px-8 py-3 font-semibold text-slate-900 transition hover:bg-slate-100 sm:w-auto"
            >
              Book Free {demoMinutes}-Minute Demo
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-slate-200">
            <Link to="/spoken-english-classes-for-kids-online" className="font-semibold underline underline-offset-2 hover:text-white">spoken English classes</Link>
            <span className="hidden sm:inline text-slate-400">•</span>
            <Link to="/confidence-building-program-kids" className="font-semibold underline underline-offset-2 hover:text-white">confidence-building programme</Link>
            <span className="hidden sm:inline text-slate-400">•</span>
            <Link to="/pricing" className="font-semibold underline underline-offset-2 hover:text-white">class pricing</Link>
            <span className="hidden sm:inline text-slate-400">•</span>
            <Link to="/resources/speaking" className="font-semibold underline underline-offset-2 hover:text-white">speaking & communication resources</Link>
          </div>
        </div>
      </section>

      <ClusterSeoNav cluster="speaking" />
    </div>
  );
}
