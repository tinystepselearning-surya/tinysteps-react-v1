import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import { createHowToSchema } from '../../lib/schemas';
import parentsMeta from '../../content/parentsMeta';

const PhonicsMission: React.FC = () => {
  useEffect(() => {
    const howToSchema = createHowToSchema(
      'Daily Phonics Practice Mission for Parents',
      [
        'Say the target sound together (2 times)',
        'Blend the sounds into one short word (3 times)',
        'Read a decodable sentence with that word',
        'Review yesterday\'s 3 words (Minute 1-2)',
        'Teach 2 new words with tap-and-blend (Minute 3-6)',
        'Read one short sentence using those words (Minute 7-8)',
        'Quick dictation of one word + celebration (Minute 9-10)'
      ]
    );

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
        { '@type': 'ListItem', position: 2, name: 'Parents Hub', item: 'https://tinystepslearning.com/parents' },
        { '@type': 'ListItem', position: 3, name: 'Phonics Mission', item: 'https://tinystepslearning.com/parents/phonics-mission' }
      ]
    };

    const metaWithSchema = {
      ...parentsMeta['/parents/phonics-mission'],
      jsonLd: [howToSchema, breadcrumbSchema]
    };

    applySeo(metaWithSchema);
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

    <h2 className="mt-6 font-semibold">Use this by level (exact examples)</h2>
    <ul className="list-disc ml-6 mt-2">
      <li><strong>SATPIN stage:</strong> /s/ /a/ /t/ -&gt; sat, /p/ /i/ /n/ -&gt; pin, /t/ /a/ /p/ -&gt; tap.</li>
      <li><strong>CVC stage:</strong> cat, map, sit, pin, top. Read then spell 2 of these words.</li>
      <li><strong>Bossy-R stage:</strong> car, star, fork, bird, turn. Read one AR, one OR, one ER/IR/UR word daily.</li>
      <li><strong>Sentence stage:</strong> "Pat sat." "The car is red." "The bird can turn."</li>
    </ul>

    <h2 className="mt-6 font-semibold">10-minute parent mission plan</h2>
    <ul className="list-disc ml-6 mt-2">
      <li>Minute 1-2: review yesterday's 3 words.</li>
      <li>Minute 3-6: teach 2 new words with tap-and-blend.</li>
      <li>Minute 7-8: read one short sentence using those words.</li>
      <li>Minute 9-10: quick dictation of one word + celebration.</li>
    </ul>

    <h3 className="mt-4 font-semibold">Common mistakes</h3>
    <ul className="list-disc ml-6 mt-2">
      <li>Rushing through sounds — keep clear pronunciation.</li>
      <li>Moving to new sounds before the current one is steady.</li>
    </ul>

    <div className="mt-8 flex flex-col gap-3">
      <Link to="/phonics" className="inline-block rounded bg-primary-600 px-6 py-3 text-white font-medium hover:bg-primary-700 transition">
        Explore Phonics Classes →
      </Link>
      <Link to="/?book=1" className="text-primary-600 text-sm font-medium hover:underline">
        Book a free phonics assessment
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

    <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-base font-semibold text-gray-900">Parent script bank</h3>
      <ul className="mt-2 list-disc ml-6 text-sm text-gray-700">
        <li>"Show me each sound first, then blend it."</li>
        <li>"Try it slowly, now say it fast."</li>
        <li>"Great retry. You fixed that word yourself."</li>
      </ul>
    </div>
  </article>
);

}

export default PhonicsMission;
