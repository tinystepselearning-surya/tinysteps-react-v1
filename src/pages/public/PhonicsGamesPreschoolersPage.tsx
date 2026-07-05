import { useEffect } from 'react';
import ClusterSeoNav from '../../components/programs/ClusterSeoNav';
import { applySeo } from '../../lib/seo';
import { Link } from 'react-router-dom';

const FAQS = [
  {
    question: 'What age is best for phonics games?',
    answer: 'Ages 3–6 are ideal because children are ready to hear sounds, repeat them, and blend simple words. Start with short games and build up slowly.'
  },
  {
    question: 'How long should phonics games last each day?',
    answer: 'About 10 minutes is enough for preschoolers. Two short sessions work better than one long session.'
  },
  {
    question: 'Do I need any worksheets or printables?',
    answer: 'No. These games are designed as no-print activities using items you already have at home.'
  },
  {
    question: 'Can phonics games replace formal classes?',
    answer: 'Games are great for practice, but children still benefit from guided teaching or live feedback. Use games to reinforce learning.'
  },
  {
    question: 'What if my child only wants to play and not learn?',
    answer: 'Keep the game short, model the sound yourself, and end after one or two wins. Consistency matters more than length.'
  },
  {
    question: 'How do I teach blending during play?',
    answer: 'Say each sound slowly, then slide them together (s‑a‑t → sat). Use simple CVC words and repeat often.'
  },
  {
    question: 'Are phonics games helpful for bilingual children?',
    answer: 'Yes. Phonics games make English sound patterns clear and improve decoding for bilingual learners.'
  },
  {
    question: 'What if my child confuses letters like b and d?',
    answer: 'That is common. Use visual cues, movement, and repeated short practice rather than long drilling.'
  },
  {
    question: 'How do I know my child is making progress?',
    answer: 'Look for quicker sound recall, smoother blending, and attempts to read short words on labels or books.'
  },
  {
    question: 'Should we use letter names or sounds first?',
    answer: 'Start with sounds first for reading. Add letter names later once sounds are secure.'
  },
  {
    question: 'What if my child loses interest quickly?',
    answer: 'Rotate between a few favorite games, keep sessions playful, and stop before your child gets tired.'
  }
];

const HOW_TO_STEPS = [
  {
    name: 'Warm-up sounds (2 minutes)',
    text: 'Pick 3–5 known sounds and say them together. Let your child point to matching objects or letters.'
  },
  {
    name: 'Play one game (5 minutes)',
    text: 'Choose a single phonics game and focus on one sound or blend. Keep it fast and fun.'
  },
  {
    name: 'Blend three words (2 minutes)',
    text: 'Say the sounds slowly, then slide them together (c‑a‑t → cat). Repeat each word twice.'
  },
  {
    name: 'Celebrate and stop (1 minute)',
    text: 'Praise one win and end the session. Short and consistent beats long and tiring.'
  }
];

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  '@id': 'https://tinystepslearning.com/phonics-games-for-preschoolers#breadcrumb',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
    { '@type': 'ListItem', position: 2, name: 'Phonics Games for Preschoolers', item: 'https://tinystepslearning.com/phonics-games-for-preschoolers' }
  ]
};

const howToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  '@id': 'https://tinystepslearning.com/phonics-games-for-preschoolers#howto',
  name: '10-minute daily phonics routine for preschoolers',
  description: 'A short daily routine using simple phonics games for ages 3–6 to build sound awareness and blending skills.',
  step: HOW_TO_STEPS.map((step, index) => ({
    '@type': 'HowToStep',
    position: index + 1,
    name: step.name,
    text: step.text
  }))
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': 'https://tinystepslearning.com/phonics-games-for-preschoolers#faqpage',
  mainEntity: FAQS.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer
    }
  }))
};

