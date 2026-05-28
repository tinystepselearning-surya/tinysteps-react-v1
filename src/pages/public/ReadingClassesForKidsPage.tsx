import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import ClusterSeoNav from '../../components/programs/ClusterSeoNav';
import { applySeo } from '../../lib/seo';
import { createFAQPageSchema, PUBLIC_FACTS } from '../../lib/schemas';

const faqItems = [
  {
    question: 'What do reading classes for kids include?',
    answer:
      'Reading classes for kids may include phonics support, word reading, sentence reading, reading fluency, comprehension practice, and reading confidence building.',
  },
  {
    question: 'How do I know if my child needs phonics or reading fluency support?',
    answer:
      'A free assessment helps identify whether the child is stuck at phonics and blending, or needs fluency, comprehension, and reading confidence support.',
  },
  {
    question: 'My child reads words but does not understand stories. Can this help?',
    answer:
      'Yes. Children may decode words but still need guided support with comprehension, vocabulary, sequencing, and answering story questions.',
  },
  {
    question: 'Can reading classes improve reading aloud confidence?',
    answer:
      'Yes. Structured reading-aloud practice helps children reduce hesitation, improve expression, and respond with more confidence in school.',
  },
  {
    question: 'Are online reading classes useful for young children?',
    answer:
      'Yes. With level-based guidance, young children can build early reading habits through phonics, word reading, short sentences, and story practice.',
  },
  {
    question: 'What happens after the free assessment?',
    answer:
      'After the assessment, Tiny Steps shares the child’s reading gap, recommends the right reading path, and explains next steps to parents.',
  },
];

const readingPathwayCards = [
  {
    name: 'Phonics foundation',
    description: 'Letter sounds, blending, and decoding basics for stronger reading readiness.',
    href: '/phonics',
    anchor: 'online phonics classes for kids in India',
    url: `${PUBLIC_FACTS.primaryWebsite}/phonics`,
  },
  {
    name: 'Word and sentence reading',
    description: 'Move from isolated words to smoother sentence reading with confidence.',
    href: '/reading-classes-for-kids',
    anchor: 'reading classes for kids',
    url: `${PUBLIC_FACTS.primaryWebsite}/reading-classes-for-kids`,
  },
  {
    name: 'Grammar and sentence clarity',
    description: 'Support reading understanding through stronger sentence structure and grammar awareness.',
    href: '/grammar',
    anchor: 'grammar classes for kids',
    url: `${PUBLIC_FACTS.primaryWebsite}/grammar`,
  },
  {
    name: 'Reading confidence and expression',
    description: 'Build confident reading aloud, expression, and communication clarity.',
    href: '/speaking',
    anchor: 'communication and public speaking classes for kids',
    url: `${PUBLIC_FACTS.primaryWebsite}/speaking`,
  },
];

const readingPyramidLevels = [
  'Confident story understanding',
  'Reading fluency',
  'Sentence reading',
  'Word reading',
  'Phonics foundation',
];

