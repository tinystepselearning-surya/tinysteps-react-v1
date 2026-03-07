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

    <div className="mt-4 rounded-lg bg-purple-50 p-4 border border-purple-200">
      <p className="text-sm font-medium text-purple-900">
        Just 5 minutes a day builds strong letter-sound knowledge and blending confidence. Use this simple three-step routine alongside Tiny Steps lessons.
      </p>
    </div>

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

    <div className="mt-8 flex flex-col gap-3">
      <Link to="/phonics-classes-for-kids" className="inline-block rounded bg-primary-600 px-6 py-3 text-white font-medium hover:bg-primary-700 transition">
        Explore phonics classes →
      </Link>
      <Link to="/courses" className="text-primary-600 text-sm font-medium hover:underline">
        Ready to take a phonics course? Book your free assessment
      </Link>
    </div>

    <div className="mt-10 border-t pt-8">
      <h3 className="text-lg font-semibold text-gray-900">Make it stick</h3>
      <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-gray-700">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-primary-600 flex-shrink-0"></span>
          <span><strong>Best time:</strong> After your child's Tiny Steps lesson while new sounds are fresh in memory.</span>
        </div>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-primary-600 flex-shrink-0"></span>
          <span><strong>Keep it fun:</strong> Praise effort, not just accuracy. A light, playful tone builds confidence faster.</span>
        </div>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-primary-600 flex-shrink-0"></span>
          <span><strong>Track progress:</strong> Note which sounds stick and which need extra reps. Share notes with your child's teacher.</span>
        </div>
      </div>
    </div>
  </article>
);

}

export default PhonicsMission;
