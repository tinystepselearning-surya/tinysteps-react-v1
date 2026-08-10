import { useEffect } from 'react';
import ClusterSeoNav from '../../components/programs/ClusterSeoNav';
import { applySeo } from '../../lib/seo';
import { Link } from 'react-router-dom';

const FAQS = [
  {
    question: 'What age are phonics games useful for?',
    answer: 'Many preschool children around ages 3–6 can enjoy sound and blending games, but readiness matters more than an exact birthday. Start with listening and sound play, then add print when the child is ready.'
  },
  {
    question: 'How long should phonics games last each day?',
    answer: 'Start with a short session the child can complete successfully. Five to ten focused minutes is often more useful than a long session, especially for a beginner.'
  },
  {
    question: 'Do I need worksheets or printables?',
    answer: 'No. The games on this page use household objects, movement, simple letter cards, or spoken sounds. Printables can be added later if they support the same taught target.'
  },
  {
    question: 'Can phonics games replace structured teaching?',
    answer: 'Games are useful for practice and motivation, but they work best when the child is following a clear sound-and-decoding sequence. If reading is stuck, identify the missing skill rather than adding random games.'
  },
  {
    question: 'What if my child only wants to play?',
    answer: 'Keep the learning target very small: one sound, one blend, or a few words. Let the game carry the practice and stop after a successful attempt rather than extending it until the child is tired.'
  },
  {
    question: 'How do I teach blending during play?',
    answer: 'Say the sounds in order, keep them close together, and slide into the whole word: /s/ /a/ /t/ → sat. Start orally, then repeat with the printed letters when the child is ready.'
  },
  {
    question: 'Are phonics games useful for bilingual children?',
    answer: 'They can be useful because they make English sound patterns explicit. Keep examples clear, avoid forcing an accent, and focus on hearing and mapping the target English sounds to print.'
  },
  {
    question: 'What if my child confuses letters such as b and d?',
    answer: 'Use a consistent visual and movement cue, practise a small number of examples, and avoid long drilling. If the confusion persists alongside broader reading difficulty, ask the teacher to review the child’s decoding process.'
  },
  {
    question: 'How do I know my child is making progress?',
    answer: 'Look for faster sound recall, smoother blending, less guessing, and successful reading of unfamiliar words that use the same taught pattern.'
  },
  {
    question: 'Should we teach letter names or letter sounds first?',
    answer: 'For early decoding practice, the sound-to-letter relationship is the key skill. Children can also learn letter names, but do not let letter-name recall replace practising the sound used for blending.'
  },
  {
    question: 'What if my child loses interest quickly?',
    answer: 'Rotate between a few familiar games, keep the target small, allow movement or choice, and stop while the child is still successful. If every task feels difficult, the level may need to be reduced.'
  }
];

