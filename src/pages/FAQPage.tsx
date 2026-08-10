// @ts-nocheck
import { startTransition, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { applySeo } from '../lib/seo';
import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import FAQAccordion, { FAQItem } from '../components/FAQ/FAQAccordion';
import Meta from '../components/common/Meta';
import {
  FREE_DEMO_FULL_DESCRIPTION,
  STANDARD_PRICING_SUMMARY,
} from '../config/publicOffer';

const items: FAQItem[] = [
  {
    id: 'q1',
    category: 'phonics',
    question: 'How should I start phonics at home?',
    answer:
      'Start with a small set of letter sounds, then practise oral blending, printed-word blending, and one short decodable line. Keep the routine short and repeat the same taught pattern before adding more content.',
    relatedBlog: '/blog/phonics-for-parents-guide',
    relatedCourse: '/phonics',
  },
  {
    id: 'q2',
    category: 'phonics',
    question: 'Why can my child say letter sounds but still not blend words?',
    answer:
      'Sound recall and blending are different skills. Practise joining a short sound sequence such as /c/ /a/ /t/ into one word, then use printed CVC words. If the child still guesses, slow the task down and check oral blending before adding harder patterns.',
    relatedBlog: '/blog/cvc-words-explained-for-parents',
    relatedCourse: '/courses/phonics-foundation',
  },
  {
    id: 'q3',
    category: 'phonics',
    question: 'What is the difference between phonics and sight-word learning?',
    answer:
      'Phonics teaches children to use sound-spelling relationships to decode words. Some high-frequency words contain parts that are not yet decodable with the child’s current knowledge, so those unusual parts need extra attention. The goal is to decode what can be decoded rather than memorising every word as a visual shape.',
    relatedBlog: '/blog/digraphs-and-tricky-words',
    relatedCourse: '/phonics',
  },
  {
    id: 'q4',
    category: 'phonics',
    question: 'Is a 7-year-old too old to start or restart phonics?',
    answer:
      'No. Older children can still benefit from explicit phonics when a decoding gap remains. The starting point should be based on the child’s current sound, blending, word-reading, spelling, and fluency skills rather than age alone.',
    relatedBlog: '/blog/how-phonics-classes-help-kids-read',
    relatedCourse: '/courses/phonics-foundation',
  },
  {
    id: 'q5',
    category: 'phonics',
    question: 'How should I teach tricky words such as said, come, and there?',
    answer:
      'Show the parts the child can already decode, then draw attention to the genuinely unexpected or not-yet-taught part. Revisit a small set cumulatively in reading and spelling instead of treating the whole word as a picture to memorise.',
    relatedBlog: '/blog/digraphs-and-tricky-words',
    relatedCourse: '/phonics',
  },
  {
    id: 'q6',
    category: 'phonics',
    question: 'My child can read words but does not understand the story. Is that still a phonics problem?',
    answer:
      'Not always. If decoding is accurate enough, the next need may be fluency, vocabulary, oral language, background knowledge, or comprehension. Check whether the child can explain what happened, answer simple questions, and retell the text without relying on the exact wording.',
    relatedBlog: '/blog/how-phonics-classes-help-kids-read',
    relatedCourse: '/reading-fluency-program',
  },
  {
    id: 'q7',
    category: 'phonics',
    question: 'What should I look for in an online phonics class?',
    answer:
      'Look for clear placement, a systematic sequence, active child participation, explicit blending and decoding, immediate correction, level-appropriate reading, spelling transfer, and progress evidence using unfamiliar examples.',
    relatedBlog: '/blog/online-phonics-classes-vs-school',
    relatedCourse: '/phonics',
  },
  {
    id: 'q8',
    category: 'grammar',
    question: 'How can grammar be taught without turning it into rule memorisation?',
    answer:
      'Teach one concept briefly, then use it in speaking, sentence building, editing, and fresh writing. A child understands grammar more deeply when they can produce and correct their own sentences rather than only identify answers on a worksheet.',
    relatedBlog: '/blog/week-7-grammar-nouns-to-paragraphs',
    relatedCourse: '/grammar',
  },
  {
    id: 'q9',
    category: 'grammar',
    question: 'Why does my child know grammar rules but still make mistakes while writing?',
    answer:
      'Knowing a rule and applying it while generating ideas are different demands. Use short write-edit-rewrite cycles and focus on one repeated error pattern at a time so the rule transfers into independent writing.',
    relatedBlog: '/blog/child-knows-grammar-but-makes-mistakes',
    relatedCourse: '/writing-classes-for-kids',
  },
  {
    id: 'q10',
    category: 'grammar',
    question: 'When should children start learning tenses?',
    answer:
      'Introduce tense language when the child can understand and produce simple sentences about now, before, and later. The exact age matters less than language readiness. Start with clear everyday contrasts before moving into more complex tense forms.',
    relatedBlog: '/blog/child-knows-grammar-but-makes-mistakes',
    relatedCourse: '/courses/grammar',
  },
  {
    id: 'q11',
    category: 'grammar',
    question: 'My child speaks well but cannot write complete sentences. What should we practise?',
    answer:
      'Use a speak-first, write-second routine. Let the child say one complete idea, write it independently, then check capitals, punctuation, word order, tense, and clarity. Gradually move from one sentence to connected sentences and paragraphs.',
    relatedBlog: '/blog/how-to-improve-sentence-formation-in-kids',
    relatedCourse: '/writing-classes-for-kids',
  },
  {
    id: 'q12',
    category: 'speaking',
    question: 'How can I help a shy child speak more confidently?',
    answer:
      'Use familiar, low-pressure prompts, allow thinking time, model only when needed, and praise the attempt before correcting one small detail. Build from one complete sentence to connected ideas and new settings gradually.',
    relatedBlog: '/blog/week-12-speaking-confidence-seeds',
    relatedCourse: '/speaking',
  },
  {
    id: 'q13',
    category: 'speaking',
    question: 'Should I correct every grammar mistake while my child is speaking?',
    answer:
      'No. Let the child finish the idea first. Then choose one useful correction and ask for a smooth retry. Constant interruption can make it harder to organise and express the message.',
    relatedBlog: '/parents/speech-confidence',
    relatedCourse: '/speaking',
  },
  {
    id: 'q14',
    category: 'speaking',
    question: 'My child gives only one-word answers. How do I extend them?',
    answer:
      'Use a sentence starter and one follow-up question. Build from “dog” to “I like dogs” to “I like dogs because they are playful.” Reduce the prompt as the child becomes more independent.',
    relatedBlog: '/blog/child-gives-one-word-answers',
    relatedCourse: '/speaking',
  },
  {
    id: 'q15',
    category: 'speaking',
    question: 'My child mumbles or speaks too quickly. What should I work on first?',
    answer:
      'Separate clarity, volume, and pace instead of correcting everything at once. Practise one short sentence in a comfortable conversation voice, then add a deliberate pause between ideas. If speech clarity is persistently difficult, seek individual guidance from an appropriately qualified professional.',
    relatedBlog: '/parents/speech-confidence',
    relatedCourse: '/speaking',
  },
  {
    id: 'q16',
    category: 'online',
    question: 'Are one-to-one online English classes better than group classes?',
    answer:
      'They serve different needs. One-to-one classes are useful for close observation, personalised pacing, and frequent individual responses. Groups can add peer interaction and turn-taking. Choose the format based on the child’s learning goal rather than assuming one format is always superior.',
    relatedBlog: '/blog/online-english-classes-for-kids-india',
    relatedCourse: '/courses',
  },
  {
    id: 'q17',
    category: 'online',
    question: 'How do I know whether my child is actually progressing online?',
    answer:
      'Ask for observable evidence: what the child can now read, write, explain, or say with less help. Compare similar fresh tasks over time instead of relying only on attendance, worksheets, or chapters completed.',
    relatedBlog: '/parents/tracking-progress',
    relatedCourse: '/courses',
  },
  {
    id: 'q18',
    category: 'online',
    question: 'How do I choose between phonics, grammar, writing, reading, and speaking?',
    answer:
      'Start with the strongest current gap. Weak unfamiliar-word decoding points toward phonics; accurate but effortful reading may need fluency; repeated sentence errors may need grammar and writing; short hesitant answers may need sentence formation and speaking confidence.',
    relatedBlog: '/parents/choosing-course',
    relatedCourse: '/book-demo',
  },
  {
    id: 'q19',
    category: 'pricing',
    question: 'What class packages do you offer?',
    answer: `${STANDARD_PRICING_SUMMARY}. Check the pricing page for the current package options and any premium plans before enrolling.`,
    relatedCourse: '/pricing',
  },
  {
    id: 'q20',
    category: 'pricing',
    question: 'Do you offer a free demo assessment class?',
    answer: `${FREE_DEMO_FULL_DESCRIPTION} It costs ₹0, requires no credit card, and there is no obligation to enrol.`,
    relatedCourse: '/book-demo',
  },
  {
    id: 'q21',
    category: 'pricing',
    question: 'How should parents compare the value of different English programmes?',
    answer:
      'Compare the starting assessment, teaching format, curriculum sequence, teacher feedback, home-practice expectation, progress evidence, class frequency, and total price. A cheaper package is not automatically better if it does not match the child’s actual learning need.',
    relatedBlog: '/blog/online-english-classes-for-kids-india',
    relatedCourse: '/pricing',
  },
  {
    id: 'q22',
    category: 'timings',
    question: 'Are Tiny Steps classes available in Hyderabad and outside India?',
    answer:
      'Yes. Tiny Steps classes are online, so families can join from Hyderabad, other parts of India, and international locations when a suitable teacher slot is available.',
    relatedCourse: '/contact',
  },
  {
    id: 'q23',
    category: 'timings',
    question: 'Do you offer weekend or different time-zone slots?',
    answer:
      'Availability changes, so parents should check current teacher slots before planning around a specific day or time. Use the contact or demo-booking flow to request the preferred schedule.',
    relatedCourse: '/contact',
  },
  {
    id: 'q24',
    category: 'timings',
    question: 'Do parents need to sit with the child during an online class?',
    answer:
      'Younger children may need initial help with the device, materials, or settling into the routine. Older children can often participate more independently. The teacher can advise based on age, attention, and the child’s comfort during the assessment.',
    relatedCourse: '/book-demo',
  },
];

const categories = [
  { id: 'all', label: 'All' },
  { id: 'phonics', label: 'Phonics' },
  { id: 'grammar', label: 'Grammar & Writing' },
  { id: 'speaking', label: 'Speaking Confidence' },
  { id: 'online', label: 'Online Learning' },
  { id: 'pricing', label: 'Pricing & Demo' },
  { id: 'timings', label: 'Locations & Timings' },
];

const quickRoutes = [
  {
    title: 'Choose the right course',
    detail: 'Identify whether phonics, reading, grammar and writing, or speaking should come first.',
    to: '/parents/choosing-course',
  },
  {
    title: 'Phonics for parents',
    detail: 'Understand decoding, blending, practice order, and what useful progress looks like.',
    to: '/blog/phonics-for-parents-guide',
  },
  {
    title: 'Track real progress',
    detail: 'Use baselines, independent evidence, and transfer checks rather than vague labels.',
    to: '/parents/tracking-progress',
  },
  {
    title: 'Build speaking confidence',
    detail: 'Use low-pressure routines, parent scripts, and observable confidence markers.',
    to: '/parents/speech-confidence',
  },
];

const stripHtml = (value: string) => String(value || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: stripHtml(item.answer),
    },
  })),
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
    { '@type': 'ListItem', position: 2, name: 'FAQ', item: 'https://tinystepslearning.com/faq' },
  ],
};

