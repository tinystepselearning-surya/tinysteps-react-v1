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

      <div className="mt-6">
        <Link to="/courses" className="inline-block rounded bg-primary-600 px-4 py-2 text-white">Browse courses</Link>
        <Link to="/curriculum" className="ml-3 text-primary-600">View curriculum</Link>
      </div>
    </article>
  );
};

export default GettingStarted;
