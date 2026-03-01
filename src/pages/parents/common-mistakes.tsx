import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import parentsMeta from '../../content/parentsMeta';

const CommonMistakes: React.FC = () => {
  useEffect(() => {
    applySeo(parentsMeta['/parents/common-mistakes']);
  }, []);

  return (
  <article className="mx-auto max-w-3xl px-6 py-8">
    <h1 className="text-2xl font-bold">Common mistakes parents make</h1>

    <div className="mt-4 rounded-lg bg-yellow-50 p-4 border border-yellow-200">
      <p className="text-sm font-medium text-yellow-900">
        Learning progresses best when parents focus on effort and consistency, not perfection or speed. Small, steady wins compound over weeks and months.
      </p>
    </div>

    <p className="mt-4">Parents often push too fast or compare progress—focus on steady, small wins.</p>
    <p className="mt-2 text-sm text-gray-700">A supportive, calm routine helps learning stick.</p>

    <h2 className="mt-6 font-semibold">Step-by-step</h2>
    <ul className="list-disc ml-6 mt-2">
      <li>Set one small lesson target with the teacher.</li>
      <li>Create a 5‑minute daily routine to support that target.</li>
      <li>Review progress every two weeks and adjust goals.</li>
    </ul>

    <h3 className="mt-4 font-semibold">Common mistakes</h3>
    <ul className="list-disc ml-6 mt-2">
      <li>Comparing with other children.</li>
      <li>Expecting too-large gains too fast.</li>
      <li>Turning practice into testing rather than play.</li>
    </ul>

    <div className="mt-8 flex flex-col gap-3">
      <Link to="/parents/getting-started" className="inline-block rounded bg-primary-600 px-6 py-3 text-white font-medium hover:bg-primary-700 transition">
        Get Started Correctly →
      </Link>
      <Link to="/parents/phonics-mission" className="text-primary-600 text-sm font-medium hover:underline">
        See our 5-minute daily practice routine
      </Link>
    </div>

    <div className="mt-10 border-t pt-8">
      <h3 className="text-lg font-semibold text-gray-900">What truly matters</h3>
      <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-gray-700">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-primary-600 flex-shrink-0"></span>
          <span><strong>Consistency over intensity:</strong> Regular classes + 5-minute daily practice beats cramming and intense sessions.</span>
        </div>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-primary-600 flex-shrink-0"></span>
          <span><strong>Track your own child:</strong> Each child has their own pace. Your child's progress this month vs. last month matters—not comparison to peers.</span>
        </div>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-primary-600 flex-shrink-0"></span>
          <span><strong>Celebrate effort:</strong> "You focused so hard!" and "You tried a tricky word!" reinforce learning better than grades ever could.</span>
        </div>
      </div>
    </div>
  </article>
);

}

export default CommonMistakes;
