import { useEffect, useState } from 'react';
import { applySeo } from '../../lib/seo';
import { Link } from 'react-router-dom';
import AdvisorContactForm from '../../components/common/AdvisorContactForm';

const WHATSAPP_NUMBER = '919618398383';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi! I want to know more about Summer English Camp 2026.')}`;
const QUICK_ANSWERS = [
  { label: 'Dates', value: 'April 1–June 15, 2026 (10 weeks)' },
  { label: 'Fees', value: 'Tiny Steps Standard and Tiny Steps Ultra Premium pricing; shared after assessment' },
  { label: 'Age group', value: 'Ages 3–12' },
  { label: 'Format', value: 'Live online (group classes or 1:1)' },
  { label: 'Daily time', value: '45-minute live class + 10–15 minutes practice' },
  { label: 'Outcomes', value: 'Reading fluency, grammar confidence, clear speaking' },
];
const STRETCH_CARDS = [
  {
    id: 'curriculum',
    title: 'Structured Curriculum',
    desc: 'Stage-wise phonics path + clear outcomes.',
    cta: 'See curriculum',
    href: '/curriculum',
  },
  {
    id: 'live',
    title: 'Live Interactive Classes',
    desc: '35–40 min sessions with trained teachers.',
    cta: 'How classes work',
    href: '/curriculum',
  },
  {
    id: 'progress',
    title: 'Parent Progress Updates',
    desc: 'Weekly insights + next steps for practice.',
    cta: 'Open Mission shell',
    href: '/kids/games/english-excellence',
  },
  {
    id: 'camp',
    title: 'Summer Camp Highlights',
    desc: 'Daily speaking prompts + reading + fun activities.',
    cta: 'View camp plan',
    href: '/summer-camps#programs',
  },
];

// Single source of truth for FAQ data
const FAQS = [
  {
    question: 'Is the Summer Camp 100% online?',
    answer: 'Yes, the entire camp is conducted online via live Zoom sessions with experienced mentors. Each child attends daily 45-minute classes from the comfort of home. All learning materials, practice activities, and progress reports are accessible through our online platform. No physical attendance required.'
  },
  {
    question: 'Is this camp for complete beginners?',
    answer: "Yes! We welcome children with zero English knowledge. Our mentors assess each child's level during the free trial and tailor lessons accordingly. Beginners start with basic sounds and simple words."
  },
  {
    question: 'How many hours per day is the camp?',
    answer: 'Each child attends one 45-minute live class per day, plus 10–15 minutes of self-paced practice games. Total daily commitment is approximately 60 minutes.'
  },
  {
    question: 'Are classes 1:1 or group-based?',
    answer: "We offer both formats. 1:1 classes provide maximum personalization. Small group classes (2–4 children of similar age and level) add peer interaction. You can choose based on your child's learning style."
  },
  {
    question: 'What if my child misses a class?',
    answer: 'Missed classes can be rescheduled within the same week subject to mentor availability. We record key concepts so your child can review missed content before the next session.'
  },
  {
    question: 'Can I enroll my child for only phonics or only speaking?',
    answer: "The camp is designed as an integrated program covering all three skills for maximum impact. However, mentors can emphasize specific areas based on your child's needs."
  },
  {
    question: 'What devices do we need?',
    answer: 'A laptop, tablet, or smartphone with stable internet and a working camera/microphone. We recommend a laptop or tablet for the best interactive experience. No special software required—classes run in your browser.'
  },
  {
    question: 'How much does the camp cost?',
    answer: 'Fees follow Tiny Steps Standard (classes with expert Indian teachers) and Tiny Steps Ultra Premium (classes with native English-speaking teachers). Final recommendations are shared after a short assessment to match the right level.'
  },
  {
    question: 'Will my child get a certificate at the end?',
    answer: 'Yes! Every child who completes the camp receives a digital certificate of achievement, a personalized progress portfolio, and a showcase video highlighting their best work during the 10 weeks.'
  },
  {
    question: 'What happens after the camp ends?',
    answer: 'Most families continue with our regular ongoing programs to maintain momentum. We provide a clear learning roadmap so your child can transition smoothly into term-based courses.'
  },
  {
    question: 'Can international students join?',
    answer: 'Absolutely! We welcome families from any country. Classes can be scheduled across time zones. Families join us from 15+ countries. Our program is 100% online, so children can attend from anywhere in the world.'
  }
];

