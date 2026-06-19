import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import parentsMeta from '../../content/parentsMeta';
import AboutAuthor from '../../components/AboutAuthor';

const Scheduling: React.FC = () => {
  useEffect(() => {
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
        { '@type': 'ListItem', position: 2, name: 'Parents Hub', item: 'https://tinystepslearning.com/parents' },
        { '@type': 'ListItem', position: 3, name: 'Scheduling', item: 'https://tinystepslearning.com/parents/scheduling' },
      ],
    };

    applySeo({
      ...parentsMeta['/parents/scheduling'],
      jsonLd: [parentsMeta['/parents/scheduling'].jsonLd, breadcrumbSchema],
    });
  }, []);

  return (
  <article className="mx-auto max-w-3xl px-6 py-8">
    <h1 className="text-2xl font-bold">Scheduling & attendance</h1>

    <div className="mt-4 rounded-lg bg-cyan-50 p-4 border border-cyan-200">
      <p className="text-sm font-medium text-cyan-900">
        Steady attendance (one class per week + daily practice) builds momentum. We offer flexible slots and make-up options for planned absences.
      </p>
    </div>

    <p className="mt-4">Consistent attendance matters—aim for at least one class per week and short daily practice.</p>
    <p className="mt-2 text-sm text-gray-700">We provide flexible slots; notify us for planned absences.</p>

    <h2 className="mt-6 font-semibold">Step-by-step</h2>
    <ul className="list-disc ml-6 mt-2">
      <li>Choose a consistent class slot during booking.</li>
      <li>Set a short pre-class routine: 2–3 minutes to warm up.</li>
      <li>Inform support early for rescheduling.</li>
    </ul>

    <h3 className="mt-4 font-semibold">Common mistakes</h3>
    <ul className="list-disc ml-6 mt-2">
      <li>Frequent last-minute cancellations that disrupt progress.</li>
      <li>Skipping short home practice between classes.</li>
    </ul>

    <div className="mt-8 flex flex-col gap-3">
      <Link to="/book-demo" className="inline-block rounded bg-primary-600 px-6 py-3 text-white font-medium hover:bg-primary-700 transition">
        Book Free Assessment →
      </Link>
      <div className="flex flex-wrap gap-3 text-sm">
        <Link to="/parents/phonics-mission" className="text-primary-600 font-medium hover:underline">
          Set up daily practice routines between classes
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
      <h3 className="text-lg font-semibold text-gray-900">Tips for consistency</h3>
      <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-gray-700">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-primary-600 flex-shrink-0"></span>
          <span><strong>Choose a recurring slot:</strong> Pick the same day and time each week. Your child's body clock and teacher's prep schedule both benefit from predictability.</span>
        </div>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-primary-600 flex-shrink-0"></span>
          <span><strong>Pre-class warm-up:</strong> 2–3 minutes before class, do a quick phonics review. Fresh recall helps your child engage faster in lessons.</span>
        </div>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-primary-600 flex-shrink-0"></span>
          <span><strong>Notify early for changes:</strong> Message support 48 hours before planned absences when possible. This helps teachers adjust pacing and notes.</span>
        </div>
      </div>
    </div>

    <AboutAuthor className="mt-10" />
  </article>
);

}

export default Scheduling;
