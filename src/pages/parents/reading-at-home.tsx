import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import parentsMeta from '../../content/parentsMeta';

const ReadingAtHome: React.FC = () => {
  useEffect(() => {
    applySeo(parentsMeta['/parents/reading-at-home']);
  }, []);

  return (
  <article className="mx-auto max-w-3xl px-6 py-8">
    <h1 className="text-2xl font-bold">Reading at home — simple routines</h1>

    <p className="mt-4">Read together daily for 10–15 minutes using decodable texts and short questions.</p>
    <p className="mt-2 text-sm text-gray-700">Make reading warm and conversational, not a quiz.</p>

    <h2 className="mt-6 font-semibold">Step-by-step</h2>
    <ul className="list-disc ml-6 mt-2">
      <li>Choose a short decodable book or paragraph.</li>
      <li>Read aloud together; pause to discuss two quick questions.</li>
      <li>Celebrate one thing they did well.</li>
    </ul>

    <h3 className="mt-4 font-semibold">Common mistakes</h3>
    <ul className="list-disc ml-6 mt-2">
      <li>Stopping at every word — instead, prompt and keep flow.</li>
      <li>Using long texts that tire younger readers quickly.</li>
    </ul>

    <div className="mt-6">
      <Link to="/blog" className="inline-block rounded bg-primary-600 px-4 py-2 text-white">Reading tips</Link>
      <Link to="/curriculum" className="ml-3 text-primary-600">See curriculum</Link>
    </div>
  </article>
);

}

export default ReadingAtHome;
