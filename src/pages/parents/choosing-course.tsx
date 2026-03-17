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

    <div className="mt-4 rounded-lg bg-blue-50 p-4 border border-blue-200">
      <p className="text-sm font-medium text-blue-900">
        The right course depends on your child's current skill level, not just age. Our free 35-minute assessment identifies the perfect fit and learning pace.
      </p>
    </div>

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

    <div className="mt-8 flex flex-col gap-3">
      <Link to="/courses" className="inline-block rounded bg-primary-600 px-6 py-3 text-white font-medium hover:bg-primary-700 transition">
        Browse Our Courses →
      </Link>
      <Link to="/?book=1" className="text-primary-600 text-sm font-medium hover:underline">
        Book your free assessment class
      </Link>
    </div>

    <div className="mt-10 border-t pt-8">
      <h3 className="text-lg font-semibold text-gray-900">Next steps</h3>
      <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-gray-700">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-primary-600 flex-shrink-0"></span>
          <span><strong>Book a free assessment:</strong> 35 minutes with a trained teacher to identify the right level.</span>
        </div>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-primary-600 flex-shrink-0"></span>
          <span><strong>Get personalized recommendations:</strong> We'll suggest the best course and pace for your child.</span>
        </div>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-primary-600 flex-shrink-0"></span>
          <span><strong>Start your child's journey:</strong> Enroll and begin building reading, writing, or speaking skills.</span>
        </div>
      </div>
    </div>
  </article>
);

}

export default ChoosingCourse;
