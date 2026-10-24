import { useEffect } from 'react';
import ClusterSeoNav from '../../components/programs/ClusterSeoNav';
import { applySeo } from '../../lib/seo';
import { Link } from 'react-router-dom';

const FAQS = [
  {
    question: 'What age should a child start using phonics apps?',
    answer: 'For children around ages 3–6, readiness varies. A short, shared sound-listening activity may be useful when the child is interested and can participate comfortably; there is no universal age or app-readiness test. Start with play, oral language and reading aloud, and introduce sound–letter practice gradually.'
  },
  {
    question: 'Are phonics apps enough to teach reading?',
    answer: 'Apps are helpful for daily practice, but they work best when paired with guided reading or live mentoring. Children still need feedback on pronunciation, blending, and confidence. Think of apps as practice—not the full teaching plan.'
  },
  {
    question: 'How many minutes a day should we use a phonics app?',
    answer: 'Ten minutes is one optional example, not an evidence-based daily requirement. Try a shorter, adult-guided activity if that suits your child; stop when attention or enjoyment fades. Conversation, play and reading aloud also matter.'
  },
  {
    question: 'Should the app use Indian English pronunciation?',
    answer: 'Choose clear speech sounds and spelling examples your child can understand. If your child is learning a particular phonics sequence at school, use the same already-taught sound–letter correspondences where practical. CBSE, ICSE and IB do not prescribe one shared phonics sound order; accent differences alone do not establish whether an app teaches decoding well.'
  },
  {
    question: 'What features matter most for ages 3–6?',
    answer: 'Look for clear audio, a step-by-step phonics sequence, lots of blending practice, and simple visuals. Rewards should be gentle, not distracting. Parent progress tracking is also useful to see what your child is actually learning.'
  },
  {
    question: 'My child taps randomly. How can I make it effective?',
    answer: 'Sit with them for the first few weeks. Say the sound aloud, ask them to repeat it, and guide their finger to the correct choice. Keep sessions short and end on a win. Once they understand the routine, you can step back.'
  },
  {
    question: 'Can phonics apps help bilingual kids?',
    answer: 'They can provide useful English sound–letter and blending practice for multilingual children, alongside speaking, listening and reading in the languages the child uses. An app does not guarantee faster decoding; check whether the child can apply taught patterns to unfamiliar words and gets appropriate feedback.'
  },
  {
    question: 'What if my child confuses similar letters like b and d?',
    answer: 'Letter reversals such as b and d can occur during early writing and reading development. Model the letter formation and sound, practise briefly with fresh examples, and look for gradual improvement. If confusion persists or substantially affects reading, discuss it with the child's teacher or an appropriate specialist rather than assuming practice alone will resolve it.'
  },
  {
    question: 'Do I need to buy a paid phonics app?',
    answer: 'Not always. Many free apps are good for basic sound practice. Paid apps can be worth it if they offer a full sequence, fewer ads, and parent tracking. Try a free version first and upgrade only if your child stays engaged.'
  },
  {
    question: 'How do I know my child is progressing?',
    answer: 'Look for signs like quicker sound recall, smoother blending, and trying to read labels or simple words. A good app will also show mastered sounds and completed levels. Stage check-ins with a parent or mentor keep progress on track.'
  },
  {
    question: 'Should apps be used before or after live classes?',
    answer: 'Use apps after class to reinforce what was taught. If your child is not in classes, use apps as short practice and add daily reading aloud with you. The goal is repetition with guidance.'
  }
];

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  '@id': 'https://tinystepslearning.com/phonics-apps-for-preschoolers-india#breadcrumb',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
    { '@type': 'ListItem', position: 2, name: 'Phonics Apps for Preschoolers in India', item: 'https://tinystepslearning.com/phonics-apps-for-preschoolers-india' }
  ]
};

const webPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': 'https://tinystepslearning.com/phonics-apps-for-preschoolers-india#webpage',
  url: 'https://tinystepslearning.com/phonics-apps-for-preschoolers-india',
  name: 'Phonics Apps for Preschoolers in India | Ages 3–6',
  description: 'A parent-friendly guide to choosing phonics apps for preschoolers in India. Learn what to look for, how to use apps at home, and common mistakes to avoid.',
  inLanguage: 'en-IN',
  publisher: {
    '@id': 'https://tinystepslearning.com/#educational-organization'
  },
  about: {
    '@id': 'https://tinystepslearning.com/#educational-organization'
  },
  breadcrumb: {
    '@id': 'https://tinystepslearning.com/phonics-apps-for-preschoolers-india#breadcrumb'
  }
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': 'https://tinystepslearning.com/phonics-apps-for-preschoolers-india#faqpage',
  mainEntity: FAQS.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer
    }
  }))
};

