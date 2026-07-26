import { useEffect } from 'react';
import ClusterSeoNav from '../../components/programs/ClusterSeoNav';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import { createFAQPageSchema } from '../../lib/schemas';

const faqItems = [
  {
    question: 'Why is my child shy to speak in English?',
    answer:
      'This is common. Many children understand language but hesitate in class because of fear of mistakes, low speaking confidence, or difficulty forming complete sentences quickly.',
  },
  {
    question: 'What if my child understands English but gives only short answers?',
    answer:
      'Short answers often indicate a sentence formation or confidence gap. Children usually improve when they receive guided prompts, sentence starters, and low-pressure speaking practice.',
  },
  {
    question: 'Is this a confidence issue or a sentence formation issue?',
    answer:
      'It can be both. Some children know what to say but hesitate to speak, while others need help turning ideas into full sentences. A structured assessment helps identify the main gap.',
  },
  {
    question: 'Can online classes help a shy child speak more confidently?',
    answer:
      'Yes. Online classes can help when the child gets gentle speaking practice, guided response building, and consistent feedback in a supportive setting.',
  },
  {
    question: 'How does Tiny Steps encourage children without pressure?',
    answer:
      'Tiny Steps uses child-friendly prompts, predictable speaking routines, and step-by-step confidence ladders. Children are encouraged to progress gradually, not forced into sudden performance.',
  },
  {
    question: 'What happens in a Tiny Steps communication assessment?',
    answer:
      'Tiny Steps checks vocabulary use, sentence formation, response length, clarity, and confidence patterns. Parents then receive a clear communication pathway recommendation.',
  },
];

export default function ShyChildSpeakingConfidencePage() {
  useEffect(() => {
    const faqSchema = {
      ...createFAQPageSchema(faqItems),
      '@id': 'https://tinystepslearning.com/shy-child-speaking-confidence#faq',
    };

    applySeo({
      title: 'Shy Child Speaking Confidence Help | Tiny Steps Learning',
      description:
        'Support for shy child speaking confidence with guided communication practice, sentence support, vocabulary building, and public speaking readiness.',
      canonicalPath: '/shy-child-speaking-confidence',
      ogType: 'website',
      jsonLd: [faqSchema],
    });
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-6 py-12">
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">Shy Child Speaking Confidence Help for Parents</h1>
        <p className="mt-4 text-lg text-slate-700">
          If your child understands well but hesitates to speak, Tiny Steps helps identify the real gap and build communication confidence through gentle guided practice.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/book-demo"
            className="inline-block rounded-lg bg-slate-900 px-8 py-3 font-semibold text-white transition hover:bg-slate-800"
          >
            Book Free 35-Minute Demo
          </Link>
          <Link
            to="/speaking"
            className="inline-block rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-900 transition hover:border-slate-400"
          >
            Explore Speaking Program
          </Link>
        </div>
      </section>

      <section className="mb-10 rounded-xl border border-sky-100 bg-sky-50 p-6">
        <h2 className="mb-2 text-lg font-bold text-slate-900">Quick Answer for Parents</h2>
        <p className="text-slate-700">
          Shy speaking is usually not just “personality.” It often includes confidence, vocabulary, and sentence formation gaps that appear under class pressure. The right approach is structured, low-pressure speaking progression.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Common signs of a shy or hesitant speaker</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Speaks comfortably at home but gives one-word answers in class.</li>
          <li>• Knows the answer but avoids eye contact and stays silent.</li>
          <li>• Needs repeated prompting before speaking aloud.</li>
          <li>• Voice gets very soft during group sharing or presentations.</li>
          <li>• Becomes anxious before speaking tasks despite preparation.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Why some children understand English but avoid speaking</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• They fear making mistakes in front of others.</li>
          <li>• They need more vocabulary support to express ideas clearly.</li>
          <li>• They struggle to build full sentences quickly under pressure.</li>
          <li>• They have low confidence despite understanding lessons.</li>
          <li>• They need guided transition from home-speaking comfort to class-speaking confidence.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Difference between shyness, lack of vocabulary, weak sentence formation, and low confidence</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Shyness: child hesitates mainly in social or class settings.</li>
          <li>• Lack of vocabulary: child wants to speak but cannot find enough words.</li>
          <li>• Weak sentence formation: child has ideas but cannot structure full answers smoothly.</li>
          <li>• Low confidence: child avoids speaking even when vocabulary and ideas are available.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-emerald-100 bg-emerald-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">How Tiny Steps builds speaking confidence gently</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• We use low-pressure speaking ladders and child-friendly prompts.</li>
          <li>• We strengthen vocabulary and sentence formation before longer responses.</li>
          <li>• We build comfort in small steps: guided answers, short shares, and structured expression.</li>
          <li>• We connect confidence work with grammar clarity and communication practice.</li>
          <li>• We keep parent communication clear with practical next steps.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What we check before suggesting a communication path</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Child comfort level in one-to-one and group speaking moments</li>
          <li>• Vocabulary readiness for age-appropriate expression</li>
          <li>• Sentence formation quality in guided answers</li>
          <li>• Clarity, voice confidence, and response length patterns</li>
          <li>• Reading and grammar support needs that may affect speaking confidence</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-sky-100 bg-sky-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Recommended learning path</h2>
        <p className="text-slate-700">
          comfort → vocabulary → sentence formation → guided answers → expression → confident communication
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">FAQs</h2>
        <div className="space-y-4">
          {faqItems.map((item) => (
            <article key={item.question}>
              <h3 className="font-semibold text-slate-900">{item.question}</h3>
              <p className="mt-1 text-sm text-slate-700">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Relevant next-step links</h2>
        <ul className="space-y-2 text-slate-700">
          <li>
            • For broader speaking-confidence support:{' '}
            <Link to="/confidence-building-program-kids" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Confidence Building Program for Kids
            </Link>
          </li>
          <li>
            • For structured speaking coaching:{' '}
            <Link to="/speaking" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Public Speaking Classes for Kids
            </Link>
          </li>
          <li>
            • For sentence formation support:{' '}
            <Link to="/grammar" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Grammar Program
            </Link>
          </li>
          <li>
            • For language confidence through reading support:{' '}
            <Link to="/reading-classes-for-kids" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Reading Classes for Kids
            </Link>
          </li>
          <li>
            • For comparing all public pathways:{' '}
            <Link to="/courses" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Explore Courses
            </Link>
          </li>
          <li>
            • For assessment booking:{' '}
            <Link to="/book-demo" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Book Free 35-Minute Demo
            </Link>
          </li>
        </ul>
      </section>

      <section className="rounded-xl bg-slate-900 p-8 text-center text-white">
        <h2 className="text-2xl font-bold">Parent action: book one free 35-minute 1:1 online demo assessment class first</h2>
        <p className="mt-2 text-slate-200">Get a calm, structured communication confidence plan for your child.</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/book-demo"
            className="inline-block rounded-lg bg-white px-8 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            Book Free 35-Minute Demo
          </Link>
          <Link
            to="/courses"
            className="inline-block rounded-lg border border-white/40 px-6 py-3 font-semibold text-white transition hover:border-white/70"
          >
            Explore Courses
          </Link>
        </div>
      </section>
      <ClusterSeoNav cluster="speaking" />
    </div>
  );
}
