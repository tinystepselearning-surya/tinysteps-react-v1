import { useEffect } from 'react';
import ClusterSeoNav from '../../components/programs/ClusterSeoNav';
import { applySeo } from '../../lib/seo';
import { Link } from 'react-router-dom';

const FAQS = [
  {
    question: 'What age should a child start using phonics apps?',
    answer: 'Most children are ready between ages 3–6, when they can listen to sounds, repeat them, and match letters with pictures. Start with short, guided sessions and build slowly. If your child enjoys story time and can follow simple instructions, they are ready to begin.'
  },
  {
    question: 'Are phonics apps enough to teach reading?',
    answer: 'Apps are helpful for daily practice, but they work best when paired with guided reading or live mentoring. Children still need feedback on pronunciation, blending, and confidence. Think of apps as practice—not the full teaching plan.'
  },
  {
    question: 'How many minutes a day should we use a phonics app?',
    answer: '10 minutes a day is plenty for preschoolers. Short, consistent practice works better than long sessions. Two 5-minute bursts (morning and evening) often feels easier for young children.'
  },
  {
    question: 'Should the app use Indian English pronunciation?',
    answer: 'Clear, consistent pronunciation matters most. An app that models sounds cleanly and matches the way letters are taught at school (CBSE/ICSE/IB) will be effective. If possible, choose apps that avoid mixed accents and keep sounds consistent.'
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
    answer: 'Yes. Phonics teaches how English sounds map to letters, which helps bilingual children decode words faster. Choose apps that focus on sound clarity and blending rather than heavy text blocks.'
  },
  {
    question: 'What if my child confuses similar letters like b and d?',
    answer: 'That is normal at this age. Use visual cues (b has the bat first, d has the drum first), multisensory practice, and short, repeated drills. The confusion usually resolves with consistent practice.'
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

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://tinystepslearning.com/#organization',
  name: 'Tiny Steps Learning',
  url: 'https://tinystepslearning.com',
  logo: 'https://tinystepslearning.com/logo-square.webp',
  sameAs: [
    'https://www.facebook.com/tinystepslearning',
    'https://www.instagram.com/tinystepslearning'
  ]
};

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
    '@id': 'https://tinystepslearning.com/#organization'
  },
  about: {
    '@id': 'https://tinystepslearning.com/#organization'
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
      description: 'Parent-friendly guide to phonics apps for preschoolers in India. Learn what to look for, how to use apps at home in 10 minutes a day, and common mistakes to avoid.',
      canonicalPath: '/phonics-apps-for-preschoolers-india',
      ogType: 'website',
      jsonLd: [organizationSchema, breadcrumbSchema, webPageSchema, faqSchema]
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
          to="/?book=1"
          className="inline-block bg-[#4a7c2c] hover:bg-[#2d5016] text-white font-bold py-3 px-6 rounded-lg transition"
        >
          Book Free Assessment
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
          Good phonics apps for preschoolers in India help ages 3–6 practice letter sounds, blending, and short words through playful, daily activities. Look for clear audio, step-by-step progression, and parent tracking. Apps work best when paired with guided reading or a mentor.
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
            <li className="flex items-start"><span className="text-[#4a7c2c] font-bold mr-3">✓</span><span><strong>School alignment:</strong> Matches CBSE/ICSE/IB sound order and expectations.</span></li>
          </ul>
        </div>
      </section>

      <section className="mb-12 bg-green-50 p-8 rounded-lg">
        <h2 className="text-3xl font-bold text-[#2d5016] mb-4">How to use an app at home (10 minutes/day)</h2>
        <ol className="space-y-4 text-gray-700 list-decimal list-inside">
          <li><strong>2 minutes:</strong> Review 3–5 known sounds together (say, point, repeat).</li>
          <li><strong>5 minutes:</strong> Complete one app activity focused on today’s sound or blend.</li>
          <li><strong>2 minutes:</strong> Blend 3 short words aloud (e.g., s-a-t → sat).</li>
          <li><strong>1 minute:</strong> Celebrate a win and stop before your child gets tired.</li>
        </ol>
        <p className="text-sm text-gray-600 mt-4">
          Consistency beats length. Ten focused minutes daily works better than one long session per week.
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
            to="/?book=1"
            className="inline-block bg-white border border-[#4a7c2c] text-[#2d5016] font-bold py-3 px-6 rounded-lg transition"
          >
            Book Free Assessment
          </Link>
        </div>
      </section>
      <ClusterSeoNav cluster="phonics" />
    </div>
  );
}
