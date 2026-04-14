import { useEffect } from 'react';
import ClusterSeoNav from '../../components/programs/ClusterSeoNav';
import { applySeo } from '../../lib/seo';
import { Link } from 'react-router-dom';

const faqItems = [
  {
    question: 'My child knows letters but cannot read words. Is this the right page?',
    answer:
      'Yes. This page is for early readers who need the bridge from letter knowledge to decoding and first sentence reading. The focus is sound mapping, blending, and short decodable reading.',
  },
  {
    question: 'How is this different from the main phonics page?',
    answer:
      'The main phonics page covers the full pathway across wider stages. This page is a narrower early-reader track for ages 3-8 who need strong decoding foundations and first-reading confidence.',
  },
  {
    question: 'How is this different from general reading classes?',
    answer:
      'General reading classes can include broader fluency and comprehension goals. This page focuses on early reading mechanics: letter sounds, blending, CVC words, and first sentence flow.',
  },
  {
    question: 'What age is best to start phonics and early reading support?',
    answer:
      'Many children can start around ages 3-4 with sound awareness and early blending. Older beginners also benefit when classes are level-matched and consistent.',
  },
  {
    question: 'How many classes per week are usually effective?',
    answer:
      'Two to three live classes per week plus short home review is a practical routine for many families. Consistency matters more than long study sessions.',
  },
  {
    question: 'Do you use methods similar to Jolly Phonics?',
    answer:
      'We use a structured synthetic phonics approach that includes principles families may know from methods such as Jolly Phonics: sound-to-letter mapping, blending, and decodable reading practice.',
  },
];

