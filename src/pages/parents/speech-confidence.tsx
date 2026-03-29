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

    <div className="mt-4 rounded-lg bg-red-50 p-4 border border-red-200">
      <p className="text-sm font-medium text-red-900">
        Speaking confidence grows through small, regular practice in a low-pressure environment. Just 1–2 minutes daily is enough to build fluency and courage.
      </p>
    </div>

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

    <div className="mt-8 flex flex-col gap-3">
      <Link to="/speaking" className="inline-block rounded bg-primary-600 px-6 py-3 text-white font-medium hover:bg-primary-700 transition">
        Explore Public Speaking Classes →
      </Link>
      <Link to="/?book=1" className="text-primary-600 text-sm font-medium hover:underline">
        Book a free speaking assessment
      </Link>
    </div>

    <div className="mt-10 border-t pt-8">
      <h3 className="text-lg font-semibold text-gray-900">Daily speaking routines</h3>
      <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-gray-700">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-primary-600 flex-shrink-0"></span>
          <span><strong>Make it fun:</strong> Use silly voices, role play, or favorite characters. Speaking should feel like a game, not homework.</span>
        </div>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-primary-600 flex-shrink-0"></span>
          <span><strong>Model fluency first:</strong> You speak your answer first—show them confidence is just expressing yourself, not perfection.</span>
        </div>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-primary-600 flex-shrink-0"></span>
          <span><strong>Celebrate courage:</strong> Focus on effort: "You were so brave to try that!" works better than pointing out grammar mistakes.</span>
        </div>
      </div>
    </div>
  </article>
);

}

export default SpeechConfidence;
