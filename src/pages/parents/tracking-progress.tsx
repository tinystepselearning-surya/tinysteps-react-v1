import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import parentsMeta from '../../content/parentsMeta';

const TrackingProgress: React.FC = () => {
  useEffect(() => {
    applySeo(parentsMeta['/parents/tracking-progress']);
  }, []);

  return (
  <article className="mx-auto max-w-3xl px-6 py-8">
    <h1 className="text-2xl font-bold">Track your child's progress</h1>

    <div className="mt-4 rounded-lg bg-pink-50 p-4 border border-pink-200">
      <p className="text-sm font-medium text-pink-900">
        Visible progress keeps both kids and parents motivated. Stage-based updates, milestone reports, and dashboard insights show exactly where your child stands and what comes next.
      </p>
    </div>

    <p className="mt-4">We send stage-based updates and milestone reports so parents can understand what changed and what to reinforce next.</p>
    <p className="mt-2 text-sm text-gray-700">Short progress notes help focus next steps.</p>

    <h2 className="mt-6 font-semibold">Step-by-step</h2>
    <ul className="list-disc ml-6 mt-2">
      <li>Ask for session notes and current goals after each milestone check.</li>
      <li>Ask for a short milestone summary after 8–12 lessons.</li>
      <li>Use small lesson targets at home to reinforce learning.</li>
    </ul>

    <h3 className="mt-4 font-semibold">Common mistakes</h3>
    <ul className="list-disc ml-6 mt-2">
      <li>Expecting overnight change — learning is steady and small.</li>
      <li>Not celebrating small wins which harms motivation.</li>
    </ul>

    <div className="mt-8 flex flex-col gap-3">
      <Link to="/contact" className="inline-block rounded bg-primary-600 px-6 py-3 text-white font-medium hover:bg-primary-700 transition">
        Ask for a progress update →
      </Link>
      <Link to="/parents/helping-with-homework" className="text-primary-600 text-sm font-medium hover:underline">
        Learn how to support progress at home
      </Link>
    </div>

    <div className="mt-10 border-t pt-8">
      <h3 className="text-lg font-semibold text-gray-900">What to look for</h3>
      <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-gray-700">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-primary-600 flex-shrink-0"></span>
          <span><strong>Lesson notes:</strong> After each lesson, teachers document what was learned, what went well, and one focus area for next time.</span>
        </div>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-primary-600 flex-shrink-0"></span>
          <span><strong>Milestone summaries:</strong> After 8–12 lessons, request a brief summary showing mastered skills and next learning goals.</span>
        </div>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-primary-600 flex-shrink-0"></span>
          <span><strong>Benchmark checks:</strong> We assess phonics fluency, letter-sound mastery, and comprehension at natural intervals, not just grades.</span>
        </div>
      </div>
    </div>
  </article>
);

}

export default TrackingProgress;
