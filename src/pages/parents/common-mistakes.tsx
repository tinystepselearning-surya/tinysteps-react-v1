import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import parentsMeta from '../../content/parentsMeta';
import AboutAuthor from '../../components/AboutAuthor';

const CommonMistakes: React.FC = () => {
  useEffect(() => {
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
        { '@type': 'ListItem', position: 2, name: 'Parents Hub', item: 'https://tinystepslearning.com/parents' },
        { '@type': 'ListItem', position: 3, name: 'Common Mistakes', item: 'https://tinystepslearning.com/parents/common-mistakes' },
      ],
    };

    applySeo({
      ...parentsMeta['/parents/common-mistakes'],
      jsonLd: [parentsMeta['/parents/common-mistakes'].jsonLd, breadcrumbSchema],
    });
  }, []);

  return (
  <article className="mx-auto max-w-3xl px-6 py-8">
    <h1 className="text-2xl font-bold">Common mistakes parents make</h1>

    <div className="mt-4 rounded-lg bg-yellow-50 p-4 border border-yellow-200">
      <p className="text-sm font-medium text-yellow-900">
        Learning progresses best when parents focus on effort and consistency, not perfection or speed. Small, steady wins compound over weeks and months.
      </p>
    </div>

    <p className="mt-4">Parents often push too fast or compare progress—focus on steady, small wins.</p>
    <p className="mt-2 text-sm text-gray-700">A supportive, calm routine helps learning stick.</p>

    <h2 className="mt-6 font-semibold">Step-by-step</h2>
    <ul className="list-disc ml-6 mt-2">
      <li>Set one small lesson target with the teacher.</li>
      <li>Create a 5‑minute daily routine to support that target.</li>
      <li>Review progress every two weeks and adjust goals.</li>
    </ul>

    <h3 className="mt-4 font-semibold">Common mistakes</h3>
    <ul className="list-disc ml-6 mt-2">
      <li>Comparing with other children.</li>
      <li>Expecting too-large gains too fast.</li>
      <li>Turning practice into testing rather than play.</li>
    </ul>

    <h2 className="mt-6 font-semibold">What to do instead (practical replacements)</h2>
    <ul className="list-disc ml-6 mt-2">
      <li>Replace "Read faster" with "Let us read this line clearly once more."</li>
      <li>Replace long worksheets with a 10-minute sound -&gt; blend -&gt; sentence routine.</li>
      <li>Replace daily new content with a 3 review + 2 new word rule.</li>
      <li>Replace "wrong" with "good try, let us check the sounds together."</li>
    </ul>

    <h2 className="mt-6 font-semibold">Warning signs to act on early</h2>
    <ul className="list-disc ml-6 mt-2">
      <li>Child guesses most words from pictures without sounding out.</li>
      <li>Child avoids reading sessions for more than two weeks.</li>
      <li>The same 4-5 sound confusions continue despite regular practice.</li>
      <li>Homework time is mostly conflict instead of guided support.</li>
    </ul>

    <div className="mt-8 flex flex-col gap-3">
      <Link to="/parents/getting-started" className="inline-block rounded bg-primary-600 px-6 py-3 text-white font-medium hover:bg-primary-700 transition">
        Get Started Correctly →
      </Link>
      <div className="flex flex-wrap gap-3 text-sm">
        <Link to="/parents/phonics-mission" className="text-primary-600 font-medium hover:underline">
          See our 5-minute daily practice routine
        </Link>
        <Link to="/courses/phonics-foundation" className="text-primary-600 font-medium hover:underline">
          Phonics Foundation
        </Link>
        <Link to="/courses/grammar" className="text-primary-600 font-medium hover:underline">
          Beginner Grammar
        </Link>
        <Link to="/courses/public-speaking-foundations" className="text-primary-600 font-medium hover:underline">
          Speaking Foundations
        </Link>
      </div>
    </div>

    <div className="mt-10 border-t pt-8">
      <h3 className="text-lg font-semibold text-gray-900">What truly matters</h3>
      <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-gray-700">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-primary-600 flex-shrink-0"></span>
          <span><strong>Consistency over intensity:</strong> Regular classes + 5-minute daily practice beats cramming and intense sessions.</span>
        </div>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-primary-600 flex-shrink-0"></span>
          <span><strong>Track your own child:</strong> Each child has their own pace. Your child's progress this month vs. last month matters—not comparison to peers.</span>
        </div>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-primary-600 flex-shrink-0"></span>
          <span><strong>Celebrate effort:</strong> "You focused so hard!" and "You tried a tricky word!" reinforce learning better than grades ever could.</span>
        </div>
      </div>
    </div>

    <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-base font-semibold text-gray-900">2-week reset plan (if learning feels stuck)</h3>
      <ul className="mt-2 list-disc ml-6 text-sm text-gray-700">
        <li>Week 1: reduce load and rebuild confidence with easy decodable words.</li>
        <li>Week 2: reintroduce one new target while keeping daily review.</li>
        <li>End each day with one sentence your child can read successfully.</li>
      </ul>
    </div>

    <AboutAuthor className="mt-10" />
  </article>
);

}

export default CommonMistakes;