const HOW_TO_STEPS = [
  {
    name: 'Warm up known sounds',
    text: 'Pick 3–5 familiar sounds and say them together. Let your child point to matching objects or letters.'
  },
  {
    name: 'Play one focused game',
    text: 'Choose one game and one learning target. Avoid mixing several new sounds or spelling patterns into the same short session.'
  },
  {
    name: 'Blend a few words',
    text: 'Say the sounds in order, then slide them together into the whole word. Use simple examples that match what the child has already learned.'
  },
  {
    name: 'Finish with one success',
    text: 'End after one clear win and name the strategy the child used, such as hearing the first sound or blending all three sounds.'
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
  name: 'Short daily phonics game routine for preschoolers',
  description: 'A short parent routine using simple sound and blending games for preschool children who are ready for early phonics practice.',
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
      title: 'Phonics Games for Preschoolers: 7 No-Print Sound & Blending Games | Tiny Steps',
      description: 'Seven no-print phonics games for preschoolers, plus a short daily routine, blending examples, progress signs, common mistakes, and parent FAQs.',
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
          Seven simple no-print games to practise letter sounds, listening, blending, and early decoding without turning home practice into another worksheet.
        </p>
        <Link
          to="/book-demo"
          className="inline-block bg-[#4a7c2c] hover:bg-[#2d5016] text-white font-bold py-3 px-6 rounded-lg transition"
        >
          Book Free 35-Minute Demo
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
          Quick answer: what makes a useful preschool phonics game?
        </h2>
        <p className="text-gray-700 leading-relaxed">
          A useful game has one clear learning target, lets the child hear or produce the sound repeatedly, and connects the sound to print when the child is ready. Keep the activity short enough for successful attention and repeat familiar games so the child can focus on the phonics skill rather than learning new game rules every day.
        </p>
        <p className="mt-3 text-sm text-gray-600">
          Need a simple fine-motor warm-up before sound work? Try our{' '}
          <Link to="/free-letter-tracing-game-for-kids" className="font-semibold text-[#2d5016] underline">
            free alphabet tracing game for kids
          </Link>
          .
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-3xl font-bold text-[#2d5016] mb-6">7 no-print phonics games</h2>
        <div className="space-y-4 text-gray-700">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-bold text-[#2d5016]">1) Sound Hunt</h3>
            <p>Pick one known sound and hunt for objects that begin with it. Ask the child to say the object and then isolate the first sound.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-bold text-[#2d5016]">2) Mystery Bag</h3>
            <p>Place a few familiar objects in a bag. Name each object, stretch the first sound, and sort by whether it matches the target sound.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-bold text-[#2d5016]">3) Jump-and-Blend</h3>
            <p>Place three letter cards on the floor. Step or jump to each sound in order, then slide forward while saying the whole word.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-bold text-[#2d5016]">4) Tap the Sound</h3>
            <p>Tap once for each sound in a short word, then sweep a finger across the table while blending the sounds together.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-bold text-[#2d5016]">5) Letter Parking</h3>
            <p>Put a few known letters on sticky notes. Say a sound and let the child park a toy car on the matching letter.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-bold text-[#2d5016]">6) Rhyme Time</h3>
            <p>Say a simple word such as cat and ask for another word that sounds the same at the end. Accept oral play first; spelling can come later.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-bold text-[#2d5016]">7) Build a Word with Cups</h3>
            <p>Write one sound on each cup, line the cups up in reading order, say each sound, then slide a finger across the row to blend.</p>
          </div>
        </div>
      </section>

      <section className="mb-12 bg-green-50 p-8 rounded-lg">
        <h2 className="text-3xl font-bold text-[#2d5016] mb-4">A short daily routine</h2>
        <ol className="space-y-4 text-gray-700 list-decimal list-inside">
          {HOW_TO_STEPS.map((step) => (
            <li key={step.name}><strong>{step.name}:</strong> {step.text}</li>
          ))}
        </ol>
      </section>

      <section className="mb-12 grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-2xl font-bold text-[#2d5016] mb-4">What progress looks like</h2>
          <ul className="space-y-3 text-gray-700">
            <li>• Faster recall of the sounds already taught</li>
            <li>• Less guessing from pictures or the first letter alone</li>
            <li>• Smoother joining of sounds into simple words</li>
            <li>• Successful decoding of a fresh word using the same pattern</li>
            <li>• More willingness to retry after one short prompt</li>
          </ul>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-2xl font-bold text-[#2d5016] mb-4">Common mistakes to avoid</h2>
          <ul className="space-y-3 text-gray-700">
            <li>• Using long sessions when the child is already tired</li>
            <li>• Adding several new sounds or spelling patterns in one game</li>
            <li>• Letting pictures provide the answer instead of supporting decoding</li>
            <li>• Skipping blending and practising isolated sounds only</li>
            <li>• Changing games so often that the rules become harder than the phonics target</li>
          </ul>
        </div>
      </section>

      <section className="mb-12 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h2 className="text-3xl font-bold text-[#2d5016] mb-6">Frequently asked questions</h2>
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
        <h2 className="text-3xl font-bold text-[#2d5016] mb-4">Need a structured phonics path?</h2>
        <p className="text-gray-700 mb-6">
          If you are unsure whether your child needs sound work, blending, decoding, spelling patterns, or reading-fluency support, use the free assessment before choosing a level.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/phonics" className="inline-block bg-[#4a7c2c] hover:bg-[#2d5016] text-white font-bold py-3 px-6 rounded-lg transition">
            View Phonics Classes
          </Link>
          <Link to="/parents/choosing-course" className="inline-block bg-white border border-[#4a7c2c] text-[#2d5016] font-bold py-3 px-6 rounded-lg transition">
            Choose the Right Course
          </Link>
          <Link to="/book-demo" className="inline-block bg-white border border-[#4a7c2c] text-[#2d5016] font-bold py-3 px-6 rounded-lg transition">
            Book Free 35-Minute Demo
          </Link>
        </div>
      </section>
      <ClusterSeoNav cluster="phonics" />
    </div>
  );
}