export default function PhonicsGamesPreschoolersPage() {
  useEffect(() => {
    applySeo({
      title: 'Phonics Games for Preschoolers (Ages 3–6) | No-Print Ideas',
      description: 'Simple no-print phonics games for preschoolers ages 3–6, plus a 10-minute daily routine and common mistakes to avoid. Fun, practical, and parent-friendly.',
      canonicalPath: '/phonics-games-for-preschoolers',
      ogType: 'website',
      jsonLd: [breadcrumbSchema, howToSchema, faqSchema]
    });
  }, []);

  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <header className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-[#2d5016] mb-4">
          Phonics Games for Preschoolers
        </h1>
        <p className="text-xl text-gray-700 mb-6">
          No-print, easy games for ages 3–6 to build letter sounds and blending at home.
        </p>
        <Link
          to="/book-demo"
          className="inline-block bg-[#4a7c2c] hover:bg-[#2d5016] text-white font-bold py-3 px-6 rounded-lg transition"
        >
          Book Free Assessment
        </Link>
        <p className="mt-4 text-sm text-gray-600">
          Want the complete curriculum view?{' '}
          <Link to="/phonics" className="font-semibold text-[#4a7c2c] underline">
            Explore phonics classes
          </Link>
          .
        </p>
      </header>

      <section className="mb-12 bg-blue-50 border-l-4 border-[#4a7c2c] p-6 rounded-lg">
        <h2 className="text-lg font-bold text-[#2d5016] mb-2">
          What are good phonics games for preschoolers?
        </h2>
        <p className="text-gray-700 leading-relaxed">
          No-print phonics games help preschoolers ages 3–6 practice sounds, blending, and early reading through short, playful routines. The best games use movement, objects at home, and quick repetition. Aim for 10 minutes a day and keep it fun, guided, and consistent.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-3xl font-bold text-[#2d5016] mb-6">7 no-print phonics games (ages 3–6)</h2>
        <div className="space-y-4 text-gray-700">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-bold text-[#2d5016]">1) Sound Hunt</h3>
            <p>Pick a sound and hunt for objects that start with it (s for sock, sun, spoon).</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-bold text-[#2d5016]">2) Mystery Bag</h3>
            <p>Place 3–4 items in a bag. Feel one, name it, and say the first sound.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-bold text-[#2d5016]">3) Jump-and-Blend</h3>
            <p>Say sounds on the floor (c‑a‑t) and jump forward as you blend the word.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-bold text-[#2d5016]">4) Tap the Sound</h3>
            <p>Tap the table once per sound, then slide your hand to blend the word.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-bold text-[#2d5016]">5) Letter Parking</h3>
            <p>Draw 3 letters on sticky notes. Park a toy car on the letter as you say the sound.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-bold text-[#2d5016]">6) Rhyme Time</h3>
            <p>Say a word (cat) and ask for a rhyming word (hat, bat). Celebrate attempts.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-bold text-[#2d5016]">7) Build a Word with Cups</h3>
            <p>Write sounds on cups, line them up, and slide your finger across to blend.</p>
          </div>
        </div>
      </section>

      <section className="mb-12 bg-green-50 p-8 rounded-lg">
        <h2 className="text-3xl font-bold text-[#2d5016] mb-4">10-minute daily routine (HowTo)</h2>
        <ol className="space-y-4 text-gray-700 list-decimal list-inside">
          {HOW_TO_STEPS.map((step) => (
            <li key={step.name}><strong>{step.name}:</strong> {step.text}</li>
          ))}
        </ol>
      </section>

      <section className="mb-12">
        <h2 className="text-3xl font-bold text-[#2d5016] mb-4">Common mistakes to avoid</h2>
        <ul className="space-y-3 text-gray-700">
          <li>• Using long sessions that exhaust attention spans</li>
          <li>• Focusing on letter names instead of sounds</li>
          <li>• Skipping blending practice</li>
          <li>• Switching games every day with no repetition</li>
          <li>• Expecting instant reading without daily practice</li>
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
        <h2 className="text-3xl font-bold text-[#2d5016] mb-4">Want a full phonics plan?</h2>
        <p className="text-gray-700 mb-6">
          Explore our 1:1 phonics program, check pricing, or ask a mentor about your child’s level.
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
            to="/book-demo"
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
