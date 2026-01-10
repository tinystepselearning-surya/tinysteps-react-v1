import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import parentsMeta from '../../content/parentsMeta';

const HelpingWithHomework: React.FC = () => {
  useEffect(() => {
    applySeo(parentsMeta['/parents/helping-with-homework']);
  }, []);

  return (
  <article className="mx-auto max-w-3xl px-6 py-8">
    <h1 className="text-2xl font-bold">Helping with homework</h1>

    <p className="mt-4">Keep practice short and playful: 5–10 minutes of focused work after class is most effective.</p>
    <p className="mt-2 text-sm text-gray-700">Consistency beats duration for young learners.</p>

    <h2 className="mt-6 font-semibold">Step-by-step</h2>
    <ul className="list-disc ml-6 mt-2">
      <li>Review the teacher's short goal for the week.</li>
      <li>Do a 5‑minute practice together using prompts from the lesson.</li>
      <li>Praise effort and note one target for next time.</li>
    </ul>

    <h3 className="mt-4 font-semibold">Common mistakes</h3>
    <ul className="list-disc ml-6 mt-2">
      <li>Turning practice into a test — avoid pressure.</li>
      <li>Over-correcting every mistake instead of highlighting one focus.</li>
    </ul>

    <div className="mt-6">
      <Link to="/blog" className="inline-block rounded bg-primary-600 px-4 py-2 text-white">Read practice tips</Link>
      <Link to="/faq" className="ml-3 text-primary-600">Homework FAQ</Link>
    </div>
  </article>
);

}

export default HelpingWithHomework;
