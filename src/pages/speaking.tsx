import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import ClusterSeoNav from '../components/programs/ClusterSeoNav';
import { applySeo } from '../lib/seo';
import { createFAQPageSchema, PUBLIC_FACTS } from '../lib/schemas';

const faqItems = [
  {
    question: 'How do I know if my child needs speaking support?',
    answer:
      'Common signs include short answers, hesitation, difficulty explaining ideas, low expression while reading aloud, and lack of confidence during school speaking tasks. An assessment helps identify the exact speaking gap.',
  },
  {
    question: 'Can public speaking classes help a shy child?',
    answer:
      'Yes. With guided low-pressure speaking turns, shy children can gradually build comfort, response length, and communication confidence without pressure-heavy performance expectations.',
  },
  {
    question: 'Can these classes help my child give longer answers?',
    answer:
      'Yes. Sentence expansion and answer-structure practice help children move from one-word responses to complete, meaningful answers in school and everyday conversation.',
  },
  {
    question: 'How are public speaking classes different from memorising speeches?',
    answer:
      'Strong public speaking classes build thinking, structure, expression, and real-time response skills. Memorising speeches alone does not build communication confidence across everyday school situations.',
  },
  {
    question: 'How does Tiny Steps show speaking progress to parents?',
    answer:
      'Parents receive clear progress visibility: what was practised, response quality, confidence growth, improvement areas, and next-step goals in sentence formation, storytelling, clear expression, and presentation confidence.',
  },
];

