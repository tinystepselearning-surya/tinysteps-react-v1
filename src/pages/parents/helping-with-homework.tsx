import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import { createHowToSchema } from '../../lib/schemas';
import parentsMeta from '../../content/parentsMeta';
import AboutAuthor from '../../components/AboutAuthor';

const HelpingWithHomework: React.FC = () => {
  useEffect(() => {
    const howToSchema = createHowToSchema(
      'How to Help Your Child with Homework Effectively',
      [
        'Review the teacher\'s short goal for the week',
        'Do a 5-minute practice together using prompts from the lesson',
        'Praise effort and note one target for next time',
        'Monday: review teacher goal and model one example',
        'Tuesday: child practices same skill with your support',
        'Wednesday: short mixed review (3 old + 2 new items)',
        'Thursday: quick correction day using one focused script',
        'Friday: mini-check and celebration; message teacher with observations'
      ]
    );

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
        { '@type': 'ListItem', position: 2, name: 'Parents Hub', item: 'https://tinystepslearning.com/parents' },
        { '@type': 'ListItem', position: 3, name: 'Helping with Homework', item: 'https://tinystepslearning.com/parents/helping-with-homework' }
      ]
    };

    const metaWithSchema = {
      ...parentsMeta['/parents/helping-with-homework'],
      jsonLd: [howToSchema, breadcrumbSchema]
    };

    applySeo(metaWithSchema);
  }, []);

  return (
  <article className="mx-auto max-w-3xl px-6 py-8">
    <h1 className="text-2xl font-bold">Helping with homework</h1>

    <div className="mt-4 rounded-lg bg-indigo-50 p-4 border border-indigo-200">
      <p className="text-sm font-medium text-indigo-900">
        Quality beats quantity. A focused 5–10 minute practice session daily is more effective than longer, inconsistent sessions. Use the lesson goal your teacher shares.
      </p>
    </div>

    <p className="mt-4">Keep practice short and playful: 5–10 minutes of focused work after class is most effective.</p>
    <p className="mt-2 text-sm text-gray-700">Consistency beats duration for young learners.</p>

    <h2 className="mt-6 font-semibold">Step-by-step</h2>
    <ul className="list-disc ml-6 mt-2">
      <li>Review the teacher's short goal for the week.</li>
      <li>Do a 5‑minute practice together using prompts from the lesson.</li>
      <li>Praise effort and note one target for next time.</li>
    </ul>

    <h2 className="mt-6 font-semibold">Weekly homework support template (Mon-Fri)</h2>
    <ul className="list-disc ml-6 mt-2">
      <li>Monday: review teacher goal and model one example.</li>
      <li>Tuesday: child practices same skill with your support.</li>
      <li>Wednesday: short mixed review (3 old + 2 new items).</li>
      <li>Thursday: quick correction day using one focused script.</li>
      <li>Friday: mini-check and celebration; message teacher with observations.</li>
    </ul>

    <h3 className="mt-4 font-semibold">Common mistakes</h3>
    <ul className="list-disc ml-6 mt-2">
      <li>Turning practice into a test — avoid pressure.</li>
      <li>Over-correcting every mistake instead of highlighting one focus.</li>
    </ul>

    <div className="mt-8 flex flex-col gap-3">
      <Link to="/grammar" className="inline-block rounded bg-primary-600 px-6 py-3 text-white font-medium hover:bg-primary-700 transition">
        Explore Grammar & Writing Classes →
      </Link>
      <Link to="/parents/phonics-mission" className="text-primary-600 text-sm font-medium hover:underline">
        See our 5-minute daily practice routine
      </Link>
    </div>

    <div className="mt-10 border-t pt-8">
      <h3 className="text-lg font-semibold text-gray-900">Creating the right environment</h3>
      <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-gray-700">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-primary-600 flex-shrink-0"></span>
          <span><strong>Set the right tone:</strong> Position yourself as a supportive coach, not a teacher. "Let's practice together" feels safer than "Do this correctly."</span>
        </div>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-primary-600 flex-shrink-0"></span>
          <span><strong>Pick the right time:</strong> Practice when your child is alert and calm—avoid right after school if they're tired.</span>
        </div>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-primary-600 flex-shrink-0"></span>
          <span><strong>Focus on one goal:</strong> Ask the teacher: "What's the one thing I should focus on this week?" Narrow scope builds confidence.</span>
        </div>
      </div>
    </div>

    <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-base font-semibold text-gray-900">Parent language that helps</h3>
      <ul className="mt-2 list-disc ml-6 text-sm text-gray-700">
        <li>"Let us try this together once."</li>
        <li>"Show me how you sounded that word."</li>
        <li>"Good retry. You fixed it with your own effort."</li>
      </ul>
    </div>

    <AboutAuthor className="mt-10" />
  </article>
);

}

export default HelpingWithHomework;