// Schemas with entity linking
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://tinystepslearning.com/#organization',
  name: 'Tiny Steps Learning',
  url: 'https://tinystepslearning.com',
  logo: 'https://tinystepslearning.com/logo.png',
  sameAs: [
    'https://www.facebook.com/tinystepslearning',
    'https://www.instagram.com/tinystepslearning'
  ]
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  '@id': 'https://tinystepslearning.com/summer-english-camp-2026#breadcrumb',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
    { '@type': 'ListItem', position: 2, name: 'Summer English Camp 2026', item: 'https://tinystepslearning.com/summer-english-camp-2026' },
  ],
};

const webPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': 'https://tinystepslearning.com/summer-english-camp-2026#webpage',
  url: 'https://tinystepslearning.com/summer-english-camp-2026',
  name: 'Online Summer English Camp 2026 | Ages 3–12 | Tiny Steps Learning',
  description: '10-week online summer camp for kids ages 3–12. Build reading fluency, grammar confidence, and speaking skills through daily live classes with expert mentors.',
  inLanguage: 'en-IN',
  publisher: {
    '@id': 'https://tinystepslearning.com/#organization'
  },
  about: {
    '@id': 'https://tinystepslearning.com/#organization'
  },
  breadcrumb: {
    '@id': 'https://tinystepslearning.com/summer-english-camp-2026#breadcrumb'
  }
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': 'https://tinystepslearning.com/summer-english-camp-2026#faqpage',
  mainEntity: FAQS.map(faq => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer
    }
  }))
};

