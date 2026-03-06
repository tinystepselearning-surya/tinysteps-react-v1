import React, { useState } from 'react';
import Meta from '../components/common/Meta';
import Modal from '@/common/Modal';
import { PUBLIC_CONTACT_EMAIL, PUBLIC_CONTACT_MAILTO } from '../constants/publicContact';

const ForSchoolsPage: React.FC = () => {
  const [showSampleSchedule, setShowSampleSchedule] = useState(false);

  return (
    <div className="page-gradient relative overflow-hidden">
      <Meta
        title="Tiny Steps for Schools – Premium 1:1 English Programs for Ages 3–12"
        description="Partner with Tiny Steps to bring IB-aligned phonics, grammar and public speaking programs to your school. 1:1 and small-group English mentoring with AI-guided practice and clear dashboards."
      />

      {/* Hero Section */}
      <section className="text-center py-16 px-6 bg-white">
        <h1 className="text-4xl font-bold mb-4">
          Tiny Steps for Schools & Learning Centres
        </h1>
        <p className="text-lg text-gray-700 mb-4">
          Partner with a premium, international-standard 1:1 English program for ages 3–12. Tiny Steps blends IB-aligned phonics, grammar and public speaking with kind mentors and AI-guided practice, so your students gain real confidence in the classroom and beyond.
        </p>
        <p className="text-sm text-gray-500">
          Ideal for IB, CBSE, ICSE and international schools looking to strengthen English reading, writing and speaking outcomes.
        </p>
      </section>

      {/* Why Partner Section */}
      <section className="py-16 px-6 bg-gray-50">
        <h2 className="text-3xl font-semibold text-center mb-8">
          Why Partner with Tiny Steps
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-xl font-medium mb-2">IB-aligned, school-friendly curriculum</h3>
            <p className="text-gray-700 text-sm">
              Our phonics, grammar and speaking modules are mapped to global standards and can plug into your existing English periods or after-school programs.
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-xl font-medium mb-2">1:1 and small-group models</h3>
            <p className="text-gray-700 text-sm">
              Offer high-touch 1:1 mentoring or focused small groups without stretching your internal teacher capacity. Sessions can run before, during or after school hours.
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-xl font-medium mb-2">Dashboards, reports and parent trust</h3>
            <p className="text-gray-700 text-sm">
              School leaders get clear dashboards for attendance and progress, while parents receive gentle, jargon-free updates that build trust in your institution.
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-xl font-medium mb-2">Dedicated partnership support</h3>
            <p className="text-gray-700 text-sm">
              A dedicated relationship manager coordinates schedules, communication and reporting between the Tiny Steps team and your school.
            </p>
          </div>
        </div>
      </section>

      {/* How Partnership Works Section */}
      <section className="py-16 px-6">
        <h2 className="text-3xl font-semibold text-center mb-8">
          How a Partnership Works
        </h2>
        <div className="grid gap-6 md:grid-cols-4">
          <div className="text-center">
            <h3 className="text-xl font-medium mb-2">Discovery call</h3>
            <p className="text-gray-700 text-sm">
              We understand your school’s context, board, timetable and current English outcomes.
            </p>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-medium mb-2">Pilot with selected students</h3>
            <p className="text-gray-700 text-sm">
              We start with a small group or grade, run a 4–8 week pilot and share clear before/after observations.
            </p>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-medium mb-2">Scale across classes or grades</h3>
            <p className="text-gray-700 text-sm">
              Based on results, we expand to more students with predictable schedules and reporting.
            </p>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-medium mb-2">Ongoing improvement</h3>
            <p className="text-gray-700 text-sm">
              We refine the curriculum mix, share insights with English HODs, and keep parents informed.
            </p>
          </div>
        </div>
      </section>

      {/* Partnership Models Section */}
      <section className="py-16 px-6 bg-gray-50">
        <h2 className="text-3xl font-semibold text-center mb-8">
          Partnership Models
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-xl font-medium mb-2">After-school English clubs</h3>
            <p className="text-gray-700 text-sm">
              Offer Tiny Steps as a premium after-school add-on for interested parents.
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-xl font-medium mb-2">In-school English lab</h3>
            <p className="text-gray-700 text-sm">
              Run Tiny Steps sessions during designated English lab/reading periods with school support.
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-xl font-medium mb-2">Holiday or exam-bridge programs</h3>
            <p className="text-gray-700 text-sm">
              Use Tiny Steps intensives to support exam years or bridge language gaps during vacations.
            </p>
          </div>
        </div>
      </section>

      {/* Your Child’s Learning Journey Section */}
      <section className="py-16 px-6">
        <h2 className="text-3xl font-semibold text-center mb-8">
          Your Child’s Learning Journey
        </h2>
        <p className="text-lg text-gray-700 mb-4">
          At Tiny Steps, we tailor the learning journey to each child's needs, ensuring a balanced focus on phonics, grammar, and speaking skills.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Our program is designed to be flexible, fun, and effective, fitting seamlessly into your school's existing framework.
        </p>
        <button
          type="button"
          className="mt-3 text-sm font-medium text-primary underline"
          onClick={() => setShowSampleSchedule(true)}
        >
          View a sample lesson schedule
        </button>
      </section>

      <Modal
        isOpen={showSampleSchedule}
        onClose={() => setShowSampleSchedule(false)}
        title="Sample Weekly Schedule"
        size="md"
      >
        {/* Replace this placeholder content later with the real schedule */}
        <p className="text-sm text-muted-foreground mb-2">
          Here’s an example of how Weeks 2–8 might look for most children.
        </p>
        <ul className="list-disc pl-5 space-y-1 text-sm text-foreground">
          <li>Mon – Phonics & reading practice</li>
          <li>Wed – Grammar & writing focus</li>
          <li>Fri – Speaking & confidence activities</li>
        </ul>
      </Modal>

      {/* Call-to-Action Section */}
      <section className="py-16 px-6 bg-primary-500 text-white text-center">
        <h2 className="text-3xl font-semibold mb-4">
          Ready to explore Tiny Steps for your school?
        </h2>
        <p className="text-lg mb-6">
          Share a few details about your school and we’ll schedule a short call to explore the right model for you.
        </p>
        <a
          href={`${PUBLIC_CONTACT_MAILTO}?subject=School%20Partnership%20Inquiry`}
          className="inline-block bg-white text-primary-500 font-medium px-6 py-3 rounded-lg shadow-md hover:bg-gray-100"
        >
          Discuss a school partnership with {PUBLIC_CONTACT_EMAIL}
        </a>
      </section>
    </div>
  );
};

export default ForSchoolsPage;
