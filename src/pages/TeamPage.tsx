import { useEffect } from 'react';
import { applySeo, getRouteConfig } from '../lib/seo';
import {
  CORE_PROGRAMS_TEXT,
  ORGANIZATION_ID,
  PUBLIC_FACTS,
  SITE_ORIGIN,
  createFAQPageSchema,
  organizationSchema,
} from '../lib/schemas';
import { Link } from 'react-router-dom';

const teamSeo = getRouteConfig('/team');
const teamSeoTitle = teamSeo?.title ?? 'Tiny Steps Learning Team | Online English Teachers for Kids';
const teamSeoDescription =
  teamSeo?.description ??
  'Meet the Tiny Steps Learning team and learn how our child-friendly online teachers support phonics, reading, grammar, sentence formation, and public speaking.';
const teamCanonicalPath = teamSeo?.canonicalPath ?? '/team';
const teamFaqItems = [
  {
    question: 'Who teaches Tiny Steps classes?',
    answer:
      'Tiny Steps classes are taught by online teachers trained to support children through guided practice in phonics, reading, grammar, sentence formation, and public speaking.',
  },
  {
    question: 'How does Tiny Steps maintain teaching quality?',
    answer:
      'Tiny Steps uses structured curriculum paths, child-level assessment, guided lesson planning, teacher feedback, and parent communication to maintain teaching quality.',
  },
  {
    question: 'Are Tiny Steps teachers child-friendly?',
    answer:
      'Yes. Tiny Steps focuses on patient, child-friendly teaching where children are encouraged to read, speak, write, and participate without fear.',
  },
  {
    question: 'How do teachers decide what my child should learn?',
    answer:
      'The starting point is usually decided after a free assessment that checks the child’s current level in reading, phonics, grammar, sentence formation, or speaking confidence.',
  },
  {
    question: 'Will parents receive updates?',
    answer:
      'Yes. Tiny Steps focuses on parent-friendly updates so families understand what the child is learning, where the child is improving, and what needs more practice.',
  },
];