function StretchCardsRow() {
  const [activeId, setActiveId] = useState<string>(STRETCH_CARDS[0].id);

  return (
    <div className="flex flex-col gap-4 md:flex-row">
      {STRETCH_CARDS.map((card) => {
        const isActive = activeId === card.id;
        return (
          <Link
            key={card.id}
            to={card.href}
            onMouseEnter={() => setActiveId(card.id)}
            onFocus={() => setActiveId(card.id)}
            onClick={(event) => {
              if (typeof window !== 'undefined') {
                const prefersTap = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
                if (prefersTap && !isActive) {
                  event.preventDefault();
                  setActiveId(card.id);
                }
              }
            }}
            className={`relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm transition-all duration-300 ${isActive ? 'md:flex-[2_1_0%]' : 'md:flex-[1_1_0%] opacity-90 hover:opacity-100'}`}
          >
            <div className="flex h-full flex-col gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{card.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{card.desc}</p>
              </div>
              <div className="mt-auto text-sm font-semibold text-[#4a7c2c]">
                {card.cta} →
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default function SummerCamp2026Page() {
  useEffect(() => {
    applySeo({
      title: "Online Summer English Camp 2026 | Ages 3–12 | Phonics, Grammar & Speaking | Tiny Steps",
      description: "10-week online summer camp for kids ages 3–12. Build reading fluency, grammar confidence, and speaking skills through daily live classes with expert mentors. Limited seats available.",
      canonicalPath: "/summer-english-camp-2026",
      ogType: "website",
      jsonLd: [organizationSchema, breadcrumbSchema, webPageSchema, faqSchema],
    });
  }, []);

  return (
    <>
      <div className="container mx-auto px-6 pt-12 pb-24 md:pb-12 max-w-5xl">
        {/* Hero Section */}
        <section className="mb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-[#2d5016] mb-4">
            Summer English Camp 2026
          </h1>
        <p className="text-xl md:text-2xl text-gray-700 mb-6 max-w-3xl mx-auto">
          Give your child a head start with <strong>confident reading, clear speaking, and strong grammar</strong> in 10 weeks
        </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            <Link
              to="/?book=1"
              className="inline-block bg-[#4a7c2c] hover:bg-[#2d5016] text-white font-bold py-3 px-8 rounded-lg transition"
            >
              Book Free Assessment
            </Link>
            <a
              href="#camp-advisor-form"
              className="inline-block border-2 border-[#4a7c2c] text-[#4a7c2c] hover:bg-[#4a7c2c] hover:text-white font-bold py-3 px-8 rounded-lg transition"
            >
              Send an email inquiry
            </a>
          </div>
        <p className="mb-3 text-sm text-gray-500">
          Prefer WhatsApp?{' '}
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#4a7c2c] underline">
            Chat on WhatsApp - opens new window
          </a>
        </p>
        <p className="text-sm text-gray-500">Limited seats • Ages 3–12 • Group classes + 1:1 options</p>
      </section>

      <section className="mb-12">
        <div className="mb-6 flex flex-col gap-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#4a7c2c]">Quick Highlights</p>
          <h2 className="text-2xl md:text-3xl font-bold text-[#2d5016]">Why families choose this camp</h2>
          <p className="text-sm text-gray-600">
            Tap a card to expand on mobile, or hover on desktop.
          </p>
        </div>
        <StretchCardsRow />
      </section>

      {/* AEO Direct Answer Block */}
      <section className="mb-12 bg-blue-50 border-l-4 border-[#4a7c2c] p-6 rounded-lg">
        <h2 className="text-lg font-bold text-[#2d5016] mb-2">What is Summer English Camp 2026?</h2>
        <p className="text-gray-700 leading-relaxed">
          Summer English Camp 2026 is a 10-week online program for children ages 3–12 following our core curriculum in phonics, grammar, and public speaking. Children attend live mentor-led classes with guided practice and stage-based progress updates for parents. Group classes are the default, with Standard and Ultra Premium teaching options.
        </p>
      </section>

      {/* Quick Answers */}
      <section className="mb-12 bg-white border border-gray-200 p-6 rounded-lg">
        <h2 className="text-xl font-bold text-[#2d5016] mb-4">Quick answers (for parents)</h2>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
          {QUICK_ANSWERS.map(item => (
            <div key={item.label} className="flex items-start gap-2">
              <span className="text-[#4a7c2c] font-bold">✓</span>
              <div>
                <p className="font-semibold text-gray-900">{item.label}</p>
                <p>{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Online-only + Global Availability */}
      <section className="mb-12 bg-blue-50 border-l-4 border-[#4a7c2c] p-6 rounded-lg">
        <h2 className="text-lg font-bold text-[#2d5016] mb-3">Online-only • Open Worldwide</h2>
        <ul className="space-y-2 text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-[#4a7c2c] font-bold">✓</span>
            <span><strong>100% online summer camp (live mentor-led)</strong> — All classes are conducted via Zoom with real-time interaction, screen sharing, and personalized feedback.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#4a7c2c] font-bold">✓</span>
            <span><strong>Open to children worldwide (15+ countries)</strong> — Families from India, USA, UK, UAE, Singapore, Australia, and more have joined our programs. Time slots are flexible to accommodate different time zones.</span>
          </li>
        </ul>
      </section>

      {/* Camp Dates */}
      <section className="mb-12 bg-yellow-50 border border-yellow-300 p-6 rounded-lg">
        <h2 className="text-2xl font-bold text-[#2d5016] mb-3">📅 Camp Dates</h2>
        <p className="text-gray-700 mb-2">
          <strong>When:</strong> April 1–June 15, 2026
        </p>
        <p className="text-gray-700 mb-2">
          <strong>Duration:</strong> 10 weeks, daily live classes
        </p>
        <p className="text-sm text-gray-600 mt-4">
          💡 <strong>Early bird reservations open now.</strong> <Link to="/?book=1" className="text-[#4a7c2c] underline font-semibold">Book your free assessment</Link> to secure your child's spot before seats fill up.
        </p>
      </section>

      {/* Age Bands */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-[#2d5016] mb-6 text-center">Age Groups & Focus Outcomes</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Ages 3-5 */}
          <div className="border-2 border-[#4a7c2c] rounded-lg p-6 hover:shadow-lg transition">
            <h3 className="text-2xl font-bold text-[#4a7c2c] mb-3">Ages 3–5</h3>
            <p className="text-sm text-gray-600 mb-4 font-semibold">Foundation & Phonics</p>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li>✓ Learn SATPIN sounds and simple blending</li>
              <li>✓ Recognize and trace uppercase/lowercase letters</li>
              <li>✓ Build vocabulary with pictures and stories</li>
              <li>✓ Speak simple sentences with confidence</li>
              <li>✓ Follow instructions and participate actively</li>
            </ul>
          </div>

          {/* Ages 6-8 */}
          <div className="border-2 border-[#4a7c2c] rounded-lg p-6 hover:shadow-lg transition bg-green-50">
            <h3 className="text-2xl font-bold text-[#4a7c2c] mb-3">Ages 6–8</h3>
            <p className="text-sm text-gray-600 mb-4 font-semibold">Reading Fluency & Grammar</p>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li>✓ Master digraphs, vowel teams, and blending</li>
              <li>✓ Read short passages fluently and independently</li>
              <li>✓ Learn nouns, verbs, adjectives, and tenses</li>
              <li>✓ Write complete sentences and short paragraphs</li>
              <li>✓ Present ideas clearly in group discussions</li>
            </ul>
          </div>

          {/* Ages 9-12 */}
          <div className="border-2 border-[#4a7c2c] rounded-lg p-6 hover:shadow-lg transition">
            <h3 className="text-2xl font-bold text-[#4a7c2c] mb-3">Ages 9–12</h3>
            <p className="text-sm text-gray-600 mb-4 font-semibold">Advanced Skills & Confidence</p>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li>✓ Read age-appropriate novels and comprehend deeply</li>
              <li>✓ Master complex grammar: clauses, tenses, punctuation</li>
              <li>✓ Write essays, stories, and structured paragraphs</li>
              <li>✓ Deliver confident presentations and speeches</li>
              <li>✓ Engage in debates and Q&A with poise</li>
            </ul>
          </div>
        </div>
        <p className="text-center text-sm text-gray-600 mt-6">
          Don&apos;t see your child&apos;s exact age or skill level? <a href="#camp-advisor-form" className="text-[#4a7c2c] underline font-semibold">Use the contact form</a> or{' '}
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="text-[#4a7c2c] underline font-semibold">chat on WhatsApp - opens new window</a> for a personalized plan.
        </p>
      </section>

      {/* Daily Plan */}
      <section className="mb-12 bg-green-50 p-8 rounded-lg">
        <h2 className="text-3xl font-bold text-[#2d5016] mb-4">⏱️ Daily 45-Minute Class Structure</h2>
        <p className="text-gray-700 mb-6">
          Every session is designed for maximum engagement and learning. Here's what happens in each 45-minute class:
        </p>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-16 h-16 bg-[#4a7c2c] text-white rounded-full flex items-center justify-center font-bold text-lg">
              5min
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 mb-1">Warm-Up & Review</h3>
              <p className="text-gray-700 text-sm">
                Greet the child, review previous day's learning, and set the tone for today's session with a fun activity.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-16 h-16 bg-[#4a7c2c] text-white rounded-full flex items-center justify-center font-bold text-lg">
              15min
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 mb-1">Skill Focus (Phonics / Grammar / Speaking)</h3>
              <p className="text-gray-700 text-sm">
                Teach new sounds, grammar rules, or speaking techniques through interactive games, stories, and live examples.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-16 h-16 bg-[#4a7c2c] text-white rounded-full flex items-center justify-center font-bold text-lg">
              20min
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 mb-1">Guided Practice</h3>
              <p className="text-gray-700 text-sm">
                Child practices reading, writing, or speaking with mentor feedback. Mistakes are corrected gently in real-time.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-16 h-16 bg-[#4a7c2c] text-white rounded-full flex items-center justify-center font-bold text-lg">
              5min
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 mb-1">Recap & Next Steps</h3>
              <p className="text-gray-700 text-sm">
                Summarize key learnings, assign short practice for the next day, and celebrate progress with positive reinforcement.
              </p>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-6 bg-white p-4 rounded border border-gray-200">
          <strong>📱 Between classes:</strong> Children complete 10–15 minutes of AI-guided practice games to reinforce daily lessons.
        </p>
      </section>

      {/* Learning Outcomes */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-[#2d5016] mb-6">🎯 Measurable Learning Outcomes</h2>
        <p className="text-gray-700 mb-6">
          By the end of the 10-week camp, your child will achieve visible, measurable progress:
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="font-bold text-lg text-[#4a7c2c] mb-3">📖 Reading Fluency</h3>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li>• <strong>Beginners (3–5):</strong> Decode 20+ CVC words independently</li>
              <li>• <strong>Intermediate (6–8):</strong> Read 60+ words/minute with comprehension</li>
              <li>• <strong>Advanced (9–12):</strong> Read 100+ words/minute, understand context and inference</li>
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="font-bold text-lg text-[#4a7c2c] mb-3">🗣️ Speaking Confidence</h3>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li>• <strong>Beginners (3–5):</strong> Speak 5–10 word sentences clearly</li>
              <li>• <strong>Intermediate (6–8):</strong> Share stories and answer questions with confidence</li>
              <li>• <strong>Advanced (9–12):</strong> Deliver 2–3 minute presentations without prompts</li>
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="font-bold text-lg text-[#4a7c2c] mb-3">✏️ Grammar & Writing</h3>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li>• <strong>Beginners (3–5):</strong> Recognize nouns and verbs; trace letters correctly</li>
              <li>• <strong>Intermediate (6–8):</strong> Write 3–5 sentence paragraphs with correct tense</li>
              <li>• <strong>Advanced (9–12):</strong> Write structured essays with intro, body, and conclusion</li>
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="font-bold text-lg text-[#4a7c2c] mb-3">🧠 Phonics Mastery</h3>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li>• <strong>Beginners (3–5):</strong> Master SATPIN sounds and simple blending</li>
              <li>• <strong>Intermediate (6–8):</strong> Decode digraphs (sh, ch, th) and vowel teams (ai, oa)</li>
              <li>• <strong>Advanced (9–12):</strong> Apply phonics rules to unfamiliar multisyllabic words</li>
            </ul>
          </div>
        </div>
        <p className="text-center text-sm text-gray-600 mt-6">
          All outcomes are tracked by stage and shared with parents. <Link to="/curriculum" className="text-[#4a7c2c] underline font-semibold">Explore our full curriculum</Link> to see the complete learning pathway.
        </p>
      </section>

      {/* What Parents Get */}
      <section className="mb-12 bg-purple-50 p-8 rounded-lg">
        <h2 className="text-3xl font-bold text-[#2d5016] mb-4">👪 What Parents Get</h2>
        <div className="space-y-4">
          <div className="flex gap-4 items-start">
            <span className="text-3xl">📊</span>
            <div>
              <h3 className="font-bold text-lg text-gray-900 mb-1">Camp Progress Updates</h3>
              <p className="text-gray-700 text-sm">
                Every Friday, receive a detailed report showing skills mastered, challenges observed, and activities practiced. Know exactly where your child stands.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <span className="text-3xl">🎯</span>
            <div>
              <h3 className="font-bold text-lg text-gray-900 mb-1">Clear Next Steps</h3>
              <p className="text-gray-700 text-sm">
                Each report includes actionable recommendations: "Practice blending with these 5 words," "Read this story together," or "Encourage speaking in full sentences."
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <span className="text-3xl">💬</span>
            <div>
              <h3 className="font-bold text-lg text-gray-900 mb-1">Direct Access to Mentors</h3>
              <p className="text-gray-700 text-sm">
                Questions or concerns? Message your child's mentor anytime via the parent portal or WhatsApp. We respond within 6 working hours.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <span className="text-3xl">🏆</span>
            <div>
              <h3 className="font-bold text-lg text-gray-900 mb-1">Final Camp Certificate & Portfolio</h3>
              <p className="text-gray-700 text-sm">
                At the end of 10 weeks, your child receives a digital certificate, a showcase video of their best work, and a personalized learning portfolio to continue their journey.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section id="faqs" className="mb-12 bg-gray-50 p-8 rounded-lg">
        <h2 className="text-3xl font-bold text-[#2d5016] mb-6 text-center">Frequently Asked Questions</h2>
        <div className="space-y-6 max-w-3xl mx-auto">
          {FAQS.map((faq, index) => (
            <div key={index}>
              <h3 className="font-bold text-lg mb-2 text-gray-900">{faq.question}</h3>
              <p className="text-gray-700 text-sm">
                {faq.answer}
                {faq.question === 'Can I enroll my child for only phonics or only speaking?' && (
                  <>
                    {' '}
                    <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="text-[#4a7c2c] underline font-semibold">Contact us</a> to discuss custom options.
                  </>
                )}
                {faq.question === 'How much does the camp cost?' && (
                  <>
                    {' '}
                    <Link to="/pricing" className="text-[#4a7c2c] underline font-semibold">View Standard and Ultra Premium pricing</Link> for reference.
                  </>
                )}
                {faq.question === 'What happens after the camp ends?' && (
                  <>
                    {' '}
                    <Link to="/courses" className="text-[#4a7c2c] underline font-semibold">Explore our courses</Link> to plan ahead.
                  </>
                )}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">Still have questions?</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/faq"
              className="inline-block border-2 border-[#4a7c2c] text-[#4a7c2c] font-semibold py-3 px-6 rounded-lg hover:bg-[#4a7c2c] hover:text-white transition"
            >
              View Full FAQ
            </Link>
            <a
              href="#camp-advisor-form"
              className="inline-block bg-[#4a7c2c] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[#2d5016] transition"
            >
              Send an email inquiry
            </a>
          </div>
        </div>
      </section>
      <section id="camp-advisor-form" className="mb-12 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <AdvisorContactForm
          topic="Summer camp inquiry"
          title="Prefer email or a callback?"
          description="Share your child’s age, current level, and preferred camp timing. We will reply by email."
        />
      </section>
      {/* CTA Footer */}
        <section className="bg-[#2d5016] text-white p-8 md:p-12 rounded-lg text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Give Your Child a Confident English Summer?</h2>
          <p className="mb-6 text-lg max-w-2xl mx-auto">
            Limited seats available. Book a free assessment today to understand your child's current level and secure their spot in Summer Camp 2026.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center mb-6">
            <Link
              to="/?book=1"
              className="bg-white text-[#2d5016] hover:bg-gray-100 font-bold py-4 px-8 rounded-lg transition text-lg"
            >
              Book Free Assessment
            </Link>
            <a
              href="#camp-advisor-form"
              className="border-2 border-white text-white hover:bg-white hover:text-[#2d5016] font-bold py-4 px-8 rounded-lg transition text-lg inline-flex items-center justify-center gap-2"
            >
              Send an email inquiry
            </a>
          </div>
          <p className="mb-6 text-sm text-gray-200">
            Prefer WhatsApp?{' '}
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
              Chat on WhatsApp - opens new window
            </a>
          </p>
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <Link to="/courses" className="text-white hover:text-gray-200 underline">
              Explore Courses
            </Link>
            <span className="text-gray-400">•</span>
            <Link to="/curriculum" className="text-white hover:text-gray-200 underline">
              View Curriculum
            </Link>
            <span className="text-gray-400">•</span>
            <Link to="/phonics" className="text-white hover:text-gray-200 underline">
              Phonics Program
            </Link>
            <span className="text-gray-400">•</span>
            <Link to="/pricing" className="text-white hover:text-gray-200 underline">
              Pricing Info
            </Link>
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex items-center justify-between gap-3 rounded-t-2xl border border-gray-200 bg-white/95 px-3 py-3 shadow-lg backdrop-blur">
            <a
              href="#camp-advisor-form"
              className="flex-1 rounded-full bg-[#4a7c2c] px-4 py-2 text-center text-sm font-semibold text-white"
            >
              Contact form
            </a>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-full border-2 border-[#25D366] px-4 py-2 text-center text-sm font-semibold text-[#25D366]"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