export default function PhonicsAppsPreschoolersIndiaPage() {
  useEffect(() => {
    applySeo({
      title: 'Phonics Apps for Preschoolers in India (Ages 3–6) | Parent Guide',
      description: 'Parent-friendly guide to phonics apps for preschoolers in India. Compare systematic sound–letter practice, adult guidance, readiness and evidence-based limitations.',
      canonicalPath: '/phonics-apps-for-preschoolers-india',
      ogType: 'website',
      jsonLd: [breadcrumbSchema, webPageSchema, faqSchema]
    });
  }, []);

  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <header className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-[#2d5016] mb-4">
          Phonics Apps for Preschoolers in India
        </h1>
        <p className="text-xl text-gray-700 mb-6">
          A parent-friendly guide for ages 3–6: what to look for, how to use apps at home, and common mistakes to avoid.
        </p>
        <Link
          to="/book-demo"
          className="inline-block bg-[#4a7c2c] hover:bg-[#2d5016] text-white font-bold py-3 px-6 rounded-lg transition"
        >
          Book Free 35-Minute Demo
        </Link>
        <p className="mt-4 text-sm text-gray-600">
          Need the full roadmap first?{' '}
          <Link to="/phonics" className="font-semibold text-[#4a7c2c] underline">
            Explore phonics classes
          </Link>
          .
        </p>
      </header>

      <section className="mb-12 bg-blue-50 border-l-4 border-[#4a7c2c] p-6 rounded-lg">
        <h2 className="text-lg font-bold text-[#2d5016] mb-2">
          What are good phonics apps for preschoolers in India?
        </h2>
        <p className="text-gray-700 leading-relaxed">
          A useful phonics app can offer playful practice with sounds, letters and blending at the child's current level. Look for clear audio, a coherent teaching sequence and examples the child can use away from the screen. Apps supplement adult conversation, shared reading and responsive teaching; no app alone guarantees independent reading.
        </p>
        <p className="mt-3 text-sm text-gray-600">
          If your child also needs pencil-control practice, add a short{' '}
          <Link to="/free-letter-tracing-game-for-kids" className="font-semibold text-[#2d5016] underline">
            online alphabet tracing activity
          </Link>
          {' '}before or after app time.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-3xl font-bold text-[#2d5016] mb-6">What to look for in a phonics app (ages 3–6)</h2>
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start"><span className="text-[#4a7c2c] font-bold mr-3">✓</span><span><strong>Clear sound modeling:</strong> Crisp, consistent pronunciation for each letter sound.</span></li>
            <li className="flex items-start"><span className="text-[#4a7c2c] font-bold mr-3">✓</span><span><strong>Step-by-step sequence:</strong> Sounds → blending → short words before sentences.</span></li>
            <li className="flex items-start"><span className="text-[#4a7c2c] font-bold mr-3">✓</span><span><strong>Short activities:</strong> 2–4 minute tasks that fit a preschool attention span.</span></li>
            <li className="flex items-start"><span className="text-[#4a7c2c] font-bold mr-3">✓</span><span><strong>Blending practice:</strong> Regular exercises that combine sounds into words.</span></li>
            <li className="flex items-start"><span className="text-[#4a7c2c] font-bold mr-3">✓</span><span><strong>Minimal distractions:</strong> Rewards that don’t interrupt learning.</span></li>
            <li className="flex items-start"><span className="text-[#4a7c2c] font-bold mr-3">✓</span><span><strong>Parent tracking:</strong> Progress dashboards that show mastered sounds.</span></li>
            <li className="flex items-start"><span className="text-[#4a7c2c] font-bold mr-3">✓</span><span><strong>Offline-friendly:</strong> Works smoothly on average home internet.</span></li>
            <li className="flex items-start"><span className="text-[#4a7c2c] font-bold mr-3">✓</span><span><strong>Teaching continuity:</strong> Lets the child practise already-taught sound–letter patterns; schools and programmes may use different sequences.</span></li>
          </ul>
        </div>
      </section>

      <section className="mb-12 bg-green-50 p-8 rounded-lg">
        <h2 className="text-3xl font-bold text-[#2d5016] mb-4">An example of a short, guided app routine</h2>
        <ol className="space-y-4 text-gray-700 list-decimal list-inside">
          <li><strong>2 minutes:</strong> Review 3–5 known sounds together (say, point, repeat).</li>
          <li><strong>5 minutes:</strong> Complete one app activity focused on today’s sound or blend.</li>
          <li><strong>2 minutes:</strong> Blend 3 short words aloud (e.g., s-a-t → sat).</li>
          <li><strong>1 minute:</strong> Celebrate a win and stop before your child gets tired.</li>
        </ol>
        <p className="text-sm text-gray-600 mt-4">
          This is an illustrative ten-minute plan, not a prescribed duration or a guarantee of progress. Adjust to the child's attention and the sounds already taught; make time for conversation, story reading and play.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-3xl font-bold text-[#2d5016] mb-4">Common mistakes parents make</h2>
        <ul className="space-y-3 text-gray-700">
          <li>• Letting the app run without adult guidance in the early weeks</li>
          <li>• Skipping blending practice and focusing only on letter names</li>
          <li>• Using sessions that are too long for preschool attention spans</li>
          <li>• Switching apps too often, which breaks learning sequence</li>
          <li>• Ignoring pronunciation clarity and rushing to word reading</li>
          <li>• Expecting progress without daily repetition</li>
        </ul>
      </section>

      <section className="mb-12 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h2 className="text-3xl font-bold text-[#2d5016] mb-6">FAQs</h2>
        <div className="space-y-6">
          {FAQS.map((faq) => (
            <div key={faq.question}>
              <h3 className="text-lg font-bold text-[#2d5016] mb-2">{faq.question}</h3>
              <p className="text-gray-700">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="app-evidence-boundary" className="mb-12 rounded-lg border border-gray-200 bg-white p-6">
        <h2 id="app-evidence-boundary" className="text-2xl font-bold text-[#2d5016] mb-3">What research supports—and what it does not</h2>
        <p className="text-gray-700 leading-relaxed">
          Research supports explicit, systematic sound–letter instruction, blending, spelling, and practice matched
          to a learner&apos;s current knowledge. It does not establish that a particular app, accent, fixed
          ten-minute schedule, or one universal school-board sound order guarantees reading progress.
          Monitor whether the child can use a taught pattern in a fresh word away from the app.
        </p>
        <p className="mt-3 text-gray-700 leading-relaxed">
          For example, after teaching the sounds in <strong>sat</strong>, help the child blend the word.
          When <strong>p</strong> has also been taught, offer <strong>pat</strong> without the answer displayed.
          Correct errors gently and check independent blending rather than accepting repeated taps as mastery.
          These are illustrative teaching activities, not a standardized diagnostic test.
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-sm text-gray-700">
          <li>
            <a className="font-semibold text-[#2d5016] underline" href="https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/phonics/" target="_blank" rel="noopener noreferrer">
              Education Endowment Foundation — Phonics evidence review
            </a>
            {' '}describes explicit, systematic phonics and the need to match teaching to a child&apos;s knowledge.
          </li>
          <li>
            <a className="font-semibold text-[#2d5016] underline" href="https://ies.ed.gov/ncee/wwc/PracticeGuide/21/Published" target="_blank" rel="noopener noreferrer">
              Institute of Education Sciences — Foundational Reading Skills practice guide
            </a>
            {' '}covers sound awareness, decoding, word analysis, oral language and connected reading.
          </li>
        </ul>
        <p className="mt-3 text-xs text-gray-600">
          These independent references inform general teaching principles; they do not endorse Tiny Steps or evaluate any named app.
          The examples and home routine above are Tiny Steps editorial guidance.
        </p>
      </section>

      <section className="text-center bg-blue-50 p-8 rounded-lg">
        <h2 className="text-3xl font-bold text-[#2d5016] mb-4">Want a complete phonics roadmap?</h2>
        <p className="text-gray-700 mb-6">
          Explore our 1:1 phonics program, see pricing, or talk to a mentor about your child’s starting level.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/phonics"
            className="inline-block bg-[#4a7c2c] hover:bg-[#2d5016] text-white font-bold py-3 px-6 rounded-lg transition"
          >
            View Phonics Classes
          </Link>
          <Link
            to="/pricing"
            className="inline-block bg-white border border-[#4a7c2c] text-[#2d5016] font-bold py-3 px-6 rounded-lg transition"
          >
            See Pricing
          </Link>
          <Link
            to="/faq"
            className="inline-block bg-white border border-[#4a7c2c] text-[#2d5016] font-bold py-3 px-6 rounded-lg transition"
          >
            Read FAQs
          </Link>
          <Link
            to="/book-demo"
            className="inline-block bg-white border border-[#4a7c2c] text-[#2d5016] font-bold py-3 px-6 rounded-lg transition"
          >
            Book Free 35-Minute Demo
          </Link>
        </div>
      </section>
      <ClusterSeoNav cluster="phonics" />
    </div>
  );
}