export default function OnlinePhonicsReadingClassesPage() {
  useEffect(() => {
    applySeo({
      title: 'Online Phonics and Reading Classes (Ages 3-8) | Tiny Steps Learning',
      description:
        'Early-reader online phonics and reading classes for ages 3-8 focused on letter sounds, blending, CVC decoding, and first sentence reading with live guided support.',
      canonicalPath: '/online-phonics-reading-classes',
      ogType: 'website',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'Course',
          '@id': 'https://tinystepslearning.com/online-phonics-reading-classes#course',
          name: 'Online Phonics and Reading Classes',
          description:
            'Live online early-reader classes for ages 3-8 focused on structured synthetic phonics, blending, CVC decoding, and first sentence reading confidence.',
          provider: {
            '@type': 'Organization',
            '@id': 'https://tinystepslearning.com/#organization',
            name: 'Tiny Steps Learning',
            url: 'https://tinystepslearning.com',
          },
          url: 'https://tinystepslearning.com/online-phonics-reading-classes',
          hasCourseInstance: {
            '@type': 'CourseInstance',
            courseMode: 'OnlineCoursePlatform',
          },
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
            { '@type': 'ListItem', position: 2, name: 'Phonics', item: 'https://tinystepslearning.com/phonics' },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'Online Phonics and Reading Classes',
              item: 'https://tinystepslearning.com/online-phonics-reading-classes',
            },
          ],
        },
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          '@id': 'https://tinystepslearning.com/online-phonics-reading-classes#faq',
          mainEntity: faqItems.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.answer,
            },
          })),
        },
      ],
    });
  }, []);

  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <section className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-[#2d5016] mb-4">Online Phonics and Reading Classes (Ages 3-8)</h1>
        <p className="text-xl text-gray-700 mb-6">
          Early-reader support that helps children move from letter familiarity to confident first-word and sentence reading.
        </p>
        <p className="text-gray-600 mb-8">
          This page is for the early bridge stage: sound awareness, blending, CVC decoding, and first sentence flow through live guided teaching.
        </p>
        <Link
          to="/?book=1"
          className="inline-block bg-[#4a7c2c] hover:bg-[#2d5016] text-white font-bold py-3 px-8 rounded-lg transition"
        >
          Book a Free Assessment
        </Link>
      </section>

      <section className="mb-10 bg-blue-50 border-l-4 border-[#4a7c2c] p-6 rounded-lg">
        <h2 className="text-lg font-bold text-[#2d5016] mb-2">Quick answer for parents</h2>
        <p className="text-gray-700 leading-relaxed">
          If your child knows letters but struggles to read words, the missing bridge is usually decoding. These classes target that bridge directly: hear sound, map letter, blend, and read short decodable text with confidence.
        </p>
      </section>

      <section className="mb-10 bg-green-50 p-8 rounded-lg">
        <h2 className="text-3xl font-bold text-[#2d5016] mb-4">Who this is for</h2>
        <ul className="space-y-2 text-gray-700 ml-4">
          <li>• Ages 3-8 who are entering or consolidating first reading steps.</li>
          <li>• Children who can name letters but cannot reliably blend sounds into words.</li>
          <li>• Children who guess words instead of decoding left to right.</li>
          <li>• Parents who want a structured early-reading plan, not random worksheets.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-3xl font-bold text-[#2d5016] mb-6">What children learn in this early-reading track</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="font-bold text-lg text-[#4a7c2c] mb-3">Foundation Skills</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• Letter-sound mapping (not letter names only)</li>
              <li>• Oral blending routines</li>
              <li>• Early sound sequencing and correction</li>
              <li>• Confidence routines for hesitant readers</li>
            </ul>
          </div>
          <div className="border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="font-bold text-lg text-[#4a7c2c] mb-3">Reading Skills</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• CVC word decoding</li>
              <li>• Early tricky-word support</li>
              <li>• Short sentence reading with flow</li>
              <li>• First-level reading confidence and clarity</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mb-10 bg-green-50 p-8 rounded-lg">
        <h2 className="text-3xl font-bold text-[#2d5016] mb-4">How parents can check progress this month</h2>
        <ul className="space-y-3 text-gray-700">
          <li>• Sound recall improves without repeated prompting.</li>
          <li>• Child blends short words with fewer pauses.</li>
          <li>• Guessing reduces and full decoding attempts increase.</li>
          <li>• Child reads short sentences with less hesitation.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-3xl font-bold text-[#2d5016] mb-6">When to choose this page vs nearby pages</h2>
        <ul className="space-y-2 text-gray-700">
          <li>
            • Use this page if your child is in the early bridge stage (letters -&gt; words -&gt; first sentences).
          </li>
          <li>
            • Use{' '}
            <Link to="/phonics" className="font-semibold text-[#2d5016] underline hover:text-[#4a7c2c]">
              phonics classes
            </Link>{' '}
            for the broader full phonics progression.
          </li>
          <li>
            • Use{' '}
            <Link to="/reading-classes-for-kids" className="font-semibold text-[#2d5016] underline hover:text-[#4a7c2c]">
              reading classes for kids
            </Link>{' '}
            when goals are broader fluency and reading confidence beyond the earliest stage.
          </li>
          <li>
            • Use{' '}
            <Link to="/reading-fluency-program" className="font-semibold text-[#2d5016] underline hover:text-[#4a7c2c]">
              reading fluency program
            </Link>{' '}
            when decoding is mostly stable but pace is still too slow.
          </li>
        </ul>
      </section>

      <section className="mb-10 bg-gray-50 p-8 rounded-lg">
        <h2 className="text-3xl font-bold text-[#2d5016] mb-6 text-center">Frequently Asked Questions</h2>
        <div className="space-y-6 max-w-3xl mx-auto">
          {faqItems.map((item) => (
            <article key={item.question}>
              <h3 className="font-bold text-lg mb-2 text-gray-900">{item.question}</h3>
              <p className="text-gray-700 text-sm">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-10 bg-gray-50 p-8 rounded-lg">
        <h2 className="text-2xl font-bold text-[#2d5016] mb-4">Relevant next-step links</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Link to="/phonics" className="text-[#4a7c2c] hover:underline font-semibold block">
            → Phonics Classes for Kids
          </Link>
          <Link to="/reading-classes-for-kids" className="text-[#4a7c2c] hover:underline font-semibold block">
            → Online Reading Classes for Kids
          </Link>
          <Link to="/blog/child-knows-abc-but-cannot-read" className="text-[#4a7c2c] hover:underline font-semibold block">
            → My Child Knows ABC but Cannot Read
          </Link>
          <Link to="/blog/phonics-for-parents-guide" className="text-[#4a7c2c] hover:underline font-semibold block">
            → Phonics for Parents Guide
          </Link>
        </div>
      </section>

      <section className="bg-[#2d5016] text-white p-8 md:p-12 rounded-lg text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to build your child’s first reading confidence?</h2>
        <p className="mb-6 text-lg max-w-2xl mx-auto">
          Book a free assessment and get a clear starting plan for early phonics and reading progress.
        </p>
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Link
            to="/?book=1"
            className="bg-white text-[#2d5016] hover:bg-gray-100 font-bold py-4 px-8 rounded-lg transition text-lg"
          >
            Book Free Assessment
          </Link>
          <Link
            to="/pricing"
            className="border-2 border-white text-white hover:bg-white hover:text-[#2d5016] font-bold py-4 px-8 rounded-lg transition text-lg"
          >
            View Pricing
          </Link>
        </div>
      </section>
      <ClusterSeoNav cluster="phonics" />
    </div>
  );
}