export default function TeamPage() {
  useEffect(() => {
    const faqSchema = {
      ...createFAQPageSchema(teamFaqItems),
      '@id': `${SITE_ORIGIN}/team#faq`,
    };

    applySeo({
      title: teamSeoTitle,
      description: teamSeoDescription,
      canonicalPath: teamCanonicalPath,
      ogType: 'website',
      jsonLd: [
        organizationSchema,
        {
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: 'Meet the Team',
          description: `${PUBLIC_FACTS.brandName} is a ${PUBLIC_FACTS.positioning} focused on ${CORE_PROGRAMS_TEXT} through ${PUBLIC_FACTS.deliveryModel}.`,
          url: `${SITE_ORIGIN}/team`,
          mainEntity: {
            '@type': 'Organization',
            '@id': ORGANIZATION_ID,
            name: PUBLIC_FACTS.brandName,
          }
        },
        {
          '@context': 'https://schema.org',
          '@type': 'Person',
          '@id': `${SITE_ORIGIN}/#priya-founder`,
          name: 'Priya',
          jobTitle: 'Founder',
          worksFor: {
            '@type': 'Organization',
            '@id': ORGANIZATION_ID,
            name: PUBLIC_FACTS.brandName,
          },
          description: `Founder of ${PUBLIC_FACTS.brandName}, working with the academic team on ${CORE_PROGRAMS_TEXT} programs for children.`,
          knowsAbout: [...PUBLIC_FACTS.corePrograms, 'Child-friendly English teaching']
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: `${SITE_ORIGIN}/`
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Team',
              item: `${SITE_ORIGIN}/team`
            }
          ]
        },
        faqSchema,
      ]
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h1 className="font-heading text-4xl font-bold leading-tight md:text-5xl">
          Meet the Tiny Steps Learning Team
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-700">
          Tiny Steps Learning is guided by a child-focused academic approach, trained online teachers, and parent-friendly progress communication for children aged 3–12.
        </p>
        <ul className="mx-auto mt-6 grid max-w-3xl gap-2 text-left text-sm text-slate-700 sm:grid-cols-2">
          <li>• Child-friendly online teaching approach</li>
          <li>• Phonics, Grammar, Reading, and Public Speaking support</li>
          <li>• Teacher-guided live practice</li>
          <li>• Parent updates and progress visibility</li>
        </ul>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/book-demo"
            className="inline-block rounded-lg bg-slate-900 px-8 py-3 font-semibold text-white transition hover:bg-slate-800"
          >
            Book Free Assessment
          </Link>
          <Link
            to="/courses"
            className="inline-block rounded-lg border border-slate-300 px-8 py-3 font-semibold text-slate-900 transition hover:border-slate-400"
          >
            Explore Courses
          </Link>
        </div>
      </section>

      {/* Teacher Support Section */}
      <section className="bg-gradient-to-r from-tiny-blue-50 to-tiny-purple-50 py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="mb-6 text-center text-3xl font-bold">How Tiny Steps teachers support children</h2>
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <ul className="space-y-3 text-gray-700">
              <li>• Teachers guide children through live, interactive practice instead of only giving lectures.</li>
              <li>• Children get correction while reading, speaking, writing, and forming sentences.</li>
              <li>• Lessons are adapted based on the child&apos;s age, confidence, and current level.</li>
              <li>• Teachers encourage children gently so they speak, read, and try without fear.</li>
              <li>• Parent updates help families understand what improved and what needs practice.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-14">
        <h2 className="mb-6 text-center text-3xl font-bold">Our academic quality approach</h2>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <ul className="space-y-3 text-gray-700">
            <li>• Structured curriculum paths for Phonics, Grammar, Reading, and Public Speaking.</li>
            <li>• Free assessment before recommending a course.</li>
            <li>• Stage-wise learning instead of random worksheets.</li>
            <li>• Lesson planning focused on child participation and guided practice.</li>
            <li>• Ongoing review of teaching quality and parent feedback.</li>
          </ul>
        </div>
      </section>

      <section className="bg-slate-50 py-14">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="mb-6 text-center text-3xl font-bold">What parents can expect from our teachers</h2>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <ul className="space-y-3 text-gray-700">
              <li>• Warm but structured online classes.</li>
              <li>• Age-appropriate activities.</li>
              <li>• Clear correction and guided practice.</li>
              <li>• Progress-focused feedback.</li>
              <li>• Respectful communication with parents.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="mx-auto max-w-4xl px-6 py-16">
        <h2 className="mb-8 text-center text-3xl font-bold">Founder</h2>
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            <div className="flex-shrink-0">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r from-tiny-blue-600 to-tiny-purple-600 text-3xl font-bold text-white">
                TS
              </div>
            </div>
            <div className="flex-1">
              <h3 className="mb-2 text-2xl font-bold">Priya, Founder</h3>
              <p className="mb-4 text-sm text-gray-600">Founder-led academic direction | Tiny Steps Learning</p>
              <div className="space-y-3 text-gray-700">
                <p>
                  Priya founded Tiny Steps Learning to make premium online English learning for children clearer, kinder, and more structured for families.
                </p>
                <p>
                  She works closely with the academic team on curriculum quality, teacher guidance, and parent communication across Phonics, Grammar, and Public Speaking programs.
                </p>
                <p>
                  The focus is consistent: child-friendly teaching, live feedback, and practical progress updates that parents can trust.
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                {PUBLIC_FACTS.corePrograms.map((program) => (
                  <span key={program} className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                    {program}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="mb-8 text-center text-3xl font-bold">What Parents Say</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Phonics - Age 3-5 */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-1 text-yellow-500">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-5 w-5 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="mb-4 text-gray-700">
                "My son was intimidated by letter sounds, but Priya made it playful and exciting. Within 8 lessons he was blending CVC words. The progress reports show exactly what he's mastered each week."
              </p>
              <p className="text-sm font-medium text-gray-900">– Parent of 4-year-old, Phonics Foundations</p>
            </div>

            {/* Phonics - Age 6-8 */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-1 text-yellow-500">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-5 w-5 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="mb-4 text-gray-700">
                "My daughter was struggling with digraphs and vowel teams in school. After 6 weeks with Advanced Phonics, she's reading chapter books confidently. The lessons are perfectly paced."
              </p>
              <p className="text-sm font-medium text-gray-900">– Parent of 7-year-old, Advanced Phonics</p>
            </div>

            {/* Grammar - Age 5-7 */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-1 text-yellow-500">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-5 w-5 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="mb-4 text-gray-700">
                "We live in Dubai and needed flexible timing. The online format worked perfectly for us. My twin boys look forward to their classes every week and are learning proper sentence structure naturally."
              </p>
              <p className="text-sm font-medium text-gray-900">– Parent of 6-year-old twins, Basic Grammar</p>
            </div>

            {/* Grammar - Age 8-12 */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-1 text-yellow-500">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-5 w-5 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="mb-4 text-gray-700">
                "My son went from writing simple sentences to constructing complex paragraphs with proper punctuation and flow. His teacher explains grammar through real writing, not just rules. His English essays at school have improved dramatically."
              </p>
              <p className="text-sm font-medium text-gray-900">– Parent of 10-year-old, Advanced Grammar</p>
            </div>

            {/* Speaking - Age 4-6 */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-1 text-yellow-500">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-5 w-5 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="mb-4 text-gray-700">
                "My daughter was very shy about speaking in English. Her teacher made her feel so comfortable that now she's confident sharing stories and answering questions in full sentences. It's amazing how patient and encouraging the lessons are."
              </p>
              <p className="text-sm font-medium text-gray-900">– Parent of 5-year-old, Public Speaking Basics</p>
            </div>

            {/* Speaking - Age 8-12 */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-1 text-yellow-500">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-5 w-5 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="mb-4 text-gray-700">
                "My son went from mumbling in class presentations to delivering confident, well-structured speeches. He participated in a school debate and the teacher said his speaking skills stood out. The structured approach to building confidence really works."
              </p>
              <p className="text-sm font-medium text-gray-900">– Parent of 11-year-old, Advanced Public Speaking</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-14">
        <h2 className="mb-6 text-center text-3xl font-bold">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {teamFaqItems.map((item) => (
            <article key={item.question} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">{item.question}</h3>
              <p className="mt-2 text-sm text-slate-700">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h2 className="mb-4 text-3xl font-bold">Want to understand which teacher-led path fits your child?</h2>
        <p className="mx-auto mb-8 max-w-2xl text-gray-700">
          Start with a free assessment. Tiny Steps will check your child’s current level and recommend the right starting point for phonics, reading, grammar, sentence formation, or public speaking.
        </p>
        <div className="flex items-center justify-center">
          <Link
            to="/book-demo"
            className="inline-block rounded-2xl bg-gradient-to-r from-tiny-blue-600 to-tiny-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:shadow-xl"
          >
            Book Free Assessment
          </Link>
        </div>
      </section>
    </div>
  );
}
