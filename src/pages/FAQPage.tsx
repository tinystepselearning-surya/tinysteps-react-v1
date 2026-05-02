// @ts-nocheck
import { startTransition, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { applySeo } from '../lib/seo';
import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import FAQAccordion, { FAQItem } from '../components/FAQ/FAQAccordion';
import Meta from '../components/common/Meta';
// Meta removed — use applySeo as single source of truth

const items: FAQItem[] = [
  { id: 'q1', category: 'phonics', question: 'How to teach phonics to my child at home?', answer: 'Start with sound recognition (not letter names). Use a structured synthetic phonics sequence first, then blend into words like sat/pin/tap. Keep sessions short (10–15 minutes) and playful with games rather than worksheets. Best age: 3–4. Common mistake: teaching letter names first.' , relatedBlog: '/blog/phonics-for-parents-guide', relatedCourse: '/courses' },
  { id: 'q2', category: 'phonics', question: "Why can't my child blend sounds even though he knows phonics?", answer: 'Blending is a separate skill from recognizing sounds. Teach slow blending (c—a—t) then fast blending (cat). Expect 4–6 lessons to master. Practice with CVC Builder and minimal pairs. We target this around Lesson 4 explicitly.', relatedBlog: '/blog/phonics-for-parents-guide', relatedCourse: '/courses' },
  { id: 'q3', category: 'phonics', question: 'What is the difference between phonics and sight words?', answer: 'Phonics decodes using rules (c‑a‑t); sight words are memorized exceptions (the, was). Start with phonics since ~70% of words are decodable, then add sight words. Our curriculum teaches tricky words in the later lessons.', relatedBlog: '/blog/phonics-for-parents-guide', relatedCourse: '/courses' },
  { id: 'q4', category: 'phonics', question: 'My 7-year-old struggles with reading. Is it too late for phonics?', answer: 'Not too late. With intensive phonics and gap analysis, 20–30 lessons usually close core gaps. We identify specific needs (sounds, blending, long vowels) and focus there. Consistency drives success.', relatedBlog: '/blog/phonics-for-parents-guide' },
  { id: 'q5', category: 'phonics', question: "How do I teach tricky words like 'said', 'come', 'there'?", answer: 'Use spaced repetition and context. Pair with rhyming (said/paid), use in sentences, daily for 2 weeks then periodic refresh. We teach 40+ tricky words across levels with games and applied reading.', relatedBlog: '/blog/week-3-phonics-tricky-words' },
  { id: 'q6', category: 'phonics', question: 'Should my child learn phonics before starting school?', answer: 'Optional but helpful. A 30‑lesson foundation course 6 months prior to school builds confidence. Start with SATPIN sounds and 10‑minute daily practice.', relatedBlog: '/blog/phonics-for-parents-guide' },
  { id: 'q7', category: 'phonics', question: 'My child can read but has no comprehension. Why?', answer: 'Decoding ≠ comprehension. If most effort goes into sounding out, little is left for understanding. Build fluency and add comprehension questions. Our Advanced Phonics ends with 150–300‑word passages + Q&A.', relatedBlog: '/blog/phonics-for-parents-guide' },
  { id: 'q7a', category: 'phonics', question: 'What are the best online phonics classes in India?', answer: 'The best program depends on your child\'s age, current reading level, and learning style. Look for structured synthetic phonics, 1:1 personalized feedback, decodable reading practice, and transparent progress tracking. Tiny Steps follows a structured synthetic phonics approach inspired by methods such as Jolly Phonics, with flexible scheduling and stage-based parent updates. <a href="/best-online-phonics-classes-india" class="text-tiny-blue-600 hover:underline">Read our buyer guide</a> for a 10-point checklist to evaluate programs and make an informed choice.' },
  { id: 'q7b', category: 'phonics', question: 'Does Tiny Steps use Jolly Phonics?', answer: 'Tiny Steps uses a structured synthetic phonics approach inspired by methods such as Jolly Phonics. We include sound-to-letter mapping, blending sounds into words, and phonics-based reading routines in a level-based pathway.', relatedBlog: '/blog/phonics-for-parents-guide', relatedCourse: '/phonics' },
  { id: 'q8', category: 'grammar', question: 'How to teach grammar to kids without boring them?', answer: 'Use games (Sentence Dice, Grammar Bingo, Picture prompts) and "mistakes games" instead of lectures. We keep sessions ~70% active practice, 30% instruction.', relatedBlog: '/blog/week-7-grammar-nouns-to-paragraphs', relatedCourse: '/grammar' },
  { id: 'q9', category: 'grammar', question: "My child mixes up 'is' and 'are'. How do I explain?", answer: 'One person = is; multiple = are. Use visuals: 1 stick figure → is; 3 figures → are. We target this in Basic Grammar around Lesson 10 with concrete‑to‑abstract scaffolding.', relatedBlog: '/blog/week-7-grammar-nouns-to-paragraphs', relatedCourse: '/grammar' },
  { id: 'q10', category: 'grammar', question: 'When should children learn tenses? Is my 5-year-old too young?', answer: 'Ages 5–6: simple tenses (played/plays/will play). Ages 8+: complex tenses. We cover simple tenses in Basic Grammar Stage 6 (Lessons 31–36) and deepen them in Advanced Grammar Stage 1–2 (Lessons 1–12).', relatedBlog: '/blog/week-8-grammar-tenses', relatedCourse: '/grammar' },
  { id: 'q11', category: 'grammar', question: 'How to stop grammar mistakes in writing?', answer: 'Internalize via output. Have child rewrite own sentences correctly, do peer editing games, and daily short writing. Our levels progress from sentences → paragraphs → stories with mastery checks.', relatedBlog: '/blog/week-20-grammar-editing-camp', relatedCourse: '/grammar' },
  { id: 'q12', category: 'grammar', question: "My 8-year-old speaks well but can't write sentences. Why?", answer: 'Speaking and writing are different skills. Bridge with “speak first, write second”: record, then transcribe. Our Grammar path uses Speak → Write progression to reduce friction.', relatedBlog: '/blog/week-7-grammar-nouns-to-paragraphs', relatedCourse: '/grammar' },
  { id: 'q13', category: 'speaking', question: 'My child is too shy to speak in public. How can I help?', answer: 'Start small with 15‑second safe talks at home, then expand. Celebrate effort, not perfection. Our first 4–6 lessons focus on confidence only. 90% of shy kids become confident within 16–20 lessons.', relatedBlog: '/blog/week-12-speaking-confidence-seeds', relatedCourse: '/speaking' },
  { id: 'q14', category: 'speaking', question: 'How do I encourage class participation?', answer: 'At home, ask open‑ended questions and let them ramble. Praise participation over correctness. We teach S.P.E.A.K. habits that generalize to classrooms within 8–12 lessons.', relatedBlog: '/blog/week-12-speaking-confidence-seeds', relatedCourse: '/speaking' },
  { id: 'q15', category: 'speaking', question: "How long should a child's speech be?", answer: 'Ages 4–7: 15–45s. Ages 7–10: 60–120s. Ages 10+: 3–5 minutes. We never force length; we scaffold duration across levels.', relatedBlog: '/blog/week-13-speaking-structure', relatedCourse: '/speaking' },
  { id: 'q16', category: 'speaking', question: 'My child mumbles and speaks too fast. How to slow down?', answer: 'Treat clarity and pace separately. Mirror pronunciation for mumbling; teach pause gestures to slow pace. Our Advanced Lesson 10 focuses on vocal variety + pacing.', relatedBlog: '/blog/week-18-speaking-video-feedback', relatedCourse: '/speaking' },
  { id: 'q17', category: 'speaking', question: 'How to lose the Indian accent?', answer: 'Accent isn’t a problem—clarity is. Target unclear sounds (R/L/TH/W‑V). We train clarity + rhythm; accent shifts naturally with exposure.', relatedBlog: '/blog/week-12-speaking-confidence-seeds', relatedCourse: '/speaking' },
  { id: 'q18', category: 'speaking', question: 'Nervous during presentations—any tips?', answer: 'Practice 5+ times, know content, breathe (3 deep breaths), focus on 1 friendly face. Our capstones start low‑pressure with teacher + parent before larger settings.', relatedBlog: '/blog/week-21-speaking-competition-prep', relatedCourse: '/speaking' },
  { id: 'q19', category: 'online', question: 'Is online learning as good as offline?', answer: 'For English, 1:1 online often outperforms batch offline: personalization, recordings, flexibility, global teachers. Offline offers socialization. For serious skill gains, 1:1 online wins.' },
  { id: 'q20', category: 'online', question: 'How do I ensure my child is actually learning online?', answer: 'Demand transparency: stage-based progress updates, recordings, home tasks, monthly calls, mastery bands. Tiny Steps provides all five so you can verify learning.' },
  { id: 'q21', category: 'summer', question: 'What is Tiny Steps Summer Camp 2026?', answer: 'Tiny Steps Summer Camp 2026 is a structured online summer season for ages 4–12 running from 27 April 2026 to 13 June 2026. Each child joins one separate 4-week batch with 24 live classes from Monday to Saturday and Sunday kept as a holiday. Parents choose one track-specific batch: Phonics Fast Track, Grammar Fast Track, or Speaking Fast Track.' },
  { id: 'q22', category: 'summer', question: 'What ages is the camp for?', answer: 'Ages 4–12. We split into cohorts: Foundation (4–5), Core (6–7), Intermediate (8–10), Advanced (10–12). Each learns at their level.' },
  { id: 'q23', category: 'summer', question: 'What will my child learn in the summer camp?', answer: 'Children build stronger phonics foundations, cleaner grammar usage, better reading confidence, and more natural communication through live guided practice. The program also includes worksheets, class recordings, and a quick level check before placement.' },
  { id: 'q24', category: 'summer', question: 'Is summer camp group-based?', answer: 'Yes. Summer camp is group-focused and capped at 8 students per batch for stronger participation and teacher attention. Check the <a href="/summer-camps#programs" class="text-tiny-green-600">summer camps page</a> for the latest track options.' },
  { id: 'q25', category: 'summer', question: 'When does the camp start and what is the schedule?', answer: 'The Summer Camp season runs from 27 April 2026 to 13 June 2026. Each child joins one 4-week batch with 24 live classes from Monday to Saturday, and Sunday is kept as a holiday. <a href="/summer-camps" class="text-tiny-green-600">Visit the summer camps page</a> for the full snapshot.' },
  { id: 'q25a', category: 'summer', question: 'Are there multiple batch start dates?', answer: 'Yes. Available batch start dates are 27 April, 4 May, 11 May and 18 May 2026. Parents can choose the best-fit start date based on their child’s holiday plans and readiness.' },
  { id: 'q25b', category: 'summer', question: 'Will the camp finish before school reopens?', answer: 'Yes. The final batch starts on 18 May 2026 and is designed to close by 13 June 2026, before schools reopen on 15 June 2026.' },
  { id: 'q26', category: 'summer', question: 'How do I enroll or book an assessment for summer camp?', answer: 'Use the <a href="/summer-camps" class="text-tiny-green-600">summer camps page</a> to choose from the available batch start dates and enquire or enroll. Parents can book a quick level check before joining, or use the <a href="/contact" class="text-tiny-blue-600">contact form</a> for help with placement.' },
  { id: 'q27', category: 'pricing', question: 'What class packages do you offer?', answer: 'We offer two formats. Tiny Steps Standard (classes with expert Indian teachers): 1:1 starts at ₹400/class, with 12/16/24 class monthly plans. Tiny Steps Ultra Premium (classes with native English-speaking teachers): 1:1 is ₹1,899/class or ₹22,799 for 12 classes, and group options are available from ₹1,099 to ₹599 per child per class based on batch size. See the <a href="/pricing" class="text-tiny-green-600">pricing page</a> for the full comparison.' },
  { id: 'q28', category: 'pricing', question: 'Do you offer a free trial or assessment?', answer: 'Yes. Every child gets a free 20-minute assessment where our mentor evaluates English level, learning style, and goals. No obligation or credit card needed.' },
  { id: 'q29', category: 'pricing', question: 'What payment methods do you accept?', answer: 'Bank transfer (manual), UPI, and automated subscription (autopay). All payments are secure and receipted. Invoices sent automatically after each transaction.' },
  { id: 'q30', category: 'pricing', question: 'Do you provide invoices and receipts?', answer: 'Yes. Invoices and GST receipts sent via email after every payment. Keep them for records or reimbursement.' },
  { id: 'q31', category: 'pricing', question: 'What if I need to reschedule or cancel?', answer: 'Reschedule anytime with 24-hour notice via WhatsApp or dashboard. Cancellation policy: refund unused classes if cancelled 7+ days before class date. Specific terms vary by package—check your agreement.' },
  { id: 'q32', category: 'pricing', question: 'Can I pause my package during travel or exams?', answer: 'Yes, you can pause for up to 30 days per calendar year. Classes don\'t expire during pause. Email Priya@tinystepslearning.com to request.' },
  { id: 'q33', category: 'timings', question: 'Are classes available in Hyderabad?', answer: 'Yes! Our classes are fully online, so they\'re available in Hyderabad and anywhere else in India or globally. You just need internet and a device.' },
  { id: 'q34', category: 'timings', question: 'Do you have weekend batches?', answer: 'Yes. Weekend slots fill up fast. Book early for Saturday/Sunday preferences. <a href="/contact" class="text-tiny-blue-600">Contact us</a> to check current availability.' },
  { id: 'q35', category: 'timings', question: 'Do you offer evening or early-morning slots for international parents?', answer: 'We offer slots across time zones from 6 AM to 9 PM IST. For UK/US parents, we have early morning or late evening IST options. <a href="/contact" class="text-tiny-blue-600">Contact us</a> for the latest schedule.' },
  { id: 'q36', category: 'timings', question: 'What platform do you use for online classes?', answer: 'We use Zoom for live sessions. No app download needed; join via browser link. Meetings are secure and recorded (optional) for reference.' },
  { id: 'q37', category: 'timings', question: 'Do parents need to sit with the child during class?', answer: 'Ages 3–5: Yes, recommend initial presence for technical support. Ages 6+: Not required, but optional. Some parents observe to reinforce at home; others step away. Your choice. We\'ll advise during the assessment.' },
];

const categories = [
  { id: 'all', label: 'All' },
  { id: 'phonics', label: 'Phonics' },
  { id: 'grammar', label: 'Grammar' },
  { id: 'speaking', label: 'Public Speaking' },
  { id: 'online', label: 'Online Learning' },
  { id: 'summer', label: 'Summer Camp 2026' },
  { id: 'pricing', label: 'Pricing & Payments' },
  { id: 'timings', label: 'Hyderabad & Timings' }
];

const quickRoutes = [
  {
    title: 'Phonics for parents',
    detail: 'What phonics is, why it matters, and how to teach it at home.',
    to: '/blog/phonics-for-parents-guide',
  },
  {
    title: 'SATPIN week 1 plan',
    detail: 'For children who know letters but still cannot blend simple words.',
    to: '/blog/week-1-phonics-satpin-launch',
  },
  {
    title: 'Grammar basics roadmap',
    detail: 'For children who can talk but struggle to write clear sentences.',
    to: '/blog/week-7-grammar-nouns-to-paragraphs',
  },
  {
    title: 'Speaking confidence roadmap',
    detail: 'For shy, hesitant, or low-volume speakers who need calm practice.',
    to: '/blog/week-12-speaking-confidence-seeds',
  },
];

const schemaFaqItems: Array<{ question: string; answer: string }> = [
  {
    question: 'What does Tiny Steps Learning teach?',
    answer:
      'Tiny Steps teaches phonics, reading, grammar, sentence formation, communication confidence, and public speaking through structured live online classes for children.',
  },
  {
    question: 'Which age group is Tiny Steps Learning for?',
    answer:
      'Programs are designed for children aged 3 to 12 years, with level-based progression and age-appropriate learning goals.',
  },
  {
    question: 'How does the free assessment work?',
    answer:
      'The free assessment is a short one-on-one session where a mentor checks your child’s current level, learning needs, and next-step goals.',
  },
  {
    question: 'How are phonics classes structured?',
    answer:
      'Phonics classes follow a structured sequence of sounds, blending, decodable reading, and review practice so children build reading confidence step by step.',
  },
  {
    question: 'Do children also learn grammar and sentence formation?',
    answer:
      'Yes. Tiny Steps includes grammar and sentence formation pathways to help children use correct structures in speaking and writing.',
  },
  {
    question: 'How do parents track progress?',
    answer:
      'Parents receive stage-based updates, topic-level observations, and practical next steps to support learning at home.',
  },
  {
    question: 'Are classes live and interactive?',
    answer:
      'Yes. Classes are live online sessions with teacher guidance, interaction, and real-time correction based on the child’s level.',
  },
  {
    question: 'Can shy children improve communication confidence?',
    answer:
      'Yes. Shy children can improve with low-pressure guided practice, sentence support, and consistent confidence-building routines.',
  },
  {
    question: 'How are class timings handled?',
    answer:
      'Tiny Steps offers flexible online timings, including weekday and weekend options, based on teacher availability and family schedules.',
  },
  {
    question: 'How can parents book a class?',
    answer:
      'Parents can request a free assessment through the booking flow or contact support, then choose the right class plan after level guidance.',
  },
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: schemaFaqItems.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer
    }
  }))
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
      title: 'Tiny Steps FAQ | Phonics, Grammar, Speaking & English Class Questions for Parents',
      description: 'Parent FAQs on phonics, grammar, speaking confidence, online English classes, trial lessons, pricing, scheduling, and progress. Find direct answers plus the right Tiny Steps blog guides.',
      keywords: [
        'phonics questions parents ask',
        'synthetic phonics',
        'structured phonics',
        'Jolly Phonics',
        'grammar questions for kids',
        'public speaking questions for children',
        'online english classes for kids faq',
        'how to teach phonics at home',
        'why child cannot blend sounds',
      ],
      canonicalPath: '/faq',
      robots: 'index, follow',
      jsonLd: [breadcrumbSchema, faqSchema],
    });
  }, []);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchCategory = selected === 'all' || item.category === selected;
      const term = deferredSearch;
      const matchSearch = !term || item.question.toLowerCase().includes(term) || item.answer.toLowerCase().includes(term);
      return matchCategory && matchSearch;
    });
  }, [deferredSearch, selected]);

  const selectedLabel = categories.find((category) => category.id === selected)?.label || 'All';

  const relevantRoutes = useMemo(() => {
    if (selected === 'phonics') return quickRoutes.slice(0, 2);
    if (selected === 'grammar') return [quickRoutes[2]];
    if (selected === 'speaking') return [quickRoutes[3]];
    return quickRoutes;
  }, [selected]);

  const { user } = useAuthStore();
  const metaTitle = 'Tiny Steps FAQ | Phonics, Grammar, Speaking & English Class Questions for Parents';
  const metaDescription =
    'Parent FAQs on phonics, grammar, speaking confidence, online English classes, trial lessons, pricing, scheduling, and progress. Find direct answers plus the right Tiny Steps blog guides.';

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f6eee3_0%,#fbfaf7_18%,#ffffff_42%,#f4f8fc_100%)]">
      <Meta title={metaTitle} description={metaDescription} canonical="https://tinystepslearning.com/faq" jsonLd={[breadcrumbSchema, faqSchema]} />

      <section className="relative overflow-hidden border-b border-slate-800 bg-[linear-gradient(135deg,#111827_0%,#18253d_48%,#22314b_100%)] px-6 pb-14 pt-24 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(239,187,106,0.16),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(112,160,230,0.18),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_390px] lg:items-end">
            <div className="max-w-4xl">
              <div className="inline-flex items-center rounded-full border border-white/14 bg-white/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-100 backdrop-blur">
                Tiny Steps Help Centre
              </div>
              <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-[3.75rem] lg:leading-[1.04]">
                Parent questions, clear answers, and the right next article
              </h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-200">
                Use this page when you are searching how to teach phonics at home, why reading is stuck,
                how to improve grammar and writing, or how to build speaking confidence. Each answer is
                designed to route you toward the most useful Tiny Steps guide, not leave you guessing.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-200">
                <span className="rounded-full border border-white/12 bg-white/8 px-4 py-2 backdrop-blur">Direct answers across phonics, grammar, speaking, and classes</span>
                <span className="rounded-full border border-white/12 bg-white/8 px-4 py-2 backdrop-blur">Built for busy families and multilingual homes</span>
              </div>
              <div className="mt-7 max-w-xl">
                <label htmlFor="faq-search" className="sr-only">Search parent questions</label>
                <input
                  id="faq-search"
                  className="w-full rounded-full border border-white/16 bg-white/10 px-5 py-3 text-sm text-white outline-none transition placeholder:text-slate-300 focus:border-white/30 focus:bg-white/14"
                  placeholder="Search phonics, grammar, speaking, classes, pricing..."
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
                  <Link
                    key={route.title}
                    to={route.to}
                    className="group block py-4 first:pt-0 last:pb-0"
                  >
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
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">Route to the right blog</p>
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
                    Message us on <a href="https://wa.me/919618398383" target="_blank" rel="noopener noreferrer" className="text-primary-700">WhatsApp</a> or use the <Link to="/contact" className="text-primary-700">contact form</Link>. We usually reply with a practical next step within 12 hours.
                  </>
                ) : (
                  <>
                    Use the <Link to="/contact" className="text-primary-700">contact form</Link> and we&apos;ll respond with the best route for your child&apos;s current stage.
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
              <h2 className="mt-3 text-3xl font-black tracking-tight">Move from answers to action</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200">
                Use the Parents Hub for step-by-step routines, or book a free assessment if you want a level-based recommendation instead of trial and error.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link
                to="/parents"
                className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
              >
                Explore Parents Hub
              </Link>
              <Link
                to="/?book=1"
                className="inline-flex items-center rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Book Free Assessment
              </Link>
            </div>
          </div>
        </section>
      </section>
    </div>
  );
};

export default FAQPage;
