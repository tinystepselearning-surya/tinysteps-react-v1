import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import parentsMeta from '../../content/parentsMeta';

const GettingStarted: React.FC = () => {
  useEffect(() => {
    applySeo(parentsMeta['/parents/getting-started']);
  }, []);

  return (
    <article className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-bold">Getting started with Tiny Steps</h1>

      <div className="mt-4 rounded-lg bg-green-50 p-4 border border-green-200">
        <p className="text-sm font-medium text-green-900">
          Every child starts with a free 35-minute assessment. We evaluate reading, letter-sound knowledge, and speaking confidence to recommend the perfect learning path.
        </p>
      </div>

      <p className="mt-4">Start with one free assessment class. Book a 35‑minute trial so we can recommend the right level.</p>
      <p className="mt-2 text-sm text-gray-700">We assess reading, letter-sound knowledge and speaking confidence quickly.</p>

      <h2 className="mt-6 font-semibold">Step-by-step</h2>
      <ul className="list-disc ml-6 mt-2">
        <li>Book a free assessment via the <Link to="/courses" className="text-primary-600">Courses</Link> page.</li>
        <li>Attend the 35‑minute assessment with your child.</li>
        <li>Receive a recommended course and curriculum link.</li>
      </ul>

      <h3 className="mt-4 font-semibold">Common mistakes</h3>
      <ul className="list-disc ml-6 mt-2">
        <li>Waiting too long to assess — early help is faster.</li>
        <li>Comparing to other children instead of tracking progress.</li>
      </ul>

      <div className="mt-8 flex flex-col gap-3">
        <Link to="/courses" className="inline-block rounded bg-primary-600 px-6 py-3 text-white font-medium hover:bg-primary-700 transition">
          Book Your Free Assessment →
        </Link>
        <Link to="/parents/choosing-course" className="text-primary-600 text-sm font-medium hover:underline">
          Not sure which course? See course comparison
        </Link>
      </div>

      <div className="mt-10 border-t pt-8">
        <h3 className="text-lg font-semibold text-gray-900">Why start with an assessment?</h3>
        <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-gray-700">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-primary-600 flex-shrink-0"></span>
            <span><strong>Personalized plan:</strong> Teachers identify current level and learning pace to match your child's unique needs.</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-primary-600 flex-shrink-0"></span>
            <span><strong>No pressure:</strong> Completely free—no obligation to enroll. Use results to make an informed choice.</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-primary-600 flex-shrink-0"></span>
            <span><strong>Quick feedback:</strong> Receive recommendations and curriculum details within 12 hours.</span>
          </div>
        </div>
      </div>
    </article>
  );
};

export default GettingStarted;
