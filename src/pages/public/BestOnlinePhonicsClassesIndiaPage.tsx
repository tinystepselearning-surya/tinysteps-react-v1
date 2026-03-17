import { useEffect } from 'react';
import { applySeo } from '../../lib/seo';
import { Link } from 'react-router-dom';
import Meta from '../../components/common/Meta';
import PageHero from '../../components/common/PageHero';
import {
  formatINR,
  ONE_TO_ONE_MONTHLY_PACKAGES,
  PER_CLASS_PRICE,
  ULTRA_PREMIUM_PRICING,
} from '../../config/pricing';

export default function BestOnlinePhonicsClassesIndiaPage() {
  useEffect(() => {
    applySeo({
      title: "Best Online Phonics Classes in India (2026) — Parent Checklist | Tiny Steps Learning",
      description: "Looking for online phonics classes in India? Learn what makes classes effective, what to check before enrolling, and how Tiny Steps' 1:1 approach helps kids master reading.",
      canonicalPath: "/best-online-phonics-classes-india",
      ogType: "article",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": "Best Online Phonics Classes in India (2026) — Parent Checklist",
          "description": "A comprehensive guide for Indian parents to evaluate and choose the best online phonics classes for their children ages 3–12.",
          "author": {
            "@type": "Organization",
            "name": "Tiny Steps Learning"
          },
          "publisher": {
            "@type": "Organization",
            "name": "Tiny Steps Learning",
            "logo": {
              "@type": "ImageObject",
              "url": "https://tinystepslearning.com/logo.png"
            }
          },
          "datePublished": "2026-02-14",
          "dateModified": "2026-02-14"
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://tinystepslearning.com/"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Best Online Phonics Classes in India",
              "item": "https://tinystepslearning.com/best-online-phonics-classes-india"
            }
          ]
        },
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What age is best for online phonics classes?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Ages 3–8 are ideal for foundational phonics. Children can recognize sounds and begin blending by age 3–4. Older kids (7–12) struggling with reading benefit from intensive phonics catch-up programs. Start with a free assessment to determine the right level."
              }
            },
            {
              "@type": "Question",
              "name": "Do online phonics classes offer free trial lessons?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Most quality programs offer a free assessment or trial class. Tiny Steps provides a free 20-minute assessment where mentors evaluate your child's current level, learning style, and recommend a personalized plan. No credit card required."
              }
            },
            {
              "@type": "Question",
              "name": "What's better: 1:1 or group phonics classes?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "1:1 classes adapt to your child's pace, provide instant feedback, and finish faster (12 weeks vs 20+ weeks). Group classes cost less but work best for children who follow instructions well. For phonics mastery, 1:1 delivers better outcomes."
              }
            },
            {
              "@type": "Question",
              "name": "Which phonics curriculum is used in online classes?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Quality programs use systematic synthetic phonics (like Jolly Phonics, Letters and Sounds, or SATPIN-based). Tiny Steps uses a SATPIN-first approach with multisensory actions, blending drills, and progression aligned to IB/CBSE school expectations."
              }
            },
            {
              "@type": "Question",
              "name": "How often should my child attend phonics classes?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "2–3 sessions per week is optimal for steady progress. Daily 10-minute home practice between classes reinforces learning. Most children complete foundational phonics in 12–16 weeks with consistent attendance."
              }
            },
            {
              "@type": "Question",
              "name": "How long does it take to see reading improvement with phonics?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Many children show early gains in blending and decoding within 3–4 weeks of consistent practice (2–3 sessions per week plus daily home practice). Full reading fluency takes longer and depends on starting level, attendance consistency, and home reinforcement. Children starting from zero typically need 12–16 weeks to reach basic fluency, while catch-up learners may see faster progress in targeted areas."
              }
            },
            {
              "@type": "Question",
              "name": "Do I get progress reports for online phonics classes?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes. Quality programs provide stage-based progress updates showing mastered skills, upcoming topics, and home practice tips. Tiny Steps includes lesson recordings, mastery bands, and monthly parent calls for full transparency."
              }
            },
            {
              "@type": "Question",
              "name": "Will online classes fix my child's pronunciation?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, if the program includes explicit pronunciation coaching. Look for mentors trained in phonetic clarity (R/L/TH/W-V sounds). Tiny Steps targets Indian English clarity with live correction and pronunciation practice in every lesson."
              }
            },
            {
              "@type": "Question",
              "name": "What materials do I need for online phonics classes?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "You need a device (laptop/tablet), stable internet, and a quiet space. Quality programs provide digital materials: worksheets, flashcards, and practice games. No expensive workbooks or physical kits required."
              }
            },
            {
              "@type": "Question",
              "name": "Are online phonics teachers properly trained?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Check for teachers with phonics certifications (Jolly Phonics, TESOL, B.Ed). Tiny Steps mentors complete 40+ hours of phonics methodology training and ongoing quality reviews. All sessions are recorded for accountability."
              }
            },
            {
              "@type": "Question",
              "name": "Can international students join online phonics classes from India?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes. Online classes work globally. Tiny Steps serves families in India, UAE, Singapore, UK, and US with flexible time slots (6 AM–9 PM IST). Classes adapt to IB, CBSE, or international curriculum needs."
              }
            }
          ]
        }
      ]
    });
  }, []);

  return (
    <div className="bg-white">
      <Meta
        title="Best Online Phonics Classes in India (2026) | Tiny Steps Learning"
        description="Use this parent checklist to compare online phonics classes in India and understand what to look for before enrolling your child."
        canonical="https://tinystepslearning.com/best-online-phonics-classes-india"
      />

      <PageHero
        eyebrow="Parent Checklist"
        title="Best Online Phonics Classes in India"
        description="Use this 2026 checklist to compare teaching quality, class format, parent visibility, and curriculum fit before you enrol your child."
        badges={['India-focused checklist', 'For ages 3–12', '1:1 vs group explained']}
        actions={
          <>
            <Link
              to="/?book=1"
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Book Free Assessment
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
            >
              Contact the team
            </Link>
          </>
        }
      />

      <div className="container mx-auto max-w-4xl px-6 pb-12">

      {/* AEO Direct Answer Block */}
      <section className="mb-12 bg-blue-50 border-l-4 border-[#4a7c2c] p-6 rounded-lg">
        <h2 className="text-lg font-bold text-[#2d5016] mb-2">What are the best online phonics classes in India?</h2>
        <p className="text-gray-700 leading-relaxed">
          The best online phonics classes for Indian children provide 1:1 personalized instruction using systematic synthetic phonics (SATPIN, Jolly Phonics), live mentor feedback, stage-based progress updates, and curricula aligned to IB/CBSE standards. Tiny Steps Learning offers 1:1 online phonics, grammar, and public speaking classes for ages 3–12, combining proven methods with AI-guided practice, lesson recordings, and parent transparency—helping children master reading in 12–16 weeks with consistent practice.
        </p>
      </section>

      {/* How to Choose Checklist */}
      <section id="checklist" className="mb-12">
        <h2 className="text-3xl font-bold text-[#2d5016] mb-6">How to choose online phonics classes: parent checklist</h2>
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <p className="text-gray-700 mb-4">Before enrolling, evaluate programs using these criteria:</p>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="text-[#4a7c2c] font-bold mr-3">✓</span>
              <span><strong>Proven curriculum:</strong> Uses systematic synthetic phonics (SATPIN, Jolly Phonics, Letters and Sounds) with clear progression from sounds → blending → reading.</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#4a7c2c] font-bold mr-3">✓</span>
              <span><strong>1:1 vs group:</strong> 1:1 classes adapt to your child's pace and finish faster (12 weeks vs 20+ weeks for groups). Choose 1:1 for personalized mastery.</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#4a7c2c] font-bold mr-3">✓</span>
              <span><strong>Qualified teachers:</strong> Mentors with phonics certifications (Jolly Phonics, TESOL, B.Ed) and ongoing training. Ask about teacher qualifications upfront.</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#4a7c2c] font-bold mr-3">✓</span>
              <span><strong>Free trial/assessment:</strong> Quality programs offer a free assessment to evaluate your child's level and recommend the right starting point. No credit card required.</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#4a7c2c] font-bold mr-3">✓</span>
              <span><strong>Progress transparency:</strong> Stage-based reports showing mastered skills, upcoming topics, and home practice tips. Lesson recordings for parent review.</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#4a7c2c] font-bold mr-3">✓</span>
              <span><strong>Pronunciation focus:</strong> Explicit coaching on Indian English clarity (R/L/TH/W-V sounds). Live correction in every session, not just reading drills.</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#4a7c2c] font-bold mr-3">✓</span>
              <span><strong>Flexible scheduling:</strong> Weekend and evening slots available. Easy rescheduling with 24-hour notice. Pause option during exams or travel.</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#4a7c2c] font-bold mr-3">✓</span>
              <span><strong>Age-appropriate:</strong> Separate programs for beginners (3–5), elementary (6–8), and catch-up (7–12). Not one-size-fits-all.</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#4a7c2c] font-bold mr-3">✓</span>
              <span><strong>Home practice support:</strong> Short daily activities (5–10 min) with clear instructions for parents. Digital materials included, no expensive kits.</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#4a7c2c] font-bold mr-3">✓</span>
              <span><strong>Alignment to school curriculum:</strong> Works with IB, CBSE, ICSE, or international syllabi. Reinforces school learning, doesn't conflict with it.</span>
            </li>
          </ul>
        </div>
      </section>

      {/* What Tiny Steps Includes */}
      <section id="what-we-offer" className="mb-12 bg-green-50 p-8 rounded-lg">
        <h2 className="text-3xl font-bold text-[#2d5016] mb-4">What Tiny Steps online phonics classes include</h2>
        <p className="text-gray-700 mb-4">
          Our 1:1 live phonics program combines proven methodology with parent transparency:
        </p>
        <ul className="space-y-2 text-gray-700 ml-4">
          <li>✓ <strong>Free 20-minute assessment</strong> to evaluate current level and recommend starting point</li>
          <li>✓ <strong>Systematic SATPIN-based curriculum</strong> from letter sounds to fluent reading in 12–16 weeks</li>
          <li>✓ <strong>1:1 live sessions (25–30 min)</strong> with certified mentors trained in phonics methodology</li>
          <li>✓ <strong>AI-guided practice games</strong> (Phonics Mission, CVC Builder) for daily reinforcement</li>
          <li>✓ <strong>Stage-based progress reports</strong> showing mastered skills, upcoming topics, and home practice tips</li>
          <li>✓ <strong>Lesson recordings</strong> for parent review and quality assurance</li>
          <li>✓ <strong>Pronunciation coaching</strong> targeting Indian English clarity (R/L/TH/W-V sounds)</li>
          <li>✓ <strong>Digital materials</strong> (worksheets, flashcards, practice activities) included—no extra purchases</li>
          <li>✓ <strong>Monthly parent calls</strong> to discuss progress, answer questions, and adjust pacing</li>
          <li>✓ <strong>Flexible scheduling</strong> with weekend/evening slots and easy rescheduling</li>
        </ul>
        <div className="mt-6">
          <Link to="/phonics" className="text-[#4a7c2c] font-semibold hover:underline">
            View phonics program details →
          </Link>
        </div>
      </section>

      {/* How We Assess & Track Progress */}
      <section id="assessment-tracking" className="mb-12">
        <h2 className="text-3xl font-bold text-[#2d5016] mb-6">How we assess and track progress</h2>
        <p className="text-gray-700 mb-6">
          Transparent tracking ensures you see exactly what your child is learning each week:
        </p>
        <div className="space-y-4">
          <div className="flex items-start gap-4 bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
            <span className="text-3xl">📝</span>
            <div>
              <h3 className="font-bold text-[#2d5016] mb-1">Free initial assessment (20 min)</h3>
              <p className="text-gray-700">
                Mentor evaluates current phonics level, identifies gaps (sounds, blending, digraphs), and recommends the right starting point. No placement test anxiety—it's conversational and playful.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
            <span className="text-3xl">🎯</span>
            <div>
              <h3 className="font-bold text-[#2d5016] mb-1">Personalized learning plan</h3>
              <p className="text-gray-700">
                Based on assessment, we create a custom 12–16 week roadmap showing which sounds, blending skills, and reading milestones your child will master. Aligned to <Link to="/phonics" className="text-[#4a7c2c] hover:underline">our phonics curriculum</Link> and adapted to your child's pace.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
            <span className="text-3xl">📊</span>
            <div>
              <h3 className="font-bold text-[#2d5016] mb-1">Stage progress updates</h3>
              <p className="text-gray-700">
                After each session, you receive a detailed report: skills mastered this week, teacher notes, next week's focus, and a 5-minute home practice activity. No surprises—you always know where your child stands.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
            <span className="text-3xl">🎥</span>
            <div>
              <h3 className="font-bold text-[#2d5016] mb-1">Lesson recordings for review</h3>
              <p className="text-gray-700">
                Every session is recorded (with your permission). Rewatch anytime to see teaching methods, track pronunciation improvement, or reinforce learning at home. Full transparency and accountability.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
            <span className="text-3xl">📞</span>
            <div>
              <h3 className="font-bold text-[#2d5016] mb-1">Monthly parent check-ins</h3>
              <p className="text-gray-700">
                Schedule a call with your mentor to discuss progress, ask questions, adjust pacing, or address concerns. We adapt the plan as needed—no rigid one-size-fits-all approach.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
            <span className="text-3xl">✅</span>
            <div>
              <h3 className="font-bold text-[#2d5016] mb-1">Mastery verification and next steps</h3>
              <p className="text-gray-700">
                At the end of each level, children complete a capstone assessment (reading a short passage with comprehension questions). We provide a certificate and recommend next steps: continue to advanced phonics, transition to grammar, or add public speaking.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border-l-4 border-[#4a7c2c] rounded">
          <p className="text-gray-700">
            <strong>Result:</strong> You see measurable improvement every week. Most parents report visible progress (better blending, clearer pronunciation, increased confidence) within 4–6 sessions. <Link to="/parents/tracking-progress" className="text-[#4a7c2c] hover:underline">Learn more about tracking your child's progress</Link> or <Link to="/pricing" className="text-[#4a7c2c] hover:underline">view package options</Link>.
          </p>
        </div>
      </section>

      {/* Who It's Best For */}
      <section id="who" className="mb-12">
        <h2 className="text-3xl font-bold text-[#2d5016] mb-6">Who Tiny Steps phonics classes are best for</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="font-bold text-lg text-[#4a7c2c] mb-3">👶 Beginners (Ages 3–5)</h3>
            <p className="text-sm text-gray-700">
              Children just starting to learn letters and sounds. No prior knowledge required. We use playful games, songs, and multisensory activities to build a strong foundation.
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="font-bold text-lg text-[#4a7c2c] mb-3">📚 Elementary (Ages 6–8)</h3>
            <p className="text-sm text-gray-700">
              Children learning to read or needing to strengthen blending and fluency. We target CVC words, digraphs, tricky words, and reading comprehension with confidence-building.
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="font-bold text-lg text-[#4a7c2c] mb-3">🎯 Catch-Up (Ages 7–12)</h3>
            <p className="text-sm text-gray-700">
              Children struggling with reading despite being in school. Intensive phonics gap analysis and targeted practice closes core gaps in 8–12 weeks with 2–3 sessions per week.
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="font-bold text-lg text-[#4a7c2c] mb-3">🏠 Non-native English households</h3>
            <p className="text-sm text-gray-700">
              Families where English is not the primary language at home. Our program provides explicit instruction, pronunciation coaching, and daily practice to build strong English foundations.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section id="comparison" className="mb-12">
        <h2 className="text-3xl font-bold text-[#2d5016] mb-6">Quick comparison: 4 ways parents choose phonics support</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 bg-white shadow-sm">
            <thead>
              <tr className="bg-[#4a7c2c] text-white">
                <th className="border border-gray-300 px-4 py-3 text-left font-bold">Option</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-bold">Best for</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-bold">Watch-outs</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-bold">What to look for</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-4 py-3 font-semibold text-gray-900">1:1 online phonics school</td>
                <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">Personalized pacing, pronunciation fixes, catching up fast</td>
                <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">Higher cost; mentor quality varies widely</td>
                <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">Certified mentors, stage-based progress updates, lesson recordings</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 font-semibold text-gray-900">Small group online class</td>
                <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">Lower cost, peer motivation for social learners</td>
                <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">Fixed pace, less individual feedback, takes 20+ weeks</td>
                <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">Max 4–6 kids per group, teacher training, makeup policy</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-3 font-semibold text-gray-900">App-only / recorded course</td>
                <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">Practice drills, supplementing school, budget constraints</td>
                <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">No pronunciation correction, no live feedback, limited for beginners</td>
                <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">Structured progression, speech recognition, parent dashboard</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 font-semibold text-gray-900">Local tuition / coaching</td>
                <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">Hands-on materials, familiar local context</td>
                <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">Travel time, inconsistent methodology, harder to track progress</td>
                <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">Phonics certification, small batch size, parent updates</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-gray-700 mt-4 text-sm">
          If you want a checklist for choosing, read our buyer guide section above.
        </p>
      </section>

      {/* Pricing Approach */}
      <section id="pricing" className="mb-12 bg-blue-50 p-8 rounded-lg">
        <h2 className="text-3xl font-bold text-[#2d5016] mb-4">Pricing approach</h2>
        <p className="text-gray-700 mb-4">
          Tiny Steps offers two clear program options:
        </p>
        <div className="mb-6 rounded-xl bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-[#2d5016]">Standard Program</h3>
          <p className="mt-1 text-sm text-gray-600">Classes with expert Indian teachers</p>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            <li>• 1:1 starts at {formatINR(PER_CLASS_PRICE)} per class.</li>
            <li>• Monthly plans: Starter ({ONE_TO_ONE_MONTHLY_PACKAGES[0].classes} classes) {formatINR(ONE_TO_ONE_MONTHLY_PACKAGES[0].monthlyFee)}, Growth ({ONE_TO_ONE_MONTHLY_PACKAGES[1].classes} classes) {formatINR(ONE_TO_ONE_MONTHLY_PACKAGES[1].monthlyFee)}, Intensive ({ONE_TO_ONE_MONTHLY_PACKAGES[2].classes} classes) {formatINR(ONE_TO_ONE_MONTHLY_PACKAGES[2].monthlyFee)}.</li>
          </ul>
        </div>

        <div className="mb-4 rounded-xl border border-[#4a7c2c]/25 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-[#2d5016]">Ultra Premium Program</h3>
          <p className="mt-1 text-sm text-gray-600">Classes with native English-speaking teachers</p>
          <p className="mt-2 text-sm text-gray-700">
            For parents looking for a premium international learning experience, Tiny Steps also offers classes with native English-speaking teachers.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-sm">
              <thead>
                <tr className="bg-[#4a7c2c] text-white">
                  <th className="px-3 py-2 text-left font-semibold">Format</th>
                  <th className="px-3 py-2 text-left font-semibold">Per Class</th>
                  <th className="px-3 py-2 text-left font-semibold">12-Class Package</th>
                </tr>
              </thead>
              <tbody>
                {ULTRA_PREMIUM_PRICING.map((row, index) => (
                  <tr key={row.ratio} className={index % 2 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="border border-gray-200 px-3 py-2 font-medium text-gray-900">{row.format}</td>
                    <td className="border border-gray-200 px-3 py-2 text-gray-700">{formatINR(row.perClass)}{row.ratio === '1:1' ? '' : ' / child'}</td>
                    <td className="border border-gray-200 px-3 py-2 text-gray-700">{formatINR(row.package12)}{row.ratio === '1:1' ? '' : ' / child'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-gray-600">
            Batch availability depends on age, level, and suitable peer matching.
          </p>
        </div>

        <p className="text-gray-700">
          <Link to="/pricing" className="text-[#4a7c2c] font-semibold hover:underline">
            View detailed pricing and package options →
          </Link>
        </p>
      </section>

      {/* Internal Links Section */}
      <section id="resources" className="mb-12">
        <h2 className="text-3xl font-bold text-[#2d5016] mb-6">Related resources</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Link to="/phonics" className="border border-gray-200 rounded-lg p-4 hover:border-[#4a7c2c] hover:shadow-md transition">
            <h3 className="font-bold text-[#4a7c2c] mb-2">Phonics Program</h3>
            <p className="text-sm text-gray-700">Full curriculum details, learning outcomes, and sample lessons</p>
          </Link>
          <Link to="/courses" className="border border-gray-200 rounded-lg p-4 hover:border-[#4a7c2c] hover:shadow-md transition">
            <h3 className="font-bold text-[#4a7c2c] mb-2">All Courses</h3>
            <p className="text-sm text-gray-700">Phonics, grammar, and public speaking programs for ages 3–12</p>
          </Link>
          <Link to="/curriculum" className="border border-gray-200 rounded-lg p-4 hover:border-[#4a7c2c] hover:shadow-md transition">
            <h3 className="font-bold text-[#4a7c2c] mb-2">Curriculum</h3>
            <p className="text-sm text-gray-700">Lesson-by-lesson breakdown of what children learn at each level</p>
          </Link>
          <Link to="/?book=1" className="border border-gray-200 rounded-lg p-4 hover:border-[#4a7c2c] hover:shadow-md transition">
            <h3 className="font-bold text-[#4a7c2c] mb-2">Book Free Assessment</h3>
            <p className="text-sm text-gray-700">Get personalized recommendations and trial class details</p>
          </Link>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="mb-12">
        <h2 className="text-3xl font-bold text-[#2d5016] mb-8">Frequently asked questions</h2>
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-bold text-[#2d5016] mb-2">What age is best for online phonics classes?</h3>
            <p className="text-gray-700">
              Ages 3–8 are ideal for foundational phonics. Children can recognize sounds and begin blending by age 3–4. Older kids (7–12) struggling with reading benefit from intensive phonics catch-up programs. Start with a free assessment to determine the right level.
            </p>
          </div>

          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-bold text-[#2d5016] mb-2">Do online phonics classes offer free trial lessons?</h3>
            <p className="text-gray-700">
              Most quality programs offer a free assessment or trial class. Tiny Steps provides a free 20-minute assessment where mentors evaluate your child's current level, learning style, and recommend a personalized plan. No credit card required.
            </p>
          </div>

          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-bold text-[#2d5016] mb-2">What's better: 1:1 or group phonics classes?</h3>
            <p className="text-gray-700">
              1:1 classes adapt to your child's pace, provide instant feedback, and finish faster (12 weeks vs 20+ weeks). Group classes cost less but work best for children who follow instructions well. For phonics mastery, 1:1 delivers better outcomes.
            </p>
          </div>
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-bold text-[#2d5016] mb-2">How often should my child attend phonics classes?</h3>
            <p className="text-gray-700">
              2–3 sessions per week is optimal for steady progress. Daily 10-minute home practice between classes reinforces learning. Most children complete foundational phonics in 12–16 weeks with consistent attendance.
            </p>
          </div>

          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-bold text-[#2d5016] mb-2">How long does it take to see reading improvement with phonics?</h3>
            <p className="text-gray-700">
              Many children show early gains in blending and decoding within 3–4 weeks of consistent practice (2–3 sessions per week plus daily home practice). Full reading fluency takes longer and depends on starting level, attendance consistency, and home reinforcement. Children starting from zero typically need 12–16 weeks to reach basic fluency, while catch-up learners may see faster progress in targeted areas.
            </p>
          </div>

          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-bold text-[#2d5016] mb-2">Do I get progress reports for online phonics classes?</h3>
            <p className="text-gray-700">
              Yes. Quality programs provide stage-based progress updates showing mastered skills, upcoming topics, and home practice tips. Tiny Steps includes lesson recordings, mastery bands, and monthly parent calls for full transparency.
            </p>
          </div>

          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-bold text-[#2d5016] mb-2">Will online classes fix my child's pronunciation?</h3>
            <p className="text-gray-700">
              Yes, if the program includes explicit pronunciation coaching. Look for mentors trained in phonetic clarity (R/L/TH/W-V sounds). Tiny Steps targets Indian English clarity with live correction and pronunciation practice in every lesson.
            </p>
          </div>

          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-bold text-[#2d5016] mb-2">What materials do I need for online phonics classes?</h3>
            <p className="text-gray-700">
              You need a device (laptop/tablet), stable internet, and a quiet space. Quality programs provide digital materials: worksheets, flashcards, and practice games. No expensive workbooks or physical kits required.
            </p>
          </div>

          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-bold text-[#2d5016] mb-2">Are online phonics teachers properly trained?</h3>
            <p className="text-gray-700">
              Check for teachers with phonics certifications (Jolly Phonics, TESOL, B.Ed). Tiny Steps mentors complete 40+ hours of phonics methodology training and ongoing quality reviews. All sessions are recorded for accountability.
            </p>
          </div>

          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-bold text-[#2d5016] mb-2">Can international students join online phonics classes from India?</h3>
            <p className="text-gray-700">
              Yes. Online classes work globally. Tiny Steps serves families in India, UAE, Singapore, UK, and US with flexible time slots (6 AM–9 PM IST). Classes adapt to IB, CBSE, or international curriculum needs.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="text-center bg-[#2d5016] text-white rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-4">Ready to start?</h2>
        <p className="mb-6">
          Book a free 20-minute assessment to see if Tiny Steps phonics classes are right for your child.
        </p>
        <Link
          to="/?book=1"
          className="inline-block bg-white text-[#2d5016] font-bold py-3 px-8 rounded-lg hover:bg-gray-100 transition"
        >
          Book Free Assessment
        </Link>
      </section>
      </div>
    </div>
  );
}
