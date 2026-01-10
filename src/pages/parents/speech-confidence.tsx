import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import parentsMeta from '../../content/parentsMeta';

const SpeechConfidence: React.FC = () => {
  useEffect(() => {
    applySeo(parentsMeta['/parents/speech-confidence']);
  }, []);

  return (
  <article className="mx-auto max-w-3xl px-6 py-8">
    <h1 className="text-2xl font-bold">Building speaking confidence</h1>

    <p className="mt-4">Short, regular speaking tasks build confidence: 1–2 minute daily prompts work best.</p>
    <p className="mt-2 text-sm text-gray-700">Start small and celebrate progress.</p>

    <h2 className="mt-6 font-semibold">Step-by-step</h2>
    <ul className="list-disc ml-6 mt-2">
      <li>Give a 60‑second prompt (favourite animal, weekend plan).</li>
      <li>Model a short answer, then have your child repeat.</li>
      <li>Offer gentle praise and one tip for next time.</li>
    </ul>

    <h3 className="mt-4 font-semibold">Common mistakes</h3>
    <ul className="list-disc ml-6 mt-2">
      <li>Correcting every word instead of encouraging fluency.</li>
      <li>Making speaking feel like a performance rather than practice.</li>
    </ul>

    <div className="mt-6">
      <Link to="/blog" className="inline-block rounded bg-primary-600 px-4 py-2 text-white">Speaking tips</Link>
      <Link to="/courses" className="ml-3 text-primary-600">Explore speaking course</Link>
    </div>
  </article>
);

}

export default SpeechConfidence;
