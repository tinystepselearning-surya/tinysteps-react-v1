// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { applySeo } from '../lib/seo';
import type { FC } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import FAQAccordion, { FAQItem } from '../components/FAQ/FAQAccordion';
// Meta removed — use applySeo as single source of truth

const items: FAQItem[] = [
  { id: 'q1', category: 'phonics', question: 'How to teach phonics to my child at home?', answer: 'Start with sound recognition (not letter names). Use SATPIN sequence first, then blend into words like sat/pin/tap. Keep sessions short (10–15 minutes) and playful with games rather than worksheets. Best age: 3–4. Common mistake: teaching letter names first.' , relatedBlog: '/blog/parents-guide-phonics', relatedCourse: '/courses' },
  { id: 'q2', category: 'phonics', question: "Why can't my child blend sounds even though he knows phonics?", answer: 'Blending is a separate skill from recognizing sounds. Teach slow blending (c—a—t) then fast blending (cat). Expect 4–6 lessons to master. Practice with CVC Builder and minimal pairs. We target this around Lesson 4 explicitly.', relatedBlog: '/blog/why-blending-is-hard', relatedCourse: '/courses' },
  { id: 'q3', category: 'phonics', question: 'What is the difference between phonics and sight words?', answer: 'Phonics decodes using rules (c‑a‑t); sight words are memorized exceptions (the, was). Start with phonics since ~70% of words are decodable, then add sight words. Our curriculum teaches tricky words in the later lessons.', relatedBlog: '/blog/phonics-vs-sight-words', relatedCourse: '/courses' },
  { id: 'q4', category: 'phonics', question: 'My 7-year-old struggles with reading. Is it too late for phonics?', answer: 'Not too late. With intensive phonics and gap analysis, 20–30 lessons usually close core gaps. We identify specific needs (sounds, blending, long vowels) and focus there. Consistency drives success.' },
  { id: 'q5', category: 'phonics', question: "How do I teach tricky words like 'said', 'come', 'there'?", answer: 'Use spaced repetition and context. Pair with rhyming (said/paid), use in sentences, daily for 2 weeks then periodic refresh. We teach 40+ tricky words across levels with games and applied reading.' },
  { id: 'q6', category: 'phonics', question: 'Should my child learn phonics before starting school?', answer: 'Optional but helpful. A 30‑lesson foundation course 6 months prior to school builds confidence. Start with SATPIN sounds and 10‑minute daily practice.' },
  { id: 'q7', category: 'phonics', question: 'My child can read but has no comprehension. Why?', answer: 'Decoding ≠ comprehension. If most effort goes into sounding out, little is left for understanding. Build fluency and add comprehension questions. Our Advanced Phonics ends with 150–300‑word passages + Q&A.' },
  { id: 'q7a', category: 'phonics', question: 'What are the best online phonics classes in India?', answer: 'The best program depends on your child\'s age, current reading level, and learning style. Look for systematic phonics (SATPIN or Jolly Phonics), 1:1 personalized feedback, decodable reading practice, and transparent progress tracking. Tiny Steps offers all of these with flexible scheduling and stage-based parent updates. <a href="/best-online-phonics-classes-india" class="text-tiny-blue-600 hover:underline">Read our buyer guide</a> for a 10-point checklist to evaluate programs and make an informed choice.' },
  { id: 'q8', category: 'grammar', question: 'How to teach grammar to kids without boring them?', answer: 'Use games (Sentence Dice, Grammar Bingo, Picture prompts) and "mistakes games" instead of lectures. We keep sessions ~70% active practice, 30% instruction.' },
  { id: 'q9', category: 'grammar', question: "My child mixes up 'is' and 'are'. How do I explain?", answer: 'One person = is; multiple = are. Use visuals: 1 stick figure → is; 3 figures → are. We target this in Basic Grammar around Lesson 10 with concrete‑to‑abstract scaffolding.' },
  { id: 'q10', category: 'grammar', question: 'When should children learn tenses? Is my 5-year-old too young?', answer: 'Ages 5–6: simple tenses (played/plays/will play). Ages 8+: complex tenses. We cover simple tenses in Basic Grammar Stage 6 (Lessons 31–36) and deepen them in Advanced Grammar Stage 1–2 (Lessons 1–12).' },
  { id: 'q11', category: 'grammar', question: 'How to stop grammar mistakes in writing?', answer: 'Internalize via output. Have child rewrite own sentences correctly, do peer editing games, and daily short writing. Our levels progress from sentences → paragraphs → stories with mastery checks.' },
  { id: 'q12', category: 'grammar', question: "My 8-year-old speaks well but can't write sentences. Why?", answer: 'Speaking and writing are different skills. Bridge with “speak first, write second”: record, then transcribe. Our Grammar path uses Speak → Write progression to reduce friction.' },
  { id: 'q13', category: 'speaking', question: 'My child is too shy to speak in public. How can I help?', answer: 'Start small with 15‑second safe talks at home, then expand. Celebrate effort, not perfection. Our first 4–6 lessons focus on confidence only. 90% of shy kids become confident within 16–20 lessons.' },
  { id: 'q14', category: 'speaking', question: 'How do I encourage class participation?', answer: 'At home, ask open‑ended questions and let them ramble. Praise participation over correctness. We teach S.P.E.A.K. habits that generalize to classrooms within 8–12 lessons.' },
  { id: 'q15', category: 'speaking', question: "How long should a child's speech be?", answer: 'Ages 4–7: 15–45s. Ages 7–10: 60–120s. Ages 10+: 3–5 minutes. We never force length; we scaffold duration across levels.' },
  { id: 'q16', category: 'speaking', question: 'My child mumbles and speaks too fast. How to slow down?', answer: 'Treat clarity and pace separately. Mirror pronunciation for mumbling; teach pause gestures to slow pace. Our Advanced Lesson 10 focuses on vocal variety + pacing.' },
  { id: 'q17', category: 'speaking', question: 'How to lose the Indian accent?', answer: 'Accent isn’t a problem—clarity is. Target unclear sounds (R/L/TH/W‑V). We train clarity + rhythm; accent shifts naturally with exposure.' },
  { id: 'q18', category: 'speaking', question: 'Nervous during presentations—any tips?', answer: 'Practice 5+ times, know content, breathe (3 deep breaths), focus on 1 friendly face. Our capstones start low‑pressure with teacher + parent before larger settings.' },
  { id: 'q19', category: 'online', question: 'Is online learning as good as offline?', answer: 'For English, 1:1 online often outperforms batch offline: personalization, recordings, flexibility, global teachers. Offline offers socialization. For serious skill gains, 1:1 online wins.' },
  { id: 'q20', category: 'online', question: 'How do I ensure my child is actually learning online?', answer: 'Demand transparency: stage-based progress updates, recordings, home tasks, monthly calls, mastery bands. Tiny Steps provides all five so you can verify learning.' },
  { id: 'q21', category: 'summer', question: 'What is Summer English Camp 2026?', answer: 'A premium 10-week live summer brush-up program (April 1–June 15, 2026) combining phonics, grammar, and public speaking for ages 4–12. It follows the same Tiny Steps curriculum in a focused small-group format.' },
  { id: 'q22', category: 'summer', question: 'What ages is the camp for?', answer: 'Ages 4–12. We split into cohorts: Foundation (4–5), Core (6–7), Intermediate (8–10), Advanced (10–12). Each learns at their level.' },
  { id: 'q23', category: 'summer', question: 'What will my child learn in the summer camp?', answer: 'Phonics: letter sounds to fluent reading. Grammar: sentence structure, punctuation, parts of speech. Public Speaking: confidence, clarity, storytelling. Plus guided class activities, effective worksheets, and class recordings for revision.' },
  { id: 'q24', category: 'summer', question: 'Is summer camp group-based?', answer: 'Yes. Summer camp is group-focused and capped at 8 students per batch for stronger participation and teacher attention. Check the <a href="/summer-camps#programs" class="text-tiny-green-600">summer camps page</a> for the latest batch options.' },
  { id: 'q25', category: 'summer', question: 'When is the camp and what are the fees?', answer: 'Camp runs April 1–June 15, 2026 (10 weeks). Summer Camp Fast Track Pack list fee is ₹5,000 per child. Effective price: ₹2,400 per child. <a href="/summer-camps" class="text-tiny-green-600">Visit the summer camps page</a> for details.' },
  { id: 'q26', category: 'summer', question: 'How do I enroll or book an assessment for summer camp?', answer: 'Use the <a href="/summer-camps" class="text-tiny-green-600">summer camps page</a> to pick your batch and enroll. You can also use the <a href="/contact" class="text-tiny-blue-600">contact form</a> and we’ll help with placement within 12 hours.' },
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

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer
    },
    // Speakable for voice assistants
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['.faq-question', '.faq-answer'],
      xpath: ['//h3[@class="faq-question"]', '//p[@class="faq-answer"]'],
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

  useEffect(() => {
    applySeo({
      title: 'FAQs | Tiny Steps Learning (Phonics, Grammar & Public Speaking)',
      description: 'Answers to common parent questions: phonics blending, tricky words, grammar basics, class format, scheduling, fees & progress tracking at Tiny Steps.',
      canonicalPath: '/faq',
      robots: 'index, follow',
      jsonLd: [breadcrumbSchema, faqSchema],
    });
  }, []);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchCategory = selected === 'all' || item.category === selected;
      const term = search.trim().toLowerCase();
      const matchSearch = !term || item.question.toLowerCase().includes(term) || item.answer.toLowerCase().includes(term);
      return matchCategory && matchSearch;
    });
  }, [selected, search]);

  const { user } = useAuthStore();

  return (
    <div className="page-gradient min-h-screen">
      {/* Meta removed — SEO handled by applySeo in useEffect */}
      <section className="px-6 pt-24 pb-10">
        <div className="mx-auto max-w-4xl glass-panel soft-grid px-8 py-10 text-center">
          <div className="gradient-chip mx-auto w-max">Help centre</div>
          <h1 className="mt-3 text-3xl font-bold text-gray-900">Frequently Asked Questions</h1>
          <p className="mt-3 text-gray-600">Everything Indian parents ask about phonics, grammar, speaking, trial classes, payments, and results.</p>
          <div className="mt-6">
            <input className="interactive-input" placeholder="Search questions..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="mb-6 flex flex-wrap gap-3">
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => setSelected(cat.id)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${selected===cat.id?'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg':'bg-white/90 text-gray-700 hover:bg-white'}`}>
              {cat.label}
            </button>
          ))}
        </div>
        <FAQAccordion items={filtered} />
          <div className="mt-10 rounded-3xl bg-white/80 p-6 text-sm text-gray-700 shadow-card-hover">
          <div className="font-semibold text-gray-900">Still have questions?</div>
          <p className="mt-2">{!user ? (
              <>Message us on <a href="https://wa.me/919618398383" target="_blank" rel="noopener noreferrer" className="text-tiny-green-600">WhatsApp - opens new window</a> or <a href="/contact" className="text-tiny-blue-600">use the contact form</a>. We’ll send personalised recommendations within 12 hours.</>
            ) : (
              <>Message our support team via <a href="/contact" className="text-tiny-blue-600">Contact form</a>. We’ll respond within 12 hours.</>
            )}</p>
        </div>
      </section>
    </div>
  );
};

export default FAQPage;
