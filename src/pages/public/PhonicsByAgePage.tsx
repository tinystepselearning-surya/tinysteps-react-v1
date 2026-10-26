import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import { createFAQPageSchema } from '../../lib/schemas';
import { getPublishedPhonicsAgeProgramme, PHONICS_AGE_PROGRAMME_PAGES } from '../../lib/phonicsAgeProgrammeRegistry.js';

type Props = { age: 3 | 4 | 5 | 6 };

const pill = 'inline-flex rounded-full border border-[#E5DDF8] bg-[#F1EDFC] px-3 py-1 text-xs font-semibold text-[#54345D]';
const card = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6';

export default function PhonicsByAgePage({ age }: Props) {
  const page = getPublishedPhonicsAgeProgramme(age);

  useEffect(() => {
    if (!page) return;
    applySeo({
      title: page.title,
      description: page.description,
      canonicalPath: page.path,
      ogType: 'website',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Phonics', item: 'https://tinystepslearning.com/phonics' },
            { '@type': 'ListItem', position: 2, name: page.heading, item: `https://tinystepslearning.com${page.path}` },
          ],
        },
        { ...createFAQPageSchema(page.faqs), '@id': `https://tinystepslearning.com${page.path}#faq` },
      ],
    });
  }, [page]);

  if (!page) return null;
  const relatedAges = PHONICS_AGE_PROGRAMME_PAGES.filter((item) => item.age !== age);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#E7F3FF]/70 via-white to-sky-50/40 text-slate-900">
      <div className="mx-auto max-w-6xl px-5 py-9 sm:px-7 sm:py-12">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-600">
          <Link className="underline underline-offset-2 hover:text-[#604577]" to="/phonics">Phonics classes</Link>
          <span aria-hidden="true" className="mx-2">/</span>
          <span aria-current="page">Age {age}</span>
        </nav>

        <header className="grid gap-8 rounded-3xl border border-[#E5DDF8] bg-white p-6 shadow-sm sm:p-9 lg:grid-cols-[1.45fr_0.9fr]">
          <div>
            <span className={pill}>Live 1:1 online Phonics · Age {age}</span>
            <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">{page.heading}</h1>
            <p className="mt-5 text-base leading-8 text-slate-700">{page.introduction}</p>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Age helps parents choose a starting conversation, but skill readiness determines the actual lesson level.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/book-demo" className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800">
                Book Free 35-Minute Demo
              </Link>
              <Link to="/phonics" className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold hover:bg-slate-50">
                View full Phonics programme
              </Link>
            </div>
          </div>
          <aside className="self-start rounded-2xl border border-sky-100 bg-sky-50 p-5 sm:p-6">
            <h2 className="text-lg font-bold">Quick answer for parents</h2>
            <p className="mt-3 leading-7 text-slate-700">{page.directAnswer}</p>
            <p className="mt-4 text-sm text-slate-600">The assessment checks what your child can do before any learning level is recommended.</p>
          </aside>
        </header>

        <section aria-labelledby="concerns-heading" className="mt-10">
          <h2 id="concerns-heading" className="text-2xl font-bold">Does this sound familiar?</h2>
          <p className="mt-2 text-slate-600">Common questions from parents. They are starting points, not diagnoses.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {page.parentQuestions.map((question: string) => (
              <article key={question} className={card}><p className="leading-7 text-slate-700">{question}</p></article>
            ))}
          </div>
        </section>

        <section aria-labelledby="assessment-heading" className="mt-12 grid gap-6 lg:grid-cols-2">
          <div className={card}>
            <h2 id="assessment-heading" className="text-2xl font-bold">What the assessment checks</h2>
            <ul className="mt-5 list-disc space-y-3 pl-5 leading-7 text-slate-700">
              {page.assessmentFocus.map((item: string) => <li key={item}>{item}</li>)}
            </ul>
          </div>
          <div className="rounded-2xl border border-[#E5DDF8] bg-[#F1EDFC]/80 p-5 sm:p-6">
            <h2 className="text-2xl font-bold">{page.activityHeading}</h2>
            <p className="mt-4 leading-8 text-slate-700">{page.activityExample}</p>
            <p className="mt-4 text-sm font-medium text-slate-600">This is an illustrative activity, not an age-wide test or guaranteed lesson script.</p>
          </div>
        </section>

        <section aria-labelledby="approach-heading" className="mt-12">
          <h2 id="approach-heading" className="text-2xl font-bold">How live teaching responds</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {page.classApproach.map((step: { title: string; detail: string }, index: number) => (
              <article key={step.title} className={card}>
                <p className="text-xs font-bold uppercase tracking-wider text-[#604577]">Step {index + 1}</p>
                <h3 className="mt-2 text-lg font-bold">{step.title}</h3>
                <p className="mt-3 leading-7 text-slate-700">{step.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="progress-heading" className="mt-12 grid gap-6 lg:grid-cols-2">
          <div className={card}>
            <h2 id="progress-heading" className="text-2xl font-bold">What meaningful progress can look like</h2>
            <ul className="mt-4 list-disc space-y-3 pl-5 leading-7 text-slate-700">
              {page.progressSigns.map((sign: string) => <li key={sign}>{sign}</li>)}
            </ul>
            <p className="mt-5 text-sm text-slate-600">Progress depends on the learner's starting point; Tiny Steps does not promise a fixed number of lessons.</p>
          </div>
          <div className={card}>
            <h2 className="text-2xl font-bold">What parents can try at home</h2>
            <p className="mt-4 leading-8 text-slate-700">{page.homeGuidance}</p>
            <p className="mt-5 text-sm text-slate-600">
              Parent practice supports, but does not replace, a teacher's assessment and live feedback.
            </p>
          </div>
        </section>

        <section aria-labelledby="questions-heading" className="mt-12">
          <h2 id="questions-heading" className="text-2xl font-bold">Frequently asked questions</h2>
          <div id="faq" className="mt-5 space-y-3">
            {page.faqs.map((faq: { question: string; answer: string }) => (
              <article key={faq.question} className={card}>
                <h3 className="font-semibold">{faq.question}</h3>
                <p className="mt-2 leading-7 text-slate-700">{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="pathways-heading" className="mt-12 rounded-3xl border border-sky-100 bg-sky-50 p-6 sm:p-8">
          <h2 id="pathways-heading" className="text-2xl font-bold">Explore the right next step</h2>
          <p className="mt-3 leading-7 text-slate-700">
            The full Phonics programme covers multiple starting levels. For broader reading, vocabulary and speaking support, use the age-based English guide instead.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold">
            <Link to={page.coursePath} className="rounded-full bg-white px-5 py-3 text-slate-900 shadow-sm underline underline-offset-2">{page.courseLabel}</Link>
            <Link to={page.broaderAgePath} className="rounded-full bg-white px-5 py-3 text-slate-900 shadow-sm underline underline-offset-2">{page.broaderAgeLabel}</Link>
            {relatedAges.map((other) => (
              <Link key={other.path} to={other.path} className="rounded-full bg-white px-5 py-3 text-slate-900 shadow-sm underline underline-offset-2">Phonics at age {other.age}</Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
