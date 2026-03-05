import PhonicsPage from './phonics';

const INTRO_COPY = "Tiny Steps Learning offers 1:1 online phonics classes for kids ages 3–12. We teach letter sounds, blending, and decodable reading—so children start reading real words with confidence.";
const ANSWER_BULLETS = [
  'Ages: 3–12',
  'Format: 1:1 live online',
  'Method: systematic phonics + blending + decodable reading',
  'Support: weekly parent progress updates',
  'Outcome: reading confidence + spelling foundations',
];
const FAQS = [
  {
    question: 'Which is the best phonics class for my child?',
    answer: "The best class is the one that matches your child's level and pace. We start with a short reading check, then teach systematic phonics with blending and decodable reading in 1:1 live sessions, plus weekly parent updates.",
  },
  {
    question: 'What age should kids start phonics?',
    answer: 'Ages 3-4 are a great start. We teach ages 3–12 and adjust the pace based on readiness and attention span.',
  },
  {
    question: 'How long does it take to see reading improvement?',
    answer: 'Most children begin blending early words within 4-6 lessons, and stronger fluency builds over 30-40 lessons with consistent practice.',
  },
  {
    question: 'Is synthetic phonics better than memorizing words?',
    answer: 'Synthetic phonics teaches sound-letter relationships and blending, so children can decode new words instead of memorizing lists.',
  },
  {
    question: 'How do online phonics classes work?',
    answer: 'Classes are live 1:1 sessions with a trained mentor using shared activities and decodable practice. Parents get weekly progress updates and home practice tips.',
  },
];

export default function PhonicsClassesForKidsPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <PhonicsPage
      seoOverrides={{
        title: 'Online Phonics Classes for Kids (Ages 3–12) | Tiny Steps Learning',
        description: '1:1 online phonics classes for kids ages 3–12. Letter sounds, blending, decodable reading, and weekly parent progress updates. Book a free assessment.',
        canonicalPath: '/phonics-classes-for-kids',
        breadcrumbName: 'Phonics Classes for Kids',
      }}
      heroTitleOverride="Online Phonics Classes for Kids"
      heroSubtitleOverride="1:1 online phonics classes for kids ages 3–12 with letter sounds, blending, and decodable reading."
      introCopy={INTRO_COPY}
      afterHeroContent={(
        <section className="max-w-4xl mx-auto px-6 py-10">
          <h2 className="text-2xl font-bold text-gray-900">Best online phonics classes for kids</h2>
          <ul className="mt-4 space-y-2 text-gray-700 list-disc pl-5">
            {ANSWER_BULLETS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}
      afterContent={(
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Phonics class FAQs</h2>
          <div className="space-y-6">
            {FAQS.map((faq) => (
              <div key={faq.question} className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-700">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      )}
      extraJsonLd={[faqSchema]}
    />
  );
}
