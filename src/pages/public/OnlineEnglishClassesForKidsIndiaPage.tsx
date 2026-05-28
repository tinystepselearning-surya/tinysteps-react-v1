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
    <div className="container mx-auto max-w-4xl px-6 py-12">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-600">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link to="/" className="hover:text-slate-900 hover:underline">
              Home
            </Link>
          </li>
          <li aria-hidden="true">&gt;</li>
          <li>
            <Link to="/courses" className="hover:text-slate-900 hover:underline">
              Courses
            </Link>
          </li>
          <li aria-hidden="true">&gt;</li>
          <li className="font-medium text-slate-900">Online English Classes for Kids in India</li>
        </ol>
      </nav>

      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">Online English Classes for Kids in India</h1>
        <p className="mt-4 text-lg text-slate-700">
          Help your child build stronger phonics, reading, grammar, sentence formation, and communication confidence through structured live online classes.
        </p>
        <p className="mt-3 text-slate-700">
          Tiny Steps begins with a free assessment, understands your child&apos;s current learning gap, and then recommends the right path instead of placing every child into the same programme.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/book-demo"
            className="inline-block rounded-lg bg-slate-900 px-8 py-3 font-semibold text-white transition hover:bg-slate-800"
          >
            Book Free Assessment
          </Link>
        </div>
        <p className="mt-3 text-sm text-slate-600">Takes 20-30 seconds • No commitment</p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Quick Answer for Parents</h2>
        <p className="text-slate-700">Looking for online English classes for your child in India? Start by identifying the real gap first.</p>
        <p className="mt-3 text-slate-700">
          Some children know letters but cannot blend words. Some can read words but struggle to understand stories. Others need help with grammar, sentence formation, or speaking in complete answers.
        </p>
        <p className="mt-3 text-slate-700">
          Tiny Steps begins with a free assessment and then recommends the right learning path across phonics, reading, grammar, sentence formation, and communication confidence.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Which child is this programme right for?</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-lg font-semibold text-slate-900">Child knows letters but cannot read words</h3>
            <p className="mt-2 text-sm text-slate-700">
              Best for children who recognise letters and sounds but still struggle to blend them into words like cat, pin, shop, or cake.
            </p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-lg font-semibold text-slate-900">Child reads words but does not understand stories well</h3>
            <p className="mt-2 text-sm text-slate-700">
              Best for children who can read short words or sentences but need better reading fluency, comprehension, and confidence while reading aloud.
            </p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-lg font-semibold text-slate-900">Child struggles with grammar and sentence formation</h3>
            <p className="mt-2 text-sm text-slate-700">
              Best for children who know some grammar rules but still make mistakes while writing sentences, answering questions, or speaking in class.
            </p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-lg font-semibold text-slate-900">Child gives very short answers while speaking</h3>
            <p className="mt-2 text-sm text-slate-700">
              Best for children who answer in one or two words and need guided practice to speak in fuller, clearer sentences.
            </p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 md:col-span-2">
            <h3 className="text-lg font-semibold text-slate-900">Child needs confidence for school communication</h3>
            <p className="mt-2 text-sm text-slate-700">
              Best for children who understand English but hesitate during reading aloud, oral answers, show-and-tell, presentations, or classroom discussions.
            </p>
          </article>
        </div>
      </section>

      <section className="mb-10 rounded-xl border border-sky-100 bg-sky-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Tiny Steps learning pathway</h2>
        <p className="text-slate-700">
          Phonics foundation -&gt; Reading fluency -&gt; Grammar clarity -&gt; Sentence formation -&gt; Communication confidence
        </p>
        <p className="mt-3 text-slate-700">
          Children do not all start at the same point. A 5-year-old may need phonics and blending support, while an 8-year-old may need reading comprehension and grammar transfer. An older child may need clearer sentence formation, structured answers, and confident communication.
        </p>
        <p className="mt-3 text-slate-700">
          Tiny Steps uses assessment-first placement to decide the right starting point and then helps the child move forward step by step.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {pathwayCourses.map((course) => (
            <article key={course.name} className="rounded-lg border border-sky-200 bg-white p-4">
              <h3 className="text-lg font-semibold text-slate-900">{course.name}</h3>
              <p className="mt-2 text-sm text-slate-700">{course.description}</p>
              <Link to={course.linkPath} className="mt-3 inline-block text-sm font-semibold text-slate-900 underline underline-offset-2">
                {course.anchor}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What parents should compare before choosing online English classes</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-200 px-4 py-3 font-semibold text-slate-900">Choose this</th>
                <th className="border border-slate-200 px-4 py-3 font-semibold text-slate-900">Avoid this</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-200 px-4 py-3 text-slate-700">A structured skill pathway</td>
                <td className="border border-slate-200 px-4 py-3 text-slate-700">Random tuition or topic-by-topic lesson hopping</td>
              </tr>
              <tr>
                <td className="border border-slate-200 px-4 py-3 text-slate-700">Live teacher correction</td>
                <td className="border border-slate-200 px-4 py-3 text-slate-700">App-only practice with no immediate feedback</td>
              </tr>
              <tr>
                <td className="border border-slate-200 px-4 py-3 text-slate-700">Progress visibility for parents</td>
                <td className="border border-slate-200 px-4 py-3 text-slate-700">Worksheets only with no clear checkpoint</td>
              </tr>
              <tr>
                <td className="border border-slate-200 px-4 py-3 text-slate-700">Personalised guidance</td>
                <td className="border border-slate-200 px-4 py-3 text-slate-700">Large batches where the child gets fewer speaking turns</td>
              </tr>
              <tr>
                <td className="border border-slate-200 px-4 py-3 text-slate-700">Assessment-first placement</td>
                <td className="border border-slate-200 px-4 py-3 text-slate-700">Same class plan for every child</td>
              </tr>
              <tr>
                <td className="border border-slate-200 px-4 py-3 text-slate-700">Reading + grammar + communication support</td>
                <td className="border border-slate-200 px-4 py-3 text-slate-700">Only conversation practice without foundation building</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-slate-700">
          The best online English class is not just the one with more activities. It should help parents understand what the child needs next, give the child enough guided practice, and show visible progress over time.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Age-wise outcomes</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-lg font-semibold text-slate-900">Ages 4-6</h3>
            <p className="mt-2 text-sm text-slate-700">
              Children in this age group usually need a strong foundation in letter sounds, phonics, blending, early reading, listening, and simple sentence responses.
            </p>
            <p className="mt-2 text-sm text-slate-700">
              Tiny Steps helps young learners build comfort with sounds, words, short reading tasks, and guided speaking in a playful but structured way.
            </p>
            <Link to="/phonics" className="mt-3 inline-block text-sm font-semibold underline underline-offset-2">
              Explore phonics foundation
            </Link>
          </article>
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-lg font-semibold text-slate-900">Ages 7-10</h3>
            <p className="mt-2 text-sm text-slate-700">
              Children in this age group often need support with reading fluency, grammar usage, sentence formation, comprehension, and clearer answers in school.
            </p>
            <p className="mt-2 text-sm text-slate-700">
              Tiny Steps helps them move from short responses to better sentences, stronger reading understanding, and more confident communication.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link to="/reading-classes-for-kids" className="text-sm font-semibold underline underline-offset-2">
                reading classes for kids
              </Link>
              <Link to="/grammar" className="text-sm font-semibold underline underline-offset-2">
                grammar classes for kids
              </Link>
            </div>
          </article>
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-lg font-semibold text-slate-900">Ages 11-12</h3>
            <p className="mt-2 text-sm text-slate-700">
              Children in this age group need stronger comprehension, paragraph-quality answers, grammar accuracy, organised thinking, and confidence while explaining ideas.
            </p>
            <p className="mt-2 text-sm text-slate-700">
              Tiny Steps helps older children speak and write with more structure, clarity, and confidence for school tasks, discussions, and presentations.
            </p>
            <Link to="/book-demo" className="mt-3 inline-block text-sm font-semibold underline underline-offset-2">
              Book a free assessment
            </Link>
          </article>
        </div>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What happens in the free assessment?</h2>
        <p className="text-slate-700">
          The free assessment helps us understand your child&apos;s current level before suggesting a class path.
        </p>
        <p className="mt-3 text-slate-700">
          During the assessment, we may check how your child reads words or sentences, understands questions, forms sentences, uses grammar, and responds while speaking. Based on this, Tiny Steps recommends whether the child should begin with phonics, reading, grammar, sentence formation, or communication confidence.
        </p>
        <h3 className="mt-5 text-lg font-semibold text-slate-900">Assessment steps</h3>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-slate-700">
          <li>Understand the child&apos;s current level</li>
          <li>Identify the learning gap</li>
          <li>Recommend the right course path</li>
          <li>Explain the next steps to parents</li>
        </ol>
        <Link
          to="/book-demo"
          className="mt-6 inline-block rounded-lg bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-800"
        >
          Book Free Assessment
        </Link>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">How parents see progress</h2>
        <p className="text-slate-700">Parents should not have to guess whether the child is improving.</p>
        <p className="mt-3 text-slate-700">
          Tiny Steps focuses on visible progress through class updates, skill-based feedback, strengths, improvement areas, and next-step guidance. Parents can understand what the child is learning, where the child is improving, and what needs more practice.
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-700">
          <li>What the child practised</li>
          <li>What the child did well</li>
          <li>Which skills need more support</li>
          <li>Suggested next steps</li>
          <li>Clear movement across phonics, reading, grammar, and communication goals</li>
        </ul>
        <p className="mt-4 text-slate-700">
          See <Link to="/parents/tracking-progress" className="font-semibold underline underline-offset-2">how Tiny Steps tracks progress</Link> and compare class fit with the parent guide on{' '}
          <Link to="/parents/choosing-course" className="font-semibold underline underline-offset-2">choosing the right course path</Link>.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Frequently asked questions</h2>
        <div className="space-y-4">
          {faqItems.map((item) => (
            <article key={item.question}>
              <h3 className="faq-question font-semibold text-slate-900">{item.question}</h3>
              <p className="faq-answer mt-1 text-sm text-slate-700">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-xl bg-slate-900 p-8 text-center text-white">
        <h2 className="text-2xl font-bold">Not sure where your child should begin?</h2>
        <p className="mt-2 text-slate-200">
          Book a free assessment and let Tiny Steps identify whether your child needs phonics, reading, grammar, sentence formation, or communication confidence support first.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/book-demo"
            className="inline-block rounded-lg bg-white px-8 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            Book Free Assessment
          </Link>
        </div>
        <p className="mt-5 text-sm text-slate-200">
          Compare plans on <Link to="/pricing" className="font-semibold underline underline-offset-2">pricing for online English classes</Link>, review{' '}
          <Link to="/class-samples" className="font-semibold underline underline-offset-2">real class samples for parents</Link>, and see{' '}
          <Link to="/why-tiny-steps" className="font-semibold underline underline-offset-2">why parents choose Tiny Steps</Link>.
        </p>
      </section>
    </div>
  );
}
