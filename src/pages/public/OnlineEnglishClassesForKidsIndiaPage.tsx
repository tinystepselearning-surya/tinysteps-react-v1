import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import { createFAQPageSchema, PUBLIC_FACTS } from '../../lib/schemas';

const faqItems = [
  {
    question: 'How do I know which English class my child needs first?',
    answer:
      'Start with an assessment-first check. Some children need phonics foundation, while others need reading fluency, grammar clarity, sentence formation, or communication confidence. The right first class depends on the child’s current gap, not age alone.',
  },
  {
    question: 'Are online English classes useful for young children?',
    answer:
      'Yes, when classes are age-appropriate and structured. Young children benefit from guided listening, phonics foundation, blending, simple reading, and early sentence responses with live teacher support.',
  },
  {
    question: 'Can these classes help if my child reads but does not understand?',
    answer:
      'Yes. Word reading and story understanding are different skills. Children may need reading fluency, vocabulary, comprehension checks, and guided answer practice to improve understanding.',
  },
  {
    question: 'Can grammar and sentence formation improve school answers?',
    answer:
      'Yes. When children apply grammar in sentence formation and answer writing, school responses become clearer, longer, and more accurate over time.',
  },
  {
    question: 'How does Tiny Steps show progress to parents?',
    answer:
      'Parents receive practical progress visibility: what the child practised, strengths, current gaps, and next-step guidance across phonics, reading fluency, grammar clarity, sentence formation, and communication confidence.',
  },
];

const pathwayCourses = [
  {
    name: 'Phonics foundation',
    description: 'Letter sounds, blending, CVC words, digraphs, long vowels, and early reading confidence.',
    url: `${PUBLIC_FACTS.primaryWebsite}/phonics`,
    linkPath: '/phonics',
    anchor: 'online phonics classes for kids',
  },
  {
    name: 'Reading fluency',
    description: 'Word reading, sentence reading, reading aloud, comprehension, and story understanding.',
    url: `${PUBLIC_FACTS.primaryWebsite}/reading-classes-for-kids`,
    linkPath: '/reading-classes-for-kids',
    anchor: 'reading classes for kids',
  },
  {
    name: 'Grammar clarity',
    description: 'Parts of speech, tenses, articles, prepositions, sentence correction, and grammar usage.',
    url: `${PUBLIC_FACTS.primaryWebsite}/grammar`,
    linkPath: '/grammar',
    anchor: 'grammar classes for kids',
  },
  {
    name: 'Sentence formation',
    description: 'Longer answers, structured thinking, and clear expression in writing and speaking tasks.',
    url: `${PUBLIC_FACTS.primaryWebsite}/grammar`,
    linkPath: '/grammar',
    anchor: 'grammar classes for kids',
  },
  {
    name: 'Communication confidence and public speaking readiness',
    description: 'School speaking practice, story sharing, organised thoughts, and confident public speaking responses.',
    url: `${PUBLIC_FACTS.primaryWebsite}/speaking`,
    linkPath: '/speaking',
    anchor: 'public speaking and communication classes',
  },
];

const heroPyramidLevels = [
  { id: 'top', title: 'Communication confidence' },
  { id: 'upper', title: 'Sentence formation' },
  { id: 'middle', title: 'Grammar clarity' },
  { id: 'lower', title: 'Reading fluency' },
  { id: 'base', title: 'Phonics foundation' },
];