const speakingPathwayCards = [
  {
    name: 'Ideas and listening',
    description: 'Build attention, idea recall, and guided response readiness before speaking.',
    href: '/speaking',
    anchor: 'public speaking classes for kids',
    url: `${PUBLIC_FACTS.primaryWebsite}/speaking`,
  },
  {
    name: 'Complete sentences',
    description: 'Help children expand short responses into complete, clear sentences.',
    href: '/grammar',
    anchor: 'grammar and sentence formation support',
    url: `${PUBLIC_FACTS.primaryWebsite}/grammar`,
  },
  {
    name: 'Structured answers',
    description: 'Teach children how to organize answers clearly and respond with confidence.',
    href: '/speaking',
    anchor: 'public speaking classes for kids',
    url: `${PUBLIC_FACTS.primaryWebsite}/speaking`,
  },
  {
    name: 'Storytelling',
    description: 'Develop storytelling flow, sequencing, and detail-rich speaking output.',
    href: '/speaking',
    anchor: 'public speaking classes for kids',
    url: `${PUBLIC_FACTS.primaryWebsite}/speaking`,
  },
  {
    name: 'Clear expression',
    description: 'Improve vocabulary use, voice clarity, and meaningful sentence delivery.',
    href: '/reading-classes-for-kids',
    anchor: 'reading classes for kids',
    url: `${PUBLIC_FACTS.primaryWebsite}/reading-classes-for-kids`,
  },
  {
    name: 'Presentation confidence',
    description: 'Build confidence for show-and-tell, reading aloud, and classroom presentations.',
    href: '/speaking',
    anchor: 'public speaking classes for kids',
    url: `${PUBLIC_FACTS.primaryWebsite}/speaking`,
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
        { '@type': 'ListItem', position: 2, name: 'Courses', item: 'https://tinystepslearning.com/courses' },
        { '@type': 'ListItem', position: 3, name: 'Public Speaking Classes for Kids', item: canonicalUrl },
      ],
    };

    const pathwayItemListSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Tiny Steps speaking pathway',
      url: canonicalUrl,
      numberOfItems: speakingPathwayCards.length,
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      itemListElement: speakingPathwayCards.map((card, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: card.url,
        item: {
          '@type': 'Course',
          name: card.name,
          description: card.description,
          areaServed: 'India',
        },
      })),
    };

    const faqSchema = {
      ...createFAQPageSchema(faqItems),
      '@id': `${canonicalUrl}#faq`,
    };

    applySeo({
      title: 'Public Speaking Classes for Kids in India | Tiny Steps',
      description:
        'Live online public speaking classes for kids in India. Build sentence formation, storytelling, show-and-tell, clear expression and confidence. Book a free assessment.',
      canonicalPath,
      robots: 'index,follow',
      ogType: 'website',
      jsonLd: [breadcrumbSchema, pathwayItemListSchema, faqSchema],
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
                <Link to="/courses" className="hover:text-slate-900 hover:underline">Courses</Link>
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
                Public Speaking Classes for Kids in India
              </h1>
              <p className="mt-4 max-w-full text-base leading-7 text-slate-700 md:mt-5 md:max-w-[660px] md:text-lg md:leading-8">
                Help your child build communication confidence, sentence formation, storytelling flow, show-and-tell readiness, and presentation confidence through structured live online public speaking classes for kids in India.
              </p>
              <p className="mt-3 max-w-full text-base leading-7 text-slate-700 md:mt-4 md:max-w-[660px] md:text-lg md:leading-8">
                Tiny Steps follows an assessment-first speaking path to understand whether your child needs sentence expansion, speaking comfort, storytelling support, reading aloud confidence, or clear expression coaching. Ready to move forward? <Link to="/book-demo" className="font-semibold text-slate-900 underline underline-offset-2 hover:text-sky-700">book a free assessment</Link>.
              </p>

              <div className="mt-7">
                <Link
                  to="/book-demo"
                  className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-gradient-to-r from-[#FF7B66] to-[#FF9B72] px-6 py-3.5 text-base font-bold text-white shadow-[0_14px_30px_rgba(255,126,99,0.3)] transition hover:from-[#FF715B] hover:to-[#FF9267] sm:w-auto sm:min-w-[230px] md:px-8 md:py-4"
                >
                  Book Free Assessment
                </Link>
                <p className="mt-3 text-sm text-slate-600 md:text-[15px]">Takes 20-30 seconds • No commitment</p>
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
                <span className="mt-1 block text-[14px] font-medium leading-snug text-[#7A4A10] md:mt-1.5 md:text-[16px]">Then we suggest the right confidence path.</span>
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
              Public speaking classes for kids should help children move from short answers and hesitation to complete sentences, structured responses, storytelling, show-and-tell confidence, reading aloud expression, and presentation readiness. Tiny Steps begins with a free assessment to identify whether the child needs sentence expansion, speaking comfort, storytelling flow, or confidence support.
            </p>
          </article>
        </div>
      </section>

      <section className="px-4 pb-8 pt-8 sm:px-5 md:pb-12 md:pt-12 lg:px-6 lg:pb-14 lg:pt-14">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-6 text-2xl font-bold text-slate-900 sm:text-3xl">Find your child&apos;s speaking gap</h2>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {[
              {
                pill: 'Sentence expansion and answer building',
                problem: 'Child gives one-word or very short answers',
                meaning: 'The child may understand ideas but need structure to form complete responses.',
                support: 'Suggested Tiny Steps support: sentence expansion and answer-building',
                href: '/grammar',
                anchor: 'grammar and sentence formation support',
              },
              {
                pill: 'Speaking comfort and confidence',
                problem: 'Child knows the answer but hesitates',
                meaning: 'Confidence and speaking comfort may not yet be stable in real-time responses.',
                support: 'Suggested Tiny Steps support: speaking comfort and confidence practice',
                href: '/speaking',
                anchor: 'public speaking classes for kids',
              },
              {
                pill: 'Storytelling and sequencing',
                problem: 'Child struggles to explain events or stories',
                meaning: 'Idea order and detail flow may need guided storytelling routines.',
                support: 'Suggested Tiny Steps support: storytelling and sequencing',
                href: '/reading-classes-for-kids',
                anchor: 'reading classes for kids',
              },
              {
                pill: 'Show-and-tell and presentation practice',
                problem: 'Child needs confidence for show-and-tell',
                meaning: 'The child may need school-communication practice in low-pressure speaking turns.',
                support: 'Suggested Tiny Steps support: school communication and presentation practice',
                href: '/online-english-classes-for-kids-india',
                anchor: 'online English classes for kids in India',
              },
              {
                pill: 'Reading aloud expression',
                problem: 'Child reads aloud without expression',
                meaning: 'Voice variation and expressive reading may need direct support.',
                support: 'Suggested Tiny Steps support: reading aloud expression and voice practice',
                href: '/reading-classes-for-kids',
                anchor: 'reading classes for kids',
              },
              {
                pill: 'Clear expression and vocabulary',
                problem: 'Child speaks but lacks clarity',
                meaning: 'Sentence structure, vocabulary precision, and clear delivery may need reinforcement.',
                support: 'Suggested Tiny Steps support: clear expression, vocabulary, and sentence structure',
                href: '/grammar',
                anchor: 'grammar and sentence formation support',
              },
            ].map((item) => (
              <article
                key={item.problem}
                className={`rounded-2xl border p-5 shadow-[0_10px_28px_rgba(15,23,42,0.05)] transition hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)] md:min-h-[190px] md:rounded-3xl md:p-6 ${
                  item.pill === 'Sentence expansion and answer building'
                    ? 'bg-[#F3FAFF] border-[#D7ECFA]'
                    : item.pill === 'Speaking comfort and confidence'
                      ? 'bg-[#FFF8F0] border-[#F6D9B9]'
                      : item.pill === 'Storytelling and sequencing'
                        ? 'bg-[#F3FFF6] border-[#CFEFD7]'
                        : item.pill === 'Show-and-tell and presentation practice'
                          ? 'bg-[#F7F5FF] border-[#E2DBFF]'
                          : 'bg-[#FFFBEA] border-[#F4E2A0]'
                }`}
              >
                <span className="mb-3 inline-flex rounded-full border border-white/70 bg-white/70 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.10em] text-slate-700 md:mb-4 md:text-[11px] md:tracking-[0.12em]">
                  {item.pill}
                </span>
                <h3 className="text-lg font-bold leading-snug text-slate-950 md:text-xl">{item.problem}</h3>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">What it may mean</p>
                <p className="mt-1 text-[15px] leading-6 text-slate-700 md:text-base">{item.meaning}</p>
                <p className="mt-3 text-sm font-semibold text-slate-900">{item.support}</p>
                <Link to={item.href} className="mt-2 inline-block text-sm font-semibold text-slate-900 underline underline-offset-2">
                  {item.anchor}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-8 sm:px-5 md:pb-12 lg:px-6">
        <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:rounded-3xl md:p-7">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Online public speaking classes for kids across India</h2>
          <p className="mt-3 text-base leading-7 text-slate-700">
            Tiny Steps supports children across India through live online public speaking and communication confidence classes. Parents from Hyderabad, Bangalore, Chennai, Mumbai, Delhi, Pune, Kolkata, and other locations can <Link to="/book-demo" className="font-semibold text-slate-900 underline underline-offset-2">book a free assessment</Link> and receive a level-based speaking confidence path.
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            For younger learners building early reading base, you can also review <Link to="/phonics" className="font-semibold text-slate-900 underline underline-offset-2">online phonics classes for kids</Link>.
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
                <Link to={card.href} className="mt-4 inline-block text-sm font-semibold text-slate-900 underline underline-offset-2">
                  {card.anchor}
                </Link>
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

      <section className="bg-[#fffaf3] px-4 py-8 sm:px-5 md:py-12 lg:px-6 lg:py-14">
        <div className="mx-auto max-w-6xl rounded-2xl border border-[#F1D8A8] bg-white/95 p-5 shadow-sm md:rounded-3xl md:p-7">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Speaking questions parents ask</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {faqItems.map((item) => (
              <article key={item.question} className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="text-base font-semibold text-slate-900">{item.question}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">{item.answer}</p>
              </article>
            ))}
          </div>
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
            Review <Link to="/pricing" className="font-semibold underline underline-offset-2">class pricing</Link> and <Link to="/book-demo" className="font-semibold underline underline-offset-2">book a free assessment</Link> when you are ready.
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
          <h2 className="mb-5 text-2xl font-bold text-slate-900 sm:text-3xl">Age-wise speaking outcomes</h2>
          <div className="grid gap-4 md:gap-5 md:grid-cols-3">
            <article className="flex h-full flex-col rounded-2xl border border-amber-100 bg-gradient-to-br from-white to-amber-50/70 p-5 shadow-sm md:rounded-3xl md:p-6">
              <span className="inline-flex w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-800">Ages 5-7</span>
              <p className="mt-3 text-sm text-slate-700">
                Simple sentence expansion, picture talk, show-and-tell, basic question answers, and speaking comfort with teacher.
              </p>
              <Link to="/book-demo" className="mt-4 inline-block text-sm font-semibold underline underline-offset-2">
                Start with confidence building
              </Link>
            </article>

            <article className="flex h-full flex-col rounded-2xl border border-sky-100 bg-gradient-to-br from-white to-sky-50/70 p-5 shadow-sm md:rounded-3xl md:p-6">
              <span className="inline-flex w-fit rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-800">Ages 8-10</span>
              <p className="mt-3 text-sm text-slate-700">
                Structured answers, storytelling, opinion sharing, reading aloud confidence, vocabulary, and classroom communication.
              </p>
              <Link to="/book-demo" className="mt-4 inline-block text-sm font-semibold underline underline-offset-2">
                Build speaking confidence
              </Link>
            </article>

            <article className="flex h-full flex-col rounded-2xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/70 p-5 shadow-sm md:rounded-3xl md:p-6">
              <span className="inline-flex w-fit rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-800">Ages 11-12</span>
              <p className="mt-3 text-sm text-slate-700">
                Children need stronger presentation skills, organised thinking, discussion confidence, expressive speaking, and the ability to explain ideas clearly.
              </p>
              <Link to="/book-demo" className="mt-4 inline-block text-sm font-semibold underline underline-offset-2">
                Book a free assessment
              </Link>
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
                During the assessment, we may check how your child answers questions, forms sentences, explains ideas, tells a short story, reads aloud, responds to prompts, and speaks with confidence. Based on this, Tiny Steps recommends the right confidence-building path.
              </p>
              <Link
                to="/book-demo"
                className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-slate-900 px-6 py-3.5 text-base font-semibold text-white shadow-[0_12px_30px_rgba(15,23,42,0.25)] transition hover:bg-slate-800 sm:w-auto sm:px-7 sm:py-3"
              >
                Book Free Assessment
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
            Book a free assessment and let Tiny Steps identify whether your child needs sentence expansion, structured answers, storytelling, reading aloud confidence, presentation skills, or communication confidence support first.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/book-demo"
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-white px-8 py-3 font-semibold text-slate-900 transition hover:bg-slate-100 sm:w-auto"
            >
              Book Free Assessment
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-slate-200">
            <Link to="/reading-classes-for-kids" className="font-semibold underline underline-offset-2 hover:text-white">reading classes for kids</Link>
            <span className="hidden sm:inline text-slate-400">•</span>
            <Link to="/grammar" className="font-semibold underline underline-offset-2 hover:text-white">grammar and sentence formation support</Link>
            <span className="hidden sm:inline text-slate-400">•</span>
            <Link to="/pricing" className="font-semibold underline underline-offset-2 hover:text-white">class pricing</Link>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-slate-300">
            <Link to="/online-english-classes-for-kids-india" className="underline underline-offset-2 hover:text-white">online English classes for kids in India</Link>
            <span className="hidden sm:inline text-slate-500">•</span>
            <Link to="/phonics" className="underline underline-offset-2 hover:text-white">online phonics classes for kids</Link>
            <span className="hidden sm:inline text-slate-500">•</span>
            <Link to="/class-samples" className="underline underline-offset-2 hover:text-white">real class samples</Link>
          </div>
        </div>
      </section>

      <ClusterSeoNav cluster="speaking" />
    </div>
  );
}
