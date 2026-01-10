import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import parentsMeta from '../../content/parentsMeta';

const ChoosingCourse: React.FC = () => {
  useEffect(() => {
    applySeo(parentsMeta['/parents/choosing-course']);
  }, []);

  return (
  <article className="mx-auto max-w-3xl px-6 py-8">
    <h1 className="text-2xl font-bold">How to choose a course</h1>

    <p className="mt-4">Pick the course that matches your child's current need: phonics, grammar or speaking.</p>
    <p className="mt-2 text-sm text-gray-700">A short assessment helps match level and pace.</p>

    <h2 className="mt-6 font-semibold">Step-by-step</h2>
    <ul className="list-disc ml-6 mt-2">
      <li>Complete a free assessment.</li>
      <li>Choose phonics for foundational reading; grammar for writing; speaking for confidence.</li>
      <li>Discuss schedule and teacher preferences.</li>
    </ul>

    <h3 className="mt-4 font-semibold">Common mistakes</h3>
    <ul className="list-disc ml-6 mt-2">
      <li>Starting a course that skips foundational phonics.</li>
      <li>Choosing level by age rather than ability.</li>
    </ul>

    <div className="mt-6">
      <Link to="/courses" className="inline-block rounded bg-primary-600 px-4 py-2 text-white">See courses</Link>
      <Link to="/faq" className="ml-3 text-primary-600">Read FAQ</Link>
    </div>
  </article>
);

}

export default ChoosingCourse;
