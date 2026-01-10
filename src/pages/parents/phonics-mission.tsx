import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import parentsMeta from '../../content/parentsMeta';

const PhonicsMission: React.FC = () => {
  useEffect(() => {
    applySeo(parentsMeta['/parents/phonics-mission']);
  }, []);

  return (
  <article className="mx-auto max-w-3xl px-6 py-8">
    <h1 className="text-2xl font-bold">Phonics mission — quick daily practice</h1>

    <p className="mt-4">A 5‑minute phonics mission: sound → blend → read a short word.</p>
    <p className="mt-2 text-sm text-gray-700">Short, daily repetition builds decoding and confidence.</p>

    <h2 className="mt-6 font-semibold">Step-by-step</h2>
    <ul className="list-disc ml-6 mt-2">
      <li>Say the target sound together (2 times).</li>
      <li>Blend the sounds into one short word (3 times).</li>
      <li>Read a decodable sentence with that word.</li>
    </ul>

    <h3 className="mt-4 font-semibold">Common mistakes</h3>
    <ul className="list-disc ml-6 mt-2">
      <li>Rushing through sounds — keep clear pronunciation.</li>
      <li>Moving to new sounds before the current one is steady.</li>
    </ul>

    <div className="mt-6">
      <Link to="/phonics" className="inline-block rounded bg-primary-600 px-4 py-2 text-white">Try phonics course</Link>
      <Link to="/kids/games/phonics/letter-sound" className="ml-3 text-primary-600">Open phonics mission</Link>
    </div>
  </article>
);

}

export default PhonicsMission;
