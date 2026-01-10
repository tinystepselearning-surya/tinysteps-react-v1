import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import parentsMeta from '../../content/parentsMeta';

const Scheduling: React.FC = () => {
  useEffect(() => {
    applySeo(parentsMeta['/parents/scheduling']);
  }, []);

  return (
  <article className="mx-auto max-w-3xl px-6 py-8">
    <h1 className="text-2xl font-bold">Scheduling & attendance</h1>

    <p className="mt-4">Consistent attendance matters—aim for at least one class per week and short daily practice.</p>
    <p className="mt-2 text-sm text-gray-700">We provide flexible slots; notify us for planned absences.</p>

    <h2 className="mt-6 font-semibold">Step-by-step</h2>
    <ul className="list-disc ml-6 mt-2">
      <li>Choose a consistent weekly slot during booking.</li>
      <li>Set a short pre-class routine: 2–3 minutes to warm up.</li>
      <li>Inform support early for rescheduling.</li>
    </ul>

    <h3 className="mt-4 font-semibold">Common mistakes</h3>
    <ul className="list-disc ml-6 mt-2">
      <li>Frequent last-minute cancellations that disrupt progress.</li>
      <li>Skipping short home practice between classes.</li>
    </ul>

    <div className="mt-6">
      <Link to="/courses" className="inline-block rounded bg-primary-600 px-4 py-2 text-white">Manage classes</Link>
      <Link to="/faq" className="ml-3 text-primary-600">Scheduling FAQ</Link>
    </div>
  </article>
);

}

export default Scheduling;
