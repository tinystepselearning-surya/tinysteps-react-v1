import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import { createFAQPageSchema, PUBLIC_FACTS } from '../../lib/schemas';

const faqItems = [
  {
    question: 'What do online English classes for kids include?',
    answer:
      'Online English classes for kids may include phonics, reading, grammar, sentence formation, comprehension, and communication practice. At Tiny Steps, the exact path depends on the child’s current level and learning gap.',
  },
  {
    question: 'How do I know which class my child needs first?',
    answer:
      'The best way is to begin with an assessment. Some children need phonics before reading fluency, while others need grammar, sentence formation, or communication practice. Tiny Steps recommends the starting point after checking the child’s level.',
  },
  {
    question: 'Are these classes useful if my child reads words but does not understand stories?',
    answer:
      'Yes. Reading words and understanding stories are different skills. A child may decode words but still need help with fluency, vocabulary, comprehension, and answering questions.',
  },
  {
    question: 'Can online English classes help with grammar mistakes?',
    answer:
      'Yes. Grammar improves when children practise rules inside real sentences, short answers, reading tasks, and writing activities. Tiny Steps focuses on applying grammar, not only memorising rules.',
  },
  {
    question: 'My child gives only one-word answers. Can this help?',
    answer:
      'Yes. Tiny Steps helps children expand short answers into complete sentences through prompts, guided practice, sentence frames, storytelling, and repeated speaking opportunities.',
  },
  {
    question: 'What happens after the free assessment?',
    answer:
      'After the assessment, Tiny Steps suggests the right learning path for your child. Parents can then choose the suitable class plan and schedule.',
  },
];

