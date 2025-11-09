import React from 'react';
import Layout from '@components/Layout';
import CourseTopbar from '@components/CourseTopbar';

export default function PhonicsPage() {
  return (
    <Layout>
      <CourseTopbar title="Phonics Foundations" subtitle="Systematic, multi-sensory lessons to build decoding and fluent reading." />
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow">
              <h3 className="text-2xl font-semibold mb-2">Early Phonics</h3>
              <p className="text-sm text-gray-600 mb-3">SATPIN order, letter–sound mapping, and easy practice routines.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow">
              <h3 className="text-2xl font-semibold mb-2">Advanced Phonics</h3>
              <p className="text-sm text-gray-600 mb-3">Digraphs, vowel teams, silent-e, and spelling rules for confident readers.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow">
              <h3 className="text-2xl font-semibold mb-2">Fluency & Comprehension</h3>
              <p className="text-sm text-gray-600 mb-3">Timed reading, expression, and question sets to boost comprehension.</p>
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
