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

    <p className="mt-4">We send weekly updates and milestone reports. Use the parent dashboard for details.</p>
    <p className="mt-2 text-sm text-gray-700">Short progress notes help focus next steps.</p>

    <h2 className="mt-6 font-semibold">Step-by-step</h2>
    <ul className="list-disc ml-6 mt-2">
      <li>Open the parent dashboard to view session notes and goals.</li>
      <li>Ask for a short milestone summary after 4–6 weeks.</li>
      <li>Use small weekly targets at home to reinforce learning.</li>
    </ul>

    <h3 className="mt-4 font-semibold">Common mistakes</h3>
    <ul className="list-disc ml-6 mt-2">
      <li>Expecting overnight change — learning is steady and small.</li>
      <li>Not celebrating small wins which harms motivation.</li>
    </ul>

    <div className="mt-6">
      <Link to="/parent" className="inline-block rounded bg-primary-600 px-4 py-2 text-white">Open dashboard</Link>
      <Link to="/curriculum" className="ml-3 text-primary-600">See curriculum</Link>
    </div>
  </article>
);

}

export default TrackingProgress;