export default function ReadingClassesForKidsPage() {
  const canonicalPath = '/reading-classes-for-kids';
  const canonicalUrl = `${PUBLIC_FACTS.primaryWebsite}${canonicalPath}`;

  useEffect(() => {
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
        { '@type': 'ListItem', position: 2, name: 'Courses', item: 'https://tinystepslearning.com/courses' },
        { '@type': 'ListItem', position: 3, name: 'Reading Classes for Kids', item: canonicalUrl },
      ],
    };

    const pathwayItemListSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Tiny Steps reading pathway',
      url: canonicalUrl,
      numberOfItems: readingPathwayCards.length,
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      itemListElement: readingPathwayCards.map((card, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: card.url,
      })),
    };

    const faqSchema = {
      ...createFAQPageSchema(faqItems),
      '@id': `${canonicalUrl}#faq`,
    };

    applySeo({
      title: 'Reading Classes for Kids in India | Tiny Steps Learning',
      description:
        'Book a free assessment for online reading classes for kids. Tiny Steps helps children improve phonics, reading fluency, comprehension, and confidence.',
      canonicalPath,
      robots: 'index,follow',
      ogType: 'website',
      jsonLd: [breadcrumbSchema, pathwayItemListSchema, faqSchema],
    });
  }, [canonicalPath, canonicalUrl]);

  return (
    <div className="bg-gradient-to-b from-[#FFF8EF] via-white to-[#EEF8FF] pb-16">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#FFF8EF] via-white to-[#EEF8FF] px-4 py-8 sm:px-5 md:py-12 lg:px-8 lg:py-14">
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
              <li className="font-medium text-slate-900">Reading Classes for Kids</li>
            </ol>
          </nav>

          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="inline-flex items-center rounded-full border border-orange-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-700">
                Reading confidence for children
              </p>
              <h1 className="mt-4 max-w-full text-[34px] font-bold leading-[1.05] tracking-[-0.035em] text-slate-900 sm:text-[38px] md:max-w-[680px] md:text-[46px] lg:text-[52px]">
                Reading Classes for Kids in India
              </h1>
              <p className="mt-4 max-w-full text-base leading-7 text-slate-700 md:mt-5 md:max-w-[660px] md:text-lg md:leading-8">
                Help your child move from word reading to fluent reading, story understanding, comprehension, and confident reading aloud through structured live online reading classes.
              </p>
              <p className="mt-3 max-w-full text-base leading-7 text-slate-700 md:mt-4 md:max-w-[660px] md:text-lg md:leading-8">
                Tiny Steps begins with a free assessment to understand whether your child needs phonics support, reading fluency practice, comprehension help, or confidence while reading aloud.
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
                {['Reading fluency', 'Story understanding', 'Parent progress visibility'].map((chip) => (
                  <span key={chip} className="rounded-full border border-slate-200 bg-white/85 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm sm:text-sm sm:px-3.5">
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            <aside className="mt-7 w-full overflow-hidden rounded-[24px] border border-slate-200/70 bg-white/95 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.07)] sm:mt-8 sm:p-5 md:rounded-[28px] md:p-6 md:shadow-[0_18px_45px_rgba(15,23,42,0.08)] lg:ml-auto lg:mt-0 lg:max-w-[560px] lg:p-7">
              <p className="mb-4 text-left text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 sm:text-[11px] md:mb-5 md:text-xs md:tracking-[0.22em]">
                READING JOURNEY PREVIEW
              </p>

              <div className="mx-auto flex w-full max-w-full flex-col items-center md:max-w-[450px]">
                {readingPyramidLevels.map((title, index) => {
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

              <div className="mx-auto mt-4 w-full max-w-full rounded-2xl border border-[#E9C68D] bg-gradient-to-br from-[#FFF8EC] to-[#FFF2DA] px-4 py-3.5 text-center shadow-[0_8px_22px_rgba(122,74,16,0.07)] md:mt-5 md:max-w-[450px] md:rounded-[22px] md:px-5 md:py-4">
                <span className="block text-[16px] font-extrabold leading-snug text-[#6B3A0E] md:text-[19px]">We identify the child&apos;s reading gap first.</span>
                <span className="mt-1 block text-[14px] font-medium leading-snug text-[#7A4A10] md:mt-1.5 md:text-[16px]">Then we suggest the right reading path.</span>
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
            <h2 className="mb-3 mt-3 text-2xl font-bold leading-tight text-slate-900 md:text-[30px]">Quick Answer for Parents</h2>
            <p className="max-w-[920px] text-base leading-7 text-slate-700 md:text-[17px]">
              Looking for reading classes for your child? Start by checking what is blocking reading progress.
            </p>
            <p className="mt-3 max-w-[920px] text-base leading-7 text-slate-700 md:text-[17px]">
              Some children can identify letters but cannot blend words. Some can read words but pause too much. Some read sentences but do not understand the story. Others can read silently but hesitate when asked to read aloud.
            </p>
            <p className="mt-3 max-w-[920px] text-base leading-7 text-slate-700 md:text-[17px]">
              Tiny Steps begins with a free assessment and then recommends the right reading path across phonics foundation, word reading, sentence reading, fluency, comprehension, and reading confidence.
            </p>
          </article>
        </div>
      </section>

      <section className="px-4 pb-8 pt-8 sm:px-5 md:pb-12 md:pt-12 lg:px-6 lg:pb-14 lg:pt-14">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-6 text-2xl font-bold text-slate-900 sm:text-3xl">Which child needs reading support?</h2>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {[
              {
                pill: 'Letter-to-word gap',
                title: 'Child knows letters but cannot read words',
                body: 'Best for children who recognise letters and sounds but struggle to blend sounds into words.',
              },
              {
                pill: 'Slow reading',
                title: 'Child reads word by word very slowly',
                body: 'Best for children who can read some words but need smoother reading fluency and more confidence.',
              },
              {
                pill: 'Story understanding',
                title: 'Child reads but does not understand stories',
                body: 'Best for children who decode words but need help with meaning, vocabulary, sequencing, and answering questions.',
              },
              {
                pill: 'Reading aloud hesitation',
                title: 'Child avoids reading aloud',
                body: 'Best for children who feel shy, pause often, or lack confidence while reading in front of others.',
              },
              {
                pill: 'School reading confidence',
                title: 'Child needs better reading for school',
                body: 'Best for children who need stronger reading stamina, comprehension, and clear oral reading for classroom tasks.',
              },
            ].map((item) => (
              <article
                key={item.title}
                className={`rounded-2xl border p-5 shadow-[0_10px_28px_rgba(15,23,42,0.05)] transition hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)] md:min-h-[190px] md:rounded-3xl md:p-6 ${
                  item.pill === 'Letter-to-word gap'
                    ? 'bg-[#F3FAFF] border-[#D7ECFA]'
                    : item.pill === 'Slow reading'
                      ? 'bg-[#FFF8F0] border-[#F6D9B9]'
                      : item.pill === 'Story understanding'
                        ? 'bg-[#F3FFF6] border-[#CFEFD7]'
                        : item.pill === 'Reading aloud hesitation'
                          ? 'bg-[#F7F5FF] border-[#E2DBFF]'
                          : 'bg-[#FFFBEA] border-[#F4E2A0]'
                }`}
              >
                <span className="mb-3 inline-flex rounded-full border border-white/70 bg-white/70 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.10em] text-slate-700 md:mb-4 md:text-[11px] md:tracking-[0.12em]">
                  {item.pill}
                </span>
                <h3 className="text-lg font-bold leading-snug text-slate-950 md:text-xl">{item.title}</h3>
                <p className="mt-2.5 text-[15px] leading-6 text-slate-700 md:mt-3 md:text-base">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#eff7ff] px-4 py-8 sm:px-5 md:py-12 lg:px-6 lg:py-14">
        <div className="mx-auto max-w-6xl rounded-2xl border border-sky-100 bg-gradient-to-br from-[#F5FBFF] via-white to-[#FFF8EF] p-5 shadow-sm md:rounded-3xl md:p-8">
          <h2 className="mb-4 text-2xl font-bold text-slate-900 sm:text-3xl">Tiny Steps reading pathway</h2>

          <div className="flex flex-wrap gap-2">
            {['1 Phonics', '2 Words', '3 Sentences', '4 Fluency', '5 Comprehension', '6 Confidence'].map((step) => (
              <span key={step} className="rounded-full border border-sky-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800">
                {step}
              </span>
            ))}
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-700 md:text-base md:leading-7">
            Phonics foundation -&gt; Word reading -&gt; Sentence reading -&gt; Reading fluency -&gt; Story comprehension -&gt; Confident reading aloud
          </p>
          <p className="mt-3 text-slate-700">
            Children do not all struggle at the same reading stage. A young child may need phonics and blending support, while an older child may need fluency, comprehension, vocabulary, or reading-aloud confidence.
          </p>
          <p className="mt-3 text-slate-700">
            Tiny Steps uses assessment-first placement to find the correct reading gap and then helps the child move forward step by step.
          </p>

          <div className="mt-6 grid gap-4 md:gap-5 md:grid-cols-2">
            {readingPathwayCards.map((card) => (
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
          <h2 className="mb-4 text-2xl font-bold text-slate-900 sm:text-3xl">What parents should compare before choosing reading classes</h2>

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
                  <td className="border border-slate-200 bg-emerald-50/70 px-4 py-3.5 text-slate-700">Assessment-first reading path</td>
                  <td className="border border-slate-200 bg-orange-50/70 px-4 py-3.5 text-slate-700">Same reading plan for every child</td>
                </tr>
                <tr>
                  <td className="border border-slate-200 bg-emerald-50/70 px-4 py-3.5 text-slate-700">Phonics + fluency + comprehension</td>
                  <td className="border border-slate-200 bg-orange-50/70 px-4 py-3.5 text-slate-700">Only asking the child to read more</td>
                </tr>
                <tr>
                  <td className="border border-slate-200 bg-emerald-50/70 px-4 py-3.5 text-slate-700">Live teacher correction</td>
                  <td className="border border-slate-200 bg-orange-50/70 px-4 py-3.5 text-slate-700">App-only reading practice</td>
                </tr>
                <tr>
                  <td className="border border-slate-200 bg-emerald-50/70 px-4 py-3.5 text-slate-700">Story understanding checks</td>
                  <td className="border border-slate-200 bg-orange-50/70 px-4 py-3.5 text-slate-700">Word reading without comprehension</td>
                </tr>
                <tr>
                  <td className="border border-slate-200 bg-emerald-50/70 px-4 py-3.5 text-slate-700">Reading aloud practice</td>
                  <td className="border border-slate-200 bg-orange-50/70 px-4 py-3.5 text-slate-700">Silent reading only</td>
                </tr>
                <tr>
                  <td className="border border-slate-200 bg-emerald-50/70 px-4 py-3.5 text-slate-700">Parent progress visibility</td>
                  <td className="border border-slate-200 bg-orange-50/70 px-4 py-3.5 text-slate-700">No clear reading progress updates</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-4 max-w-[900px] text-slate-700">
            The best reading class should not only make a child read more. It should identify the exact reading gap, give guided practice, correct mistakes live, and help parents see progress clearly.
          </p>
        </div>
      </section>

      <section className="bg-[#fff6ec] px-4 py-8 sm:px-5 md:py-12 lg:px-6 lg:py-14">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-5 text-2xl font-bold text-slate-900 sm:text-3xl">Age-wise reading outcomes</h2>
          <div className="grid gap-4 md:gap-5 md:grid-cols-3">
            <article className="flex h-full flex-col rounded-2xl border border-amber-100 bg-gradient-to-br from-white to-amber-50/70 p-5 shadow-sm md:rounded-3xl md:p-6">
              <span className="inline-flex w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-800">Ages 4-6</span>
              <p className="mt-3 text-sm text-slate-700">
                Children usually need letter sounds, blending, CVC words, short vowel reading, and early confidence with simple words and sentences.
              </p>
              <Link to="/phonics" className="mt-4 inline-block text-sm font-semibold underline underline-offset-2">
                Explore phonics foundation
              </Link>
            </article>

            <article className="flex h-full flex-col rounded-2xl border border-sky-100 bg-gradient-to-br from-white to-sky-50/70 p-5 shadow-sm md:rounded-3xl md:p-6">
              <span className="inline-flex w-fit rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-800">Ages 7-10</span>
              <p className="mt-3 text-sm text-slate-700">
                Children often need smoother word reading, sentence reading, reading fluency, story comprehension, vocabulary, and confidence while reading aloud.
              </p>
              <Link to="/reading-classes-for-kids" className="mt-4 inline-block text-sm font-semibold underline underline-offset-2">
                Build reading fluency
              </Link>
            </article>

            <article className="flex h-full flex-col rounded-2xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/70 p-5 shadow-sm md:rounded-3xl md:p-6">
              <span className="inline-flex w-fit rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-800">Ages 11-12</span>
              <p className="mt-3 text-sm text-slate-700">
                Children need stronger comprehension, expression, paragraph-level reading, vocabulary, inference, and confidence while explaining what they read.
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
          <h2 className="mb-4 text-2xl font-bold text-slate-900 sm:text-3xl">What happens in the free reading assessment?</h2>
          <div className="grid gap-6 md:gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-base leading-7 text-slate-700">
                The free reading assessment helps us understand where your child is currently getting stuck.
              </p>
              <p className="mt-3 text-base leading-7 text-slate-700">
                During the assessment, we may check letter-sound knowledge, blending, word reading, sentence reading, reading speed, story understanding, vocabulary, and confidence while reading aloud. Based on this, Tiny Steps recommends the right reading path.
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
                  <span>Check the child&apos;s current reading level</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">2</span>
                  <span>Identify the reading gap</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">3</span>
                  <span>Recommend the right reading path</span>
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
          <h2 className="mb-4 mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">How parents see reading progress</h2>
          <p className="text-slate-700">Parents should not have to guess whether reading is improving.</p>
          <p className="mt-3 text-slate-700">
            Tiny Steps focuses on visible reading progress through class updates, skill-based feedback, strengths, improvement areas, and next-step guidance.
          </p>
          <ul className="mt-5 grid gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              'Words and sentences practised',
              'Fluency and reading confidence',
              'Comprehension strengths',
              'Skills that need more support',
              'Suggested next reading practice',
              'Clear progress across phonics, fluency, and comprehension',
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
          <h2 className="text-2xl font-bold md:text-3xl">Not sure where your child is stuck in reading?</h2>
          <p className="mx-auto mt-3 max-w-3xl text-base leading-7 text-slate-200">
            Book a free assessment and let Tiny Steps identify whether your child needs phonics, word reading, sentence reading, fluency, comprehension, or reading confidence support first.
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
            <Link to="/phonics" className="font-semibold underline underline-offset-2 hover:text-white">phonics classes for kids</Link>
            <span className="hidden sm:inline text-slate-400">•</span>
            <Link to="/grammar" className="font-semibold underline underline-offset-2 hover:text-white">grammar classes for kids</Link>
            <span className="hidden sm:inline text-slate-400">•</span>
            <Link to="/pricing" className="font-semibold underline underline-offset-2 hover:text-white">pricing for reading classes</Link>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-slate-300">
            <Link to="/online-english-classes-for-kids-india" className="underline underline-offset-2 hover:text-white">online English classes for kids in India</Link>
            <span className="hidden sm:inline text-slate-500">•</span>
            <Link to="/class-samples" className="underline underline-offset-2 hover:text-white">real class samples</Link>
          </div>
        </div>
      </section>

      <ClusterSeoNav cluster="phonics" />
    </div>
  );
}