const pathwayCourses = [
  {
    name: 'Phonics foundation',
    description: 'Letter sounds, blending, CVC words, digraphs, long vowels, and early reading confidence.',
    url: `${PUBLIC_FACTS.primaryWebsite}/phonics`,
    linkPath: '/phonics',
    anchor: 'online phonics classes for kids in India',
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
    name: 'Sentence formation and communication confidence',
    description: 'Longer answers, structured thinking, clear expression, storytelling, and school communication practice.',
    url: `${PUBLIC_FACTS.primaryWebsite}/speaking`,
    linkPath: '/speaking',
    anchor: 'communication and public speaking classes for kids',
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
      title: 'Online English Classes for Kids in India | Tiny Steps Learning',
      description:
        'Book a free assessment for online English classes in India. Tiny Steps helps children build phonics, reading, grammar and communication with live guidance.',
      canonicalPath,
      robots: 'index,follow',
      ogType: 'website',
      jsonLd: [breadcrumbSchema, pathwayItemListSchema, faqSchema],
    });
  }, [canonicalPath, canonicalUrl, pathwayCourses]);

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
                  Help your child build stronger phonics, reading, grammar, sentence formation, and communication confidence through structured live online classes.
                </p>
                <p className="mt-3 max-w-full text-base leading-7 text-slate-700 md:mt-4 md:max-w-[660px] md:text-lg md:leading-8">
                  Tiny Steps begins with a free assessment, understands your child&apos;s current learning gap, and then recommends the right path instead of placing every child into the same programme.
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
                  {['Free assessment', 'Personalised path', 'Parent progress visibility'].map((chip) => (
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
            <h2 className="mb-3 mt-3 text-2xl font-bold leading-tight text-slate-900 md:text-[30px]">Quick Answer for Parents</h2>
            <p className="max-w-[920px] text-base leading-7 text-slate-700 md:text-[17px]">Looking for online English classes for your child in India? Start by identifying the real gap first.</p>
            <p className="mt-3 max-w-[920px] text-base leading-7 text-slate-700 md:text-[17px]">
              Some children know letters but cannot blend words. Some can read words but struggle to understand stories. Others need help with grammar, sentence formation, or speaking in complete answers.
            </p>
            <p className="mt-3 max-w-[920px] text-base leading-7 text-slate-700 md:text-[17px]">
              Tiny Steps begins with a free assessment and then recommends the right learning path across phonics, reading, grammar, sentence formation, and communication confidence.
            </p>
          </article>
        </div>
      </section>

      <section className="px-4 pb-8 pt-8 sm:px-5 md:pb-12 md:pt-12 lg:px-6 lg:pb-14 lg:pt-14">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-6 text-2xl font-bold text-slate-900 sm:text-3xl">Which child is this programme right for?</h2>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {[
              {
                pill: 'Reading start gap',
                title: 'Child knows letters but cannot read words',
                body: 'Best for children who recognise letters and sounds but still struggle to blend them into words like cat, pin, shop, or cake.',
              },
              {
                pill: 'Story understanding',
                title: 'Child reads words but does not understand stories well',
                body: 'Best for children who can read short words or sentences but need better reading fluency, comprehension, and confidence while reading aloud.',
              },
              {
                pill: 'Grammar support',
                title: 'Child struggles with grammar and sentence formation',
                body: 'Best for children who know some grammar rules but still make mistakes while writing sentences, answering questions, or speaking in class.',
              },
              {
                pill: 'Short answer support',
                title: 'Child gives very short answers while speaking',
                body: 'Best for children who answer in one or two words and need guided practice to speak in fuller, clearer sentences.',
              },
              {
                pill: 'School confidence',
                title: 'Child needs confidence for school communication',
                body: 'Best for children who understand English but hesitate during reading aloud, oral answers, show-and-tell, presentations, or classroom discussions.',
              },
            ].map((item) => (
              <article
                key={item.title}
                className={`rounded-2xl border p-5 shadow-[0_10px_28px_rgba(15,23,42,0.05)] transition hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)] md:min-h-[190px] md:rounded-3xl md:p-6 ${
                  item.pill === 'Reading start gap'
                    ? 'bg-[#F3FAFF] border-[#D7ECFA]'
                    : item.pill === 'Story understanding'
                      ? 'bg-[#FFF8F0] border-[#F6D9B9]'
                      : item.pill === 'Grammar support'
                        ? 'bg-[#F3FFF6] border-[#CFEFD7]'
                        : item.pill === 'Short answer support'
                          ? 'bg-[#F7F5FF] border-[#E2DBFF]'
                          : 'bg-[#FFFBEA] border-[#F4E2A0]'
                }`}
              >
                <span className="mb-3 inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.10em] bg-white/70 border border-white/70 text-slate-700 md:mb-4 md:text-[11px] md:tracking-[0.12em]">
                  {item.pill}
                </span>
                <h3 className="text-lg md:text-xl font-bold leading-snug text-slate-950">{item.title}</h3>
                <p className="mt-2.5 text-[15px] text-slate-700 leading-6 md:mt-3 md:text-base">{item.body}</p>
              </article>
            ))}
          </div>
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
            The best online English class is not just the one with more activities. It should help parents understand what the child needs next, give the child enough guided practice, and show visible progress over time.
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
                Children in this age group usually need a strong foundation in letter sounds, phonics, blending, early reading, listening, and simple sentence responses.
              </p>
              <p className="mt-2 text-sm text-slate-700">
                Tiny Steps helps young learners build comfort with sounds, words, short reading tasks, and guided speaking in a playful but structured way.
              </p>
              <Link to="/phonics" className="mt-4 inline-block text-sm font-semibold underline underline-offset-2">
                Explore phonics foundation
              </Link>
            </article>
            <article className="flex h-full flex-col rounded-2xl border border-sky-100 bg-gradient-to-br from-white to-sky-50/70 p-5 shadow-sm md:rounded-3xl md:p-6">
              <span className="inline-flex w-fit rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-800">Ages 7-10</span>
              <p className="mt-3 text-sm text-slate-700">
                Children in this age group often need support with reading fluency, grammar usage, sentence formation, comprehension, and clearer answers in school.
              </p>
              <p className="mt-2 text-sm text-slate-700">
                Tiny Steps helps them move from short responses to better sentences, stronger reading understanding, and more confident communication.
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
                Children in this age group need stronger comprehension, paragraph-quality answers, grammar accuracy, organised thinking, and confidence while explaining ideas.
              </p>
              <p className="mt-2 text-sm text-slate-700">
                Tiny Steps helps older children speak and write with more structure, clarity, and confidence for school tasks, discussions, and presentations.
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
            <Link to="/pricing" className="font-semibold underline underline-offset-2 hover:text-white">pricing for online English classes</Link>
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