const FAQPage: FC = () => {
  const [selected, setSelected] = useState<string>('all');
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  useEffect(() => {
    applySeo({
      title: 'Parent FAQ: Phonics, Reading, Grammar, Writing & Speaking | Tiny Steps',
      description:
        'Direct parent answers about phonics, reading, grammar, writing, speaking confidence, online class formats, progress, free demo assessment, pricing, and timings.',
      canonicalPath: '/faq',
      robots: 'index, follow',
      jsonLd: [breadcrumbSchema, faqSchema],
    });
  }, []);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchCategory = selected === 'all' || item.category === selected;
      const term = deferredSearch;
      const matchSearch = !term || item.question.toLowerCase().includes(term) || stripHtml(item.answer).toLowerCase().includes(term);
      return matchCategory && matchSearch;
    });
  }, [deferredSearch, selected]);

  const selectedLabel = categories.find((category) => category.id === selected)?.label || 'All';

  const relevantRoutes = useMemo(() => {
    if (selected === 'phonics') return [quickRoutes[1], quickRoutes[0]];
    if (selected === 'grammar') return [quickRoutes[0], quickRoutes[2]];
    if (selected === 'speaking') return [quickRoutes[3], quickRoutes[0]];
    if (selected === 'online' || selected === 'pricing') return [quickRoutes[0], quickRoutes[2]];
    return quickRoutes;
  }, [selected]);

  const { user } = useAuthStore();
  const metaTitle = 'Parent FAQ: Phonics, Reading, Grammar, Writing & Speaking | Tiny Steps';
  const metaDescription =
    'Direct parent answers about phonics, reading, grammar, writing, speaking confidence, online class formats, progress, free demo assessment, pricing, and timings.';

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f6eee3_0%,#fbfaf7_18%,#ffffff_42%,#f4f8fc_100%)]">
      <Meta title={metaTitle} description={metaDescription} canonical="https://tinystepslearning.com/faq" jsonLd={[breadcrumbSchema, faqSchema]} />

      <section className="relative overflow-hidden border-b border-slate-800 bg-[linear-gradient(135deg,#111827_0%,#18253d_48%,#22314b_100%)] px-6 pb-14 pt-24 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(239,187,106,0.16),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(112,160,230,0.18),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_390px] lg:items-end">
            <div className="max-w-4xl">
              <div className="inline-flex items-center rounded-full border border-white/14 bg-white/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-100 backdrop-blur">
                Tiny Steps Parent Help Centre
              </div>
              <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-[3.75rem] lg:leading-[1.04]">
                Parent questions about English learning, answered clearly
              </h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-200">
                Start here when you are unsure about phonics, reading, grammar, writing, speaking confidence, class format, progress, pricing, or the free assessment. The answers are designed to help you decide the next useful step rather than push every child into the same course.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-200">
                <span className="rounded-full border border-white/12 bg-white/8 px-4 py-2 backdrop-blur">24 durable parent questions</span>
                <span className="rounded-full border border-white/12 bg-white/8 px-4 py-2 backdrop-blur">Linked to canonical guides and course paths</span>
              </div>
              <div className="mt-7 max-w-xl">
                <label htmlFor="faq-search" className="sr-only">Search parent questions</label>
                <input
                  id="faq-search"
                  className="w-full rounded-full border border-white/16 bg-white/10 px-5 py-3 text-sm text-white outline-none transition placeholder:text-slate-300 focus:border-white/30 focus:bg-white/14"
                  placeholder="Search phonics, reading, grammar, speaking, pricing..."
                  value={search}
                  onChange={(event) => {
                    const value = event.target.value;
                    startTransition(() => setSearch(value));
                  }}
                />
              </div>
            </div>

            <div className="rounded-[2.2rem] border border-white/10 bg-white/8 p-6 shadow-[0_30px_80px_rgba(2,6,23,0.32)] backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100">Best next reads</p>
              <div className="mt-5 divide-y divide-white/10">
                {quickRoutes.map((route) => (
                  <Link key={route.title} to={route.to} className="group block py-4 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-base font-semibold text-white transition group-hover:text-[#ffd8a8]">{route.title}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-300">{route.detail}</p>
                      </div>
                      <span className="mt-1 text-lg text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-white">→</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <section className="mb-8 rounded-[1.8rem] border border-emerald-100 bg-emerald-50 p-5 md:p-6">
          <h2 className="text-xl font-bold text-slate-950">Quick answer: where should a parent start?</h2>
          <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-700 md:text-base">
            Identify the skill the child cannot yet do independently. If the gap is unfamiliar-word decoding, start with phonics. If decoding is accurate but reading remains effortful, look at fluency and comprehension. Repeated sentence errors point toward grammar and writing. Short hesitant responses point toward sentence formation and speaking confidence. If you are unsure, use the free assessment before choosing a course.
          </p>
        </section>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-[1.8rem] border border-slate-200/80 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">Browse by topic</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelected(cat.id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    selected === cat.id ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-slate-200 bg-[linear-gradient(135deg,#fff4e2,#eef6ff)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Current view</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{selectedLabel}</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Showing <span className="font-semibold text-slate-900">{filtered.length}</span> answer{filtered.length === 1 ? '' : 's'}
              {deferredSearch ? <> for <span className="font-semibold text-slate-900">"{search.trim()}"</span></> : null}.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <FAQAccordion items={filtered} />
          </div>

          <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
            <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">Continue with the right guide</p>
              <div className="mt-4 space-y-3">
                {relevantRoutes.map((route) => (
                  <Link
                    key={route.title}
                    to={route.to}
                    className="block rounded-[1.25rem] border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-white"
                  >
                    {route.title}
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">Still have questions?</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {!user ? (
                  <>
                    Message us on <a href="https://wa.me/919618398383" target="_blank" rel="noopener noreferrer" className="text-primary-700">WhatsApp</a> or use the <Link to="/contact" className="text-primary-700">contact form</Link> and share the child&apos;s age plus the main learning concern.
                  </>
                ) : (
                  <>
                    Use the <Link to="/contact" className="text-primary-700">contact form</Link> and share the child&apos;s current target so the team can route you correctly.
                  </>
                )}
              </p>
            </div>
          </aside>
        </div>

        <section className="mt-10 rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,#101828,#1b2a46)] px-6 py-8 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100">Need a structured plan?</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">Move from questions to one clear first target</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200">
                Use the Parents Hub for step-by-step routines, or book one free 35-minute 1:1 online demo assessment class if the starting level is unclear.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link to="/parents" className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100">
                Explore Parents Hub
              </Link>
              <Link to="/book-demo" className="inline-flex items-center rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                Book Free 35-Minute Demo
              </Link>
            </div>
          </div>
        </section>
      </section>
    </div>
  );
};

export default FAQPage;
