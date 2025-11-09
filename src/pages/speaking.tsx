import React from 'react';
import Layout from '@components/Layout';
import CourseTopbar from '@components/CourseTopbar';

export default function SpeakingPage() {
  return (
    <Layout>
      <CourseTopbar title="Public Speaking & Confidence" subtitle="Build confidence, articulation and presence through guided practice and feedback." />
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-extrabold mb-6">Public Speaking Studio</h1>
          <p className="text-lg text-gray-700 mb-6">Build confidence, clarity, and stage presence with short, focused practice sessions.</p>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow">
              <h3 className="text-2xl font-semibold mb-2">Early Speaker</h3>
              <p className="text-sm text-gray-600 mb-3">Simple talks, show-and-tell, and storytelling to build comfort on camera.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow">
              <h3 className="text-2xl font-semibold mb-2">Confident Speaker</h3>
              <p className="text-sm text-gray-600 mb-3">Structure, delivery drills, impromptu topics, and voice modulation.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow">
              <h3 className="text-2xl font-semibold mb-2">Superstar Speaker</h3>
              <p className="text-sm text-gray-600 mb-3">Debates, persuasive speech, and recording practice for performance readiness.</p>
            </div>
          </div>

          <div className="mt-8">
            <a href="#book-trial" className="inline-block rounded-xl bg-blue-600 text-white px-6 py-3">Book a Free Trial</a>
          </div>
        </div>
      </section>
    </Layout>
  );
}
