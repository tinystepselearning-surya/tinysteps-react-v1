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
      <p className="mt-3 text-gray-700">Short guides to help parents start classes, choose courses and support learning at home.</p>

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
