import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import parentsMeta from '../../content/parentsMeta';

const ParentsHubPage: React.FC = () => {
  useEffect(() => {
    applySeo(parentsMeta['/parents']);
  }, []);
  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-bold">Parents Hub — Quick Help & Answers</h1>
      <p className="mt-3 text-gray-700">
        Practical parent playbooks for ages 3–12: what to do this week, how long to practise each day, what to say when your child gets stuck, and how to track real progress at home.
      </p>

      <div className="mt-6 rounded-lg border border-primary-100 bg-primary-50/40 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-700">Start Here First</h2>
        <ul className="mt-3 list-disc pl-5 text-sm text-gray-700">
          <li>Ages 3–6 and beginner readers: start with <Link to="/parents/getting-started" className="text-primary-600">Getting started</Link> and <Link to="/parents/phonics-mission" className="text-primary-600">Phonics mission</Link>.</li>
          <li>If reading is inconsistent: use <Link to="/parents/reading-at-home" className="text-primary-600">Reading at home</Link> for a 10-minute daily routine.</li>
          <li>If homework feels stressful: open <Link to="/parents/helping-with-homework" className="text-primary-600">Helping with homework</Link>.</li>
          <li>If progress feels slow: review <Link to="/parents/tracking-progress" className="text-primary-600">Tracking progress</Link> and <Link to="/parents/common-mistakes" className="text-primary-600">Common mistakes</Link>.</li>
        </ul>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-base font-semibold text-gray-900">10-minute parent routine (works for most children)</h2>
        <ul className="mt-3 list-disc pl-5 text-sm text-gray-700">
          <li>2 minutes: sound or word review from the latest class.</li>
          <li>4 minutes: blend/read 5 words (3 old + 2 new).</li>
          <li>2 minutes: one short sentence read aloud.</li>
          <li>2 minutes: praise + one note for tomorrow.</li>
        </ul>
      </div>

      <div className="mt-6 grid gap-3">
        <Link to="/parents/getting-started" className="text-primary-600">Getting started — first steps</Link>
        <Link to="/parents/choosing-course" className="text-primary-600">Choosing a course</Link>
        <Link to="/parents/scheduling" className="text-primary-600">Scheduling & attendance</Link>
        <Link to="/parents/payments" className="text-primary-600">Payments & invoices</Link>
        <Link to="/parents/tracking-progress" className="text-primary-600">Track your child's progress</Link>
        <Link to="/parents/helping-with-homework" className="text-primary-600">Helping with homework</Link>
        <Link to="/parents/phonics-mission" className="text-primary-600">Phonics mission (quick practice)</Link>
        <Link to="/parents/reading-at-home" className="text-primary-600">Reading at home</Link>
        <Link to="/parents/speech-confidence" className="text-primary-600">Speaking & confidence</Link>
        <Link to="/parents/common-mistakes" className="text-primary-600">Common mistakes parents make</Link>
      </div>

      <div className="mt-8 text-sm text-gray-600">
        <p>Related: <Link to="/courses" className="text-primary-600">Courses</Link> • <Link to="/curriculum" className="text-primary-600">Curriculum</Link> • <Link to="/faq" className="text-primary-600">FAQ</Link></p>
      </div>
    </div>
  );
};

export default ParentsHubPage;
