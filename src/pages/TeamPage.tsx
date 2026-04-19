import { useEffect } from 'react';
import { applySeo, getRouteConfig } from '../lib/seo';
import { CORE_PROGRAMS_TEXT, ORGANIZATION_ID, PUBLIC_FACTS, SITE_ORIGIN, organizationSchema } from '../lib/schemas';
import { Link } from 'react-router-dom';

const teamSeo = getRouteConfig('/team');
const teamSeoTitle = teamSeo?.title ?? 'Meet the Founder-Led Academic Team | Tiny Steps Learning';
const teamSeoDescription =
  teamSeo?.description ??
  'Get to know the founder-led academic team behind Tiny Steps Learning and how teaching quality is shaped across core programs.';
const teamCanonicalPath = teamSeo?.canonicalPath ?? '/team';

export default function TeamPage() {
  useEffect(() => {
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
        }
      ]
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h1 className="font-heading text-4xl font-bold leading-tight md:text-5xl">
          Meet the Team
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-700">
          Tiny Steps is a founder-led academic team serving learners in India and globally through live online classes.
          We build clear, child-friendly pathways in {CORE_PROGRAMS_TEXT} so families can see steady progress.
        </p>
      </section>

      {/* Teaching Approach Section */}
      <section className="bg-gradient-to-r from-tiny-blue-50 to-tiny-purple-50 py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="mb-8 text-center text-3xl font-bold">Our Teaching Approach</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold">Systematic Curriculum</h3>
              <p className="text-gray-600">
                Structured Phonics, Grammar, and Public Speaking programs with clear milestones and mastery checks at every level.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold">Child-First Philosophy</h3>
              <p className="text-gray-600">
                We celebrate effort over perfection, build confidence before fluency, and adapt to each child's unique pace and learning style.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold">Progress Tracking</h3>
              <p className="text-gray-600">
                Stage-based parent updates, topic-level mastery bands, and clear next-step guidance so you always know where your child stands.
              </p>
            </div>
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

      {/* CTA Section */}
      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h2 className="mb-4 text-3xl font-bold">Ready to Get Started?</h2>
        <p className="mx-auto mb-8 max-w-2xl text-gray-700">
          Book a free assessment class and discover how our expert mentors can help your child build confidence in English.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/courses"
            className="inline-block rounded-2xl bg-gradient-to-r from-tiny-blue-600 to-tiny-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:shadow-xl"
          >
            View Courses
          </Link>
          <Link
            to="/pricing"
            className="inline-block rounded-2xl border-2 border-gray-300 bg-white px-8 py-4 text-lg font-semibold text-gray-700 transition hover:border-gray-400"
          >
            See Pricing
          </Link>
          <Link
            to="/contact"
            className="inline-block rounded-2xl border-2 border-gray-300 bg-white px-8 py-4 text-lg font-semibold text-gray-700 transition hover:border-gray-400"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </div>
  );
}
