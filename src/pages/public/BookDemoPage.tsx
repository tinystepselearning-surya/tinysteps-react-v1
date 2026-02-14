import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import { organizationSchema } from '../../lib/schemas';

export default function BookDemoPage() {
  useEffect(() => {
    applySeo({
      title: 'Book Free Assessment Class | Tiny Steps Learning',
      description: 'Book a free 1:1 assessment class for your child (ages 3-12). Discover their English level and get a personalized learning plan. Live online classes with expert mentors. No credit card required.',
      canonicalPath: '/book-demo',
      ogType: 'website',
      jsonLd: [
        organizationSchema,
        {
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: 'Free Assessment Class',
          description: 'Free 1:1 English assessment for kids ages 3-12',
          provider: {
            '@type': 'EducationalOrganization',
            name: 'Tiny Steps Learning',
          },
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'INR',
          },
        },
      ],
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h1 className="font-heading text-4xl font-bold leading-tight md:text-5xl">
          Book Your Free Assessment Class
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-700">
          Discover your child's English level and get a personalized learning plan. 
          Our expert mentors will assess reading, speaking, and comprehension in a 
          fun, pressure-free 1:1 session.
        </p>

        {/* CTA Card */}
        <div className="mx-auto mt-12 max-w-md rounded-3xl border border-gray-200 bg-white p-8 shadow-lg">
          <div className="mb-6">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-tiny-blue-600 to-tiny-purple-600">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold">Start Your Journey</h2>
            <p className="mt-2 text-gray-600">
              Book your free assessment on our home page
            </p>
          </div>

          <Link
            to="/#book-trial"
            className="block w-full rounded-2xl bg-gradient-to-r from-tiny-blue-600 to-tiny-purple-600 py-4 text-center text-lg font-semibold text-white shadow-lg transition hover:shadow-xl"
          >
            Book Free Assessment Now
          </Link>

          <div className="mt-6 space-y-2 text-sm text-gray-600">
            <div className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>1:1 with expert mentor</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Personalized learning plan</span>
            </div>
          </div>
        </div>
      </section>

      {/* What to Expect Section */}
      <section className="mx-auto max-w-4xl px-6 py-12">
        <h2 className="mb-8 text-center text-3xl font-bold">What to Expect</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <span className="text-2xl font-bold text-blue-600">1</span>
            </div>
            <h3 className="mb-2 text-lg font-semibold">Quick Chat</h3>
            <p className="text-gray-600">
              Our mentor will introduce themselves and chat with your child to build rapport.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
              <span className="text-2xl font-bold text-purple-600">2</span>
            </div>
            <h3 className="mb-2 text-lg font-semibold">Fun Assessment</h3>
            <p className="text-gray-600">
              Age-appropriate activities to check reading, speaking, and comprehension skills.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <span className="text-2xl font-bold text-green-600">3</span>
            </div>
            <h3 className="mb-2 text-lg font-semibold">Get Your Plan</h3>
            <p className="text-gray-600">
              Receive a personalized learning roadmap and course recommendation.
            </p>
          </div>
        </div>
      </section>

      {/* Why Tiny Steps Section */}
      <section className="bg-gradient-to-r from-tiny-blue-50 to-tiny-purple-50 py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="mb-8 text-center text-3xl font-bold">Why Parents Choose Tiny Steps</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Expert Mentors</h3>
                <p className="text-gray-700">Kind, trained teachers who make learning fun</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">1:1 Personalized</h3>
                <p className="text-gray-700">Every lesson tailored to your child's pace</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">IB-Aligned Curriculum</h3>
                <p className="text-gray-700">Structured phonics, grammar & speaking programs</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">AI-Guided Practice</h3>
                <p className="text-gray-700">Smart games and activities between classes</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Simple Progress Updates</h3>
                <p className="text-gray-700">Weekly reports show exactly what your child learned</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Worldwide Families</h3>
                <p className="text-gray-700">Trusted by families across 15+ countries</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h2 className="mb-4 text-3xl font-bold">Ready to Get Started?</h2>
        <p className="mx-auto mb-8 max-w-2xl text-gray-700">
          Book your free assessment class today. No commitment required.
        </p>
        <Link
          to="/#book-trial"
          className="inline-block rounded-2xl bg-gradient-to-r from-tiny-blue-600 to-tiny-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:shadow-xl"
        >
          Book Free Assessment Now
        </Link>
      </section>
    </div>
  );
}
