// @ts-nocheck
import React, { useEffect, useMemo } from 'react';
import Meta from '../components/common/Meta';
import { catalogs } from '../content/courses';

const PER_SESSION = 550;

const parseWeeks = (duration: string) => {
  const match = duration.match(/(\d+)(?:[–-](\d+))?/);
  if (!match) return { min: 0, max: 0 };
  const min = parseInt(match[1], 10);
  const max = match[2] ? parseInt(match[2], 10) : min;
  return { min, max };
};

const parseClassesPerWeek = (frequency: string) => {
  const match = frequency.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 2;
};

const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;

const PricingPage: React.FC = () => {
  useEffect(() => { document.title = 'Pricing | Tiny Steps'; }, []);

  const coursePricing = useMemo(() => catalogs.map((course) => {
    const weeks = parseWeeks(course.duration);
    const classesPerWeek = parseClassesPerWeek(course.frequency);
    const minSessions = weeks.min * classesPerWeek;
    const maxSessions = weeks.max * classesPerWeek;
    const minFee = minSessions * PER_SESSION;
    const maxFee = maxSessions * PER_SESSION;
    return { course, weeks, classesPerWeek, minSessions, maxSessions, minFee, maxFee };
  }), []);

  const offerCatalog = {
    '@context': 'https://schema.org',
    '@type': 'OfferCatalog',
    name: 'Tiny Steps Course Pricing',
    itemListElement: coursePricing.map((entry, index) => ({
      '@type': 'Offer',
      position: index + 1,
      itemOffered: {
        '@type': 'Course',
        name: entry.course.name,
        description: entry.course.overview.join(', ')
      },
      price: `${entry.minFee}`,
      priceCurrency: 'INR'
    }))
  };

  return (
    <div className="page-gradient min-h-screen">
      <Meta title="Pricing | Tiny Steps Online School" description="Transparent ₹550 per session pricing. See total investment for every course before you enroll." canonical="https://tinystepslearning.com/pricing" jsonLd={offerCatalog} />
      <section className="relative px-6 pt-24 pb-10">
        <div className="mx-auto max-w-5xl glass-panel px-8 py-10 text-center">
          <div className="gradient-chip mx-auto w-max">₹550 per live session</div>
          <h1 className="mt-3 text-3xl font-bold text-gray-900 md:text-4xl">Pricing that mirrors your child’s curriculum</h1>
          <p className="mt-3 text-gray-700">Every course lists classes/week × weeks = total sessions. Multiply by ₹550 and you know the full investment upfront.</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="overflow-x-auto rounded-3xl bg-white shadow-card-hover border border-gray-100">
          <table className="w-full border-collapse text-sm text-gray-700">
            <thead>
              <tr className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Classes / week</th>
                <th className="px-4 py-3">Total sessions</th>
                <th className="px-4 py-3">Total fee (₹550/session)</th>
              </tr>
            </thead>
            <tbody>
              {coursePricing.map(({ course, weeks, classesPerWeek, minSessions, maxSessions, minFee, maxFee }) => (
                <tr key={course.slug} className="border-t border-gray-100">
                  <td className="px-4 py-4">
                    <div className="font-semibold text-gray-900">{course.name}</div>
                    <div className="text-xs text-gray-500">{course.track.toUpperCase()} • Level: {course.level}</div>
                  </td>
                  <td className="px-4 py-4">{weeks.min === weeks.max ? `${weeks.min} weeks` : `${weeks.min}–${weeks.max} weeks`}</td>
                  <td className="px-4 py-4">{classesPerWeek} per week</td>
                  <td className="px-4 py-4">{minSessions === maxSessions ? minSessions : `${minSessions}–${maxSessions}`}</td>
                  <td className="px-4 py-4 font-semibold text-gray-900">
                    {minFee === maxFee ? formatCurrency(minFee) : `${formatCurrency(minFee)} – ${formatCurrency(maxFee)}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3 text-sm text-gray-600">
          <div className="glass-panel p-5">
            <div className="font-semibold text-gray-900">What’s included</div>
            <ul className="mt-2 list-disc pl-5">
              <li>Live 1:1 or small-group sessions</li>
              <li>Weekly mastery reports</li>
              <li>Recorded sessions + resources</li>
            </ul>
          </div>
          <div className="glass-panel p-5">
            <div className="font-semibold text-gray-900">Payment options</div>
            <ul className="mt-2 list-disc pl-5">
              <li>UPI, cards, net-banking</li>
              <li>Monthly or full-course billing</li>
              <li>Pause/resume within 48 hours notice</li>
            </ul>
          </div>
          <div className="glass-panel p-5">
            <div className="font-semibold text-gray-900">Need installment plans?</div>
            <p className="mt-2">Chat with us on <a href="https://wa.me/919618398383" className="text-tiny-green-600">WhatsApp</a>. We set up 2-month or 3-month payment splits for most families.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PricingPage;
