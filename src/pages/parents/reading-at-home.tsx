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

    <div className="mt-4 rounded-lg bg-orange-50 p-4 border border-orange-200">
      <p className="text-sm font-medium text-orange-900">
        Daily reading builds fluency and confidence. A 10–15 minute routine using decodable texts works best for ages 3–9. Make it warm, not a test.
      </p>
    </div>

    <p className="mt-4">Read together daily for 10–15 minutes using decodable texts and short questions.</p>
    <p className="mt-2 text-sm text-gray-700">Make reading warm and conversational, not a quiz.</p>

    <h2 className="mt-6 font-semibold">Step-by-step</h2>
    <ul className="list-disc ml-6 mt-2">
      <li>Choose a short decodable book or paragraph.</li>
      <li>Read aloud together; pause to discuss two quick questions.</li>
      <li>Celebrate one thing they did well.</li>
    </ul>

    <h2 className="mt-6 font-semibold">10-minute reading routine parents can follow daily</h2>
    <ul className="list-disc ml-6 mt-2">
      <li>2 minutes: revise 3 target words from yesterday.</li>
      <li>4 minutes: child reads one short decodable passage.</li>
      <li>2 minutes: ask two meaning questions (Who? What happened?).</li>
      <li>2 minutes: read the same lines again for fluency and confidence.</li>
    </ul>

    <h2 className="mt-6 font-semibold">What to read at each stage</h2>
    <ul className="list-disc ml-6 mt-2">
      <li><strong>Beginner:</strong> CVC lines like "Pat sat."</li>
      <li><strong>Early reader:</strong> short passages with one target pattern (for example magic-e or bossy-R).</li>
      <li><strong>Growing reader:</strong> short stories with 3-question comprehension checks.</li>
    </ul>

    <h3 className="mt-4 font-semibold">Common mistakes</h3>
    <ul className="list-disc ml-6 mt-2">
      <li>Stopping at every word — instead, prompt and keep flow.</li>
      <li>Using long texts that tire younger readers quickly.</li>
    </ul>

    <div className="mt-8 flex flex-col gap-3">
      <Link to="/curriculum" className="inline-block rounded bg-primary-600 px-6 py-3 text-white font-medium hover:bg-primary-700 transition">
        View Decodable Reading Path →
      </Link>
      <Link to="/parents/phonics-mission" className="text-primary-600 text-sm font-medium hover:underline">
        Combine with daily phonics practice
      </Link>
    </div>

    <div className="mt-10 border-t pt-8">
      <h3 className="text-lg font-semibold text-gray-900">Tips for success</h3>
      <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-gray-700">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-primary-600 flex-shrink-0"></span>
          <span><strong>Pick the right level:</strong> Books should use sounds your child has already learned in Tiny Steps lessons.</span>
        </div>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-primary-600 flex-shrink-0"></span>
          <span><strong>Ask open questions:</strong> Instead of "What's the main idea?" ask "What happens next?" or "How does the character feel?"</span>
        </div>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-primary-600 flex-shrink-0"></span>
          <span><strong>Celebrate small wins:</strong> Point out specific strengths: "You blended that word so smoothly!" builds intrinsic motivation.</span>
        </div>
      </div>
    </div>

    <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-base font-semibold text-gray-900">Question bank (copy and use)</h3>
      <ul className="mt-2 list-disc ml-6 text-sm text-gray-700">
        <li>"Who is this about?"</li>
        <li>"What happened first?"</li>
        <li>"Which word tells us where?"</li>
        <li>"How do you think the character feels?"</li>
      </ul>
    </div>
  </article>
);

}

export default ReadingAtHome;
