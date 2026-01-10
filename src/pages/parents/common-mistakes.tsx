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

    <p className="mt-4">Parents often push too fast or compare progress—focus on steady, small wins.</p>
    <p className="mt-2 text-sm text-gray-700">A supportive, calm routine helps learning stick.</p>

    <h2 className="mt-6 font-semibold">Step-by-step</h2>
    <ul className="list-disc ml-6 mt-2">
      <li>Set one small weekly target with the teacher.</li>
      <li>Create a 5‑minute daily routine to support that target.</li>
      <li>Review progress every two weeks and adjust goals.</li>
    </ul>

    <h3 className="mt-4 font-semibold">Common mistakes</h3>
    <ul className="list-disc ml-6 mt-2">
      <li>Comparing with other children.</li>
      <li>Expecting too-large gains too fast.</li>
      <li>Turning practice into testing rather than play.</li>
    </ul>

    <div className="mt-6">
      <Link to="/parents/getting-started" className="inline-block rounded bg-primary-600 px-4 py-2 text-white">Getting started</Link>
      <Link to="/faq" className="ml-3 text-primary-600">FAQ</Link>
    </div>
  </article>
);

}

export default CommonMistakes;