export default function OnlineEnglishClassesForKidsIndiaPage() {
  const canonicalPath = '/online-english-classes-for-kids-india';
  const canonicalUrl = `${PUBLIC_FACTS.primaryWebsite}${canonicalPath}`;

  useEffect(() => {
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
        { '@type': 'ListItem', position: 2, name: 'Courses', item: 'https://tinystepslearning.com/courses' },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Online English Classes for Kids in India',
          item: canonicalUrl,
        },
      ],
    };

    const pathwayItemListSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Tiny Steps learning pathway',
      url: canonicalUrl,
      numberOfItems: pathwayCourses.length,
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      itemListElement: pathwayCourses.map((course, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: course.url,
        item: {
          '@type': 'Course',
          name: course.name,
          description: course.description,
          areaServed: 'India',
          provider: {
            '@type': 'Organization',
            '@id': 'https://tinystepslearning.com/#organization',
            name: 'Tiny Steps Learning',
            url: 'https://tinystepslearning.com',
          },
        },
      })),
    };

    const faqSchema = {
      ...createFAQPageSchema(faqItems),
      '@id': `${canonicalUrl}#faq`,
    };

    applySeo({
      title: 'Online English Classes for Kids in India | Tiny Steps',
      description:
        'Live online English classes for kids in India. Build phonics, reading fluency, grammar, sentence formation and communication confidence. Book a free assessment.',
      canonicalPath,
      robots: 'index,follow',
      ogType: 'website',
      jsonLd: [breadcrumbSchema, pathwayItemListSchema, faqSchema],
    });
  }, [canonicalPath, canonicalUrl]);

  return (
    <div className="bg-gradient-to-b from-[#FFF8EF] via-white to-[#EEF8FF] pb-16">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#FFF8EF] via-white to-[#EEF8FF] px-4 py-8 sm:px-5 md:py-12 lg:px-8 lg:py-14">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
                <p className="inline-flex items-center rounded-full border border-orange-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-700">
                  Assessment-first online English classes
                </p>
                <h1 className="mt-4 max-w-full text-[34px] font-bold leading-[1.05] tracking-[-0.035em] text-slate-900 sm:text-[38px] md:max-w-[680px] md:text-[46px] lg:text-[52px]">Online English Classes for Kids in India</h1>
                <p className="mt-4 max-w-full text-base leading-7 text-slate-700 md:mt-5 md:max-w-[660px] md:text-lg md:leading-8">
                  Help your child build phonics, reading, grammar, sentence formation, and communication confidence through live online guidance.
                </p>
                <p className="mt-3 max-w-full text-base leading-7 text-slate-700 md:mt-4 md:max-w-[660px] md:text-lg md:leading-8">
                  Tiny Steps uses an assessment-first learning path to identify your child&apos;s current gap and recommend the right level instead of placing every child into the same class. Ready to move forward? <Link to="/book-demo" className="font-semibold text-slate-900 underline underline-offset-2 hover:text-sky-700">book a free assessment</Link>.
                </p>
                <div className="mt-7">
                  <Link
                    to="/book-demo"
                    className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-slate-900 px-6 py-3.5 text-base font-bold text-white shadow-[0_10px_24px_rgba(15,23,42,0.2)] transition hover:bg-slate-800 sm:w-auto sm:min-w-[230px] md:px-8 md:py-4"
                  >
                    Book Free Assessment
                  </Link>
                  <p className="mt-3 text-sm text-slate-600 md:text-[15px]">Takes 20-30 seconds • No commitment</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {['Free assessment', 'Assessment-first path', 'Parent progress visibility'].map((chip) => (
                    <span key={chip} className="rounded-full border border-slate-200 bg-white/85 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm sm:text-sm sm:px-3.5">
                      {chip}
                    </span>
                  ))}
                </div>
          </div>

          <aside className="mt-7 w-full overflow-hidden rounded-[24px] border border-slate-200/70 bg-white/95 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.07)] sm:mt-8 sm:p-5 md:rounded-[28px] md:p-6 md:shadow-[0_18px_45px_rgba(15,23,42,0.08)] lg:ml-auto lg:mt-0 lg:max-w-[560px] lg:p-7">
            <div className="w-full">
                  <p className="mb-4 text-left text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 sm:text-[11px] md:mb-5 md:text-xs md:tracking-[0.22em]">LEARNING PATH PREVIEW</p>
                  <div className="mx-auto flex w-full max-w-full flex-col items-center md:max-w-[450px]">
                    {heroPyramidLevels.map((level, index) => {
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
                      const backgroundStyle =
                        index === 0
                          ? '#FF6B35'
                          : index === 1
                            ? '#FFB562'
                            : index === 2
                              ? '#90E0EF'
                              : index === 3
                                ? '#00B4D8'
                                : '#0077B6';
                      const titleColor = index === 0 || index === 3 || index === 4 ? '#FFFFFF' : '#0A192F';
                      return (
                        <div key={level.id} className={`${index === 0 ? '' : '-mt-[1px]'} ${widthClass} mx-auto`}>
                          <div
                            className="flex h-[38px] items-center justify-center border border-white/80 px-2 text-center font-bold tracking-normal leading-tight shadow-[0_6px_14px_rgba(15,23,42,0.055)] sm:h-[40px] sm:px-3 md:h-[48px] md:px-4 lg:h-[50px]"
                            style={{
                              clipPath: 'polygon(8% 0%, 92% 0%, 100% 100%, 0% 100%)',
                              background: backgroundStyle,
                            }}
                          >
                            <span className="text-[12px] font-bold leading-tight sm:text-[13px] md:text-[15px] lg:text-[16px]" style={{ color: titleColor }}>
                              {level.title}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mx-auto mt-4 w-full max-w-full rounded-2xl border border-[#E9C68D] bg-gradient-to-br from-[#FFF8EC] to-[#FFF2DA] px-4 py-3.5 text-center shadow-[0_8px_22px_rgba(122,74,16,0.07)] md:mt-5 md:max-w-[450px] md:rounded-[22px] md:px-5 md:py-4">
                    <span className="block text-[16px] font-extrabold leading-snug text-[#6B3A0E] md:text-[19px]">We identify the child&apos;s gap first.</span>
                    <span className="mt-1 block text-[14px] font-medium leading-snug text-[#7A4A10] md:mt-1.5 md:text-[16px]">Then we suggest the right learning path.</span>
                  </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="bg-[#fffaf3] px-4 pb-8 pt-8 sm:px-5 md:pb-12 md:pt-10 lg:px-6 lg:pb-14">
        <div className="mx-auto max-w-6xl">
          <article className="max-w-6xl rounded-2xl border border-[#F1D8A8] bg-white/95 p-5 shadow-sm md:rounded-3xl md:p-7">
            <p className="inline-flex rounded-full bg-[#FFF2C7] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7A4A10] md:text-[11px] md:tracking-[0.18em]">
              Parent clarity
            </p>
            <h2 className="mb-3 mt-3 text-2xl font-bold leading-tight text-slate-900 md:text-[30px]">Quick Answer: What do online English classes for kids include?</h2>
            <p className="max-w-[920px] text-base leading-7 text-slate-700 md:text-[17px]">
              Online English classes for kids should help children build phonics, reading fluency, grammar clarity, sentence formation, and communication confidence. Tiny Steps begins with a free assessment, identifies the child&apos;s current gap, and recommends the right learning path instead of placing every child into the same class. This keeps support personalized, level-based, and practical for parents.
            </p>
          </article>
        </div>
      </section>

      <section className="px-4 pb-8 pt-8 sm:px-5 md:pb-12 md:pt-12 lg:px-6 lg:pb-14 lg:pt-14">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-6 text-2xl font-bold text-slate-900 sm:text-3xl">Choose the right starting point</h2>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {[
              {
                pill: 'Phonics foundation',
                problem: 'Child knows letters but cannot read words',
                meaning: 'Letter recognition is present, but blending sounds into words is still unstable.',
                path: 'Suggested Tiny Steps path: phonics foundation',
                href: '/phonics',
                anchor: 'online phonics classes for kids',
              },
              {
                pill: 'Reading fluency',
                problem: 'Child reads slowly or guesses words',
                meaning: 'Decoding may be inconsistent and fluency may need guided practice.',
                path: 'Suggested Tiny Steps path: reading fluency',
                href: '/reading-classes-for-kids',
                anchor: 'reading classes for kids',
              },
              {
                pill: 'Comprehension and vocabulary',
                problem: 'Child reads words but does not understand stories',
                meaning: 'Word reading is present, but story understanding and vocabulary depth need support.',
                path: 'Suggested Tiny Steps path: comprehension and vocabulary support',
                href: '/reading-classes-for-kids',
                anchor: 'reading classes for kids',
              },
              {
                pill: 'Grammar clarity',
                problem: 'Child makes grammar mistakes',
                meaning: 'Rules may be known, but application in answers and writing may be weak.',
                path: 'Suggested Tiny Steps path: grammar clarity',
                href: '/grammar',
                anchor: 'grammar classes for kids',
              },
              {
                pill: 'Sentence formation',
                problem: 'Child writes or says very short answers',
                meaning: 'Sentence building and structured responses may need direct practice.',
                path: 'Suggested Tiny Steps path: sentence formation',
                href: '/grammar',
                anchor: 'grammar classes for kids',
              },
              {
                pill: 'Communication confidence',
                problem: 'Child hesitates while speaking',
                meaning: 'The child may need safe guided speaking turns and clear expression routines.',
                path: 'Suggested Tiny Steps path: communication confidence',
                href: '/speaking',
                anchor: 'public speaking and communication classes',
              },
            ].map((item) => (
              <article
                key={item.problem}
                className={`rounded-2xl border p-5 shadow-[0_10px_28px_rgba(15,23,42,0.05)] transition hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)] md:min-h-[190px] md:rounded-3xl md:p-6 ${
                  item.pill === 'Phonics foundation'
                    ? 'bg-[#F3FAFF] border-[#D7ECFA]'
                    : item.pill === 'Reading fluency'
                      ? 'bg-[#FFF8F0] border-[#F6D9B9]'
                      : item.pill === 'Comprehension and vocabulary'
                        ? 'bg-[#F3FFF6] border-[#CFEFD7]'
                        : item.pill === 'Grammar clarity'
                          ? 'bg-[#F7F5FF] border-[#E2DBFF]'
                          : 'bg-[#FFFBEA] border-[#F4E2A0]'
                }`}
              >
                <span className="mb-3 inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.10em] bg-white/70 border border-white/70 text-slate-700 md:mb-4 md:text-[11px] md:tracking-[0.12em]">
                  {item.pill}
                </span>
                <h3 className="text-lg md:text-xl font-bold leading-snug text-slate-950">{item.problem}</h3>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">What it may mean</p>
                <p className="mt-1 text-[15px] text-slate-700 leading-6 md:text-base">{item.meaning}</p>
                <p className="mt-3 text-sm font-semibold text-slate-900">{item.path}</p>
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
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Online English classes for kids across India</h2>
          <p className="mt-3 text-base leading-7 text-slate-700">
            Tiny Steps supports children across India through live online classes. Parents from Hyderabad, Bangalore, Chennai, Mumbai, Delhi, Pune, Kolkata, and other locations can <Link to="/book-demo" className="font-semibold text-slate-900 underline underline-offset-2">book a free assessment</Link> and receive a level-based English learning path.
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            If your child needs a stronger reading start, compare our <Link to="/best-online-phonics-classes-for-kids-in-india" className="font-semibold text-slate-900 underline underline-offset-2">best online phonics classes for kids in India</Link> guide before choosing the pathway.
          </p>
        </div>
      </section>

      <section className="bg-[#eff7ff] px-4 py-8 sm:px-5 md:py-12 lg:px-6 lg:py-14">
        <div className="mx-auto max-w-6xl rounded-2xl border border-sky-100 bg-gradient-to-br from-[#F5FBFF] via-white to-[#FFF8EF] p-5 shadow-sm md:rounded-3xl md:p-8">
          <h2 className="mb-4 text-2xl font-bold text-slate-900 sm:text-3xl">Tiny Steps learning pathway</h2>
          <div className="flex flex-wrap gap-2">
            {['1 Phonics', '2 Reading', '3 Grammar', '4 Sentences', '5 Communication'].map((step) => (
              <span key={step} className="rounded-full border border-sky-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800">
                {step}
              </span>
            ))}
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-700 md:text-base md:leading-7">
            Phonics foundation -&gt; Reading fluency -&gt; Grammar clarity -&gt; Sentence formation -&gt; Communication confidence
          </p>
          <p className="mt-3 text-slate-700">
            Children do not all start at the same point. A 5-year-old may need phonics and blending support, while an 8-year-old may need reading comprehension and grammar transfer. An older child may need clearer sentence formation, structured answers, and confident communication.
          </p>
          <p className="mt-3 text-slate-700">
            Tiny Steps uses assessment-first placement to decide the right starting point and then helps the child move forward step by step.
          </p>
          <div className="mt-6 grid gap-4 md:gap-5 md:grid-cols-2">
            {pathwayCourses.map((course) => (
              <article key={course.name} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-sm transition hover:shadow-md md:p-6">
                <h3 className="text-lg font-semibold text-slate-900">{course.name}</h3>
                <p className="mt-2 text-sm md:text-base text-slate-700">{course.description}</p>
                <Link to={course.linkPath} className="mt-4 inline-block text-sm font-semibold text-slate-900 underline underline-offset-2">
                  {course.anchor}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-5 md:py-12 lg:px-6 lg:py-14">
        <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:rounded-[30px] md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Why parents choose Tiny Steps</h2>
          <p className="mt-3 text-slate-700">
            Tiny Steps is designed as a single decision page that guides parents to the right starting point across <Link to="/phonics" className="font-semibold text-slate-900 underline underline-offset-2">online phonics classes for kids</Link>, <Link to="/reading-classes-for-kids" className="font-semibold text-slate-900 underline underline-offset-2">reading classes for kids</Link>, <Link to="/grammar" className="font-semibold text-slate-900 underline underline-offset-2">grammar and sentence formation support</Link>, and <Link to="/speaking" className="font-semibold text-slate-900 underline underline-offset-2">public speaking and communication classes</Link>.
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              'Assessment-first placement',
              'Live teacher correction',
              'Structured learning path',
              '1:1 attention',
              'Parent progress visibility',
              'Age-wise learning outcomes',
              'Phonics + reading + grammar + communication under one path',
            ].map((item) => (
              <li key={item} className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-medium text-slate-800">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-[#fffaf3] px-4 py-8 sm:px-5 md:py-12 lg:px-6 lg:py-14">
        <div className="mx-auto max-w-6xl rounded-2xl border border-[#F1D8A8] bg-white/95 p-5 shadow-sm md:rounded-3xl md:p-7">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Parent questions in simple terms</h2>
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
          <h2 className="mb-4 text-2xl font-bold text-slate-900 sm:text-3xl">What parents should compare before choosing online English classes</h2>
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
                  <td className="border border-slate-200 bg-emerald-50/70 px-4 py-3.5 text-slate-700">A structured skill pathway</td>
                  <td className="border border-slate-200 bg-orange-50/70 px-4 py-3.5 text-slate-700">Random tuition or topic-by-topic lesson hopping</td>
                </tr>
                <tr>
                  <td className="border border-slate-200 bg-emerald-50/70 px-4 py-3.5 text-slate-700">Live teacher correction</td>
                  <td className="border border-slate-200 bg-orange-50/70 px-4 py-3.5 text-slate-700">App-only practice with no immediate feedback</td>
                </tr>
                <tr>
                  <td className="border border-slate-200 bg-emerald-50/70 px-4 py-3.5 text-slate-700">Progress visibility for parents</td>
                  <td className="border border-slate-200 bg-orange-50/70 px-4 py-3.5 text-slate-700">Worksheets only with no clear checkpoint</td>
                </tr>
                <tr>
                  <td className="border border-slate-200 bg-emerald-50/70 px-4 py-3.5 text-slate-700">Personalised guidance</td>
                  <td className="border border-slate-200 bg-orange-50/70 px-4 py-3.5 text-slate-700">Large batches where the child gets fewer speaking turns</td>
                </tr>
                <tr>
                  <td className="border border-slate-200 bg-emerald-50/70 px-4 py-3.5 text-slate-700">Assessment-first placement</td>
                  <td className="border border-slate-200 bg-orange-50/70 px-4 py-3.5 text-slate-700">Same class plan for every child</td>
                </tr>
                <tr>
                  <td className="border border-slate-200 bg-emerald-50/70 px-4 py-3.5 text-slate-700">Reading + grammar + communication support</td>
                  <td className="border border-slate-200 bg-orange-50/70 px-4 py-3.5 text-slate-700">Only conversation practice without foundation building</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 max-w-[900px] text-slate-700">
            The best online English class is not just the one with more activities. It should help parents understand what the child needs next, give the child enough guided practice, and show visible progress over time. Check <Link to="/pricing" className="font-semibold text-slate-900 underline underline-offset-2">class pricing</Link> and <Link to="/book-demo" className="font-semibold text-slate-900 underline underline-offset-2">book a free assessment</Link> when you are ready.
          </p>
        </div>
      </section>

      <section className="bg-[#fff6ec] px-4 py-8 sm:px-5 md:py-12 lg:px-6 lg:py-14">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-5 text-2xl font-bold text-slate-900 sm:text-3xl">Age-wise outcomes</h2>
          <div className="grid gap-4 md:gap-5 md:grid-cols-3">
            <article className="flex h-full flex-col rounded-2xl border border-amber-100 bg-gradient-to-br from-white to-amber-50/70 p-5 shadow-sm md:rounded-3xl md:p-6">
              <span className="inline-flex w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-800">Ages 4-6</span>
              <p className="mt-3 text-sm text-slate-700">
                Phonics foundation, listening, letter sounds, blending, simple words, and early sentence responses.
              </p>
              <Link to="/phonics" className="mt-4 inline-block text-sm font-semibold underline underline-offset-2">
                Explore phonics foundation
              </Link>
            </article>
            <article className="flex h-full flex-col rounded-2xl border border-sky-100 bg-gradient-to-br from-white to-sky-50/70 p-5 shadow-sm md:rounded-3xl md:p-6">
              <span className="inline-flex w-fit rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-800">Ages 7-10</span>
              <p className="mt-3 text-sm text-slate-700">
                Reading fluency, comprehension, grammar clarity, sentence formation, and clearer school answers.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link to="/reading-classes-for-kids" className="text-sm font-semibold underline underline-offset-2">
                  reading classes for kids
                </Link>
                <Link to="/grammar" className="text-sm font-semibold underline underline-offset-2">
                  grammar classes for kids
                </Link>
              </div>
            </article>
            <article className="flex h-full flex-col rounded-2xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/70 p-5 shadow-sm md:rounded-3xl md:p-6">
              <span className="inline-flex w-fit rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-800">Ages 11-12</span>
              <p className="mt-3 text-sm text-slate-700">
                Paragraph-level answers, grammar accuracy, organized thinking, public speaking confidence, and clear expression.
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
          <h2 className="mb-4 text-2xl font-bold text-slate-900 sm:text-3xl">What happens in the free assessment?</h2>
          <div className="grid gap-6 md:gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-base leading-7 text-slate-700">
                The free assessment helps us understand your child&apos;s current level before suggesting a class path.
              </p>
              <p className="mt-3 text-base leading-7 text-slate-700">
                During the assessment, we may check how your child reads words or sentences, understands questions, forms sentences, uses grammar, and responds while speaking. Based on this, Tiny Steps recommends whether the child should begin with phonics, reading, grammar, sentence formation, or communication confidence.
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
                  <span>Understand the child&apos;s current level</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">2</span>
                  <span>Identify the learning gap</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">3</span>
                  <span>Recommend the right course path</span>
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
          <h2 className="mb-4 mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">How parents see progress</h2>
          <p className="text-slate-700">Parents should not have to guess whether the child is improving.</p>
          <p className="mt-3 text-slate-700">
            Tiny Steps focuses on visible progress through class updates, skill-based feedback, strengths, improvement areas, and next-step guidance. Parents can understand what the child is learning, where the child is improving, and what needs more practice.
          </p>
          <ul className="mt-5 grid gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              'What the child practised',
              'What the child did well',
              'Which skills need more support',
              'Suggested next steps',
              'Clear movement across phonics, reading, grammar, and communication goals',
            ].map((item) => (
              <li key={item} className="h-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-700 shadow-sm md:text-base">
                <span className="mr-2 font-semibold text-emerald-600">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-slate-700">
            See <Link to="/parents/tracking-progress" className="font-semibold underline underline-offset-2">how Tiny Steps tracks progress</Link> and compare class fit with the parent guide on{' '}
            <Link to="/parents/choosing-course" className="font-semibold underline underline-offset-2">choosing the right course path</Link>.
          </p>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-5 md:py-12 lg:px-6 lg:py-14">
        <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:rounded-[30px] md:p-8">
          <h2 className="mb-4 text-2xl font-bold text-slate-900 sm:text-3xl">Frequently asked questions</h2>
          <div className="space-y-3 md:space-y-4">
            {faqItems.map((item) => (
              <article key={item.question} className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="faq-question text-[17px] md:text-lg font-semibold text-slate-900">{item.question}</h3>
                <p className="faq-answer mt-2 text-[15px] md:text-base leading-6 text-slate-700">{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-10 pt-6 sm:px-5 md:pb-12 lg:px-6">
        <div className="mx-auto max-w-6xl rounded-3xl bg-gradient-to-r from-slate-900 via-[#1f2a44] to-slate-900 p-6 text-center text-white shadow-[0_20px_50px_rgba(15,23,42,0.18)] sm:p-8 md:p-10">
          <h2 className="text-2xl font-bold md:text-3xl">Not sure where your child should begin?</h2>
          <p className="mx-auto mt-3 max-w-3xl text-base leading-7 text-slate-200">
            Book a free assessment and let Tiny Steps identify whether your child needs phonics, reading, grammar, sentence formation, or communication confidence support first.
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
            <Link to="/pricing" className="font-semibold underline underline-offset-2 hover:text-white">class pricing</Link>
            <span className="hidden sm:inline text-slate-400">•</span>
            <Link to="/class-samples" className="font-semibold underline underline-offset-2 hover:text-white">real class samples for parents</Link>
            <span className="hidden sm:inline text-slate-400">•</span>
            <Link to="/why-tiny-steps" className="font-semibold underline underline-offset-2 hover:text-white">why parents choose Tiny Steps</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
